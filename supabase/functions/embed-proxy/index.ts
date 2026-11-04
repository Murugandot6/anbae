// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Satisfy local browser/Vite TypeScript compiler for Deno environment globals
declare const Deno: {
  env: { get(key: string): string | undefined };
};

// ============================================================================
// embed-proxy — serves streaming-provider embed pages with their ad machinery
// stripped, based on static REA evidence gathered from the provider bundles.
//
// Route:  /functions/v1/embed-proxy/{provider}/{...upstreamPath}?{query}
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Provider {
  origin: string;
  // Byte-level replacements applied to every text response (HTML + JS).
  // Each entry comes from static evidence in the provider's shipped bundle.
  patches?: [string, string][];
}

const PROVIDERS: Record<string, Provider> = {
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
      // Evidence (vidsrc_su_bundle.js): const V=()=>{ if(m) { window.top
      //   && window.top!==window ? window.top.location.replace(m) : ...
      //   with m = d.get("backbutton") } } — "back button" monetization
      //   that replaces the EMBEDDER's whole tab. Renaming the query key
      //   makes the redirect unreachable regardless of who passes it.
      ['get("backbutton")', 'get("__backbutton_neutralized")'],
    ],
  },
  vidfast: { origin: "https://vidfast.vc" },        // vidfast.pro 301s here (verified live)
  vidcore: { origin: "https://vidcore.io" },        // vidcore.net 301s here (verified live)
  vidlink: { origin: "https://vidlink.pro" },
  vidsrc-rip: { origin: "https://vidsrc.rip" },
  vidlux: { origin: "https://vidlux.xyz" },
  cinesrc: { origin: "https://cinesrc.st" },        // tv: /embed/tv/{id}?season=&episode= (per docs)
  vidnest: { origin: "https://vidnest.fun" },
  vidrock: { origin: "https://vidrock.net" },
  vidup: { origin: "https://vidup.to" },
  vidzen: { origin: "https://vidzen.fun" },
  vidflix: { origin: "https://vidflix.club" },
  "2embed": { origin: "https://www.2embed.cc" },    // movie /embed/{id}, tv /embedtv/{id}?s=&e=
  thisiscinema: { origin: "https://thisiscinema.pages.dev" }, // AeonWatch
  vidzee: { origin: "https://vidzee.wtf" },          // flaky (520 at check time), kept
  vixsrc: { origin: "https://vixsrc.to" },           // CF challenge server-side; kept for browser pass-through
  multiembed: { origin: "https://multiembed.mov" },  // CF challenge server-side; kept
};

// Patterns for <script src=...> tags stripped from proxied HTML regardless of
// provider — covers ad loaders that are injected server-side or added later.
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
];

// Script injected at the very top of <head> of proxied HTML pages. It runs
// before the provider's own code and neutralizes the ad classes that survive
// byte-patching: popup/under windows, late-injected ad scripts, and the
// backbutton redirect parameter.
const NEUTRALIZER = `<script>(function(){
  try {
    // Scrub the backbutton monetization param (vidsrc evidence) from the URL
    // so any later URLSearchParams read sees nothing.
    if (location.search.indexOf("backbutton") !== -1) {
      var u = new URL(location.href);
      ["backbutton","back_button","backbtn"].forEach(function(k){ u.searchParams.delete(k); });
      history.replaceState(null, "", u.toString());
    }
    // Popup guard: cross-origin window.open becomes a no-op.
    var open = window.open;
    window.open = function (url) {
      try {
        if (!url) return null;
        var target = new URL(String(url), location.href);
        if (target.origin !== location.origin) return null;
        return open.apply(window, arguments);
      } catch (e) { return null; }
    };
    // MutationObserver: the provider's late-loaded code cannot re-add the
    // ad loaders we stripped, nor inject cross-origin ad iframes.
    var AD = /scripts\\/ab\\.js|adstag|popads|propellerads|monetag|adsterra|exoclick|juicyads|clickadu|hilltopads|mgid|revcontent|taboola|doubleclick|googlesyndication/i;
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

// Content-Security-Policy for proxied HTML: scripts may only come from the
// proxy origin itself (plus inline/eval, which the Next.js bundles need).
// Cross-origin ad script hosts are dead even if new ones appear.
function cspFor(selfOrigin: string): string {
  return [
    "default-src 'self' https: http: data: blob: mediastream:",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${selfOrigin}`,
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' data: blob: https: http: mediastream:",
    "connect-src 'self' https: http: data: blob: ws: wss:",
    "font-src 'self' data: https:",
    "frame-src *",
    "frame-ancestors *",
  ].join("; ");
}

function rewriteAbsoluteUrls(text: string, provider: string, proxyBase: string): string {
  // Root-absolute asset references must resolve against the proxy, not the
  // proxy host root. Limited to known-safe prefixes to avoid corrupting
  // unrelated string literals.
  const prefixes = ["/_next/", "/assets/", "/static/", "/scripts/", "/js/", "/css/"];
  let out = text;
  for (const p of prefixes) {
    out = out.split(`"${p}`).join(`"${proxyBase}/${p.slice(1)}`);
    out = out.split(`'${p}`).join(`'${proxyBase}/${p.slice(1)}`);
    // Escaped form inside inline JSON (__NEXT_DATA__ / buildManifest)
    out = out.split(`\\"${p}`).join(`\\"${proxyBase}/${p.slice(1)}`);
    out = out.split(`\\/${p.slice(1)}`).join(`\\/${proxyBase}/${p.slice(1)}`);
  }
  return out;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Path shape: /functions/v1/embed-proxy/{provider}/{...rest}
    const m = url.pathname.match(/\/embed-proxy\/([^/]+)\/?(.*)$/);
    if (!m) {
      return new Response(JSON.stringify({ error: "Missing provider/path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const providerName = m[1].toLowerCase();
    const provider = PROVIDERS[providerName];
    if (!provider) {
      return new Response(JSON.stringify({ error: `Unknown provider: ${providerName}` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const rest = m[2] || "";
    const proxyBase = `${url.origin}${url.pathname.split("/embed-proxy/")[0]}/embed-proxy/${providerName}`;

    // Strip backbutton monetization params before forwarding (vidsrc evidence).
    const query = new URLSearchParams(url.search);
    ["backbutton", "back_button", "backbtn"].forEach((k) => query.delete(k));
    const qs = query.toString();

    const upstreamUrl = `${provider.origin}/${rest}${qs ? `?${qs}` : ""}`;

    const upstream = await fetch(upstreamUrl, {
      method: req.method === "OPTIONS" ? "GET" : req.method,
      headers: {
        "User-Agent": req.headers.get("user-agent") || "Mozilla/5.0",
        "Accept": req.headers.get("accept") || "*/*",
        "Accept-Language": req.headers.get("accept-language") || "en-US,en;q=0.9",
        "Referer": `${provider.origin}/`,
      },
      redirect: "follow",
    });

    const contentType = upstream.headers.get("content-type") || "";
    const isHtml = contentType.includes("text/html");
    const isJs = /javascript|ecmascript/.test(contentType);

    if (!isHtml && !isJs) {
      // Media, manifests, images, etc. pass through untouched.
      const headers = new Headers(upstream.body ? undefined : corsHeaders);
      if (contentType) headers.set("Content-Type", contentType);
      for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
      headers.set("Cache-Control", "public, max-age=300");
      return new Response(upstream.body, { status: upstream.status, headers });
    }

    let text = await upstream.text();

    // 1. Evidence-backed byte patches (provider bundles).
    for (const [from, to] of provider.patches || []) {
      text = text.split(from).join(to);
    }

    if (isJs) {
      // 2. Keep Next.js chunk/data fetches on the proxy.
      text = rewriteAbsoluteUrls(text, providerName, proxyBase);
      const headers = new Headers();
      headers.set("Content-Type", contentType);
      for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
      headers.set("Cache-Control", "public, max-age=600");
      return new Response(text, { status: upstream.status, headers });
    }

    // 3. HTML: strip ad script tags by pattern.
    text = text.replace(/<script[^>]*\bsrc=["'][^"']*["'][^>]*>\s*<\/script>/gi, (tag) =>
      AD_SRC_PATTERNS.some((p) => p.test(tag)) ? "" : tag
    );

    // 4. HTML: rewrite root-absolute asset references to the proxy.
    text = rewriteAbsoluteUrls(text, providerName, proxyBase);

    // 5. Inject the neutralizer as the first thing in <head>.
    text = text.replace(/<head([^>]*)>/i, `<head$1>${NEUTRALIZER}`);
    if (!/<head[^>]*>/i.test(text)) text = NEUTRALIZER + text;

    const headers = new Headers();
    headers.set("Content-Type", "text/html; charset=utf-8");
    for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
    headers.set("Content-Security-Policy", cspFor(url.origin));
    headers.set("Cache-Control", "no-store");
    return new Response(text, { status: upstream.status, headers });
  } catch (error: any) {
    console.error("[embed-proxy] failure:", error?.message || error);
    return new Response(JSON.stringify({ error: "Upstream fetch failed" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
