import React from 'react';
import { Station } from '../types';
import { RadioIcon } from './icons/RadioIcon';
import { PlayIcon } from './icons/PlayIcon';
import { VolumeUpIcon } from './icons/VolumeUpIcon';

interface StationListItemProps {
  station: Station;
  isPlaying: boolean;
  onSelect: () => void;
}

const StationListItem: React.FC<StationListItemProps> = ({ station, isPlaying, onSelect }) => {
  const FallbackIcon = () => <RadioIcon className="w-10 h-10 md:w-12 md:h-12 text-gray-500" />;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    const fallback = target.parentElement?.querySelector('.fallback-icon');
    if (fallback) {
        fallback.classList.remove('hidden');
    }
  };
  
  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const language = station.language?.split(',')[0].trim();
  const country = station.country || 'Global';

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col p-2 sm:p-3 md:p-4 text-center bg-gray-800 rounded-2xl shadow-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-indigo-500/30 aspect-square items-center justify-center ${isPlaying ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-indigo-500' : 'ring-1 ring-gray-700/50'}`}
    >
      {/* Playing Indicator */}
      {isPlaying && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1.5 shadow-lg z-10">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>On Air</span>
          </div>
      )}

      {/* Image/Icon Container */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-3 sm:mb-4">
        <div className="relative w-full h-full rounded-full bg-gray-700 flex items-center justify-center overflow-hidden ring-4 ring-gray-700/50 group-hover:ring-indigo-500/50 transition-all duration-300">
            <img
                src={station.favicon}
                alt={`${station.name} logo`}
                className="w-full h-full object-cover"
                onError={handleImageError}
            />
            <div className="fallback-icon hidden absolute inset-0 w-full h-full flex items-center justify-center">
                <FallbackIcon />
            </div>
        </div>

        {/* Hover Play Icon */}
        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {isPlaying ? (
                <VolumeUpIcon className="w-8 h-8 md:w-10 md:h-10 text-white/90" />
            ) : (
                <PlayIcon className="w-8 h-8 md:w-10 md:h-10 text-white/90" />
            )}
        </div>
      </div>

      {/* Text Content */}
      <div className="w-full px-1">
        <h3 className="font-bold text-sm md:text-base text-white leading-tight truncate" title={station.name}>
            {station.name}
        </h3>
        <div className="mt-1 space-y-0.5">
          <p className="text-xs md:text-sm text-gray-400 truncate" title={country}>{country}</p>
          {language && (
            <p className="text-xs text-gray-500 truncate" title={capitalize(language)}>{capitalize(language)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StationListItem;