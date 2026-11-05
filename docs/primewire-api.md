# PrimeWire / PrimeSrc API (reverse engineering notes)

Investigated 2026-11-05 from public traffic + static bundle analysis (REA
evidence: `ev_590ee7add5343fbc438b2b7361d1c83c549c1f04dd3917f5c19302b76168e3b5`
for the `primesrc.me/assets/index-BAX7bTxi.js` bundle, mirrored to
`%TEMP%\opencode\rea\primesrc\`).

## Topology

| Host | What it is |
|------|-----------|
| `primewire.nexus` | Status/hub portal (static Hugo/PaperMod, no app). Lists the live domains: `primewire.pw`, `.zip`, `.mov`, `.tf`, `.si`, `.li`, `.ag`, `.vc` — all are clones of the same Phoenix app. |
| `primewire.pw` (etc.) | The app. Server-rendered (Phoenix/Elixir, hashed `/js/app-*.js`), routes: `/home`, `/movies`, `/tv`, `/schedule`, `/playlists`, `/movie/{pw_id}-{slug}`, `/tv/{pw_id}-{slug}`. |
| `primesrc.me` | "PrimeSrc — Movie and TV Embed Service": the embed player *and* a cookie-free JSON metadata API. Openly frameable (`content-security-policy: frame-ancestors *`, no `X-Frame-Options`). |

**Important id mapping (observation from the watch-page source):**
PrimeWire watch URLs use **PrimeWire-internal** numerics (`window.show_id`,
e.g. `/movie/1551019-resident-evil` → 1551019 is *not* TMDB). The real TMDB id
sails along inside the player iframe:

```html
<iframe src="/embed/movie?s_id=1551019&tmdb_id=1423191"></iframe>
```

Your isai app already has TMDB ids, so for PrimeSrc you need **only the
`tmdb=` form** below (no cross-ref through primewire needed).

## PrimeSrc embed (drop-in iframe)

```text
https://primesrc.me/embed/movie?tmdb={tmdbId}
https://primesrc.me/embed/tv?tmdb={tmdbId}&season={s}&episode={e}
```

Optional params seen in the bundle: `imdb=tt…`, `tvmaze=…`,
`fallback=false`, `serverOrder=…`.

Verified live 2026-11-05, cookie-free, plain UA, HTTP 200:
movies old (Inception `tmdb=27205`) + new (Resident Evil 2026 `tmdb=1423191`),
TV (Breaking Bad `tmdb=1396&season=1&episode=1`).

## PrimeSrc JSON API

```text
GET https://primesrc.me/api/v1/list_servers?type=movie&tmdb={tmdbId}
GET https://primesrc.me/api/v1/list_servers?type=movie&imdb={imdbId}
GET https://primesrc.me/api/v1/list_servers?type=tv&tmdb={tmdbId}&season={s}&episode={e}
```

Response (verbatim shape, Inception):

```json
{
  "info": {
    "status": "Released", "type": "movie",
    "description": "Cobb, a skilled thief…",
    "title": "Inception", "release_date": "2010-07-15",
    "imdb_id": "tt1375666", "tvmaze_id": null,
    "tmdb_id": "tt1375666",
    "tmdb_backdrop": "https://image.tmdb.org/t/p/w1280/…",
    "tmdb_image": "/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg"
  },
  "servers": [
    {
      "name": "Filemoon",
      "file_name": "Resident Evil 2026 1080p WEBRip AAC5 1-LAMA",
      "file_size": null, "quality": null,
      "audio_language": "en", "audio_type": "orig"
    }
  ]
}
```

Notes:

- `servers[]` lists upstream *file* hosts (Filemoon / Playview `playview.cc`
  / Showsy `showsy.net` — all three hosts appear in the embed bundle). The
  embed player resolves each server file into its own player page; there is no
  public one-call "give me the m3u8" route in the bundle (the player logic lives
  behind the SPA bundle and the file hosts). Playing through the embed iframe is
  therefore the supported integration path.
- The embed ships with a `vidsrc.net` fallback chain built in
  (`vidsrc.net/embed/movie/…` + `vidsrc.net/embed/tv/…` constants in the bundle).
- No signing, no cookies, no referer requirement observed (works from a bare
  curl with a normal UA).

## isai integration

`src/components/StreamPlayer.tsx` now registers PrimeSrc in `EMBED_PROVIDERS`:

```ts
{ name: "PrimeSrc", id: "primesrc", quality: "High", proxy: false,
  movie: (id) => `embed/movie?tmdb=${id}`,
  tv: (id, s, e) => `embed/tv?tmdb=${id}&season=${s}&episode=${e}` }
```

with `DIRECT_ORIGINS.primesrc = "https://primesrc.me"` (direct iframe — allowed
by their `frame-ancestors *` policy). It sits in the clean/proxied group's
neighbourhood, before the raw ad-stack providers.

## Ads analysis (2026-11-05, browser network probes + REA)

**Does PrimeSrc carry ads?** Two-part answer with evidence:

1. **The PrimeSrc embed shell itself loads no ad networks.** Captured request
   hosts for `primesrc.me/embed/movie?tmdb=27205` were only: primesrc.me,
   cdnjs.cloudflare.com, fonts.googleapis.com, static.cloudflareinsights.com,
   image.tmdb.org. It does contain one dummy element
   `class="ad-banner adsbox ads"` — a classic **adblock-detection bait**
   (`adsbox` is a detection class, not an ad).
2. **Its playback partners are heavy ad hosts.** The server chain resolves
   `s` → `/api/v1/l?key=…` (behind an invisible Cloudflare **Turnstile**) →
   `{"link":"https://bysejikuar.com/e/…/…", "host":"filemoon.sx", "host_id":66}`.
   The Filemoon page loads **liugu/clickadu-style popunders** (`luugy.com` with
   `userId=…&dmn=llvpn.com`), RTB trackers (`my.rtmark.net`), and ad iframes
   (`n1mwq.org`, `img-place.com`) — captured netlog in
   `Temp\opencode\rea\cdprun\filemoon_cap*.json`.

**The clean stream (verified):** once turned up, the Filemoon page requests
the real HLS master, and that final URL is fully open:

```text
https://edge1-*.owphbf24.com/hls2/…/<euid>_x/master.m3u8?t=<sig>&s=…&e=10800&f=…&srv=…&asn=…
```

- master playlist: **617 B, HTTP 200 via bare curl, no cookies, no referer**
- variant playlist: **190 KB, 200**, video segment: **5.6 MB, 200**
- tokens last `e=10800` = **3 hours**, bound to URL not to session
  (`t=…` param). After extraction, hls.js can play everything directly.

Server-side catch: steps `/api/v1/l` and the Filemoon page are
Cloudflare-gated to real browser contexts (plain fetch gets a 403
"Just a moment" challenge page; the page HTML is 1.6 KB challenge stub).

Server types per title (Inception: 21 servers — Filemoon×3, Voe×2, Dood×3,
Luluvdoo×2, Streamtape×3, Vidmoly×2, Mixdrop×2, Streamwish, Filelions×2,
Savefiles; Breaking Bad S1E1: 27 servers across 13 hosts).

## Clean resolver service (implemented)

`D:\Murugan\primesrc-resolver` (`npm start`, port 8790) resolves the signed
clean m3u8 and serves **only that URL**. Since the static REA of the Filemoon
player (see next section) the chain runs **fully browserless**; the browser is
needed only once per server key to harvest the `/api/v1/l` link hop (Cloudflare
managed-challenge protected), and the key→code mapping is persisted in
`codes.json` so it never repeats.

```text
GET http://localhost:8790/resolve?code=<fmcode>[&parent=<page url>]   # pure static, ~8-15 s
GET http://localhost:8790/resolve?tmdb=27205[&type=movie|tv][&s=&e=][&server=Filemoon][&index=N]
GET http://localhost:8790/servers?tmdb=…[&type=&s=&e=]               # server list only
GET http://localhost:8790/health
```

- Direct `code=` requests never touch a browser (proof: `node full_chain.js`
  in the REA workdir produced the clean URL in ~8 s over 7 steps).
- `tmdb=` requests use the static `/api/v1/s` listing + cached codes; only a
  cache-miss triggers the (visible) browser `/l` harvest.
- Results cached 2.5 h (tokens live ~3 h).
- `StreamPlayer.tsx` consumes it as **"PrimeSrc (clean)"** — a direct hls/mp4
  source in the `CinePro → PrimeSrc (clean) → Vyla → embeds` chain; the
  endpoint is `localStorage.primesrc_resolver` (default `http://localhost:8790`).

## Filemoon clean-URL protocol — fully reversed (static REA, live-verified 2026-11-05)

Sources of truth: the harvested player tree
(`%TEMP%\opencode\rea\filemoon-static\` — `pow-DEJGtdh2.js`,
`videoPagesBundle-Bgi0QmPo.js`), ground-truth network captures
(`%TEMP%\opencode\rea\cdprun\api_capture.json`, `req_capture.json`,
`playback_decrypted.json`, `playback_decrypted_live.json`), and the REA static
analysis evidence `ev_2ac02270d361ea277c3f0e328236bece1827ba439797b7052f6d99b98f3d1de4`
(digest: `%TEMP%\opencode\rea\filemoon_slim_rea_digest.json` — 116 findings,
22 network endpoints, 4 storage observations over the slim tree). The "signed URL"
is NOT client-computed — the server ships it **AES-256-GCM encrypted**, and the
whole protection stack is just: device attestation → PoW "captcha" → decrypt.

Base: `https://n1mwq.org` (embed frame host; `bysejikuar.com` serves the page).
Embed-mode header on every API call: `x-embed-parent: <parent page url>`.
Video `code` = filemoon code (e.g. `uu6ra0eqr2ui`, from the `/e/{code}/{slug}`
page or the `embed_frame_url` field).

1. **Device attestation**
   - `POST /api/videos/access/challenge` (no body) → `{challenge_id, nonce}`
   - locally: fresh ECDSA **P-256** keypair, `sign(UTF8(nonce))` with
     `{name:"ECDSA",hash:{name:"SHA-256"}}` → b64url; public JWK is posted
   - `POST /api/videos/access/attest` with
     `{viewer_id:"", device_id:"", challenge_id, nonce, signature, public_key, client:{user_agent,…}, storage:{}, attributes:{entropy:"medium"}}`
     → `{token (fingerprint token), viewer_id, device_id, confidence, expires_at (~1 h)}`
   - The server-verified part is the ECDSA signature only; all `client.*`
     fields are self-reported device fingerprint strings (verified accepted
     as constant values).

2. **PoW captcha** ("sha256-leading-zero-bits", difficulty 16, expires_in 1800)
   - `POST /api/videos/{code}/embed/captcha` body `{}` →
     `{pow_nonce, pow_difficulty:16, pow_token, expires_in:1800}`
   - solver (from `pow-*.js`, export `Er`): find counter `c ≥ 0` such that the
     custom 512-word hash of the string `"pow_nonce:c"` has ≥ difficulty
     leading zero bits; solution = `String(c)` (typ. 50k–120k, 3–10 s).
     Hash spec (`gr()`): state = SHA-256 IV words; per input byte
     `w0=(w0+byte)>>>0; w0=rotl(w0,7); mix4();` then 8× `mix4()`;
     table `r[i]=(w0^w2)>>>0` for 512 entries; 2 rounds
     `a=r[s]&511; c=rotl(r[s]+r[a],13); c^=imul(r[(s+1)&511],lr); r[s]=c; w0^=c; mix4()`
     (lr=2654435761, hr=2246822519); final per-64-word lane fold
     `s=rotl(s+w,5); s^=imul(w,hr)`; `out[i]=(s^w2)>>>0`.
     `mix4` is a ChaCha-like quarter round on words 0..3. A zero byte counts 32 bits.
   - `POST …/{code}/embed/captcha/verify` `{pow_token, solution}` →
     `{status:"ok", token(~132 chars b64url), expires_in}`
     (verified live: static Node solve accepted on first try)

3. **Playback envelope**
   - `POST …/{code}/embed/playback`, headers `x-captcha-token: <verify token>`
     (plus `x-embed-parent`), body
     `{fingerprint:{token, viewer_id, device_id, confidence}}`
   - → `{playback:{algorithm:"AES-256-GCM", iv(b64url, 12 B), payload(b64url, ct+16 B tag), key_parts:[30 b64url strings]}, version:"19", expires_at}`
   - **Key selection** (`ws`/`ks` in bundle): indices (1-based)
     `[version, 31-version]` into `key_parts` — e.g. version 19 → parts 19 & 12,
     each 22 chars → 16 B each → concat = **32-byte AES-256 key**.
   - AES-256-GCM decrypt →
     `{sources:[{quality,label,mime_type,url,bitrate_kbps,height,size_bytes}], poster_url, expires_at}`
     — **`sources[].url` is the clean signed master.m3u8**, matching the
     browser-observed ground truth exactly.

4. **Delivery** — master/variant/segments GET 200 with bare curl (no cookies,
   no referer); tokens live `e=10800` (~3 h).

Live proof of the full browserless chain (tmdb=27205 → Inception 1080p):
`playback_decrypted_live.json` — resolved in 8.3 s; m3u8 verified HTTP 200.

PrimeSrc side (`primesrc.me`, plain HTTP, no cookies):
- `GET /api/v1/s?type=movie|tv&tmdb|imdb=…[&season=&episode=]` — server list
  **with per-server `key`** (e.g. `bYLSx`).
- `GET /api/v1/l?key=<key>` — Cloudflare **managed challenge** HTML unless
  called from a cleared browser tab; from the page it returns
  `{link:"https://bysejikuar.com/e/{code}/{slug}", host:"filemoon.sx",…}`.
  This is the only step needing a (visible) browser hop, and its key→code
  result is cached forever in `codes.json`.

Open items: none for the clean-URL path — protocol is complete.



- `fallback` and `serverOrder` exact semantics (bundle strings only; not needed
  for the default embed flow).
- PrimeWire internal id → TMDB cross-lookup (`s_id=` embed form) and site
  search endpoint; not needed since isai keys on TMDB ids directly.
- Primewire login/account features (playlists, forum) — out of scope.
