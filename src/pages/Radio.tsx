"use client";

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { radioApi, RadioStation } from '@/services/radioApi';
import { Radio as RadioIcon, Play, Pause, Search, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMusic } from '@/context/MusicContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

const Radio = () => {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { playSong, currentSong, isPlaying, selectedLanguages, toggleLikeStation, isStationLiked } = useMusic();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStations = async () => {
      setLoading(true);
      try {
        const primaryLang = selectedLanguages[0] || 'english';
        const data = await radioApi.getStations(primaryLang);
        setStations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch stations', error);
        setStations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStations();
  }, [selectedLanguages]);

  const handlePlayStation = (station: RadioStation) => {
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?type=fm&q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/20 p-2 rounded-xl">
                <RadioIcon className="text-primary" size={20} />
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-bold">LIVE FM</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">World Radio</h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Broadcasts from: <span className="text-primary font-bold uppercase">{selectedLanguages.join(', ')}</span></p>
          </div>
          
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search global stations..." 
              className="pl-9 bg-accent/5 border-none h-10 rounded-xl text-sm"
            />
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-20 md:h-24 w-full rounded-2xl" />
            ))
          ) : stations.length > 0 ? (
            stations.map((station) => {
              const isActive = currentSong?.id === station.stationuuid;
              const liked = isStationLiked(station.stationuuid);
              return (
                <div 
                  key={station.stationuuid}
                  className={cn(
                    "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl border transition-all duration-300 group relative",
                    isActive 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-card/50 border-transparent hover:border-accent/20 hover:bg-accent/5"
                  )}
                >
                  <div 
                    onClick={() => handlePlayStation(station)}
                    className="relative w-12 h-12 md:w-14 md:h-14 shrink-0 overflow-hidden rounded-xl bg-accent/10 cursor-pointer"
                  >
                    <img 
                      src={station.favicon || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200'} 
                      alt={station.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200' }}
                    />
                    <div className={cn(
                      "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      {isActive && isPlaying ? <Pause size={16} fill="currentColor" className="text-white" /> : <Play size={16} fill="currentColor" className="text-white" />}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handlePlayStation(station)}>
                    <h3 className="font-bold text-xs md:text-sm truncate">{station.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-accent/10 text-[8px] font-bold px-1.5 py-0">
                        {station.votes.toLocaleString()} VOTES
                      </Badge>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLikeStation(station);
                    }}
                    className={cn(
                      "p-2 rounded-full transition-all shrink-0",
                      liked ? "text-primary" : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    <Heart size={16} fill={liked ? "currentColor" : "none"} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-16 md:py-20 text-xs md:text-sm text-muted-foreground">
              No stations found for your selected languages.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Radio;