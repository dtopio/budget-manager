"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";

export function MonthPicker({
  month,
  onChange,
}: {
  month: Date;
  onChange: (month: Date) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(subMonths(month, 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="w-32 text-center text-sm font-medium tabular-nums">
        {format(month, "MMMM yyyy")}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(addMonths(month, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
