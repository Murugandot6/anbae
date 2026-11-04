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
