import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';

interface OnboardingSlideProps {
  title: string;
  description: string;
  lottieUrl?: string; // Made optional
  bgColorClass: string; // Tailwind class for background color
  onTypingComplete?: () => void; // New prop for typing completion callback
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ title, description, lottieUrl, bgColorClass, onTypingComplete }) => {
  const [animationData, setAnimationData] = useState<any | null>(null);
  const [loadingLottie, setLoadingLottie] = useState(false);
  const [errorLottie, setErrorLottie] = useState<string | null>(null);
  const [displayedDescription, setDisplayedDescription] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  const typingSpeed = 30; // Speed in milliseconds per character

  useEffect(() => {
    if (!lottieUrl) {
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
        setErrorLottie(`Failed to load animation: ${error.message}`);
      } finally {
        setLoadingLottie(false);
      }
    };

    fetchLottieData();
  }, [lottieUrl, title]);

  // Typing animation effect
  useEffect(() => {
    setDisplayedDescription(''); // Reset displayed text when description changes
    setIsTypingComplete(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < description.length) {
        setDisplayedDescription((prev) => prev + description.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        setIsTypingComplete(true);
        onTypingComplete?.(); // Call the callback when typing is complete
      }
    }, typingSpeed);

    return () => clearInterval(timer); // Cleanup on unmount or description change
  }, [description, typingSpeed, onTypingComplete]); // Added onTypingComplete to dependencies

  return (
    <div className={cn("flex flex-col items-center justify-center h-full w-full p-6 sm:p-8 text-center", bgColorClass)}>
      {lottieUrl && (
        <div className="w-48 h-48 sm:w-64 sm:h-64 mb-6 sm:mb-8">
          {loadingLottie ? (
            <div className="flex items-center justify-center h-full text-gray-600">Loading animation...</div>
          ) : errorLottie ? (
            <div className="flex items-center justify-center h-full text-red-600 text-sm sm:text-base">{errorLottie}</div>
          ) : animationData ? (
            <Lottie animationData={animationData} loop={true} autoplay={true} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm sm:text-base">No animation data.</div>
          )}
        </div>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{title}</h2>
      <p className="text-base sm:text-lg text-gray-700 max-w-md">
        {displayedDescription}
        {!isTypingComplete && <span className="animate-pulse">|</span>} {/* Typing cursor */}
      </p>
    </div>
  );
};

export default OnboardingSlide;