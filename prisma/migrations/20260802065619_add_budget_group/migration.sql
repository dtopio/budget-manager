-- CreateEnum
CREATE TYPE "BudgetGroup" AS ENUM ('NEEDS', 'WANTS', 'SAVINGS');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "group" "BudgetGroup";
