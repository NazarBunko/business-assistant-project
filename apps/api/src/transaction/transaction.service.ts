import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

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

  async generateMonthlyExpenses(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) return;

    const transactions = [];
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

    if (transactions.length > 0) {
      await this.prisma.$transaction([
        this.prisma.transaction.createMany({ data: transactions as any }),
        this.prisma.company.update({
          where: { id: companyId },
          data: { balance: { decrement: totalExpense } },
        }),
      ]);
    }
  }
}
