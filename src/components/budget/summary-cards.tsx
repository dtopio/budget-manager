"use client";

import { cloneElement, isValidElement, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { ArrowDownRight, GripVertical, PiggyBank, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GLASS, GLASS_SHEEN } from "@/lib/glass";
import type { Summary } from "@/lib/types";

const ORDER_STORAGE_KEY = "summary-cards-order";
const CARD_IDS = ["savings", "expenses", "available"] as const;
type CardId = (typeof CARD_IDS)[number];

function loadOrder(): CardId[] {
  if (typeof window === "undefined") return [...CARD_IDS];
  try {
    const raw = window.localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) return [...CARD_IDS];
    const parsed = JSON.parse(raw) as string[];
    const valid = parsed.filter((id): id is CardId => (CARD_IDS as readonly string[]).includes(id));
    const missing = CARD_IDS.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return [...CARD_IDS];
  }
}

function StatCard({
  label,
  value,
  Icon,
  tint,
  hint,
  valueClassName,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}: {
  label: string;
  value: number;
  Icon: LucideIcon;
  tint: string;
  hint?: string;
  valueClassName?: string;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}) {
  return (
    <Card
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative p-5 transition-shadow hover:shadow-lg",
        GLASS,
        GLASS_SHEEN,
        isDragging && "opacity-50",
      )}
    >
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-[0.12]"
        style={{ backgroundColor: tint }}
      />
      <div
        className="absolute top-3 right-3 cursor-grab touch-none opacity-0 transition-opacity group-hover:opacity-60 active:cursor-grabbing"
        aria-hidden
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: `color-mix(in oklch, ${tint} 15%, transparent)` }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color: tint }} />
        </span>
      </div>
      <div
        className={cn("mt-3 text-3xl font-semibold tracking-tight tabular-nums", valueClassName)}
      >
        {formatCurrency(value)}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground tabular-nums">{hint}</p>}
    </Card>
  );
}

export function SummaryCards({ summary }: { summary: Summary | null }) {
  const expense = summary?.totalExpense ?? 0;
  const savings = summary?.savingsBalance ?? 0;
  const savingsSpent = summary?.savingsSpent ?? 0;
  // The headline figure is what's actually left after the bills still to come, not the
  // raw month balance — that number reads as spendable when it isn't.
  const available = summary?.available ?? 0;
  const upcoming = summary?.upcomingExpense ?? 0;

  const [order, setOrder] = useState<CardId[]>([...CARD_IDS]);
  const [draggedId, setDraggedId] = useState<CardId | null>(null);

  useEffect(() => {
    setOrder(loadOrder());
  }, []);

  const cards: Record<CardId, React.ReactNode> = {
    savings: (
      <StatCard
        label="Savings"
        value={savings}
        Icon={PiggyBank}
        tint="var(--savings)"
        hint={
          savingsSpent > 0
            ? `${formatCurrency(savingsSpent)} drawn this month`
            : "across all months"
        }
      />
    ),
    expenses: <StatCard label="Expenses" value={expense} Icon={ArrowDownRight} tint="var(--expense)" />,
    available: (
      <StatCard
        label="Left to spend"
        value={available}
        Icon={Wallet}
        tint={available >= 0 ? "var(--income)" : "var(--expense)"}
        hint={
          upcoming > 0
            ? `after ${formatCurrency(upcoming)} of bills still due`
            : "no bills left this month"
        }
      />
    ),
  };

  function reorder(sourceId: CardId, targetId: CardId) {
    if (sourceId === targetId) return;
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(sourceId);
      const to = next.indexOf(targetId);
      next.splice(from, 1);
      next.splice(to, 0, sourceId);
      try {
        window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore persistence failures (e.g. private browsing)
      }
      return next;
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {order.map((id) => (
        <div
          key={id}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedId) reorder(draggedId, id);
          }}
        >
          {(() => {
            const el = cards[id];
            if (!isValidElement(el)) return el;
            return cloneElement(el, {
              draggable: true,
              onDragStart: () => setDraggedId(id),
              onDragEnd: () => setDraggedId(null),
              isDragging: draggedId === id,
            } as Partial<{
              draggable: boolean;
              onDragStart: () => void;
              onDragEnd: () => void;
              isDragging: boolean;
            }>);
          })()}
        </div>
      ))}
    </div>
  );
}
