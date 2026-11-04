"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { musicApi, Song } from '@/services/musicApi';
import { Mic2, ArrowLeft, Play, Loader2, Search, Music, ChevronDown } from 'lucide-react';
import { useMusic } from '@/context/MusicContext';
import { SongCard } from '@/components/SongCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getHighResImage } from '@/lib/image-utils';

interface ArtistData {
  id: string;
  name: string;
  image: string;
  role: string;
  popularity: number;
}

// Directly define curated, high-quality Saavn CDN/Unsplash artist portraits for instant zero-fetch loading on page mount.
const PREDEFINED_ARTISTS: { composers: ArtistData[]; maleSingers: ArtistData[]; femaleSingers: ArtistData[] } = {
  composers: [
    {
      id: "456269",
      name: "A. R. Rahman",
      image: "https://c.saavncdn.com/artists/AR_Rahman_002_20210515082728_500x500.jpg",
      role: "Composer",
      popularity: 98
    },
    {
      id: "457536",
      name: "Ilaiyaraaja",
      image: "https://c.saavncdn.com/artists/Ilaiyaraaja_500x500.jpg",
      role: "Composer",
      popularity: 96
    },
    {
      id: "455663",
      name: "Anirudh Ravichander",
      image: "https://c.saavncdn.com/artists/Anirudh_Ravichander_500x500.jpg",
      role: "Composer",
      popularity: 97
    },
    {
      id: "455130",
      name: "Harris Jayaraj",
      image: "https://c.saavncdn.com/artists/Harris_Jayaraj_500x500.jpg",
      role: "Composer",
      popularity: 92
    },
    {
      id: "455124",
      name: "Yuvan Shankar Raja",
      image: "https://c.saavncdn.com/artists/Yuvan_Shankar_Raja_500x500.jpg",
      role: "Composer",
      popularity: 94
    },
    {
      id: "458925",
      name: "M. S. Viswanathan",
      image: "https://c.saavncdn.com/artists/M_S_Viswanathan_500x500.jpg",
      role: "Composer",
      popularity: 88
    },
    {
      id: "455431",
      name: "Vidyasagar",
      image: "https://c.saavncdn.com/artists/Vidyasagar_500x500.jpg",
      role: "Composer",
      popularity: 89
    },
    {
      id: "455219",
      name: "Deva",
      image: "https://c.saavncdn.com/artists/Deva_500x500.jpg",
      role: "Composer",
      popularity: 87
    },
    {
      id: "509710",
      name: "G. V. Prakash Kumar",
      image: "https://c.saavncdn.com/artists/G_V_Prakash_Kumar_500x500.jpg",
      role: "Composer",
      popularity: 91
    },
    {
      id: "557323",
      name: "Santhosh Narayanan",
      image: "https://c.saavncdn.com/artists/Santhosh_Narayanan_500x500.jpg",
      role: "Composer",
      popularity: 90
    }
  ],
  maleSingers: [
    {
      id: "457319",
      name: "S. P. Balasubrahmanyam",
      image: "https://c.saavncdn.com/artists/S_P_Balasubrahmanyam_500x500.jpg",
      role: "Male Singer",
      popularity: 97
    },
    {
      id: "458117",
      name: "K. J. Yesudas",
      image: "https://c.saavncdn.com/artists/K_J_Yesudas_500x500.jpg",
      role: "Male Singer",
      popularity: 94
    },
    {
      id: "83970046",
      name: "Sid Sriram",
      image: "https://c.saavncdn.com/artists/Sid_Sriram_500x500.jpg",
      role: "Male Singer",
      popularity: 95
    },
    {
      id: "455214",
      name: "Hariharan",
      image: "https://c.saavncdn.com/artists/Hariharan_500x500.jpg",
      role: "Male Singer",
      popularity: 91
    },
    {
      id: "455122",
      name: "Shankar Mahadevan",
      image: "https://c.saavncdn.com/artists/Shankar_Mahadevan_500x500.jpg",
      role: "Male Singer",
      popularity: 92
    },
    {
      id: "455219_s",
      name: "P. Unnikrishnan",
      image: "https://c.saavncdn.com/artists/P_Unnikrishnan_500x500.jpg",
      role: "Male Singer",
      popularity: 89
    },
    {
      id: "455440",
      name: "Karthik",
      image: "https://c.saavncdn.com/artists/Karthik_500x500.jpg",
      role: "Male Singer",
      popularity: 91
    },
    {
      id: "457173",
      name: "Haricharan",
      image: "https://c.saavncdn.com/artists/Haricharan_500x500.jpg",
      role: "Male Singer",
      popularity: 88
    },
    {
      id: "492211",
      name: "Pradeep Kumar",
      image: "https://c.saavncdn.com/artists/Pradeep_Kumar_500x500.jpg",
      role: "Male Singer",
      popularity: 90
    },
    {
      id: "458316",
      name: "T. M. Soundararajan",
      image: "https://c.saavncdn.com/artists/T_M_Soundararajan_500x500.jpg",
      role: "Male Singer",
      popularity: 91
    }
  ],
  femaleSingers: [
    {
      id: "457418",
      name: "K. S. Chithra",
      image: "https://c.saavncdn.com/artists/K_S_Chithra_500x500.jpg",
      role: "Female Singer",
      popularity: 96
    },
    {
      id: "458113",
      name: "S. Janaki",
      image: "https://c.saavncdn.com/artists/S_Janaki_500x500.jpg",
      role: "Female Singer",
      popularity: 93
    },
    {
      id: "455118",
      name: "Shreya Ghoshal",
      image: "https://c.saavncdn.com/artists/Shreya_Ghoshal_500x500.jpg",
      role: "Female Singer",
      popularity: 97
    },
    {
      id: "458317",
      name: "P. Susheela",
      image: "https://c.saavncdn.com/artists/P_Susheela_500x500.jpg",
      role: "Female Singer",
      popularity: 92
    },
    {
      id: "458114",
      name: "Swarnalatha",
      image: "https://c.saavncdn.com/artists/Swarnalatha_500x500.jpg",
      role: "Female Singer",
      popularity: 90
    },
    {
      id: "455648",
      name: "Sujatha Mohan",
      image: "https://c.saavncdn.com/artists/Sujatha_Mohan_500x500.jpg",
      role: "Female Singer",
      popularity: 91
    },
    {
      id: "457176",
      name: "Chinmayi Sripada",
      image: "https://c.saavncdn.com/artists/Chinmayi_Sripada_500x500.jpg",
      role: "Female Singer",
      popularity: 91
    },
    {
      id: "456817",
      name: "Shweta Mohan",
      image: "https://c.saavncdn.com/artists/Shweta_Mohan_500x500.jpg",
      role: "Female Singer",
      popularity: 89
    },
    {
      id: "484110",
      name: "Shakthisree Gopalan",
      image: "https://c.saavncdn.com/artists/Shakthisree_Gopalan_500x500.jpg",
      role: "Female Singer",
      popularity: 90
    },
    {
      id: "6721021",
      name: "Dhee",
      image: "https://c.saavncdn.com/artists/Dhee_500x500.jpg",
      role: "Female Singer",
      popularity: 92
    }
  ]
};

const Artists = () => {
  const { playSong, selectedLanguages } = useMusic();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<ArtistData | null>(null);
  
  const [artistSongs, setArtistSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchArtistSongs = useCallback(async (artistId: string, pageNum: number, artistName?: string) => {
    if (pageNum === 0) setLoadingSongs(true);
    
    try {
      const results = await musicApi.getArtistSongs(artistId, pageNum, artistName);
      
      if (!results || results.length === 0) {
        setHasMore(false);
        if (pageNum === 0) setArtistSongs([]);
        return;
      }

      // Filter songs strictly matching selected languages
      const filtered = results.filter((song: Song) => {
        if (!song.language) return false;
        const songLang = song.language.toLowerCase().trim();
        return selectedLanguages.includes(songLang);
      });

      setArtistSongs(prev => pageNum === 0 ? filtered : [...prev, ...filtered]);
      
      if (results.length < 50) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch artist songs:", error);
    } finally {
      setLoadingSongs(false);
    }
  }, [selectedLanguages]);

  const lastSongElementRef = useCallback((node: HTMLDivElement) => {
    if (loadingSongs) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loadingSongs, hasMore]);

  useEffect(() => {
    if (selectedArtist && page > 0) {
      fetchArtistSongs(selectedArtist.id, page, selectedArtist.name);
    }
  }, [page, selectedArtist, fetchArtistSongs]);

  const handleArtistClick = (artist: ArtistData) => {
    setSelectedArtist(artist);
    setArtistSongs([]);
    setPage(0);
    setHasMore(true);
    fetchArtistSongs(artist.id, 0, artist.name);
  };

  const filterList = (list: ArtistData[]) => {
    if (!searchQuery.trim()) return list;
    return list.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  if (selectedArtist) {
    const artistImage = selectedArtist.image;
    
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-tr from-black via-zinc-950 to-neutral-950 text-white p-4 md:p-10 max-w-7xl mx-auto space-y-8">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedArtist(null)}
            className="gap-1.5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl h-9 px-3 text-xs md:text-sm"
          >
            <ArrowLeft size={16} />
            <span>Back to Artists</span>
          </Button>

          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden shadow-[0_20px_50px_rgba(147,51,234,0.15)] border-4 border-purple-500/20 bg-white/5 shrink-0">
              <img src={artistImage} alt={selectedArtist.name} className="w-full h-full object-cover" />
            </div>
            <div className="text-center md:text-left flex-1 min-w-0">
              <span className="text-[10px] tracking-[0.2em] font-black uppercase text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                {selectedArtist.role}
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tighter mt-4 mb-3 leading-tight" dangerouslySetInnerHTML={{ __html: selectedArtist.name }} />
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Button 
                  onClick={() => artistSongs.length > 0 && playSong(artistSongs[0], artistSongs)}
                  disabled={artistSongs.length === 0}
                  className="rounded-full px-8 h-12 font-bold gap-2 shadow-xl shadow-purple-500/20 text-xs md:text-sm bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Play className="w-4 h-4" fill="currentColor" />
                  Play Discography
                </Button>
                <Badge variant="outline" className="border-white/10 text-zinc-300 h-10 px-4">
                  ★ {selectedArtist.popularity}% Popularity
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
              <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                <Music size={18} className="text-purple-400" />
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">Artist Tracks</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 animate-in fade-in duration-500">
              {artistSongs.map((song, index) => {
                const isLast = index === artistSongs.length - 1;
                return (
                  <div key={`${song.id}-${index}`} ref={isLast ? lastSongElementRef : null}>
                    <SongCard song={song} allSongs={artistSongs} />
                  </div>
                );
              })}
            </div>

            {loadingSongs && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-purple-500 w-8 h-8" />
              </div>
            )}

            {!hasMore && artistSongs.length > 0 && (
              <p className="text-center text-zinc-500 text-xs py-10">You've reached the end of the discography.</p>
            )}

            {!loadingSongs && artistSongs.length === 0 && (
              <div className="text-center py-20 text-zinc-500">
                No songs found matching your preferred language settings ({selectedLanguages.join(', ')}).
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-tr from-black via-zinc-950 to-neutral-950 text-white p-4 md:p-10 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2.5 rounded-xl border border-purple-500/30">
              <Mic2 className="text-purple-400 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Top Artists</h1>
              <p className="text-xs md:text-sm text-zinc-400 font-semibold">
                Explore the profiles of legendary playback singers and record-breaking composers.
              </p>
            </div>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by artist name..." 
              className="pl-10 bg-white/5 border-none h-11 rounded-xl text-sm text-white focus-visible:ring-purple-500/20"
            />
          </div>
        </div>

        <Tabs defaultValue="composers" className="w-full">
          <TabsList className="bg-white/5 p-1 rounded-2xl mb-8 w-fit flex flex-wrap gap-1">
            <TabsTrigger value="composers" className="rounded-xl px-5 py-2.5 font-bold text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white text-zinc-400">
              Music Directors
            </TabsTrigger>
            <TabsTrigger value="maleSingers" className="rounded-xl px-5 py-2.5 font-bold text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white text-zinc-400">
              Male Playback Singers
            </TabsTrigger>
            <TabsTrigger value="femaleSingers" className="rounded-xl px-5 py-2.5 font-bold text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white text-zinc-400">
              Female Playback Singers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="composers" className="animate-in fade-in duration-300">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filterList(PREDEFINED_ARTISTS.composers).map((artist) => (
                <ArtistCard key={artist.id} artist={artist} onClick={() => handleArtistClick(artist)} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="maleSingers" className="animate-in fade-in duration-300">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filterList(PREDEFINED_ARTISTS.maleSingers).map((artist) => (
                <ArtistCard key={artist.id} artist={artist} onClick={() => handleArtistClick(artist)} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="femaleSingers" className="animate-in fade-in duration-300">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filterList(PREDEFINED_ARTISTS.femaleSingers).map((artist) => (
                <ArtistCard key={artist.id} artist={artist} onClick={() => handleArtistClick(artist)} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

const ArtistCard = ({ artist, onClick }: { artist: ArtistData; onClick: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className="group flex flex-col items-center text-center gap-3 cursor-pointer p-3 rounded-2xl hover:bg-white/5 transition-all"
    >
      <div className="relative aspect-square w-full rounded-full overflow-hidden border border-white/5 bg-zinc-900 shadow-md">
        <img 
          src={artist.image} 
          alt={artist.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play size={16} fill="currentColor" className="ml-0.5" />
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-purple-300 transition-colors">
          {artist.name}
        </h4>
        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5 tracking-wider">
          ★ {artist.popularity}% popularity
        </p>
      </div>
    </div>
  );
};

export default Artists;