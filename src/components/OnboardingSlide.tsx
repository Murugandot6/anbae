import React from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';

interface OnboardingSlideProps {
  title: string;
  description: string;
  lottieData: any; // Lottie animation JSON data
  bgColorClass: string; // Tailwind class for background color
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ title, description, lottieData, bgColorClass }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center h-full w-full p-8 text-center", bgColorClass)}>
      <div className="w-64 h-64 mb-8"> {/* Adjust size as needed */}
        <Lottie animationData={lottieData} loop={true} autoplay={true} />
      </div>
      <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
      <p className="text-lg text-gray-700 dark:text-gray-300 max-w-md">{description}</p>
    </div>
  );
};

export default OnboardingSlide;