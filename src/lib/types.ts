export type TransactionType = "INCOME" | "EXPENSE" | "REIMBURSEMENT";
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type BudgetGroup = "NEEDS" | "WANTS" | "SAVINGS";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  group: BudgetGroup | null;
  budgetLimit: string | null;
}

export interface Transaction {
  id: string;
  amount: string;
  type: TransactionType;
  note: string | null;
  date: string;
  categoryId: string | null;
  category: Category | null;
  recurringId: string | null;
}

export interface RecurringTransaction {
  id: string;
  amount: string;
  type: TransactionType;
  note: string | null;
  frequency: RecurrenceFrequency;
  startDate: string;
  nextRunDate: string;
  endDate: string | null;
  active: boolean;
  categoryId: string | null;
  category: Category | null;
}

export interface CategoryBreakdown {
  categoryId: string | null;
  name: string;
  color: string;
  total: number;
}

export interface Summary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  totalReimbursement: number;
  balance: number;
  byCategory: CategoryBreakdown[];
  trend: { month: string; income: number; expense: number }[];
  budgetGroups: {
    group: BudgetGroup;
    targetPct: number;
    allocated: number;
    spentActual: number;
    spentUpcoming: number;
    spent: number;
    remaining: number;
    total: number;
  }[];
  upcomingIncome: number;
  upcomingExpense: number;
  upcomingItems: {
    id: string;
    name: string;
    note: string | null;
    amount: number;
    date: string;
    categoryName: string | null;
    categoryIcon: string | null;
    categoryColor: string | null;
  }[];
}
