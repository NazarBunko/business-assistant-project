import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SalaryPaymentType } from '@prisma/client';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async getEmployees(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        jobTitle: true,
        monthlySalary: true,
        includeInAutoPay: true,
        lastSalaryPaidAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateEmployee(
    companyId: string,
    userId: string,
    requesterRole: string,
    dto: { jobTitle?: string; monthlySalary?: number | null; includeInAutoPay?: boolean },
  ) {
    if (
      requesterRole !== UserRole.OWNER &&
      requesterRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only owner or admin can update employees');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.companyId !== companyId) {
      throw new NotFoundException('Employee not found');
    }
    const data: Record<string, unknown> = {};
    if (dto.jobTitle !== undefined) data.jobTitle = dto.jobTitle;
    if (dto.monthlySalary !== undefined) data.monthlySalary = dto.monthlySalary;
    if (dto.includeInAutoPay !== undefined) data.includeInAutoPay = dto.includeInAutoPay;
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        jobTitle: true,
        monthlySalary: true,
        includeInAutoPay: true,
        lastSalaryPaidAt: true,
      },
    });
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.companyId !== companyId) {
      throw new NotFoundException('Employee not found');
    }
    if (user.monthlySalary == null || user.monthlySalary <= 0) {
      throw new ForbiddenException('Employee has no salary set');
    }
    const category = 'Зарплата';
    const description = `Зарплата - ${user.fullName}`;
    const amount = user.monthlySalary!;
    await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount,
          type: 'EXPENSE',
          category,
          description,
          companyId,
        },
      });
      await tx.salaryPayment.create({
        data: {
          amount,
          type: SalaryPaymentType.SALARY,
          userId,
          transactionId: transaction.id,
          companyId,
        },
      });
      await tx.company.update({
        where: { id: companyId },
        data: { balance: { decrement: amount } },
      });
      await tx.user.update({
        where: { id: userId },
        data: { lastSalaryPaidAt: new Date() },
      });
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.companyId !== companyId) {
      throw new NotFoundException('Employee not found');
    }
    const category = 'Премія';
    const description = `Премія - ${user.fullName}`;
    await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount,
          type: 'EXPENSE',
          category,
          description,
          companyId,
        },
      });
      await tx.salaryPayment.create({
        data: {
          amount,
          type: SalaryPaymentType.BONUS,
          userId,
          transactionId: transaction.id,
          companyId,
        },
      });
      await tx.company.update({
        where: { id: companyId },
        data: { balance: { decrement: amount } },
      });
    });
    return { success: true };
  }

  async getSalaryHistory(companyId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.companyId !== companyId) {
      throw new NotFoundException('Employee not found');
    }
    return this.prisma.salaryPayment.findMany({
      where: { userId, companyId },
      orderBy: { paidAt: 'desc' },
      take: 100,
    });
  }

  async getSalarySummary(companyId: string) {
    const result = await this.prisma.user.aggregate({
      where: {
        companyId,
        monthlySalary: { not: null, gt: 0 },
      },
      _sum: { monthlySalary: true },
    });
    return { totalMonthlySalary: result._sum.monthlySalary ?? 0 };
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.companyId !== companyId) {
      throw new NotFoundException('Employee not found');
    }
    if (user.role === UserRole.OWNER) {
      throw new ForbiddenException('Cannot remove company owner');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { companyId: null },
    });
    return { success: true };
  }

  async findOne(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async updateSettings(id: string, dto: UpdateCompanySettingsDto) {
    return this.prisma.company.update({
      where: { id },
      data: {
        revenueFrequency: dto.revenueFrequency,
        taxGroup: dto.taxGroup,
        rentAmount: dto.rentAmount,
        utilitiesAmount: dto.utilitiesAmount,
      },
    });
  }

  async regenerateInviteCode(id: string) {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = Math.floor(10000000 + Math.random() * 90000000).toString();
      const existing = await this.prisma.company.findUnique({
        where: { inviteCode: code },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    return this.prisma.company.update({
      where: { id },
      data: { inviteCode: code },
    });
  }

  private static readonly ESV_PER_MONTH_2026 = 1902.34;

  private getTaxRate(taxGroup: string): number {
    switch (taxGroup) {
      case 'FOP_3_5PERCENT':
        return 0.06;
      case 'FOP_3_3PERCENT':
        return 0.04;
      case 'FOP_1':
        return 0.10;
      case 'FOP_2':
        return 0.20;
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
    const result = await this.prisma.transaction.findMany({
      where: { companyId, isArchived: false },
      select: { date: true },
      orderBy: { date: 'asc' },
    });
    const set = new Set<string>();
    for (const r of result) {
      const d = new Date(r.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      if (key !== currentMonth) set.add(key);
    }
    return Array.from(set).sort();
  }

  async calculateTax(
    companyId: string,
    dto: { months: string[] },
  ) {
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

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      return null;
    }

    const [incomeAgg, expenseAgg] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          companyId,
          type: 'INCOME',
          isArchived: false,
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          companyId,
          type: 'EXPENSE',
          isArchived: false,
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeAgg._sum.amount ?? 0;
    const totalExpenses = expenseAgg._sum.amount ?? 0;
    const netProfit = Math.max(0, totalIncome - totalExpenses);
    const taxRate = this.getTaxRate(company.taxGroup);
    let taxAmount: number;
    let esvAmount: number | undefined;
    let incomeTaxAmount: number | undefined;

    if (this.isFop3(company.taxGroup)) {
      esvAmount = Math.round(CompanyService.ESV_PER_MONTH_2026 * sorted.length * 100) / 100;
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
    await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount: dto.amount,
          type: 'EXPENSE',
          category: 'Податки',
          description: `Єдиний податок (${dto.periodLabel})`,
          companyId,
        },
      });
      await tx.company.update({
        where: { id: companyId },
        data: { balance: { decrement: dto.amount } },
      });
    });
    return { success: true };
  }
}
