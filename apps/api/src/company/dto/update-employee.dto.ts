import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsNumber()
  @Min(0)
  monthlySalary?: number | null;

  @IsOptional()
  @IsBoolean()
  includeInAutoPay?: boolean;
}
