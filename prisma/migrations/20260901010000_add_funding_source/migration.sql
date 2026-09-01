-- CreateEnum
CREATE TYPE "FundingSource" AS ENUM ('BALANCE', 'SAVINGS');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "fundingSource" "FundingSource" NOT NULL DEFAULT 'BALANCE';

-- CreateIndex
CREATE INDEX "Transaction_fundingSource_idx" ON "Transaction"("fundingSource");
