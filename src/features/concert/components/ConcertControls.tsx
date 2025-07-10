import React, { useEffect, useState } from 'react';
import { Station } from '../types';
import { Play, Pause, Radio, X, Volume2 as VolumeUp, VolumeX as VolumeOff } from 'lucide-react'; // Updated imports

interface ConcertControlsProps { // Renamed interface
  station: Station;
  isPlaying: boolean;
  onSetPlaying: () => void;
  onClear: () => void;
  onShowStation: (station: Station) => void;
}

const ConcertControls: React.FC<ConcertControlsProps> = ({ station, isPlaying, onSetPlaying, onClear, onShowStation }) => { // Renamed component
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
      <div className="bg-card/80 backdrop-blur-lg border-t border-border/50 shadow-2xl p-3 sm:p-4"> {/* Adjusted padding */}
        <div className="container mx-auto flex items-center justify-between gap-3 sm:gap-4"> {/* Adjusted gap */}
          <button
            onClick={() => onShowStation(station)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-md hover:bg-accent/20 p-1.5 sm:p-2 -m-1.5 sm:-m-2 transition-colors" // Adjusted padding and margin
            title="Find this station in the list"
          >
            <img
              src={station.favicon}
              alt={station.name}
              className="w-12 h-12 sm:w-14 h-14 rounded-md shadow-md bg-input/50" // Adjusted size
              onError={(e) => {
                const img = e.currentTarget;
                img.style.display = 'none';
                const fallback = img.nextElementSibling;
                if (fallback) {
                  fallback.classList.remove('hidden');
                }
              }}
            />
            <div className="hidden w-12 h-12 sm:w-14 h-14 rounded-md shadow-md bg-input/50 flex items-center justify-center"> {/* Adjusted size */}
              <Radio className="w-7 h-7 sm:w-8 h-8 text-muted-foreground" /> {/* Adjusted icon size */}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate text-sm sm:text-base" title={station.name}>{station.name}</p> {/* Adjusted font size */}
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm text-muted-foreground truncate" title={country}>{country}</p> {/* Adjusted font size */}
                {language && <p className="text-xs text-muted-foreground/80 truncate" title={capitalize(language)}>{capitalize(language)}</p>}
              </div>
            </div>
          </button>
          <div className="flex items-center gap-3 sm:gap-4"> {/* Adjusted gap */}
             <button onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'} className="bg-input/50 hover:bg-accent/20 rounded-full p-2.5 sm:p-3 text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-border/50"> {/* Adjusted padding */}
              {isMuted ? <VolumeOff className="w-5 h-5 sm:w-6 h-6" /> : <VolumeUp className="w-5 h-5 sm:w-6 h-6" />} {/* Adjusted icon size */}
            </button>
            <button onClick={handlePlayPauseClick} title={isPlaying ? 'Pause' : 'Play'} className="bg-primary hover:bg-primary/90 rounded-full p-2.5 sm:p-3 text-primary-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"> {/* Adjusted padding */}
              {isPlaying ? <Pause className="w-5 h-5 sm:w-6 h-6" /> : <Play className="w-5 h-5 sm:w-6 h-6" />} {/* Adjusted icon size */}
            </button>
            <button onClick={handleClear} title="Stop and clear player" className="bg-input/50 hover:bg-accent/20 rounded-full p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-border/50"> {/* Adjusted padding */}
              <X className="w-4 h-4 sm:w-5 h-5" /> {/* Adjusted icon size */}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcertControls;