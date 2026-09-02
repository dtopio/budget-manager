"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { ArrowDownRight, GripHorizontal, PiggyBank, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GLASS, GLASS_SHEEN } from "@/lib/glass";
import type { Summary } from "@/lib/types";

const SETTING_KEY = "summary-cards-order";
const LOCAL_STORAGE_KEY = "summary-cards-order";
const CARD_IDS = ["savings", "expenses", "available"] as const;
type CardId = (typeof CARD_IDS)[number];

function sanitizeOrder(raw: unknown): CardId[] {
  if (!Array.isArray(raw)) return [...CARD_IDS];
  const valid = raw.filter((id): id is CardId => (CARD_IDS as readonly string[]).includes(id));
  const missing = CARD_IDS.filter((id) => !valid.includes(id));
  return [...valid, ...missing];
}

function loadLocalOrder(): CardId[] {
  if (typeof window === "undefined") return [...CARD_IDS];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? sanitizeOrder(JSON.parse(raw)) : [...CARD_IDS];
  } catch {
    return [...CARD_IDS];
  }
}

function persistOrder(order: CardId[]) {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(order));
  } catch {
    // ignore persistence failures (e.g. private browsing)
  }
  fetch(`/api/settings/${SETTING_KEY}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: order }),
  }).catch(() => {
    // best-effort sync; the local copy still reflects the user's choice
  });
}

type StatCardProps = {
  label: string;
  value: number;
  Icon: LucideIcon;
  tint: string;
  hint?: string;
  valueClassName?: string;
  isDragging?: boolean;
  onGripPointerDown?: (e: React.PointerEvent) => void;
};

function StatCard({
  label,
  value,
  Icon,
  tint,
  hint,
  valueClassName,
  isDragging,
  onGripPointerDown,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "group relative flex h-full w-full flex-col gap-0 p-5 transition-[transform,box-shadow] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_0_var(--glass-highlight),inset_0_-1px_0_0_var(--glass-shade),var(--elev-3)]",
        GLASS,
        GLASS_SHEEN,
        isDragging && "opacity-50",
      )}
    >
      {/* The card's own colour, thrown from behind the icon. Kept faint and tight to the
          corner: at any strength it stops reading as light and starts reading as a
          decorative blob pasted on the card. */}
      <div
        className="pointer-events-none absolute -top-10 -right-6 h-24 w-24 rounded-full opacity-[0.09] blur-2xl"
        style={{ backgroundColor: tint }}
      />
      <div
        onPointerDown={onGripPointerDown}
        className="absolute top-2.5 left-1/2 flex h-6 w-10 -translate-x-1/2 cursor-grab items-center justify-center rounded-full opacity-40 transition-opacity group-hover:opacity-100 hover:bg-foreground/5 active:cursor-grabbing sm:opacity-0"
        style={{ touchAction: "none" }}
      >
        <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[0.6875rem] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </span>
        {/* Icon chip: tinted fill, lit top edge, its own contact shadow. */}
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-[inset_0_1px_0_0_oklch(1_0_0/0.3),var(--elev-1)]"
          style={{
            background: `linear-gradient(160deg, color-mix(in oklch, ${tint} 26%, transparent), color-mix(in oklch, ${tint} 12%, transparent))`,
          }}
        >
          <Icon className="h-[1.15rem] w-[1.15rem]" style={{ color: tint }} />
        </span>
      </div>
      <div
        className={cn(
          "mt-3.5 text-[2.125rem] leading-none font-semibold tracking-[-0.035em] tabular-nums",
          valueClassName,
        )}
      >
        {formatCurrency(value)}
      </div>
      <p className="mt-2.5 flex-1 text-xs leading-relaxed text-muted-foreground tabular-nums">
        {hint}
      </p>
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
  const draggedIdRef = useRef<CardId | null>(null);
  const orderRef = useRef<CardId[]>([...CARD_IDS]);

  useEffect(() => {
    // The cached order is applied on mount rather than as the initial state because the
    // server renders the default order — seeding from localStorage would be a hydration
    // mismatch. One extra render is the cost of not flashing the wrong order.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(loadLocalOrder());
    fetch(`/api/settings/${SETTING_KEY}`)
      .then((res) => res.json())
      .then((data: { value: unknown }) => {
        if (data.value) setOrder(sanitizeOrder(data.value));
      })
      .catch(() => {
        // fall back to whatever localStorage/default order is already showing
      });
  }, []);

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  function reorder(sourceId: CardId, targetId: CardId) {
    if (sourceId === targetId) return;
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(sourceId);
      const to = next.indexOf(targetId);
      next.splice(from, 1);
      next.splice(to, 0, sourceId);
      return next;
    });
  }

  function startDrag(id: CardId, e: React.PointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    draggedIdRef.current = id;
    setDraggedId(id);
  }

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      const sourceId = draggedIdRef.current;
      if (!sourceId) return;
      // Hit-test the pointer rather than tracking every card's box: the grip holds
      // pointer capture, so the events keep coming even once the finger leaves the card
      // it started on.
      const over = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-card-id]");
      const targetId = over?.dataset.cardId as CardId | undefined;
      if (targetId && targetId !== sourceId) reorder(sourceId, targetId);
    }
    function handlePointerUp() {
      if (draggedIdRef.current) {
        persistOrder(orderRef.current);
      }
      draggedIdRef.current = null;
      setDraggedId(null);
    }
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  const cards: Record<CardId, Omit<StatCardProps, "isDragging" | "onGripPointerDown">> = {
    savings: {
      label: "Savings",
      value: savings,
      Icon: PiggyBank,
      tint: "var(--savings)",
      hint:
        savingsSpent > 0
          ? `${formatCurrency(savingsSpent)} drawn this month`
          : "across all months",
    },
    expenses: {
      label: "Expenses",
      value: expense,
      Icon: ArrowDownRight,
      tint: "var(--expense)",
      hint: "spent this month",
    },
    available: {
      label: "Left to spend",
      value: available,
      Icon: Wallet,
      tint: available >= 0 ? "var(--income)" : "var(--expense)",
      hint:
        upcoming > 0
          ? `after ${formatCurrency(upcoming)} of bills still due`
          : "no bills left this month",
    },
  };

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-3">
      {order.map((id) => (
        <div key={id} data-card-id={id} className="flex">
          <StatCard
            {...cards[id]}
            isDragging={draggedId === id}
            onGripPointerDown={(e) => startDrag(id, e)}
          />
        </div>
      ))}
    </div>
  );
}
