// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

// Satisfy local browser/Vite TypeScript compiler for Deno environment globals
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight options request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log("[vyla-proxy] Proxying streaming request:", req.url);

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type') || 'movie'; // 'movie' or 'tv'
    const season = url.searchParams.get('s') || '1';
    const episode = url.searchParams.get('e') || '1';

    if (!id) {
      console.error("[vyla-proxy] Validation error: Missing movie/show ID parameter");
      return new Response(JSON.stringify({ error: "Missing required 'id' parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Securely retrieve the Vyla API key from Supabase Edge Secrets with the verified key as default
    const apiKey = Deno.env.get("VYLA_API_KEY") || "Y8vR2mPq7XnL4sKb9HdE5ZwT1cFa6JuQxNs8Mg3Lp";
    const vylaBaseUrl = "https://boysism-vyla.hf.space";

    let targetVylaUrl = "";
    if (type === 'tv') {
      targetVylaUrl = `${vylaBaseUrl}/tv?id=${id}&s=${season}&e=${episode}`;
    } else {
      targetVylaUrl = `${vylaBaseUrl}/movie?id=${id}`;
    }

    console.log(`[vyla-proxy] Handshaking streaming pipe with Vyla: ${targetVylaUrl}`);

    const response = await fetch(targetVylaUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[vyla-proxy] Vyla Space returned error status ${response.status}: ${errText}`);
      return new Response(JSON.stringify({ error: `Vyla source returned status ${response.status}`, details: errText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Forward the stream body directly back to the browser as a Server-Sent Events stream
    return new Response(response.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (err: any) {
    console.error("[vyla-proxy] Internal proxy exception:", err);
    return new Response(JSON.stringify({ error: "Internal Proxy Error", message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
})