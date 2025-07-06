import React, { useState, FormEvent } from 'react';
import { SearchIcon, XIcon } from './icons';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isLoading: boolean;
  initialQuery: string;
  className?: string; // Added className prop
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onClear, isLoading, initialQuery, className }) => {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };
  
  const handleClear = () => {
    setQuery('');
    onClear();
  }

  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className || ''}`}> {/* Apply className here */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <SearchIcon className="h-5 w-5 text-muted-foreground" />
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full rounded-md border-0 bg-input/50 py-2.5 pl-10 pr-10 text-foreground shadow-sm ring-1 ring-inset ring-border/50 placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-all"
        placeholder="Search for a station..."
        disabled={isLoading}
      />
      {query && (
         <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
        >
            <XIcon className="h-5 w-5 text-muted-foreground hover:text-foreground"/>
        </button>
      )}
    </form>
  );
};

export default SearchBar;