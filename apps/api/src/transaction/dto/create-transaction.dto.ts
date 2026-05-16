import { IsNumber, IsString, IsEnum, IsOptional, Min, MaxLength } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @IsEnum(['INCOME', 'EXPENSE'], { message: 'Type must be INCOME or EXPENSE' })
  type: 'INCOME' | 'EXPENSE';

  @IsString()
  @MaxLength(100, { message: 'Category must not exceed 100 characters' })
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @IsOptional()
  @IsString()
  date?: string;
}
