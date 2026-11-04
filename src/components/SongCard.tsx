"use client";

import React, { useState, useEffect } from 'react';
import { Song, musicApi } from '@/services/musicApi';
import { Play, Pause, Globe, Heart, MoreHorizontal, Plus, Share2, ListMusic, ListPlus, BookOpen } from 'lucide-react';
import { useMusic } from '@/context/MusicContext';
import { getHighResImage } from '@/lib/image-utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export const SongCard: React.FC<{ song: Song, allSongs?: Song[], fallbackImage?: string }> = ({ song, allSongs, fallbackImage }) => {
  const { currentSong, isPlaying, playSong, togglePlay, toggleLike, isLiked, playlists, addToPlaylist, addToNext, addMemory } = useMusic();
  const [detailedSong, setDetailedSong] = useState<Song | null>(null);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [memoryText, setMemoryText] = useState('');
  
  if (!song) return null;

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      try {
        const data = await musicApi.getSongDetails(song.id);
        if (data && isMounted) {
          setDetailedSong(data);
        }
      } catch (err) {
        console.error("Failed to fetch song details for card", err);
      }
    };
    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [song.id]);

  const displaySong = detailedSong || song;
  const isCurrent = currentSong?.id === displaySong.id;
  const liked = isLiked(displaySong.id);
  
  const imageUrl = getHighResImage(displaySong.image, fallbackImage);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.action-button')) return;
    
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(displaySong, allSongs);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + `/#/search?q=${encodeURIComponent(displaySong.name || '')}`);
    toast.success("Link copied to clipboard!");
  };

  const handleSaveMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryText.trim()) return;
    addMemory(displaySong, memoryText);
    setMemoryText('');
    setIsJournalOpen(false);
  };

  return (
    <>
      <div 
        className="group relative bg-card/50 hover:bg-accent/10 p-3 rounded-2xl transition-all duration-300 cursor-pointer border border-transparent hover:border-accent/20 hover:-translate-y-1"
        onClick={handleClick}
      >
        <div className="relative aspect-square mb-3 overflow-hidden rounded-xl bg-accent/10 shadow-lg">
          <img 
            src={imageUrl} 
            alt={displaySong.name || 'Song'} 
            className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-[9px] font-bold uppercase border-none text-white flex items-center gap-1 py-0.5">
              <Globe size={10} />
              {displaySong.language || 'unknown'}
            </Badge>
          </div>

          <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(displaySong);
              }}
              className={cn(
                "action-button p-2 rounded-full transition-all duration-300 backdrop-blur-md",
                liked ? "bg-primary text-white opacity-100" : "bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60"
              )}
            >
              <Heart size={14} fill={liked ? "currentColor" : "none"} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="action-button p-2 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60 backdrop-blur-md transition-all"
                >
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 rounded-xl bg-card border-border shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    addToNext(displaySong);
                  }} 
                  className="gap-2 rounded-lg m-1 cursor-pointer"
                >
                  <ListPlus size={16} />
                  <span>Play Next</span>
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2 rounded-lg m-1 cursor-pointer">
                    <Plus size={16} />
                    <span>Add to Playlist</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="rounded-xl bg-card border-border shadow-2xl min-w-[180px]">
                    {playlists && playlists.length > 0 ? (
                      playlists.map(p => (
                        <DropdownMenuItem 
                          key={p.id} 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToPlaylist(p.id, displaySong);
                          }}
                          className="gap-2 rounded-lg m-1 cursor-pointer"
                        >
                          <ListMusic size={14} />
                          <span className="truncate">{p.name}</span>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled className="text-xs italic p-4">No playlists found</DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsJournalOpen(true);
                  }} 
                  className="gap-2 rounded-lg m-1 cursor-pointer text-primary focus:text-primary focus:bg-primary/10"
                >
                  <BookOpen size={16} />
                  <span>Write Memory</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleShare} className="gap-2 rounded-lg m-1 cursor-pointer">
                  <Share2 size={16} />
                  <span>Share Song</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isCurrent && isPlaying ? 'opacity-100' : ''}`}>
            <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
              {isCurrent && isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </div>
          </div>
        </div>
        <h3 className="font-semibold text-sm truncate mb-0.5" dangerouslySetInnerHTML={{ __html: displaySong.name || 'Unknown Track' }}></h3>
        <p className="text-xs text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: displaySong.primaryArtists || 'Unknown Artist' }}></p>
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
            <img src={imageUrl} alt={displaySong.name} className="w-12 h-12 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm truncate" dangerouslySetInnerHTML={{ __html: displaySong.name }}></h4>
              <p className="text-xs text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: displaySong.primaryArtists }}></p>
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