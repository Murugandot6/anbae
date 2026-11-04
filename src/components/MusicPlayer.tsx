"use client";

import React, { useState, useEffect } from 'react';
import { useMusic } from '@/context/MusicContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, Repeat1, ListMusic, ChevronDown, Heart, BookOpen } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { getHighResImage } from '@/lib/image-utils';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const MusicPlayer = () => {
  const { 
    currentSong, isPlaying, togglePlay, currentTime, duration, seek, 
    volume, setVolume, isMuted, toggleMute, playNext, playPrevious, 
    isShuffle, toggleShuffle, repeatMode, toggleRepeat, queue, playSong,
    toggleLike, isLiked, addMemory
  } = useMusic();

  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [memoryText, setMemoryText] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setIsMobileExpanded(false);
    }
  }, [isMobile]);

  if (!currentSong) return null;

  const imageUrl = getHighResImage(currentSong.image);
  const liked = isLiked(currentSong.id);

  const handleMiniPlayerClick = () => {
    if (isMobile) {
      setIsMobileExpanded(true);
    }
  };

  const handleSaveMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryText.trim()) return;
    addMemory(currentSong, memoryText);
    setMemoryText('');
    setIsJournalOpen(false);
  };

  return (
    <>
      {/* Mini Player (Desktop & Mobile) */}
      <div 
        className={cn(
          "fixed bottom-[56px] lg:bottom-0 left-0 right-0 bg-background/95 backdrop-blur-2xl border-t border-border p-3 px-4 lg:p-4 lg:px-6 z-40 flex items-center justify-between gap-4 transition-all duration-300",
          isMobileExpanded ? "opacity-0 pointer-events-none translate-y-10" : "opacity-100 translate-y-0"
        )}
      >
        {/* Progress Bar - Top of player on mobile */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent/10 md:hidden">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>

        {/* Current Song Info */}
        <div className="flex items-center gap-3 flex-1 md:flex-initial md:w-1/3 min-w-0">
          <div 
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer md:cursor-default"
            onClick={handleMiniPlayerClick}
          >
            <img src={imageUrl} alt={currentSong.name} className="w-10 h-10 md:w-14 md:h-14 rounded-lg shadow-lg object-cover bg-accent/10 shrink-0" />
            <div className="overflow-hidden min-w-0 flex-1">
              <h4 className="font-bold text-xs md:text-sm truncate" dangerouslySetInnerHTML={{ __html: currentSong.name }}></h4>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: currentSong.primaryArtists }}></p>
            </div>
          </div>
          
          {/* Mobile Quick Controls */}
          <div className="flex items-center gap-2 md:hidden shrink-0">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsJournalOpen(true);
              }}
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <BookOpen size={18} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(currentSong);
              }}
              className={cn("p-2 transition-colors", liked ? "text-primary" : "text-muted-foreground")}
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }} 
              className="bg-primary text-primary-foreground p-2 rounded-full shadow-md"
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                playNext();
              }} 
              className="text-muted-foreground p-2"
            >
              <SkipForward size={16} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Controls & Progress (Desktop) */}
        <div className="hidden md:flex flex-col items-center gap-2 flex-1 md:w-1/3">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => toggleShuffle()}
              className={cn("transition-colors", isShuffle ? "text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <Shuffle size={18} />
            </button>
            <button 
              onClick={() => playPrevious()}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay}
              className="bg-primary text-primary-foreground p-3 rounded-full hover:scale-105 transition-transform shadow-lg shadow-primary/20"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
            </button>
            <button 
              onClick={() => playNext()}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipForward size={24} fill="currentColor" />
            </button>
            <button 
              onClick={() => toggleRepeat()}
              className={cn("transition-colors", repeatMode !== 'none' ? "text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>
          
          <div className="flex items-center gap-3 w-full max-w-md">
            <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">{formatTime(currentTime)}</span>
            <Slider 
              value={[currentTime]} 
              max={duration || 100} 
              step={1}
              onValueChange={([val]) => seek(val)}
              className="flex-1 cursor-pointer"
            />
            <span className="text-[10px] font-medium text-muted-foreground w-8">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Queue (Desktop) */}
        <div className="hidden md:flex items-center justify-end gap-4 md:w-1/3">
          <button 
            onClick={() => setIsJournalOpen(true)}
            className="p-2 rounded-full hover:bg-accent/10 text-muted-foreground hover:text-primary transition-colors"
            title="Write a Memory"
          >
            <BookOpen size={20} />
          </button>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <Slider 
              value={[isMuted ? 0 : volume * 100]} 
              max={100} 
              step={1}
              onValueChange={([val]) => setVolume(val / 100)}
              className="w-24 cursor-pointer"
            />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 rounded-full hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors">
                <ListMusic size={20} />
              </button>
            </SheetTrigger>
            <SheetContent className="w-full sm:w-[400px] bg-card border-border p-0">
              <SheetHeader className="p-6 border-b border-border">
                <SheetTitle className="text-2xl font-black">Up Next</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto h-[calc(100vh-100px)] p-4 space-y-2">
                {queue.length > 0 ? (
                  queue.map((song, idx) => {
                    const isCurrent = currentSong.id === song.id;
                    return (
                      <div 
                        key={`${song.id}-${idx}`}
                        onClick={() => playSong(song)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                          isCurrent ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/5"
                        )}
                      >
                        <img src={getHighResImage(song.image)} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm font-bold truncate", isCurrent ? "text-primary" : "text-foreground")} dangerouslySetInnerHTML={{ __html: song.name }}></p>
                          <p className="text-xs text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: song.primaryArtists }}></p>
                        </div>
                        {isCurrent && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                    <ListMusic size={48} className="mb-4 opacity-20" />
                    <p className="font-bold">Queue is empty</p>
                    <p className="text-xs">Play a song to start your queue.</p>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Full-Screen Mobile Player Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/98 backdrop-blur-3xl z-50 flex flex-col p-6 pb-safe transition-all duration-500 ease-out md:hidden",
          isMobileExpanded ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setIsMobileExpanded(false)}
            className="p-2 rounded-full bg-accent/10 text-foreground hover:bg-accent/20 transition-colors"
          >
            <ChevronDown size={24} />
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Now Playing</span>
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 rounded-full bg-accent/10 text-foreground hover:bg-accent/20 transition-colors">
                <ListMusic size={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-[2rem] bg-card border-border p-0">
              <SheetHeader className="p-6 border-b border-border">
                <SheetTitle className="text-2xl font-black">Up Next</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto h-[calc(80vh-100px)] p-4 space-y-2">
                {queue.length > 0 ? (
                  queue.map((song, idx) => {
                    const isCurrent = currentSong.id === song.id;
                    return (
                      <div 
                        key={`${song.id}-${idx}`}
                        onClick={() => playSong(song)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                          isCurrent ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/5"
                        )}
                      >
                        <img src={getHighResImage(song.image)} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm font-bold truncate", isCurrent ? "text-primary" : "text-foreground")} dangerouslySetInnerHTML={{ __html: song.name }}></p>
                          <p className="text-xs text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: song.primaryArtists }}></p>
                        </div>
                        {isCurrent && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                    <ListMusic size={48} className="mb-4 opacity-20" />
                    <p className="font-bold">Queue is empty</p>
                    <p className="text-xs">Play a song to start your queue.</p>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center my-4 min-h-0">
          <div className="relative aspect-square w-full max-w-[280px] rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/50">
            <img 
              src={imageUrl} 
              alt={currentSong.name} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Song Details */}
        <div className="space-y-2 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black tracking-tight text-foreground truncate" dangerouslySetInnerHTML={{ __html: currentSong.name }}></h2>
              <p className="text-xs text-muted-foreground truncate mt-1" dangerouslySetInnerHTML={{ __html: currentSong.primaryArtists }}></p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsJournalOpen(true)}
                className="p-2.5 rounded-full bg-accent/5 border border-border/50 text-muted-foreground hover:text-primary transition-all"
              >
                <BookOpen size={20} />
              </button>
              <button 
                onClick={() => toggleLike(currentSong)}
                className={cn(
                  "p-2.5 rounded-full bg-accent/5 border border-border/50 transition-all",
                  liked ? "text-primary bg-primary/10 border-primary/20" : "text-muted-foreground"
                )}
              >
                <Heart size={20} fill={liked ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Slider */}
        <div className="space-y-2 mb-6">
          <Slider 
            value={[currentTime]} 
            max={duration || 100} 
            step={1}
            onValueChange={([val]) => seek(val)}
            className="w-full cursor-pointer py-2"
          />
          <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between gap-2 mb-6 px-2">
          <button 
            onClick={() => toggleShuffle()}
            className={cn("p-2.5 rounded-full transition-colors", isShuffle ? "text-primary bg-primary/10" : "text-muted-foreground")}
          >
            <Shuffle size={20} />
          </button>
          
          <button 
            onClick={() => playPrevious()}
            className="p-2.5 rounded-full text-foreground hover:bg-accent/10 transition-colors"
          >
            <SkipBack size={24} fill="currentColor" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="bg-primary text-primary-foreground p-5 rounded-full shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </button>
          
          <button 
            onClick={() => playNext()}
            className="p-2.5 rounded-full text-foreground hover:bg-accent/10 transition-colors"
          >
            <SkipForward size={24} fill="currentColor" />
          </button>
          
          <button 
            onClick={() => toggleRepeat()}
            className={cn("p-2.5 rounded-full transition-colors", repeatMode !== 'none' ? "text-primary bg-primary/10" : "text-muted-foreground")}
          >
            {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-4 px-2 mb-4">
          <button onClick={toggleMute} className="text-muted-foreground">
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <Slider 
            value={[isMuted ? 0 : volume * 100]} 
            max={100} 
            step={1}
            onValueChange={([val]) => setVolume(val / 100)}
            className="flex-1 cursor-pointer"
          />
        </div>
      </div>

      {/* Write Memory Dialog */}
      <Dialog open={isJournalOpen} onOpenChange={setIsJournalOpen}>
        <DialogContent className="bg-card border-border max-w-[90vw] sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <BookOpen className="text-primary" />
              Music Journal
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-accent/5 border border-border/50 my-2">
            <img src={imageUrl} alt={currentSong.name} className="w-12 h-12 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm truncate" dangerouslySetInnerHTML={{ __html: currentSong.name }}></h4>
              <p className="text-xs text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: currentSong.primaryArtists }}></p>
            </div>
          </div>
          <form onSubmit={handleSaveMemory} className="space-y-4">
            <Textarea 
              placeholder="What memory or feeling does this song bring back? (e.g., 'Played this on repeat during our road trip to Ooty...')" 
              value={memoryText}
              onChange={(e) => setMemoryText(e.target.value)}
              className="bg-accent/5 h-32 rounded-2xl border-none font-medium text-sm focus-visible:ring-primary/20 resize-none"
              autoFocus
              required
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsJournalOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" className="rounded-xl font-bold px-6">Save Memory</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};