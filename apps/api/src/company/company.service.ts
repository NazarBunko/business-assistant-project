import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, SalaryPaymentType } from '@repo/database';
import { DatabaseService } from '../database/database.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { PoolClient } from 'pg';

@Injectable()
export class CompanyService {
  constructor(private readonly db: DatabaseService) {}

  async getEmployees(companyId: string) {
    return this.db.query(
      `SELECT id, "fullName", email, phone, role, "jobTitle", "monthlySalary",
              "includeInAutoPay", "lastSalaryPaidAt"
       FROM "User" WHERE "companyId" = $1 ORDER BY "createdAt" ASC`,
      [companyId],
    );
  }

  async updateEmployee(
    companyId: string,
    userId: string,
    requesterRole: string,
    dto: {
      jobTitle?: string;
      monthlySalary?: number | null;
      includeInAutoPay?: boolean;
    },
  ) {
    if (
      requesterRole !== UserRole.OWNER &&
      requesterRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only owner or admin can update employees');
    }

    const user = await this.db.queryOne<{ companyId: string | null }>(
      `SELECT "companyId" FROM "User" WHERE id = $1`,
      [userId],
    );
    if (!user || user.companyId !== companyId) {
      throw new NotFoundException('Employee not found');
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (dto.jobTitle !== undefined) {
      fields.push(`"jobTitle" = $${i++}`);
      values.push(dto.jobTitle);
    }
    if (dto.monthlySalary !== undefined) {
      fields.push(`"monthlySalary" = $${i++}`);
      values.push(dto.monthlySalary);
    }
    if (dto.includeInAutoPay !== undefined) {
      fields.push(`"includeInAutoPay" = $${i++}`);
      values.push(dto.includeInAutoPay);
    }

    if (fields.length === 0) {
      const existing = await this.getEmployees(companyId);
      return existing.find((e: { id: string }) => e.id === userId);
    }

    values.push(userId);
    const rows = await this.db.query(
      `UPDATE "User" SET ${fields.join(', ')} WHERE id = $${i}
       RETURNING id, "fullName", email, phone, role, "jobTitle", "monthlySalary",
                 "includeInAutoPay", "lastSalaryPaidAt"`,
      values,
    );
    return rows[0];
  }

  async paySalaryToEmployee(
    companyId: string,
    userId: string,
    requesterRole: string,
  ) {
    if (
      requesterRole !== UserRole.OWNER &&
      requesterRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only owner or admin can pay salary');
    }

    const user = await this.db.queryOne<{
      companyId: string | null;
      fullName: string;
      monthlySalary: number | null;
    }>(
      `SELECT "companyId", "fullName", "monthlySalary" FROM "User" WHERE id = $1`,
      [userId],
    );

    if (!user || user.companyId !== companyId) {
      throw new NotFoundException('Employee not found');
    }
    if (user.monthlySalary == null || user.monthlySalary <= 0) {
      throw new ForbiddenException('Employee has no salary set');
    }

    const amount = user.monthlySalary;
    const category = 'Зарплата';
    const description = `Зарплата - ${user.fullName}`;

    await this.db.transaction(async (client) => {
      const transactionId = await this.createExpenseTransaction(
        client,
        companyId,
        amount,
        category,
        description,
      );
      const spId = this.db.newId();
      await client.query(
        `INSERT INTO "SalaryPayment" (id, amount, type, "userId", "transactionId", "companyId")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          spId,
          amount,
          SalaryPaymentType.SALARY,
          userId,
          transactionId,
          companyId,
        ],
      );
      await client.query(
        `UPDATE "Company" SET balance = balance - $1 WHERE id = $2`,
        [amount, companyId],
      );
      await client.query(
        `UPDATE "User" SET "lastSalaryPaidAt" = $1 WHERE id = $2`,
        [new Date(), userId],
      );
    });

    return { success: true };
  }

  async payBonusToEmployee(
    companyId: string,
    userId: string,
    requesterRole: string,
    amount: number,
  ) {
    if (
      requesterRole !== UserRole.OWNER &&
      requesterRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only owner or admin can pay bonus');
    }
    if (amount <= 0) {
      throw new ForbiddenException('Bonus amount must be positive');
    }

    const user = await this.db.queryOne<{
      companyId: string | null;
      fullName: string;
    }>(`SELECT "companyId", "fullName" FROM "User" WHERE id = $1`, [userId]);

    if (!user || user.companyId !== companyId) {
      throw new NotFoundException('Employee not found');
    }

    const category = 'Премія';
    const description = `Премія - ${user.fullName}`;

    await this.db.transaction(async (client) => {
      const transactionId = await this.createExpenseTransaction(
        client,
        companyId,
        amount,
        category,
        description,
      );
      const spId = this.db.newId();
      await client.query(
        `INSERT INTO "SalaryPayment" (id, amount, type, "userId", "transactionId", "companyId")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          spId,
          amount,
          SalaryPaymentType.BONUS,
          userId,
          transactionId,
          companyId,
        ],
      );
      await client.query(
        `UPDATE "Company" SET balance = balance - $1 WHERE id = $2`,
        [amount, companyId],
      );
    });

    return { success: true };
  }

  async getSalaryHistory(companyId: string, userId: string) {
    const user = await this.db.queryOne<{ companyId: string | null }>(
      `SELECT "companyId" FROM "User" WHERE id = $1`,
      [userId],
    );
    if (!user || user.companyId !== companyId) {
      throw new NotFoundException('Employee not found');
    }

    return this.db.query(
      `SELECT * FROM "SalaryPayment"
       WHERE "userId" = $1 AND "companyId" = $2
       ORDER BY "paidAt" DESC LIMIT 100`,
      [userId, companyId],
    );
  }

  async getSalarySummary(companyId: string) {
    const row = await this.db.queryOne<{ total: string | null }>(
      `SELECT SUM("monthlySalary")::text AS total FROM "User"
       WHERE "companyId" = $1 AND "monthlySalary" IS NOT NULL AND "monthlySalary" > 0`,
      [companyId],
    );
    return { totalMonthlySalary: parseFloat(row?.total ?? '0') || 0 };
  }

  async removeEmployee(
    companyId: string,
    userId: string,
    requesterRole: string,
  ) {
    if (
      requesterRole !== UserRole.OWNER &&
      requesterRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only owner or admin can remove employees');
    }

    const user = await this.db.queryOne<{
      companyId: string | null;
      role: string;
    }>(`SELECT "companyId", role FROM "User" WHERE id = $1`, [userId]);

    if (!user || user.companyId !== companyId) {
      throw new NotFoundException('Employee not found');
    }
    if (user.role === UserRole.OWNER) {
      throw new ForbiddenException('Cannot remove company owner');
    }

    await this.db.query(
      `UPDATE "User" SET "companyId" = NULL WHERE id = $1`,
      [userId],
    );
    return { success: true };
  }

  async findOne(id: string) {
    const company = await this.db.queryOne(`SELECT * FROM "Company" WHERE id = $1`, [
      id,
    ]);
    if (!company) return null;

    const users = await this.db.query(
      `SELECT id, "fullName", email, role FROM "User" WHERE "companyId" = $1`,
      [id],
    );

    return { ...company, users };
  }

  async updateSettings(id: string, dto: UpdateCompanySettingsDto) {
    const rows = await this.db.query(
      `UPDATE "Company"
       SET "revenueFrequency" = $1, "taxGroup" = $2, "rentAmount" = $3, "utilitiesAmount" = $4
       WHERE id = $5 RETURNING *`,
      [
        dto.revenueFrequency,
        dto.taxGroup,
        dto.rentAmount,
        dto.utilitiesAmount,
        id,
      ],
    );
    return rows[0];
  }

  async regenerateInviteCode(id: string) {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = Math.floor(10000000 + Math.random() * 90000000).toString();
      const existing = await this.db.queryOne(
        `SELECT id FROM "Company" WHERE "inviteCode" = $1`,
        [code],
      );
      if (!existing) isUnique = true;
    }

    const rows = await this.db.query(
      `UPDATE "Company" SET "inviteCode" = $1 WHERE id = $2 RETURNING *`,
      [code!, id],
    );
    return rows[0];
  }

  private static readonly ESV_PER_MONTH_2026 = 1902.34;

  private getTaxRate(taxGroup: string): number {
    switch (taxGroup) {
      case 'FOP_3_5PERCENT':
        return 0.06;
      case 'FOP_3_3PERCENT':
        return 0.04;
      case 'FOP_1':
        return 0.1;
      case 'FOP_2':
        return 0.2;
      case 'GENERAL':
      default:
        return 0.18;
    }
  }

  private isFop3(taxGroup: string): boolean {
    return taxGroup === 'FOP_3_5PERCENT' || taxGroup === 'FOP_3_3PERCENT';
  }

  async getTaxAvailableMonths(companyId: string) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const result = await this.db.query<{ date: Date }>(
      `SELECT date FROM "Transaction"
       WHERE "companyId" = $1 AND "isArchived" = false
       ORDER BY date ASC`,
      [companyId],
    );

    const set = new Set<string>();
    for (const r of result) {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key !== currentMonth) set.add(key);
    }
    return Array.from(set).sort();
  }

  async calculateTax(companyId: string, dto: { months: string[] }) {
    if (!dto.months || dto.months.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        taxAmount: 0,
        taxRate: 0,
        periodLabel: '',
      };
    }

    const sorted = [...dto.months].sort();
    const [first] = sorted;
    const last = sorted[sorted.length - 1];
    const [startYear, startMonth] = first.split('-').map(Number);
    const [endYear, endMonth] = last.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, 1);
    const end = new Date(endYear, endMonth, 0, 23, 59, 59, 999);

    const company = await this.db.queryOne<{ taxGroup: string }>(
      `SELECT "taxGroup" FROM "Company" WHERE id = $1`,
      [companyId],
    );
    if (!company) return null;

    const [incomeRow, expenseRow] = await Promise.all([
      this.db.queryOne<{ sum: string | null }>(
        `SELECT SUM(amount)::text AS sum FROM "Transaction"
         WHERE "companyId" = $1 AND type = 'INCOME' AND "isArchived" = false
           AND date >= $2 AND date <= $3`,
        [companyId, start, end],
      ),
      this.db.queryOne<{ sum: string | null }>(
        `SELECT SUM(amount)::text AS sum FROM "Transaction"
         WHERE "companyId" = $1 AND type = 'EXPENSE' AND "isArchived" = false
           AND date >= $2 AND date <= $3`,
        [companyId, start, end],
      ),
    ]);

    const totalIncome = parseFloat(incomeRow?.sum ?? '0') || 0;
    const totalExpenses = parseFloat(expenseRow?.sum ?? '0') || 0;
    const netProfit = Math.max(0, totalIncome - totalExpenses);
    const taxRate = this.getTaxRate(company.taxGroup);
    let taxAmount: number;
    let esvAmount: number | undefined;
    let incomeTaxAmount: number | undefined;

    if (this.isFop3(company.taxGroup)) {
      esvAmount =
        Math.round(
          CompanyService.ESV_PER_MONTH_2026 * sorted.length * 100,
        ) / 100;
      incomeTaxAmount = Math.round(netProfit * taxRate * 100) / 100;
      taxAmount = Math.round((esvAmount + incomeTaxAmount) * 100) / 100;
    } else {
      taxAmount = Math.round(netProfit * taxRate * 100) / 100;
    }

    const monthNames = [
      'січень', 'лютий', 'березень', 'квітень', 'травень', 'червень',
      'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень',
    ];
    const periodLabel =
      sorted.length === 1
        ? `${monthNames[parseInt(first.split('-')[1], 10) - 1]} ${first.split('-')[0]}`
        : `${monthNames[startMonth - 1]} ${startYear} – ${monthNames[endMonth - 1]} ${endYear}`;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      taxAmount,
      taxRate: taxRate * 100,
      taxGroup: company.taxGroup,
      periodLabel,
      months: sorted,
      ...(esvAmount != null && { esvAmount }),
      ...(incomeTaxAmount != null && { incomeTaxAmount }),
    };
  }

  async payTax(
    companyId: string,
    dto: { amount: number; periodLabel: string; months: string[] },
  ) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (dto.months.some((m) => m === currentMonth)) {
      throw new ForbiddenException('Cannot pay tax for current month');
    }

    await this.db.transaction(async (client) => {
      const transactionId = this.db.newId();
      await client.query(
        `INSERT INTO "Transaction" (id, amount, type, category, description, "companyId")
         VALUES ($1, $2, 'EXPENSE', 'Податки', $3, $4)`,
        [
          transactionId,
          dto.amount,
          `Єдиний податок (${dto.periodLabel})`,
          companyId,
        ],
      );
      await client.query(
        `UPDATE "Company" SET balance = balance - $1 WHERE id = $2`,
        [dto.amount, companyId],
      );
    });

    return { success: true };
  }

  private async createExpenseTransaction(
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
