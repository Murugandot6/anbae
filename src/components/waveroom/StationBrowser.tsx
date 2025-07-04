import React, { useState, useEffect } from 'react';
import { Station } from '@/types/waveRoom';
import { getTopClickedStations, searchStations, getLanguages, getCountries, getTags } from '@/services/waveroom/radioService';
import SearchBar from '@/components/waveroom/SearchBar';
import StationList from '@/components/waveroom/StationList';
import FilterBar from '@/components/waveroom/FilterBar';

interface StationBrowserProps {
  currentStation: Station | null;
  onSelectStation: (station: Station) => void;
}

const StationBrowser: React.FC<StationBrowserProps> = ({ currentStation, onSelectStation }) => {
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

  const handleFilterChange = (filterType: 'language' | 'country' | 'tag', value: string) => {
    if (filterType === 'language') setSelectedLanguage(value);
    if (filterType === 'country') setSelectedCountry(value);
    if (filterType === 'tag') setSelectedTag(value);
  };

  const buildTitle = (): string => {
    if (searchQuery) return `Results for "${searchQuery}"`;
    if (selectedLanguage || selectedCountry || selectedTag) {
      let parts: string[] = [];
      if (selectedTag) parts.push(selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1));
      parts.push("Stations");
      if (selectedLanguage) parts.push(`in ${selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}`);
      if (selectedCountry) parts.push(`from ${selectedCountry}`);
      return parts.join(' ');
    }
    return "Top Stations";
  };

  return (
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
      <SearchBar onSearch={setSearchQuery} isLoading={isLoading} initialQuery={searchQuery} onClear={() => setSearchQuery('')} />
      <div className="mt-6">
        <StationList
          stations={stations}
          onSelectStation={onSelectStation}
          currentStation={currentStation}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
};

export default StationBrowser;