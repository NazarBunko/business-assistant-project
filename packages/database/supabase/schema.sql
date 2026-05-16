-- Business Assistant — повна схема для Supabase SQL Editor
-- Project Settings → SQL → New query → вставити весь файл → Run

-- Розширення для UUID (опційно, id генерує API)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================== ENUMS =====================

CREATE TYPE "GlobalRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'EMPLOYEE');
CREATE TYPE "RevenueFrequency" AS ENUM ('DAILY', 'MONTHLY', 'QUARTERLY', 'YEARLY');
CREATE TYPE "TaxGroup" AS ENUM ('FOP_1', 'FOP_2', 'FOP_3_3PERCENT', 'FOP_3_5PERCENT', 'GENERAL');
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "SalaryPaymentType" AS ENUM ('SALARY', 'BONUS');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- ===================== TABLES =====================

CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueFrequency" "RevenueFrequency" NOT NULL DEFAULT 'MONTHLY',
    "taxGroup" "TaxGroup" NOT NULL DEFAULT 'FOP_3_5PERCENT',
    "rentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "utilitiesAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_inviteCode_key" ON "Company"("inviteCode");

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "jobTitle" TEXT,
    "globalRole" "GlobalRole" NOT NULL DEFAULT 'USER',
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "companyId" TEXT,
    "monthlySalary" DOUBLE PRECISION,
    "includeInAutoPay" BOOLEAN NOT NULL DEFAULT false,
    "lastSalaryPaidAt" TIMESTAMPTZ(3),
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

ALTER TABLE "User"
    ADD CONSTRAINT "User_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Chat"
    ADD CONSTRAINT "Chat_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Message"
    ADD CONSTRAINT "Message_chatId_fkey"
    FOREIGN KEY ("chatId") REFERENCES "Chat"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Transaction"
    ADD CONSTRAINT "Transaction_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SalaryPayment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "SalaryPaymentType" NOT NULL,
    "paidAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "SalaryPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SalaryPayment_transactionId_key" ON "SalaryPayment"("transactionId");

ALTER TABLE "SalaryPayment"
    ADD CONSTRAINT "SalaryPayment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SalaryPayment"
    ADD CONSTRAINT "SalaryPayment_transactionId_fkey"
    FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SalaryPayment"
    ADD CONSTRAINT "SalaryPayment_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SupportTicket"
    ADD CONSTRAINT "SupportTicket_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SupportResponse" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "ticketId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportResponse_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SupportResponse"
    ADD CONSTRAINT "SupportResponse_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "clientAddress" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMPTZ(3),
    "paidAt" TIMESTAMPTZ(3),
    "notes" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

ALTER TABLE "Invoice"
    ADD CONSTRAINT "Invoice_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "invoiceId" TEXT NOT NULL,
    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===================== updatedAt TRIGGERS =====================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_updated_at
    BEFORE UPDATE ON "Company"
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER chat_updated_at
    BEFORE UPDATE ON "Chat"
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER support_ticket_updated_at
    BEFORE UPDATE ON "SupportTicket"
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER invoice_updated_at
    BEFORE UPDATE ON "Invoice"
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ===================== RLS (вимкнено — API через service role / pg) =====================
-- NestJS API підключається напряму до Postgres. RLS можна увімкнути пізніше для клієнтського доступу.

ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SalaryPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvoiceItem" ENABLE ROW LEVEL SECURITY;

-- Політика для service_role (повний доступ з бекенду)
CREATE POLICY "service_role_all_company" ON "Company" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_user" ON "User" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_chat" ON "Chat" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_message" ON "Message" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_transaction" ON "Transaction" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_salary_payment" ON "SalaryPayment" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_support_ticket" ON "SupportTicket" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_support_response" ON "SupportResponse" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_invoice" ON "Invoice" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_invoice_item" ON "InvoiceItem" FOR ALL TO service_role USING (true) WITH CHECK (true);
