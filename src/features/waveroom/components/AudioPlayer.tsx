import React, { useRef, useEffect, useState } from 'react';
import { Station } from '../types';
import { PlayIcon, PauseIcon, RadioIcon, XIcon } from './icons';

interface AudioPlayerProps {
  station: Station;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClear: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ station, isPlaying, onTogglePlay, onClear }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Main effect to control audio playback from the shared state
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    
    // When the station changes, update the source
    if (audioElement.src !== station.url_resolved) {
      audioElement.src = station.url_resolved;
      audioElement.load(); // Explicitly load the new source
      setError(null); // Clear any previous errors when source changes
    }

    if (isPlaying) {
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Local playback failed:", err);
          // This is the key change: Set a local error, but DO NOT change the global state.
          // This error is specifically for autoplay being blocked.
          setError(`Playback blocked by browser. Click play to unmute.`);
        });
      }
    } else {
      audioElement.pause();
    }
  }, [isPlaying, station.stationuuid, station.url_resolved]); // Added station.url_resolved to dependencies

  // Effect to handle unexpected stream errors (e.g., station goes offline)
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleError = () => {
      console.error("Audio stream error.");
      // Set a local error, but DO NOT change the global state.
      setError('Stream error. The station may be offline or the URL is invalid.');
    };

    audioElement.addEventListener('error', handleError);
    return () => {
      audioElement.removeEventListener('error', handleError);
    };
  }, [station.stationuuid]);

  const handleTogglePlay = () => {
    // User's direct action should clear local errors and broadcast their intent.
    setError(null); // Clear any local error when user interacts
    onTogglePlay();
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
              {/* The button's icon should reflect the desired state (the shared state), not the actual local state of the audio element. */}
              {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
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