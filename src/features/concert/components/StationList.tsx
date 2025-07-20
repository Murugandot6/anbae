import React from 'react';
import { Station } from '../types';
import StationListItem from './StationListItem';

interface StationListProps {
  stations: Station[];
  onSelectStation: (station: Station) => void;
  currentStation: Station | null;
  isLoading: boolean;
  error: string | null;
}

const SkeletonGrid: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"> {/* Adjusted gap */}
    {/* Reduced skeleton count for mobile */}
    {Array.from({ length: 10 }).map((_, index) => (
      <div key={index} className="flex flex-col p-2 sm:p-3 md:p-4 bg-card/60 backdrop-blur-md rounded-xl sm:rounded-2xl animate-pulse aspect-square items-center justify-center shadow-lg"> {/* Adjusted padding and border-radius */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-full bg-muted/50 mb-2 sm:mb-3 md:mb-4"></div> {/* Adjusted size and margin */}
        <div className="h-2.5 md:h-4 bg-muted/50 rounded w-3/4 mb-1.5 sm:mb-2"></div> {/* Adjusted height and margin */}
        <div className="h-2 md:h-3 bg-muted/50 rounded w-1/2"></div> {/* Adjusted height */}
      </div>
    ))}
  </div>
);


const StationList: React.FC<StationListProps> = ({ stations, onSelectStation, currentStation, isLoading, error }) => {
  if (isLoading) {
    return <SkeletonGrid />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-center text-muted-foreground"> {/* Adjusted height */}
        <h3 className="text-lg sm:text-xl font-semibold text-destructive">Oops! Something went wrong.</h3> {/* Adjusted font size */}
        <p className="text-sm sm:text-base">{error}</p> {/* Adjusted font size */}
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-center text-muted-foreground"> {/* Adjusted height */}
        <h3 className="text-lg sm:text-xl font-semibold text-foreground">No Stations Found</h3> {/* Adjusted font size */}
        <p className="text-sm sm:text-base">Try a different search term or check back later.</p> {/* Adjusted font size */}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"> {/* Adjusted gap */}
      {stations.map((station) => (
        <StationListItem
          key={station.stationuuid}
          station={station}
          isPlaying={currentStation?.stationuuid === station.stationuuid}
          onSelect={() => onSelectStation(station)}
        />
      ))}
    </div>
  );
};

export default StationList;