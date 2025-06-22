"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import AvatarCarousel from './AvatarCarousel';

interface AvatarSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAvatar: string | null;
  onSelect: (avatarUrl: string) => void;
}

const AvatarSelectionDialog: React.FC<AvatarSelectionDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedAvatar,
  onSelect,
}) => {
  const handleAvatarSelectAndClose = (avatarUrl: string) => {
    onSelect(avatarUrl);
    onOpenChange(false); // Close the dialog after selection
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <DialogHeader>
          <DialogTitle>Select Your Avatar</DialogTitle>
          <DialogDescription>
            Choose a new avatar from the options below.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <AvatarCarousel
            selectedAvatar={selectedAvatar}
            onSelect={handleAvatarSelectAndClose}
            numAvatars={10} // Pass the number of avatars per type
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelectionDialog;