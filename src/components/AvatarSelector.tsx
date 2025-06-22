import React from 'react';
import AvatarCarousel from './AvatarCarousel'; // Import the new carousel component

interface AvatarSelectorProps {
  selectedAvatar: string | null;
  onSelect: (avatarUrl: string) => void;
  numAvatars?: number; // Optional prop to specify number of avatars per type (e.g., 10 romeo, 10 juliet)
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ selectedAvatar, onSelect, numAvatars = 10 }) => {
  return (
    <div className="w-full">
      <AvatarCarousel selectedAvatar={selectedAvatar} onSelect={onSelect} numAvatars={numAvatars} />
    </div>
  );
};

export default AvatarSelector;