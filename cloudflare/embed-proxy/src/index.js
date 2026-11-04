// ============================================================================
// embed-proxy (Cloudflare Worker)
// Serves streaming-provider embed pages with their ad machinery stripped,
// based on static REA evidence gathered from the provider bundles.
//
// Route:  /{provider}/{...upstreamPath}?{query}
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROVIDERS = {
  videasy: {
    origin: "https://player.videasy.net",
    patches: [
      // Evidence (videasy_app.js): component O() injects the ad loader
      //   [{id:"adstag-gk",src:"/scripts/ab.js"}].forEach(...)
      // Emptying the array removes the loop while keeping the bundle valid.
      ['[{id:"adstag-gk",src:"/scripts/ab.js"}]', "[]"],
      // Fallback if the bundle changes shape slightly: kill the loader path.
      ['src:"/scripts/ab.js"', 'src:"data:text/javascript,"'],
      // Evidence (videasy_app.js): next/script loads
      //   https://users.videasy.to/api/script.js data-site-id="2"
      // Point it at a no-op so the beacon never resolves.
      ["https://users.videasy.to/api/script.js", "data:text/javascript,"],
    ],
  },
  vidsrc: {
    origin: "https://vidsrc.su",
    patches: [
      // Evidence (vidsrc_su_bundle.js): top-frame redirect via
      //   m = d.get("backbutton") — "back button" monetization that replaces
      //   the EMBEDDER's whole tab. Renaming the query key makes the
      //   redirect unreachable regardless of who passes it.
      ['get("backbutton")', 'get("__backbutton_neutralized")'],
      // Evidence (vidsrc_su_bundle.js, ct= function): the TMDB API base is
      // derived from the page hostname ("themoviedb." + last two labels),
      // with a localhost escape hatch. Under the proxy it would resolve to
      // themoviedb.workers.dev (not theirs). Force the localhost branch so
      // the pinned real host is used.
      ['"localhost"===e||"127.0.0.1"===e', "!0"],
      // Their API host does not send CORS headers for foreign origins, so
      // route every call through this worker as a same-origin relative URL
      // (the r/ passthrough below fetches it server-side).
      ["https://themoviedb.vidsrc.su", "/vidsrc/r/themoviedb.vidsrc.su"],
    ],
  },
  vidfast: { origin: "https://vidfast.vc" },        // vidfast.pro 301s here (verified live)
  vidcore: { origin: "https://www.vidcore.org" },   // evidence (vidcore docs, 2026-11-01): embed moved to vidcore.org — .io router 404s all embed paths
  nxsha: {
    origin: "https://nxsha.space",          // back online 2026-10-31 on .space (old .app dead)
    // No provider-specific patches needed: the getAssetPrefix freeze is fixed
    // generically in rewriteAbsoluteUrls (indexOf restoration).
  },
  "vidsrc-rip": { origin: "https://vidsrc.rip" },
  vidlux: { origin: "https://vidlux.xyz" },
  vidnest: {
    origin: "https://vidnest.fun",
    patches: [
      // Evidence (vidnest bundle, probed 2026-10-31): hardcoded popunder URL
      // opened via window.open on first interaction.
      ['window.open("https://hai8g.com/4/11335980","_blank")', "null"],
      ["hai8g.com", "patched.invalid"],
    ],
  },
  vidlink: {
    origin: "https://vidlink.pro",
    // Third-party player libraries the page must load (routed via r/), plus the
    // stream CDN: its DASH segments are fetched with XHR and send no
    // Access-Control-Allow-Origin, so from the proxied page every request fails
    // with a CORS error and the player never leaves its spinner (evidence:
    // live proxied page, 2026-11-04 — surge.flooderrr.store init-stream*.m4s).
    remoteHosts: ["cdn.jwplayer.com", "surge.flooderrr.store"],
    patches: [
      // Evidence (vidlink bundle, probed 2026-10-31): popup system with
      // "last_tab_opened" event cooldown opens tab-unders via window.open.
      // The runtime popup guard also covers this; the byte patch kills the
      // call site itself.
      ['window.open(e,"_blank","noopener,noreferrer")', "null"],
      // Evidence (vidlink asset_13): fetch("/fu.wasm") — the fingerprint WASM
      // sits at the origin root, outside the standard asset prefixes. Without
      // rewriting it the fingerprint never loads and the data layer stalls at
      // "FETCHING DATA" forever (the /api/b/... call needs the fingerprint id).
      ['fetch("/fu.wasm")', 'fetch("{PROXY}/fu.wasm")'],
      // Evidence (live vidlink page, 2026-10-31): the player engine is JW
      // Player loaded from cdn.jwplayer.com. Serving it direct violates our
      // CSP; route it through the r/ passthrough instead.
      ["https://cdn.jwplayer.com", "{PROXY}/r/cdn.jwplayer.com"],
      ["https://adexchangerapid.com", "patched.invalid"],
    ],
  },
  cinesrc: {
    origin: "https://cinesrc.st",
    patches: [
      // Evidence (cinesrc bundle, probed 2026-10-31): analytics beacon on
      // a2.cineflix.st with data-site-id, plus an embedded popunder config
      // (window.open runtime-guarded by the neutralizer).
      ["https://a2.cineflix.st/api/script.js", "data:text/javascript,"],
    ],
  },
  vidrock: { origin: "https://vidrock.net" },
  vidup: { origin: "https://vidup.to" },
  vidzen: { origin: "https://vidzen.fun" },
  vidflix: { origin: "https://vidflix.club" },
  "2embed": { origin: "https://www.2embed.cc" },    // movie /embed/{id}, tv /embedtv/{id}?s=&e=
  thisiscinema: { origin: "https://thisiscinema.pages.dev" }, // AeonWatch
  vidzee: { origin: "https://vidzee.wtf" },          // flaky (520 at check time), kept
  vixsrc: { origin: "https://vixsrc.to" },           // CF challenge server-side; kept for browser pass-through
  multiembed: { origin: "https://multiembed.mov" },  // CF challenge server-side; kept
  // NetMirror (netmirror.plus) player host.
  //
  // netmirror.plus itself is not proxied: its HTML answers 403 to Cloudflare
  // Worker egress (verified 2026-11-03 from the SIN colo; the same URL is 200
  // from a normal client), and it sends x-frame-options: SAMEORIGIN anyway.
  // The signed player page on webvp.watch21.shop has no frame headers but
  // checks the Referer against an allowlist that does not contain our origins,
  // so the player and its nested watchcinemo page are served through here
  // (the worker sets Referer to the upstream origin).
  "netmirror-player": {
    origin: "https://webvp.watch21.shop",
    remoteHosts: ["cdn.jsdelivr.net"],
    patches: [
      // watchcinemo.php loads Artplayer/hls.js/dash.js from jsdelivr. Route
      // them through r/ so the page CSP can stay strict (script-src 'self').
      ["https://cdn.jsdelivr.net", "{PROXY}/r/cdn.jsdelivr.net"],
    ],
  },
};

// Patterns for <script src=...> tags stripped from proxied HTML regardless of
// provider — covers ad loaders injected server-side or added later.
const AD_SRC_PATTERNS = [
  /\/scripts\/ab\.js/i,
  /adstag/i,
  /popads?\.net/i,
  /propellerads/i,
  /monetag/i,
  /adsterra/i,
  /exoclick/i,
  /juicyads/i,
  /clickadu/i,
  /hilltopads/i,
  /mgid\.com/i,
  /revcontent/i,
  /taboola\.com/i,
  /doubleclick\.net/i,
  /googlesyndication\.com/i,
  /alchemmauls/i,
  /hexa\.su/i,
  /meatusbyway/i,
  /imprevuaknowleered/i,
  /hai8g\.com/i,
  /cineflix\.st\/api\/script/i,
  /brightadnetwork/i,
];

// Injected at the very top of <head> of proxied HTML pages. Runs before the
// provider's own code and:
//   1. strips the /{provider} path prefix via history.replaceState so client
//      side routers (React Router etc.) see their original routes — the app
//      would otherwise 404 internally and mount an empty <div id="root">;
//   2. scrubs the backbutton monetization param;
//   3. guards popup/under windows;
//   4. removes late-injected ad scripts/iframes.
const NEUTRALIZER = (provider) => {
  // Stream hosts rewritten at call time (see 0b below). vidlink's DASH
  // segments live on a CDN that sends no CORS headers for our origin.
  const STREAM_HOSTS = provider === "vidlink" ? ["surge.flooderrr.store"] : [];
  return `<script>(function(){
  try {
    // 0. Debug capture: boot errors + CSP violations land in window.__proxyErrs
    window.__proxyErrs = [];
    window.addEventListener('error', function (e) {
      window.__proxyErrs.push('error: ' + (e.message || e.type) + (e.filename ? ' @ ' + e.filename.split('/').pop() + ':' + e.lineno : ''));
    });
    window.addEventListener('unhandledrejection', function (e) {
      window.__proxyErrs.push('rejection: ' + String(e.reason && e.reason.message || e.reason).slice(0, 800));
    });
    window.addEventListener('securitypolicyviolation', function (e) {
      window.__proxyErrs.push('csp: ' + e.violatedDirective + ' blocked ' + String(e.blockedURL).slice(0, 100));
    });
    // Fetch logger: records every request the page attempts (before any
    // provider wrapper), for diagnosing stalls.
    window.__fetchLog = [];
    // 0b. Stream-CDN rewrite (evidence: vidlink proxied, 2026-11-04): its DASH
    // segments are fetched with XHR from surge.flooderrr.store, which sends no
    // Access-Control-Allow-Origin for our origin, so every segment fails and
    // the player stays on its spinner. Rewrite those URLs onto the r/
    // passthrough at call time. The bundle's own base constant is left intact
    // on purpose — replacing it breaks the catalog request as well (verified:
    // the page then reports "We Couldn't Find This Content").
    var __streamHosts = ${JSON.stringify(STREAM_HOSTS)};
    var __proxyBase = location.origin + "/${provider}";
    window.__streamLog = [];
    var __rw = function (u) {
      try {
        var s = String(u);
        for (var i = 0; i < __streamHosts.length; i++) {
          var h = __streamHosts[i];
          if (s.indexOf("https://" + h) === 0 || s.indexOf("//" + h) === 0) {
            if (window.__streamLog.length < 50) window.__streamLog.push(s);
            var tail = s.indexOf("https://" + h) === 0 ? s.slice(8 + h.length) : s.slice(2 + h.length);
            return __proxyBase + "/r/" + h + tail;
          }
        }
      } catch (e) {}
      return u;
    };
    // Debug dump (?debugstream=1): expose the original signed CDN URLs in the
    // document so they can be inspected without devtools.
    if (location.search.indexOf("debugstream") !== -1) {
      setInterval(function () {
        try {
          var d = document.getElementById("__dbgstream");
          if (!d) {
            d = document.createElement("pre");
            d.id = "__dbgstream";
            d.style.cssText = "position:fixed;left:0;bottom:0;z-index:2147483647;font-size:9px;line-height:1.2;color:#0f0;background:#000;max-width:100%;white-space:pre-wrap;word-break:break-all";
            document.body.appendChild(d);
          }
          d.textContent = (window.__streamLog || []).slice(-2).join("\\n");
        } catch (e) {}
      }, 2000);
    }
    try {
      var __xhrOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (m, u) {
        var a = [].slice.call(arguments);
        a[1] = __rw(u);
        return __xhrOpen.apply(this, a);
      };
    } catch (e) {}
    var __origFetch = window.fetch;
    window.fetch = function () {
      var __a = [].slice.call(arguments);
      try {
        window.__fetchLog.push(String(__a[0] && __a[0].url || __a[0]).slice(0, 220));
      } catch (e) {}
      if (__a[0]) __a[0] = __rw(__a[0]);
      return __origFetch.apply(this, __a);
    };
    // 1. Restore the original path for client-side routing.
    try {
      var pm = location.pathname.match(/^\\/${provider}\\/(\\/.*)$/);
      if (pm) history.replaceState(null, "", pm[1] + location.search);
    } catch (e) {}
    // 2. Scrub the backbutton monetization param (vidsrc evidence).
    if (location.search.indexOf("backbutton") !== -1) {
      var u = new URL(location.href);
      ["backbutton","back_button","backbtn"].forEach(function(k){ u.searchParams.delete(k); });
      history.replaceState(null, "", u.toString());
    }
    // 3. Popup / tab-hijack guard (aetherly-embed-guard pattern):
    //    - window.open returns a fake window (scripts think they succeeded,
    //      no real tab is created) and cross-origin opens are no-ops.
    //    - Anchor clicks targeting _blank/_top/_parent or cross-origin hrefs
    //      are silently cancelled.
    //    - Form submit and anchor.click() stubbed for the same tricks.
    //    - location.assign/replace no-op on external URLs.
    var open = window.open;
    var fakeWin = {
      closed: false,
      close: function () { this.closed = true; },
      focus: function () {}, blur: function () {},
      postMessage: function () {},
      moveTo: function () {}, resizeTo: function () {},
      location: {
        href: '', origin: '', protocol: 'https:', host: '', hostname: '',
        pathname: '/', search: '', hash: '',
        assign: function () {}, replace: function () {}, reload: function () {}
      },
      document: {
        write: function () {}, writeln: function () {},
        open: function () {}, close: function () {}
      },
      navigator: navigator,
      history: { back: function () {}, forward: function () {}, go: function () {} }
    };
    window.open = function (url) {
      try {
        if (!url) return fakeWin;
        var target = new URL(String(url), location.href);
        if (target.origin !== location.origin) return fakeWin;
        return open.apply(window, arguments);
      } catch (e) { return fakeWin; }
    };
    function isExternal(href) {
      try { var u = new URL(href, location.href); return u.origin !== location.origin; } catch (e) { return true; }
    }
    document.addEventListener('click', function (e) {
      var el = e.target;
      while (el && el !== document) {
        if (el.tagName === 'A' && el.href) {
          var t = (el.getAttribute('target') || '').toLowerCase();
          if (t === '_blank' || t === '_top' || t === '_parent' || isExternal(el.href)) {
            e.preventDefault(); e.stopImmediatePropagation && e.stopImmediatePropagation(); e.stopPropagation(); return;
          }
        }
        el = el.parentNode;
      }
    }, true);
    var origFormSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function () {
      var t = (this.getAttribute('target') || '').toLowerCase();
      if (t === '_blank' || t === '_top' || t === '_parent') return;
      return origFormSubmit.apply(this, arguments);
    };
    var origAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      var t = (this.getAttribute('target') || '').toLowerCase();
      if (t === '_blank' || t === '_top' || t === '_parent') return;
      if (this.href && isExternal(this.href)) return;
      return origAnchorClick.apply(this, arguments);
    };
    try {
      var origAssign = location.assign && location.assign.bind(location);
      var origReplace = location.replace && location.replace.bind(location);
      if (origAssign) location.assign = function (u) {
        try { if (!isExternal(u)) origAssign(u); } catch (e) {}
      };
      if (origReplace) location.replace = function (u) {
        try { if (!isExternal(u)) origReplace(u); } catch (e) {}
      };
    } catch (e) {}
    // 4. MutationObserver: the provider's late-loaded code cannot re-add the
    // ad loaders we stripped, nor inject cross-origin ad iframes.
    var AD = /scripts\\/ab\\.js|adstag|popads|propellerads|monetag|adsterra|exoclick|juicyads|clickadu|hilltopads|mgid|revcontent|taboola|doubleclick|googlesyndication|alchemmauls|hexa\\.su/i;
    var sweep = function (root) {
      try {
        (root || document).querySelectorAll("script[src], iframe[src]").forEach(function (el) {
          if (AD.test(el.getAttribute("src") || "")) el.remove();
        });
      } catch (e) {}
    };
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var nodes = muts[i].addedNodes;
        for (var j = 0; j < nodes.length; j++) {
          var n = nodes[j];
          if (n.nodeType !== 1) continue;
          var s = n.getAttribute && (n.getAttribute("src") || "");
          if (s && AD.test(s)) { n.remove(); continue; }
          if (n.querySelectorAll) sweep(n);
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
    sweep(document);
  } catch (e) {}
})();</script>`;
};

// CSP for proxied HTML: scripts may only come from this worker origin itself
// (plus inline/eval, which the Next.js bundles need). Cross-origin ad script
// hosts are dead even if new ones appear.

// Vyla direct-stream resolver: returns 100% ad-free media URLs (.m3u8/.mp4)
// that the app's own HTML5 player plays — no provider iframe ever loads, so
// no provider ads, sponsor overlays, or burned watermarks can appear.
// Route: GET /resolve?id=550&type=movie|s=1|e=1 -> JSON {sources:[{label,url,type}]}
// Supabase vyla-proxy is unreachable from some networks; this worker is reliable.
const VYLA_BASE = "https://boysism-vyla.hf.space";
const VYLA_API_KEY = "Y8vR2mPq7XnL4sKb9HdE5ZwT1cFa6JuQxNs8Mg3Lp";

async function resolveViaVyla(vylaId, typ, s, e) {
  const target = typ === "tv"
    ? `${VYLA_BASE}/tv?id=${encodeURIComponent(vylaId)}&s=${encodeURIComponent(s)}&e=${encodeURIComponent(e)}`
    : `${VYLA_BASE}/movie?id=${encodeURIComponent(vylaId)}`;
  const resp = await fetch(target, {
    headers: {
      "Authorization": `Bearer ${VYLA_API_KEY}`,
      "Accept": "text/event-stream",
      "User-Agent": "Mozilla/5.0",
    },
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Vyla ${resp.status}: ${txt.slice(0, 200)}`);
  }
  const text = await resp.text();
  const sources = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("data:")) continue;
    try {
      const parsed = JSON.parse(t.slice(5).trim());
      if (parsed.type === "source" && parsed.source && parsed.source.url) {
        sources.push({
          label: parsed.source.label || parsed.source.source || "Direct",
          url: parsed.source.url,
          type: parsed.source.url.split("?")[0].toLowerCase().includes(".m3u8") ? "hls" : "mp4",
        });
      }
    } catch (err) {}
  }
  return sources;
}

function cspFor(selfOrigin) {
  return [
    "default-src 'self' https: http: data: blob: mediastream:",
    // blob: is required by player engines that spawn workers (JW Player,
    // hls.js) — evidence: vidlink stalled until blob: was allowed.
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: ${selfOrigin}`,
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' data: blob: https: http: mediastream:",
    "connect-src 'self' https: http: data: blob: ws: wss:",
    "font-src 'self' data: https:",
    "frame-src *",
    "frame-ancestors *",
  ].join("; ");
}

// Root-absolute asset references must resolve against the worker, not the
// worker host root. Limited to known-safe prefixes to avoid corrupting
// unrelated string literals.
function rewriteAbsoluteUrls(text, proxyBase) {
  // Root-absolute asset references must resolve against the worker, not the
  // worker host root. Limited to known-safe prefixes to avoid corrupting
  // unrelated string literals. /api/ is included because providers call
  // same-origin APIs that must be proxied (evidence: vidlink probed
  // 2026-10-31 — its data layer fetches /api/... and stalls without this).
  // /script.js is vidlink's Go wasm_exec shim (evidence: vidlink probed
  // 2026-10-31 — without it the fingerprint WASM cannot run).
  const prefixes = ["/_next/", "/assets/", "/static/", "/scripts/", "/js/", "/css/", "/api/", "/script.js"];
  let out = text;
  for (const p of prefixes) {
    out = out.split(`"${p}`).join(`"${proxyBase}/${p.slice(1)}`);
    out = out.split(`'${p}`).join(`'${proxyBase}/${p.slice(1)}`);
    // Escaped form inside inline JSON (__NEXT_DATA__ / buildManifest)
    out = out.split(`\\"${p}`).join(`\\"${proxyBase}/${p.slice(1)}`);
    out = out.split(`\\/${p.slice(1)}`).join(`\\/${proxyBase}/${p.slice(1)}`);
  }
  // RESTORE string comparisons the rewrite corrupts: providers embed
  // path-prefix checks in code (evidence: nxsha 2026-10-31 — Next.js
  // getAssetPrefix() does pathname.indexOf("/_next/") and the rewrite turned
  // it into indexOf("<proxy>/_next/"), which a pathname can never contain,
  // freezing the app at "ALMOST READY"). Any indexOf("prefix") literal must
  // keep comparing against the original path.
  for (const p of prefixes) {
    out = out.split(`indexOf("${proxyBase}${p}")`).join(`indexOf("${p}")`);
    out = out.split(`indexOf('${proxyBase}${p}')`).join(`indexOf('${p}')`);
  }
  return out;
}

// Generic byte patches applied to every provider's JS responses.
// Evidence: providers ship sandbox-detection blockers that refuse to play
// inside ANY sandboxed iframe (even with correct allowances):
//   - vidsrc_su_bundle.js ("Vidora" engine, __vidora_sandbox_probe__):
//       frameElement.hasAttribute("sandbox") -> blocked:sandbox-attribute
//       catch SecurityError on document.domain assignment -> blocked:domain-blocked
//   - videasy_app.js: frameElement.hasAttribute("sandbox") -> block page,
//       document.domain error message containing "sandbox" -> block page
// We keep the iframe sandbox (security layer) and disable their detectors.
const GENERIC_PATCHES = [
  ['hasAttribute("sandbox")', 'hasAttribute("data-sandbox-disabled")'],
  ['"SecurityError"===e.name', '"__patched__"===e.name'],
  ['includes("sandbox")', 'includes("__patched__")'],
  // Single-quote variants (evidence: 2embed inline sandbox detector uses
  // hasAttribute('sandbox') with single quotes).
  ["hasAttribute('sandbox')", "hasAttribute('data-sandbox-disabled')"],
  ["includes('sandbox')", "includes('__patched__')"],
  // Evidence (vidsrc.su Vite shell, served 2026-10-31): inline boot script
  // injects a popunder loader and an analytics beacon after app load.
  ["rq.alchemmauls.com", "patched.invalid"],
  ["1414.hexa.su", "patched.invalid"],
  // Evidence (live vidsrc.su page, 2026-10-31): additional tracker/redirect
  // domains called from the page at runtime. NOTE: meatusbyway.cfd is NOT
  // patched — evidence (nxsha, 2026-10-31): its data layer gates on the
  // cuid beacon and silently bails (zero app fetches) when the tracker is
  // blocked. The beacon is the provider's own flow; leave it native.
  ["imprevuaknowleered.qpon", "patched.invalid"],
  // Evidence (vidlink bundle, probed 2026-10-31): ad-network redirector.
  ["https://brightadnetwork.com", "patched.invalid"],
  // Evidence (vidlink asset_13 + vidnest asset_12, probed 2026-10/11-01):
  // sandbox detector falls through to a PDF-object probe — plugins are
  // blocked in sandboxed iframes, so t.onerror fires and renders
  // "Please Disable Sandbox". Kill the block callback; the object simply
  // fails silently and playback proceeds.
  ["t.onerror=()=>(e(),!0)", "t.onerror=()=>!1"],
];

const withCors = (headers) => {
  const h = new Headers(headers);
  for (const [k, v] of Object.entries(corsHeaders)) h.set(k, v);
  return h;
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);

      // Direct-stream resolver: /resolve?id=550&type=movie|s=1|e=1
      // Returns { sources: [{label, url, type}] } — 100% ad-free direct
      // media URLs. No provider iframe, no provider ads.
      if (url.pathname === "/resolve") {
        const id = url.searchParams.get("id");
        if (!id) {
          return new Response(JSON.stringify({ error: "Missing id" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const typ = url.searchParams.get("type") || "movie";
        const s = url.searchParams.get("s") || "1";
        const e = url.searchParams.get("e") || "1";
        try {
          const sources = await resolveViaVyla(id, typ, s, e);
          return new Response(JSON.stringify({ sources }), {
            headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: "resolve failed", details: String(err).slice(0, 200) }), {
            status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }

      const scrub = new URLSearchParams(url.search);
      ["backbutton", "back_button", "backbtn"].forEach((k) => scrub.delete(k));

      // Two routing modes:
      //  A. Prefix mode: /{provider}/{upstreamPath} — used for sub-resources
      //     (assets, API calls) rewritten by the HTML/JS rewriter.
      //  B. Clean mode: /{originalPath}?__via={provider} — used for the HTML
      //     document itself, so client-side routers (React Router etc.) see
      //     the exact original path and mount the right route.
      const pm = url.pathname.match(/^\/([^/]+)\/?(.*)$/);
      const via = (scrub.get("__via") || "").toLowerCase();
      let providerName = null;
      let rest = "";
      if (pm && pm[2] && PROVIDERS[pm[1].toLowerCase()]) {
        providerName = pm[1].toLowerCase();
        rest = pm[2];
      } else if (via && PROVIDERS[via]) {
        providerName = via;
        rest = url.pathname.slice(1);
      } else {
        // Fallback: subresources requested with root-absolute paths whose
        // string literals the JS rewriter could not catch (split literals
        // like "/api" + "/servers") carry the page URL in Referer, which
        // contains __via. Route them against it.
        // Evidence (nxsha, 2026-10-31): /api/servers?q=... was called as a
        // relative path and 400'd at the worker root, stalling playback.
        let refVia = null;
        try {
          const ref = request.headers.get("referer");
          if (ref) refVia = (new URL(ref).searchParams.get("__via") || "").toLowerCase();
        } catch (e) {}
        if (refVia && PROVIDERS[refVia]) {
          providerName = refVia;
          rest = url.pathname.slice(1);
        }
      }
      if (!providerName) {
        return new Response(
          JSON.stringify({
            error: "Missing provider/path",
            usage: "/{provider}/{path} or /{path}?__via={provider}",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const provider = PROVIDERS[providerName];
      // Scrub params that must never reach upstream: __via (routing), the
      // backbutton monetization keys, and our own _v cache-buster (some
      // providers reject unknown query params on static assets — vidlux 400s).
      scrub.delete("__via");
      ["backbutton", "back_button", "backbtn", "_v"].forEach((k) => scrub.delete(k));
      const qs = scrub.toString();
      const proxyBase = `${url.origin}/${providerName}`;

      // r/ passthrough: /{provider}/r/{host}/{path} fetches https://{host}/{path}
      // server-side. Host allowlist: the host must be the provider origin host
      // or a subdomain of it (e.g. themoviedb.vidsrc.su under vidsrc).
      let upstreamUrl;
      const rm = rest.match(/^r\/([^/]+)\/?(.*)$/);
      if (rm) {
        const originHost = provider.origin.replace(/^https?:\/\//, "");
        const host = rm[1].toLowerCase();
        const suffixOk = host === originHost || host.endsWith("." + originHost.split(".").slice(-2).join("."));
        const remoteOk = (provider.remoteHosts || []).includes(host);
        if (!suffixOk && !remoteOk) {
          return new Response(JSON.stringify({ error: `Host not allowed: ${host}` }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        upstreamUrl = `https://${host}/${rm[2]}${qs ? `?${qs}` : ""}`;
      } else {
        upstreamUrl = `${provider.origin}/${rest}${qs ? `?${qs}` : ""}`;
      }

      // Forward the browser's own headers upstream (minus hop-by-hop and
      // address-specific ones). Providers gate some endpoints on headers the
      // page computes (e.g. vidsrc's x-fingerprint-lite from their WASM).
      const fwd = new Headers();
      const skip = new Set([
        "host", "connection", "content-length", "accept-encoding",
        "referer", "origin", "cookie", "cf-connecting-ip", "cf-ipcountry",
        "cf-ray", "cf-visitor", "x-forwarded-for", "x-forwarded-proto",
        "x-real-ip", "cdn-loop",
      ]);
      for (const [k, v] of request.headers.entries()) {
        if (!skip.has(k.toLowerCase())) fwd.set(k, v);
      }
      fwd.set("User-Agent", request.headers.get("user-agent") || "Mozilla/5.0");
      fwd.set("Accept", request.headers.get("accept") || "*/*");
      fwd.set("Accept-Language", request.headers.get("accept-language") || "en-US,en;q=0.9");
      fwd.set("Referer", `${provider.origin}/`);

      const upstream = await fetch(upstreamUrl, {
        method: request.method === "HEAD" ? "GET" : request.method,
        headers: fwd,
        redirect: "follow",
      });

      const contentType = upstream.headers.get("content-type") || "";
      const isHtml = contentType.includes("text/html");
      const isJs = /javascript|ecmascript/.test(contentType);

      if (!isHtml && !isJs) {
        // Media, manifests, images, etc. pass through untouched.
        const headers = withCors(upstream.headers);
        headers.set("Cache-Control", "public, max-age=300");
        return new Response(upstream.body, { status: upstream.status, headers });
      }

      let text = await upstream.text();

      // 1. Evidence-backed byte patches (provider bundles + generic detectors),
      //    applied to HTML and JS alike. {PROXY} in a replacement expands to
      //    this provider's proxy base URL.
      //    The dynamic origin patch comes first: several providers hard-code
      //    their own origin in boot invariants and asset URLs (evidence:
      //    nxsha 2026-10-31 — "Invariant: Expected document.currentScript src
      //    to contain 'https://nxsha.space/_next/'" froze the app under the
      //    proxy). Rewriting their origin to the proxy base makes those
      //    checks pass and keeps absolute self-references proxied.
      for (const [fromRaw, to] of [
        [provider.origin, "{PROXY}"],
        ...(provider.patches || []),
        ...GENERIC_PATCHES,
      ]) {
        // {PROXY} may appear in the FROM too (dynamic runtime-built checks).
        const from = fromRaw.replace("{PROXY}", proxyBase);
        text = text.split(from).join(to.replace("{PROXY}", proxyBase));
      }

      if (isJs) {
        // 2. Keep Next.js chunk/data fetches on the worker.
        text = rewriteAbsoluteUrls(text, proxyBase);
        const headers = withCors({ "Content-Type": contentType });
        // no-store: patched bundles must never be served stale from a browser
        // cache after a deploy (byte patches are the ad/redirect defense).
        headers.set("Cache-Control", "no-store");
        return new Response(text, { status: upstream.status, headers });
      }

      // 3. HTML: strip ad script tags by pattern.
      text = text.replace(/<script[^>]*\bsrc=["'][^"']*["'][^>]*>\s*<\/script>/gi, (tag) =>
        AD_SRC_PATTERNS.some((p) => p.test(tag)) ? "" : tag
      );

      // 4. HTML: rewrite root-absolute asset references to the worker.
      // (No cache-busting query here: JS is served no-store, and several
      // providers run exact-URL boot invariants that reject query params —
      // evidence: nxsha 2026-10-31, Next.js getAssetPrefix invariant
      // "Received .../turbopack-*.js?_v=... instead".)
      text = rewriteAbsoluteUrls(text, proxyBase);

      // 5. Inject the neutralizer as the first thing in <head>.
      const neutralizer = NEUTRALIZER(providerName);
      text = text.replace(/<head([^>]*)>/i, `<head$1>${neutralizer}`);
      if (!/<head[^>]*>/i.test(text)) text = neutralizer + text;

      const headers = withCors({ "Content-Type": "text/html; charset=utf-8" });
      headers.set("Content-Security-Policy", cspFor(url.origin));
      headers.set("Cache-Control", "no-store");
      return new Response(text, { status: upstream.status, headers });
    } catch (error) {
      console.error("[embed-proxy] failure:", error?.message || error);
      return new Response(JSON.stringify({ error: "Upstream fetch failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
