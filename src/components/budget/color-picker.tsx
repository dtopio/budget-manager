"use client";

import { PALETTE } from "@/lib/palette";
import { cn } from "@/lib/utils";

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110",
            value === color && "ring-2"
          )}
          style={{ backgroundColor: color, ["--tw-ring-color" as string]: color }}
          title={color}
        />
      ))}
    </div>
  );
}
