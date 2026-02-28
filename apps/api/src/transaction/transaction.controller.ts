import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deleteOne(@Req() req: any, @Param('id') id: string) {
    const companyId = req.user?.companyId;
    if (!companyId) throw new ForbiddenException('No company');
    return this.transactionService.deleteOne(companyId, id);
  }

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
