import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateResponseDto } from './dto/create-response.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getAllUsers(
    @Query('page') page: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(Number(page) || 1, search);
  }

  @Post('users/:id/block')
  async blockUser(@Param('id') userId: string) {
    return this.adminService.blockUser(userId);
  }

  @Post('users/:id/unblock')
  async unblockUser(@Param('id') userId: string) {
    return this.adminService.unblockUser(userId);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Get('companies')
  async getAllCompanies(
    @Query('page') page: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllCompanies(Number(page) || 1, search);
  }

  @Get('companies/:id')
  async getCompanyDetails(@Param('id') companyId: string) {
    return this.adminService.getCompanyDetails(companyId);
  }

  @Get('tickets')
  async getAllTickets(
    @Query('page') page: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllTickets(Number(page) || 1, status);
  }

  @Get('tickets/:id')
  async getTicketDetails(@Param('id') ticketId: string) {
    return this.adminService.getTicketDetails(ticketId);
  }

  @Patch('tickets/:id')
  async updateTicket(
    @Param('id') ticketId: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.adminService.updateTicket(ticketId, dto);
  }

  @Post('tickets/:id/responses')
  async addResponse(
    @Param('id') ticketId: string,
    @Body() dto: CreateResponseDto,
  ) {
    return this.adminService.addResponse(ticketId, dto.message, true);
  }

  @Delete('tickets/:id')
  async deleteTicket(@Param('id') ticketId: string) {
    return this.adminService.deleteTicket(ticketId);
  }
}
