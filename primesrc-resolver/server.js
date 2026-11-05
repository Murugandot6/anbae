// primesrc-resolver — clean stream resolver for the PrimeWire/PrimeSrc chain.
//
// FULL STATIC CHAIN (no browser at all — REA-reversed 2026-11-05 from the real
// Filemoon player bundle pow-DEJGtdh2.js + videoPagesBundle.js; validated live):
//   1. POST <fm>/api/videos/access/challenge          → {challenge_id, nonce}
//   2. ECDSA P-256/SHA-256 sign(nonce) (fresh keypair) + public JWK
//      POST <fm>/api/videos/access/attest            → fingerprint token (~1 h)
//   3. POST <fm>/api/videos/{code}/embed/captcha      → {pow_nonce, pow_difficulty:16, pow_token}
//   4. solve sha-leading-zero-bits PoW (custom 512-word hash) → counter
//      POST embed/captcha/verify {pow_token, solution} → captcha token
//   5. POST embed/playback {fingerprint} + x-captcha-token
//      → {playback:{algorithm:"AES-256-GCM", iv, payload, key_parts[30]}, version:N}
//   6. key = key_parts[N] + key_parts[31-N] (b64url → 32 bytes), AES-GCM decrypt
//      → {sources:[{label,url…}]} — url = signed clean m3u8 (~3 h, cookie-free)
//
// The ONLY browser-dependent step left is PrimeSrc's tmdb→key→code mapping
// (GET /api/v1/l?key=X is Cloudflare managed-challenge protected). That is now
// just a link harvest (no playback needed); results are persisted in codes.json
// so each key is solved once, ever.
//
//   GET /resolve?tmdb=27205[&type=movie|tv][&s=&e=][&server=<name>][&index=N]
//   GET /resolve?code=<filemoon code>[&parent=<page url>]      (fully browserless)
//   GET /servers?tmdb=…                                        (plain HTTP)
//   GET /health

import http from "node:http";
import nodecrypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import pw from "playwright-core";
import { solvePow } from "./pow_lib.cjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 8790);
const BRAVE_PATHS = [
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  "C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
];
const PROFILE = path.join(__dirname, "browser-profile");
const CODES_FILE = path.join(__dirname, "codes.json");
const API_S = "https://primesrc.me/api/v1/s";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const CACHE_TTL = Number(process.env.CACHE_TTL_MS || 2.5 * 3600 * 1000);
const cache = new Map(); // resolve key -> { ts, result }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- persisted key→code cache -------------------------------------------------
let codes = fs.existsSync(CODES_FILE) ? JSON.parse(fs.readFileSync(CODES_FILE, "utf8")) : {};
function saveCodes() { try { fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2)); } catch (e) { console.log("[codes] save failed:", e.message); } }

// ---- PrimeSrc listing (plain HTTP) ---------------------------------------------
async function fetchServers(type, id, s, e) {
  let u = `${API_S}?type=${type}&tmdb=${encodeURIComponent(id)}`;
  if (type === "tv" && s != null && e != null) u += `&season=${s}&episode=${e}`;
  const r = await fetch(u, { headers: { "user-agent": UA, referer: "https://primesrc.me/embed/movie" } });
  if (!r.ok) throw new Error(`list_servers ${r.status}`);
  return r.json();
}

// ---- full static Filemoon chain (browserless) -----------------------------------
// A minimal cookie jar: challenge may set a session cookie.
function makeJar() {
  const jar = new Map();
  return {
    save(res) { try { for (const c of (res.headers.getSetCookie?.() || [])) { const [pair] = c.split(";"); const i = pair.indexOf("="); if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim()); } } catch {} },
    header() { return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; "); },
  };
}

const b64u = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64d = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");

// client profile — opaque self-reported fingerprint fields (verified accepted)
const CLIENT = JSON.parse(fs.readFileSync(path.join(__dirname, "client_profile.json"), "utf8"));

async function resolveStatic({ code, parent }) {
  const fm = "https://n1mwq.org";
  const t0 = Date.now();
  const jar = makeJar();
  const H = {
    "x-embed-parent": parent || `https://bysejikuar.com/e/${code}/`,
    "user-agent": UA,
    referer: parent || `https://bysejikuar.com/e/${code}/`,
  };
  const url = (p) => `${fm}${p}`;

  let r = await fetch(url("/api/videos/access/challenge"), { method: "POST", headers: H });
  jar.save(r);
  if (!r.ok) throw new Error(`challenge ${r.status}`);
  const ch = await r.json();

  const kp = await nodecrypto.webcrypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const pubJwk = await nodecrypto.webcrypto.subtle.exportKey("jwk", kp.publicKey);
  delete pubJwk.key_ops; delete pubJwk.ext;
  pubJwk.ext = true; pubJwk.key_ops = ["verify"];
  const sig = await nodecrypto.webcrypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, kp.privateKey, new TextEncoder().encode(ch.nonce));

  r = await fetch(url("/api/videos/access/attest"), {
    method: "POST",
    headers: { ...H, "content-type": "application/json", cookie: jar.header() },
    body: JSON.stringify({ viewer_id: "", device_id: "", challenge_id: ch.challenge_id, nonce: ch.nonce, signature: b64u(sig), public_key: pubJwk, client: CLIENT, storage: {}, attributes: { entropy: "medium" } }),
  });
  jar.save(r);
  if (!r.ok) throw new Error(`attest ${r.status}`);
  const att = await r.json();
  if (!att.token) throw new Error("attest returned no token");

  r = await fetch(url(`/api/videos/${code}/embed/captcha`), { method: "POST", headers: { ...H, "content-type": "application/json", cookie: jar.header() }, body: "{}" });
  jar.save(r);
  if (!r.ok) throw new Error(`captcha ${r.status}`);
  const cap = await r.json();

  const sol = await solvePow(cap.pow_nonce, cap.pow_difficulty);
  if (sol == null) throw new Error("PoW timeout");
  console.log(`[static] PoW solved (${Date.now() - t0}ms): counter ${sol}`);

  r = await fetch(url(`/api/videos/${code}/embed/captcha/verify`), { method: "POST", headers: { ...H, "content-type": "application/json", cookie: jar.header() }, body: JSON.stringify({ pow_token: cap.pow_token, solution: sol }) });
  jar.save(r);
  if (!r.ok) throw new Error(`verify ${r.status}`);
  const ver = await r.json();
  if (ver.status !== "ok" || !ver.token) throw new Error(`verify ${ver.status}`);

  const fmt = { ...H, "x-captcha-token": ver.token, "content-type": "application/json", cookie: jar.header() };
  r = await fetch(url(`/api/videos/${code}/embed/playback`), {
    method: "POST",
    headers: fmt,
    body: JSON.stringify({ fingerprint: { token: att.token, viewer_id: att.viewer_id ?? "", device_id: att.device_id ?? "", confidence: att.confidence ?? 0.8 } }),
  });
  if (!r.ok) throw new Error(`playback ${r.status}`);
  const pbj = await r.json();
  const pb = pbj.playback;
  if (!pb) throw new Error("no playback envelope");

  const version = Number(pbj.version ?? pb.version);
  const a = version, b = 31 - version, n = (pb.key_parts || []).length;
  if (!(a >= 1 && b >= 1 && a <= n && b <= n)) throw new Error(`bad version ${version} for ${n} key_parts`);
  const key = Buffer.concat([b64d(pb.key_parts[a - 1]), b64d(pb.key_parts[b - 1])]);
  if (key.length !== 32) throw new Error(`key length ${key.length}`);
  const iv = b64d(pb.iv), ct = b64d(pb.payload);
  const d = nodecrypto.createDecipheriv("aes-256-gcm", key, iv);
  d.setAuthTag(ct.subarray(ct.length - 16));
  const pl = JSON.parse(Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]).toString("utf8"));

  const src = (pl.sources || [])[0];
  if (!src || !src.url) throw new Error("decrypted payload has no sources");
  console.log(`[static] clean url in ${Date.now() - t0}ms: ${src.url.slice(0, 90)}…`);
  return {
    ok: true,
    source: "primesrc-clean",
    type: src.url.includes(".mp4") ? "mp4" : "hls",
    url: src.url,
    label: src.label || null,
    server: "Filemoon",
    code,
    expiresAt: pl.expires_at || new Date(Date.now() + 3 * 3600 * 1000 - 10 * 60 * 1000).toISOString(),
  };
}

// ---- browser: ONLY the /l link harvest (key→code), one-time per key ---------------
let ctxPromise = null;

async function getResolverCtx() {
  if (!ctxPromise) {
    ctxPromise = (async () => {
      const brave = BRAVE_PATHS.find((p) => fs.existsSync(p));
      if (!brave) throw new Error("Brave not found for resolver browser");
      console.log(`[browser] launching persistent context in ${PROFILE}`);
      const ctx = await pw.chromium.launchPersistentContext(PROFILE, {
        executablePath: brave,
        headless: false, // Turnstile/managed challenge only passes on-screen
        args: ["--no-first-run", "--no-default-browser-check", "--window-size=1100,720", "--window-position=60,60", "--autoplay-policy=no-user-gesture-required"],
        viewport: null,
        ignoreHTTPSErrors: true,
      });
      console.log("[browser] context up");
      ctx.on("close", () => { ctxPromise = null; });
      return ctx;
    })().catch((err) => { ctxPromise = null; throw err; });
  }
  return ctxPromise;
}

let lock = Promise.resolve();
const withLock = (fn) => {
  const run = lock.then(fn, fn);
  lock = run.catch(() => {});
  return run;
};

// NOTE: /api/v1/l is Cloudflare managed-challenge protected; our bare fetch gets
// 403 "Just a moment…", and an in-page XHR never triggers the solver. A TOP-LEVEL
// navigation does: the managed challenge runs, and the post-clearance reload
// returns the JSON body {link, host…}. Top-level clearing requires an on-screen
// window (verified: offscreen parking never clears).
async function harvest_LINK(key) {
  const cached = codes[key];
  if (cached) return cached;
  return withLock(async () => {
    const ctx = await getResolverCtx();
    const page = await ctx.newPage();
    const mine = [page];
    const lUrl = `https://primesrc.me/api/v1/l?key=${encodeURIComponent(key)}`;
    let linkInfo = null;
    page.on("response", async (resp) => {
      try {
        const u = resp.url();
        if (/api\/v1\/l\?/.test(u) && resp.status() === 200) {
          const body = await resp.text().catch(() => "");
          if (body.includes('"link"')) {
            linkInfo = JSON.parse(body);
            console.log(`  /l(top) → ${linkInfo.host} :: ${String(linkInfo.link).slice(0, 90)}`);
          }
        } else if (/api\/v1\/l\?/.test(u)) {
          console.log(`  /l → ${resp.status()} (challenge page)`);
        }
      } catch {/* cross-frame */}
    });

    console.log(`[browser] top-level navigating ${lUrl.slice(28, 60)}… (challenge, on-screen)`);
    await page.setViewportSize({ width: 1100, height: 700 }).catch(() => {});
    await page.goto(lUrl, { waitUntil: "commit", timeout: 60000 }).catch(() => {});
    for (let i = 0; i < 30 && !linkInfo; i++) {
      await sleep(4000);
      if (i === 5) {
        // reload nudge in case the meta-refresh stalled
        await page.reload({ waitUntil: "commit", timeout: 60000 }).catch(() => {});
      }
    }
    for (const p of ctx.pages()) { if (!mine.includes(p)) await p.close().catch(() => {}); }
    await page.close().catch(() => {});
    if (!linkInfo) throw new Error(`/l harvest failed for key ${key} (challenge)`);
    codes[key] = { link: linkInfo.link, host: linkInfo.host, ts: Date.now(), code: codeFromLink(linkInfo.link) };
    saveCodes();
    return codes[key];
  });
}

function codeFromLink(link) {
  // host page url forms: https://bysejikuar.com/e/<code>/<slug>
  const m = String(link).match(/\/e\/([A-Za-z0-9]+)/);
  if (m) return m[1];
  return String(link);
}

// ---- cache + endpoints -----------------------------------------------------------
function cacheGet(key) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.result;
  if (hit) cache.delete(key);
  return null;
}
function cachePut(key, result) {
  cache.set(key, { ts: Date.now(), result });
  if (cache.size > 300) {
    const now = Date.now();
    for (const [k, v] of cache) if (now - v.ts > CACHE_TTL) cache.delete(k);
  }
}

const server = http.createServer((req, res) => {
  const cors = { "access-control-allow-origin": "*", "access-control-expose-headers": "Content-Type" };
  const finish = (status, body, extra = {}) => {
    res.writeHead(status, { "content-type": "application/json", ...cors, ...extra });
    res.end(JSON.stringify(body));
  };
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/health") {
    return finish(200, { ok: true, service: "primesrc-resolver", cacheEntries: cache.size, codesKnown: Object.keys(codes).length, browserUp: !!ctxPromise });
  }

  if (url.pathname === "/servers") {
    const type = url.searchParams.get("type") === "tv" ? "tv" : "movie";
    const id = url.searchParams.get("tmdb") || url.searchParams.get("id");
    if (!id) return finish(400, { error: "tmdb= required" });
    fetchServers(type, id, url.searchParams.get("s"), url.searchParams.get("e"))
      .then((d) => finish(200, { ok: true, info: d.info, servers: (d.servers || []).map((x, i) => ({ index: i, name: x.name, file: x.file_name, key: x.key })) }))
      .catch((e) => finish(502, { error: e.message }));
    return;
  }

  if (url.pathname === "/resolve") {
    const codeDirect = url.searchParams.get("code");
    const parent = url.searchParams.get("parent");
    const type = url.searchParams.get("type") === "tv" ? "tv" : "movie";
    const id = url.searchParams.get("tmdb") || url.searchParams.get("id");
    const s = url.searchParams.get("s");
    const e = url.searchParams.get("e");
    const prefer = url.searchParams.get("server") || undefined;
    const idxRaw = url.searchParams.get("index");
    const index = idxRaw != null ? Number(idxRaw) : undefined;

    // (a) direct static resolve — zero browser involvement
    if (codeDirect) {
      const key = `code:${codeDirect}`;
      const hit = cacheGet(key);
      if (hit) return finish(200, { ...hit, cached: true, cacheKey: key });
      resolveStatic({ code: codeDirect, parent })
        .then((r) => { cachePut(key, r); finish(200, { ...r, cached: false, cacheKey: key }); })
        .catch((err) => { console.error("[resolve/code] FATAL:", err.message); finish(502, { error: err.message }); });
      return;
    }

    if (!id) return finish(400, { error: "tmdb= required (or provide code=)" });
    const key = `${type}:${id}:${s ?? ""}:${e ?? ""}:${prefer ?? index ?? 0}`;
    const hit = cacheGet(key);
    if (hit) return finish(200, { ...hit, cached: true, cacheKey: key });

    (async () => {
      try {
        const listing = await fetchServers(type, id, s, e);
        const servers = (listing?.servers || []);
        if (!servers.length) throw new Error("PrimeSrc has no servers for this title");
        let idx = index ?? 0;
        if (prefer) { const f = servers.findIndex((x) => (x.name || "").toLowerCase() === prefer.toLowerCase()); if (f >= 0) idx = f; }
        // prefer Filemoon servers (static chain proven)
        const fmIdxs = servers.map((x, i) => i).filter((i) => /filemoon/i.test(servers[i].name || ""));
        const order = [...new Set([idx, ...fmIdxs.filter((i) => i !== idx), ...servers.map((_, i) => i)])].slice(0, 5);

        const errs = [];
        for (const attempt of order) {
          const sv = servers[attempt];
          if (!sv?.key) continue;
          try {
            if (!codes[sv.key]) await harvest_LINK(sv.key);
            const c = codes[sv.key];
            const r = await resolveStatic({ code: c.code, parent: c.link });
            cachePut(key, r);
            return finish(200, { ...r, cached: false, cacheKey: key, primesrcKey: sv.key, fileNames: sv.file_name });
          } catch (err) {
            errs.push(`${sv.name}@${sv.key}: ${err.message}`);
          }
        }
        throw new Error("all server attempts failed: " + errs.join(" | "));
      } catch (err) {
        console.error("[resolve] FATAL:", err.message);
        finish(502, { error: err.message });
      }
    })();
    return;
  }

  finish(404, { error: "unknown route (use /resolve, /servers, /health)" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[primesrc-resolver] up on http://127.0.0.1:${PORT}`);
  console.log(`[primesrc-resolver] static chain (browserless) primary; browser only for /l link harvest — ${Object.keys(codes).length} codes cached`);
});
