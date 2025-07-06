"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useSheetContext } from '@/components/ui/sheet'; // Assuming this context exists or can be inferred

interface CustomSheetCloseButtonProps {
  onClick?: () => void;
}

const CustomSheetCloseButton: React.FC<CustomSheetCloseButtonProps> = ({ onClick }) => {
  const context = useSheetContext(); // Get context from shadcn/ui sheet

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    context.onOpenChange(false); // Close the sheet
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-10 h-10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
      onClick={handleClick}
      aria-label="Close sidebar"
    >
      <X className="w-5 h-5" />
    </Button>
  );
};

export default CustomSheetCloseButton;