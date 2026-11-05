"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Movie } from '@/context/MusicContext';
import { RefreshCw, ExternalLink, Play, Pause, Volume2, VolumeX, Maximize, Sliders, ChevronDown, Sparkles, AlertCircle, Loader2, Video, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { buildNetmirrorPlayerUrl, resolveNetmirrorStream, searchNetmirrorFamily } from '@/lib/netmirror';
import { EMBED_PROXY_BASE } from '@/lib/embedProxy';

interface StreamPlayerProps {
  movie: Movie;
}

interface StreamSource {
  name: string;
  url: string;
  type: 'mp4' | 'hls' | 'embed';
  params?: string;
  quality?: string;
  // When true, the iframe runs sandboxed (popups/redirects blocked). Only set
  // for worker-proxied (ad-stripped) sources — the provider's sandbox
  // detectors are already neutralised by GENERIC_PATCHES. Direct sources stay
  // unsandboxed because vidfast/vidlink/vidsrc detect sandbox and black-screen.
  sandbox?: boolean;
}

interface VylaSubtitle {
  label: string;
  file: string;
  type: string;
}

const DEMO_SOURCES: StreamSource[] = [
  {
    name: "Vyla (1080p Demo)",
    url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    type: "hls",
    quality: "1080p (Demo)"
  },
  {
    name: "Vyla (720p Demo)",
    url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    type: "hls",
    quality: "720p (Demo)"
  }
];

// (Direct upstream origins are resolved per-source in fetchStreamSources via
// DIRECT_ORIGINS — verified live endpoints only.)

export const StreamPlayer: React.FC<StreamPlayerProps> = ({ movie }) => {
  const [key, setKey] = useState(0);
  const [isTv, setIsTv] = useState(false);
  const [season, setSeason] = useState<number>(1);
  const [episode, setEpisode] = useState<number>(1);

  const [availableSources, setAvailableSources] = useState<StreamSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<StreamSource | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [subtitles, setSubtitles] = useState<VylaSubtitle[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsInstanceRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const genreStr = movie.genre?.toLowerCase() || '';
    const titleLower = movie.title?.toLowerCase() || '';
    // Enhanced TV detection
    setIsTv(genreStr.includes('tv') || genreStr.includes('series') || movie.id.startsWith('tv-') || movie.genre === 'TV Series');
  }, [movie]);

  const isDirectMediaUrl = (url: string): boolean => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    // Accept direct media extensions (.mp4, .m3u8) and extension-less signed
    // URLs (e.g. https://cdn.example.com/abc123/def456 — no extension but
    // plays as video). Any http(s) URL that is not a .php page is treated as
    // a potential direct stream; Vyla's Hexa source returns .m3u8 (verified
    // 2026-11-04: application/x-mpegurl, 3 qualities, MPEG-TS segments).
    if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.m3u8')) return true;
    if (url.toLowerCase().includes('.m3u8') || url.toLowerCase().includes('.mp4')) return true;
    // Extension-less direct URLs from stream resolvers
    if (url.startsWith('http') && !cleanUrl.endsWith('.php') && !cleanUrl.endsWith('.html')) return true;
    return false;
  };

  const fetchStreamSources = async () => {
    setLoadingSource(true);
    setSourceError(null);
    setAvailableSources([]);
    setSelectedSource(null);
    setIsDemoMode(false);

    // Primary logic: construct all requested endpoints.
    // Verified live as of 2026-10-31 (parallel endpoint sweep, TMDB 550 / 1399).
    // Embeds route through the embed-proxy Cloudflare Worker
    // (cloudflare/embed-proxy), which serves the provider pages with their ad
    // loaders byte-patched out. Providers behind a Cloudflare challenge cannot
    // be proxied server-side, so they ship direct-only.
    // EMBED_PROXY_BASE is shared with src/lib/netmirror.ts (src/lib/embedProxy.ts).

    const EMBED_PROVIDERS: {
      name: string;
      id: string;
      quality: string;
      proxy: boolean;
      // Providers whose URL is derived asynchronously (signed player links).
      build?: (id: string, isTv: boolean, s: number, e: number) => Promise<string | null>;
      movie: (id: string) => string;
      tv: (id: string, s: number, e: number) => string;
    }[] = [
      // ORDER MATTERS: the first entry that yields a URL is selected by
      // default. Verified ad-free in-app on 2026-11-04: NetMirror (signed
      // player through the worker, no ad stack), VidSrc, VidCore.
      //
      // NetMirror (netmirror.plus + net77.cc family): the catalog shell sends
      // x-frame-options: SAMEORIGIN and 403s proxy egress, so it can never be
      // used. The signed player page (webvp.watch21.shop/play/external.php)
      // has no frame headers but enforces a Referer allowlist, so it is served
      // through the worker's `netmirror-player` route (src/lib/netmirror.ts).
      // The signature is computed client-side from their published key.
      // Regional fallback: netmirror.plus catalog (regional country/dubbing
      // rails + tm_id cross-ref) so the 4 ad-bearing sources' content is still
      // reachable ad-free through NetMirror's regional library.
      // Evidence: docs/netmirror-family-api.md, docs/net77-api.md.
      { name: "NetMirror", id: "netmirror", quality: "Ultra", proxy: true,
        movie: (id) => id, tv: (id) => id,
        build: async (id: string, tv: boolean, s: number, e: number): Promise<string | null> => {
          const url = await resolveNetmirrorStream(id, movie.title || "", tv, s, e);
          if (url) return url;
          // net77.cc family endpoint (regional content via portal-numeric ids).
          const fam = await searchNetmirrorFamily(`${movie.title || ""}`, tv ? { type: "2" } : {});
          for (const it of fam) {
            const viaId = String(it?.tm_id || it?.id || "");
            if (!viaId) continue;
            const via = await buildNetmirrorPlayerUrl(viaId, tv, s, e);
            if (via) return via;
          }
          return null;
        } },
      // VidLink (vidlink.pro): was direct-only (ad-bearing). Its proxied route
      // is now clean — worker serves HTTP 200 with the neutralizer + stream
      // CDN rewrite (surge.flooderrr.store via /r/), verified 2026-11-04.
      { name: "VidLink",  id: "vidlink",     quality: "Ultra",    proxy: true,  movie: (id) => `movie/${id}`,                tv: (id, s, e) => `tv/${id}/${s}/${e}` },
      { name: "VidSrc",   id: "vidsrc",      quality: "High",     proxy: true,  movie: (id) => `embed/movie/${id}`,          tv: (id, s, e) => `embed/tv/${id}/${s}/${e}` },
      { name: "VidCore",  id: "vidcore",     quality: "Fast",     proxy: true,  movie: (id) => `embed/movie/${id}`,          tv: (id, s, e) => `embed/tv/${id}/${s}/${e}` },
      // NXSHA: proxied, not direct. Direct pops an ad tab on Play (verified
      // 2026-11-04: the tab closed itself); the proxied frame plays and its ad
      // scripts are CSP-blocked. Its in-player sponsor strip remains - that is
      // drawn by their player, not injectable from here.
      { name: "NXSHA",    id: "nxsha",       quality: "Ultra",    proxy: true,  movie: (id) => `embed/movie/${id}`,          tv: (id, s, e) => `embed/tv/${id}/${s}/${e}` },
      { name: "VidSrc.rip", id: "vidsrc-rip", quality: "High",    proxy: true,  movie: (id) => `embed/movie/${id}`,          tv: (id, s, e) => `embed/tv/${id}/${s}/${e}` },
      { name: "CineSrc",  id: "cinesrc",     quality: "Ad-Lite",  proxy: true,  movie: (id) => `embed/movie/${id}`,          tv: (id, s, e) => `embed/tv/${id}?season=${s}&episode=${e}` },
      { name: "VidLux",   id: "vidlux",      quality: "Custom",   proxy: true,  movie: (id) => `embed/movie/${id}`,          tv: (id, s, e) => `embed/tv/${id}/${s}/${e}` },
      { name: "VidNest",  id: "vidnest",     quality: "High",     proxy: true,  movie: (id) => `movie/${id}`,                tv: (id, s, e) => `tv/${id}/${s}/${e}` },
      { name: "VidRock",  id: "vidrock",     quality: "High",     proxy: true,  movie: (id) => `movie/${id}`,                tv: (id, s, e) => `tv/${id}/${s}/${e}` },
      { name: "VidZen",   id: "vidzen",      quality: "High",     proxy: true,  movie: (id) => `movie/${id}`,                tv: (id, s, e) => `tv/${id}/${s}/${e}` },
      { name: "VidFlix",  id: "vidflix",     quality: "Fast",     proxy: true,  movie: (id) => `movie/${id}`,                tv: (id, s, e) => `tv/${id}/${s}/${e}` },
      { name: "2embed",   id: "2embed",      quality: "Backup",   proxy: true,  movie: (id) => `embed/${id}`,                tv: (id, s, e) => `embedtv/${id}?s=${s}&e=${e}` },
      { name: "AeonWatch", id: "thisiscinema", quality: "Backup", proxy: true,  movie: (id) => `embed/movie/${id}`,          tv: (id, s, e) => `embed/tv/${id}/${s}/${e}` },
      // Everything below is a RAW provider page: no worker in front of it, so
      // the provider's own ad stack and popunders run untouched. They are
      // listed last and labelled "Direct · ads" so they are a deliberate
      // fallback, never the default.
      // VidFast/VidUP: Cloudflare 403s the worker's datacenter fetches
      // (verified 2026-10-31) — browser-direct only.
      { name: "VidFast",  id: "vidfast",     quality: "Ultra",    proxy: false, movie: (id) => `movie/${id}`,                tv: (id, s, e) => `tv/${id}/${s}/${e}` },
      { name: "VidUP",    id: "vidup",       quality: "High",     proxy: false, movie: (id) => `movie/${id}`,                tv: (id, s, e) => `tv/${id}/${s}/${e}` },
      // Cloudflare-challenged for server fetches — direct only (browser passes).
      { name: "MultiEmbed", id: "multiembed", quality: "Direct",  proxy: false, movie: (id) => `?video_id=${id}&tmdb=1`,     tv: (id, s, e) => `?video_id=${id}&s=${s}&e=${e}&tmdb=1` },
      { name: "VixSrc",   id: "vixsrc",      quality: "Direct",   proxy: false, movie: (id) => `movie/${id}`,                tv: (id, s, e) => `tv/${id}/${s}/${e}` },
    ];

    const DIRECT_ORIGINS: Record<string, string> = {
      vidlink: "https://vidlink.pro",
      nxsha: "https://nxsha.space",
      vidfast: "https://vidfast.vc",
      vidsync: "https://vidsync.pro",
      vidsrc: "https://vidsrc.su",
      "vidsrc-rip": "https://vidsrc.rip",
      vidcore: "https://www.vidcore.org",
      cinesrc: "https://cinesrc.st",
      vidlux: "https://vidlux.xyz",
      vidnest: "https://vidnest.fun",
      vidrock: "https://vidrock.net",
      vidup: "https://vidup.to",
      vidzen: "https://vidzen.fun",
      vidflix: "https://vidflix.club",
      "2embed": "https://www.2embed.cc",
      vixsrc: "https://vixsrc.to",
    };

    // Two groups. `cleanSources` are served through the worker (ads stripped,
    // popups blocked) or are the NetMirror signed player; they come first and
    // the first one is auto-selected. `adSources` are raw provider pages that
    // run their own ad stack; they are appended last and labelled, so choosing
    // one is deliberate. Evidence: docs/netmirror-family-api.md and the
    // 2026-11-04 provider sweep.
    const cleanSources: StreamSource[] = [];
    const adSources: StreamSource[] = [];

    for (const p of EMBED_PROVIDERS) {
      if (p.build) {
        const url = await p.build(movie.id, isTv, season, episode);
        if (url) {
          cleanSources.push({
            name: `${p.name} (Ad-Free)`,
            url,
            type: "embed",
            quality: p.quality,
            sandbox: true,
          });
        }
        continue;
      }

      const path = isTv ? p.tv(movie.id, season, episode) : p.movie(movie.id);
      const directUrl = `${DIRECT_ORIGINS[p.id]}/${path}`;
      if (p.proxy) {
        // Clean mode: the HTML document is served at the provider's ORIGINAL
        // path (so client-side routers mount correctly) with the provider
        // identity carried in __via. Sub-resources are rewritten by the
        // worker to /{provider}/... prefix-mode routes.
        const [pPath, pQuery] = path.split("?");
        const params = new URLSearchParams(pQuery || "");
        params.set("__via", p.id);
        cleanSources.push({
          name: `${p.name} (Ad-Free)`,
          url: `${EMBED_PROXY_BASE}/${pPath}?${params.toString()}`,
          type: "embed",
          quality: `${p.quality} · Stripped`,
          sandbox: true,
        });
        // NOTE: direct fallback REMOVED for proxied providers — the proxied
        // (Ad-Free) version is always available and ad-stripped. Keeping a
        // (Direct · ads) fallback would just tempt users into an ad-bearing
        // source. The 5 direct-only providers (VidLink, VidFast, VidUP,
        // MultiEmbed, VixSrc) still get a direct entry below because they
        // cannot be proxied (Cloudflare blocks / IP-bound CDNs).
      } else {
        adSources.push({
          name: `${p.name} (Direct · ads)`,
          url: directUrl,
          type: "embed",
          quality: p.quality,
          sandbox: false,
        });
      }
    }

    const embedSources = [...cleanSources, ...adSources];

    const directStreams: StreamSource[] = [];

    // PRIMARY C: direct stream resolution via Vyla (ad-free by design — no
    // provider page ever loads, so no provider ads can exist). The Cloudflare
    // Worker /resolve route (cloudflare/embed-proxy) proxies Vyla's HF Space
    // and returns clean JSON. Only fall back to iframe embeds if direct
    // resolution returns nothing.
    try {
      const type = isTv ? 'tv' : 'movie';
      const resolveUrl = `${EMBED_PROXY_BASE}/resolve?id=${encodeURIComponent(movie.id)}&type=${type}${isTv ? `&s=${season}&e=${episode}` : ''}`;

      const response = await fetch(resolveUrl);

      if (response.ok) {
        const data = await response.json();
        for (const src of (data.sources || [])) {
          if (src.url && isDirectMediaUrl(src.url)) {
            const isHls = src.url.split('?')[0].toLowerCase().includes('.m3u8');
            directStreams.push({
              name: `Vyla (${src.label || 'Direct'})`,
              url: src.url,
              type: isHls ? 'hls' : 'mp4',
              quality: src.label || 'Direct',
            });
          }
        }
      }

      if (directStreams.length > 0) {
        // Vyla direct streams available — ad-free. Embeds appended as labelled
        // fallbacks (never auto-selected when a direct stream exists).
        setAvailableSources([...directStreams, ...embedSources]);
        setSelectedSource(directStreams[0]);
      } else {
        // No direct stream — fall back to ad-stripped embeds.
        setAvailableSources(embedSources);
        setSelectedSource(embedSources[0] || null);
      }

    } catch (error: any) {
      console.warn("Direct stream resolution failed, defaulting to embed nodes.");
      setAvailableSources(embedSources);
      if (!selectedSource) setSelectedSource(embedSources[0] || null);
    } finally {
      setLoadingSource(false);
    }
  };

  useEffect(() => {
    fetchStreamSources();
  }, [movie.id, isTv, season, episode, key]);

  const handleActivateDemoMode = () => {
    setSourceError(null);
    setIsDemoMode(true);
    setAvailableSources(DEMO_SOURCES);
    setSelectedSource(DEMO_SOURCES[0]);
    toast.success("Demo stream connected!");
  };

  useEffect(() => {
    if (!selectedSource || selectedSource.type === 'embed' || !videoRef.current) return;

    const video = videoRef.current;
    const streamUrl = selectedSource.url;
    const isHls = selectedSource.type === 'hls';

    if (!isHls) {
      if (hlsInstanceRef.current) { hlsInstanceRef.current.destroy(); hlsInstanceRef.current = null; }
      video.src = streamUrl;
      video.load();
      video.play().catch(() => {});
      setIsPlaying(true);
      return;
    }

    const loadHls = async () => {
      if (!(window as any).Hls) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      const Hls = (window as any).Hls;
      if (Hls.isSupported()) {
        if (hlsInstanceRef.current) hlsInstanceRef.current.destroy();
        const hls = new Hls();
        hlsInstanceRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); setIsPlaying(true); });
      }
    };
    loadHls();

    return () => { if (hlsInstanceRef.current) { hlsInstanceRef.current.destroy(); hlsInstanceRef.current = null; } };
  }, [selectedSource]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Provider embeds play in a cross-origin iframe. Per-source sandbox policy:
  // worker-proxied sources run sandboxed (allow-scripts allow-same-origin
  // allow-forms allow-modals allow-presentation) with the sandbox detectors
  // neutralised by the worker's GENERIC_PATCHES; direct raw pages stay
  // unsandboxed (vidlink/vidfast/vidsrc detect a sandboxed frame and refuse to
  // start — "Please Disable Sandbox"). The referrer policy sends only the
  // origin (localhost), which providers that allowlist localhost still accept.
  return (
    <div className="flex flex-col w-full bg-zinc-950 rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative w-full aspect-video bg-black group select-none overflow-hidden flex items-center justify-center"
      >
        {loadingSource ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-pink-500 w-10 h-10" />
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Syncing with Node...</p>
          </div>
        ) : selectedSource?.type === 'embed' ? (
          <iframe
            src={selectedSource.url}
            className="w-full h-full border-none"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
            referrerPolicy="strict-origin-when-cross-origin"
            {...(selectedSource.sandbox ? {
              sandbox: "allow-scripts allow-same-origin allow-forms allow-modals allow-presentation",
            } : {})}
          />
        ) : selectedSource ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              onClick={() => isPlaying ? videoRef.current?.pause() : videoRef.current?.play()}
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
              onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              className="w-full h-full object-contain"
              playsInline
            />

            <div className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 flex flex-col justify-between p-4 md:p-6 transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <span className={cn(
                    "text-[10px] tracking-[0.2em] font-black uppercase px-3 py-1 rounded-full border border-pink-500/20",
                    isDemoMode ? "text-cyan-400 bg-cyan-500/10" : "text-pink-500 bg-pink-500/10"
                  )}>
                    {isDemoMode ? "Direct Demo Simulator" : `${selectedSource.name}`}
                  </span>
                  <h3 className="text-sm md:text-base font-black truncate max-w-sm mt-1">{movie.title}</h3>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <button 
                  onClick={() => { isPlaying ? videoRef.current?.pause() : videoRef.current?.play(); setIsPlaying(!isPlaying); }}
                  className="w-16 h-16 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-2xl pointer-events-auto"
                >
                  {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-zinc-400 w-10 text-right">{formatTime(currentTime)}</span>
                  <Slider value={[currentTime]} max={duration || 100} step={1} onValueChange={([v]) => { if (videoRef.current) videoRef.current.currentTime = v; }} className="flex-1 cursor-pointer" />
                  <span className="text-[10px] font-bold text-zinc-400 w-10">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <button onClick={() => { isPlaying ? videoRef.current?.pause() : videoRef.current?.play(); setIsPlaying(!isPlaying); }} className="text-zinc-300 hover:text-white"><Pause size={20} /></button>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { if (videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); } }} className="text-zinc-300 hover:text-white">{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
                      <Slider value={[isMuted ? 0 : volume * 100]} max={100} onValueChange={([v]) => { setVolume(v / 100); if (videoRef.current) videoRef.current.volume = v / 100; }} className="w-20 hidden md:block" />
                    </div>
                  </div>
                  <button onClick={() => containerRef.current?.requestFullscreen()} className="text-zinc-300 hover:text-white"><Maximize size={18} /></button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 space-y-4">
             <AlertCircle className="mx-auto text-zinc-600" />
             <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">No Sources Loaded</p>
             <button onClick={() => setKey(k => k + 1)} className="text-pink-500 text-[10px] font-black uppercase">Refresh Stream</button>
          </div>
        )}

        {isTv && (
          <div className="absolute top-3 left-3 flex gap-1.5 bg-black/85 backdrop-blur-md p-1.5 rounded-xl border border-white/10 z-20">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider px-1">S</span>
              <select value={season} onChange={(e) => setSeason(parseInt(e.target.value, 10))} className="bg-zinc-900 text-white font-bold text-[10px] rounded px-1.5 py-0.5 border border-white/10 outline-none">
                {Array.from({ length: 15 }).map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider px-1">E</span>
              <select value={episode} onChange={(e) => setEpisode(parseInt(e.target.value, 10))} className="bg-zinc-900 text-white font-bold text-[10px] rounded px-1.5 py-0.5 border border-white/10 outline-none">
                {Array.from({ length: 50 }).map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 bg-zinc-900/90 border-t border-white/5 flex flex-col gap-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5 text-left">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Stream Connection Manager</span>
            <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Selected Server: <span className="text-pink-500 font-black uppercase">{selectedSource?.name || "Auto"}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setKey(k => k + 1)} className="p-2.5 rounded-xl bg-white/5 hover:bg-pink-600 transition-all border border-white/5 text-zinc-300"><RefreshCw size={14} /></button>
            <button onClick={handleActivateDemoMode} className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest">Demo</button>
          </div>
        </div>

        {availableSources.length > 0 && (
          <div className="space-y-2 text-left pt-2 border-t border-white/5">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Available Nodes</p>
            <div className="flex flex-wrap gap-2">
              {availableSources.map((source) => (
                <button
                  key={source.url}
                  onClick={() => setSelectedSource(source)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                    selectedSource?.url === source.url ? "bg-pink-600 border-pink-500 text-white shadow-pink-600/20" : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {source.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};