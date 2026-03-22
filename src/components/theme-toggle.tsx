"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const current = theme === "system" ? resolvedTheme : theme;
  const isDark = current === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 text-foreground hover:bg-accent transition-colors duration-300 border border-transparent hover:border-border",
        className
      )}
      suppressHydrationWarning
    >
      <span className="sr-only">Toggle theme</span>
      {mounted ? (
        isDark ? (
          <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} />
        ) : (
          <Moon className="w-[18px] h-[18px]" strokeWidth={1.5} />
        )
      ) : (
        <span className="block w-[18px] h-[18px]" />
      )}
    </button>
  );
}

