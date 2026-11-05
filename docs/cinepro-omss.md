# CinePro (OMSS) — self-hosted stream architecture for isai

You asked to "add this arch": CinePro Core (github.com/cinepro-org/core) is an
**OMSS-compliant self-hosted streaming backend**. Instead of iframing embed
sites (your 22+ providers), it scrapes upstream providers and returns
**playable** m3u8/mp4 URLs over a clean REST API — no ads, no cookies, no
provider pages, hls.js-native. Cloned to `D:\Murugan\cinepro-core`.

## Architecture

```
isai app ──GET /v1/movies/{tmdb} / /v1/tv/{tmdb}/seasons/{s}/episodes/{e}──▶ CinePro Core
   │                                                                        │
   │  SourceResponse { sources:[{url (playable), quality, audio,            │
   │                             subtitles, provider…}] }                   │
   ▼                                                                        │
StreamPlayer (hls.js direct playback, zero iframes)                          │
                                      CinePro scrapes 17 providers ─────────┘
```

- Spec: **OMSS v1.1.0** (github.com/omss-spec/omss-spec)
- Framework: `@omss/framework` (`OMSSServer`) — routes/cache/CORS/health built-in
- Providers shipped (src/providers/): 02moviedownloader, anyembed, cinesu,
  fmovies4u, fshare, icefy, peachify, popr, streammafia, tulnex, vidapi,
  videasy, vidnest, vidrock, vidsrc, vixsrc, vidzee
- Extras: Stremio addon (`/stremio/manifest.json` when STREMIO_ADDON=true),
  MCP for AI agents (MCP_ENABLED=true), Redis or memory cache, Docker,
  **deployable to Cloudflare Workers (wrangler.json) or Vercel (vercel.json)**
  — same platform as your embed-proxy worker.

## Endpoints (OMSS v1.1)

```http
GET /v1/movies/{tmdbId}?platform=native&provider=<provider_id>
GET /v1/tv/{tmdbId}/seasons/{s}/episodes/{e}?filter=quality==4K;
POST /v1/refresh/{tmdbId}          # cache invalidation
GET /v1                            # health check
GET /stremio/manifest.json         # optional Stremio addon
```

Response envelope: `{ id, expiresAt, sources:[{ id, url, … }] }` with
standardized error codes (machine-readable, trace IDs). `platform=native`
returns sources playable in your app directly; the server proxies
non-playable hosts itself (that's what `streamPatterns.ts` regexes select).

## Run it (local)

```powershell
cd D:\Murugan\cinepro-core
copy .env.example .env        # set TMDB_API_KEY (your existing key works)
npm install
npm run dev                   # http://localhost:3000
```

Cloudflare Workers deploy:

```powershell
cd D:\Murugan\cinepro-core
npx wrangler deploy           # uses wrangler.json + TMDB_API_KEY as a secret
```

## isai integration (already wired)

`src/components/StreamPlayer.tsx` now has a resolver stage **CinePro (OMSS) →
Vyla → embeds**:

- Set the backend once, in Settings or console:
  `localStorage.setItem('omss_url', 'http://localhost:3000')`
- `fetchStreamSources()` then calls
  `GET {omss_url}/v1/movies/{id}` (movies) or
  `GET {omss_url}/v1/tv/{id}/seasons/{s}/episodes/{e}` (TV)
- Each playable `sources[].url` becomes a native `hls`/`mp4` source named
  `CinePro ({provider}) · OMSS`, placed **before** Vyla and embed sources;
  the first direct source is auto-selected.
- If the backend is down/unreachable the app silently falls back to
  Vyla/embeds — no hard dependency.

Note: for MP playback cross-origin matters — run with `CORS_ORIGIN="*"`
(default) or your app origin; if serving over LAN, set `HOST=0.0.0.0`.

## Verified round-trip (2026-11-05, local run `npm run dev`, TMDB key in .env)

- `GET http://localhost:3000/v1` → `{"name":"CinePro","status":"operational",
  "spec":"omss","note":"Running with 14 provider(s): CineSu, FshareTV, Icefy,
  Peachify, Popr, MafiaEmbed, Tulnex, VidApi, Videasy, VidNest, VidRock,
  VidSrc, VidZee, VixSrc"}` (a curl-requests *without* a UA string hit an
  upstream/edge 403 "Automated scraping is prohibited" once before the server
  finished booting — retry with a normal UA).
- `GET /v1/movies/550` → 3 sources, provider **VidApi**, `type:"hls"`,
  quality `1080p`, `audioTracks:[{label:"Original"}]`,
  url `http://localhost:3000/v1/proxy?data=…` (upstream URL + required
  Referer/Origin/User-Agent bundled into the `data` blob).
- That proxy URL → 200, `content-type: application/vnd.apple.mpegurl`,
  `access-control-allow-origin: *`, real master manifest with 3 variants
  (640x266 / 1280x534 / 1920x800); sub-playlists self-reference `/v1/proxy?…`
  relative paths (hls.js resolves against the playlist base automatically).
- `GET /v1/tv/1396/seasons/1/episodes/1` → same shape, 3× VidApi 1080p HLS,
  manifest 200 (640/1280 variants), headers proxying intact.
- First called resolve takes ~20–40 s (live scrape); the 1 h sources cache
  (`CACHE_TYPE`, ttl) makes repeats instant.
