"use client";

import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil } from "lucide-react";
import { IconPicker } from "@/components/budget/icon-picker";
import { ColorPicker } from "@/components/budget/color-picker";
import { PALETTE } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { BudgetGroup, Category, TransactionType } from "@/lib/types";

const groupOptions: { value: BudgetGroup; label: string; hint: string }[] = [
  { value: "NEEDS", label: "Needs", hint: "50%" },
  { value: "WANTS", label: "Wants", hint: "30%" },
  { value: "SAVINGS", label: "Savings", hint: "20%" },
];

export function CategoryDialog({
  category,
  onSaved,
}: {
  category?: Category;
  onSaved: () => void;
}) {
  const isEdit = !!category;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<TransactionType>(category?.type ?? "EXPENSE");
  const [icon, setIcon] = useState(category?.icon ?? "Wallet");
  const [color, setColor] = useState(category?.color ?? PALETTE[0]);
  const [group, setGroup] = useState<BudgetGroup | null>(category?.group ?? null);
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (next) {
      setName(category?.name ?? "");
      setType(category?.type ?? "EXPENSE");
      setIcon(category?.icon ?? "Wallet");
      setColor(category?.color ?? PALETTE[0]);
      setGroup(category?.group ?? null);
    }
    setOpen(next);
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Enter a category name");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/categories/${category.id}` : "/api/categories",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            type,
            icon,
            color,
            group: type === "EXPENSE" ? group : null,
          }),
        }
      );
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Category updated" : "Category added");
      setOpen(false);
      onSaved();
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
          Add category
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
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
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              placeholder="e.g. Spotify"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {type === "EXPENSE" && (
            <div className="space-y-2">
              <Label>Budget group (50/30/20)</Label>
              <div className="grid grid-cols-3 gap-2">
                {groupOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGroup(group === opt.value ? null : opt.value)}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-center text-xs transition-colors",
                      group === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-[10px] opacity-70">{opt.hint}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <IconPicker value={icon} color={color} onChange={setIcon} />
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
