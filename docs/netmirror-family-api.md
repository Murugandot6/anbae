# NetMirror Movie API (netmirror.plus)

Reverse-engineered with REA (static bundle analysis + live runtime observation,
2026-11-03). **Note:** net77.cc is a *different* app — a Netflix-UI clone portal
with its own PHP backends (see `net77-api.md`). Only its challenge page is
titled "Verification I'm Human - NetMirror"; it does **not** call any of the
APIs below. The backends below belong to the netmirror.plus family and respond
200 to any Origin (CORS echoes the caller's Origin).

## 1. Catalog / metadata API — `api2.imdb3.shop` (Drupal 10, Cloudflare)

All list/detail responses share one envelope:

```json
{ "filters": [...], "pager": { "current_page": 0, "items_per_page": 30,
  "total_pages": 1, "total_results": 1 }, "results": [...], "sorters": [],
  "system": { "page_key": "page" } }
```

Result item:

```json
{ "title": "...", "id": "126503",            // NetMirror's OWN catalog id (not TMDB)
  "backdrop_path": "https://pacdn.aoneroom.com/image/...",
  "release_date": "Oct 30,2026", "media_type": "movie|tv",
  "vote_average": "7.2", "cn": "United States",
  "genre": ["13","14"], "duration": "5280",
  "season": [ { "se": 1, "ep": 6, "allEp": "" } ],   // tv only
  " dp": "<base64 AES blob>", "tm_id": "1458099",    // detail only - TMDB id + player token
  "trailer": "https://macdn.aoneroom.com/media/....mp4",
  "embed_json": null  }
```

Endpoints (page0 = 0-based):

| Call | Purpose |
|---|---|
| `GET /api/tranding?page=0&id=<rail>&items_per_page=14` | curated "trending" rails (id 11/12/14/15) |
| `GET /api/movies/filter?page=0&dubbing=Tamil&items_per_page=7` | home rails; params: `country=`, `countryNotParam=`, `dubbing=`, `sort_by=date|created`, `type=2` (tv), `title_not[]=`, `title_con[]=`, `cn_multi[]=` |
| Same paths + `/list/` -> `/api/movies/list/filter`, `/api/tranding/list` | grid view variant of the same query |
| `GET /api/movie/{id}` | movie detail (includes `dp` player token, `tm_id`, cast `stafflist`, `trailer`) |
| `GET /api/tv/{id}` | tv detail (adds `season[]`) |
| `GET /api/related/{url-encoded-title}?page=0` (host `api2.imdb4.shop`) | "More like this" by title |
| `GET /api/search2/{url-encoded-query}?page=0` (host `api2.imdb4.shop`) | search; item has `filters:["type"]` |

## 2. TMDB proxy — `tmdb.imdb3.shop/3`

Exact TMDB v3 mirror, takes any valid api_key (our own public key works):

```
GET https://tmdb.imdb3.shop/3/movie/{tmdbId}?append_to_response=videos,credits&api_key=c9a3033fe3a3f5e6378891c5d0e887bf
GET https://tmdb.imdb3.shop/3/tv/{tmdbId}/season/{s}
```

## 3. Player flow — `webvp.watch21.shop`

**Observation (static + live):** the request is client-signed, with no server
secret. `ts` = unix seconds, and

```
sig = HMAC-SHA256("{tmdbId}:{ts}", "net###@@sss")     // lowercase hex
```

```
GET https://webvp.watch21.shop/play/external.php
      ?tm_id={tmdbId}&tm_type={movie|tv}[&se=&ep=]
      &ts={ts}&sig={sig}&exten=true
```

Verified live on 2026-11-03 (HTTP 200, ~20.6 KB). Returns an HTML "Movie
Player" page containing an inline `const servers = [...]`:

```js
[
  { "name":"Server 1", "label":"Fast · Ad-Free",
    "url":"https://webvp.watch21.shop/play/watchcinemo.php?se=0&ep=0&year=&nid=&ts=<ts>&sig=<sig>&tm_id=<tmdbId>&hasExt=true" },
  { "name":"Server 2", "label":"Mult-Lang · Ad-Free",
    "url":"https://vidsync.pro/embed/movie/<tmdbId>?dubLang=hindi&subtitle=..." }
]
```

### `exten` is mandatory

**Observation:** `exten=true` -> 12 DASH/HLS renditions in the Server 1 page.
`exten=false` (and a missing flag) -> empty `qualities`, i.e. a dead player.
`hasExt` in the nested URL mirrors the flag.

Server 1 (`watchcinemo.php`, ~47 KB) is the Artplayer + hls.js/dash.js page.
It injects `qualities[]` / `subtitles[]` server-side and returns:
`Access-Control-Allow-Origin: *`. Scripts load from jsdelivr:
`cdn.jsdelivr.net/npm/{artplayer,hls.js,dashjs}`.

Server 2 is the plain `vidsync.pro/embed/{movie|tv}/{tmdbId}` iframe keyed by
TMDB id (dubLang `hindi`), see `net77-api.md` for that host's behaviour.

### Frame headers and the Referer allowlist (why a worker is needed)

- **Observation:** `external.php` and the nested `watchcinemo.php` send **no**
  `x-frame-options`. Their CSP (`default-src 'self' https: http: data: blob:
  mediastream:`) has no `frame-ancestors`, so framing is permitted by headers.
- **Observation:** a **direct** iframe still fails. `external.php` checks the
  incoming `Referer` against an allowlist: `http://localhost[:port]` and
  `https://netmirror.plus[:port]` pass; any other origin returns 403; a
  **missing** Referer also fails. That is the real gate, not XFO.
- **Observation:** `netmirror.plus` itself (the React shell) sends
  `x-frame-options: SAMEORIGIN`, and its HTML answers 403 to Cloudflare Worker
  egress from some colos (200 from a normal client). The shell is therefore
  neither embeddable nor proxyable; only the signed player endpoint is usable.
  The earlier “every hop sends SAMEORIGIN” note was wrong — it described the
  shell, which we do not use.

Our worker (`netmirror-player` in `cloudflare/embed-proxy`) makes the direct
player work:

| Worker route | Upstream |
|---|---|
| `/netmirror-player/play/*` | `https://webvp.watch21.shop/play/*` |
| `/netmirror-player/r/cdn.jsdelivr.net/*` | `https://cdn.jsdelivr.net/*` (allowlisted `remoteHosts`) |

- The worker sets `Referer: https://webvp.watch21.shop/` on every upstream
  fetch, satisfying the allowlist.
- It replaces the provider origin in HTML/JS with the worker base, so the
  nested `watchcinemo.php` URL from `servers[]` and its sub-requests stay on
  the worker.
- It serves its own CSP with `frame-ancestors *` and strips provider frame
  headers, so the app can iframe the worker URL.
- There is **no** extension handshake (`NETMIRROR_CHECK`) and no `llvpn` ad
  script on this path; `exten=true` replaces the extension gate. The old
  ad/extension byte patches were removed with the `netmirror` entry.

**Inference (high confidence):** the `Referer` requirement is a hotlink guard
aimed at third-party sites, not a per-user credential — it is satisfied by the
worker, not by a cookie or account.

**Unknown:** whether `ts`/`sig` have a hard expiry. Verified: a 20-minute-old
`ts` still returned 200; a tampered `sig` returns a short error page with no
`servers` array. Exact rejection window not probed further.

## 4. Notes for isai app

- **Observation:** the app keys on TMDB ids, and `external.php` takes
  `tm_id` = TMDB id, so no NetMirror-catalog cross-reference is needed for
  playback. `src/lib/netmirror.ts` builds the signed URL with WebCrypto HMAC
  and `exten=true`; `src/lib/embedProxy.ts` supplies the worker base.
- The `api2.imdb3.shop` catalog is keyed by NetMirror's own ids, so it is only
  useful for richer metadata once a `tm_id` cross-reference exists (the detail
  API provides it). Not wired.
- net77.cc is a separate app with its own login-gated backends — full spec in
  `docs/net77-api.md`.

Evidence: REA `ev_f81e81d0452752630413c03817e2b73665d0ca27c5114c22c595965dc06c5c1f`
(`analyze_javascript_application` on the netmirror.plus bundle tree,
`index-2a8f1549.js`; signing key `q6="net###@@sss"`). The bundle path has
since rotated to `/assets/index-24fc1dc4.js`, which is why the flow was
re-verified live rather than trusted from the old static bundle. Live probes
(2026-11-03): signed `external.php` with `exten=true|false`, tampered `sig`,
Referer matrix (localhost / netmirror.plus / arbitrary / none), nested
`watchcinemo.php` + jsdelivr scripts, all through the deployed worker.
Exported record: `%TEMP%\opencode\rea\netmirror-rea.json`.

Residual unknowns: the `ts`/`sig` expiry window and whether the signature is
IP-bound (both unprobed beyond the 20-minute replay above), and whether the
`vidsync.pro` Server 2 still needs a browser fingerprint from a WebView
(unchanged from the earlier note). Neither blocks playback via Server 1.
