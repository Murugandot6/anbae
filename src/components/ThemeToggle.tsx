"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost" // Using ghost variant for consistency with other buttons
      size="icon"
      aria-label="Toggle theme"
      className="p-2 rounded-md hover:bg-muted transition" // Applying the suggested styling
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-500 fill-yellow-500" /> // Adjusted icon size and color
      ) : (
        <Moon className="h-5 w-5 text-gray-400" /> // Adjusted icon size and color
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}