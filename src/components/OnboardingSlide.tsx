import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';

interface OnboardingSlideProps {
  title: string;
  description: string;
  lottieUrl: string; // Changed from lottieData to lottieUrl
  bgColorClass: string; // Tailwind class for background color
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ title, description, lottieUrl, bgColorClass }) => {
  const [animationData, setAnimationData] = useState<any | null>(null);
  const [loadingLottie, setLoadingLottie] = useState(true);
  const [errorLottie, setErrorLottie] = useState<string | null>(null);

  useEffect(() => {
    const fetchLottieData = async () => {
      setLoadingLottie(true);
      setErrorLottie(null);
      try {
        const response = await fetch(lottieUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAnimationData(data);
      } catch (error: any) {
        console.error('Error loading Lottie animation:', error);
        setErrorLottie(`Failed to load animation: ${error.message}`);
      } finally {
        setLoadingLottie(false);
      }
    };

    if (lottieUrl) {
      fetchLottieData();
    }
  }, [lottieUrl]);

  return (
    <div className={cn("flex flex-col items-center justify-center h-full w-full p-8 text-center", bgColorClass)}>
      <div className="w-64 h-64 mb-8"> {/* Adjust size as needed */}
        {loadingLottie ? (
          <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">Loading animation...</div>
        ) : errorLottie ? (
          <div className="flex items-center justify-center h-full text-red-600 dark:text-red-400">{errorLottie}</div>
        ) : animationData ? (
          <Lottie animationData={animationData} loop={true} autoplay={true} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">No animation data.</div>
        )}
      </div>
      <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2> {/* Removed dark:text-white */}
      <p className="text-lg text-gray-700 max-w-md">{description}</p> {/* Removed dark:text-gray-300 */}
    </div>
  );
};

export default OnboardingSlide;