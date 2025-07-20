"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class" // Crucial for Tailwind CSS dark mode
      defaultTheme="system"
      enableSystem // Allows system preference to dictate initial theme
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}