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
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {Array.from({ length: 15 }).map((_, index) => (
      <div key={index} className="flex flex-col p-2 sm:p-3 md:p-4 bg-gray-800 rounded-2xl animate-pulse aspect-square items-center justify-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gray-700 mb-3 sm:mb-4"></div>
        <div className="h-3 md:h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-2 md:h-3 bg-gray-700 rounded w-1/2"></div>
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
      <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
        <h3 className="text-xl font-semibold text-red-400">Oops! Something went wrong.</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
        <h3 className="text-xl font-semibold">No Stations Found</h3>
        <p>Try a different search term or check back later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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