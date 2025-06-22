"use client";

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AvatarCarouselProps {
  selectedAvatar: string | null;
  onSelect: (avatarUrl: string) => void;
  numAvatars?: number; // Optional prop to specify number of avatars per type (e.g., 10 romeo, 10 juliet)
}

const AvatarCarousel: React.FC<AvatarCarouselProps> = ({ selectedAvatar, onSelect, numAvatars = 10 }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeAvatarPath, setActiveAvatarPath] = useState<string | null>(null); // New state for the visually active avatar

  const avatarPaths: string[] = [];
  const prefixes = ['romeo', 'juliet'];

  for (let i = 1; i <= numAvatars; i++) {
    prefixes.forEach(prefix => {
      avatarPaths.push(`/avatars/${i}${prefix}.jpg`);
    });
  }

  const updateCarouselState = useCallback(() => {
    if (!emblaApi) return;
    const newIndex = emblaApi.selectedScrollSnap();
    setSelectedIndex(newIndex);
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
    const currentActivePath = avatarPaths[newIndex];
    setActiveAvatarPath(currentActivePath);
  }, [emblaApi, avatarPaths]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', updateCarouselState);
    emblaApi.on('reInit', updateCarouselState);

    const initialIndex = avatarPaths.findIndex(path => path === selectedAvatar);
    if (initialIndex !== -1) {
      emblaApi.scrollTo(initialIndex, false);
      setActiveAvatarPath(selectedAvatar);
    } else {
      setActiveAvatarPath(avatarPaths[0] || null);
    }
    updateCarouselState(); 

    return () => {
      emblaApi.off('select', updateCarouselState);
      emblaApi.off('reInit', updateCarouselState);
    };
  }, [emblaApi, updateCarouselState, selectedAvatar, avatarPaths]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex -ml-4"> {/* Negative margin to offset padding */}
          {avatarPaths.map((path, index) => (
            <div
              className="embla__slide flex-shrink-0 flex-grow-0 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 pl-4" // Reverted basis for multiple items
              key={path}
            >
              <div
                className={cn(
                  "relative cursor-pointer transition-all duration-200 p-1 rounded-full", // Added padding and rounded-full
                  activeAvatarPath === path ? "ring-4 ring-blue-600 dark:ring-purple-500" : "hover:ring-2 hover:ring-blue-500 dark:hover:ring-purple-400", // Use activeAvatarPath for visual
                )}
                onClick={() => onSelect(path)} // onSelect is only called when an avatar is clicked
              >
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 aspect-square overflow-hidden block flex-shrink-0 rounded-full">
                  <AvatarImage src={path} alt={`Avatar ${path.split('/').pop()?.split('.')[0]}`} className="object-cover" />
                  <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    AV
                  </AvatarFallback>
                </Avatar>
                {activeAvatarPath === path && ( // Use activeAvatarPath for checkmark
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-full">
                    <span className="text-white text-2xl">✓</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        className="embla__button embla__button--prev absolute left-0 top-1/2 -translate-y-1/2 bg-gray-800/50 hover:bg-gray-700/70 text-white rounded-full w-8 h-8 p-0 flex items-center justify-center z-10"
        onClick={scrollPrev}
        disabled={prevBtnDisabled}
        variant="ghost"
        size="icon"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <Button
        type="button"
        className="embla__button embla__button--next absolute right-0 top-1/2 -translate-y-1/2 bg-gray-800/50 hover:bg-gray-700/70 text-white rounded-full w-8 h-8 p-0 flex items-center justify-center z-10"
        onClick={scrollNext}
        disabled={nextBtnDisabled}
        variant="ghost"
        size="icon"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default AvatarCarousel;