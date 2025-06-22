import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CircularProgressAvatarProps {
  score: number; // Expected to be between 0 and 100
  avatarUrl: string | null | undefined;
  fallbackText: string;
  altText: string;
  className?: string; // For additional styling on the container
  size?: 'sm' | 'md' | 'lg' | 'xl'; // New size prop
}

const CircularProgressAvatar: React.FC<CircularProgressAvatarProps> = ({
  score,
  avatarUrl,
  fallbackText,
  altText,
  className,
  size = 'md', // Default size
}) => {
  const radius = 40; // Radius of the circle
  const circumference = 2 * Math.PI * radius;
  // The progressOffset is still calculated based on score, but we'll make both parts green
  const progressOffset = circumference - (score / 100) * circumference;

  // Determine colors based on score
  // Changed both progressColor and remainingColor to always be green
  const greenColorClasses = 'stroke-green-500 dark:stroke-green-400';

  let svgSizeClasses = 'w-24 h-24';
  let avatarSizeClasses = 'w-20 h-20';

  switch (size) {
    case 'sm':
      svgSizeClasses = 'w-20 h-20';
      avatarSizeClasses = 'w-16 h-16';
      break;
    case 'md': // Current default
      svgSizeClasses = 'w-24 h-24';
      avatarSizeClasses = 'w-20 h-20';
      break;
    case 'lg':
      svgSizeClasses = 'w-36 h-36'; // Increased size
      avatarSizeClasses = 'w-32 h-32'; // Increased size
      break;
    case 'xl':
      svgSizeClasses = 'w-48 h-48'; // Even larger
      avatarSizeClasses = 'w-44 h-44'; // Even larger
      break;
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        className={cn(svgSizeClasses, "transform -rotate-90")} // Adjust size to match avatar, rotate to start from top
        viewBox="0 0 100 100" // Standard viewBox for a 100x100 SVG
      >
        {/* Background circle (now always green) */}
        <circle
          className={cn("stroke-current text-gray-200 dark:text-gray-700", greenColorClasses)}
          strokeWidth="8"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        {/* Progress circle (now always green, effectively filling the whole circle) */}
        <circle
          className={cn("stroke-current transition-all duration-500 ease-in-out", greenColorClasses)}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset} // This will still animate, but the color is the same
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
      </svg>
      <Avatar className={cn("absolute", avatarSizeClasses)}> {/* Slightly smaller than SVG to show border */}
        <AvatarImage src={avatarUrl || ''} alt={altText} />
        <AvatarFallback>{fallbackText}</AvatarFallback>
      </Avatar>
    </div>
  );
};

export default CircularProgressAvatar;