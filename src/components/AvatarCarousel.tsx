"use client";

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AvatarCarouselProps {
  selectedAvatar: string | null;
  onSelect: (avatarUrl: string) => void;
  numAvatars?: number;
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
    setActiveAvatarPath(selectedAvatar);
  }, [selectedAvatar]);

  const handleAvatarClick = (path: string) => {
    setActiveAvatarPath(path);
    onSelect(path);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 justify-items-center">
        {avatarPaths.map((path) => (
          <div
            key={path}
            className={cn(
              "relative cursor-pointer transition-all duration-200 p-1 rounded-full shadow-md",
              activeAvatarPath === path ? "ring-4 ring-primary dark:ring-primary" : "hover:ring-2 hover:ring-accent dark:hover:ring-accent",
            )}
            onClick={() => handleAvatarClick(path)}
          >
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 aspect-square overflow-hidden block flex-shrink-0 rounded-full border-2 border-transparent">
              <AvatarImage src={path} alt={`Avatar ${path.split('/').pop()?.split('.')[0]}`} className="object-cover" />
              <AvatarFallback className="bg-muted text-muted-foreground">
                AV
              </AvatarFallback>
            </Avatar>
            {activeAvatarPath === path && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/30 rounded-full">
                <span className="text-primary-foreground text-2xl">✓</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvatarCarousel;