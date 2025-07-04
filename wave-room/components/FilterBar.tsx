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
  <div className="flex-1 min-w-[140px]">
    <label htmlFor={id} className="sr-only">{label}</label>
    <select
      id={id}
      name={id}
      value={value}
      onChange={(e) => onChange(id, e.target.value)}
      disabled={disabled || options.length === 0}
      className="block w-full rounded-md border-0 bg-gray-700 py-2 pl-3 pr-8 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
