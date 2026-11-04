"use client";

import React, { useState } from 'react';
import { Users, Play, Info, Link, Type, Image, Plus, LogIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useMusic, Movie } from '@/context/MusicContext';

export const CustomWatchParty = () => {
  const { roomCode, setRoomCode, isHost, setIsHost, playMovie } = useMusic();
  const [open, setOpen] = useState(false);
  const [movieLink, setMovieLink] = useState('');
  const [title, setTitle] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  
  const [quickCode, setQuickCode] = useState(`ISAI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);

  const handleQuickHost = () => {
    setRoomCode(quickCode);
    setIsHost(true);
    toast.success("Watch Party Sync Room created! Share code to invite friends.");
  };

  const handleLaunchParty = (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalizedLink = movieLink.trim();

    if (!normalizedLink) {
      toast.error("Please paste your movie link from your website");
      return;
    }

    if (!roomCode) {
      toast.error("You must host or join a Sync Room first to start a synchronized watch party!");
      return;
    }

    const customMovie: Movie = {
      id: `custom-${Date.now()}`,
      title: title.trim() || 'Custom Watch Party Video',
      overview: 'Playing from a custom movie link shared in this watch party session.',
      backdrop: posterUrl.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200',
      poster: posterUrl.trim() || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=400',
      rating: 10.0,
      year: new Date().getFullYear().toString(),
      genre: 'Custom Watch Party',
      language: 'EN',
      streamUrl: normalizedLink
    };

    playMovie(customMovie);
    setOpen(false);
    toast.success(`Starting Watch Party: ${customMovie.title}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-300 hover:text-white hover:bg-purple-600 transition-all text-xs font-black uppercase tracking-widest shrink-0 shadow-lg">
          <Plus size={14} />
          <span>Custom Watch Party</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-card border-border rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black">
            <Users className="text-purple-400" />
            Custom Watch Party
          </DialogTitle>
          <DialogDescription>
            Use a movie link from your website to launch a synchronized watch party.
          </DialogDescription>
        </DialogHeader>

        {!roomCode ? (
          <div className="space-y-4 pt-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center space-y-3">
              <p className="text-xs font-bold text-red-400">Sync Room Required</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                To sync video playback across devices, you must be in an active sync room session.
              </p>
              <Button onClick={handleQuickHost} className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl font-bold h-11 text-xs gap-1.5 text-white">
                <LogIn size={14} />
                Host a Sync Room ({quickCode})
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLaunchParty} className="space-y-4 pt-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Link size={10} className="text-purple-400" />
                  Movie Link from Your Website
                </Label>
                <Input 
                  placeholder="https://yourwebsite.com/movie.mp4 or magnet:?xt=..." 
                  value={movieLink}
                  onChange={(e) => setMovieLink(e.target.value)}
                  className="bg-accent/5 border-none h-11 rounded-xl text-xs text-white focus-visible:ring-2 focus-visible:ring-purple-600/30"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Type size={10} className="text-purple-400" />
                  Video Title
                </Label>
                <Input 
                  placeholder="e.g. Inception (2010)" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-accent/5 border-none h-11 rounded-xl text-xs text-white focus-visible:ring-2 focus-visible:ring-purple-600/30"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Image size={10} className="text-purple-400" />
                  Cover Poster URL Optional
                </Label>
                <Input 
                  placeholder="https://example.com/poster.jpg" 
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  className="bg-accent/5 border-none h-11 rounded-xl text-xs text-white focus-visible:ring-2 focus-visible:ring-purple-600/30"
                />
              </div>
            </div>

            <div className="flex gap-2 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <Info size={16} className="text-purple-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-normal">
                <strong>Best option:</strong> paste a direct video link, HLS link, or magnet link. If you paste a normal webpage URL, it opens in page mode, but full playback sync may not work.
              </p>
            </div>

            <Button type="submit" className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs uppercase tracking-widest gap-2 shadow-xl shadow-purple-600/20">
              <Play size={14} fill="currentColor" />
              Launch Watch Party
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};