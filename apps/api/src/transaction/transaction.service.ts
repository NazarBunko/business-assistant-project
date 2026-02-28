import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { SalaryPaymentType } from '@prisma/client';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, page: number, isArchived: boolean = false) {
    const take = 20;
    const skip = (page - 1) * take;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { companyId, isArchived },
        skip,
        take,
        orderBy: { date: 'desc' },
      }),
      this.prisma.transaction.count({ where: { companyId, isArchived } }),
    ]);

    return { data, total, totalPages: Math.ceil(total / take) };
  }

  async create(companyId: string, dto: CreateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          ...dto,
          date: dto.date ? new Date(dto.date) : new Date(),
          companyId,
        },
      });

      const operation =
        dto.type === 'INCOME'
          ? { increment: dto.amount }
          : { decrement: dto.amount };

      await tx.company.update({
        where: { id: companyId },
        data: { balance: operation },
      });

      return transaction;
    });
  }

  async archiveMany(ids: string[]) {
    return this.prisma.transaction.updateMany({
      where: { id: { in: ids } },
      data: { isArchived: true },
    });
  }

  async deleteOne(companyId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { salaryPayments: true },
    });
    if (!transaction || transaction.companyId !== companyId) {
      throw new NotFoundException('Transaction not found');
    }
    if (transaction.salaryPayments?.length > 0) {
      throw new ForbiddenException(
        'Cannot delete salary or bonus payment. Use employees section to manage.',
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.delete({ where: { id: transactionId } });
      const op =
        transaction.type === 'INCOME'
          ? { decrement: transaction.amount }
          : { increment: transaction.amount };
      await tx.company.update({
        where: { id: companyId },
        data: { balance: op },
      });
    });
    return { success: true };
  }

  async generateMonthlyExpenses(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const salaryEmployees = await this.prisma.user.findMany({
      where: {
        companyId,
        includeInAutoPay: true,
        monthlySalary: { not: null, gt: 0 },
        OR: [
          { lastSalaryPaidAt: null },
          { lastSalaryPaidAt: { lt: startOfMonth } },
        ],
      },
      select: { id: true, fullName: true, monthlySalary: true },
    });

    const transactions: Array<{
      amount: number;
      type: 'EXPENSE';
      category: string;
      description: string;
      companyId: string;
    }> = [];
    let totalExpense = 0;

    if (company.rentAmount > 0) {
      transactions.push({
        amount: company.rentAmount,
        type: 'EXPENSE',
        category: 'Оренда',
        description: 'Автоматичний платіж за оренду',
        companyId,
      });
      totalExpense += company.rentAmount;
    }

    if (company.utilitiesAmount > 0) {
      transactions.push({
        amount: company.utilitiesAmount,
        type: 'EXPENSE',
        category: 'Комунальні послуги',
        description: 'Автоматичний платіж за комуналку',
        companyId,
      });
      totalExpense += company.utilitiesAmount;
    }

    if (transactions.length > 0 || salaryEmployees.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        if (transactions.length > 0) {
          await tx.transaction.createMany({ data: transactions });
        }
        const now = new Date();
        for (const u of salaryEmployees) {
          const amount = u.monthlySalary!;
          const tr = await tx.transaction.create({
            data: {
              amount,
              type: 'EXPENSE',
              category: 'Зарплата',
              description: `Зарплата - ${u.fullName}`,
              companyId,
            },
          });
          await tx.salaryPayment.create({
            data: {
              amount,
              type: SalaryPaymentType.SALARY,
              userId: u.id,
              transactionId: tr.id,
              companyId,
            },
          });
          await tx.user.update({
            where: { id: u.id },
            data: { lastSalaryPaidAt: now },
          });
        }
        if (totalExpense > 0) {
          await tx.company.update({
            where: { id: companyId },
            data: { balance: { decrement: totalExpense } },
          });
        }
      });
    }
  }
}
