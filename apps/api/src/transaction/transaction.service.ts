import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { SalaryPaymentType } from '@repo/database';
import { PoolClient } from 'pg';

@Injectable()
export class TransactionService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(companyId: string, page: number, isArchived: boolean = false) {
    const take = 20;
    const skip = (page - 1) * take;

    const [data, countRow] = await Promise.all([
      this.db.query(
        `SELECT * FROM "Transaction"
         WHERE "companyId" = $1 AND "isArchived" = $2
         ORDER BY date DESC
         LIMIT $3 OFFSET $4`,
        [companyId, isArchived, take, skip],
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM "Transaction"
         WHERE "companyId" = $1 AND "isArchived" = $2`,
        [companyId, isArchived],
      ),
    ]);

    const total = parseInt(countRow?.count ?? '0', 10);
    return { data, total, totalPages: Math.ceil(total / take) };
  }

  async create(companyId: string, dto: CreateTransactionDto) {
    return this.db.transaction(async (client) => {
      const id = this.db.newId();
      const date = dto.date ? new Date(dto.date) : new Date();

      const rows = await this.db.query(
        `INSERT INTO "Transaction" (id, amount, type, category, description, date, "companyId")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          id,
          dto.amount,
          dto.type,
          dto.category,
          dto.description ?? null,
          date,
          companyId,
        ],
        client,
      );

      const delta = dto.type === 'INCOME' ? dto.amount : -dto.amount;
      await client.query(
        `UPDATE "Company" SET balance = balance + $1 WHERE id = $2`,
        [delta, companyId],
      );

      return rows[0];
    });
  }

  async archiveMany(companyId: string, ids: string[]) {
    const result = await this.db.query(
      `UPDATE "Transaction" SET "isArchived" = true
       WHERE id = ANY($1::text[]) AND "companyId" = $2`,
      [ids, companyId],
    );
    return { count: result.length };
  }

  async deleteOne(companyId: string, transactionId: string) {
    const transaction = await this.db.queryOne<{
      id: string;
      companyId: string;
      type: string;
      amount: number;
    }>(
      `SELECT id, "companyId", type, amount FROM "Transaction" WHERE id = $1`,
      [transactionId],
    );

    if (!transaction || transaction.companyId !== companyId) {
      throw new NotFoundException('Transaction not found');
    }

    const salaryLink = await this.db.queryOne(
      `SELECT id FROM "SalaryPayment" WHERE "transactionId" = $1`,
      [transactionId],
    );

    if (salaryLink) {
      throw new ForbiddenException(
        'Cannot delete salary or bonus payment. Use employees section to manage.',
      );
    }

    await this.db.transaction(async (client) => {
      await client.query(`DELETE FROM "Transaction" WHERE id = $1`, [
        transactionId,
      ]);
      const delta =
        transaction.type === 'INCOME'
          ? -transaction.amount
          : transaction.amount;
      await client.query(
        `UPDATE "Company" SET balance = balance + $1 WHERE id = $2`,
        [delta, companyId],
      );
    });

    return { success: true };
  }

  async generateMonthlyExpenses(companyId: string) {
    const company = await this.db.queryOne<{
      rentAmount: number;
      utilitiesAmount: number;
    }>(`SELECT "rentAmount", "utilitiesAmount" FROM "Company" WHERE id = $1`, [
      companyId,
    ]);
    if (!company) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const salaryEmployees = await this.db.query<{
      id: string;
      fullName: string;
      monthlySalary: number;
    }>(
      `SELECT id, "fullName", "monthlySalary" FROM "User"
       WHERE "companyId" = $1
         AND "includeInAutoPay" = true
         AND "monthlySalary" IS NOT NULL AND "monthlySalary" > 0
         AND ("lastSalaryPaidAt" IS NULL OR "lastSalaryPaidAt" < $2)`,
      [companyId, startOfMonth],
    );

    const bulkTransactions: Array<{
      amount: number;
      type: 'EXPENSE';
      category: string;
      description: string;
    }> = [];
    let totalExpense = 0;

    if (company.rentAmount > 0) {
      bulkTransactions.push({
        amount: company.rentAmount,
        type: 'EXPENSE',
        category: 'Оренда',
        description: 'Автоматичний платіж за оренду',
      });
      totalExpense += company.rentAmount;
    }

    if (company.utilitiesAmount > 0) {
      bulkTransactions.push({
        amount: company.utilitiesAmount,
        type: 'EXPENSE',
        category: 'Комунальні послуги',
        description: 'Автоматичний платіж за комуналку',
      });
      totalExpense += company.utilitiesAmount;
    }

    if (bulkTransactions.length === 0 && salaryEmployees.length === 0) {
      return;
    }

    await this.db.transaction(async (client) => {
      for (const t of bulkTransactions) {
        await this.insertExpense(client, companyId, t.amount, t.category, t.description);
      }

      const now = new Date();
      for (const u of salaryEmployees) {
        const amount = u.monthlySalary;
        const trId = await this.insertExpense(
          client,
          companyId,
          amount,
          'Зарплата',
          `Зарплата - ${u.fullName}`,
        );
        const spId = this.db.newId();
        await client.query(
          `INSERT INTO "SalaryPayment" (id, amount, type, "userId", "transactionId", "companyId")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [spId, amount, SalaryPaymentType.SALARY, u.id, trId, companyId],
        );
        await client.query(
          `UPDATE "User" SET "lastSalaryPaidAt" = $1 WHERE id = $2`,
          [now, u.id],
        );
      }

      if (totalExpense > 0) {
        await client.query(
          `UPDATE "Company" SET balance = balance - $1 WHERE id = $2`,
          [totalExpense, companyId],
        );
      }
    });
  }

  private async insertExpense(
    client: PoolClient,
    companyId: string,
    amount: number,
    category: string,
    description: string,
  ): Promise<string> {
    const id = this.db.newId();
    await client.query(
      `INSERT INTO "Transaction" (id, amount, type, category, description, "companyId")
       VALUES ($1, $2, 'EXPENSE', $3, $4, $5)`,
      [id, amount, category, description, companyId],
    );
    return id;
  }
}
