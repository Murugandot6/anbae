"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { musicApi, Song } from '@/services/musicApi';
import { useMusic } from '@/context/MusicContext';
import { getHighResImage } from '@/lib/image-utils';
import { FEATURED_PLAYLISTS } from '@/data/featuredPlaylists';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Play, Pause, Home, Music, Disc, Search, Heart, 
  Sparkles, ArrowRight, User, Star, ChevronRight, Compass, Shuffle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

const MusicPage = () => {
  const navigate = useNavigate();
  const { selectedLanguages, playSong, playRandom, currentSong, isPlaying, togglePlay, isLiked, toggleLike } = useMusic();
  
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [rahmanSongs, setRahmanSongs] = useState<Song[]>([]);
  const [yuvanSongs, setYuvanSongs] = useState<Song[]>([]);

  useEffect(() => {
    const fetchMusic = async () => {
      setLoading(true);
      try {
        const trending = await musicApi.getTrending(selectedLanguages[0] || 'tamil');
        setTrendingSongs(trending);

        const [rahman, yuvan] = await Promise.all([
          musicApi.searchSongs("A.R. Rahman", 1, 15).catch(() => []),
          musicApi.searchSongs("Yuvan Shankar Raja", 1, 15).catch(() => [])
        ]);

        setRahmanSongs(rahman.slice(0, 12));
        setYuvanSongs(yuvan.slice(0, 12));
      } catch (err) {
        console.error("Failed to load music", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMusic();
  }, [selectedLanguages]);

  const spotlightSong = useMemo(() => currentSong || trendingSongs[0] || null, [currentSong, trendingSongs]);
  const spotlightImage = spotlightSong ? getHighResImage(spotlightSong.image) : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200';

  return (
    <MainLayout>
      <div className="min-h-screen relative flex flex-col text-white bg-black">
        {spotlightSong && (
          <div className="absolute right-0 top-0 w-full lg:w-3/5 h-[620px] z-0 pointer-events-none overflow-hidden rounded-l-[3rem]">
            <img src={spotlightImage} alt="" className="w-full h-full object-cover opacity-40 lg:opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
          </div>
        )}

        <div className="flex items-center justify-between p-6 md:px-12 z-20 gap-4">
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
            <button onClick={() => navigate('/')} className="p-2 text-white/60 hover:text-white"><Home size={18} /></button>
            <button onClick={() => playRandom()} className="p-2 text-white/60 hover:text-white flex items-center gap-2">
              <Shuffle size={18} className="text-purple-400" />
              <span className="hidden sm:inline text-[10px] font-black uppercase">Play Random</span>
            </button>
            <LanguageSelector />
          </div>

          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <button className="p-2 rounded-full text-white/60 hover:text-white bg-white/5"><Search size={18} /></button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-white/10 text-white rounded-3xl">
              <DialogHeader><DialogTitle className="font-black">Search Music</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=music`); setSearchOpen(false); }} className="space-y-4">
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Artists, songs, albums..." className="bg-white/5 border-none h-12 rounded-xl" />
                <Button type="submit" className="w-full h-12 rounded-xl bg-purple-600">Search</Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => navigate('/artists')} className="px-5 py-3 rounded-xl bg-white/5 text-cyan-300 text-[11px] font-black uppercase">Top Artists</button>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 md:px-12 relative min-h-[420px] py-12">
          <div className="relative z-10 max-w-xl space-y-6 text-left">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-purple-400 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-purple-500 rounded-full" /> Audio Station
            </span>
            {spotlightSong && (
              <>
                <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.9]" dangerouslySetInnerHTML={{ __html: spotlightSong.name }} />
                <p className="text-zinc-300 font-semibold" dangerouslySetInnerHTML={{ __html: spotlightSong.primaryArtists }} />
                <div className="flex items-center gap-6 pt-4">
                  <button onClick={() => spotlightSong && (currentSong?.id === spotlightSong.id ? togglePlay() : playSong(spotlightSong, trendingSongs))} className="flex items-center gap-4 bg-white/10 hover:bg-white/20 pl-6 pr-4 py-3 rounded-full border border-white/20 transition-all">
                    <span className="text-xs font-black uppercase tracking-widest">{currentSong?.id === spotlightSong?.id && isPlaying ? 'Pause' : 'Play'}</span>
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">{currentSong?.id === spotlightSong?.id && isPlaying ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" />}</div>
                  </button>
                  <button onClick={() => toggleLike(spotlightSong)} className={cn("p-3 rounded-full border", isLiked(spotlightSong.id) ? "text-purple-400 border-purple-500/40 bg-purple-500/10" : "text-white/40")}>
                    <Heart size={18} fill={isLiked(spotlightSong.id) ? "currentColor" : "none"} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="px-6 md:px-12 space-y-12 pb-24 text-left">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Trending Tracks</h3>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 no-scrollbar">
              {trendingSongs.slice(0, 10).map((song) => (
                <div key={song.id} onClick={() => playSong(song, trendingSongs)} className="group w-36 sm:w-40 shrink-0 flex flex-col gap-2 cursor-pointer">
                  <div className="relative aspect-square w-full rounded-[1.5rem] overflow-hidden bg-zinc-950 border border-white/5">
                    <img src={getHighResImage(song.image)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg"><Play size={14} fill="black" /></div>
                    </div>
                  </div>
                  <h4 className="font-bold text-xs truncate" dangerouslySetInnerHTML={{ __html: song.name }} />
                  <p className="text-[10px] text-zinc-400 truncate" dangerouslySetInnerHTML={{ __html: song.primaryArtists }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MusicPage;