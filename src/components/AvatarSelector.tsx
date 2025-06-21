import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

interface AvatarSelectorProps {
  selectedAvatar: string | null;
  onSelect: (avatarUrl: string) => void;
  numAvatars?: number; // Optional prop to specify number of avatars
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ selectedAvatar, onSelect, numAvatars = 10 }) => {
  const avatarPaths: string[] = [];
  for (let i = 1; i <= numAvatars; i++) {
    avatarPaths.push(`/avatars/avatar${i}.png`);
  }

  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-3 p-4 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      {avatarPaths.map((path) => (
        <div
          key={path}
          className={cn(
            "relative cursor-pointer rounded-full overflow-hidden transition-all duration-200",
            "hover:scale-105 hover:ring-2 hover:ring-blue-500 dark:hover:ring-purple-400",
            selectedAvatar === path ? "ring-4 ring-blue-600 dark:ring-purple-500 scale-110" : ""
          )}
          onClick={() => onSelect(path)}
        >
          <Avatar className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20">
            <AvatarImage src={path} alt={`Avatar ${path.split('/').pop()?.split('.')[0]}`} />
            <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
              AV
            </AvatarFallback>
          </Avatar>
          {selectedAvatar === path && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-full">
              <span className="text-white text-2xl">✓</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AvatarSelector;