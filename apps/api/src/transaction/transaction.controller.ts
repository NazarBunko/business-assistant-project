import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Delete(':id')
  async deleteOne(@Req() req: any, @Param('id') id: string) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) throw new ForbiddenException('No company');
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException('Only OWNER or ADMIN can delete transactions');
    }
    return this.transactionService.deleteOne(companyId, id);
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page: string,
    @Query('archived') archived: string,
  ) {
    const companyId = req.user?.companyId;
    if (!companyId) throw new ForbiddenException('No company');
    return this.transactionService.findAll(
      companyId,
      Number(page) || 1,
      archived === 'true',
    );
  }

  @Post()
  async create(
    @Req() req: any,
    @Body() dto: CreateTransactionDto,
  ) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) throw new ForbiddenException('No company');
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException('Only OWNER or ADMIN can create transactions');
    }
    return this.transactionService.create(companyId, dto);
  }

  @Post('archive')
  async archive(@Req() req: any, @Body() body: { ids: string[] }) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) throw new ForbiddenException('No company');
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException('Only OWNER or ADMIN can archive transactions');
    }
    return this.transactionService.archiveMany(companyId, body.ids);
  }

  @Post('generate-recurring')
  async generateRecurring(@Req() req: any) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) throw new ForbiddenException('No company');
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException('Only OWNER or ADMIN can generate recurring transactions');
    }
    return this.transactionService.generateMonthlyExpenses(companyId);
  }
}
