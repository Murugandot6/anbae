# primesrc-resolver

Clean-video resolver for the **PrimeWire / PrimeSrc** chain (part of the
[anbae](https://github.com/Murugandot6/anbae) streaming app tooling).

It turns the ad-riddled Filemoon player flow (its embed page loads Clickadu
popunders, rtmark trackers, ad iframes) into a **signed clean HLS master URL**
that is served over a tiny local REST API — the app never sees the ad
inventory. See `../docs/primewire-api.md` for the full protocol analysis and
evidence chain (ECDSA device attestation → sha256-leading-zero-bits PoW →
AES-256-GCM playback envelope → key_parts key selection).

## Endpoints (default `http://127.0.0.1:8790`)

```text
GET /health
GET /servers?tmdb=<tmdbId>[&type=movie|tv][&s=&e=]
GET /resolve?tmdb=<tmdbId>[&type=movie|tv][&s=&e=][&server=Filemoon][&index=N]
GET /resolve?code=<filemoonCode>[&parent=<page url>]   # browserless path
```

## How it works

1. `GET https://primesrc.me/api/v1/s` lists servers; Filemoon servers carry a
   short `key`.
2. `key → filemoon code` needs one Cloudflare interactive pass on
   `https://primesrc.me/api/v1/l?key=…`; the result is cached in
   `codes.json` (this file is **gitignored** — it is machine-local state).
3. The clean URL itself is obtained **fully browserless** (`server.js`
   `resolveStatic`): device attestation (fresh local ECDSA P-256 key per
   challenge), a 16-bit leading-zero-bits proof-of-work on the site's custom
   512-word hash (`pow_lib.cjs`, byte-verbatim port of `pow-DEJGtdh2.js`),
   then AES-256-GCM decryption of the playback envelope with the
   `key_parts[version] + key_parts[31-version]` key.
4. The m3u8 (and its segments) fetch fine with no cookies/referer and tokens
   live ~3 h; results are cached 2.5 h.

## Run

```bash
npm install
npm start
```

Only `playwright-core` is required; a headful Brave window is launched *once*
per uncached server key only (the Cloudflare hop), parked at `60,60`.

## Files

- `server.js` — REST service + hybrid static/browser resolver
- `pow_lib.cjs` — PoW solver (reimplementation of the site's own module)
- `client_profile.json` — constant, self-reported device-fingerprint values
  accepted by the attest endpoint (contains no real user data)
- `codes.json` *(gitignored)* — cached key→code mappings
- `browser-profile/` *(gitignored)* — sacrificial browser profile

## Disclaimer

For personal streaming in the author's own app. Educates on how
proof-of-work/encrypted-envelope client protection works; not affiliated with
any provider. No credentials, cookies or captured tokens are included in this
repository.
