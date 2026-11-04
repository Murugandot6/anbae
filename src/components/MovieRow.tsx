"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Movie, useMusic } from '@/context/MusicContext';
import { Play, Star, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
}

export const MovieRow: React.FC<MovieRowProps> = ({ title, movies, onPlay }) => {
  const { toggleLikeMovie, isMovieLiked } = useMusic();
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollPosition = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    const row = rowRef.current;
    if (row) {
      row.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
    }
    return () => {
      if (row) {
        row.removeEventListener('scroll', checkScrollPosition);
      }
    };
  }, [movies]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (movies.length === 0) return null;

  return (
    <div className="space-y-4 mb-10 text-left relative group/row">
      <div className="flex items-center justify-between">
        <h3 className="text-lg md:text-xl font-black tracking-tight text-white/90 pl-1 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      
      <div className="relative w-full">
        {/* Left Gradient Edge Mask */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none transition-opacity duration-300",
          showLeftArrow ? "opacity-100" : "opacity-0"
        )} />

        {/* Right Gradient Edge Mask */}
        <div className={cn(
          "absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none transition-opacity duration-300",
          showRightArrow ? "opacity-100" : "opacity-0"
        )} />

        {/* Left Arrow Button */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-all backdrop-blur-md border border-white/10 shadow-lg shadow-black/50"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Right Arrow Button */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-all backdrop-blur-md border border-white/10 shadow-lg shadow-black/50"
            style={{ transform: 'translate(50%, -50%)' }}
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Horizontal Card Row List (Scrollbar hidden) */}
        <div 
          ref={rowRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 px-1 no-scrollbar"
        >
          {movies.map((movie) => {
            const liked = isMovieLiked(movie.id);
            return (
              <div 
                key={movie.id}
                className="group relative w-[130px] sm:w-[160px] md:w-[180px] shrink-0 flex flex-col gap-2 cursor-pointer transition-all duration-300"
              >
                <div 
                  className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 shadow-md shadow-black/40"
                  onClick={() => onPlay(movie)}
                >
                  <img 
                    src={movie.poster || movie.backdrop} 
                    alt={movie.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transform scale-90 group-hover:scale-100 transition-transform">
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center gap-0.5 text-[9px] font-bold text-yellow-500">
                    <Star size={9} fill="currentColor" />
                    {movie.rating}
                  </div>
                </div>

                <div className="px-1 text-left">
                  <div className="flex items-start justify-between gap-1">
                    <h4 
                      onClick={() => onPlay(movie)}
                      className="font-bold text-xs text-white/90 truncate flex-1 group-hover:text-purple-400 transition-colors"
                    >
                      {movie.title}
                    </h4>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeMovie(movie);
                      }}
                      className={cn(
                        "text-muted-foreground hover:text-red-500 transition-colors shrink-0 pt-0.5",
                        liked && "text-red-500"
                      )}
                    >
                      <Heart size={11} fill={liked ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground font-bold">
                    <span>{movie.year}</span>
                    <span>•</span>
                    <span className="uppercase text-[9px] text-purple-400/90">{movie.language}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};