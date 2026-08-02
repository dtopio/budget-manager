"use client";

import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { getIcon } from "@/lib/icons";
import { CategoryDialog } from "@/components/budget/category-dialog";
import type { BudgetGroup, Category, TransactionType } from "@/lib/types";

const groupLabel: Record<BudgetGroup, string> = {
  NEEDS: "Needs",
  WANTS: "Wants",
  SAVINGS: "Savings",
};

function CategoryGroup({
  title,
  categories,
  onChanged,
}: {
  title: string;
  categories: Category[];
  onChanged: () => void;
}) {
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Category deleted");
      onChanged();
    } catch {
      toast.error("Failed to delete. Remove its transactions first, or unassign them.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No categories yet.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {categories.map((c) => {
              const Icon = getIcon(c.icon);
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${c.color}1f` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: c.color }} />
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate text-sm font-medium">{c.name}</span>
                    {c.group && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {groupLabel[c.group]}
                      </Badge>
                    )}
                  </span>
                  <CategoryDialog category={c} onSaved={onChanged} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function CategoryManager({
  categories,
  onChanged,
}: {
  categories: Category[];
  onChanged: () => void;
}) {
  const byType = (type: TransactionType) => categories.filter((c) => c.type === type);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CategoryDialog onSaved={onChanged} />
      </div>
      <CategoryGroup title="Expense categories" categories={byType("EXPENSE")} onChanged={onChanged} />
      <CategoryGroup title="Income categories" categories={byType("INCOME")} onChanged={onChanged} />
    </div>
  );
}
