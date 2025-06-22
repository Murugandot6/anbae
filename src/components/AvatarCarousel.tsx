"use client";

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AvatarCarouselProps {
  selectedAvatar: string | null;
  onSelect: (avatarUrl: string) => void;
  numAvatars?: number; // Optional prop to specify number of avatars per type (e.g., 10 romeo, 10 juliet)
}

const AvatarCarousel: React.FC<AvatarCarouselProps> = ({ selectedAvatar, onSelect, numAvatars = 10 }) => {
  const [activeAvatarPath, setActiveAvatarPath] = useState<string | null>(null);

  const avatarPaths: string[] = [];
  const prefixes = ['romeo', 'juliet'];

  for (let i = 1; i <= numAvatars; i++) {
    prefixes.forEach(prefix => {
      avatarPaths.push(`/avatars/${i}${prefix}.jpg`);
    });
  }

  useEffect(() => {
    // Set initial active avatar based on prop
    setActiveAvatarPath(selectedAvatar);
  }, [selectedAvatar]);

  const handleAvatarClick = (path: string) => {
    setActiveAvatarPath(path); // Update visual active state
    onSelect(path); // Call the parent's onSelect to update the form
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="grid grid-cols-2 gap-4 p-4"> {/* Changed to grid-cols-2 */}
        {avatarPaths.map((path) => (
          <div
            key={path}
            className={cn(
              "relative cursor-pointer transition-all duration-200 p-1 rounded-full",
              activeAvatarPath === path ? "ring-4 ring-blue-600 dark:ring-purple-500" : "hover:ring-2 hover:ring-blue-500 dark:hover:ring-purple-400",
            )}
            onClick={() => handleAvatarClick(path)}
          >
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 aspect-square overflow-hidden block flex-shrink-0 rounded-full">
              <AvatarImage src={path} alt={`Avatar ${path.split('/').pop()?.split('.')[0]}`} className="object-cover" />
              <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                AV
              </AvatarFallback>
            </Avatar>
            {activeAvatarPath === path && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-full">
                <span className="text-white text-2xl">✓</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvatarCarousel;