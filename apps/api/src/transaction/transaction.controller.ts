import { Controller, Get, Post, Body, Query, Patch } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async findAll(
    @Query('companyId') companyId: string,
    @Query('page') page: string,
    @Query('archived') archived: string,
  ) {
    return this.transactionService.findAll(
      companyId,
      Number(page) || 1,
      archived === 'true',
    );
  }

  @Post()
  async create(
    @Query('companyId') companyId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionService.create(companyId, dto);
  }

  @Post('archive')
  async archive(@Body() body: { ids: string[] }) {
    return this.transactionService.archiveMany(body.ids);
  }

  @Post('generate-recurring')
  async generateRecurring(@Body() body: { companyId: string }) {
    return this.transactionService.generateMonthlyExpenses(body.companyId);
  }
}
