import React, { useState, useRef, useEffect } from 'react';
import { Station } from '@/types/waveRoom';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { XIcon } from './icons/XIcon';

interface AudioPlayerProps {
  station: Station;
  onClear: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ station, onClear }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !station) return;

    setError(null);
    const playPromise = audioElement.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
        });
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
        setError('Error loading stream. The station might be offline.');
        setIsPlaying(false);
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('error', handleError);
    
    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('error', handleError);
    };
  }, [station]);

  const togglePlayPause = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play().catch(() => setError('Playback failed. Please try another station.'));
    }
  };

  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const language = station.language?.split(',')[0].trim();

  const subtitleParts: string[] = [];
  if (station.country) {
    subtitleParts.push(station.country);
  }
  if (language) {
    subtitleParts.push(capitalize(language));
  }

  let subtitle = subtitleParts.join(' · ');
  if (!subtitle) subtitle = 'Global';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-gray-800/80 backdrop-blur-lg border-t border-gray-700 shadow-2xl p-3">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <audio ref={audioRef} src={station.url_resolved} crossOrigin="anonymous" preload="auto" />
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <img
              src={station.favicon}
              alt={station.name}
              className="w-14 h-14 rounded-md shadow-md bg-gray-700"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="min-w-0">
              <p className="font-bold text-white truncate" title={station.name}>{station.name}</p>
              <p className="text-sm text-gray-400 truncate" title={subtitle}>{subtitle}</p>
              {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={togglePlayPause} className="bg-indigo-600 hover:bg-indigo-500 rounded-full p-3 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800">
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