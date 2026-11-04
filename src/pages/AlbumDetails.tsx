"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { musicApi, Album, getContainerCount } from '@/services/musicApi';
import { SongCard } from '@/components/SongCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Music, Loader2, ListMusic, Calendar } from 'lucide-react';
import { getHighResImage } from '@/lib/image-utils';
import { Badge } from '@/components/ui/badge';
import { useMusic } from '@/context/MusicContext';

const AlbumDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const { playSong } = useMusic();

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await musicApi.getAlbumDetails(id);
        setAlbum(data);
      } catch (error) {
        console.error("Failed to fetch album details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-purple-400" size={48} />
        </div>
      </MainLayout>
    );
  }

  if (!album) {
    return (
      <MainLayout>
        <div className="p-10 text-center">
          <h2 className="text-2xl font-bold">Album not found</h2>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
      </MainLayout>
    );
  }

  const songs = album.songs || [];
  const trackCount = songs.length || Number(album.songCount) || getContainerCount(album);
  const albumCoverUrl = getHighResImage(album.image);

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
            <img src={albumCoverUrl} alt={album.name} className="w-full h-full object-cover" />
          </div>
          <div className="text-center md:text-left flex-1 min-w-0">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-none uppercase text-[9px] font-bold">
                ALBUM
              </Badge>
              <Badge variant="outline" className="text-[9px] font-bold uppercase text-zinc-400 border-white/10">
                {album.language || 'unknown'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-3 leading-tight" dangerouslySetInnerHTML={{ __html: album.name }}></h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-zinc-400 font-medium text-xs md:text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar size={16} />
                <span>{album.year || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ListMusic size={16} />
                <span>{trackCount} Tracks</span>
              </div>
            </div>
            <div className="mt-6 md:mt-8">
              <Button 
                onClick={() => songs.length > 0 && playSong(songs[0], songs)}
                className="rounded-full px-8 md:px-10 h-11 md:h-14 font-bold gap-2 md:gap-3 shadow-xl shadow-purple-500/20 text-sm md:text-lg w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Play className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" />
                Play Album
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2.5 mb-6 md:mb-8">
            <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
              <Music size={18} className="text-purple-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Tracklist</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {songs.length > 0 ? (
              songs.map((song) => (
                <SongCard key={song.id} song={song} allSongs={songs} fallbackImage={albumCoverUrl} />
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-zinc-500 text-sm">No songs found in this album.</div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AlbumDetails;