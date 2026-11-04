"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import {
  loadLibrary,
  filterSongs,
  deriveEntities,
  getStats,
  paginate,
  songKey,
  songSnippet,
  formatCount,
  ENTITY_FIELD,
  type LyricsSong,
  type LyricsEntity,
  type EntityKind,
  type LyricsFilters,
} from '@/services/lyricsApi';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Search,
  Sparkles,
  Heart,
  ChevronLeft,
  ChevronRight,
  Copy,
  Youtube,
  Shuffle,
  ScrollText,
  Star,
  Play,
  ArrowUpRight,
  X,
} from 'lucide-react';

type TabKey = 'songs' | 'lyrics' | EntityKind;

const PAGE_SIZE = 24;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'songs', label: 'Songs' },
  { key: 'lyrics', label: 'Lyrics' },
  { key: 'movies', label: 'Movies' },
  { key: 'singers', label: 'Singers' },
  { key: 'lyricists', label: 'Lyricists' },
  { key: 'actors', label: 'Actors' },
  { key: 'actresses', label: 'Actresses' },
  { key: 'music-directors', label: 'Music Directors' },
];

const QUICK_PICKS = [
  'A. R. Rahman',
  'Anirudh Ravichander',
  'Yuvan Shankar Raja',
  'Vairamuthu',
  'Shreya Ghoshal',
  'Ilaiyaraaja',
];

const FAV_STORAGE_KEY = 'anbaeLyricsFavs';

const ENTITY_LABEL: Record<EntityKind, string> = {
  movies: 'Movies',
  singers: 'Singers',
  lyricists: 'Lyricists',
  actors: 'Actors',
  actresses: 'Actresses',
  'music-directors': 'Music Directors',
};

const isEntityTab = (tab: TabKey): tab is EntityKind => tab !== 'songs' && tab !== 'lyrics';

type FilterState = {
  movie: string;
  singer: string;
  lyricist: string;
  actor: string;
  actress: string;
  musicDirector: string;
};

const EMPTY_FILTERS: FilterState = {
  movie: '',
  singer: '',
  lyricist: '',
  actor: '',
  actress: '',
  musicDirector: '',
};

const FILTER_LABEL: Record<keyof FilterState, string> = {
  movie: 'Movie',
  singer: 'Singer',
  lyricist: 'Lyricist',
  actor: 'Actor',
  actress: 'Actress',
  musicDirector: 'Music director',
};

function loadFavorites(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(FAV_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

/* ── Premium primitives ──────────────────────────────────────────────── */

const Kicker: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn('font-mono text-[10px] uppercase tracking-[0.35em]', className)}>{children}</span>
);

const Hairline: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent', className)} />
);

const ArtFallback: React.FC<{ label: string; className?: string; rounded?: string }> = ({
  label,
  className,
  rounded = 'rounded-2xl',
}) => (
  <div
    className={cn(
      'w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-500/[0.08] via-zinc-900/60 to-zinc-950 text-rose-300/50 font-black text-3xl tracking-tight',
      rounded,
      className,
    )}
  >
    {(label || '?').charAt(0).toUpperCase()}
  </div>
);

const Poster: React.FC<{ src?: string; label: string; rounded?: string; className?: string }> = ({
  src,
  label,
  rounded,
  className,
}) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return <ArtFallback label={label} rounded={rounded} className={className} />;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setBroken(true)}
      className={cn('w-full h-full object-cover', rounded, className)}
    />
  );
};

const StatTile: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="group min-w-[96px] rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-3.5 text-left transition-colors hover:border-rose-500/25 hover:bg-white/[0.04]">
    <div className="font-mono text-xl font-semibold tabular-nums text-white">{formatCount(value)}</div>
    <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.3em] text-rose-300/60">{label}</div>
  </div>
);

const CreditChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[11px] text-zinc-300">
    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-rose-300/70">{label}</span>
    <span className="font-medium text-white/90">{value}</span>
  </span>
);

/* ── Page ─────────────────────────────────────────────────────────────── */

const Lyrics = () => {
  const [songs, setSongs] = useState<LyricsSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tab, setTab] = useState<TabKey>('songs');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [favOnly, setFavOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState<Record<string, string>>({});

  const [active, setActive] = useState<LyricsSong | null>(null);
  const [singOpen, setSingOpen] = useState(false);
  const [singIndex, setSingIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    loadLibrary()
      .then((data) => {
        if (!alive) return;
        setSongs(data);
        setLoading(false);
      })
      .catch((error) => {
        if (!alive) return;
        setLoadError(error?.message || 'Failed to load library');
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [tab, filters, favOnly]);

  const stats = useMemo(() => getStats(songs), [songs]);

  const movieOptions = useMemo(() => deriveEntities(songs, 'movies'), [songs]);
  const singerOptions = useMemo(() => deriveEntities(songs, 'singers'), [songs]);
  const lyricistOptions = useMemo(() => deriveEntities(songs, 'lyricists'), [songs]);

  const favoriteKeys = useMemo(() => Object.keys(favorites), [favorites]);

  const activeFilterEntries = useMemo(
    () =>
      (Object.keys(filters) as (keyof FilterState)[])
        .filter((key) => filters[key])
        .map((key) => ({ key, label: FILTER_LABEL[key], value: filters[key] })),
    [filters],
  );
  const hasActiveFilter = activeFilterEntries.length > 0 || Boolean(searchInput);

  const browseFilters: LyricsFilters = useMemo(
    () => ({
      q: tab === 'songs' ? query : '',
      lq: tab === 'lyrics' ? query : '',
      movie: filters.movie,
      singer: filters.singer,
      lyricist: filters.lyricist,
      actor: filters.actor,
      actress: filters.actress,
      musicDirector: filters.musicDirector,
    }),
    [tab, query, filters],
  );

  const songResults = useMemo(() => {
    if (favOnly) {
      return songs.filter((song) => favorites[songKey(song)]);
    }
    return filterSongs(songs, browseFilters);
  }, [songs, browseFilters, favOnly, favorites]);

  const entityResults = useMemo(() => {
    if (!isEntityTab(tab)) return [] as LyricsEntity[];
    const all = deriveEntities(songs, tab);
    if (!query) return all;
    const needle = query.toLowerCase();
    return all.filter((entity) =>
      `${entity.name} ${entity.route}`.toLowerCase().includes(needle),
    );
  }, [songs, tab, query]);

  const isSongMode = tab === 'songs' || tab === 'lyrics';

  const pagedSongs = useMemo(() => paginate(songResults, page, PAGE_SIZE), [songResults, page]);
  const pagedEntities = useMemo(() => paginate(entityResults, page, PAGE_SIZE), [entityResults, page]);

  const totalResults = favOnly || isSongMode ? songResults.length : entityResults.length;
  const pages = favOnly || isSongMode ? pagedSongs.pages : pagedEntities.pages;
  const pageResults = favOnly || isSongMode ? pagedSongs.results : pagedEntities.results;

  const spotlight = useMemo(() => {
    const withArt = songs.filter((song) => song.movie?.avatar);
    const pool = withArt.length ? withArt : songs;
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }, [songs]);

  const persistFavorites = (next: Record<string, string>) => {
    setFavorites(next);
    try {
      localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const toggleFavorite = (song: LyricsSong) => {
    const key = songKey(song);
    const next = { ...favorites };
    if (next[key]) {
      delete next[key];
      toast.success('Removed from favorites');
    } else {
      next[key] = song.title;
      toast.success('Saved to favorites');
    }
    persistFavorites(next);
  };

  const isFavorite = (song: LyricsSong) => Boolean(favorites[songKey(song)]);

  const openSong = (song: LyricsSong) => {
    setActive(song);
    setSingIndex(0);
  };

  const jumpToEntitySongs = (kind: EntityKind, name: string) => {
    const field = ENTITY_FIELD[kind];
    setFilters({ ...EMPTY_FILTERS, [field]: name } as FilterState);
    setSearchInput('');
    setFavOnly(false);
    setTab('songs');
  };

  const surprise = () => {
    const pool = songResults.length ? songResults : songs;
    if (!pool.length) return;
    openSong(pool[Math.floor(Math.random() * pool.length)]);
  };

  const goToPage = (delta: number) => {
    setPage((current) => Math.min(pages, Math.max(1, current + delta)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeLines = useMemo(
    () => (active?.lyrics || '').split('\n').filter((line) => line.trim()),
    [active],
  );

  const copyLyrics = () => {
    if (!active) return;
    const movieName = active.movie?.name || '';
    const text = `${active.title}\n${movieName}\n\n${active.lyrics || ''}`;
    const fallback = () => {
      try {
        const area = document.createElement('textarea');
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
        toast.success('Lyrics copied');
      } catch {
        toast.error('Copy failed');
      }
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => toast.success('Lyrics copied'),
        fallback,
      );
    } else {
      fallback();
    }
  };

  const renderSongCard = (song: LyricsSong) => {
    const thumb = song.movie?.avatar;
    const meta = [song.movie?.name, song.movie?.year].filter(Boolean).join(' · ');
    return (
      <article
        key={songKey(song)}
        onClick={() => openSong(song)}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all duration-500 cursor-pointer hover:-translate-y-1 hover:border-rose-500/30 hover:bg-white/[0.04] hover:shadow-[0_24px_60px_-24px_rgba(244,63,94,0.25)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950">
          <Poster
            src={thumb}
            label={song.title}
            rounded="rounded-none"
            className="opacity-90 transition-all duration-700 group-hover:scale-[1.04] group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_30px_rgba(255,255,255,0.25)]">
              <ScrollText size={16} />
            </div>
          </div>
          <button
            type="button"
            aria-label={isFavorite(song) ? 'Remove favorite' : 'Add favorite'}
            onClick={(event) => {
              event.stopPropagation();
              toggleFavorite(song);
            }}
            className={cn(
              'absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-300',
              isFavorite(song)
                ? 'border-rose-400/40 bg-rose-500/90 text-white shadow-[0_0_24px_rgba(244,63,94,0.45)]'
                : 'border-white/10 bg-black/40 text-white/60 hover:border-rose-400/40 hover:text-rose-300',
            )}
          >
            <Star size={13} fill={isFavorite(song) ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="space-y-1.5 p-4 text-left">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-white">
            {song.title}
          </h3>
          {meta && <p className="truncate font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">{meta}</p>}
          {tab === 'lyrics' && songSnippet(song) && (
            <p className="line-clamp-2 border-l-2 border-rose-500/40 pl-2.5 text-[11px] italic leading-relaxed text-rose-100/60">
              {songSnippet(song)}…
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {song.singers?.slice(0, 2).map((singer) => (
              <span
                key={singer}
                className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[9px] font-medium text-zinc-400"
              >
                {singer}
              </span>
            ))}
            {song.lyricist?.[0] && (
              <span className="rounded-md border border-rose-500/20 bg-rose-500/[0.06] px-2 py-0.5 text-[9px] font-medium text-rose-200/80">
                {song.lyricist[0]}
              </span>
            )}
          </div>
        </div>
      </article>
    );
  };

  const renderEntityCard = (entity: LyricsEntity) => (
    <article
      key={`${tab}-${entity.route}`}
      onClick={() => jumpToEntitySongs(tab as EntityKind, entity.name)}
      className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-all duration-500 hover:border-rose-500/30 hover:bg-white/[0.04] hover:shadow-[0_20px_50px_-24px_rgba(244,63,94,0.25)]"
    >
      <div className="relative h-14 w-14 shrink-0">
        <div className="h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-zinc-950">
          <Poster src={entity.avatar || undefined} label={entity.name} rounded="rounded-full" />
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:shadow-[0_0_24px_rgba(244,63,94,0.35)]" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <h3 className="truncate text-sm font-semibold tracking-tight text-white">{entity.name}</h3>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-rose-300/60 tabular-nums">
          {formatCount(entity.songcount)} {entity.songcount === 1 ? 'song' : 'songs'}
        </p>
      </div>
      <ArrowUpRight
        size={16}
        className="shrink-0 text-zinc-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-rose-400"
      />
    </article>
  );

  const headingLabel = favOnly
    ? 'Favorites'
    : isSongMode
      ? tab === 'lyrics'
        ? 'Lyrics'
        : 'All songs'
      : ENTITY_LABEL[tab as EntityKind];

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#08080b]">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-white/[0.05]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[-420px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-rose-600/[0.13] blur-[140px]" />
            <div className="absolute right-[-140px] top-[-160px] h-[380px] w-[380px] rounded-full bg-purple-600/10 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 md:pt-24 md:pb-20">
            {/* Featured spotlight floats right on desktop */}
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.5fr_1fr] lg:items-end">
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <ScrollText className="text-rose-400" size={14} />
                  <Kicker className="text-rose-400/90">Isai Padal — Tamil Lyrics Library</Kicker>
                </div>

                <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl">
                  Every lyric,
                  <br />
                  <span className="bg-gradient-to-r from-rose-300 via-rose-400 to-purple-400 bg-clip-text italic text-transparent">
                    ever written.
                  </span>
                </h1>

                <p className="max-w-md text-sm font-medium leading-relaxed text-zinc-400">
                  19,000+ Tamil songs across 3,700 films. Search inside lyric lines, follow the
                  singers, and keep the ones you love.
                </p>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setQuery(searchInput.trim());
                  }}
                  className="group relative max-w-xl"
                >
                  <Search
                    className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-rose-400"
                    size={17}
                  />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={
                      tab === 'lyrics' ? 'Search inside lyric lines…' : 'Song, movie, singer, lyricist…'
                    }
                    className="h-14 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] pl-12 pr-28 text-sm font-medium text-white outline-none backdrop-blur-xl transition-all duration-300 placeholder:text-zinc-600 focus:border-rose-500/40 focus:bg-white/[0.05] focus:shadow-[0_0_0_1px_rgba(244,63,94,0.2),0_16px_50px_-16px_rgba(244,63,94,0.3)]"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-xl bg-white px-5 text-[11px] font-bold uppercase tracking-[0.15em] text-black transition-all hover:bg-rose-500 hover:text-white"
                  >
                    Search
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {QUICK_PICKS.map((pick) => (
                    <button
                      key={pick}
                      type="button"
                      onClick={() => {
                        setSearchInput(pick);
                        setTab('songs');
                        setFavOnly(false);
                      }}
                      className="rounded-full border border-white/[0.07] bg-white/[0.02] px-3.5 py-1.5 text-[11px] font-medium text-zinc-400 transition-all duration-300 hover:border-rose-500/40 hover:text-rose-300"
                    >
                      {pick}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spotlight — premium glass card */}
              <aside className="hidden lg:block">
                <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-transparent p-5 backdrop-blur-xl">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-500/15 blur-[70px]" />
                  <div className="mb-4 flex items-center justify-between">
                    <Kicker className="flex items-center gap-2 text-rose-300/80">
                      <Sparkles size={11} /> Featured
                    </Kicker>
                    <button
                      type="button"
                      onClick={surprise}
                      title="Surprise me"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-all hover:border-rose-500/40 hover:text-rose-300"
                    >
                      <Shuffle size={12} />
                    </button>
                  </div>
                  {spotlight ? (
                    <div className="space-y-4">
                      <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-950">
                        <Poster
                          src={spotlight.movie?.avatar}
                          label={spotlight.title}
                          rounded="rounded-2xl"
                          className="opacity-90"
                        />
                      </div>
                      <div className="space-y-1 text-left">
                        <h3 className="text-base font-semibold leading-tight tracking-tight text-white">
                          {spotlight.title}
                        </h3>
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                          {[spotlight.movie?.name, spotlight.movie?.year].filter(Boolean).join(' · ')}
                        </p>
                        {spotlight.singers?.length ? (
                          <p className="truncate text-[11px] text-zinc-500">
                            {spotlight.singers.slice(0, 3).join(', ')}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => openSong(spotlight)}
                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-black transition-all hover:bg-rose-500 hover:text-white"
                      >
                        <ScrollText size={13} /> Read lyrics
                      </button>
                    </div>
                  ) : (
                    <Skeleton className="aspect-[4/3] rounded-2xl bg-white/5" />
                  )}
                </div>
              </aside>
            </div>

            {/* Stats strip */}
            <div className="mt-14 flex flex-wrap gap-3">
              <StatTile value={stats.songs} label="Songs" />
              <StatTile value={stats.movies} label="Movies" />
              <StatTile value={stats.singers} label="Singers" />
              <StatTile value={stats.lyricists} label="Lyricists" />
            </div>
          </div>
          <Hairline className="opacity-60" />
        </section>

        {/* ── Browse ───────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl space-y-7 px-4 py-12 sm:px-6">
          {/* Tab rail */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setTab(item.key);
                  setFavOnly(false);
                }}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-300',
                  tab === item.key && !favOnly
                    ? 'border-rose-500/50 bg-rose-500/10 text-rose-300 shadow-[0_0_24px_-6px_rgba(244,63,94,0.4)]'
                    : 'border-white/[0.06] bg-transparent text-zinc-500 hover:border-white/15 hover:text-white',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {isSongMode && (
                <>
                  {(
                    [
                      ['movie', 'All movies', movieOptions],
                      ['singer', 'All singers', singerOptions],
                      ['lyricist', 'All lyricists', lyricistOptions],
                    ] as const
                  ).map(([key, placeholder, options]) => (
                    <div key={key} className="relative">
                      <select
                        value={filters[key]}
                        onChange={(event) =>
                          setFilters((prev) => ({ ...prev, [key]: event.target.value }))
                        }
                        className={cn(
                          'h-10 appearance-none rounded-full border bg-white/[0.02] pl-4 pr-9 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-300 outline-none backdrop-blur transition-all focus:border-rose-500/40',
                          filters[key]
                            ? 'border-rose-500/40 text-rose-300'
                            : 'border-white/[0.07] hover:border-white/15',
                        )}
                      >
                        <option value="">{placeholder}</option>
                        {options.slice(0, 200).map((entity) => (
                          <option key={entity.route} value={entity.name}>
                            {entity.name} ({entity.songcount})
                          </option>
                        ))}
                      </select>
                      <ChevronRight
                        size={12}
                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-zinc-600"
                      />
                    </div>
                  ))}
                  {hasActiveFilter && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilters(EMPTY_FILTERS);
                        setSearchInput('');
                      }}
                      className="flex h-10 items-center gap-1.5 rounded-full border border-white/[0.07] px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:border-rose-500/30 hover:text-rose-300"
                    >
                      <X size={11} /> Clear
                    </button>
                  )}
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setFavOnly((value) => !value);
                setTab('songs');
              }}
              className={cn(
                'flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border px-5 font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-300',
                favOnly
                  ? 'border-rose-500/50 bg-rose-500/10 text-rose-300 shadow-[0_0_24px_-6px_rgba(244,63,94,0.4)]'
                  : 'border-white/[0.07] text-zinc-400 hover:border-rose-500/30 hover:text-rose-300',
              )}
            >
              <Heart size={12} fill={favOnly ? 'currentColor' : 'none'} />
              Favorites {favoriteKeys.length ? `(${favoriteKeys.length})` : ''}
            </button>
          </div>

          {/* Active filter chips */}
          {isSongMode && activeFilterEntries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilterEntries.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, [entry.key]: '' }))}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-500/25 bg-rose-500/[0.07] px-3 py-1.5 text-[11px] text-rose-200/90 transition-colors hover:bg-rose-500/15"
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-rose-300/60">
                    {entry.label}
                  </span>
                  <span className="font-medium">{entry.value}</span>
                  <X size={11} className="opacity-60" />
                </button>
              ))}
            </div>
          )}

          {/* Results heading */}
          <div className="flex items-end justify-between gap-4">
            <div className="text-left">
              <h2 className="text-2xl font-black tracking-[-0.03em] text-white md:text-3xl">
                {headingLabel}
              </h2>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 tabular-nums">
                {loading
                  ? 'Loading library…'
                  : favOnly
                    ? 'Songs you have saved'
                    : query
                      ? `${formatCount(totalResults)} results`
                      : `${formatCount(totalResults)} in library`}
              </p>
            </div>
            <Hairline className="hidden max-w-[280px] flex-1 sm:block" />
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[4/5] rounded-2xl bg-white/[0.04]" />
              ))}
            </div>
          ) : loadError ? (
            <div className="space-y-2 rounded-3xl border border-destructive/25 bg-destructive/[0.04] p-14 text-center">
              <p className="text-sm font-semibold text-white">Could not load the lyrics library</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{loadError}</p>
            </div>
          ) : pageResults.length ? (
            favOnly || isSongMode ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {(pageResults as LyricsSong[]).map(renderSongCard)}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
                {(pageResults as LyricsEntity[]).map(renderEntityCard)}
              </div>
            )
          ) : (
            <div className="space-y-2 rounded-3xl border border-white/[0.05] bg-white/[0.015] p-16 text-center">
              <p className="text-sm font-semibold text-white">
                {favOnly ? 'No favorites yet' : 'No results found'}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                {favOnly
                  ? 'Tap the star on any song to save it here.'
                  : 'Try a different search or clear your filters.'}
              </p>
            </div>
          )}

          {/* Pager */}
          {!loading && !loadError && pages > 1 && pageResults.length > 0 && (
            <div className="flex items-center justify-center gap-5 pt-4">
              <button
                type="button"
                onClick={() => goToPage(-1)}
                disabled={page <= 1}
                className="flex items-center gap-1.5 rounded-full border border-white/[0.07] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 transition-all hover:border-rose-500/30 hover:text-rose-300 disabled:opacity-30"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span className="font-mono text-[11px] tabular-nums text-zinc-500">
                {page} / {pages}
              </span>
              <button
                type="button"
                onClick={() => goToPage(1)}
                disabled={page >= pages}
                className="flex items-center gap-1.5 rounded-full border border-white/[0.07] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 transition-all hover:border-rose-500/30 hover:text-rose-300 disabled:opacity-30"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Lyrics modal */}
      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-2xl w-[94vw] max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0a0a0d] p-0 gap-0 text-white">
          {active && (
            <>
              <div className="relative">
                <div className="h-44 w-full overflow-hidden bg-zinc-900 md:h-56">
                  <Poster src={active.movie?.avatar} label={active.title} rounded="rounded-none" className="opacity-80" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                  <Kicker className="text-rose-300/70">Lyrics</Kicker>
                  <DialogTitle className="mt-1.5 text-2xl font-black tracking-[-0.03em] text-white md:text-3xl">
                    {active.title}
                  </DialogTitle>
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                    {[active.movie?.name, active.movie?.year].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>

              <div className="space-y-6 p-6 text-left md:p-8">
                <div className="flex flex-wrap gap-2">
                  {active.singers?.length ? (
                    <CreditChip label="Singer" value={active.singers.slice(0, 3).join(', ')} />
                  ) : null}
                  {active.lyricist?.length ? (
                    <CreditChip label="Lyrics" value={active.lyricist.slice(0, 2).join(', ')} />
                  ) : null}
                  {active.music_director?.length ? (
                    <CreditChip label="Music" value={active.music_director.slice(0, 2).join(', ')} />
                  ) : null}
                </div>

                <div className="relative space-y-3 border-l border-white/[0.08] pl-6">
                  <div className="absolute -left-px top-0 h-16 w-px bg-gradient-to-b from-rose-400 to-transparent" />
                  {active.lyrics
                    ? activeLines.map((line, index) => (
                        <p
                          key={index}
                          className="text-[15px] leading-[1.9] text-zinc-200 transition-colors hover:text-white"
                        >
                          {line}
                        </p>
                      ))
                    : <p className="text-sm italic text-zinc-500">No lyrics available.</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-5">
                  <button
                    type="button"
                    onClick={copyLyrics}
                    className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-300 transition-all hover:border-rose-500/40 hover:text-rose-300"
                  >
                    <Copy size={13} /> Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(active)}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-all',
                      isFavorite(active)
                        ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                        : 'border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:border-rose-500/40 hover:text-rose-300',
                    )}
                  >
                    <Star size={13} fill={isFavorite(active) ? 'currentColor' : 'none'} />
                    {isFavorite(active) ? 'Saved' : 'Save'}
                  </button>
                  {active.youtube_url && (
                    <a
                      href={active.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-300 transition-all hover:border-rose-500/40 hover:text-rose-300"
                    >
                      <Youtube size={13} /> YouTube
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSingOpen(true);
                      setSingIndex(0);
                    }}
                    disabled={!active.lyrics}
                    className="ml-auto flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-black transition-all hover:bg-rose-500 hover:text-white disabled:opacity-40"
                  >
                    <Play size={13} fill="currentColor" /> Sing along
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Sing along modal */}
      <Dialog
        open={singOpen}
        onOpenChange={(open) => setSingOpen(open)}
      >
        <DialogContent className="flex max-w-xl w-[94vw] max-h-[85vh] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0d] p-0 gap-0 text-white">
          {active && (
            <>
              <div className="border-b border-white/[0.06] p-6 text-left">
                <Kicker className="text-rose-300/70">Sing along</Kicker>
                <DialogTitle className="mt-1 text-lg font-bold tracking-tight text-white">
                  {active.title}
                </DialogTitle>
              </div>
              <div className="relative overflow-hidden px-6 py-10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,63,94,0.12),transparent_65%)]" />
                <p className="relative flex min-h-[4rem] items-center justify-center text-center text-2xl font-bold leading-snug tracking-tight text-white md:text-3xl">
                  {activeLines[singIndex] || '—'}
                </p>
              </div>
              <div className="flex-1 space-y-0.5 overflow-y-auto px-6 pb-4">
                {activeLines.map((line, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSingIndex(index)}
                    className={cn(
                      'block w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all duration-300',
                      index === singIndex
                        ? 'bg-white/[0.06] font-semibold text-white'
                        : index < singIndex
                          ? 'text-zinc-600 hover:bg-white/[0.02]'
                          : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200',
                    )}
                  >
                    {line}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] p-4">
                <button
                  type="button"
                  onClick={() => setSingIndex((index) => Math.max(0, index - 1))}
                  disabled={singIndex <= 0}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.08] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 transition-all hover:border-rose-500/30 hover:text-rose-300 disabled:opacity-30"
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                <span className="font-mono text-[11px] tabular-nums text-zinc-500">
                  {singIndex + 1} / {activeLines.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSingIndex((index) => Math.min(activeLines.length - 1, index + 1))
                  }
                  disabled={singIndex >= activeLines.length - 1}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.08] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 transition-all hover:border-rose-500/30 hover:text-rose-300 disabled:opacity-30"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Lyrics;
