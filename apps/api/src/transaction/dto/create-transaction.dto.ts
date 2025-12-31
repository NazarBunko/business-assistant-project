export class CreateTransactionDto {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description?: string;
  date?: string;
}
