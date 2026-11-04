// Cloudflare Worker that serves provider pages with their frame headers
// removed (and, for some providers, their ad machinery patched out).
// Deploy with: cd cloudflare/embed-proxy && npx wrangler deploy
export const EMBED_PROXY_BASE = "https://embed-proxy.imurugan.workers.dev";
