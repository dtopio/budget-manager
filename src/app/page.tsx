"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/budget/summary-cards";
import { CategoryBreakdownChart } from "@/components/budget/category-breakdown-chart";
import { TrendChart } from "@/components/budget/trend-chart";
import { TransactionList } from "@/components/budget/transaction-list";
import { RecurringList } from "@/components/budget/recurring-list";
import { CategoryManager } from "@/components/budget/category-manager";
import { FiftyThirtyTwentyCard } from "@/components/budget/fifty-thirty-twenty-card";
import { SubscriptionsTab } from "@/components/budget/subscriptions-tab";
import { AddTransactionDialog } from "@/components/budget/add-transaction-dialog";
import { AddRecurringDialog } from "@/components/budget/add-recurring-dialog";
import { MonthPicker } from "@/components/budget/month-picker";
import {
  SummaryCardsSkeleton,
  ChartCardSkeleton,
  EnvelopesCardSkeleton,
  ListCardSkeleton,
} from "@/components/budget/skeletons";
import type { Category, RecurringTransaction, Summary, Transaction } from "@/lib/types";

export default function Home() {
  const [month, setMonth] = useState(() => new Date());
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const monthKey = format(month, "yyyy-MM");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Materialize any due recurring transactions before loading, so a rule that's
      // due today (including one just created) shows up as an actual transaction
      // immediately rather than waiting for the next full page load. Run it in
      // parallel with the requests that don't depend on it (categories/recurring),
      // and only block the transactions/summary fetches on its completion.
      const runP = fetch("/api/recurring/run", { method: "POST" });
      const categoriesP = fetch("/api/categories");
      const recurringP = fetch("/api/recurring");

      const from = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
      const to = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59).toISOString();

      await runP;

      const [categoriesRes, transactionsRes, recurringRes, summaryRes] = await Promise.all([
        categoriesP,
        fetch(`/api/transactions?from=${from}&to=${to}`),
        recurringP,
        fetch(`/api/summary?month=${monthKey}`),
      ]);

      setCategories(await categoriesRes.json());
      setTransactions(await transactionsRes.json());
      setRecurring(await recurringRes.json());
      setSummary(await summaryRes.json());
    } finally {
      setLoading(false);
    }
  }, [month, monthKey]);

  useEffect(() => {
    Promise.resolve().finally(loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-sm shadow-primary/30">
              <Wallet className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-semibold tracking-tight">Budget Manager</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MonthPicker month={month} onChange={setMonth} />
            <AddRecurringDialog categories={categories} onCreated={loadData} />
            <AddTransactionDialog categories={categories} onCreated={loadData} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {loading ? <SummaryCardsSkeleton /> : <SummaryCards summary={summary} />}

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            {loading ? (
              <>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <ChartCardSkeleton />
                  <ChartCardSkeleton />
                </div>
                <EnvelopesCardSkeleton />
                <ListCardSkeleton rows={6} />
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <CategoryBreakdownChart
                    data={summary?.byCategory ?? []}
                    month={month}
                    transactions={transactions}
                  />
                  <TrendChart data={summary?.trend ?? []} />
                </div>
                <FiftyThirtyTwentyCard summary={summary} />
                <TransactionList transactions={transactions} onChanged={loadData} />
              </>
            )}
          </TabsContent>

          <TabsContent value="recurring" className="mt-4">
            {loading ? (
              <ListCardSkeleton rows={5} />
            ) : (
              <RecurringList recurring={recurring} categories={categories} onChanged={loadData} />
            )}
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-4">
            {loading ? (
              <ListCardSkeleton rows={5} />
            ) : (
              <SubscriptionsTab
                recurring={recurring}
                categories={categories}
                onChanged={loadData}
              />
            )}
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            {loading ? (
              <div className="space-y-6">
                <ListCardSkeleton rows={4} />
                <ListCardSkeleton rows={4} />
              </div>
            ) : (
              <CategoryManager categories={categories} onChanged={loadData} />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
