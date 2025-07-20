"use client";

import * as React from "react";
import { Moon, Sun, Leaf } from "lucide-react"; // Import Leaf icon
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Select onValueChange={setTheme} value={theme}>
      <SelectTrigger className="w-10 h-10 p-2 rounded-md hover:bg-muted transition bg-transparent border-none shadow-none">
        <SelectValue asChild>
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          ) : theme === "light" ? (
            <Moon className="h-5 w-5 text-gray-400" />
          ) : ( // Default or 'goblin' theme icon
            <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" /> // Use Leaf icon for goblin
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="system">System</SelectItem>
        <SelectItem value="goblin">Goblin</SelectItem> {/* New theme option */}
      </SelectContent>
    </Select>
  );
}