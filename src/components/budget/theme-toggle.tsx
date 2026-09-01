"use client";

import { Moon, Sun, Palette as PaletteIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PALETTES, useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { palette, mode, setPalette, toggleMode, ready } = useTheme();

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger
          render={<Button variant="outline" size="icon" className="h-8 w-8" aria-label="Change colour theme" />}
        >
          <PaletteIcon className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-44">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Colour theme</p>
          <div className="space-y-1">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPalette(p.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                  ready && palette === p.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                )}
              >
                <span className="flex h-5 w-5 shrink-0 overflow-hidden rounded-full border border-border/60">
                  {p.swatch.map((c) => (
                    <span key={c} className="h-full w-1/2" style={{ backgroundColor: c }} />
                  ))}
                </span>
                <span className="flex-1 text-left">{p.label}</span>
                {ready && palette === p.id && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
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
        {/* Both icons render; CSS picks one so the button is correct before hydration. */}
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="hidden h-4 w-4 dark:block" />
      </Button>
    </div>
  );
}
