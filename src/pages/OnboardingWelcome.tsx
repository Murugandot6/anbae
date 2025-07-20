import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaOptionsType } from 'embla-carousel'; // Corrected import path for the type
import Autoplay from 'embla-carousel-autoplay';
import Fade from 'embla-carousel-fade';
import OnboardingSlide from '@/components/OnboardingSlide';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';

// Import Lottie JSON data with ?url suffix
import pinkyPromiseLottie from '/lottie/Pinky Promise.json?url';
import cobotLottie from '/lottie/Cobot.json?url';
import loveFilledFlutesLottie from '/lottie/Love-Filled Flutes.json?url';
import djPartyLottie from '/lottie/DJ Party.json?url';
import resetPasswordLottie from '/lottie/Reset Password.json?url';
import hotStoneRelaxationLottie from '/lottie/Hot Stone Relaxation.json?url';


const OnboardingWelcome: React.FC = () => {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false); // New state for exit animation
  
  // Embla Carousel options for fade effect
  const options: EmblaOptionsType = { 
    loop: false,
    dragFree: false, // Disable dragging if you only want button navigation
  };
  
  // Initialize Embla Carousel with the Fade plugin
  const [emblaRef, emblaApi] = useEmblaCarousel(options, [Fade()]);

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const slidesData = [
    {
      title: "Your Personalized Hub",
      description: "Here you'll find your Lifetime Score, a gentle whisper of your communication health. See your and your partner's profiles, a glance at the souls intertwined, and a timeline of recent messages, the thoughts you've recently shared.",
      lottieUrl: pinkyPromiseLottie,
      bgColorClass: "bg-purple-300",
    },
    {
      title: "Speak from the Heart",
      description: "This is where your feelings take flight. Send Grievances to address conflicts openly, or shower your partner with Compliments to show appreciation. Relive cherished Good Memories, or simply express How I Feel in the moment.",
      lottieUrl: cobotLottie,
      bgColorClass: "bg-red-300",
    },
    {
      title: "Your Conversation Hub",
      description: "You'll find a flowing river of all your communications, keeping track of every conversation. You can easily reply to messages and mark them as read, ensuring you stay connected.",
      lottieUrl: loveFilledFlutesLottie,
      bgColorClass: "bg-blue-300",
    },
    {
      title: "Craft Your Presence",
      description: "This section allows you to personalize your experience. Update your nickname, link to your partner's account by their email, give your partner a special nickname, and choose a unique avatar to represent you.",
      lottieUrl: djPartyLottie,
      bgColorClass: "bg-green-300",
    },
    {
      title: "A Fresh Start",
      description: "Need a clean slate? This feature lets you send a request to your partner to clear your entire message history. This provides a fresh start, but remember, it requires mutual agreement.",
      lottieUrl: resetPasswordLottie,
      bgColorClass: "bg-orange-300",
    },
    {
      title: "Your View, Your Way",
      description: "With this toggle, you can switch between light and dark modes to suit your preference, making your app experience comfortable for your eyes, day or night.",
      lottieUrl: hotStoneRelaxationLottie,
      bgColorClass: "bg-gray-300",
    },
  ];

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((emblaApi: any) => {
    const newSelectedIndex = emblaApi.selectedScrollSnap();
    const canScrollPrev = emblaApi.canScrollPrev();
    const canScrollNext = emblaApi.canScrollNext();

    setSelectedIndex(newSelectedIndex);
    setPrevBtnDisabled(!canScrollPrev);
    setNextBtnDisabled(!canScrollNext);
  }, []);

  // New callback for when a slide's typing animation completes
  const handleSlideTypingComplete = useCallback((slideIndex: number) => {
    const isLastSlide = slideIndex === slidesData.length - 1;
    const delayBeforeNext = 1500; // 1.5 seconds pause after typing finishes

    if (isLastSlide) {
      setIsExiting(true); // Trigger fade-out
      setTimeout(() => {
        navigate('/dashboard');
      }, 500); // Match animation duration
    } else {
      setTimeout(() => {
        emblaApi?.scrollNext();
      }, delayBeforeNext);
    }
  }, [emblaApi, navigate, slidesData.length]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }
    onSelect(emblaApi); // Initial update of button states
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  const handleSkip = () => {
    setIsExiting(true); // Trigger fade-out
    setTimeout(() => {
      navigate('/dashboard'); // Navigate after animation
    }, 500); // Match animation duration
  };

  return (
    <>
      <Helmet>
        <title>Welcome to Anbae - Onboarding</title>
        <meta name="description" content="Learn about Anbae's features and how to use the app to enhance your relationship." />
      </Helmet>
      <div className={cn("relative h-screen w-screen overflow-hidden flex flex-col", isExiting ? "animate-fade-out" : "animate-fade-in")}>
        <div className="absolute top-3 right-3 z-20">
          {/* Removed ThemeToggle */}
        </div>
        <div className="absolute top-3 left-3 z-20">
          <Button variant="ghost" onClick={handleSkip} className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm px-3 py-1.5 h-auto">
            Skip
          </Button>
        </div>

        <div className="embla flex-1 overflow-hidden">
          <div className="embla__viewport h-full bg-blue-100 dark:bg-blue-900" ref={emblaRef}>
            <div className="embla__container flex h-full">
              {slidesData.map((slide, index) => (
                <div
                  className="embla__slide h-full"
                  key={index}
                >
                  <OnboardingSlide
                    {...slide}
                    onTypingComplete={() => handleSlideTypingComplete(index)} // Pass the callback
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
          <Button
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
            variant="outline"
            size="icon"
            className="rounded-full w-10 h-10 sm:w-12 sm:h-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 text-gray-800 dark:text-white hover:bg-white dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
          <Button
            onClick={scrollNext}
            disabled={nextBtnDisabled}
            variant="outline"
            size="icon"
            className="rounded-full w-10 h-10 sm:w-12 sm:h-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 text-gray-800 dark:text-white hover:bg-white dark:hover:bg-gray-700"
          >
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default OnboardingWelcome;