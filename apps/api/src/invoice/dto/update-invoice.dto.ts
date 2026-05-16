import { IsString, IsEnum, IsOptional } from 'class-validator';

export class UpdateInvoiceStatusDto {
  @IsEnum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])
  status: string;
}
