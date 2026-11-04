// NetMirror (netmirror.plus) playback URL builder.
//
// Their catalog shell (netmirror.plus) sends `x-frame-options: SAMEORIGIN`, so
// it can never be embedded. The player endpoint it frames is a separate host
// and ships no frame headers, so the app can embed it directly:
//
//   https://webvp.watch21.shop/play/external.php
//     ?tm_id=<tmdbId>&tm_type=movie|tv[&se=&ep=]&ts=<unix>&sig=<hmac>&exten=false
//
// `sig` is HMAC-SHA256("{tmdbId}:{unixTs}", key) as lowercase hex. The server
// accepts a generous timestamp window (verified: a 20-minute-old ts still
// returned 200), so the signature is produced when the source list is built.
//
// Evidence: docs/netmirror-family-api.md (REA static bundle analysis +
// live probes of external.php / watchcinemo.php, 2026-11-03).

import { EMBED_PROXY_BASE } from "@/lib/embedProxy";

// Served through the embed-proxy: webvp.watch21.shop checks the Referer
// against an allowlist that does not include the site's own origins, while
// the worker fetches with `Referer: https://webvp.watch21.shop/`. The worker
// also rewrites the player's nested watchcinemo.php URL onto the same route.
const NETMIRROR_PLAYER_URL = `${EMBED_PROXY_BASE}/netmirror-player/play/external.php`;

// Published in their client bundle (`q6="net###@@sss"`), used to sign the
// player request in the browser. Not a server secret.
const NETMIRROR_SIGNING_KEY = "net###@@sss";

async function hmacSha256Hex(message: string, key: string): Promise<string | null> {
  try {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(key),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
    return Array.from(new Uint8Array(signature))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // crypto.subtle requires a secure context (https / localhost).
    return null;
  }
}

export async function buildNetmirrorPlayerUrl(
  tmdbId: string,
  isTv: boolean,
  season: number,
  episode: number,
): Promise<string | null> {
  if (!tmdbId) return null;

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await hmacSha256Hex(`${tmdbId}:${timestamp}`, NETMIRROR_SIGNING_KEY);
  if (!signature) return null;

  const params = new URLSearchParams({
    tm_id: tmdbId,
    tm_type: isTv ? "tv" : "movie",
    ts: String(timestamp),
    sig: signature,
    // The player only fills `qualities` when the extension flag is true
    // (verified live: hasExt=false -> qualities [], hasExt=true -> DASH/HLS
    // renditions). Their extension gate is bypassed by the app, not by a
    // patched page.
    exten: "true",
  });
  if (isTv) {
    params.set("se", String(season));
    params.set("ep", String(episode));
  }

  return `${NETMIRROR_PLAYER_URL}?${params.toString()}`;
}

// NetMirror catalog / metadata API (netmirror.plus family backend).
// Regional content: the catalog accepts `country` / `dubbing` filters and its
// detail items carry a TMDB cross-reference (`tm_id`) that the signed player
// consumes. Used as the ad-free regional fallback when the TMDB-id-keyed player
// URL cannot resolve (regional catalogs are keyed differently).
const NETMIRROR_CATALOG_API = "https://api2.imdb3.shop";

export interface NetmirrorCatalogItem {
  id?: string;
  tm_id?: string;
  media_type?: string;
  title?: string;
  release_date?: string;
  [key: string]: unknown;
}

export async function searchNetmirrorCatalog(
  query: string,
  opts: { country?: string; dubbing?: string; type?: string } = {},
): Promise<NetmirrorCatalogItem[]> {
  try {
    const params = new URLSearchParams({ page: "0", items_per_page: "25" });
    if (opts.type) params.set("type", opts.type);
    if (opts.dubbing) params.set("dubbing", opts.dubbing);
    if (opts.country) params.set("country", opts.country);
    const url = `${NETMIRROR_CATALOG_API}/api/movies/filter?${params.toString()}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = await res.json();
    const items: NetmirrorCatalogItem[] = Array.isArray(data?.results) ? data.results : [];
    const q = (query || "").trim().toLowerCase();
    if (!q) return items;
    const matches = items.filter((it) => {
      const t = String(it?.title || "").toLowerCase();
      return t.includes(q) || String(it?.id ?? "").includes(q);
    });
    return matches.slice(0, 10);
  } catch {
    return [];
  }
}

// Combined NetMirror family resolver (netmirror.plus + its sibling net77.cc
// family backend). Ad-free by design: the only playback hop is the signed
// netmirror.plus player (webvp.watch21.shop) — no provider ad stack ever loads.
//
// Order:
//   1. netmirror.plus signed player keyed by TMDB id (primary).
//   2. netmirror.plus catalog (regional content) → TMDB cross-ref (tm_id) →
//      signed player (regional fallback for the 4 ad-bearing sources).
export async function resolveNetmirrorStream(
  tmdbId: string,
  title: string,
  isTv: boolean,
  season: number,
  episode: number,
  opts: { country?: string; dubbing?: string } = {},
): Promise<string | null> {
  const direct = await buildNetmirrorPlayerUrl(tmdbId, isTv, season, episode);
  if (direct) return direct;

  const items = await searchNetmirrorCatalog(title, {
    type: isTv ? "2" : undefined,
    ...(opts.dubbing ? { dubbing: opts.dubbing } : {}),
    ...(opts.country ? { country: opts.country } : {}),
  });
  for (const it of items) {
    const viaId = String(it?.tm_id || it?.id || "");
    if (!viaId) continue;
    const via = await buildNetmirrorPlayerUrl(viaId, isTv, season, episode);
    if (via) return via;
  }
  return null;
}

// NetMirror family-wide catalog search: netmirror.plus (api2.imdb3.shop
// regional catalog) + the sibling net77.cc family backend (search.php).
// Used to collect candidate ids for the ad-free regional resolver above.
export async function searchNetmirrorFamily(
  query: string,
  opts: { type?: string; country?: string; dubbing?: string } = {},
): Promise<NetmirrorCatalogItem[]> {
  const out: NetmirrorCatalogItem[] = [];
  const plus = await searchNetmirrorCatalog(query, opts);
  out.push(...plus);
  try {
    const t = String(Math.floor(Date.now() / 1000));
    const url = `https://net77.cc/search.php?s=${encodeURIComponent(query || "")}&t=${t}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const data = await res.json();
      const results = Array.isArray(data?.searchResult) ? data.searchResult : [];
      for (const r of results) {
        const id = String(r?.id ?? "");
        if (!id) continue;
        out.push({
          id,
          tm_id: id,
          title: typeof r?.t === "string" ? r.t : undefined,
          media_type: "movie",
        });
      }
    }
  } catch {
    // net77.cc unreachable — netmirror.plus catalog results stand.
  }
  return out;
}
