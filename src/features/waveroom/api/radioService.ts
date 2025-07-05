import { API_BASE_URLS } from './constants';
import { Station, SearchParams } from '../types';

let apiServers: string[] = [];
let serversInitializationPromise: Promise<void> | null = null;
let currentApiBaseIndex = 0;

const initializeApiServers = async (): Promise<void> => {
  try {
    const response = await fetch('https://all.api.radio-browser.info/json/servers');
    if (!response.ok) {
      throw new Error(`Failed to fetch server list: ${response.statusText}`);
    }
    const servers: any[] = await response.json();
    
    const healthyServers = servers
      .filter(s => s.lastcheckok === 1)
      .sort((a, b) => b.votes - a.votes)
      .map(s => `https://${s.name}`);

    if (healthyServers.length > 0) {
      apiServers = healthyServers;
    } else {
      apiServers = [...API_BASE_URLS];
    }
  } catch (error) {
    apiServers = [...API_BASE_URLS];
  }
};

const ensureServersInitialized = (): Promise<void> => {
  if (!serversInitializationPromise) {
    serversInitializationPromise = initializeApiServers();
  }
  return serversInitializationPromise;
};


const resilientFetch = async <T,>(endpoint: string): Promise<T> => {
  await ensureServersInitialized();

  const maxRetries = apiServers.length;
  if (maxRetries === 0) {
      throw new Error('No API servers available to fetch from.');
  }

  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    const baseUrl = apiServers[currentApiBaseIndex];
    const url = `${baseUrl}/json/${endpoint}`;
    
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length === 0) {
        // Return empty array for no results, don't treat as an error
        return data as T;
      }
      if (!Array.isArray(data)) {
         throw new Error('Invalid response from mirror');
      }
      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      currentApiBaseIndex = (currentApiBaseIndex + 1) % apiServers.length;
    }
  }

  throw new Error(`All API mirrors failed. Last error: ${lastError?.message}`);
};

type ApiFilterOption = { name: string, stationcount: number };

export const getLanguages = async (): Promise<string[]> => {
    const languages = await resilientFetch<ApiFilterOption[]>('languages?hidebroken=true&order=stationcount&reverse=true');
    return languages.map(lang => lang.name).filter(name => name.trim() !== '');
};

export const getCountries = async (): Promise<string[]> => {
    const countries = await resilientFetch<ApiFilterOption[]>('countries?hidebroken=true&order=stationcount&reverse=true');
    return countries.map(country => country.name).filter(name => name.trim() !== '');
};

export const getTags = async (limit: number = 150): Promise<string[]> => {
    const tags = await resilientFetch<ApiFilterOption[]>(`tags?hidebroken=true&order=stationcount&reverse=true&limit=${limit}`);
    return tags.map(tag => tag.name).filter(name => name.trim() !== '');
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