export enum GlobalRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum RevenueFrequency {
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum TaxGroup {
  FOP_1 = 'FOP_1',
  FOP_2 = 'FOP_2',
  FOP_3_3PERCENT = 'FOP_3_3PERCENT',
  FOP_3_5PERCENT = 'FOP_3_5PERCENT',
  GENERAL = 'GENERAL',
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum SalaryPaymentType {
  SALARY = 'SALARY',
  BONUS = 'BONUS',
}

export enum SupportTicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum SupportTicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface Company {
  id: string;
  name: string;
  inviteCode: string;
  balance: number;
  revenueFrequency: RevenueFrequency;
  taxGroup: TaxGroup;
  rentAmount: number;
  utilitiesAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  password: string;
  fullName: string;
  jobTitle: string | null;
  globalRole: GlobalRole;
  role: UserRole;
  companyId: string | null;
  monthlySalary: number | null;
  includeInAutoPay: boolean;
  lastSalaryPaidAt: Date | null;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  role: string;
  chatId: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string | null;
  date: Date;
  isArchived: boolean;
  companyId: string;
}

export interface SalaryPayment {
  id: string;
  amount: number;
  type: SalaryPaymentType;
  paidAt: Date;
  userId: string;
  transactionId: string;
  companyId: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportResponse {
  id: string;
  message: string;
  isAdmin: boolean;
  ticketId: string;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  dueDate: Date | null;
  paidAt: Date | null;
  notes: string | null;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  invoiceId: string;
}
