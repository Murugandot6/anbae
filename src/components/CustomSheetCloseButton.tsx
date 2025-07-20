"use client";

import React from 'react';
import { Button } from '@/components/ui/button'; // Re-import shadcn/ui Button
import { X } from 'lucide-react';
import { SheetClose } from '@/components/ui/sheet';

interface CustomSheetCloseButtonProps {
  onClick?: () => void;
}

const CustomSheetCloseButton: React.FC<CustomSheetCloseButtonProps> = ({ onClick }) => {
  return (
    <SheetClose asChild>
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        aria-label="Close sidebar"
      >
        <X className="w-5 h-5" />
      </Button>
    </SheetClose>
  );
};

export default CustomSheetCloseButton;