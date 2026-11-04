"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import {
  TV_SOURCES,
  fetchTvRow,
  tamilChannels,
  type TvChannel,
  type TvRow,
} from '@/services/iptvApi';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Search,
  Play,
  ChevronLeft,
  ChevronRight,
  Tv,
  Info,
  Loader2,
  RefreshCw,
  Radio,
  X,
  Copy,
} from 'lucide-react';

const MAX_PER_ROW = 80;
const HLS_CDN = 'https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js';

type HlsInstance = {
  loadSource: (url: string) => void;
  attachMedia: (el: HTMLMediaElement) => void;
  on: (event: string, cb: (event?: unknown, data?: unknown) => void) => void;
  destroy: () => void;
};

type HlsCtor = {
  new (config?: { maxBufferLength?: number }): HlsInstance;
  isSupported: () => boolean;
  Events: { MANIFEST_PARSED: string; ERROR: string };
};

function getHls(): HlsCtor | undefined {
  return (window as unknown as { Hls?: HlsCtor }).Hls;
}

async function loadHlsScript(): Promise<HlsCtor | undefined> {
  if (getHls()) return getHls();
  await new Promise<void>((resolve) => {
    const existing = document.querySelector(`script[src="${HLS_CDN}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = HLS_CDN;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
  return getHls();
}

function flagFromCountry(code: string): string {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(
    ...code.split('').map((char) => 127397 + char.charCodeAt(0)),
  );
}

const SOURCE_TITLES = TV_SOURCES.map((source) => source.title);

/* ── Premium primitives ──────────────────────────────────────────────── */

const Kicker: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn('font-mono text-[10px] uppercase tracking-[0.35em]', className)}>{children}</span>
);

const Hairline: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent', className)} />
);

const LiveDot: React.FC<{ className?: string }> = ({ className }) => (
  <span className={cn('relative flex h-2 w-2', className)}>
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
  </span>
);

const ChannelArt: React.FC<{ channel: TvChannel; className?: string }> = ({ channel, className }) => {
  const [broken, setBroken] = useState(false);
  if (!channel.logo || broken) {
    return (
      <div
        className={cn(
          'w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-500/[0.07] via-zinc-900/60 to-zinc-950 font-black text-2xl tracking-tight text-sky-300/50',
          className,
        )}
      >
        {(channel.name || '?').charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={channel.logo}
      alt={channel.name}
      loading="lazy"
      onError={() => setBroken(true)}
      className={cn('max-h-[58%] max-w-[72%] object-contain drop-shadow-[0_6px_24px_rgba(0,0,0,0.7)]', className)}
    />
  );
};

const ChannelCard: React.FC<{ channel: TvChannel; onPlay: (channel: TvChannel) => void }> = ({
  channel,
  onPlay,
}) => (
  <button
    onClick={() => onPlay(channel)}
    className="group relative flex-shrink-0 w-[172px] sm:w-[196px] overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] text-left transition-all duration-500 hover:-translate-y-1 hover:border-sky-400/30 hover:bg-white/[0.04] hover:shadow-[0_24px_60px_-24px_rgba(56,189,248,0.25)]"
  >
    <div className="relative aspect-video overflow-hidden bg-zinc-950/90">
      <ChannelArt channel={channel} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-30" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_30px_rgba(255,255,255,0.25)]">
          <Play size={15} fill="currentColor" className="ml-0.5" />
        </span>
      </div>
      {channel.quality ? (
        <span className="absolute right-2 top-2 rounded-md border border-white/10 bg-black/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-sky-300/90 backdrop-blur">
          {channel.quality}
        </span>
      ) : null}
    </div>
    <div className="space-y-0.5 p-3">
      <p className="truncate text-[12px] font-semibold leading-tight tracking-tight text-zinc-100">{channel.name}</p>
      <p className="truncate font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600">
        {flagFromCountry(channel.country)} {channel.group || 'Live TV'}
      </p>
    </div>
  </button>
);

const Row: React.FC<{ row: TvRow; onPlay: (channel: TvChannel) => void }> = ({ row, onPlay }) => {
  const scroller = useRef<HTMLDivElement | null>(null);
  const channels = useMemo(
    () => [...row.channels].sort((a, b) => a.name.localeCompare(b.name)).slice(0, MAX_PER_ROW),
    [row.channels],
  );

  const scroll = (direction: 1 | -1) => {
    scroller.current?.scrollBy({ left: direction * 640, behavior: 'smooth' });
  };

  if (channels.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-baseline gap-3">
          <h2 className="truncate text-base font-bold tracking-[-0.02em] text-white sm:text-lg">
            {row.title}
          </h2>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-600 tabular-nums">
            {channels.length} live
          </span>
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <button
            onClick={() => scroll(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.07] text-zinc-500 transition-all hover:border-sky-400/40 hover:text-sky-300"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scroll(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.07] text-zinc-500 transition-all hover:border-sky-400/40 hover:text-sky-300"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        className="flex gap-3 overflow-x-auto px-0.5 pb-2 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {channels.map((channel) => (
          <ChannelCard key={`${channel.url}-${channel.id}`} channel={channel} onPlay={onPlay} />
        ))}
      </div>
    </section>
  );
};

const TV: React.FC = () => {
  const [rows, setRows] = useState<TvRow[]>([]);
  const [loadingCount, setLoadingCount] = useState(TV_SOURCES.length);
  const [failed, setFailed] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<TvChannel | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const hlsRef = useRef<HlsInstance | null>(null);
  const indiaRef = useRef<TvChannel[]>([]);

  useEffect(() => {
    let cancelled = false;
    setRows([]);
    setFailed([]);
    setLoadingCount(TV_SOURCES.length);
    indiaRef.current = [];

    const run = async () => {
      await Promise.all(
        TV_SOURCES.map(async (source) => {
          try {
            const row = await fetchTvRow(source);
            if (cancelled) return;
            if (source.id === 'india') {
              indiaRef.current = row.channels;
              const tamil = tamilChannels(row.channels);
              setRows((prev) => (tamil.length ? [...prev, { id: 'tamil', title: 'Tamil', channels: tamil }] : prev));
            }
            setRows((prev) => [...prev, row]);
          } catch {
            if (!cancelled) setFailed((prev) => [...prev, source.title]);
          } finally {
            if (!cancelled) setLoadingCount((prev) => prev - 1);
          }
        }),
      );
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const allChannels = useMemo(() => {
    const map = new Map<string, TvChannel>();
    for (const row of rows) {
      for (const channel of row.channels) {
        if (!map.has(channel.url)) map.set(channel.url, channel);
      }
    }
    return [...map.values()];
  }, [rows]);

  const featured = useMemo(() => {
    const pool = allChannels.filter((channel) => channel.logo);
    const priority = pool.find((channel) =>
      /sun|vijay|zee|star|sony|colors|bbc|cnn|ndtv|kalaignar|jaya/i.test(channel.name),
    );
    return priority || pool[0] || null;
  }, [allChannels]);

  const trimmedQuery = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!trimmedQuery) return [];
    return allChannels
      .filter((channel) =>
        `${channel.name} ${channel.group} ${channel.country}`.toLowerCase().includes(trimmedQuery),
      )
      .slice(0, 120);
  }, [allChannels, trimmedQuery]);

  const closePlayer = useCallback(() => {
    setActive(null);
    setPlayerError(null);
    setPlayerLoading(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    const video = videoEl;
    if (!video) return;

    setPlayerError(null);
    setPlayerLoading(true);

    if (active.url.startsWith('http://') && window.location.protocol === 'https:') {
      setPlayerError('This stream is served over insecure HTTP and is blocked on the secure site. Open the app on localhost or via HTTP to watch.');
      setPlayerLoading(false);
    }

    let disposed = false;
    const describe = (details: string) => {
      if (/cors|origin/i.test(details)) {
        return 'The channel does not allow browser playback (missing CORS headers). Copy the URL and use VLC or a mobile IPTV app.';
      }
      if (/geo|policy|redirect|authorized/i.test(details)) {
        return 'The channel refused the request — it is likely geo-restricted or offline.';
      }
      if (/manifest|segment|fragment|request|network/i.test(details)) {
        return 'The stream could not be fetched — the channel may be offline or temporarily unavailable.';
      }
      return 'The stream format could not be played in the browser.';
    };

    const start = async () => {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = active.url;
        video.play().catch(() => {});
        setPlayerLoading(false);
        return;
      }

      const Hls = await loadHlsScript();
      if (disposed) return;
      if (Hls && Hls.isSupported()) {
        if (hlsRef.current) hlsRef.current.destroy();
        const hls = new Hls({ maxBufferLength: 20 });
        hlsRef.current = hls;
        hls.loadSource(active.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (disposed) return;
          setPlayerLoading(false);
          video.play().catch(() => {
            video.muted = true;
            video.play().catch(() => {});
          });
        });
        hls.on(Hls.Events.ERROR, (event: unknown, data: { fatal?: boolean; type?: string; details?: string }) => {
          if (disposed || !data?.fatal) return;
          setPlayerError(describe(`${data.type || ''} ${data.details || ''}`));
          setPlayerLoading(false);
        });
      } else {
        video.src = active.url;
        video.play().catch(() => {});
        setPlayerLoading(false);
      }
    };

    start();

    return () => {
      disposed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [active, videoEl]);

  const isLoading = loadingCount > 0;

  return (
    <MainLayout>
      <div className="relative min-h-screen bg-[#08080b] pb-24">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden border-b border-white/[0.05]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[-420px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-sky-500/[0.12] blur-[140px]" />
            <div className="absolute right-[-140px] top-[-160px] h-[380px] w-[380px] rounded-full bg-indigo-600/10 blur-[120px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 md:pt-24 md:pb-20">
            <div className="flex items-center gap-3">
              <LiveDot />
              <Kicker className="text-sky-300/90">Live Television</Kicker>
            </div>

            <h1 className="mt-4 max-w-2xl text-5xl font-black leading-[0.95] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl">
              The world,
              <br />
              <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-indigo-300 bg-clip-text italic text-transparent">
                on channel one.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-sm font-medium leading-relaxed text-zinc-400">
              Thousands of free channels from around the world — news, movies, music, sports and
              more, streaming instantly.
            </p>

            {/* Featured channel — premium glass card */}
            {featured ? (
              <button
                onClick={() => setActive(featured)}
                className="group relative mt-10 flex w-full max-w-lg items-center gap-5 overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-transparent p-4 pr-6 text-left backdrop-blur-xl transition-all duration-500 hover:border-sky-400/30 hover:shadow-[0_24px_60px_-24px_rgba(56,189,248,0.3)]"
              >
                <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-sky-500/10 blur-[60px]" />
                <div className="relative h-[76px] w-[132px] shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950">
                  <ChannelArt channel={featured} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <Play size={20} fill="currentColor" className="text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <LiveDot />
                    <Kicker className="text-sky-300/80">Featured now</Kicker>
                  </div>
                  <p className="mt-1 truncate text-base font-bold tracking-tight text-white">
                    {featured.name}
                  </p>
                  <p className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    {flagFromCountry(featured.country)} {featured.group || 'Live TV'}
                  </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black transition-all duration-500 group-hover:scale-110 group-hover:bg-sky-400 group-hover:text-white">
                  <Play size={16} fill="currentColor" className="ml-0.5" />
                </span>
              </button>
            ) : (
              <Skeleton className="mt-10 h-[108px] w-full max-w-lg rounded-3xl bg-white/[0.04]" />
            )}

            {/* Search */}
            <div className="group relative mt-10 max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-sky-300"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search channels, genres or countries…"
                className="h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] pl-12 pr-11 text-sm font-medium text-white outline-none backdrop-blur-xl transition-all duration-300 placeholder:text-zinc-600 focus:border-sky-400/40 focus:bg-white/[0.05] focus:shadow-[0_0_0_1px_rgba(56,189,248,0.2),0_16px_50px_-16px_rgba(56,189,248,0.3)]"
              />
              {query ? (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-white"
                >
                  <X size={15} />
                </button>
              ) : null}
            </div>

            <div className="mt-6 flex max-w-2xl items-start gap-2.5">
              <Info size={13} className="mt-0.5 shrink-0 text-sky-400/60" />
              <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.15em] text-zinc-600">
                Sourced live from iptv-org · some streams are offline, geo-blocked, or HTTP-only
              </p>
            </div>
          </div>
          <Hairline className="opacity-60" />
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="relative z-10 mx-auto max-w-6xl space-y-11 px-4 py-12 sm:px-6">
          {trimmedQuery ? (
            <section className="space-y-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black tracking-[-0.03em] text-white md:text-3xl">Results</h2>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 tabular-nums">
                    {searchResults.length} channels found
                  </p>
                </div>
                <Hairline className="hidden max-w-[280px] flex-1 sm:block" />
              </div>
              {searchResults.length === 0 ? (
                <div className="space-y-3 rounded-3xl border border-white/[0.05] bg-white/[0.015] py-20 text-center">
                  <Radio size={26} className="mx-auto text-zinc-700" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                    {isLoading ? 'Still loading channels…' : 'No channels match your search'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {searchResults.map((channel) => (
                    <ChannelCard key={`${channel.url}-${channel.id}`} channel={channel} onPlay={setActive} />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
              {rows.map((row) => (
                <Row key={row.id} row={row} onPlay={setActive} />
              ))}

              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-5 w-36 bg-white/[0.04]" />
                  <div className="flex gap-3 overflow-hidden">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="h-[152px] w-[190px] shrink-0 rounded-2xl bg-white/[0.04]" />
                    ))}
                  </div>
                </div>
              ) : null}

              {!isLoading && rows.length === 0 ? (
                <div className="space-y-5 rounded-3xl border border-white/[0.05] bg-white/[0.015] py-24 text-center">
                  <Tv size={30} className="mx-auto text-zinc-700" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                    Could not load channels
                  </p>
                  <button
                    onClick={() => setReloadKey((key) => key + 1)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-black transition-all hover:bg-sky-400 hover:text-white"
                  >
                    <RefreshCw size={13} /> Retry
                  </button>
                </div>
              ) : null}

              {!isLoading && failed.length > 0 ? (
                <p className="text-center font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-700">
                  Unavailable: {failed.join(', ')}
                </p>
              ) : null}

              {!isLoading && allChannels.length > 0 ? (
                <>
                  <Hairline className="opacity-40" />
                  <p className="text-center font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-700 tabular-nums">
                    {allChannels.length} channels · {rows.length} categories · iptv-org
                  </p>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* ── Player ─────────────────────────────────────────────────────── */}
      <Dialog open={!!active} onOpenChange={(open) => { if (!open) closePlayer(); }}>
        <DialogContent className="max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0d] p-0 gap-0">
          <DialogTitle className="sr-only">{active ? active.name : 'Live TV'}</DialogTitle>
          <div className="relative aspect-video w-full bg-black">
            {active ? (
              <video
                ref={setVideoEl}
                className="h-full w-full bg-black object-contain"
                controls
                autoPlay
                playsInline
              />
            ) : null}

            {playerLoading && !playerError ? (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
                <Loader2 className="animate-spin text-sky-300" size={26} />
                <Kicker className="text-zinc-400">Tuning in</Kicker>
              </div>
            ) : null}

            {playerError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 px-10 text-center">
                <Tv size={28} className="text-zinc-700" />
                <p className="max-w-sm font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-zinc-400">
                  {playerError}
                </p>
              </div>
            ) : null}

            {active && !playerError ? (
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-md">
                <LiveDot />
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/90">Live</span>
              </div>
            ) : null}
          </div>

          {active ? (
            <div className="flex items-center gap-4 border-t border-white/[0.06] bg-white/[0.02] px-5 py-4">
              <div className="h-10 w-[68px] shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-zinc-950">
                <ChannelArt channel={active} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold tracking-tight text-white">{active.name}</p>
                <p className="truncate font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
                  {flagFromCountry(active.country)} {active.group || 'Live TV'}
                </p>
              </div>
              <span className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-700 md:inline">
                VLC / IPTV for fails
              </span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(active.url);
                  toast.success('Stream URL copied');
                }}
                className="flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-300 transition-all hover:border-sky-400/40 hover:text-sky-300"
              >
                <Copy size={12} /> Copy URL
              </button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default TV;
