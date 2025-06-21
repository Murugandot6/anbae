import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface BackgroundImageWrapperProps {
  children: React.ReactNode;
  className?: string; // For additional styling on the content wrapper
}

const BackgroundImageWrapper: React.FC<BackgroundImageWrapperProps> = ({ children, className }) => {
  const { theme } = useTheme();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Light Theme Background */}
      <div
        className={cn(
          "absolute inset-0 w-full h-full bg-[url('/images/light.jpg')] bg-cover bg-center bg-fixed transition-opacity duration-1000 ease-in-out",
          theme === 'light' ? 'opacity-100' : 'opacity-0'
        )}
      ></div>

      {/* Dark Theme Background */}
      <div
        className={cn(
          "absolute inset-0 w-full h-full bg-[url('/images/dark.jpg')] bg-cover bg-center bg-fixed transition-opacity duration-1000 ease-in-out",
          theme === 'dark' ? 'opacity-100' : 'opacity-0'
        )}
      ></div>

      {/* Overlay for readability (on top of backgrounds) */}
      <div className="absolute inset-0 bg-black opacity-20 dark:opacity-40 z-10"></div>

      {/* Content wrapper (on top of overlay and backgrounds) */}
      <div className={cn("relative z-20 min-h-screen flex flex-col items-center justify-center p-4", className)}>
        {children}
      </div>
    </div>
  );
};

export default BackgroundImageWrapper;