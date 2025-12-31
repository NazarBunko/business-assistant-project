import { Controller, Get, Patch, Param, Body, Post } from '@nestjs/common';
import { CompanyService } from './company.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id/settings')
  async updateSettings(
    @Param('id') id: string,
    @Body() dto: UpdateCompanySettingsDto,
  ) {
    return this.companyService.updateSettings(id, dto);
  }

  @Post(':id/regenerate-code')
  async regenerateCode(@Param('id') id: string) {
    return this.companyService.regenerateInviteCode(id);
  }
}
