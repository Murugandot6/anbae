"use client";

import React, { useState } from 'react';
import { Home, Search, Library, Music, Heart, Mic2, Radio, LogIn, LogOut, Sparkles, Film, ArrowLeft, History, ChevronRight, ChevronLeft, Menu, BookOpen, ScrollText, Tv } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const path = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const searchType = searchParams.get('type');

  const isMoviesContext = path.startsWith('/movies') || (path === '/search' && searchType === 'movies');
  const isRadioContext = path.startsWith('/radio') || (path === '/search' && searchType === 'fm');
  const isLyricsContext = path.startsWith('/lyrics');
  const isTvContext = path.startsWith('/tv');
  const isMusicContext = !isMoviesContext && !isRadioContext && !isLyricsContext && !isTvContext && path !== '/';

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={cn(
      "hidden lg:flex flex-col border-r border-border h-screen sticky top-0 bg-card/20 backdrop-blur-sm p-4 overflow-y-auto transition-all duration-300 shrink-0",
      isCollapsed ? "w-20 items-center" : "w-64"
    )}>
      {/* Sidebar Toggle & Brand Header */}
      <div className={cn(
        "flex items-center mb-8 px-2 w-full",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-xl transition-colors duration-300",
              isMoviesContext ? "bg-purple-600" : isRadioContext ? "bg-orange-600" : isLyricsContext ? "bg-rose-500" : isTvContext ? "bg-cyan-500" : "bg-green-500"
            )}>
              {isMoviesContext ? <Film className="text-white" size={20} /> : isRadioContext ? <Radio className="text-white" size={20} /> : isLyricsContext ? <ScrollText className="text-white" size={20} /> : isTvContext ? <Tv className="text-white" size={20} /> : <Music className="text-white" size={20} />}
            </div>
            <span className="text-xl font-black tracking-tight italic">anbae</span>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className={cn(
            "p-2 rounded-xl hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-all",
            isCollapsed && "bg-accent/5 border border-border/50"
          )}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Global back navigation button if not at home */}
      {path !== '/' && (
        <button 
          onClick={() => navigate('/')}
          className={cn(
            "flex items-center gap-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-all mb-6 border border-border/50 bg-accent/5",
            isCollapsed ? "p-3 justify-center" : "px-4 py-3 w-full"
          )}
          title="Back to Gateway Hub"
        >
          <ArrowLeft size={14} />
          {!isCollapsed && <span>Back to Gateway</span>}
        </button>
      )}

      {/* RENDER MOVIES STATION NAVIGATION */}
      {isMoviesContext && (
        <nav className="space-y-1 mb-8 w-full">
          {!isCollapsed && <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest px-4 mb-3">Cinema Station</p>}
          <Link
            to="/movies"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3",
              path === '/movies' 
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            )}
            title="Cinema Home"
          >
            <Film size={20} />
            {!isCollapsed && <span>Cinema Home</span>}
          </Link>
          <Link
            to="/search?type=movies"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3",
              path === '/search' && searchType === 'movies'
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            )}
            title="Search Movies"
          >
            <Search size={20} />
            {!isCollapsed && <span>Search Movies</span>}
          </Link>
          <Link
            to="/library"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3",
              path === '/library'
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            )}
            title="Continue Watching"
          >
            <History size={20} />
            {!isCollapsed && <span>Continue Watching</span>}
          </Link>
          <Link
            to="/favourites"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3",
              path === '/favourites'
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            )}
            title="Liked Movies"
          >
            <Heart size={20} />
            {!isCollapsed && <span>Liked Movies</span>}
          </Link>
        </nav>
      )}

      {/* RENDER RADIO STATION NAVIGATION */}
      {isRadioContext && (
        <nav className="space-y-1 mb-8 w-full">
          {!isCollapsed && <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest px-4 mb-3">Radio Station</p>}
          <Link
            to="/radio"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3",
              path === '/radio' 
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            )}
            title="World FM Radio"
          >
            <Radio size={20} />
            {!isCollapsed && <span>World FM Radio</span>}
          </Link>
          <Link
            to="/search?type=fm"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3",
              path === '/search' && searchType === 'fm'
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            )}
            title="Search Radio"
          >
            <Search size={20} />
            {!isCollapsed && <span>Search Radio</span>}
          </Link>
          <Link
            to="/favourites"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3",
              path === '/favourites'
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            )}
            title="Starred Stations"
          >
            <Heart size={20} />
            {!isCollapsed && <span>Starred Stations</span>}
          </Link>
        </nav>
      )}

      {/* RENDER LYRICS STATION NAVIGATION */}
      {isLyricsContext && (
        <nav className="space-y-1 mb-8 w-full">
          {!isCollapsed && <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest px-4 mb-3">Lyrics Library</p>}
          <Link
            to="/lyrics"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3",
              path === '/lyrics'
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            )}
            title="Tamil Lyrics"
          >
            <ScrollText size={20} />
            {!isCollapsed && <span>Tamil Lyrics</span>}
          </Link>
        </nav>
      )}

      {/* RENDER MUSIC STATION NAVIGATION */}
      {isMusicContext && (
        <div className="w-full">
          <nav className="space-y-1 mb-8 w-full">
            {!isCollapsed && <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest px-4 mb-3">Music Menu</p>}
            <Link
              to="/music"
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                isCollapsed ? "p-3 justify-center" : "px-4 py-3",
                path === '/music' 
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              )}
              title="Music Home"
            >
              <Music size={20} />
              {!isCollapsed && <span>Music Home</span>}
            </Link>
            <Link
              to="/featured"
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                isCollapsed ? "p-3 justify-center" : "px-4 py-3",
                path === '/featured' 
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              )}
              title="Featured Lists"
            >
              <Sparkles size={20} />
              {!isCollapsed && <span>Featured Lists</span>}
            </Link>
            <Link
              to="/search?type=music"
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                isCollapsed ? "p-3 justify-center" : "px-4 py-3",
                path === '/search' && (searchType === 'music' || !searchType)
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              )}
              title="Search Tracks"
            >
              <Search size={20} />
              {!isCollapsed && <span>Search Tracks</span>}
            </Link>
            <Link
              to="/library"
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                isCollapsed ? "p-3 justify-center" : "px-4 py-3",
                path === '/library' 
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              )}
              title="Your Playlists"
            >
              <Library size={20} />
              {!isCollapsed && <span>Your Playlists</span>}
            </Link>
          </nav>

          <nav className="space-y-1 mb-8 w-full">
            {!isCollapsed && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 mb-3">Your Space</p>}
            <Link
              to="/journal"
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                isCollapsed ? "p-3 justify-center" : "px-4 py-3",
                path === '/journal' 
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              )}
              title="Music Journal"
            >
              <BookOpen size={20} />
              {!isCollapsed && <span>Music Journal</span>}
            </Link>
            <Link
              to="/songs"
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                isCollapsed ? "p-3 justify-center" : "px-4 py-3",
                path === '/songs' 
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              )}
              title="Recent Songs"
            >
              <History size={20} />
              {!isCollapsed && <span>Recent Songs</span>}
            </Link>
            <Link
              to="/artists"
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                isCollapsed ? "p-3 justify-center" : "px-4 py-3",
                path === '/artists' 
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              )}
              title="Artists Page"
            >
              <Mic2 size={20} />
              {!isCollapsed && <span>Artists Page</span>}
            </Link>
            <Link
              to="/favourites"
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                isCollapsed ? "p-3 justify-center" : "px-4 py-3",
                path === '/favourites' 
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              )}
              title="Favourites"
            >
              <Heart size={20} />
              {!isCollapsed && <span>Favourites</span>}
            </Link>
          </nav>
        </div>
      )}

      {/* GUEST OR DEFAULT HOME CHOICE PORTAL SELECTION */}
      {path === '/' && (
        <nav className="space-y-1 mb-8 w-full">
          {!isCollapsed && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 mb-3">Gateway Stations</p>}
          <Link
            to="/music"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-green-500/10 hover:text-green-400 transition-all duration-200",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3"
            )}
            title="Music Station"
          >
            <Music size={20} />
            {!isCollapsed && <span>Music Station</span>}
          </Link>
          <Link
            to="/movies"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-purple-600/10 hover:text-purple-400 transition-all duration-200",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3"
            )}
            title="anbae Cinema"
          >
            <Film size={20} />
            {!isCollapsed && <span>anbae Cinema</span>}
          </Link>
          <Link
            to="/radio"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-orange-500/10 hover:text-orange-400 transition-all duration-200",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3"
            )}
            title="World FM Radio"
          >
            <Radio size={20} />
            {!isCollapsed && <span>World FM Radio</span>}
          </Link>
          <Link
            to="/lyrics"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3"
            )}
            title="Tamil Lyrics"
          >
            <ScrollText size={20} />
            {!isCollapsed && <span>Tamil Lyrics</span>}
          </Link>
          <Link
            to="/tv"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-cyan-500/10 hover:text-cyan-400 transition-all duration-200",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3"
            )}
            title="Live TV"
          >
            <Tv size={20} />
            {!isCollapsed && <span>Live TV</span>}
          </Link>
        </nav>
      )}

      {/* Global Account Settings */}
      <nav className="space-y-1 mb-8 mt-auto w-full">
        {!isCollapsed && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 mb-3">Session</p>}
        {user ? (
          <button
            onClick={() => signOut()}
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive transition-all duration-200",
              isCollapsed ? "p-3 justify-center w-full" : "px-4 py-3 w-full"
            )}
            title="Logout"
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        ) : (
          <Link
            to="/login"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3",
              path === '/login' 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            )}
            title="Login / Sign Up"
          >
            <LogIn size={20} />
            {!isCollapsed && <span>Login / Sign Up</span>}
          </Link>
        )}
      </nav>

      {/* Footer & Disclaimer */}
      {!isCollapsed && (
        <div className="pt-6 border-t border-border/50 text-center space-y-3 shrink-0 w-full">
          <p className="text-[11px] text-muted-foreground font-medium">
            Crafted with love by{" "}
            <a 
              href="https://www.instagram.com/11x13y/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline font-bold"
            >
              11x13y
            </a>
          </p>
        </div>
      )}
    </div>
  );
};