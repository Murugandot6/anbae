"use client";

import React from 'react';
import { Home, Music, Film, Radio, Search, Heart, BookOpen, ScrollText, Tv } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const MobileNav = () => {
  const location = useLocation();
  const path = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const searchType = searchParams.get('type');

  const isMoviesContext = path.startsWith('/movies') || (path === '/search' && searchType === 'movies');
  const isRadioContext = path.startsWith('/radio') || (path === '/search' && searchType === 'fm');
  const isLyricsContext = path.startsWith('/lyrics');
  const isTvContext = path.startsWith('/tv');
  const isMusicContext = !isMoviesContext && !isRadioContext && !isLyricsContext && !isTvContext && path !== '/';

  // Choose the dynamic, context-specific items
  let navItems = [
    { icon: Home, label: 'Gateway', path: '/' },
    { icon: Music, label: 'Music', path: '/music' },
    { icon: Film, label: 'Movies', path: '/movies' },
    { icon: Radio, label: 'Radio', path: '/radio' },
    { icon: ScrollText, label: 'Lyrics', path: '/lyrics' },
    { icon: Tv, label: 'TV', path: '/tv' },
  ];

  if (isMoviesContext) {
    navItems = [
      { icon: Home, label: 'Gateway', path: '/' },
      { icon: Film, label: 'Cinema', path: '/movies' },
      { icon: Search, label: 'Search', path: '/search?type=movies' },
      { icon: Heart, label: 'Favs', path: '/favourites' },
    ];
  } else if (isRadioContext) {
    navItems = [
      { icon: Home, label: 'Gateway', path: '/' },
      { icon: Radio, label: 'Radio', path: '/radio' },
      { icon: Search, label: 'Search', path: '/search?type=fm' },
      { icon: Heart, label: 'Starred', path: '/favourites' },
    ];
  } else if (isLyricsContext) {
    navItems = [
      { icon: Home, label: 'Gateway', path: '/' },
      { icon: ScrollText, label: 'Lyrics', path: '/lyrics' },
      { icon: Music, label: 'Music', path: '/music' },
      { icon: Film, label: 'Movies', path: '/movies' },
    ];
  } else if (isTvContext) {
    navItems = [
      { icon: Home, label: 'Gateway', path: '/' },
      { icon: Tv, label: 'Live TV', path: '/tv' },
      { icon: Music, label: 'Music', path: '/music' },
      { icon: Film, label: 'Movies', path: '/movies' },
    ];
  } else if (isMusicContext) {
    navItems = [
      { icon: Home, label: 'Gateway', path: '/' },
      { icon: Music, label: 'Music', path: '/music' },
      { icon: BookOpen, label: 'Journal', path: '/journal' },
      { icon: Search, label: 'Search', path: '/search?type=music' },
    ];
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border z-50 px-4 py-3 flex items-center justify-between pb-safe">
      {navItems.map((item) => {
        const isActive = path === item.path || (path === '/search' && item.path.startsWith('/search') && searchType === (item.path.includes('movies') ? 'movies' : item.path.includes('fm') ? 'fm' : 'music'));
        return (
          <Link 
            key={item.path} 
            to={item.path} 
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-200 flex-1",
              isActive 
                ? (isMoviesContext ? "text-purple-400" : isRadioContext ? "text-orange-400" : isLyricsContext ? "text-rose-400" : isTvContext ? "text-cyan-400" : "text-green-500") 
                : "text-muted-foreground"
            )}
          >
            <item.icon size={20} className={cn(isActive && "scale-110")} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};