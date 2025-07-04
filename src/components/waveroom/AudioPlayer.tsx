import React, { useRef, useEffect, useState } from 'react';
import { Station } from '@/types/waveRoom';
import { PlayIcon, PauseIcon, RadioIcon, XIcon } from './icons';
import { PlayCircle } from 'lucide-react';

interface AudioPlayerProps {
  station: Station;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClear: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ station, isPlaying, onTogglePlay, onClear }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [requiresInteraction, setRequiresInteraction] = useState(false);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    // Update source if it has changed
    if (audioElement.src !== station.url_resolved) {
      audioElement.src = station.url_resolved;
      audioElement.load();
      setError(null);
      setRequiresInteraction(false);
    }

    // Sync with shared isPlaying state
    if (isPlaying) {
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          if (err.name === 'NotAllowedError') {
            console.warn("Autoplay was prevented. User interaction is required.", err);
            setError("Click play to start the audio.");
            setRequiresInteraction(true);
            // If autoplay fails, tell the shared state we are not playing.
            if (isPlaying) {
              onTogglePlay();
            }
          } else if (err.name !== 'AbortError') {
            setError('Error loading stream. The station may be offline.');
            if (isPlaying) {
              onTogglePlay();
            }
          }
        });
      }
    } else {
      audioElement.pause();
    }
  }, [station, isPlaying, onTogglePlay]);

  // Add event listeners for local feedback (errors, etc.)
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    
    const handlePlaying = () => {
      setError(null);
      setRequiresInteraction(false);
    };
    const handleError = () => {
      setError('Error loading stream. The station may be offline or the URL is invalid.');
      if (isPlaying) {
        onTogglePlay();
      }
    };
    const handleStalled = () => setError('Stream stalled. Buffering...');

    audioElement.addEventListener('playing', handlePlaying);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('stalled', handleStalled);
    
    return () => {
      audioElement.removeEventListener('playing', handlePlaying);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('stalled', handleStalled);
    };
  }, [isPlaying, onTogglePlay]);

  const handleInteraction = () => {
    setRequiresInteraction(false);
    onTogglePlay();
  };

  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const language = station.language?.split(',')[0].trim();
  const country = station.country || 'Global';

  return (
    <>
      {requiresInteraction && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-[100] backdrop-blur-sm cursor-pointer" onClick={handleInteraction}>
          <div className="text-center">
            <PlayCircle className="w-24 h-24 text-white mx-auto mb-4 animate-pulse" />
            <h3 className="text-2xl font-bold text-white mb-2">Audio Paused</h3>
            <p className="text-gray-300">Click anywhere to play</p>
          </div>
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-gray-800/80 backdrop-blur-lg border-t border-gray-700 shadow-2xl p-3">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <audio ref={audioRef} crossOrigin="anonymous" preload="auto" />
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
              <button onClick={onTogglePlay} className="bg-indigo-600 hover:bg-indigo-500 rounded-full p-3 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800">
                {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
              </button>
              <button onClick={onClear} className="bg-gray-700 hover:bg-gray-600 rounded-full p-2 text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AudioPlayer;