import { IsString, IsArray, IsOptional, ArrayMinSize } from 'class-validator';

export class CalculateTaxDto {
  @IsArray()
  @ArrayMinSize(1)
  months: string[];

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
