import React, { useState, useEffect } from 'react';
import { Station } from '../types';
import { getTopClickedStations, searchStations, getLanguages, getCountries, getTags } from '../services/radioService';
import SearchBar from '../components/SearchBar';
import StationList from '../components/StationList';
import AudioPlayer from '../components/AudioPlayer';
import { WaveIcon } from '../components/icons/WaveIcon';
import FilterBar from '../components/FilterBar';
import { useRoomSync } from '../hooks/useRoomSync';
import { CopyIcon } from '../components/icons/CopyIcon';
import { LogoutIcon } from '../components/icons/LogoutIcon';

interface RoomPageProps {
  roomCode: string;
  onLeaveRoom: () => void;
}

const RoomPage: React.FC<RoomPageProps> = ({ roomCode, onLeaveRoom }) => {
  const { roomState, setStation, togglePlay, clearStation } = useRoomSync(roomCode);
  const { currentStation, isPlaying } = roomState;

  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  
  const [languages, setLanguages] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchFilterOptions = async () => {
        try {
            const [langData, countryData, tagData] = await Promise.all([
                getLanguages(),
                getCountries(),
                getTags(150),
            ]);
            setLanguages(langData);
            setCountries(countryData);
            setTags(tagData);
        } catch (e) {
            console.error("Failed to load filter options", e);
        }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
        setIsLoading(true);
        setError(null);
        
        const hasFilters = searchQuery || selectedLanguage || selectedCountry || selectedTag;

        const fetchPromise = hasFilters
            ? searchStations({
                name: searchQuery,
                language: selectedLanguage,
                country: selectedCountry,
                tag: selectedTag,
              })
            : getTopClickedStations(100);

        fetchPromise
            .then(data => {
                setStations(data);
            })
            .catch(err => {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
                setStations([]);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedLanguage, selectedCountry, selectedTag]);

  const handleSelectStation = (station: Station) => {
    if (station.url_resolved) {
      setStation(station);
    } else {
      setError(`Station ${station.name} does not have a valid stream URL.`);
    }
  };
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildTitle = (): string => {
    if (searchQuery) return `Results for "${searchQuery}"`;
    if (selectedTag) return `${selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)} Stations`;
    return "Popular Stations";
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-200 flex flex-col antialiased">
      <header className="bg-gray-800/70 backdrop-blur-md border-b border-gray-700 p-4 shadow-lg z-20 sticky top-0">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WaveIcon className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white hidden sm:block">Wave Room</h1>
          </div>

          <div className="flex-1 max-w-lg">
            <SearchBar onSearch={setSearchQuery} isLoading={isLoading} initialQuery={searchQuery} onClear={() => setSearchQuery('')} />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-700/50 rounded-md p-2 border border-gray-600">
                <span className="text-sm text-gray-400 hidden md:inline">CODE:</span>
                <span className="font-bold tracking-widest text-white">{roomCode}</span>
                <button onClick={handleCopyCode} title="Copy Room Code" className="p-1 rounded-md hover:bg-gray-600 transition-colors">
                    <CopyIcon className="w-5 h-5 text-gray-300"/>
                </button>
                {copied && <span className="absolute top-14 right-20 bg-green-500 text-white text-xs px-2 py-1 rounded-md">Copied!</span>}
            </div>
             <button onClick={onLeaveRoom} title="Leave Room" className="p-2.5 rounded-md bg-red-600/80 hover:bg-red-600 transition-colors">
                <LogoutIcon className="w-5 h-5 text-white"/>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto pb-32">
        <div className="container mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h2 className="text-xl font-semibold text-gray-300 flex-shrink-0 order-1 md:order-none">
              {buildTitle()}
            </h2>
            <FilterBar
              languages={languages}
              countries={countries}
              tags={tags}
              selectedLanguage={selectedLanguage}
              selectedCountry={selectedCountry}
              selectedTag={selectedTag}
              onFilterChange={(type, val) => {
                if(type === 'language') setSelectedLanguage(val);
                if(type === 'country') setSelectedCountry(val);
                if(type === 'tag') setSelectedTag(val);
              }}
              isLoading={isLoading}
            />
          </div>
          <StationList
            stations={stations}
            onSelectStation={handleSelectStation}
            currentStation={currentStation}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>

      {currentStation && <AudioPlayer station={currentStation} isPlaying={isPlaying} onTogglePlay={togglePlay} onClear={clearStation} />}
    </div>
  );
};

export default RoomPage;
