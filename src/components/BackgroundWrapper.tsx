"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface BackgroundImageWrapperProps {
  children: React.ReactNode;
  className?: string;
  solid?: boolean; // New prop
}

function BackgroundWrapper({ children, className, solid = false }: BackgroundImageWrapperProps) {
  const { theme } = useTheme();
  
  const backgroundClasses = solid 
    ? 'bg-background' 
    : (theme === 'light' 
        ? 'bg-gradient-to-br from-background to-secondary/20' 
        : 'bg-gradient-to-br from-background to-primary/20');

  return (
    <div className={cn(
      "relative min-h-screen w-full overflow-auto",
      backgroundClasses
    )}>
      {!solid && (
        <div className="absolute inset-0 bg-black opacity-10 dark:opacity-30 z-10"></div>
      )}

      <div className={cn("relative z-20 min-h-screen flex flex-col items-center justify-start p-4 pt-20", className)}>
        {children}
      </div>
    </div>
  );
}

export default BackgroundWrapper;