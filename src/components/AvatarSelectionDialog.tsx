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
      <DialogContent className="sm:max-w-[425px] p-6 bg-card/80 backdrop-blur-md border border-border/50 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Select Your Avatar</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose a new avatar from the options below.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[400px] overflow-y-auto">
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