import React from 'react';
    import { useTheme } from 'next-themes';
    import { cn } from '@/lib/utils';

    interface BackgroundImageWrapperProps {
      children: React.ReactNode;
      className?: string; // For additional styling on the content wrapper
    }

    const BackgroundImageWrapper: React.FC<BackgroundImageWrapperProps> = ({ children, className }) => {
      const { theme } = useTheme();

      const backgroundImageClass = theme === 'dark'
        ? 'bg-[url("/images/dark.jpg")]'
        : 'bg-[url("/images/light.jpg")]';

      return (
        <div className={cn("relative min-h-screen w-full overflow-hidden", backgroundImageClass, "bg-cover bg-center bg-fixed")}>
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-black opacity-20 dark:opacity-40"></div>
          {/* Content wrapper */}
          <div className={cn("relative z-10 min-h-screen flex flex-col items-center justify-center p-4", className)}>
            {children}
          </div>
        </div>
      );
    };

    export default BackgroundImageWrapper;