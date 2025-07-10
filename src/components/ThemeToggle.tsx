"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  // Removed isClientMounted state and useEffect for simpler client-side rendering.

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {/* Wrap both the icon and the sr-only span in a single parent span */}
      <span>
        {theme === "dark" ? (
          <Moon className="h-[1.2rem] w-[1.2rem] text-gray-400 transition-colors" />
        ) : (
          <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500 fill-yellow-500 transition-colors" />
        )}
        <span className="sr-only">Toggle theme</span>
      </span>
    </Button>
  );
}