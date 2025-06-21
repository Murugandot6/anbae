import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

interface AvatarSelectorProps {
  selectedAvatar: string | null;
  onSelect: (avatarUrl: string) => void;
  numAvatars?: number; // Optional prop to specify number of avatars per type (e.g., 10 romeo, 10 juliet)
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ selectedAvatar, onSelect, numAvatars = 10 }) => {
  const avatarPaths: string[] = [];
  const prefixes = ['romeo', 'juliet']; // Define the prefixes for your avatar types

  // Changed the loop order to interleave romeo and juliet avatars
  for (let i = 1; i <= numAvatars; i++) {
    prefixes.forEach(prefix => {
      avatarPaths.push(`/avatars/${i}${prefix}.jpg`);
    });
  }

  // Define a set of vibrant background colors to cycle through
  const backgroundColors = [
    'bg-yellow-300', 'bg-pink-300', 'bg-blue-300', 'bg-green-300', 'bg-purple-300',
    'bg-orange-300', 'bg-teal-300', 'bg-indigo-300', 'bg-red-300', 'bg-lime-300'
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-4 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 justify-items-center">
      {avatarPaths.map((path, index) => {
        const bgColor = backgroundColors[index % backgroundColors.length]; // Cycle through colors
        return (
          <div
            key={path}
            className={cn(
              "relative cursor-pointer transition-all duration-200",
              // The outer div handles the ring effect and overall clickable area
              selectedAvatar === path ? "ring-4 ring-blue-600 dark:ring-purple-500" : "hover:ring-2 hover:ring-blue-500 dark:hover:ring-purple-400",
              // Ensure the outer div is also rounded to match the inner avatar for the ring
              "rounded-3xl" // Apply the squircle shape to the outer div as well for consistent hover/selection ring
            )}
            onClick={() => onSelect(path)}
          >
            <Avatar
              className={cn(
                "w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 aspect-square overflow-hidden block flex-shrink-0",
                bgColor, // Apply background color to the Avatar component
                "rounded-3xl" // Apply the squircle shape here
              )}
            >
              <AvatarImage src={path} alt={`Avatar ${path.split('/').pop()?.split('.')[0]}`} className="object-cover" />
              <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                AV
              </AvatarFallback>
            </Avatar>
            {selectedAvatar === path && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-3xl"> {/* Match shape */}
                <span className="text-white text-2xl">✓</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AvatarSelector;