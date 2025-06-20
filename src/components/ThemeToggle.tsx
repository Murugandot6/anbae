"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme, mounted } = useTheme();

  console.log('ThemeToggle mounted:', mounted); // Keep these logs for debugging
  console.log('ThemeToggle theme:', theme);   // Keep these logs for debugging

  if (!mounted) {
    // Return a very obvious placeholder to ensure something is visible
    return (
      <div className="w-10 h-10 bg-red-500 flex items-center justify-center text-white text-xs rounded-full">
        Loading
      </div>
    );
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