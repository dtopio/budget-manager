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
import { Plus } from "lucide-react";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_LABELS, isSubscriptionCategory } from "@/lib/subscription-labels";
import type { Category, TransactionType } from "@/lib/types";

export function AddTransactionDialog({
  categories,
  onCreated,
}: {
  categories: Category[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [note, setNote] = useState("");
  // Local calendar day, not UTC: toISOString() would show yesterday for anyone east of
  // UTC before their offset has elapsed (e.g. 02:00 in UTC+7).
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [submitting, setSubmitting] = useState(false);

  const filteredCategories = categories.filter(
    (c) => c.type === (type === "REIMBURSEMENT" ? "EXPENSE" : type)
  );
  const selectedCategory = filteredCategories.find((c) => c.id === categoryId);
  const showSubscriptionPicker = isSubscriptionCategory(selectedCategory?.name);

  async function handleSubmit() {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          type,
          categoryId: categoryId || null,
          note: note || null,
          date: new Date(date).toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const typeLabel =
        type === "INCOME" ? "Income" : type === "REIMBURSEMENT" ? "Reimbursement" : "Expense";
      toast.success(`${typeLabel} added`);
      setAmount("");
      setNote("");
      setCategoryId("");
      setOpen(false);
      onCreated();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Add transaction
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
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
              <TabsTrigger value="REIMBURSEMENT" className="flex-1">
                Reimbursement
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
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
            <Label>{type === "REIMBURSEMENT" ? "What was this for? (optional)" : "Category"}</Label>
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
            {type === "REIMBURSEMENT" && (
              <p className="text-xs text-muted-foreground">
                Linking an expense category offsets that category&apos;s spending instead of
                just padding your balance.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
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
            <Label htmlFor="note">
              {showSubscriptionPicker ? "Label / note" : "Note (optional)"}
            </Label>
            <Input
              id="note"
              placeholder={showSubscriptionPicker ? "e.g. Spotify" : "e.g. Costco run"}
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
