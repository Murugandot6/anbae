"use client";

import React, { useState, useEffect } from 'react';
import { useMusic } from '@/context/MusicContext';
import { tmdbApi, CastMember } from '@/services/tmdbApi';
import { StreamPlayer } from '@/components/StreamPlayer';
import { MovieRow } from '@/components/MovieRow';
import { 
  ArrowLeft, 
  User, 
  Star, 
  Calendar, 
  Globe, 
  Info, 
  Play, 
  Heart,
  Share2,
  Bookmark,
  Download,
  AlertCircle,
  Video,
  ChevronRight,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Watch = () => {
  const { currentMovie, closeMovie, toggleLikeMovie, isMovieLiked, playMovie } = useMusic();
  const [cast, setCast] = useState<CastMember[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentMovie) {
      navigate('/movies');
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (currentMovie.id) {
          const [credits, recs] = await Promise.all([
            tmdbApi.getMovieCredits(currentMovie.id),
            tmdbApi.searchMovies(currentMovie.title) 
          ]);
          setCast(credits || []);
          setRecommendations(recs.filter(m => m.id !== currentMovie.id).slice(0, 15));
        }
      } catch (error) {
        console.error("Failed to load movie details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentMovie, navigate]);

  if (!currentMovie) return null;

  const isLiked = isMovieLiked(currentMovie.id);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0a0a0a] text-white select-none">
        
        {/* SECTION 1: HERO BACKDROP & HEADER METADATA */}
        <div className="relative w-full h-[65vh] lg:h-[75vh] overflow-hidden">
          {/* Hero Backdrop Image */}
          <div className="absolute inset-0 z-0">
            <style>{`@keyframes nm-kenburns { from { transform: scale(1); } to { transform: scale(1.12); } }`}</style>
            <img 
              src={currentMovie.backdrop} 
              alt="" 
              className="w-full h-full object-cover object-center scale-105 blur-[2px] opacity-40"
              style={{ animation: "nm-kenburns 45s ease-in-out infinite alternate" }}
            />
            {/* Smooth gradient mask into dark background */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent" />
          </div>

          {/* Hero Content Overlay */}
          <div className="relative z-10 h-full max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col justify-end pb-12 lg:pb-20">
            <div className="flex flex-col lg:flex-row items-center lg:items-end gap-8 lg:gap-16">
              
              {/* Floating Poster Artwork */}
              <div className="hidden lg:block w-64 xl:w-72 aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 shrink-0 transform hover:scale-[1.02] transition-transform duration-500">
                <img src={currentMovie.poster} alt={currentMovie.title} className="w-full h-full object-cover" />
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 text-center lg:text-left space-y-6">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  {currentMovie.genre.split(' / ').map((g, i) => (
                    <Badge key={i} variant="secondary" className="bg-pink-600/20 text-pink-400 border border-pink-500/30 px-3 py-1 font-bold text-[10px] tracking-widest uppercase rounded-full">
                      {g}
                    </Badge>
                  ))}
                  <div className="flex items-center gap-1.5 text-yellow-500 font-black text-sm ml-2">
                    <Star size={16} fill="currentColor" />
                    <span>{currentMovie.rating}</span>
                  </div>
                </div>

                <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tighter leading-[0.95] uppercase drop-shadow-2xl">
                  {currentMovie.title} <span className="text-white/40 font-light">({currentMovie.year})</span>
                </h1>

                <p className="text-zinc-400 text-xs md:text-sm font-bold uppercase tracking-[0.2em] flex items-center justify-center lg:justify-start gap-4">
                  <span>1h 45m</span>
                  <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                  <span>{currentMovie.language}</span>
                  <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                  <span className="text-pink-500">Full HD</span>
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                  <Button 
                    onClick={() => document.getElementById('watch-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="rounded-full bg-pink-600 hover:bg-pink-700 text-white px-8 h-12 md:h-14 text-sm font-black uppercase tracking-widest gap-2 shadow-xl shadow-pink-600/25 transition-all hover:scale-105 active:scale-95"
                  >
                    <Play size={18} fill="currentColor" />
                    Play Now
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-full border-white/20 hover:bg-white/10 px-8 h-12 md:h-14 text-sm font-black uppercase tracking-widest gap-2 backdrop-blur-md transition-all"
                  >
                    <Video size={18} />
                    Trailer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: DETAILS & ACTIONS */}
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-3 gap-16 border-t border-white/5">
          <div className="lg:col-span-2 space-y-10 text-left">
            {/* Plot Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.25em] text-pink-500">The Synopsis</h3>
              <p className="text-zinc-300 text-sm md:text-base leading-relaxed font-medium">
                {currentMovie.overview}
              </p>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <ActionButton 
                onClick={() => toggleLikeMovie(currentMovie)} 
                active={isLiked}
                icon={Heart} 
                label="Favorite" 
                activeColor="text-pink-500 bg-pink-500/10 border-pink-500/20"
              />
              <ActionButton icon={Bookmark} label="Bookmark" />
              <ActionButton onClick={handleShare} icon={Share2} label="Share" />
              <ActionButton icon={Download} label="Download" />
              <ActionButton icon={AlertCircle} label="Report" />
            </div>

            {/* Cast Grid */}
            <div className="space-y-6 pt-4">
              <h3 className="text-sm font-black uppercase tracking-[0.25em] text-pink-500">Top Billed Cast</h3>
              <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 no-scrollbar">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="w-20 h-20 rounded-full bg-white/5 shrink-0" />
                  ))
                ) : cast.map((actor) => (
                  <div key={actor.id} className="w-20 md:w-24 shrink-0 space-y-3 group text-center">
                    <div className="aspect-square w-full rounded-full overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-pink-500/50 transition-all shadow-lg">
                      {actor.profile_path ? (
                        <img src={actor.profile_path} alt={actor.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-800"><User size={24} /></div>
                      )}
                    </div>
                    <p className="text-[10px] md:text-xs font-bold text-white truncate px-1">{actor.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Detail Box */}
          <div className="space-y-8">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 space-y-6 backdrop-blur-xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500">Production Info</h3>
              
              <div className="space-y-4">
                <SideInfo icon={Calendar} label="Released" value={currentMovie.year} />
                <SideInfo icon={Globe} label="Language" value={currentMovie.language} />
                <SideInfo icon={LayoutGrid} label="Type" value={currentMovie.genre.split(' / ')[0]} />
                <SideInfo icon={Star} label="Rating" value={`${currentMovie.rating} / 10`} />
              </div>

              <div className="pt-6 border-t border-white/5">
                <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase tracking-wider">
                  Source: community-indexed streaming nodes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: VIDEO PLAYER SECTION */}
        <div id="watch-section" className="bg-black py-12 lg:py-20 border-y border-white/5">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 space-y-6">
            <div className="flex items-center gap-4 px-2">
              <div className="w-1.5 h-6 bg-pink-600 rounded-full" />
              <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter">Virtual Theater</h2>
            </div>
            <div className="w-full">
              <StreamPlayer movie={currentMovie} />
            </div>
          </div>
        </div>

        {/* SECTION 4: MORE LIKE THIS (RECOMMENDATIONS) */}
        {recommendations.length > 0 && (
          <div className="py-20 lg:py-28 max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white/90">
                You May Also Like
              </h2>
              <button className="text-xs font-black uppercase tracking-widest text-pink-500 flex items-center gap-2 hover:text-pink-400 transition-colors">
                View All <ChevronRight size={16} />
              </button>
            </div>
            <MovieRow 
              title="" 
              movies={recommendations} 
              onPlay={(m) => {
                playMovie(m);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
            />
          </div>
        )}

        {/* Footer Padding */}
        <div className="h-32" />
      </div>
    </MainLayout>
  );
};

const ActionButton = ({ icon: Icon, label, onClick, active, activeColor }: { icon: any, label: string, onClick?: () => void, active?: boolean, activeColor?: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[11px] font-black uppercase tracking-wider group",
      active && (activeColor || "bg-white/20")
    )}
  >
    <Icon size={14} className={cn("group-hover:scale-110 transition-transform", active && "fill-current")} />
    <span>{label}</span>
  </button>
);

const SideInfo = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-white/5 text-zinc-500">
        <Icon size={14} />
      </div>
      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-[11px] font-black uppercase text-zinc-200">{value}</span>
  </div>
);

export default Watch;