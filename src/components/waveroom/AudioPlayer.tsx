import React, { useRef, useEffect, useState } from 'react';
import { Station } from '@/types/waveRoom';
import { PlayIcon, PauseIcon, RadioIcon, XIcon } from './icons';

interface AudioPlayerProps {
  station: Station;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClear: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ station, isPlaying, onTogglePlay, onClear }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLocallyPlaying, setLocallyPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This effect synchronizes the audio element's state with the shared `isPlaying` prop.
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isPlaying) {
      // If the shared state is 'playing', try to play.
      // The catch block will handle autoplay restrictions gracefully.
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Autoplay was prevented. User interaction is required.", err);
          setError("Click play to start the audio.");
          setLocallyPlaying(false);
        });
      }
    } else {
      // If the shared state is 'paused', always pause the local player.
      audioElement.pause();
    }
  }, [isPlaying, station.stationuuid]); // Rerun when isPlaying or the station itself changes.

  // This effect is for updating the local UI (play/pause icon) based on the actual audio element events.
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    
    const handlePlay = () => { setLocallyPlaying(true); setError(null); };
    const handlePlaying = () => { setError(null); };
    const handlePause = () => setLocallyPlaying(false);
    const handleError = () => {
      setError('Error loading stream. The station may be offline.');
      setLocallyPlaying(false);
    };
    const handleStalled = () => {
      setError('Stream stalled. Buffering...');
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('playing', handlePlaying);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('stalled', handleStalled);
    
    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('playing', handlePlaying);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('stalled', handleStalled);
    };
  }, [station.stationuuid]);

  const handlePlayButtonClick = async () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    // If the local player is out of sync with the global state (e.g., autoplay blocked)
    // this click should just sync them up by playing locally.
    if (isPlaying && audioElement.paused) {
        try {
            await audioElement.play();
            setError(null); // Clear any "autoplay failed" errors
        } catch (err) {
            console.error("Manual play failed:", err);
            setError("Could not start playback.");
        }
    } else {
        // Otherwise, this click should toggle the global state for everyone.
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
          <audio ref={audioRef} src={station.url_resolved} key={station.stationuuid} crossOrigin="anonymous" preload="auto" />
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
            <button onClick={handlePlayButtonClick} className="bg-indigo-600 hover:bg-indigo-500 rounded-full p-3 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800">
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