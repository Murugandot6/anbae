import React, { useEffect, useState } from 'react';
import { Station } from '../types';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { RadioIcon } from './icons/RadioIcon';
import { XIcon } from './icons/XIcon';
import { VolumeUpIcon } from './icons/VolumeUpIcon';
import { VolumeOffIcon } from './icons/VolumeOffIcon';

interface WaveRoomControlsProps {
  station: Station;
  isPlaying: boolean;
  onSetPlaying: () => void;
  onClear: () => void;
  onShowStation: (station: Station) => void;
}

const WaveRoomControls: React.FC<WaveRoomControlsProps> = ({ station, isPlaying, onSetPlaying, onClear, onShowStation }) => {
  const [isMuted, setIsMuted] = useState(false);

  const handlePlayPauseClick = () => {
    onSetPlaying();
  };

  const handleClear = () => {
    onClear();
  };
  
  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const language = station.language?.split(',')[0].trim();
  const country = station.country || 'Global';

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50">
      <div className="bg-gray-800/80 backdrop-blur-lg border-t border-gray-700 shadow-2xl p-3">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => onShowStation(station)}
            className="flex items-center gap-4 flex-1 min-w-0 text-left rounded-md hover:bg-gray-700/50 p-2 -m-2 transition-colors"
            title="Find this station in the list"
          >
            <img
              src={station.favicon}
              alt={station.name}
              className="w-14 h-14 rounded-md shadow-md bg-gray-700"
              onError={(e) => {
                const img = e.currentTarget;
                img.style.display = 'none';
                const fallback = img.nextElementSibling;
                if (fallback) {
                  fallback.classList.remove('hidden');
                }
              }}
            />
            <div className="hidden w-14 h-14 rounded-md shadow-md bg-gray-700 flex items-center justify-center">
              <RadioIcon className="w-8 h-8 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white truncate" title={station.name}>{station.name}</p>
              <div className="space-y-0.5">
                <p className="text-sm text-gray-400 truncate" title={country}>{country}</p>
                {language && <p className="text-xs text-gray-500 truncate" title={capitalize(language)}>{capitalize(language)}</p>}
              </div>
            </div>
          </button>
          <div className="flex items-center gap-4">
             <button onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'} className="bg-gray-700 hover:bg-gray-600 rounded-full p-3 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500">
              {isMuted ? <VolumeOffIcon className="w-6 h-6" /> : <VolumeUpIcon className="w-6 h-6" />}
            </button>
            <button onClick={handlePlayPauseClick} title={isPlaying ? 'Pause' : 'Play'} className="bg-indigo-600 hover:bg-indigo-500 rounded-full p-3 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800">
              {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
            </button>
            <button onClick={handleClear} title="Stop and clear player" className="bg-gray-700 hover:bg-gray-600 rounded-full p-2 text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500">
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaveRoomControls;