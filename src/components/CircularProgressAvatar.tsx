import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CircularProgressAvatarProps {
  score: number; // Expected to be between 0 and 100
  avatarUrl: string | null | undefined;
  fallbackText: string;
  altText: string;
  className?: string; // For additional styling on the container
  avatarClassName?: string; // For additional styling on the Avatar itself
}

const CircularProgressAvatar: React.FC<CircularProgressAvatarProps> = ({
  score,
  avatarUrl,
  fallbackText,
  altText,
  className,
  avatarClassName,
}) => {
  const radius = 40; // Radius of the circle
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (score / 100) * circumference;

  // Determine colors based on score
  const progressColor = score === 100 ? 'stroke-green-500 dark:stroke-green-400' : 'stroke-blue-500 dark:stroke-blue-400';
  const remainingColor = 'stroke-red-500 dark:stroke-red-400';

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        className="w-24 h-24 transform -rotate-90" // Adjust size to match avatar, rotate to start from top
        viewBox="0 0 100 100" // Standard viewBox for a 100x100 SVG
      >
        {/* Background circle (red part) */}
        <circle
          className={cn("stroke-current text-gray-200 dark:text-gray-700", remainingColor)}
          strokeWidth="8"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        {/* Progress circle (green/blue part) */}
        <circle
          className={cn("stroke-current transition-all duration-500 ease-in-out", progressColor)}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
      </svg>
      <Avatar className={cn("absolute w-20 h-20", avatarClassName)}> {/* Slightly smaller than SVG to show border */}
        <AvatarImage src={avatarUrl || ''} alt={altText} />
        <AvatarFallback>{fallbackText}</AvatarFallback>
      </Avatar>
    </div>
  );
};

export default CircularProgressAvatar;