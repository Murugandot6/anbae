"use client";

import React from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useMusic } from '@/context/MusicContext';
import { SongCard } from '@/components/SongCard';
import { Heart, Radio, Music, Play, Pause, Film, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Favourites = () => {
  const { likedSongs, likedStations, likedMovies, playSong, playMovie, currentSong, isPlaying } = useMusic();

  const handlePlayStation = (station: any) => {
    const radioSong = {
      id: station.stationuuid,
      name: station.name,
      type: 'radio',
      primaryArtists: station.tags || 'Live FM',
      image: [{ link: station.favicon || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200' }],
      downloadUrl: [{ link: station.url_resolved }],
      language: station.language,
      album: { id: 'radio', name: 'Live Radio', url: '' },
      year: '',
      duration: 0
    };
    playSong(radioSong as any);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-tr from-black via-zinc-950 to-neutral-950 text-white p-4 md:p-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
          <div className="bg-purple-500/20 p-2.5 md:p-3 rounded-2xl border border-purple-500/30">
            <Heart className="text-purple-400 fill-purple-400 w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Favourites</h1>
            <p className="text-xs md:text-sm text-zinc-400 font-medium">Everything you've loved in one place.</p>
          </div>
        </div>

        <Tabs defaultValue="songs" className="w-full">
          <TabsList className="bg-white/5 p-1 rounded-2xl mb-6 md:mb-8 w-fit flex flex-wrap gap-1">
            <TabsTrigger value="songs" className="rounded-xl px-4 py-2 font-bold gap-1.5 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white text-zinc-400">
              <Music size={14} />
              Songs
              {likedSongs.length > 0 && <span className="ml-1 text-[9px] bg-white/20 px-1.5 rounded-full text-white">{likedSongs.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="movies" className="rounded-xl px-4 py-2 font-bold gap-1.5 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white text-zinc-400">
              <Film size={14} />
              Movies
              {likedMovies.length > 0 && <span className="ml-1 text-[9px] bg-white/20 px-1.5 rounded-full text-white">{likedMovies.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="stations" className="rounded-xl px-4 py-2 font-bold gap-1.5 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white text-zinc-400">
              <Radio size={14} />
              FM Stations
              {likedStations.length > 0 && <span className="ml-1 text-[9px] bg-white/20 px-1.5 rounded-full text-white">{likedStations.length}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="songs" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {likedSongs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {likedSongs.map((song) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                <Music className="text-zinc-600 mb-4 w-9 h-9 md:w-12 md:h-12" />
                <h3 className="text-lg font-bold mb-1">No liked songs yet</h3>
                <p className="text-xs text-zinc-400 max-w-xs">Tap the heart icon on any song to save it here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="movies" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {likedMovies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {likedMovies.map((movie) => (
                  <div 
                    key={movie.id}
                    onClick={() => playMovie(movie)}
                    className="group relative bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-1.5 cursor-pointer"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img src={movie.backdrop} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xl">
                          <Play size={16} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 text-[9px] font-bold text-yellow-500">
                        <Star size={10} fill="currentColor" />
                        {movie.rating}
                      </div>
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="font-bold text-xs md:text-sm truncate group-hover:text-purple-400 transition-colors">{movie.title}</h3>
                      <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold mt-1">{movie.year} • {movie.genre}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                <Film className="text-zinc-600 mb-4 w-9 h-9 md:w-12 md:h-12" />
                <h3 className="text-lg font-bold mb-1">No liked movies yet</h3>
                <p className="text-xs text-zinc-400 max-w-xs">Heart your favorite movies to see them here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stations" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {likedStations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {likedStations.map((station) => {
                  const isActive = currentSong?.id === station.stationuuid;
                  return (
                    <div 
                      key={station.stationuuid}
                      onClick={() => handlePlayStation(station)}
                      className={cn(
                        "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl border transition-all duration-300 cursor-pointer group",
                        isActive 
                          ? "bg-purple-500/10 border-purple-500/30" 
                          : "bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10"
                      )}
                    >
                      <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
                        <img 
                          src={station.favicon || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200'} 
                          alt={station.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className={cn(
                          "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                          {isActive && isPlaying ? <Pause size={16} fill="currentColor" className="text-white" /> : <Play size={16} fill="currentColor" className="text-white" />}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-xs md:text-sm truncate">{station.name}</h3>
                        <Badge variant="secondary" className="bg-white/10 text-[8px] font-bold px-1.5 py-0 mt-1 text-white">
                          {station.language.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                <Radio className="text-zinc-600 mb-4 w-9 h-9 md:w-12 md:h-12" />
                <h3 className="text-lg font-bold mb-1">No liked stations yet</h3>
                <p className="text-xs text-zinc-400 max-w-xs">Heart your favorite FM stations to see them here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Favourites;