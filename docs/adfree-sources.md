# Ad-Free Source Status — provider embeds (isai app)

**Audited:** 2026-11-04 (post VidLink-clean fix) · **Worker version:** `a7445b4d-0abe-4b3a-8b70-7b48cf835978`

## Clean / Ad-Free sources (auto-preferred; NetMirror is the default + auto-selected)

| Source | Mechanism | Status |
|---|---|---|
| NetMirror (`netmirror.plus` → `webvp.watch21.shop` signed player) | HMAC-signed player URL via worker `netmirror-player` | ✅ Playing ad-free (206s streams observed) |
| VidLink (`vidlink.pro`) | Worker-proxied clean page + stream CDN rewrite (`surge.flooderrr.store` → `/{provider}/r/...`) | ✅ Clean after 2026-11-04 fix (worker 200) |
| VidSrc / VidSrc.rip | Worker strips (`backbutton` patch, popup guard, CSP) | ✅ |
| VidCore | Worker strips (CSP / patches) | ✅ |
| NXSHA | Worker strips (CSP / neutralizer) | ✅ |
| CineSrc | Worker strips (analytics beacon + popover patches) | ✅ |
| VidLux / VidNest / VidRock / VidZen / VidFlix / 2embed / AeonWatch | Worker strips (ad src patterns, neutralizer, CSP) | ✅ |
| Vyla direct streams (`/resolve` → Hexa etc.) | Ad-free by design (no provider page loads) | ✅ when resolvable |

## Sources still carrying ads (blocked from worker proxying)

| Source | Route | Blocker |
|---|---|---|
| VidFast (`vidfast.vc`) | Direct | Worker egress → Cloudflare challenge (403, gzip) |
| VidUp (`vidup.to`) | Direct | Worker egress → Cloudflare challenge (403, gzip) |
| MultiEmbed (`multiembed.mov`) | Direct | Worker egress → Cloudflare challenge (403); route shape also needs `?video_id=` handling |
| VixSrc (`vixsrc.to`) | Direct | Worker egress → Cloudflare challenge (403) |

**Mitigation (2026-11-05):** the 4 ad-bearing sources are now covered ad-free by
the NetMirror family resolver (`src/lib/netmirror.ts`):
- Primary: netmirror.plus signed player (`webvp.watch21.shop` → worker
  `/netmirror-player`) keyed by TMDB id.
- Regional fallback: netmirror.plus catalog API (`api2.imdb3.shop`) with
  `country` / `dubbing` regional rails → TMDB cross-ref (`tm_id`) → signed player.
- Family fallback: net77.cc (`netcc`) backend `search.php` aggregated with the
  netmirror.plus catalog (`searchNetmirrorFamily`).

So content previously only reachable via the 4 blocked/ad sources now resolves
through NetMirror (ad-free) before the `(Direct · ads)` list is ever used.

Mitigation: clean sources always outrank these; they are labelled `(Direct · ads)` and never auto-selected; the clean fallback list had its ad-bearing duplicates removed.

## Residuals

- **In-player drawn ads** (sponsor strips, burned-in watermarks) on clean sources: not reachable app-side (accepted as out of scope).
- **Music streams / watch-party links:** user-supplied media, not provider ad stacks.

## Evidence labels

- **Observation:** worker proxied VidLink → HTTP 200 (post stream-rewrite deploy); in-app node list shows `VIDLINK (AD-FREE)`; `SELECTED SERVER: NETMIRROR (AD-FREE)`.
- **Inference:** CF bot management (IP/TLS-fingerprint based) rejects worker egress for the 4 blocked sources; region + header probes did not change it.
- **Unknown:** feasibility of any further proxy path for the 4 blocked sources.

## Answer to "still how many sources have ads?"

**4** — VidFast, VidUp, MultiEmbed, VixSrc.
