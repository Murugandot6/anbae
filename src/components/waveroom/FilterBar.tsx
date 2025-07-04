import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterSelectProps {
  label: string;
  id: 'language' | 'country' | 'tag';
  options: string[];
  value: string;
  onChange: (filterType: 'language' | 'country' | 'tag', value: string) => void;
  disabled: boolean;
}

const FilterSelect: React.FC<FilterSelectProps> = ({ label, id, options, value, onChange, disabled }) => (
  <div className="flex-1 min-w-[140px]">
    <Select
      value={value}
      onValueChange={(val) => onChange(id, val)}
      disabled={disabled || options.length === 0}
    >
      <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
        <SelectValue placeholder={`All ${label}s`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All {label}s</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);


interface FilterBarProps {
  languages: string[];
  countries: string[];
  tags: string[];
  selectedLanguage: string;
  selectedCountry: string;
  selectedTag: string;
  onFilterChange: (filterType: 'language' | 'country' | 'tag', value: string) => void;
  isLoading: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ languages, countries, tags, selectedLanguage, selectedCountry, selectedTag, onFilterChange, isLoading }) => {
  return (
    <div className="flex flex-wrap w-full md:w-auto items-center gap-2 md:gap-3">
      <FilterSelect label="Language" id="language" options={languages} value={selectedLanguage} onChange={onFilterChange} disabled={isLoading} />
      <FilterSelect label="Country" id="country" options={countries} value={selectedCountry} onChange={onFilterChange} disabled={isLoading} />
      <FilterSelect label="Category" id="tag" options={tags} value={selectedTag} onChange={onFilterChange} disabled={isLoading} />
    </div>
  );
};

export default FilterBar;