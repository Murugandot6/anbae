"use client";

import React from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useMusic } from '@/context/MusicContext';
import { BookOpen, Trash2, Music, Calendar, ArrowLeft, Quote, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const Journal = () => {
  const { memories, deleteMemory, playSong } = useMusic();
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-tr from-black via-zinc-950 to-neutral-950 text-white p-4 md:p-10 max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-pink-600/20 p-3 rounded-2xl border border-pink-500/30">
              <BookOpen className="text-pink-400 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Music Journal</h1>
              <p className="text-xs md:text-sm text-zinc-400 font-semibold">
                Your personal collection of memories and feelings attached to tracks.
              </p>
            </div>
          </div>
          
          <Badge variant="outline" className="border-pink-500/20 text-pink-400 h-9 px-4 uppercase font-black text-[10px] tracking-widest">
            {memories.length} ENTRIES
          </Badge>
        </div>

        {memories.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:gap-8">
            {memories.map((memory) => (
              <div 
                key={memory.id}
                className="group relative bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-10 hover:bg-white/[0.04] transition-all duration-500 hover:border-pink-500/20"
              >
                {/* Song Artwork & Play Trigger */}
                <div className="relative w-full md:w-48 shrink-0">
                  <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 group-hover:scale-[1.02] transition-transform duration-500">
                    <img src={memory.imageUrl} alt={memory.songName} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => playSong({ id: memory.songId, name: memory.songName, primaryArtists: memory.artistName, image: [{ url: memory.imageUrl }] } as any)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                        <Music size={20} fill="black" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Memory Content */}
                <div className="flex-1 space-y-4 text-left">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar size={12} className="text-zinc-500" />
                        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                          {format(memory.createdAt, 'MMMM do, yyyy • p')}
                        </span>
                      </div>
                      <h3 className="text-xl font-black tracking-tight text-white/90 group-hover:text-pink-400 transition-colors" dangerouslySetInnerHTML={{ __html: memory.songName }} />
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider" dangerouslySetInnerHTML={{ __html: memory.artistName }} />
                    </div>
                    <button 
                      onClick={() => deleteMemory(memory.id)}
                      className="p-2.5 rounded-xl bg-red-500/5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="relative pt-6">
                    <Quote className="absolute top-0 left-0 text-pink-500/20 w-10 h-10 -ml-2 -mt-1" />
                    <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-medium italic relative z-10">
                      {memory.text}
                    </p>
                  </div>
                </div>

                {/* Background Decor */}
                <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Sparkles className="text-pink-500/30 w-12 h-12 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
              <BookOpen className="text-zinc-700" size={32} />
            </div>
            <h3 className="text-xl font-black tracking-tight mb-2">No entries yet</h3>
            <p className="text-sm text-zinc-400 max-w-xs leading-relaxed font-medium">
              Start playing a song and click the "Write Memory" icon to record your feelings or stories.
            </p>
            <Button 
              onClick={() => navigate('/music')}
              className="mt-8 rounded-full bg-white text-black hover:bg-zinc-200 px-8 h-12 font-black text-xs uppercase tracking-widest shadow-xl"
            >
              Discover Music
            </Button>
          </div>
        )}

        <div className="h-20" />
      </div>
    </MainLayout>
  );
};

export default Journal;