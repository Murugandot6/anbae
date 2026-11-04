"use client";

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Sparkles, Loader2, ChevronDown, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { musicApi, Playlist } from '@/services/musicApi';
import { getHighResImage } from '@/lib/image-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useMusic } from '@/context/MusicContext';

const Featured = () => {
  const navigate = useNavigate();
  const { selectedLanguages } = useMusic();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeaturedPlaylists = async (pageNum: number, langs: string[]) => {
    if (pageNum === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const activeLangs = langs.length > 0 ? langs : ['tamil'];
      const limitPerLang = Math.max(15, Math.floor(40 / activeLangs.length));
      
      const promises = activeLangs.map(lang => 
        musicApi.searchPlaylists(`top ${lang}`, pageNum, limitPerLang).catch(err => {
          console.error(`Failed to fetch playlists for ${lang}:`, err);
          return [] as Playlist[];
        })
      );

      const resultsArray = await Promise.all(promises);
      
      const combined: Playlist[] = [];
      const maxLength = Math.max(...resultsArray.map(r => r.length));
      
      for (let i = 0; i < maxLength; i++) {
        for (let j = 0; j < resultsArray.length; j++) {
          if (resultsArray[j][i]) {
            combined.push(resultsArray[j][i]);
          }
        }
      }

      if (combined.length === 0) {
        setHasMore(false);
      } else {
        setPlaylists(prev => pageNum === 0 ? combined : [...prev, ...combined]);
        if (combined.length < (limitPerLang * activeLangs.length) / 2) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch featured playlists:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(0);
    setPlaylists([]);
    setHasMore(true);
    fetchFeaturedPlaylists(0, selectedLanguages);
  }, [selectedLanguages]);

  useEffect(() => {
    if (page > 0) {
      fetchFeaturedPlaylists(page, selectedLanguages);
    }
  }, [page]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

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

        <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
          <div className="bg-purple-500/20 p-2.5 md:p-3 rounded-2xl border border-purple-500/30">
            <Sparkles className="text-purple-400 w-6 h-6 md:w-8 md:h-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Featured Playlists</h1>
            <p className="text-xs md:text-sm text-zinc-400 font-medium">
              Explore curated collections in <span className="text-purple-400 font-bold uppercase">{selectedLanguages.join(', ')}</span>.
            </p>
          </div>
        </div>

        {loading && playlists.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-3xl bg-white/5" />
                <Skeleton className="h-6 w-3/4 rounded-lg bg-white/5" />
              </div>
            ))}
          </div>
        ) : playlists.length > 0 ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 animate-in fade-in duration-500">
              {playlists.map((playlist, index) => {
                const songCount = playlist.songCount || "0";
                return (
                  <div 
                    key={`${playlist.id}-${index}`}
                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                    className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer shadow-xl border border-white/5 transition-all hover:-translate-y-2"
                  >
                    <img 
                      src={getHighResImage(playlist.image)} 
                      alt={playlist.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent p-6 md:p-8 flex flex-col justify-end">
                      <h3 className="text-white font-black text-xl md:text-2xl mb-1 md:mb-2 leading-tight" dangerouslySetInnerHTML={{ __html: playlist.name }}></h3>
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{songCount} Tracks</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={handleLoadMore} 
                  disabled={loadingMore}
                  className="rounded-2xl px-8 h-12 font-bold gap-2 shadow-xl shadow-purple-500/10 text-sm bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {loadingMore ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <ChevronDown size={18} />
                      Load More Playlists
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-500">
            No featured playlists found for your selected languages.
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Featured;