"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Song, musicApi } from '@/services/musicApi';
import { RadioStation } from '@/services/radioApi';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: number;
}

export interface Movie {
  id: string;
  title: string;
  overview: string;
  backdrop: string;
  poster: string;
  rating: number;
  year: string;
  genre: string;
  language: string;
  imdbId?: string;
  streamUrl?: string;
}

export interface SongMemory {
  id: string;
  songId: string;
  songName: string;
  artistName: string;
  imageUrl: string;
  text: string;
  createdAt: number;
}

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song, queue?: Song[], fromSync?: boolean) => Promise<void>;
  playRandom: () => Promise<void>;
  pauseSong: (fromSync?: boolean) => void;
  resumeSong: (fromSync?: boolean) => void;
  togglePlay: () => void;
  playNext: (fromSync?: boolean) => void;
  playPrevious: (fromSync?: boolean) => void;
  addToNext: (song: Song) => void;
  currentTime: number;
  duration: number;
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
  seek: (time: number, fromSync?: boolean) => void;
  roomCode: string | null;
  setRoomCode: (code: string | null) => void;
  isHost: boolean;
  setIsHost: (isHost: boolean) => void;
  selectedLanguages: string[];
  toggleLanguage: (lang: string) => void;
  likedSongs: Song[];
  toggleLike: (song: Song) => void;
  isLiked: (songId: string) => boolean;
  likedStations: RadioStation[];
  toggleLikeStation: (station: RadioStation) => void;
  isStationLiked: (stationId: string) => boolean;
  recentlyPlayed: Song[];
  playlists: Playlist[];
  createPlaylist: (name: string) => void;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  isShuffle: boolean;
  toggleShuffle: (fromSync?: boolean) => void;
  repeatMode: 'none' | 'one' | 'all';
  toggleRepeat: (fromSync?: boolean) => void;
  queue: Song[];
  currentMovie: Movie | null;
  playMovie: (movie: Movie, fromSync?: boolean) => void;
  closeMovie: (fromSync?: boolean) => void;
  likedMovies: Movie[];
  toggleLikeMovie: (movie: Movie) => void;
  isMovieLiked: (movieId: string) => boolean;
  recentlyWatched: Movie[];
  // Music Journal
  memories: SongMemory[];
  addMemory: (song: Song, text: string) => void;
  deleteMemory: (memoryId: string) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['tamil']);
  
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [likedMovies, setLikedMovies] = useState<Movie[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<Movie[]>([]);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<any>(null);
  const isChannelReady = useRef(false);

  const [likedStations, setLikedStations] = useState<RadioStation[]>([]);
  const [memories, setMemories] = useState<SongMemory[]>([]);

  useEffect(() => {
    const savedLiked = localStorage.getItem('isai_liked_songs');
    const savedStations = localStorage.getItem('isai_liked_stations');
    const savedRecent = localStorage.getItem('isai_recent_songs');
    const savedPlaylists = localStorage.getItem('isai_playlists');
    const savedLikedMovies = localStorage.getItem('isai_liked_movies');
    const savedRecentMovies = localStorage.getItem('isai_recent_movies');
    const savedMemories = localStorage.getItem('isai_memories');

    if (savedLiked) try { setLikedSongs(JSON.parse(savedLiked)); } catch (e) {}
    if (savedStations) try { setLikedStations(JSON.parse(savedStations)); } catch (e) {}
    if (savedRecent) try { setRecentlyPlayed(JSON.parse(savedRecent)); } catch (e) {}
    if (savedPlaylists) try { setPlaylists(JSON.parse(savedPlaylists)); } catch (e) {}
    if (savedLikedMovies) try { setLikedMovies(JSON.parse(savedLikedMovies)); } catch (e) {}
    if (savedRecentMovies) try { setRecentlyWatched(JSON.parse(savedRecentMovies)); } catch (e) {}
    if (savedMemories) try { setMemories(JSON.parse(savedMemories)); } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem('isai_liked_songs', JSON.stringify(likedSongs));
    localStorage.setItem('isai_liked_stations', JSON.stringify(likedStations));
    localStorage.setItem('isai_recent_songs', JSON.stringify(recentlyPlayed));
    localStorage.setItem('isai_playlists', JSON.stringify(playlists));
    localStorage.setItem('isai_liked_movies', JSON.stringify(likedMovies));
    localStorage.setItem('isai_recent_movies', JSON.stringify(recentlyWatched));
    localStorage.setItem('isai_memories', JSON.stringify(memories));
  }, [likedSongs, likedStations, recentlyPlayed, playlists, likedMovies, recentlyWatched, memories]);

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const broadcast = useCallback((type: string, data: any) => {
    if (isHost && roomCode && channelRef.current && isChannelReady.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'sync',
        payload: { type, data, timestamp: Date.now() }
      });
    }
  }, [roomCode, isHost]);

  const playSong = useCallback(async (song: Song, newQueue?: Song[], fromSync: boolean = false) => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    
    try {
      if (currentMovie) setCurrentMovie(null);

      const isRadio = song.type === 'radio' || song.album?.id === 'radio';
      let fullDetails = song;

      if (!isRadio) {
        const data = await musicApi.getSongDetails(song.id);
        if (data) fullDetails = data;
      }

      const streams = fullDetails.downloadUrl || [];
      const stream = streams.find(s => s.quality === '320kbps') || streams[streams.length - 1];
      
      let streamUrl = stream?.url || (stream as any)?.link || (song as any).url_resolved || (song as any).url;

      if (!streamUrl) throw new Error("No stream URL found");

      if (!isRadio) {
        audio.src = streamUrl.replace('http://', 'https://');
      } else {
        audio.src = streamUrl;
      }
      
      audio.load();
      await audio.play();

      setCurrentSong(fullDetails);
      setIsPlaying(true);
      
      let updatedQueue = newQueue || queue;
      setQueue(updatedQueue);
      setCurrentIndex(updatedQueue.findIndex(s => s.id === song.id));
      
      if (!fromSync) {
        setRecentlyPlayed(prev => [fullDetails, ...prev.filter(s => s.id !== fullDetails.id)].slice(0, 30));
        broadcast('play', { song: fullDetails, time: 0, queue: updatedQueue });
      }
    } catch (error) {
      console.error("Playback failed:", error);
      setIsPlaying(false);
      toast.error("Playback failed. Please try another stream.");
    }
  }, [queue, currentMovie, broadcast]);

  const playRandom = useCallback(async () => {
    const randomLang = selectedLanguages[Math.floor(Math.random() * selectedLanguages.length)] || 'tamil';
    
    try {
      const results = await musicApi.getTrending(randomLang);
      if (results && results.length > 0) {
        const randomSong = results[Math.floor(Math.random() * results.length)];
        await playSong(randomSong, results);
      }
    } catch (err) {
      console.error("Failed to play random songs", err);
    }
  }, [selectedLanguages, playSong]);

  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      broadcast('pause', {});
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
      broadcast('resume', {});
    }
  };

  const pauseSong = useCallback((fromSync: boolean = false) => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (!fromSync) broadcast('pause', {});
    }
  }, [isPlaying, broadcast]);

  const resumeSong = useCallback((fromSync: boolean = false) => {
    if (audioRef.current && !isPlaying && currentSong) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
      if (!fromSync) broadcast('resume', {});
    }
  }, [isPlaying, currentSong, broadcast]);

  const playNext = useCallback((fromSync: boolean = false) => {
    if (queue.length === 0) return;
    let nextIdx = currentIndex + 1;
    
    if (isShuffle) {
      const validSongs = queue.filter(s => 
        selectedLanguages.includes(s.language?.toLowerCase() || 'tamil')
      );

      if (validSongs.length > 0) {
        const candidates = validSongs.filter(s => s.id !== currentSong?.id);
        const chosen = candidates.length > 0 
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : validSongs[Math.floor(Math.random() * validSongs.length)];
        nextIdx = queue.findIndex(s => s.id === chosen.id);
      } else {
        nextIdx = Math.floor(Math.random() * queue.length);
      }
    } else if (nextIdx >= queue.length) {
      if (repeatMode === 'all') nextIdx = 0;
      else return;
    }
    
    if (nextIdx !== -1 && queue[nextIdx]) {
      playSong(queue[nextIdx]);
    }
    if (!fromSync) broadcast('next', {});
  }, [queue, currentIndex, isShuffle, repeatMode, playSong, broadcast, currentSong, selectedLanguages]);

  const playPrevious = useCallback((fromSync: boolean = false) => {
    if (queue.length === 0) return;
    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      if (repeatMode === 'all') prevIdx = queue.length - 1;
      else prevIdx = 0;
    }
    playSong(queue[prevIdx]);
    if (!fromSync) broadcast('prev', {});
  }, [queue, currentIndex, repeatMode, playSong, broadcast]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const seek = useCallback((time: number, fromSync: boolean = false) => {
    if (audioRef.current && isFinite(time)) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      if (!fromSync) broadcast('seek', { time });
    }
  }, [broadcast]);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) 
        ? (prev.length > 1 ? prev.filter(l => l !== lang) : prev) 
        : [...prev, lang]
    );
  };

  const isLiked = (songId: string) => likedSongs.some(s => s.id === songId);
  const toggleLike = (song: Song) => {
    setLikedSongs(prev => isLiked(song.id) ? prev.filter(s => s.id !== song.id) : [song, ...prev]);
  };

  const playMovie = useCallback((movie: Movie, fromSync: boolean = false) => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setCurrentMovie(movie);
    
    window.location.hash = '#/watch';

    if (!fromSync) {
      setRecentlyWatched(prev => [movie, ...prev.filter(m => m.id !== movie.id)].slice(0, 20));
      broadcast('play_movie', { movie });
    }
  }, [broadcast]);

  const closeMovie = useCallback((fromSync: boolean = false) => {
    setCurrentMovie(null);
    window.location.hash = '#/movies';

    if (!fromSync) {
      broadcast('close_movie', {});
    }
  }, [broadcast]);

  const toggleLikeMovie = (movie: Movie) => {
    setLikedMovies(prev => prev.some(m => m.id === movie.id) ? prev.filter(m => m.id !== movie.id) : [movie, ...prev]);
  };

  const isMovieLiked = (movieId: string) => likedMovies.some(m => m.id === movieId);

  const addMemory = (song: Song, text: string) => {
    const newMemory: SongMemory = {
      id: Math.random().toString(36).substring(2, 9),
      songId: song.id,
      songName: song.name,
      artistName: song.primaryArtists,
      imageUrl: song.image?.[0]?.url || (song.image?.[0] as any)?.link || '',
      text,
      createdAt: Date.now()
    };
    setMemories(prev => [newMemory, ...prev]);
    toast.success("Memory saved to your Music Journal!");
  };

  const deleteMemory = (memoryId: string) => {
    setMemories(prev => prev.filter(m => m.id !== memoryId));
    toast.success("Memory removed from your Journal");
  };

  const toggleShuffle = useCallback((fromSync: boolean = false) => {
    const newShuffle = !isShuffle;
    setIsShuffle(newShuffle);
    if (!fromSync) broadcast('shuffle', { isShuffle: newShuffle });
  }, [isShuffle, broadcast]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        playNext();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [playNext, repeatMode]);

  useEffect(() => {
    if (!roomCode) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      isChannelReady.current = false;
      return;
    }

    const channel = supabase.channel(`room:${roomCode}`, {
      config: {
        broadcast: { self: false }
      }
    });

    channel
      .on('broadcast', { event: 'sync' }, ({ payload }) => {
        const { type, data } = payload;
        
        if (isHost) return; 

        switch (type) {
          case 'play':
            if (data.song) {
              playSong(data.song, data.queue, true);
              if (data.time) {
                setTimeout(() => seek(data.time, true), 500);
              }
            }
            break;
          case 'pause':
            pauseSong(true);
            break;
          case 'resume':
            resumeSong(true);
            break;
          case 'seek':
            if (data.time !== undefined) {
              seek(data.time, true);
            }
            break;
          case 'play_movie':
            if (data.movie) {
              playMovie(data.movie, true);
            }
            break;
          case 'close_movie':
            closeMovie(true);
            break;
          case 'next':
            playNext(true);
            break;
          case 'prev':
            playPrevious(true);
            break;
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isChannelReady.current = true;
          
          if (isHost && currentSong) {
            channel.send({
              type: 'broadcast',
              event: 'sync',
              payload: {
                type: 'play',
                data: {
                  song: currentSong,
                  time: audioRef.current?.currentTime || 0,
                  queue
                }
              }
            });
          }
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      isChannelReady.current = false;
    };
  }, [roomCode, isHost, playSong, seek, pauseSong, resumeSong, playMovie, closeMovie, playNext, playPrevious, currentSong, queue]);

  return (
    <MusicContext.Provider value={{
      currentSong, isPlaying, playSong, playRandom, pauseSong, resumeSong, togglePlay, playNext, playPrevious,
      addToNext: (s) => setQueue(prev => [...prev.slice(0, currentIndex + 1), s, ...prev.slice(currentIndex + 1)]),
      currentTime, duration, volume, setVolume, isMuted, toggleMute, seek, roomCode, setRoomCode, isHost, setIsHost,
      selectedLanguages, toggleLanguage, likedSongs, toggleLike, isLiked, likedStations, toggleLikeStation: () => {}, isStationLiked: () => false,
      recentlyPlayed, playlists, 
      createPlaylist: (name) => setPlaylists(prev => [{ id: Math.random().toString(36).substring(2, 9), name, songs: [], createdAt: Date.now() }, ...prev]),
      addToPlaylist: (id, s) => setPlaylists(prev => prev.map(p => p.id === id ? { ...p, songs: [s, ...p.songs] } : p)),
      removeFromPlaylist: (id, sid) => setPlaylists(prev => prev.map(p => p.id === id ? { ...p, songs: p.songs.filter(s => s.id !== sid) } : p)),
      isShuffle, toggleShuffle,
      repeatMode, toggleRepeat: () => setRepeatMode(prev => prev === 'none' ? 'one' : prev === 'one' ? 'all' : 'none'),
      queue, currentMovie, playMovie, closeMovie, likedMovies, toggleLikeMovie, isMovieLiked, recentlyWatched,
      memories, addMemory, deleteMemory
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within MusicProvider');
  return context;
};