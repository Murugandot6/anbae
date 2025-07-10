import React from 'react';
import { useConcertPlayer } from '@/contexts/ConcertPlayerContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Pause, X, Radio } from 'lucide-react'; // Updated imports
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const GlobalConcertPlayer: React.FC = () => {
  const { currentStation, isPlaying, togglePlay, clearStation, roomCode } = useConcertPlayer();
  const location = useLocation();
  const navigate = useNavigate();

  const showMiniPlayer = currentStation && (location.pathname !== `/concert/${roomCode}`); // Updated route

  if (!showMiniPlayer) {
    return null;
  }

  const handleTogglePlay = () => {
    togglePlay();
  };

  const handleClearStation = () => {
    clearStation();
  };

  const handleGoToRoom = () => {
    if (roomCode) {
      navigate(`/concert/${roomCode}`); // Updated route
    }
  };

  const FallbackIcon = () => <Radio className="w-8 h-8 text-muted-foreground" />;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    const fallback = target.nextElementSibling;
    if (fallback) {
        fallback.classList.remove('hidden');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-xl shadow-lg p-3 flex items-center gap-3">
        <button onClick={handleGoToRoom} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <div className="relative w-12 h-12 flex-shrink-0 rounded-md bg-input/50 flex items-center justify-center overflow-hidden">
            {currentStation?.favicon ? (
              <img
                src={currentStation.favicon}
                alt={`${currentStation.name} logo`}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <FallbackIcon />
            )}
            <div className="fallback-icon hidden absolute inset-0 w-full h-full flex items-center justify-center">
                <FallbackIcon />
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground text-sm truncate max-w-[150px]">{currentStation?.name || 'Unknown Station'}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[150px]">{currentStation?.country || 'Global'}</p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleTogglePlay}
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-foreground hover:bg-accent/20"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button
            onClick={handleClearStation}
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-accent/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GlobalConcertPlayer;