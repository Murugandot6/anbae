"use client";

import React from 'react';
import { Languages, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { useMusic } from '@/context/MusicContext';

const AVAILABLE_LANGUAGES = [
  { id: 'english', label: 'English' },
  { id: 'hindi', label: 'Hindi' },
  { id: 'punjabi', label: 'Punjabi' },
  { id: 'tamil', label: 'Tamil' },
  { id: 'telugu', label: 'Telugu' },
  { id: 'marathi', label: 'Marathi' },
  { id: 'spanish', label: 'Spanish' },
  { id: 'french', label: 'French' },
];

export const LanguageSelector = () => {
  const { selectedLanguages, toggleLanguage } = useMusic();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full bg-accent/5 border-border hover:bg-accent/10 transition-all">
          <Languages size={18} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-card border-border shadow-2xl">
        <DropdownMenuLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Preferred Languages</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        {AVAILABLE_LANGUAGES.map((lang) => (
          <DropdownMenuCheckboxItem
            key={lang.id}
            checked={selectedLanguages.includes(lang.id)}
            onCheckedChange={() => toggleLanguage(lang.id)}
            className="rounded-lg m-1 cursor-pointer focus:bg-primary/10 focus:text-primary font-medium"
          >
            {lang.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};