"use client";

import React, { useState, useEffect } from 'react';
import { Movie, useMusic } from '@/context/MusicContext';
import { Play, Heart, ChevronLeft, ChevronRight, Info, Search, HelpCircle, ArrowLeft, LogOut, ArrowRight, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface MovieHeroProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onSearchClick: () => void;
}

export const MovieHero: React.FC<MovieHeroProps> = ({ movies, onPlay, onSearchClick }) => {
  const { toggleLikeMovie, isMovieLiked } = useMusic();
  const { user, signOut } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (movies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [movies.length]);

  if (movies.length === 0) return null;

  const currentMovie = movies[currentIndex];
  const liked = isMovieLiked(currentMovie.id);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
      {/* Immersive Background Image */}
      <style>{`@keyframes nm-kenburns { from { transform: scale(1); } to { transform: scale(1.12); } }`}</style>
      <div className="absolute inset-0 transition-transform duration-1000 ease-out transform scale-100">
        <img 
          src={currentMovie.backdrop} 
          alt={currentMovie.title} 
          className="w-full h-full object-cover object-center"
          style={{ animation: "nm-kenburns 45s ease-in-out infinite alternate" }}
        />
        {/* Complex cinematic gradient overlays for flawless legibility and depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/10 to-transparent" />
        <div className="absolute inset-0 bg-black/30" />
        {/* Netflix-style bottom fade: blends the hero into the content below */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
      </div>

      {/* Floating Top Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-6 md:px-12">
        {/* Left Search Icon */}
        <button 
          onClick={onSearchClick}
          className="p-3 rounded-full bg-black/30 hover:bg-black/50 text-white/80 hover:text-white transition-all backdrop-blur-md border border-white/10"
        >
          <Search size={20} />
        </button>

        {/* Center Logo Icon */}
        <button 
          onClick={() => navigate('/')}
          className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95 transition-transform"
          title="Back to Hub"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Right Action Menu */}
        <div className="flex items-center gap-3">
          {user ? (
            <button 
              onClick={() => signOut()}
              className="p-3 rounded-full bg-black/30 hover:bg-red-500/20 text-white/80 hover:text-red-400 transition-all backdrop-blur-md border border-white/10"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg"
            >
              <LogIn size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Immersive Contents layout matching second image */}
      <div className="absolute inset-0 flex items-center justify-between px-6 sm:px-12 md:px-24 py-16 z-10">
        
        {/* Vertical Poster on the Left */}
        <div className="hidden md:block w-64 lg:w-72 aspect-[2/3] rounded-[2rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.9)] border border-white/10 shrink-0 transform -rotate-1 hover:rotate-0 transition-transform duration-500 hover:scale-[1.02]">
          <img 
            src={currentMovie.poster} 
            alt={currentMovie.title} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Large Cinematic Details on the Right */}
        <div className="flex-1 md:ml-16 lg:ml-24 max-w-xl text-left space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-white/70">
            <span className="text-[10px] tracking-[0.2em] font-black uppercase text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Trending #{(currentIndex + 1)}
            </span>
            <span>{currentMovie.year}</span>
            <span className="text-yellow-500 flex items-center gap-0.5">★ {currentMovie.rating}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.95] uppercase drop-shadow-2xl">
            {currentMovie.title}
          </h1>

          <p className="text-zinc-300 text-xs sm:text-sm md:text-base leading-relaxed font-semibold line-clamp-3 md:line-clamp-4 max-w-lg drop-shadow">
            {currentMovie.overview}
          </p>

          <div className="flex items-center gap-3.5 pt-2">
            <Button 
              onClick={() => onPlay(currentMovie)}
              className="rounded-full bg-red-600 text-white hover:bg-red-700 px-8 h-12 md:h-14 text-sm font-black uppercase tracking-wider gap-2 shadow-xl shadow-red-600/25 transition-all hover:scale-105 active:scale-95"
            >
              <Play size={16} fill="currentColor" />
              Play
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => toggleLikeMovie(currentMovie)}
              className={cn(
                "rounded-full w-12 h-12 md:w-14 md:h-14 p-0 border-white/20 bg-white/5 backdrop-blur-md transition-all hover:scale-105 active:scale-95",
                liked ? "text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20" : "text-white hover:bg-white/10"
              )}
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
            </Button>
          </div>
        </div>

        <div className="hidden lg:block w-16" />
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 border border-white/10 backdrop-blur-md"
      >
        <ChevronLeft size={24} />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 border border-white/10 backdrop-blur-md"
      >
        <ChevronRight size={24} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-10 left-6 sm:left-12 md:left-24 flex items-center gap-2 z-20">
        {movies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              "h-1 rounded-full transition-all",
              idx === currentIndex ? "w-8 bg-purple-500" : "w-2 bg-white/30 hover:bg-white/50"
            )}
          />
        ))}
      </div>
    </div>
  );
};