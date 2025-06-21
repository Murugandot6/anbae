import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface EmojiPickerPopoverProps {
  children: React.ReactNode;
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({ children, onEmojiSelect, isOpen, onOpenChange }) => {
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    onOpenChange(false); // Close popover after selecting an emoji
  };

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-none shadow-lg">
        <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPickerPopover;