"use client";

import { Moon, Sun, Palette as PaletteIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "@/components/theme-provider";
import { THEME_SWATCHES } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { palette, mode, setPalette, toggleMode, ready } = useTheme();

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Change colour theme"
            />
          }
        >
          <PaletteIcon className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Colour theme</p>
          <div className="space-y-1">
            {THEME_SWATCHES.map((t) => {
              const selected = ready && palette === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPalette(t.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    selected
                      ? "bg-[color-mix(in_oklch,var(--primary)_18%,transparent)] font-medium text-foreground ring-1 ring-[color-mix(in_oklch,var(--primary)_45%,transparent)]"
                      : "text-foreground/85 hover:bg-[color-mix(in_oklch,var(--foreground)_7%,transparent)]"
                  )}
                >
                  <span className="flex h-5 w-5 shrink-0 overflow-hidden rounded-full border border-border/60">
                    {t.colors.map((c) => (
                      <span key={c} className="h-full flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </span>
                  <span className="flex-1 text-left">{t.label}</span>
                  {selected && <Check className="h-3.5 w-3.5 text-[var(--primary)]" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={toggleMode}
        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {/* Both render; CSS picks one so the icon is right before hydration too. */}
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="hidden h-4 w-4 dark:block" />
      </Button>
    </div>
  );
}
