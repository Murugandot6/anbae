import React from 'react';

interface FilterSelectProps {
  label: string;
  id: 'language' | 'country' | 'tag';
  options: string[];
  value: string;
  onChange: (filterType: 'language' | 'country' | 'tag', value: string) => void;
  disabled: boolean;
}

const FilterSelect: React.FC<FilterSelectProps> = ({ label, id, options, value, onChange, disabled }) => (
  <div className="flex-1 min-w-[120px] sm:min-w-[140px]"> {/* Adjusted min-width */}
    <label htmlFor={id} className="sr-only">{label}</label>
    <select
      id={id}
      name={id}
      value={value}
      onChange={(e) => onChange(id, e.target.value)}
      disabled={disabled || options.length === 0}
      className="block w-full rounded-md border-0 bg-input/50 py-1.5 pl-2.5 pr-6 sm:py-2 sm:pl-3 sm:pr-8 text-foreground shadow-sm ring-1 ring-inset ring-border/50 placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary text-sm sm:text-base sm:leading-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed" // Adjusted padding, font size
    >
      <option value="">All {label}s</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </option>
      ))}
    </select>
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