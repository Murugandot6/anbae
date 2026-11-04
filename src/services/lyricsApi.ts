export interface LyricsMovie {
  name: string;
  year?: string;
  avatar?: string;
  route?: string;
}

export interface LyricsSong {
  id: string;
  title: string;
  route?: string;
  published_on?: string;
  movie?: LyricsMovie;
  music_director?: string[];
  lyricist?: string[];
  singers?: string[];
  actors?: string[];
  actresses?: string[];
  youtube_url?: string;
  lyrics?: string;
}

export interface LyricsCard extends LyricsSong {
  snippet?: string;
  has_lyrics?: boolean;
}

export interface LyricsEntity {
  name: string;
  title: string;
  route: string;
  avatar: string | null;
  year: string | null;
  songcount: number;
}

export type EntityKind =
  | 'movies'
  | 'singers'
  | 'lyricists'
  | 'actors'
  | 'actresses'
  | 'music-directors';

export interface LyricsStats {
  songs: number;
  movies: number;
  singers: number;
  lyricists: number;
  actors: number;
  actresses: number;
  musicDirectors: number;
}

export interface LyricsFilters {
  q?: string;
  lq?: string;
  movie?: string;
  singer?: string;
  lyricist?: string;
  actor?: string;
  actress?: string;
  musicDirector?: string;
}

export const ENTITY_FIELD: Record<EntityKind, keyof LyricsFilters> = {
  movies: 'movie',
  singers: 'singer',
  lyricists: 'lyricist',
  actors: 'actor',
  actresses: 'actress',
  'music-directors': 'musicDirector',
};

const DATA_URL = `${import.meta.env.BASE_URL}lyrics/sample-data.json`;

let libraryCache: LyricsSong[] | null = null;
let libraryPromise: Promise<LyricsSong[]> | null = null;

export function loadLibrary(): Promise<LyricsSong[]> {
  if (libraryCache) return Promise.resolve(libraryCache);
  if (libraryPromise) return libraryPromise;

  libraryPromise = fetch(DATA_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load lyrics library (HTTP ${res.status})`);
      return res.json();
    })
    .then((json: { songs?: LyricsSong[] }) => {
      libraryCache = Array.isArray(json.songs) ? json.songs : [];
      return libraryCache;
    })
    .catch((error) => {
      libraryPromise = null;
      throw error;
    });

  return libraryPromise;
}

export function songKey(song: LyricsSong): string {
  return song.route || song.id;
}

export function songSnippet(song: LyricsSong, length = 160): string {
  return (song.lyrics || '').replace(/\s+/g, ' ').trim().slice(0, length);
}

function haystack(song: LyricsSong): string {
  return [
    song.title,
    song.route,
    song.movie?.name,
    (song.singers || []).join(' '),
    (song.lyricist || []).join(' '),
    (song.music_director || []).join(' '),
    (song.actors || []).join(' '),
    (song.actresses || []).join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function filterSongs(songs: LyricsSong[], filters: LyricsFilters): LyricsSong[] {
  const q = (filters.q || '').toLowerCase().trim();
  const lq = (filters.lq || '').toLowerCase().trim();
  const movie = (filters.movie || '').toLowerCase().trim();
  const singer = (filters.singer || '').toLowerCase().trim();
  const lyricist = (filters.lyricist || '').toLowerCase().trim();
  const actor = (filters.actor || '').toLowerCase().trim();
  const actress = (filters.actress || '').toLowerCase().trim();
  const musicDirector = (filters.musicDirector || '').toLowerCase().trim();

  return songs.filter((song) => {
    if (q) {
      const hay = haystack(song);
      const words = q.split(/\s+/).filter(Boolean);
      if (hay.indexOf(q) < 0 && !words.every((word) => hay.indexOf(word) >= 0)) return false;
    }
    if (lq && (song.lyrics || '').toLowerCase().indexOf(lq) < 0) return false;
    if (movie && !(song.movie?.name || '').toLowerCase().includes(movie)) return false;
    if (singer && !(song.singers || []).join(' ').toLowerCase().includes(singer)) return false;
    if (lyricist && !(song.lyricist || []).join(' ').toLowerCase().includes(lyricist)) return false;
    if (actor && !(song.actors || []).join(' ').toLowerCase().includes(actor)) return false;
    if (actress && !(song.actresses || []).join(' ').toLowerCase().includes(actress)) return false;
    if (musicDirector && !(song.music_director || []).join(' ').toLowerCase().includes(musicDirector)) return false;
    return true;
  });
}

export function deriveEntities(songs: LyricsSong[], kind: EntityKind): LyricsEntity[] {
  const seen: Record<string, LyricsEntity> = {};

  const push = (key: string, value: Partial<LyricsEntity>) => {
    if (!key) return;
    if (!seen[key]) {
      seen[key] = {
        name: key,
        title: key,
        route: key,
        avatar: null,
        year: null,
        songcount: 0,
        ...value,
      };
    }
    seen[key].songcount += 1;
  };

  songs.forEach((song) => {
    if (kind === 'movies') {
      const movie = song.movie || {};
      const key = movie.route || movie.name;
      if (!key) return;
      if (!seen[key]) {
        seen[key] = {
          name: movie.name || key,
          title: movie.name || key,
          route: movie.route || key,
          avatar: movie.avatar || null,
          year: movie.year || null,
          songcount: 0,
        };
      }
      seen[key].songcount += 1;
      return;
    }

    const field = (
      {
        singers: 'singers',
        lyricists: 'lyricist',
        actors: 'actors',
        actresses: 'actresses',
        'music-directors': 'music_director',
      } as const
    )[kind as Exclude<EntityKind, 'movies'>];

    (song[field as keyof LyricsSong] as string[] | undefined)?.forEach((name) => push(name, {}));
  });

  return Object.values(seen).sort((a, b) => (b.songcount || 0) - (a.songcount || 0));
}

export function getStats(songs: LyricsSong[]): LyricsStats {
  return {
    songs: songs.length,
    movies: deriveEntities(songs, 'movies').length,
    singers: deriveEntities(songs, 'singers').length,
    lyricists: deriveEntities(songs, 'lyricists').length,
    actors: deriveEntities(songs, 'actors').length,
    actresses: deriveEntities(songs, 'actresses').length,
    musicDirectors: deriveEntities(songs, 'music-directors').length,
  };
}

export function findSong(songs: LyricsSong[], key: string): LyricsSong | undefined {
  return songs.find((song) => song.id === key || song.route === key);
}

export interface Paged<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function paginate<T>(items: T[], page: number, limit: number): Paged<T> {
  const safePage = Math.max(1, page || 1);
  const safeLimit = Math.max(1, limit || 24);
  const pages = Math.max(1, Math.ceil(items.length / safeLimit));
  return {
    results: items.slice((safePage - 1) * safeLimit, safePage * safeLimit),
    total: items.length,
    page: safePage,
    limit: safeLimit,
    pages,
  };
}

export function formatCount(value: number): string {
  return Number(value || 0).toLocaleString('en-IN');
}
