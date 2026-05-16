import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Post,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PayBonusDto } from './dto/pay-bonus.dto';
import { CalculateTaxDto } from './dto/calculate-tax.dto';
import { PayTaxDto } from './dto/pay-tax.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('employees')
  async getEmployees(@Req() req: any) {
    const companyId = req.user?.companyId;
    if (!companyId) throw new ForbiddenException('No company');
    return this.companyService.getEmployees(companyId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('employees/salary-summary')
  async getSalarySummary(@Req() req: any) {
    const companyId = req.user?.companyId;
    if (!companyId) throw new ForbiddenException('No company');
    return this.companyService.getSalarySummary(companyId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('employees/:userId/salary-history')
  async getSalaryHistory(@Req() req: any, @Param('userId') userId: string) {
    const companyId = req.user?.companyId;
    if (!companyId) throw new ForbiddenException('No company');
    return this.companyService.getSalaryHistory(companyId, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('employees/:userId/pay-bonus')
  async payBonus(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() dto: PayBonusDto,
  ) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) throw new ForbiddenException('No company');
    return this.companyService.payBonusToEmployee(
      companyId,
      userId,
      role,
      dto.amount,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('employees/:userId')
  async removeEmployee(@Req() req: any, @Param('userId') userId: string) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) throw new ForbiddenException('No company');
    return this.companyService.removeEmployee(companyId, userId, role);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('employees/:userId')
  async updateEmployee(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) throw new ForbiddenException('No company');
    return this.companyService.updateEmployee(companyId, userId, role, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('employees/:userId/pay-salary')
  async paySalary(@Req() req: any, @Param('userId') userId: string) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) throw new ForbiddenException('No company');
    return this.companyService.paySalaryToEmployee(companyId, userId, role);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('tax/available-months')
  async getTaxAvailableMonths(@Req() req: any) {
    const companyId = req.user?.companyId;
    if (!companyId) throw new ForbiddenException('No company');
    return this.companyService.getTaxAvailableMonths(companyId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('tax/calculate')
  async calculateTax(@Req() req: any, @Body() dto: CalculateTaxDto) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) throw new ForbiddenException('No company');
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException('Only OWNER or ADMIN can calculate taxes');
    }
    return this.companyService.calculateTax(companyId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('tax/pay')
  async payTax(@Req() req: any, @Body() dto: PayTaxDto) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) throw new ForbiddenException('No company');
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException('Only OWNER or ADMIN can pay taxes');
    }
    return this.companyService.payTax(companyId, {
      amount: dto.amount,
      periodLabel: dto.periodLabel,
      months: dto.months,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userCompanyId = req.user?.companyId;
    if (id !== userCompanyId) {
      throw new ForbiddenException('Cannot access other company data');
    }
    return this.companyService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/settings')
  async updateSettings(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCompanySettingsDto,
  ) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (id !== companyId) {
      throw new ForbiddenException('Cannot modify other company settings');
    }
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException('Only OWNER or ADMIN can update settings');
    }
    return this.companyService.updateSettings(id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/regenerate-code')
  async regenerateCode(@Req() req: any, @Param('id') id: string) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (id !== companyId) {
      throw new ForbiddenException('Cannot regenerate code for other company');
    }
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException('Only OWNER or ADMIN can regenerate invite code');
    }
    return this.companyService.regenerateInviteCode(id);
  }
}
