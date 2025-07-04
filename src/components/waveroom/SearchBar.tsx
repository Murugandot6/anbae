import React, { useState, FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full rounded-md bg-gray-700 py-2.5 pl-10 pr-10 text-white shadow-sm border-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        placeholder="Search for a station..."
        disabled={isLoading}
      />
      {query && (
         <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center h-full w-10"
        >
            <X className="h-5 w-5 text-gray-400 hover:text-white"/>
        </Button>
      )}
    </form>
  );
};

export default SearchBar;