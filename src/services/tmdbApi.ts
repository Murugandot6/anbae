"use client";

import { Movie } from "@/context/MusicContext";

const API_KEY = "c9a3033fe3a3f5e6378891c5d0e887bf";
const BASE_URL = "https://api.themoviedb.org/3";

const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

// High-quality fallback movies to guarantee the page is never blank
const FALLBACK_MOVIES: Movie[] = [
  {
    id: "440918",
    title: "Teen Spirit",
    overview: "Violet is a shy teenager who dreams of escaping her small town and pursuing her passion for singing. With the help of an unlikely mentor, she enters a local singing competition that will test her integrity, talent and ambition.",
    backdrop: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200",
    poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=400",
    rating: 6.1,
    year: "2019",
    genre: "Drama / Music",
    language: "EN"
  },
  {
    id: "27205",
    title: "Inception",
    overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\", the implantation of another person's idea into a target's subconscious.",
    backdrop: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200",
    poster: "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=400",
    rating: 8.3,
    year: "2010",
    genre: "Action / Sci-Fi",
    language: "EN"
  },
  {
    id: "157336",
    title: "Interstellar",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    backdrop: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200",
    poster: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=400",
    rating: 8.4,
    year: "2014",
    genre: "Adventure / Sci-Fi",
    language: "EN"
  },
  {
    id: "313369",
    title: "La La Land",
    overview: "Mia, an aspiring actress, and Sebastian, a dedicated jazz musician, struggle to make ends meet in a city known for crushing hopes and breaking hearts. With the showstopping musical numbers, they discover the joy and pain of pursuing their dreams.",
    backdrop: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200",
    poster: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400",
    rating: 7.9,
    year: "2016",
    genre: "Comedy / Romance / Music",
    language: "EN"
  },
  {
    id: "120",
    title: "The Lord of the Rings: The Fellowship of the Ring",
    overview: "Young hobbit Frodo Baggins, after inheriting a mysterious ring from his uncle Bilbo, must leave his home and journey to Mount Doom to destroy it before the Dark Lord Sauron can reclaim it.",
    backdrop: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=1200",
    poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400",
    rating: 8.4,
    year: "2001",
    genre: "Adventure / Fantasy",
    language: "EN"
  }
];

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

const mapTMDbToMovie = (item: any): Movie => {
  const genres = item.genre_ids && Array.isArray(item.genre_ids)
    ? item.genre_ids.map((id: number) => GENRE_MAP[id] || '').filter(Boolean).slice(0, 2).join(' / ')
    : '';

  let year = 'N/A';
  if (item.release_date && typeof item.release_date === 'string') {
    year = item.release_date.split('-')[0] || 'N/A';
  } else if (item.first_air_date && typeof item.first_air_date === 'string') {
    year = item.first_air_date.split('-')[0] || 'N/A';
  }

  const typeLabel = item.media_type === 'tv' ? 'TV Series' : (genres || 'Movie');

  return {
    id: (item.id || '').toString(),
    title: item.title || item.name || 'Untitled',
    overview: item.overview || 'No overview available.',
    backdrop: item.backdrop_path 
      ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` 
      : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200',
    poster: item.poster_path 
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
      : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=400',
    rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : 0,
    year,
    genre: typeLabel,
    language: item.original_language ? item.original_language.toUpperCase() : 'EN',
    imdbId: item.imdb_id || undefined
  };
};

export const tmdbApi = {
  getTrendingMovies: async (): Promise<Movie[]> => {
    try {
      const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
      if (!res.ok) throw new Error("Failed to fetch trending movies");
      const data = await res.json();
      const results = (data.results || []).map(mapTMDbToMovie);
      return results.length > 0 ? results : FALLBACK_MOVIES;
    } catch (error) {
      console.warn("TMDb API failed, using fallback movies:", error);
      return FALLBACK_MOVIES;
    }
  },

  getPopularMovies: async (): Promise<Movie[]> => {
    try {
      const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);
      if (!res.ok) throw new Error("Failed to fetch popular movies");
      const data = await res.json();
      const results = (data.results || []).map(mapTMDbToMovie);
      return results.length > 0 ? results : FALLBACK_MOVIES;
    } catch (error) {
      console.warn("TMDb API failed, using fallback movies:", error);
      return FALLBACK_MOVIES;
    }
  },

  getTopRatedMovies: async (): Promise<Movie[]> => {
    try {
      const res = await fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}`);
      if (!res.ok) throw new Error("Failed to fetch top rated movies");
      const data = await res.json();
      const results = (data.results || []).map(mapTMDbToMovie);
      return results.length > 0 ? results : FALLBACK_MOVIES;
    } catch (error) {
      console.warn("TMDb API failed, using fallback movies:", error);
      return FALLBACK_MOVIES;
    }
  },

  getUpcomingMovies: async (): Promise<Movie[]> => {
    try {
      const res = await fetch(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}`);
      if (!res.ok) throw new Error("Failed to fetch upcoming movies");
      const data = await res.json();
      const results = (data.results || []).map(mapTMDbToMovie);
      return results.length > 0 ? results : FALLBACK_MOVIES;
    } catch (error) {
      console.warn("TMDb API failed, using fallback movies:", error);
      return FALLBACK_MOVIES;
    }
  },

  searchMovies: async (query: string): Promise<Movie[]> => {
    try {
      const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to search movies/tv");
      const data = await res.json();
      const results = (data.results || [])
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map(mapTMDbToMovie);
      return results.length > 0 ? results : FALLBACK_MOVIES.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
    } catch (error) {
      console.warn("TMDb API failed, using fallback search:", error);
      return FALLBACK_MOVIES.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
    }
  },

  getMovieImdbId: async (movieId: string): Promise<string | null> => {
    try {
      const res = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=external_ids`);
      const data = await res.json();
      
      if (data.imdb_id || data.external_ids?.imdb_id) {
        return data.imdb_id || data.external_ids?.imdb_id;
      }

      const tvRes = await fetch(`${BASE_URL}/tv/${movieId}?api_key=${API_KEY}&append_to_response=external_ids`);
      const tvData = await tvRes.json();
      return tvData.external_ids?.imdb_id || null;
    } catch (error) {
      console.error("Error fetching IMDB ID:", error);
      return null;
    }
  },

  getMovieCredits: async (movieId: string): Promise<CastMember[]> => {
    try {
      let res = await fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`);
      if (!res.ok) {
        res = await fetch(`${BASE_URL}/tv/${movieId}/credits?api_key=${API_KEY}`);
      }
      if (!res.ok) throw new Error("Failed to fetch credits");
      const data = await res.json();
      return (data.cast || []).slice(0, 10).map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_path: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
      }));
    } catch (error) {
      console.error("Error fetching credits:", error);
      return [];
    }
  }
};