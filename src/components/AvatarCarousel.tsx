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
    if (!emblaApi) {
      console.log('updateCarouselState: emblaApi not ready.');
      return;
    }
    const newIndex = emblaApi.selectedScrollSnap();
    setSelectedIndex(newIndex);
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
    const currentActivePath = avatarPaths[newIndex];
    setActiveAvatarPath(currentActivePath);
    console.log('--- updateCarouselState triggered ---');
    console.log('  newIndex:', newIndex);
    console.log('  currentActivePath (from array):', currentActivePath);
    console.log('  activeAvatarPath state set to:', currentActivePath);
    console.log('-----------------------------------');
  }, [emblaApi, avatarPaths]);

  const scrollPrev = useCallback(() => {
    console.log('User clicked scrollPrev');
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    console.log('User clicked scrollNext');
    emblaApi?.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    console.log('AvatarCarousel useEffect ran. selectedAvatar prop:', selectedAvatar);
    if (!emblaApi) {
      console.log('AvatarCarousel useEffect: emblaApi not ready on initial render.');
      return;
    }

    // Attach listeners
    emblaApi.on('select', updateCarouselState);
    emblaApi.on('reInit', updateCarouselState);

    // Initial setup: set active avatar and scroll to selected if available
    const initialIndex = avatarPaths.findIndex(path => path === selectedAvatar);
    if (initialIndex !== -1) {
      emblaApi.scrollTo(initialIndex, false); // false for no animation
      setActiveAvatarPath(selectedAvatar); // Set initial active avatar
      console.log('Initial setup: selectedAvatar found, scrolling to index', initialIndex, 'and setting activeAvatarPath to', selectedAvatar);
    } else {
      // If no selectedAvatar or not found, set the first avatar as active
      setActiveAvatarPath(avatarPaths[0] || null);
      console.log('Initial setup: selectedAvatar not found, setting activeAvatarPath to first avatar', avatarPaths[0]);
    }
    // Call updateCarouselState immediately after initial scroll/active path setup
    // This ensures prev/next buttons are correctly enabled/disabled and activeAvatarPath is set based on current snap
    updateCarouselState(); 

    return () => {
      console.log('AvatarCarousel useEffect cleanup: removing listeners.');
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
              className="embla__slide flex-shrink-0 flex-grow-0 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 pl-4" // Adjust basis for number of visible items
              key={path}
            >
              <div
                className={cn(
                  "relative cursor-pointer transition-all duration-200 p-1 rounded-full", // Added padding and rounded-full
                  activeAvatarPath === path ? "ring-4 ring-blue-600 dark:ring-purple-500" : "hover:ring-2 hover:ring-blue-500 dark:hover:ring-purple-400", // Use activeAvatarPath for visual
                )}
                onClick={() => {
                  console.log('Avatar clicked:', path);
                  onSelect(path); // onSelect is only called when an avatar is clicked
                }}
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
        className="embla__button embla__button--prev absolute left-0 top-1/2 -translate-y-1/2 bg-gray-800/50 hover:bg-gray-700/70 text-white rounded-full w-8 h-8 p-0 flex items-center justify-center z-10"
        onClick={scrollPrev}
        disabled={prevBtnDisabled}
        variant="ghost"
        size="icon"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <Button
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