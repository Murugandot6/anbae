import React, { useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LyricLine } from '@/lib/lrcParser';

interface KaraokeLyricsProps {
  lyrics: LyricLine[];
  currentTime: number;
}

const KaraokeLyrics: React.FC<KaraokeLyricsProps> = ({ lyrics, currentTime }) => {
  const activeLineRef = useRef<HTMLLIElement>(null);
  const lyricsContainerRef = useRef<HTMLUListElement>(null);

  const activeIndex = useMemo(() => {
    if (!lyrics || lyrics.length === 0) return -1;
    
    // Find the index of the line that should be active
    let i = lyrics.length - 1;
    while (i >= 0) {
      if (lyrics[i].time <= currentTime) {
        return i;
      }
      i--;
    }
    return -1; // No line is active yet
  }, [lyrics, currentTime]);

  useEffect(() => {
    if (activeLineRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeElement = activeLineRef.current;
      
      const containerHeight = container.clientHeight;
      const elementTop = activeElement.offsetTop - container.offsetTop;
      const elementHeight = activeElement.clientHeight;
      
      container.scrollTo({
        top: elementTop - (containerHeight / 2) + (elementHeight / 2),
        behavior: 'smooth',
      });
    }
  }, [activeIndex]);

  if (!lyrics.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Paste LRC content in the input above.</p>
      </div>
    );
  }

  return (
    <ul ref={lyricsContainerRef} className="h-full overflow-y-auto text-center space-y-4 p-4 scroll-smooth">
      {lyrics.map((line, index) => (
        <li
          key={`${line.time}-${index}`}
          ref={index === activeIndex ? activeLineRef : null}
          className={cn(
            "transition-all duration-300 text-2xl font-semibold",
            index === activeIndex
              ? "text-blue-400 scale-110"
              : "text-gray-500 scale-90 opacity-60"
          )}
        >
          {line.text}
        </li>
      ))}
    </ul>
  );
};

export default KaraokeLyrics;