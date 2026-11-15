"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Icon } from "@/components/atoms/icons";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <button
      aria-label="Toggle color theme"
      className="theme-toggle grid size-9 place-items-center rounded-ctl border border-line bg-card text-muted shadow-sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {mounted ? (
        <Icon name={resolvedTheme === "dark" ? "sun" : "moon"} className="size-4" />
      ) : (
        <span className="size-4" />
      )}
    </button>
  );
}
