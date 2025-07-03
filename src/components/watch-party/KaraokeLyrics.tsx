import React, { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LyricLine } from '@/lib/lrcParser';

interface KaraokeLyricsProps {
  lyrics: LyricLine[];
  currentTime: number;
}

const KaraokeLyrics: React.FC<KaraokeLyricsProps> = ({ lyrics, currentTime }) => {
  const [currentLine, setCurrentLine] = useState<string | null>(null);
  const [animationClass, setAnimationClass] = useState('');

  const activeIndex = useMemo(() => {
    if (!lyrics || lyrics.length === 0) return -1;
    let i = lyrics.length - 1;
    while (i >= 0) {
      if (lyrics[i].time <= currentTime) {
        return i;
      }
      i--;
    }
    return -1;
  }, [lyrics, currentTime]);

  useEffect(() => {
    const newLine = activeIndex !== -1 ? lyrics[activeIndex].text : null;

    if (newLine !== currentLine) {
      // Start fade out
      setAnimationClass('animate-fade-out');

      // After fade out, change text and fade in
      const timer = setTimeout(() => {
        setCurrentLine(newLine);
        setAnimationClass('animate-fade-in');
      }, 500); // This duration must match the animation duration in tailwind.config.ts

      return () => clearTimeout(timer);
    }
  }, [activeIndex, lyrics, currentLine]);

  if (!lyrics.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-2xl">
        <p>Waiting for the song to start...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full text-center p-4">
      <p
        className={cn(
          "text-4xl md:text-6xl font-bold text-white",
          animationClass
        )}
      >
        {currentLine || '♪'}
      </p>
    </div>
  );
};

export default KaraokeLyrics;