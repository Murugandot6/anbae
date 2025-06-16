"use client";

import * as React from "react";
import { Lightbulb } from "lucide-react"; // Changed from Moon/Sun to Lightbulb
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      <Lightbulb
        className={`h-[1.2rem] w-[1.2rem] transition-colors ${
          theme === "dark" ? "text-gray-400" : "text-yellow-500 fill-yellow-500"
        }`}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}