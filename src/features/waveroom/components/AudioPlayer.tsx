import React, { useRef, useEffect, useState } from 'react';
import { Station } from '@/features/waveroom/types';
import { PlayIcon, PauseIcon, RadioIcon, XIcon } from '@/features/waveroom/components/icons';

interface AudioPlayerProps {
  station: Station;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClear: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ station, isPlaying, onTogglePlay, onClear }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to get the latest isPlaying value in event handlers
  // without causing re-renders or stale closures.
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Main effect to control audio playback from the shared state
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    
    // When the station changes, update the source
    if (audioElement.src !== station.url_resolved) {
      audioElement.src = station.url_resolved;
      // Reset error state for the new station
      setError(null); 
    }

    if (isPlaying) {
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error("Audio playback failed:", err);
          setError(`Playback blocked. Click play to try again.`);
          // If play() fails, the shared state is now out of sync.
          // We must report back that we're not actually playing.
          if (isPlayingRef.current) {
            onTogglePlay();
          }
        });
      }
    } else {
      audioElement.pause();
    }
    // Only re-run this effect if the station or playing state changes.
  }, [isPlaying, station.stationuuid, onTogglePlay]);

  // Effect to handle unexpected stream errors (e.g., station goes offline)
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleError = () => {
      console.error("Audio stream error.");
      setError('Stream error. The station may be offline.');
      // If an error occurs while we are supposed to be playing,
      // update the shared state to reflect that we've stopped.
      if (isPlayingRef.current) {
        onTogglePlay();
      }
    };

    audioElement.addEventListener('error', handleError);
    return () => {
      audioElement.removeEventListener('error', handleError);
    };
  }, [onTogglePlay, station.stationuuid]);

  const handleTogglePlay = () => {
    // Clear previous errors when user takes direct action
    setError(null);
    onTogglePlay();
  };
  
  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const language = station.language?.split(',')[0].trim();
  const country = station.country || 'Global';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-gray-800/80 backdrop-blur-lg border-t border-gray-700 shadow-2xl p-3">
        <div className="container mx-auto flex items-center justify-between gap-4">
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