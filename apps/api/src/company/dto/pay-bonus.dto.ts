import { IsNumber, Min } from 'class-validator';

export class PayBonusDto {
  @IsNumber()
  @Min(0.01)
  amount: number;
}
