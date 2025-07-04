import React, { useRef, useEffect, useState } from 'react';
import { Station } from '../types';
import { PlayIcon, PauseIcon, RadioIcon, XIcon } from './icons';

interface AudioPlayerProps {
  station: Station;
  isPlaying: boolean; // This is the shared state from Supabase
  onTogglePlay: () => void; // This broadcasts the intent to change shared state
  onClear: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ station, isPlaying, onTogglePlay, onClear }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocallyPlaying, setIsLocallyPlaying] = useState(false); // Tracks actual HTML audio element state

  // Effect to update audio element source and control playback based on shared state
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    // Update source if it changes
    if (audioElement.src !== station.url_resolved) {
      console.log('AudioPlayer: Changing audio source to:', station.url_resolved);
      audioElement.src = station.url_resolved;
      audioElement.load(); // Explicitly load the new source
      setError(null); // Clear any previous errors when source changes
    }

    // Control playback based on shared `isPlaying` state
    if (isPlaying) {
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Local playback failed (autoplay blocked):", err);
          // Set a local error, but DO NOT change the global state.
          setError(`Playback blocked by browser. Click play to unmute.`);
          setIsLocallyPlaying(false); // Ensure local state reflects actual pause
        });
      }
    } else {
      audioElement.pause();
    }
  }, [isPlaying, station.stationuuid, station.url_resolved]);

  // Effect to listen to actual audio element events for local state updates
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handlePlayEvent = () => {
      setIsLocallyPlaying(true);
      setError(null); // Clear error if playback starts
    };
    const handlePauseEvent = () => setIsLocallyPlaying(false);
    const handleErrorEvent = () => {
      console.error("Audio stream error.");
      setError('Stream error. The station may be offline or the URL is invalid.');
      setIsLocallyPlaying(false); // Ensure local state reflects actual pause
    };

    audioElement.addEventListener('play', handlePlayEvent);
    audioElement.addEventListener('pause', handlePauseEvent);
    audioElement.addEventListener('error', handleErrorEvent);

    return () => {
      audioElement.removeEventListener('play', handlePlayEvent);
      audioElement.removeEventListener('pause', handlePauseEvent);
      audioElement.removeEventListener('error', handleErrorEvent);
    };
  }, []); // Empty dependency array means this runs once on mount

  const handleTogglePlay = async () => {
    setError(null); // Clear any local error when user interacts

    // If the shared state says it should be playing, but locally it's paused (e.g., autoplay blocked)
    // then a user click means they want to *start* playing.
    if (!isPlaying && audioRef.current?.paused) {
      try {
        await audioRef.current.play();
        // If play succeeds, then we want to set the shared state to true
        onTogglePlay(); // This will flip isPlaying from false to true
      } catch (err) {
        console.warn("Manual playback failed:", err);
        setError('Could not play. Please try again.');
      }
    } else {
      // Otherwise, just toggle the shared state as usual
      onTogglePlay();
    }
  };

  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const language = station.language?.split(',')[0].trim();
  const country = station.country || 'Global';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-gray-800/80 backdrop-blur-lg border-t border-gray-700 shadow-2xl p-3">
        <div className="container mx-auto flex items-center justify-between gap-4">
          {/* The key attribute ensures the audio element is re-created when the station changes, resetting its internal state. */}
          <audio ref={audioRef} key={station.stationuuid} crossOrigin="anonymous" preload="auto" />
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <img
              src={station.favicon}
              alt={station.name}
              className="w-14 h-14 rounded-md shadow-md bg-gray-700"
              onError={(e) => {
                const img = e.currentTarget;
                img.style.display = 'none';
                const fallback = img.nextElementSibling;
                if(fallback) {
                    fallback.classList.remove('hidden');
                }
               }}
            />
             <div className="hidden w-14 h-14 rounded-md shadow-md bg-gray-700 flex items-center justify-center">
                <RadioIcon className="w-8 h-8 text-gray-500"/>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white truncate" title={station.name}>{station.name}</p>
              <div className="space-y-0.5">
                  <p className="text-sm text-gray-400 truncate" title={country}>{country}</p>
                  {language && <p className="text-xs text-gray-500 truncate" title={capitalize(language)}>{capitalize(language)}</p>}
              </div>
              {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleTogglePlay} className="bg-indigo-600 hover:bg-indigo-500 rounded-full p-3 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800">
              {/* Use local state for button icon, as it reflects actual playback status */}
              {isLocallyPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
            </button>
             <button onClick={onClear} className="bg-gray-700 hover:bg-gray-600 rounded-full p-2 text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500">
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;