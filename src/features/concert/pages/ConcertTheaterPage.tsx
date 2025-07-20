import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Station } from '../types';
import { getTopClickedStations, searchStations, getLanguages, getCountries, getTags } from '../api/radioService';
import SearchBar from '../components/SearchBar';
import StationList from '../components/StationList';
import ConcertControls from '../components/ConcertControls'; // Updated import
import { WaveIcon } from '../components/icons';
import FilterBar from '../components/FilterBar';
import { useConcertPlayer } from '@/contexts/ConcertPlayerContext'; // Updated import
import { Button } from '@/components/ui/button';
import { Copy, LogOut, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { Helmet } from 'react-helmet-async'; // Import Helmet
import LoadingPulsar from '@/components/LoadingPulsar';

const ConcertTheaterPage: React.FC = () => { // Renamed component
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user: authUser, loading: sessionLoading } = useSession();
  
  const { 
    currentStation, 
    isPlaying, 
    roomCode: activePlayerRoomCode,
    setRoom,
    setStation,
    togglePlay,
    clearStation
  } = useConcertPlayer(); // Updated hook

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
    if (roomCode) {
      setRoom(roomCode);
    }
  }, [roomCode, setRoom]);

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
    if (!station.url_resolved) {
      toast.error(`Station ${station.name} does not have a valid stream URL.`);
      return;
    }

    // If the clicked station is the one currently playing, just toggle play/pause
    if (currentStation?.stationuuid === station.stationuuid) {
      togglePlay();
    } else {
      // If it's a new station, set it and start playing
      setStation(station);
    }
  };
  
  const handleCopyCode = () => {
    if(!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShowStationInList = (station: Station) => {
    setSearchQuery(station.name);
    setSelectedLanguage('');
    setSelectedCountry('');
    setSelectedTag('');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleLeaveRoom = () => {
    clearStation();
    setRoom(null);
    navigate('/dashboard');
    toast.info("You have left the Concert."); // Updated text
  };

  const handleFilterChange = (type: 'language' | 'country' | 'tag', value: string) => {
    setSearchQuery(''); // Clear search when a filter is applied
    if (type === 'language') setSelectedLanguage(value);
    if (type === 'country') setSelectedCountry(value);
    if (type === 'tag') setSelectedTag(value);
  };

  const handleSearch = (query: string) => {
    // Clear filters when a search is performed
    setSelectedLanguage('');
    setSelectedCountry('');
    setSelectedTag('');
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const buildTitle = (): string => {
    if (searchQuery) return `Results for "${searchQuery}"`;
    if (selectedTag) return `${selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)} Stations`;
    return "Popular Stations";
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <LoadingPulsar />
        <p className="text-xl mt-4">Loading Session...</p>
      </div>
    );
  }

  if (!authUser) {
    toast.error("You must be logged in to enter a Concert."); // Updated text
    navigate('/login');
    return null;
  }

  if (!roomCode) {
    navigate('/concert'); // Updated route
    return null;
  }

  const isCurrentRoomActive = activePlayerRoomCode === roomCode;

  return (
    <>
      <Helmet>
        <title>{`Concert ${roomCode} - Anbae`}</title> {/* Updated text */}
        <meta name="description" content={`Listen to internet radio with your partner in Concert ${roomCode}.`} /> {/* Updated text */}
      </Helmet>
      <div className="h-screen w-screen bg-background text-foreground flex flex-col antialiased">
        <main className="flex-grow overflow-y-auto pb-28 sm:pb-32"> {/* Main content is now scrollable */}
          <header className="bg-background p-3 sm:p-4"> {/* Header is now inside main */}
            <div className="container mx-auto flex items-start justify-between gap-2 sm:gap-4">
              {/* Back button on the left */}
              <div className="flex-shrink-0">
                <Button
                  onClick={handleBackToDashboard}
                  variant="outline"
                  size="icon"
                  className="w-9 h-9 sm:w-10 sm:h-10 text-foreground border-border hover:bg-accent hover:text-accent-foreground rounded-full shadow-md"
                  aria-label="Back to Dashboard"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
              
              {/* Right side content */}
              <div className="flex flex-col items-end gap-2">
                  {/* Page Title */}
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Concert</h1> {/* Updated text */}

                  {/* Room code and Leave button */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 sm:gap-2 bg-input/50 rounded-md p-1.5 sm:p-2 border border-border/50">
                          <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline">CODE:</span>
                          <span className="font-bold tracking-widest text-sm sm:text-base text-foreground">{roomCode}</span>
                          <Button onClick={handleCopyCode} variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-accent/20">
                              <Copy className="w-4 h-4"/>
                          </Button>
                      </div>
                      <Button onClick={handleLeaveRoom} variant="destructive" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full shadow-md">
                          <LogOut className="w-4 h-4 sm:w-5 sm:h-5"/>
                      </Button>
                  </div>
              </div>
            </div>
          </header>

          <div className="container mx-auto p-3 sm:p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 sm:mb-4 gap-3 sm:gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground flex-shrink-0 order-1 md:order-none">
                {buildTitle()}
              </h2>
              <FilterBar
                languages={languages}
                countries={countries}
                tags={tags}
                selectedLanguage={selectedLanguage}
                selectedCountry={selectedCountry}
                selectedTag={selectedTag}
                onFilterChange={handleFilterChange}
                isLoading={isStationsLoading}
              />
            </div>
            <SearchBar 
              onSearch={handleSearch} 
              onClear={handleClearSearch} 
              isLoading={isStationsLoading} 
              initialQuery={searchQuery} 
              className="mb-6 sm:mb-8" 
            />
            <StationList
              stations={stations}
              onSelectStation={handleSelectStation}
              currentStation={isCurrentRoomActive ? currentStation : null}
              isLoading={isStationsLoading}
              error={stationsError}
            />
          </div>
        </main>

        {isCurrentRoomActive && currentStation && (
          <ConcertControls // Updated component
            station={currentStation}
            isPlaying={isPlaying}
            onSetPlaying={togglePlay}
            onClear={clearStation}
            onShowStation={handleShowStationInList}
          />
        )}
      </div>
    </>
  );
};

export default ConcertTheaterPage;