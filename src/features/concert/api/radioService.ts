import { Station, SearchParams } from '../types';
import { supabase } from '@/integrations/supabase/client';

const proxyFetch = async <T,>(endpoint: string): Promise<T> => {
  // The 'radio-proxy' function is expected to be deployed in Supabase.
  const { data, error } = await supabase.functions.invoke('radio-proxy', {
    body: { endpoint },
  });

  if (error) {
    // This error is from the client's attempt to call the function (e.g., network, auth)
    throw new Error(`Failed to call the radio proxy: ${error.message}`);
  }
  
  // This error is from within the function itself (e.g., it couldn't reach the radio API)
  if (data.error) {
    throw new Error(`Radio proxy error: ${data.error}`);
  }

  // The function returns the data from the radio API directly
  return data as T;
};

type ApiFilterOption = { name: string, stationcount: number };

export const getLanguages = async (): Promise<string[]> => {
    const languages = await proxyFetch<ApiFilterOption[]>('languages?hidebroken=true&order=stationcount&reverse=true');
    return languages.map(lang => lang.name).filter(name => name.trim() !== '');
};

export const getCountries = async (): Promise<string[]> => {
    const countries = await proxyFetch<ApiFilterOption[]>('countries?hidebroken=true&order=stationcount&reverse=true');
    return countries.map(country => country.name).filter(name => name.trim() !== '');
};

export const getTags = async (limit: number = 150): Promise<string[]> => {
    const tags = await proxyFetch<ApiFilterOption[]>(`tags?hidebroken=true&order=stationcount&reverse=true&limit=${limit}`);
    return tags.map(tag => tag.name).filter(name => name.trim() !== '');
};

const filterStations = (stations: Station[]): Station[] => {
  const knownAudioCodecs = ['MP3', 'AAC', 'OGG', 'FLAC', 'OPUS', 'WMA', 'WAV'];
  return stations.filter(station => {
    if (!station || typeof station !== 'object') return false; // Add guard for invalid station data
    if (station.hls === 1) {
      return true;
    }
    const codec = station.codec?.toUpperCase() || '';
    if (codec === '') {
      return true;
    }
    return knownAudioCodecs.some(knownCodec => codec.includes(knownCodec));
  });
};

export const getTopClickedStations = async (limit: number = 100): Promise<Station[]> => {
  const stations = await proxyFetch<Station[]>(`stations/topclick/${limit}?hidebroken=true`);
  return filterStations(stations);
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

    const stations = await proxyFetch<Station[]>(`stations/search?${query.toString()}`);
    return filterStations(stations);
};