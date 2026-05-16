import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(private readonly db: DatabaseService) {}

  async create(companyId: string, dto: CreateInvoiceDto) {
    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const taxRate = dto.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const discount = dto.discount || 0;
    const total = subtotal + taxAmount - discount;

    const lastInvoice = await this.db.queryOne<{ invoiceNumber: string }>(
      `SELECT "invoiceNumber" FROM "Invoice"
       WHERE "companyId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      [companyId],
    );

    const invoiceNumber = lastInvoice
      ? `INV-${(parseInt(lastInvoice.invoiceNumber.split('-')[1], 10) + 1).toString().padStart(5, '0')}`
      : 'INV-00001';

    const invoiceId = this.db.newId();

    return this.db.transaction(async (client) => {
      const invoiceRows = await this.db.query(
        `INSERT INTO "Invoice" (
          id, "invoiceNumber", "clientName", "clientEmail", "clientPhone", "clientAddress",
          subtotal, "taxRate", "taxAmount", discount, total, "dueDate", notes, "companyId"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING *`,
        [
          invoiceId,
          invoiceNumber,
          dto.clientName,
          dto.clientEmail ?? null,
          dto.clientPhone ?? null,
          dto.clientAddress ?? null,
          subtotal,
          taxRate,
          taxAmount,
          discount,
          total,
          dto.dueDate ? new Date(dto.dueDate) : null,
          dto.notes ?? null,
          companyId,
        ],
        client,
      );

      const items = [];
      for (const item of dto.items) {
        const itemId = this.db.newId();
        const amount = item.quantity * item.unitPrice;
        const itemRows = await this.db.query(
          `INSERT INTO "InvoiceItem" (id, description, quantity, "unitPrice", amount, "invoiceId")
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            itemId,
            item.description,
            item.quantity,
            item.unitPrice,
            amount,
            invoiceId,
          ],
          client,
        );
        items.push(itemRows[0]);
      }

      return { ...invoiceRows[0], items };
    });
  }

  async findAll(companyId: string, page: number = 1, status?: string) {
    const take = 10;
    const skip = (page - 1) * take;

    const params: unknown[] = [companyId];
    let statusFilter = '';
    if (status) {
      params.push(status);
      statusFilter = ` AND status = $${params.length}`;
    }

    const [invoices, countRow] = await Promise.all([
      this.db.query(
        `SELECT * FROM "Invoice"
         WHERE "companyId" = $1${statusFilter}
         ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, take, skip],
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM "Invoice" WHERE "companyId" = $1${statusFilter}`,
        params,
      ),
    ]);

    const total = parseInt(countRow?.count ?? '0', 10);

    const data = await Promise.all(
      invoices.map(async (inv) => {
        const items = await this.db.query(
          `SELECT * FROM "InvoiceItem" WHERE "invoiceId" = $1`,
          [inv.id],
        );
        return { ...inv, items };
      }),
    );

    return {
      data,
      total,
      totalPages: Math.ceil(total / take),
      currentPage: page,
    };
  }

  async findOne(companyId: string, id: string) {
    const invoice = await this.db.queryOne(`SELECT * FROM "Invoice" WHERE id = $1`, [
      id,
    ]);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.companyId !== companyId) {
      throw new ForbiddenException('Cannot access other company invoices');
    }

    const [items, company] = await Promise.all([
      this.db.query(`SELECT * FROM "InvoiceItem" WHERE "invoiceId" = $1`, [id]),
      this.db.queryOne(`SELECT name FROM "Company" WHERE id = $1`, [
        invoice.companyId,
      ]),
    ]);

    return { ...invoice, items, company };
  }

  async updateStatus(companyId: string, id: string, status: string) {
    const invoice = await this.db.queryOne<{ companyId: string; paidAt: Date | null }>(
      `SELECT "companyId", "paidAt" FROM "Invoice" WHERE id = $1`,
      [id],
    );

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.companyId !== companyId) {
      throw new ForbiddenException('Cannot update other company invoices');
    }

    const paidAt = status === 'PAID' ? new Date() : invoice.paidAt;
    const rows = await this.db.query(
      `UPDATE "Invoice" SET status = $1, "paidAt" = $2 WHERE id = $3 RETURNING *`,
      [status, paidAt, id],
    );

    const items = await this.db.query(
      `SELECT * FROM "InvoiceItem" WHERE "invoiceId" = $1`,
      [id],
    );

    return { ...rows[0], items };
  }

  async delete(companyId: string, id: string) {
    const invoice = await this.db.queryOne<{ companyId: string }>(
      `SELECT "companyId" FROM "Invoice" WHERE id = $1`,
      [id],
    );

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.companyId !== companyId) {
      throw new ForbiddenException('Cannot delete other company invoices');
    }

    await this.db.query(`DELETE FROM "Invoice" WHERE id = $1`, [id]);
    return { message: 'Invoice deleted successfully' };
  }

  async getStats(companyId: string) {
    const counts = await this.db.queryOne<{
      total: string;
      draft: string;
      sent: string;
      paid: string;
      overdue: string;
    }>(
      `SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE status = 'DRAFT')::text AS draft,
        COUNT(*) FILTER (WHERE status = 'SENT')::text AS sent,
        COUNT(*) FILTER (WHERE status = 'PAID')::text AS paid,
        COUNT(*) FILTER (WHERE status = 'OVERDUE')::text AS overdue
       FROM "Invoice" WHERE "companyId" = $1`,
      [companyId],
    );

    const [revenueRow, pendingRow] = await Promise.all([
      this.db.queryOne<{ sum: string | null }>(
        `SELECT SUM(total)::text AS sum FROM "Invoice"
         WHERE "companyId" = $1 AND status = 'PAID'`,
        [companyId],
      ),
      this.db.queryOne<{ sum: string | null }>(
        `SELECT SUM(total)::text AS sum FROM "Invoice"
         WHERE "companyId" = $1 AND status IN ('SENT', 'OVERDUE')`,
        [companyId],
      ),
    ]);

    return {
      total: parseInt(counts?.total ?? '0', 10),
      draft: parseInt(counts?.draft ?? '0', 10),
      sent: parseInt(counts?.sent ?? '0', 10),
      paid: parseInt(counts?.paid ?? '0', 10),
      overdue: parseInt(counts?.overdue ?? '0', 10),
      totalRevenue: parseFloat(revenueRow?.sum ?? '0') || 0,
      pendingAmount: parseFloat(pendingRow?.sum ?? '0') || 0,
    };
  }
}
