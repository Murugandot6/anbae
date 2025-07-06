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
  
  // Use the actual score passed in props
  const progressOffset = circumference - (score / 100) * circumference;

  // Using new color variables for progress and remaining parts
  const progressColorClasses = 'stroke-score-positive'; // Green for the score
  const remainingColorClasses = 'stroke-score-negative'; // Red for the remaining part
  const currentStrokeWidth = 12; // Keeping it at 12px for better visibility

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
        className={cn(svgSizeClasses, "transform -rotate-90")}
        viewBox="0 0 100 100"
      >
        {/* Background (remaining) circle - always a full circle, colored red */}
        <circle
          className={remainingColorClasses}
          strokeWidth={currentStrokeWidth}
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
          strokeDasharray={circumference}
          strokeDashoffset={0}
        />
        {/* Progress circle - green, covers the red based on score */}
        <circle
          className={cn("transition-all duration-500 ease-in-out", progressColorClasses)}
          strokeWidth={currentStrokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
      </svg>
      <Avatar className={cn("absolute", avatarSizeClasses)}>
        <AvatarImage src={avatarUrl || ''} alt={altText} />
        <AvatarFallback>{fallbackText}</AvatarFallback>
      </Avatar>
    </div>
  );
};

export default CircularProgressAvatar;