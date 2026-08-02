"use client";

import { availableIcons, getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function IconPicker({
  value,
  color,
  onChange,
}: {
  value: string;
  color: string;
  onChange: (icon: string) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-1.5 rounded-lg border border-input p-2 sm:grid-cols-10">
      {availableIcons.map((name) => {
        const Icon = getIcon(name);
        const selected = name === value;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent",
              selected && "ring-2 ring-offset-1 ring-offset-background"
            )}
            style={selected ? { backgroundColor: `${color}22`, ["--tw-ring-color" as string]: color } : undefined}
            title={name}
          >
            <Icon className="h-4 w-4" style={{ color: selected ? color : undefined }} />
          </button>
        );
      })}
    </div>
  );
}
