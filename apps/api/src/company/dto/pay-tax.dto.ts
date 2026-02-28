import { IsNumber, IsString, Min, IsArray, ArrayMinSize } from 'class-validator';

export class PayTaxDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  periodLabel: string;

  @IsArray()
  @ArrayMinSize(1)
  months: string[];
}
