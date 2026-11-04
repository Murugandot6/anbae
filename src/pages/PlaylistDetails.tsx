"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { musicApi, Playlist } from '@/services/musicApi';
import { SongCard } from '@/components/SongCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, ListMusic, Music, Loader2, Clock } from 'lucide-react';
import { getHighResImage } from '@/lib/image-utils';
import { Badge } from '@/components/ui/badge';
import { useMusic } from '@/context/MusicContext';

const PlaylistDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const { playSong } = useMusic();

  const [visibleSongsCount, setVisibleSongsCount] = useState(20);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await musicApi.getPlaylistDetails(id);
        setPlaylist(data);
        setVisibleSongsCount(20);
      } catch (error) {
        console.error("Failed to fetch playlist details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylist();
  }, [id]);

  const songs = playlist?.songs || [];
  const songCount = songs.length;
  const visibleSongs = songs.slice(0, visibleSongsCount);
  const hasMoreSongs = visibleSongsCount < songCount;
  const playlistCoverUrl = playlist ? getHighResImage(playlist.image) : undefined;

  const lastSongElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreSongs) {
        setVisibleSongsCount(prev => Math.min(prev + 20, songCount));
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMoreSongs, songCount]);

  if (loading && !playlist) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-purple-400" size={48} />
        </div>
      </MainLayout>
    );
  }

  if (!playlist) {
    return (
      <MainLayout>
        <div className="p-10 text-center">
          <h2 className="text-2xl font-bold">Playlist not found</h2>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-tr from-black via-zinc-950 to-neutral-950 text-white p-4 md:p-10 max-w-7xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 md:mb-8 gap-1.5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl h-9 px-3 text-xs md:text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </Button>

        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 mb-10 md:mb-12">
          <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-3xl overflow-hidden shadow-2xl bg-white/5 shrink-0">
            <img src={playlistCoverUrl} alt={playlist.name} className="w-full h-full object-cover" />
          </div>
          <div className="text-center md:text-left flex-1 min-w-0">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-none uppercase text-[9px] font-bold">
                PLAYLIST
              </Badge>
              <Badge variant="outline" className="text-[9px] font-bold uppercase text-zinc-400 border-white/10">
                {playlist.language}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-3 leading-tight" dangerouslySetInnerHTML={{ __html: playlist.name }}></h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-zinc-400 font-medium text-xs md:text-sm">
              <div className="flex items-center gap-1.5">
                <ListMusic size={16} />
                <span>{songCount} Songs</span>
              </div>
              {playlist.year && (
                <div className="flex items-center gap-1.5">
                  <Clock size={16} />
                  <span>{playlist.year}</span>
                </div>
              )}
            </div>
            <div className="mt-6 md:mt-8">
              <Button 
                onClick={() => songs.length > 0 && playSong(songs[0], songs)}
                className="rounded-full px-8 md:px-10 h-11 md:h-14 font-bold gap-2 md:gap-3 shadow-xl shadow-purple-500/20 text-sm md:text-lg w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Play className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" />
                Play All Songs
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2.5 mb-6 md:mb-8">
            <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
              <Music size={18} className="text-purple-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Tracks ({songCount})</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {visibleSongs.map((song, index) => {
              const isLastElement = index === visibleSongs.length - 1;
              return (
                <div 
                  key={`${song.id}-${index}`} 
                  ref={isLastElement ? lastSongElementRef : null}
                >
                  <SongCard song={song} allSongs={songs} fallbackImage={playlistCoverUrl} />
                </div>
              );
            })}
          </div>

          {hasMoreSongs && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-purple-400" size={24} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PlaylistDetails;