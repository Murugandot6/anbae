import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import useEmblaCarousel from 'embla-carousel-react';
import OnboardingSlide from '@/components/OnboardingSlide';

// Import Lottie JSON data
import travelLottie from '/lottie/travel.json';
import relaxLottie from '/lottie/relax.json';
import paymentLottie from '/lottie/payment.json';

const OnboardingWelcome: React.FC = () => {
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const slidesData = [
    {
      title: "We will take care",
      description: "of tickets, transfers and a cool place to stay",
      lottieData: travelLottie,
      bgColorClass: "bg-yellow-400",
    },
    {
      title: "Relax & enjoy",
      description: "Sunbathe, swim, eat and drink deliciously",
      lottieData: relaxLottie,
      bgColorClass: "bg-blue-300",
    },
    {
      title: "Flexible payment",
      description: "credit card and transfer, cryptocurrency",
      lottieData: paymentLottie,
      bgColorClass: "bg-pink-300",
    },
  ];

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  const handleSkip = () => {
    navigate('/dashboard'); // Navigate to dashboard or login after skipping
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="absolute top-4 left-4 z-20">
        <Button variant="ghost" onClick={handleSkip} className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
          Skip
        </Button>
      </div>

      <div className="embla flex-1 overflow-hidden">
        <div className="embla__viewport h-full" ref={emblaRef}>
          <div className="embla__container flex h-full">
            {slidesData.map((slide, index) => (
              <div className="embla__slide flex-[0_0_100%] min-w-0 h-full" key={index}>
                <OnboardingSlide {...slide} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
        <Button
          onClick={scrollPrev}
          disabled={prevBtnDisabled}
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 text-gray-800 dark:text-white hover:bg-white dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <Button
          onClick={scrollNext}
          disabled={nextBtnDisabled}
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 text-gray-800 dark:text-white hover:bg-white dark:hover:bg-gray-700"
        >
          <ArrowRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingWelcome;