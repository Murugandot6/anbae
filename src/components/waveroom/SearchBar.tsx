import React, { useState, FormEvent } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { XIcon } from './icons/XIcon';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isLoading: boolean;
  initialQuery: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onClear, isLoading, initialQuery }) => {
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
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <SearchIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full rounded-md border-0 bg-gray-700 py-2.5 pl-10 pr-10 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all"
        placeholder="Search for a station..."
        disabled={isLoading}
      />
      {query && (
         <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
        >
            <XIcon className="h-5 w-5 text-gray-400 hover:text-white"/>
        </button>
      )}
    </form>
  );
};

export default SearchBar;