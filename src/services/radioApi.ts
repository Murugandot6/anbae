"use client";

const BASE_URL = 'https://de1.api.radio-browser.info/json';

export interface RadioStation {
  stationuuid: string;
  name: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  language: string;
  votes: number;
  clickcount: number;
}

export const radioApi = {
  getStations: async (language: string = 'english', limit: number = 50) => {
    // Changed from 'bybacktranslation' to the standard 'bylanguage' endpoint
    const res = await fetch(`${BASE_URL}/stations/bylanguage/${encodeURIComponent(language)}?limit=${limit}&order=votes&reverse=true`);
    const data = await res.json();
    return data as RadioStation[];
  },
  searchStations: async (query: string) => {
    const res = await fetch(`${BASE_URL}/stations/byname/${encodeURIComponent(query)}?limit=30`);
    const data = await res.json();
    return data as RadioStation[];
  }
};