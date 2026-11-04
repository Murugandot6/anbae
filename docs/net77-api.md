# net77.cc API — Netflix-UI Clone Portal (DODO View / NetMirror brand)

Reverse-engineered live on 2026-11-03 through the user's own logged-in Brave
session (CDP attach, Playwright + raw DevTools network capture), then
cross-checked against the site's shipped inline JavaScript (REA static
analysis, `ev_a3123cc622b8ee5486a7d83ca3284e17e9c22687f4a606a7895ff62acf29a931`).
Facts from live capture and from the static bundles are labelled where they
differ; the AJAX surface below is static unless noted. net77.cc is **not** the
netmirror.plus React SPA — it is a server-rendered PHP portal that clones the
Netflix "akira" web UI (`assets.nflxext.com` CSS, JW Player 8.38.8, jQuery
3.7.1, lazyload).

## Identity / access model

- Cloudflare challenge: `/verify2` → post-challenge "Verification I'm Human"
  gate.
- Login wall: `/home` 302s to `/login_<visitorip>` (DODO View sign-in; plain
  jQuery form; email domain allowlist blocks gmail/yahoo/outlook…, or Google
  OAuth: client `722393836524-jvu6s7a7p0j04kr45pukb8pfbh27j39f`,
  redirect `https://net77.cc/login-status`).
- All state is **cookie/session-based**; no bearer tokens anywhere.
- Poster CDN: `https://imgcdn.kim/poster/341/<id>.jpg` (grid),
  `https://imgcdn.kim/poster/1920/<id>.jpg` (backdrop), thumbnails
  `https://imgcdn.kim/nfplayer/back02.nfmirrorcdn.top/vtt/<id>.vtt`.

## Pages (server-rendered, Netflix-clone)

| Path | Content |
|---|---|
| `/home` | hero billboard + rails (My List, continue watching, etc.) |
| `/movies`, `/series` | grid rows |
| Player | full-screen in-page iframe, never a URL change (state below) |

- Content rows: `.slider-item` cards, `data-post="<numericId>"`, clickable
  `.slider-refocus` anchor.
- Detail modal `#modal-main` (also carries `data-post`):
  - Play button `<a class="primary-button playLink isToolkit modal-main-play">`
    (href empty — JS-driven).
  - Language selector: `set_lang(this,'eng'|'hin'|'kan'|'mal'|'tam'|'tel')`.
  - Watchlist: `MyWatchList(<numericId>)`; continue-playing list via
    `recentplay.php` (below).

Internal ids are portal-numeric (e.g. `81436990` "Animal"), **not** TMDB/IMDb.

## Internal AJAX API surface (from static JS)

**Observation:** every server call is a jQuery `$.ajax` to a flat `*.php`
endpoint. jQuery infers JSON from the response, so no `Accept`/`Content-Type`
contract is needed. `t` is always `$("body").attr("data-time")` — the
server-rendered page timestamp, attached to every content read. Whether the
server enforces it is **unknown** (static JS only proves it is sent).

| Call | Body / query | Response shape |
|---|---|---|
| `GET /post.php` | `id`, `t` | detail object (below) |
| `GET /episodes.php` | `s` (season selector value), `series`, `t`, optional `page` | `{episodes[], lang[], d_lang, nextPageShow, nextPage, nextPageSeason}` |
| `GET /search.php` | `s` (URL-encoded query), `t` | `{head, searchResult:[{id,t}]}` |
| `GET /mini-modal-info.php` | `id`, `t` | `{match, hdsd, ua, runtime, genre}` |
| `POST /play.php` | `id` | `{"h":"in=<token>"}` |
| `POST /p.php` | `hash` | `{r:"y"}` → reload (token rotation); other values keep the session |
| `GET /playlist.php` | `id`, `t`, `tm`, `h` | `[{image2, sources[], tracks[]}]` |
| `POST /language.php` | `lang` = `eng\|hin\|kan\|mal\|tam\|tel` | no body read (UI only) |
| `POST /setting.php` | `ott` (streaming-service id) | `{error:"no"}` on success, else `{error:"<message>"}` |
| `POST /MyWatchList.php` | `id`, `myList` (current `localStorage.nf_wlist`) | `{nf_wlist, col, msg}` |
| `POST /MyWatchList.php` | `myListPage` | same shape as `search.php` (`{head, searchResult[]}`) |
| `POST /recentplay.php` | `recentplay` = `<id>` or `SE<seriesId>` | empty body (bookkeeping) |
| `POST /recentplay.php` | `deleteid` | empty body (remove from continue watching) |

### `post.php` detail object

```
status            "n" -> JS reloads the page (session/expiry signal)
title year ua match runtime hdsd desc
type              "m" | "t"
resume            truthy -> modal shows "Resume" + resume_time,
                  resume_percent (0-100), resume_title
creator director writer cast genre
m_reason m_desc   maturity reason / description
oin               truthy -> show film/series badge (`/img/nf<type>.png`)
suggest[]         {id, t, m, y, ua, d}      "More like this" cards
lang[]            {s, l}                    audio tracks; d_lang = default
last_ep           TV: id of the resume episode
thismovieis       "This show/movie is: ..." label
nextPageShow      "1" -> show "more episodes" button
nextPage nextPageSeason
episodes[]        first season page (see below)
season[]          {id, s, ep, sele}         id -> episodes.php `s`
```

`episodes[]` items: `{id, s, ep, t, time, ep_desc, complate}` where `s` is the
season number shown in the UI, `ep` the episode number, `time` the runtime
string, and `complate` the watched percent (`"0"` = no progress bar).

### Play gating

**Observation:** `playerstart()` only calls `play.php` when
`$("body").attr("data-allok") === "y"`; otherwise it shows the ad-block
message and never mints a token. `data-allok` is set server-side (page
render), so playback needs both the render-time flag and the session cookie.

**Observation:** `play.php` accepts a body id and returns
`{"h":"in=<token>"}`; the page then builds
`https://net52.cc/play.php?id=<id>&<h>` — i.e. the returned value already
contains the `in=` key.

### iframe → parent protocol (net52.cc player page)

**Observation:** the player posts to `window.parent` with a **hard-coded**
target origin `https://net77.cc`:

| Value | Meaning |
|---|---|
| `666666<id>` | first play → parent POSTs `recentplay.php {recentplay:<id>}` |
| `777777<nextEpId>` | next-episode button → parent closes and replays that ep id |
| `<id>=<pos>:<dur>` | progress heartbeat → parent stores it as a 30-day cookie |

The parent listener ignores any message whose `event.origin !== "https://net52.cc"`.
`sendData()` reads the resume value from `localStorage` (the cookie branch in
`getCookieValue` is dead code after its `return`).

## Play chain (the core)


```
1) POST https://net77.cc/play.php        body: id=<numericId>
      → 200 JSON  {"h":"in=<token>"}                      (needs session cookie)

2) iframe loads https://net52.cc/play.php?id=<id>&in=<token>
   (mirror domains net52.cc / net73.cc / … rotate; token chains to one host)
      → player page; sets a session cookie on net52.cc (REQUIRED for the m3u8)

3) playerstart() → JW Player setup with
   GET https://net52.cc/playlist.php?id=<id>&t=<title>&tm=<data-time>&h=<h>
      → 200 JSON array: sources[] + tracks[]
```

### Token format (`in=`), `::`-delimited, PHP server-side

```
<sessionhash>::<requesthash>::<unixtime>::ni::<p|dp>::<stable-hash>
6a01f646…       4741b6ca…      1793694327  ni  dp  a9a31743…
```

- Part 1 + last part are stable for the login session.
- Part 2 changes on **every** `play.php` call; part 3 is the mint time.
- `playlist.php` mints **another** fresh `requesthash` on each call.
- Hash parts 1/4 are the visitor's IP/session identity — the whole chain is
  session-bound, not single-use, but short-lived (master URL ~ died < 1 min
  later outside the session; inside the session the served token stays valid
  while `p.php` heartbeat keeps it alive).
- `play.php?id=…` + `recentplay.php` seen live: `recentplay=<id>` body.

### playlist.php response

```json
[{ "image2": "https://imgcdn.kim/poster/1920/81436990.jpg",
   "sources": [
     {"file": "/hls/<id>.m3u8?in=<token>::dp",
      "label": "Full HD", "type": "application/vnd.apple.mpegurl"},
     {"file": "/hls/<id>.m3u8?q=720p&in=<token>::dp",
      "label": "Mid HD", "type": "application/vnd.apple.mpegurl", "default": "true"},
     {"file": "/hls/<id>.m3u8?q=480p&in=<token>::dp",
      "label": "Low HD", "type": "application/vnd.apple.mpegurl"}],
   "tracks": [
     {"kind": "captions", "file": "//subscdn.top/files/<id>/<id>-en.srt",
      "label": "English", "language": "en"},
     {"kind": "thumbnails",
      "file": "https://imgcdn.kim/nfplayer/.../vtt/<id>.vtt", "label": "English"}]}]
```

Master m3u8 is also deliverable per-language via
`?in=<token>&lang=<eng|hin|kan|mal|tam|tel>` variants (player offers
`audio_menu()`).

### Master playlist — `https://net52.cc/hls/<id>.m3u8?in=<token>::dp`

Session-cookie-bound (fetched OK in-session; 404 from plain curl even with
fresh token + Referer). Content:

```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aac",LANGUAGE="eng",NAME="English",DEFAULT=YES,
  URI="https://f.freecdn4.top/s21.freecdn4.top/files/<id>/a/0/0.m3u8"
#EXT-X-MEDIA:TYPE=AUDIO,…  hin /a/1/1.m3u8 … kan /a/2/, mal /a/3/, tam /a/4/, tel /a/5/
#EXT-X-STREAM-INF:BANDWIDTH=1000001,AUDIO="aac",RESOLUTION=1920x1080,CLOSED-CAPTIONS=NONE
https://f.freecdn4.top/s21.freecdn4.top/files/<id>/1080p/1080p.m3u8?in=<sesshash>::<freshhash>::<ts>::ni::p
#EXT-X-STREAM-INF:BANDWIDTH=600000,RESOLUTION=1280x720,DEFAULT=YES
…/720p/720p.m3u8?in=…
#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=854x480
…/480p/480p.m3u8?in=…
```

### Segment CDN — `f.freecdn4.top` (Apache; **Referer-gated only, no cookies**)

```
GET https://f.freecdn4.top/s21.freecdn4.top/files/<id>/<quality>/<quality>.m3u8?in=<token>::p
Referer: https://net52.cc/
→ 200, media playlist (VERIFIED from plain curl, no cookies)
```
- Sub-playlists list segments as **disguised files**:
  video segments `<n>_<NNN>.jpg`, audio segments `<n>_<NNN>.js` (plain TS
  bytes; `Content-Type` from server renamed — hls.js plays them regardless).
- Audio-only playlists (no token): `…/files/<id>/a/<n>/<n>.m3u8`, same
  Referer rule, 200 verified.
- Without the Referer header → `404 Not Found`.

### Player session keepalive / bookkeeping (net52.cc)

- `POST /p.php  { hash: body[data-hash] }` every 180 s (`Re_newdata`);
  `result.r == "y"` → the SPA reloads (token rotation). Skipping it ends the
  session.
- `body` attributes carry all metadata: `data-time`, `data-h` (=token),
  `data-title`, `data-type` (`m`|`t`), `data-series_id`, `data-nextep`,
  `data-eptitle`, `data-epnum`, `data-senum`, `data-year`, `data-ua`,
  `data-runtime`, `data-maindesc`.
- Playback reporting & resume is done **from inside the iframe** via
  `window.parent.postMessage(value, "https://net77.cc")`:
  - on first play: `sendData("666666" + (type=="t" ? "SE"+seriesId : id))`
  - Next-episode button (TV): `sendData("777777" + nextEpId)`
  - every 5 s after 20 s watched: `sendData("<id>")` where the value resolves
    to `<id>=<position>:<duration>`; the parent then POSTs
    `https://net77.cc/recentplay.php` (`recentplay=<id>` seen live).
  - resume position is stored at `localStorage[<id>] = "<pos>:<dur>"`, and
    audio-language preference in cookie/localStorage `lang`.
- Autoplay behavior: unmutes after 1 s (`jw-autostart-mute` click), autostart
  when viewable.

## Datacenter-fetch observations

- `net52.cc/play.php?id=…&in=…` opened from a *cold tab* (no net77 referer /
  context) → `<h2>Page Not Found! err: 1002</h2>` — the token is bound to the
  minting session; replaying play.php→play.php from the same authenticated
  session works.
- freecdn4 hop is referer-only and worked from a clean curl.

## Integration conclusion for the isai app

Cookie-free attempt (2026-11-03, plain curl, no login anywhere):
`POST net77.cc/play.php` with `id=…` *does* respond (200 JSON) even without
cookies, but it mints only a **guest token** — `…::ni::i::` with an empty
final hash — and `net52.cc/play.php?id=…&in=<guesttoken>` rejects it
(`Page Not Found! err: 1002`, 404). No other mirror host resolves
(net48/51/53/58/60/64 dead). **Conclusion: net77 playback cannot be done
without a real login session; skip it as a provider.** The static JS explains
why: `playerstart()` refuses to call `play.php` at all unless the
server-rendered `body[data-allok]` is `"y"`, and a guest render never is.

The cookie-free equivalent of this family is the **vidsync.pro embed** used
as netmirror's "Server 2":

```
https://vidsync.pro/embed/movie/{tmdbId}[?dubLang=hindi]
https://vidsync.pro/embed/tv/{tmdbId}?se={s}&ep={e}[&dubLang=…]
```

- HTTP 200, **no x-frame-options** (direct iframes allowed), CORS
  `Access-Control-Allow-Origin: *`, no cookies.
- Internally calls `GET /api/core/streams?type=movie|tv&id=<TMDB>&season=&episode=`
  (+ `/api/security/check`, `/api/castle/` fingerprint checks) — that API
  returns `{"sources":[]}` to non-browser callers (datacenter fetch), but the
  embed page works in normal browsers/WebViews and exposes in-player
  multi-audio (eng/hin/kan/mal/tam/tel) and subtitles.
- Its page JS runs an "AEGIS SHIELD" anti-automation/anti-devtools banner —
  harmless for real WebViews, blocks automated browsers.
- Wired into `src/components/StreamPlayer.tsx` as a Direct-only provider
  (`vidsync`, quality Ultra).

net77's own advantages (its catalog, continue-watching, per-title ids) remain
unreachable without account-based infrastructure; documentary value only.

## Raw evidence files (session dir `…\Temp\opencode\rea\cdprun\`)

- `cap_step8.json` — live `play.php` POST + `net52.cc/play.php` iframe +
  `recentplay.php` (Play click).
- `net77_play77.js` output (`play77_resp.json`) — raw `play.php` JSON
  `{"h":"in=…"}`.
- `cap_step9.json` / `cap_step10.json` — player page dump (JW setup,
  `playlist.php` params, `data-*` attrs, postMessage protocol).
- `cap_step11_player_scripts.json` — full inline player script (11.3 KB).
- `cap_step12.json` — `playlist.php` 200 body (sources + tracks) and in-session
  master m3u8 200 («EXTM3U»).
- `cap_step13_master.m3u8`, `fresh_master.m3u8`, `curl_720c.m3u8`,
  `curl_audio2.m3u8` — master + variant + audio playlists; freecdn4 200s from
  plain curl **with Referer**.
- `curl_720b.m3u8` / `curl_master.m3u8` / `curl_master2.m3u8` — the 404s that
  identified the Referer + session-cookie gates.

Static JS evidence (same session dir): `net77-static/` — `home.html`,
`home_inline_1.js` (36.6 KB; detail/search/episodes/watchlist/play chain),
`net52_player_inline.js` (11.3 KB; playlist + `p.php` + postMessage),
`home_inline_0/2/3.js`, `lazyload.min.js.js`, plus the `movies.html` /
`series.html` dumps. REA record:
`ev_a3123cc622b8ee5486a7d83ca3284e17e9c22687f4a606a7895ff62acf29a931`
(`analyze_javascript_application`, 7 files, 38 findings, 0 parse failures).
Exported record: `%TEMP%\opencode\rea\net77-rea.json`.

Residual unknowns: the AJAX handlers never disclose the *server's* validation
rules for `t`/session expiry, the `ott` id namespace behind `setting.php`, nor
whether `data-allok` can be set true for a guest render; the static JS only
proves the client contract.
