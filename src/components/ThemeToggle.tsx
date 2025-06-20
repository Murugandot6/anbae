"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme, mounted } = useTheme(); // Destructure mounted

  // Only render the toggle once the component has mounted to prevent hydration errors
  if (!mounted) {
    return null; // Or a placeholder button if desired
  }

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === "dark" ? (
        <Moon className="h-[1.2rem] w-[1.2rem] text-gray-400 transition-colors" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500 fill-yellow-500 transition-colors" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}