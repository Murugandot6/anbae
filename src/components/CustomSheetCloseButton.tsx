"use client";

import React from 'react';
// import { Button } from '@/components/ui/button'; // Removed shadcn/ui Button
import { X } from 'lucide-react';
import { SheetClose } from '@/components/ui/sheet';

interface CustomSheetCloseButtonProps {
  onClick?: () => void;
}

const CustomSheetCloseButton: React.FC<CustomSheetCloseButtonProps> = ({ onClick }) => {
  return (
    <SheetClose asChild>
      <button
        // Replicated Button styling with Tailwind classes
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
                   w-10 h-10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        aria-label="Close sidebar"
      >
        <X className="w-5 h-5" />
      </button>
    </SheetClose>
  );
};

export default CustomSheetCloseButton;