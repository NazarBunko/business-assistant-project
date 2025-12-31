/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - The required column `inviteCode` was added to the `Company` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "RevenueFrequency" AS ENUM ('DAILY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "TaxGroup" AS ENUM ('FOP_1', 'FOP_2', 'FOP_3_3PERCENT', 'FOP_3_5PERCENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "inviteCode" TEXT NOT NULL,
ADD COLUMN     "rentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "revenueFrequency" "RevenueFrequency" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "taxGroup" "TaxGroup" NOT NULL DEFAULT 'FOP_3_5PERCENT',
ADD COLUMN     "utilitiesAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_inviteCode_key" ON "Company"("inviteCode");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
