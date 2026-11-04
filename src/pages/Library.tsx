"use client";

import React, { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useMusic } from '@/context/MusicContext';
import { SongCard } from '@/components/SongCard';
import { Heart, ListMusic, Plus, Clock, MoreVertical, Play, Film, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Library = () => {
  const { likedSongs, playlists, createPlaylist, recentlyWatched, playMovie } = useMusic();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName);
      setNewPlaylistName('');
      setIsDialogOpen(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-tr from-black via-zinc-950 to-neutral-950 text-white p-4 md:p-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Your Library</h1>
            <p className="text-xs md:text-sm text-zinc-400 font-medium">Manage your favorites, playlists, and watch history.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-1.5 h-10 px-4 font-bold shadow-lg shadow-purple-600/20 text-xs w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white">
                <Plus size={16} />
                New Playlist
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-white/10 max-w-[90vw] sm:max-w-md rounded-3xl text-white">
              <DialogHeader>
                <DialogTitle className="text-xl md:text-2xl font-black">Create Playlist</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePlaylist} className="space-y-4 pt-4">
                <Input 
                  placeholder="Playlist Name (e.g. Tamil Vibes)" 
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="bg-white/5 h-11 rounded-xl border-none font-bold text-sm text-white"
                  autoFocus
                />
                <Button type="submit" className="w-full h-11 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-700 text-white">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="liked" className="w-full">
          <TabsList className="bg-white/5 p-1 rounded-2xl mb-6 md:mb-8 w-fit flex flex-wrap gap-1">
            <TabsTrigger value="liked" className="rounded-xl px-4 py-2 font-bold gap-1.5 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white text-zinc-400">
              <Heart size={14} />
              Liked Songs
              {likedSongs.length > 0 && <span className="ml-1 text-[9px] bg-white/20 px-1.5 rounded-full text-white">{likedSongs.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="watched" className="rounded-xl px-4 py-2 font-bold gap-1.5 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white text-zinc-400">
              <History size={14} />
              Continue Watching
              {recentlyWatched.length > 0 && <span className="ml-1 text-[9px] bg-white/20 px-1.5 rounded-full text-white">{recentlyWatched.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="playlists" className="rounded-xl px-4 py-2 font-bold gap-1.5 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white text-zinc-400">
              <ListMusic size={14} />
              Playlists
              {playlists.length > 0 && <span className="ml-1 text-[9px] bg-white/20 px-1.5 rounded-full text-white">{playlists.length}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="liked" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {likedSongs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {likedSongs.map((song) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                <Heart className="text-zinc-600 mb-4 w-9 h-9 md:w-12 md:h-12" />
                <h3 className="text-lg font-bold mb-1">No liked songs yet</h3>
                <p className="text-xs text-zinc-400 max-w-xs mb-6">Tap the heart icon on any song to save it here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="watched" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {recentlyWatched.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {recentlyWatched.map((movie) => (
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
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="font-bold text-xs md:text-sm truncate group-hover:text-purple-400 transition-colors">{movie.title}</h3>
                      <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold mt-1">Continue Watching</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                <Film className="text-zinc-600 mb-4 w-9 h-9 md:w-12 md:h-12" />
                <h3 className="text-lg font-bold mb-1">No watch history</h3>
                <p className="text-xs text-zinc-400 max-w-xs">Start watching movies in the Cinema section to see them here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="playlists" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="group bg-gradient-to-br from-purple-600 to-indigo-800 rounded-3xl p-6 md:p-8 aspect-[16/9] flex flex-col justify-end cursor-pointer shadow-xl transition-transform hover:-translate-y-1">
                  <Heart size={32} className="mb-3 md:mb-4 text-white fill-white" />
                  <h3 className="text-xl md:text-2xl font-black text-white">Liked Songs</h3>
                  <p className="text-white/70 font-bold text-xs uppercase tracking-wider">{likedSongs.length} Tracks</p>
                </div>

                {playlists.map(playlist => (
                  <div key={playlist.id} className="group bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 aspect-[16/9] flex flex-col justify-end cursor-pointer transition-all hover:bg-white/10 hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-auto">
                      <div className="bg-purple-500/20 p-2.5 md:p-3 rounded-2xl border border-purple-500/30">
                        <ListMusic className="text-purple-400 w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <button className="text-zinc-400 hover:text-white"><MoreVertical className="w-4.5 h-4.5 md:w-5 md:h-5" /></button>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black">{playlist.name}</h3>
                    <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider">{playlist.songs.length} Tracks</p>
                  </div>
                ))}
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Library;