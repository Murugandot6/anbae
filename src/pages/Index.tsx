"use client";

import React from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useNavigate } from 'react-router-dom';
import { Music, Film, Radio, ScrollText, Tv, ArrowRight, Sparkles } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const hubs = [
    {
      id: 'music',
      title: 'Music',
      subtitle: 'Premium Audio Station',
      icon: Music,
      path: '/music',
      accentColor: 'green',
      accentClass: 'text-green-400 group-hover:text-green-300',
      borderClass: 'border-l-4 border-l-green-500/50 hover:border-l-green-400 hover:border-green-500/30',
      bgIconClass: 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20',
      hoverTextClass: 'group-hover:text-green-400',
      description: 'Stream millions of tracks with zero interruptions.'
    },
    {
      id: 'movies',
      title: 'Cinema',
      subtitle: 'On-Demand Streaming',
      icon: Film,
      path: '/movies',
      accentColor: 'purple',
      accentClass: 'text-purple-400 group-hover:text-purple-300',
      borderClass: 'border-l-4 border-l-purple-500/50 hover:border-l-purple-400 hover:border-purple-500/30',
      bgIconClass: 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20',
      hoverTextClass: 'group-hover:text-purple-400',
      description: 'Synchronized cinema experience for you and friends.'
    },
    {
      id: 'radio',
      title: 'World Radio',
      subtitle: 'Global FM Broadcasts',
      icon: Radio,
      path: '/radio',
      accentColor: 'orange',
      accentClass: 'text-orange-400 group-hover:text-orange-300',
      borderClass: 'border-l-4 border-l-orange-500/50 hover:border-l-orange-400 hover:border-orange-500/30',
      bgIconClass: 'bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20',
      hoverTextClass: 'group-hover:text-orange-400',
      description: 'Live terrestrial radio from across the planet.'
    },
    {
      id: 'lyrics',
      title: 'Lyrics',
      subtitle: 'Tamil Song Library',
      icon: ScrollText,
      path: '/lyrics',
      accentColor: 'rose',
      accentClass: 'text-rose-400 group-hover:text-rose-300',
      borderClass: 'border-l-4 border-l-rose-500/50 hover:border-l-rose-400 hover:border-rose-500/30',
      bgIconClass: 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20',
      hoverTextClass: 'group-hover:text-rose-400',
      description: 'Search songs, films and singers — read full Tamil lyrics.'
    },
    {
      id: 'tv',
      title: 'Live TV',
      subtitle: 'Global Channel Streams',
      icon: Tv,
      path: '/tv',
      accentColor: 'cyan',
      accentClass: 'text-cyan-400 group-hover:text-cyan-300',
      borderClass: 'border-l-4 border-l-cyan-500/50 hover:border-l-cyan-400 hover:border-cyan-500/30',
      bgIconClass: 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20',
      hoverTextClass: 'group-hover:text-cyan-400',
      description: 'Thousands of free live channels — news, movies, music and sports.'
    }
  ];

  return (
    <MainLayout>
      <div className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-[#050506] py-20 px-6">
        {/* Background Visuals */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-600/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.9)_100%)]" />
        </div>

        <div className="relative z-10 max-w-[640px] mx-auto w-full space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center justify-center gap-1.5">
              <Sparkles size={12} className="text-purple-400 animate-pulse" />
              Entertainment Hub
            </p>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-[1.05] text-[#f2f2f4] uppercase">
              Experience <span className="text-zinc-600 font-medium italic">Limitless</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-semibold uppercase tracking-widest leading-relaxed max-w-[420px] mx-auto">
              Choose your entertainment node. Clean, ad-blocked, and fully synchronized.
            </p>
          </div>

          {/* Vertical Stack */}
          <div className="flex flex-col gap-3.5 w-full animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {hubs.map((hub) => (
              <div
                key={hub.id}
                onClick={() => navigate(hub.path)}
                className={`group flex items-center gap-5 p-5 sm:p-6 bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5 rounded-xl text-left cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:translate-y-[-2px] shadow-xl ${hub.borderClass}`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-11 h-11 sm:w-12 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 ${hub.bgIconClass}`}>
                  <hub.icon size={20} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="margin-0 mb-0.5 text-base font-extrabold tracking-tight uppercase text-white">
                    {hub.title}
                  </h2>
                  <span className={`text-[10.5px] font-bold uppercase tracking-wider mb-1.5 block ${hub.accentClass}`}>
                    {hub.subtitle}
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                    {hub.description}
                  </p>
                </div>

                {/* Launch Arrow */}
                <div className={`flex-shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-colors duration-300 ${hub.hoverTextClass}`}>
                  <span className="hidden sm:inline">Launch</span>
                  <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;