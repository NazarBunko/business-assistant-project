import { RevenueFrequency, TaxGroup } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class UpdateCompanySettingsDto {
  @IsOptional()
  @IsEnum(RevenueFrequency)
  revenueFrequency?: RevenueFrequency;

  @IsOptional()
  @IsEnum(TaxGroup)
  taxGroup?: TaxGroup;

  @IsOptional()
  @IsNumber()
  rentAmount?: number;

  @IsOptional()
  @IsNumber()
  utilitiesAmount?: number;
}
