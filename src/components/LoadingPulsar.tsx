import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingPulsarProps {
  className?: string;
}

const LoadingPulsar: React.FC<LoadingPulsarProps> = ({ className }) => {
  return (
    <svg
      version="1.2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="110 50 328 140"
      className={cn("w-32 h-auto text-primary", className)}
    >
      <path
        d="M0,90L250,90Q257,60 262,87T267,95 270,88 273,92t6,35 7,-60T290,127 297,107s2,-11 10,-10 1,1 8,-10T319,95c6,4 8,-6 10,-17s2,10 9,11h210"
        stroke="currentColor"
        fill="none"
        strokeWidth="4"
        strokeLinejoin="round"
        className="animate-pulsar-dash"
        style={{ strokeDasharray: 281 }}
      />
    </svg>
  );
};

export default LoadingPulsar;