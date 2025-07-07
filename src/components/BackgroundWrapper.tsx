"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface BackgroundImageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

function BackgroundWrapper({ children, className }: BackgroundImageWrapperProps) {
  const { theme } = useTheme();
  
  return (
    <div className={cn(
      "relative min-h-screen w-full overflow-auto", // Changed overflow-hidden to overflow-auto
      theme === 'light' ? 'bg-gradient-to-br from-background to-secondary/20' : 'bg-gradient-to-br from-background to-primary/20'
    )}>
      {/* Overlay for readability (on top of backgrounds) - Adjusted opacity for new palette */}
      <div className="absolute inset-0 bg-black opacity-10 dark:opacity-30 z-10"></div>

      {/* Content wrapper (on top of overlay and backgrounds) */}
      {/* Changed h-screen to min-h-screen to allow content to push height */}
      <div className={cn("relative z-20 min-h-screen flex flex-col items-center justify-start p-4 pt-20", className)}>
        {children}
      </div>
    </div>
  );
}

export default BackgroundWrapper;