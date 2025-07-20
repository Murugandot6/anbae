import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to get a random, healthy server from the official list
async function getRandomRadioServer(): Promise<string> {
  try {
    // This URL provides a list of all active servers.
    const res = await fetch('https://all.api.radio-browser.info/json/servers');
    if (!res.ok) {
      throw new Error('Could not fetch server list');
    }
    const servers: { name: string }[] = await res.json();
    if (servers.length === 0) {
      throw new Error('Server list is empty');
    }
    // Pick a random server from the list to distribute requests.
    const randomServer = servers[Math.floor(Math.random() * servers.length)];
    return `https://${randomServer.name}`;
  } catch (error) {
    console.error("Failed to get a random radio server, falling back to default.", error.message);
    // Fallback to the main DNS resolver if fetching the list fails for any reason.
    return 'https://api.radio-browser.info';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint } = await req.json();

    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Endpoint is required in the request body.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get a dynamic server URL for this request
    const apiBaseUrl = await getRandomRadioServer();
    const apiUrl = `${apiBaseUrl}/json/${endpoint}`;
    
    const response = await fetch(apiUrl, { 
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'AnbaeApp/1.0 (Supabase Edge Function)'
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Edge function error:", error.message);
    return new Response(JSON.stringify({ error: `An error occurred in the proxy function: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});