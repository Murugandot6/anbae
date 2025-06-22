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
  
  // TEMPORARY: Force score to 50 for debugging visibility
  const debugScore = 50; 
  const progressOffset = circumference - (debugScore / 100) * circumference;

  // TEMPORARY: Use very contrasting colors and thick stroke for debugging
  const progressColorClasses = 'stroke-blue-500'; // Bright blue
  const remainingColorClasses = 'stroke-yellow-500'; // Bright yellow
  const debugStrokeWidth = 20; // Very thick stroke

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

  console.log('CircularProgressAvatar Debug: Score (forced):', debugScore, 'Avatar URL:', avatarUrl, 'Size:', size);
  console.log('CircularProgressAvatar Debug: Circumference:', circumference, 'Progress Offset:', progressOffset);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        className={cn(svgSizeClasses, "transform -rotate-90")}
        viewBox="0 0 100 100"
      >
        {/* Background (remaining) circle - always a full circle, colored yellow */}
        <circle
          className={remainingColorClasses}
          strokeWidth={debugStrokeWidth}
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
          strokeDasharray={circumference}
          strokeDashoffset={0}
        />
        {/* Progress circle - blue, covers the yellow based on score */}
        <circle
          className={cn("transition-all duration-500 ease-in-out", progressColorClasses)}
          strokeWidth={debugStrokeWidth}
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