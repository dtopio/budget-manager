"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil } from "lucide-react";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_LABELS, isSubscriptionCategory } from "@/lib/subscription-labels";
import type { Category, RecurrenceFrequency, RecurringTransaction, TransactionType } from "@/lib/types";

const frequencyLabels: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export function AddRecurringDialog({
  categories,
  onCreated,
  recurring,
}: {
  categories: Category[];
  onCreated: () => void;
  recurring?: RecurringTransaction;
}) {
  const isEdit = !!recurring;
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>(recurring?.type ?? "EXPENSE");
  const [amount, setAmount] = useState(recurring?.amount ?? "");
  const [categoryId, setCategoryId] = useState<string>(recurring?.categoryId ?? "");
  const [note, setNote] = useState(recurring?.note ?? "");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    recurring?.frequency ?? "MONTHLY"
  );
  // Stored dates are sliced from their ISO string; a fresh "today" is formatted in local
  // time so it doesn't render as yesterday east of UTC.
  const [startDate, setStartDate] = useState(() =>
    recurring ? recurring.startDate.slice(0, 10) : format(new Date(), "yyyy-MM-dd")
  );
  // On edit, the meaningful date is the next occurrence, not the (historical) start.
  const [nextRunDate, setNextRunDate] = useState(() =>
    recurring ? recurring.nextRunDate.slice(0, 10) : format(new Date(), "yyyy-MM-dd")
  );
  const [submitting, setSubmitting] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);
  const selectedCategory = filteredCategories.find((c) => c.id === categoryId);
  const showSubscriptionPicker = isSubscriptionCategory(selectedCategory?.name);

  function handleOpenChange(next: boolean) {
    if (next) {
      setType(recurring?.type ?? "EXPENSE");
      setAmount(recurring?.amount ?? "");
      setCategoryId(recurring?.categoryId ?? "");
      setNote(recurring?.note ?? "");
      setFrequency(recurring?.frequency ?? "MONTHLY");
      setStartDate(
        recurring ? recurring.startDate.slice(0, 10) : format(new Date(), "yyyy-MM-dd")
      );
      setNextRunDate(
        recurring ? recurring.nextRunDate.slice(0, 10) : format(new Date(), "yyyy-MM-dd")
      );
    }
    setOpen(next);
  }

  async function handleSubmit() {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/recurring/${recurring.id}` : "/api/recurring",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: parsedAmount,
            type,
            categoryId: categoryId || null,
            note: note || null,
            frequency,
            ...(isEdit
              ? { nextRunDate: new Date(nextRunDate).toISOString() }
              : { startDate: new Date(startDate).toISOString() }),
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to save");
      toast.success(isEdit ? "Recurring transaction updated" : "Recurring transaction added");
      if (!isEdit) {
        setAmount("");
        setNote("");
        setCategoryId("");
      }
      setOpen(false);
      onCreated();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {isEdit ? (
        <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="outline" />}>
          <Plus className="h-4 w-4" />
          Add recurring
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit recurring transaction" : "Add recurring transaction"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs
            value={type}
            onValueChange={(v) => {
              setType(v as TransactionType);
              setCategoryId("");
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="EXPENSE" className="flex-1">
                Expense
              </TabsTrigger>
              <TabsTrigger value="INCOME" className="flex-1">
                Income
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="r-amount">Amount</Label>
            <Input
              id="r-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a category">
                  {() => {
                    if (!selectedCategory) return "Choose a category";
                    const Icon = getIcon(selectedCategory.icon);
                    return (
                      <>
                        <Icon className="h-4 w-4" style={{ color: selectedCategory.color }} />
                        {selectedCategory.name}
                      </>
                    );
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => {
                  const Icon = getIcon(c.icon);
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      <Icon className="h-4 w-4" style={{ color: c.color }} />
                      {c.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: string) => frequencyLabels[v] ?? v}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-start">{isEdit ? "Next date" : "Start date"}</Label>
              <Input
                id="r-start"
                type="date"
                value={isEdit ? nextRunDate : startDate}
                onChange={(e) =>
                  isEdit ? setNextRunDate(e.target.value) : setStartDate(e.target.value)
                }
              />
            </div>
          </div>

          {showSubscriptionPicker && (
            <div className="space-y-2">
              <Label>Which subscription?</Label>
              <div className="flex flex-wrap gap-1.5">
                {SUBSCRIPTION_LABELS.map((s) => {
                  const Icon = getIcon(s.icon);
                  const selected = note === s.name;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setNote(selected ? "" : s.name)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="r-note">
              {showSubscriptionPicker ? "Label / note" : "Note (optional)"}
            </Label>
            <Input
              id="r-note"
              placeholder="e.g. Netflix"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
