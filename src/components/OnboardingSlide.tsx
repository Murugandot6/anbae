import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';

interface OnboardingSlideProps {
  title: string;
  description: string;
  lottieUrl?: string; // Made optional
  bgColorClass: string; // Tailwind class for background color
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ title, description, lottieUrl, bgColorClass }) => {
  const [animationData, setAnimationData] = useState<any | null>(null);
  const [loadingLottie, setLoadingLottie] = useState(false); // Default to false, only load if URL exists
  const [errorLottie, setErrorLottie] = useState<string | null>(null);

  useEffect(() => {
    if (!lottieUrl) { // If no Lottie URL, no need to fetch
      setLoadingLottie(false);
      setAnimationData(null);
      return;
    }

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

    fetchLottieData();
  }, [lottieUrl]);

  return (
    <div className={cn("flex flex-col items-center justify-center h-full w-full p-8 text-center", bgColorClass)}>
      {lottieUrl && ( // Only render Lottie container if lottieUrl is provided
        <div className="w-64 h-64 mb-8"> {/* Adjust size as needed */}
          {loadingLottie ? (
            <div className="flex items-center justify-center h-full text-gray-600">Loading animation...</div>
          ) : errorLottie ? (
            <div className="flex items-center justify-center h-full text-red-600">{errorLottie}</div>
          ) : animationData ? (
            <Lottie animationData={animationData} loop={true} autoplay={true} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600">No animation data.</div>
          )}
        </div>
      )}
      <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2>
      <p className="text-lg text-gray-700 max-w-md">{description}</p>
    </div>
  );
};

export default OnboardingSlide;