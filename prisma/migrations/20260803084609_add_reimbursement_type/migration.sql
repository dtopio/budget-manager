-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'REIMBURSEMENT';

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "excludeFromTotals";
