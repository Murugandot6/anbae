import React, { useState, useEffect, useCallback } from 'react';
import { Station } from './types';
import { getTopClickedStations, searchStations, getLanguages, getCountries, getTags } from './services/radioService';
import SearchBar from './components/SearchBar';
import StationList from './components/StationList';
import AudioPlayer from './components/AudioPlayer';
import { RadioIcon } from './components/icons/RadioIcon';
import FilterBar from './components/FilterBar';

const App: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  
  const [languages, setLanguages] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectStation = (station: Station) => {
    if (station.url_resolved) {
      setCurrentStation(station);
    } else {
      setError(`Station ${station.name} does not have a valid stream URL.`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleFilterChange = (filterType: 'language' | 'country' | 'tag', value: string) => {
    if (filterType === 'language') setSelectedLanguage(value);
    if (filterType === 'country') setSelectedCountry(value);
    if (filterType === 'tag') setSelectedTag(value);
  };

  const buildTitle = (): string => {
    if (searchQuery) {
      return `Results for "${searchQuery}"`;
    }
    if (selectedLanguage || selectedCountry || selectedTag) {
      let parts: string[] = [];
      if (selectedTag) {
        parts.push(selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1));
      }
      parts.push("Stations");
      if (selectedLanguage) {
        parts.push(`in ${selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}`);
      }
      if (selectedCountry) {
        parts.push(`from ${selectedCountry}`);
      }
      return parts.join(' ');
    }
    return "Top Stations";
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-200 flex flex-col antialiased">
      <header className="bg-gray-800/70 backdrop-blur-md border-b border-gray-700 p-4 shadow-lg z-20 sticky top-0">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RadioIcon className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">FM Party</h1>
          </div>
          <div className="w-full max-w-lg">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} initialQuery={searchQuery} onClear={handleClearSearch} />
          </div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto pb-28">
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
              onFilterChange={handleFilterChange}
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

      {currentStation && <AudioPlayer station={currentStation} onClear={() => setCurrentStation(null)}/>}
    </div>
  );
};

export default App;
