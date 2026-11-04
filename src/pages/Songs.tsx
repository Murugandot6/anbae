"use client";

import React from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useMusic } from '@/context/MusicContext';
import { SongCard } from '@/components/SongCard';
import { History, Music, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Songs = () => {
  const { recentlyPlayed } = useMusic();
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-tr from-black via-zinc-950 to-neutral-950 text-white p-4 md:p-10 max-w-7xl mx-auto space-y-8">
        {/* Immersive Header with Back Button */}
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
            title="Back to Hub"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="bg-purple-500/20 p-2 rounded-xl border border-purple-500/30">
            <History className="text-purple-400 w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">Recently Played</h1>
            <p className="text-xs text-zinc-400 font-medium">Your soundtrack over the last few sessions.</p>
          </div>
        </div>

        {recentlyPlayed.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {recentlyPlayed.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center bg-white/5 rounded-3xl border-2 border-dashed border-white/10">
            <Music className="text-zinc-600 mb-4 w-9 h-9 md:w-12 md:h-12" />
            <h3 className="text-lg md:text-xl font-bold mb-1">No history yet</h3>
            <p className="text-xs text-zinc-400 max-w-xs">Start listening to music and we'll track your history here.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Songs;