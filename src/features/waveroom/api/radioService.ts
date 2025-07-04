import { API_BASE_URLS } from './constants';
import { Station, SearchParams } from '../types';

let currentApiBaseIndex = 0;

const resilientFetch = async <T,>(endpoint: string): Promise<T> => {
  const maxRetries = API_BASE_URLS.length;
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    const baseUrl = API_BASE_URLS[currentApiBaseIndex];
    const url = `${baseUrl}/json/${endpoint}`;
    
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length === 0) {
        return data as T;
      }
      if (!Array.isArray(data)) {
         throw new Error('Invalid response from mirror');
      }
      return data as T;
    } catch (error) {
      console.warn(`Failed to fetch from ${baseUrl}. Trying next mirror.`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      currentApiBaseIndex = (currentApiBaseIndex + 1) % API_BASE_URLS.length;
    }
  }

  throw new Error(`All API mirrors failed. Last error: ${lastError?.message}`);
};

type ApiFilterOption = { name: string, stationcount: number };

export const getLanguages = async (): Promise<string[]> => {
    const languages = await resilientFetch<ApiFilterOption[]>('languages?hidebroken=true&order=stationcount&reverse=true');
    const uniqueLanguages = [...new Set(languages.map(lang => lang.name).filter(name => name.trim() !== ''))];
    return uniqueLanguages;
};

export const getCountries = async (): Promise<string[]> => {
    const countries = await resilientFetch<ApiFilterOption[]>('countries?hidebroken=true&order=stationcount&reverse=true');
    const uniqueCountries = [...new Set(countries.map(country => country.name).filter(name => name.trim() !== ''))];
    return uniqueCountries;
};

export const getTags = async (limit: number = 150): Promise<string[]> => {
    const tags = await resilientFetch<ApiFilterOption[]>(`tags?hidebroken=true&order=stationcount&reverse=true&limit=${limit}`);
    const uniqueTags = [...new Set(tags.map(tag => tag.name).filter(name => name.trim() !== ''))];
    return uniqueTags;
};


export const getTopClickedStations = async (limit: number = 100): Promise<Station[]> => {
  return resilientFetch<Station[]>(`stations/topclick/${limit}?hidebroken=true`);
};

export const searchStations = async (params: SearchParams, limit: number = 100): Promise<Station[]> => {
    const query = new URLSearchParams({
        limit: String(limit),
        hidebroken: 'true',
        order: 'clickcount',
        reverse: 'true',
    });

    if (params.name) query.set('name', params.name);
    if (params.language) query.set('language', params.language);
    if (params.country) query.set('country', params.country);
    if (params.tag) query.set('tag', params.tag);

    return resilientFetch<Station[]>(`stations/search?${query.toString()}`);
};