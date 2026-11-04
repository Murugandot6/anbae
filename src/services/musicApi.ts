"use client";

export interface Song {
  id: string;
  name: string;
  type: string;
  album: {
    id: string;
    name: string;
    url: string;
  };
  year: string;
  releaseDate: string;
  duration: string;
  label: string;
  primaryArtists: string;
  featuredArtists: string;
  singers: string;
  image: { quality: string; url: string }[];
  downloadUrl: { quality: string; url: string }[];
  language: string;
  url: string;
}

export interface Album {
  id: string;
  name: string;
  year: string;
  type: string;
  language: string;
  image: { quality: string; url: string }[];
  songs: Song[];
  songCount?: string | number;
}

export interface Playlist {
  id: string;
  name: string;
  image: { quality: string; url: string }[];
  songs: Song[];
  language: string;
  year: string;
  songCount?: string | number;
}

const BASE_URL = 'https://jiosaavn-api.imurugan.workers.dev';

/**
 * Standardizes song metadata formats (like building the primaryArtists string 
 * when the API returns complex nested artists structure instead).
 */
export const mapApiSong = (song: any): Song => {
  if (!song) return song;

  let primaryArtists = song.primaryArtists;
  if (!primaryArtists && song.artists) {
    if (Array.isArray(song.artists.primary)) {
      primaryArtists = song.artists.primary.map((a: any) => a.name).join(', ');
    } else if (Array.isArray(song.artists.all)) {
      primaryArtists = song.artists.all
        .filter((a: any) => a.role === 'primary_artists' || a.role === 'singers' || a.role === 'music')
        .map((a: any) => a.name)
        .join(', ');
    }
  }

  return {
    ...song,
    primaryArtists: primaryArtists || 'Unknown Artist'
  };
};

// Helper to get the song count from any album/playlist object consistently
export const getContainerCount = (item: any): number => {
  if (!item) return 0;
  
  if (Array.isArray(item.songs) && item.songs.length > 0) {
    return item.songs.length;
  }
  
  if (item.songCount !== undefined) {
    return parseInt(String(item.songCount)) || 0;
  }
  
  return 0;
};

export const musicApi = {
  // Global search for all types
  searchAll: async (query: string) => {
    const response = await fetch(`${BASE_URL}/api/search?query=${encodeURIComponent(query)}`);
    const res = await response.json();
    return res.data || null;
  },

  // Specific search endpoints
  searchSongs: async (query: string, page: number = 1, limit: number = 20): Promise<Song[]> => {
    // Standardize page to 1-based index as requested by the worker API endpoint
    const activePage = page <= 0 ? 1 : page;
    const response = await fetch(`${BASE_URL}/api/search/songs?query=${encodeURIComponent(query)}&page=${activePage}&limit=${limit}`);
    const res = await response.json();
    const data = res.data;
    if (!data) return [];
    const results = data.results || (Array.isArray(data) ? data : []);
    return results.map(mapApiSong);
  },

  searchAlbums: async (query: string): Promise<Album[]> => {
    const response = await fetch(`${BASE_URL}/api/search/albums?query=${encodeURIComponent(query)}`);
    const res = await response.json();
    const data = res.data;
    if (!data) return [];
    return data.results || (Array.isArray(data) ? data : []);
  },

  searchArtists: async (query: string, page: number = 0, limit: number = 24): Promise<any[]> => {
    const response = await fetch(`${BASE_URL}/api/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    const res = await response.json();
    const data = res.data;
    if (!data) return [];
    return data.results || (Array.isArray(data) ? data : []);
  },

  searchPlaylists: async (query: string, page: number = 0, limit: number = 40): Promise<Playlist[]> => {
    const response = await fetch(`${BASE_URL}/api/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    const res = await response.json();
    const data = res.data;
    if (!data) return [];
    return data.results || (Array.isArray(data) ? data : []);
  },

  // Detail endpoints
  getSongDetails: async (id: string): Promise<Song | null> => {
    try {
      const response = await fetch(`${BASE_URL}/api/songs/${id}`);
      const res = await response.json();
      const song = res.data?.[0] || null;
      return song ? mapApiSong(song) : null;
    } catch (e) {
      return null;
    }
  },

  getAlbumDetails: async (id: string): Promise<Album | null> => {
    try {
      const response = await fetch(`${BASE_URL}/api/albums?id=${id}`);
      const res = await response.json();
      if (res.data) {
        const songs = Array.isArray(res.data.songs) ? res.data.songs.map(mapApiSong) : [];
        return { ...res.data, songs };
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  getPlaylistDetails: async (id: string): Promise<Playlist | null> => {
    try {
      let response = await fetch(`${BASE_URL}/api/playlists?id=${id}&limit=500`);
      let res = await response.json();
      
      let data = res.data;
      if (!data) {
        response = await fetch(`${BASE_URL}/api/playlists/${id}?limit=500`);
        res = await response.json();
        data = res.data;
      }

      if (data) {
        const songs = Array.isArray(data.songs) ? data.songs.map(mapApiSong) : [];
        return { ...data, songs };
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  // Trending songs endpoint
  getTrending: async (languages: string = 'tamil'): Promise<Song[]> => {
    try {
      const langList = languages.split(',').filter(Boolean);
      const primaryLang = langList[0] || 'tamil';
      const response = await fetch(`${BASE_URL}/api/search/songs?query=${encodeURIComponent(primaryLang + ' hits')}&limit=150`);
      const res = await response.json();
      const data = res.data;
      if (!data) return [];
      const results = data.results || (Array.isArray(data) ? data : []);
      return results.map(mapApiSong);
    } catch (e) {
      console.error("Error in getTrending:", e);
      return [];
    }
  },

  // Artist details endpoint
  getArtistDetails: async (id: string): Promise<any | null> => {
    try {
      const response = await fetch(`${BASE_URL}/api/artists/${id}`);
      const res = await response.json();
      return res.data || null;
    } catch (e) {
      console.error("Error in getArtistDetails:", e);
      return null;
    }
  },

  // Artist songs endpoint
  getArtistSongs: async (id: string, page: number = 0, artistName?: string): Promise<Song[]> => {
    try {
      let songsList: any[] = [];
      const activePage = page + 1; // Map local 0-based page to 1-based API index
      
      // Try to fetch via artist endpoint
      if (id && id !== 'unknown') {
        try {
          const response = await fetch(`${BASE_URL}/api/artists/${id}/songs?page=${activePage}`);
          const res = await response.json();
          const songsData = res.data?.songs || res.data?.results || [];
          
          if (songsData && !Array.isArray(songsData) && typeof songsData === 'object') {
            songsList = Object.values(songsData).filter((item: any) => item && typeof item === 'object' && item.id);
          } else if (Array.isArray(songsData)) {
            songsList = songsData;
          }
        } catch (err) {
          console.warn("Artist songs path request failed, falling back to name search:", err);
        }
      }

      // Safe fallback: if path endpoint returns no results, use search API by artistName to pull top-tier hits
      if (songsList.length === 0 && artistName) {
        // Clean double-spaces or spaces around dots for optimal query precision
        const cleanedName = artistName.replace(/\s+/g, ' ').trim();
        const searchResults = await musicApi.searchSongs(cleanedName, activePage, 50);
        songsList = searchResults;
      }

      return songsList.map(mapApiSong);
    } catch (e) {
      console.error("Error in getArtistSongs:", e);
      return [];
    }
  }
};