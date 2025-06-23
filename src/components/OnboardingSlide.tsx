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
  const [loadingLottie, setLoadingLottie] = useState(false);
  const [errorLottie, setErrorLottie] = useState<string | null>(null);

  useEffect(() => {
    console.log(`OnboardingSlide: Component "${title}" mounted/re-rendered.`);
  }, [title]);

  console.log(`OnboardingSlide: Rendering for title "${title}" with bgColorClass "${bgColorClass}"`);
  console.log(`OnboardingSlide: lottieUrl: ${lottieUrl}`);

  useEffect(() => {
    if (!lottieUrl) {
      setLoadingLottie(false);
      setAnimationData(null);
      console.log(`OnboardingSlide: No lottieUrl provided for "${title}".`);
      return;
    }

    const fetchLottieData = async () => {
      setLoadingLottie(true);
      setErrorLottie(null);
      console.log(`OnboardingSlide: Fetching Lottie data from ${lottieUrl} for "${title}"`);
      try {
        const response = await fetch(lottieUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAnimationData(data);
        console.log(`OnboardingSlide: Lottie data fetched successfully for "${title}".`);
      } catch (error: any) {
        console.error(`OnboardingSlide: Error loading Lottie animation for "${title}":`, error);
        setErrorLottie(`Failed to load animation: ${error.message}`);
      } finally {
        setLoadingLottie(false);
      }
    };

    fetchLottieData();
  }, [lottieUrl, title]);

  return (
    <div className={cn("flex flex-col items-center justify-center h-full w-full p-8 text-center animate-fade-in", bgColorClass)}> {/* Added animate-fade-in here */}
      {lottieUrl && (
        <div className="w-64 h-64 mb-8">
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
      <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2> {/* Removed animate-fade-in from here */}
      <p className="text-lg text-gray-700 max-w-md delay-200">{description}</p> {/* Removed animate-fade-in from here */}
    </div>
  );
};

export default OnboardingSlide;