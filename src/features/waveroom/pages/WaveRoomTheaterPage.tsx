import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Station } from '../types';
import { getTopClickedStations, searchStations, getLanguages, getCountries, getTags } from '../api/radioService';
import SearchBar from '../components/SearchBar';
import StationList from '../components/StationList';
import AudioPlayer from '../components/AudioPlayer';
import { WaveIcon } from '../components/icons';
import FilterBar from '../components/FilterBar';
import { useWaveRoomRealtime } from '../hooks/useWaveRoomRealtime';
import { Button } from '@/components/ui/button';
import { Copy, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';

const WaveRoomTheaterPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user: authUser, loading: sessionLoading } = useSession();
  
  console.log('WaveRoomTheaterPage: Rendering. roomCode:', roomCode, 'authUser:', authUser?.id, 'sessionLoading:', sessionLoading); // NEW LOG HERE

  const { roomState, setStation, togglePlay, clearStation, isLoading: isRoomLoading, error: roomError } = useWaveRoomRealtime(roomCode, authUser);
  
  const [stations, setStations] = useState<Station[]>([]);
  const [isStationsLoading, setIsStationsLoading] = useState<boolean>(true);
  const [stationsError, setStationsError] = useState<string | null>(null);
  
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
        setIsStationsLoading(true);
        setStationsError(null);
        
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
                setStationsError(err instanceof Error ? err.message : 'An unknown error occurred.');
                setStations([]);
            })
            .finally(() => {
                setIsStationsLoading(false);
            });
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedLanguage, selectedCountry, selectedTag]);

  const handleSelectStation = (station: Station) => {
    if (station.url_resolved) {
      setStation(station);
    } else {
      toast.error(`Station ${station.name} does not have a valid stream URL.`);
    }
  };
  
  const handleCopyCode = () => {
    if(!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const buildTitle = (): string => {
    if (searchQuery) return `Results for "${searchQuery}"`;
    if (selectedTag) return `${selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)} Stations`;
    return "Popular Stations";
  };

  if (sessionLoading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Session...</div>;
  }

  if (!authUser) {
    toast.error("You must be logged in to enter a Wave Room.");
    navigate('/login');
    return null;
  }

  if (isRoomLoading || !roomState) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Room...</div>;
  }

  if (roomError) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">{roomError}</div>;
  }

  const { current_station: currentStation, is_playing: isPlaying } = roomState;

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-200 flex flex-col antialiased">
      <header className="bg-gray-800/70 backdrop-blur-md border-b border-gray-700 p-4 shadow-lg z-20 sticky top-0">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WaveIcon className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white hidden sm:block">Wave Room</h1>
          </div>

          <div className="flex-1 max-w-lg">
            <SearchBar onSearch={setSearchQuery} isLoading={isStationsLoading} initialQuery={searchQuery} onClear={() => setSearchQuery('')} />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-700/50 rounded-md p-2 border border-gray-600">
                <span className="text-sm text-gray-400 hidden md:inline">CODE:</span>
                <span className="font-bold tracking-widest text-white">{roomCode}</span>
                <Button onClick={handleCopyCode} variant="ghost" size="icon" className="w-7 h-7">
                    <Copy className="w-4 h-4"/>
                </Button>
            </div>
             <Button onClick={() => navigate('/dashboard')} variant="destructive" size="icon" className="w-9 h-9">
                <LogOut className="w-4 h-4"/>
            </Button>
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
              isLoading={isStationsLoading}
            />
          </div>
          <StationList
            stations={stations}
            onSelectStation={handleSelectStation}
            currentStation={currentStation}
            isLoading={isStationsLoading}
            error={stationsError}
          />
        </div>
      </main>

      {currentStation && <AudioPlayer station={currentStation} isPlaying={isPlaying} onTogglePlay={togglePlay} onClear={clearStation} />}
    </div>
  );
};

export default WaveRoomTheaterPage;