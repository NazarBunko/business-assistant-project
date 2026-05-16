import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('invoices')
@UseGuards(AuthGuard('jwt'))
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  create(@Req() req: any, @Body() createInvoiceDto: CreateInvoiceDto) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) throw new ForbiddenException('No company');
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException('Only OWNER or ADMIN can create invoices');
    }
    return this.invoiceService.create(companyId, createInvoiceDto);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page: string,
    @Query('status') status?: string,
  ) {
    const companyId = req.user?.companyId;
    if (!companyId) throw new ForbiddenException('No company');
    return this.invoiceService.findAll(companyId, Number(page) || 1, status);
  }

  @Get('stats')
  getStats(@Req() req: any) {
    const companyId = req.user?.companyId;
    if (!companyId) throw new ForbiddenException('No company');
    return this.invoiceService.getStats(companyId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const companyId = req.user?.companyId;
    if (!companyId) throw new ForbiddenException('No company');
    return this.invoiceService.findOne(companyId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateInvoiceStatusDto: UpdateInvoiceStatusDto,
  ) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) throw new ForbiddenException('No company');
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException('Only OWNER or ADMIN can update invoice status');
    }
    return this.invoiceService.updateStatus(companyId, id, updateInvoiceStatusDto.status);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) throw new ForbiddenException('No company');
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException('Only OWNER or ADMIN can delete invoices');
    }
    return this.invoiceService.delete(companyId, id);
  }
}
