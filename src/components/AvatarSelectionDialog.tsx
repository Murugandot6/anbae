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
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-w-[380px] sm:max-w-[425px] p-4 sm:p-6 bg-card/80 backdrop-blur-md border border-border/50 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg sm:text-xl">Select Your Avatar</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm sm:text-base">
            Choose a new avatar from the options below.
          </DialogDescription>
        </DialogHeader>
        <div className="py-3 sm:py-4 max-h-[350px] sm:max-h-[400px] overflow-y-auto">
          <AvatarCarousel
            selectedAvatar={selectedAvatar}
            onSelect={handleAvatarSelectAndClose}
            numAvatars={10}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelectionDialog;