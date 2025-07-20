"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile'; // Import the useIsMobile hook

interface BackgroundImageWrapperProps {
  children: React.ReactNode;
  className?: string;
  solid?: boolean; // New prop
}

function BackgroundWrapper({ children, className, solid = false }: BackgroundImageWrapperProps) {
  const { theme } = useTheme();
  const isMobile = useIsMobile(); // Use the hook to detect mobile

  // Determine if a background image should be used
  const useBackgroundImage = theme === 'goblin' && !solid;

  // Determine the correct background image URL based on mobile status
  const backgroundImage = isMobile ? '/images/goblinmob.jpg' : '/images/goblin.jpg';

  return (
    <div className="relative min-h-screen w-full"> {/* Main container, no overflow-auto here */}
      {/* Background Layer (fixed to viewport) */}
      {useBackgroundImage ? (
        <div 
          className="fixed inset-0 w-full h-full bg-cover bg-no-repeat bg-center z-0" // Fixed background layer
          style={{ backgroundImage: `url("${backgroundImage}")` }} // Use the determined image
        >
          <div className="absolute inset-0 bg-black opacity-10 dark:opacity-30"></div> {/* Overlay for fixed background */}
        </div>
      ) : (
        <div className={cn(
          "fixed inset-0 w-full h-full z-0",
          solid 
            ? 'bg-background' 
            : (theme === 'light' 
                ? 'bg-gradient-to-br from-background to-secondary/20' 
                : 'bg-gradient-to-br from-background to-primary/20')
        )}>
          {!solid && ( // Apply overlay only for gradients
            <div className="absolute inset-0 bg-black opacity-10 dark:opacity-30"></div>
          )}
        </div>
      )}

      {/* Content Layer (scrollable if needed) */}
      <div className={cn("relative z-10 min-h-screen flex flex-col items-center justify-start p-4 pt-20", className)}>
        {children}
      </div>
    </div>
  );
}

export default BackgroundWrapper;