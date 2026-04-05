import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { country, category } = await req.json();

    if (!country || typeof country !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'country' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("NEWSAPI_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "NEWSAPI_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build query: combine country name with category if provided
    let query = country;
    if (category && category !== "All") {
      const categoryMap: Record<string, string> = {
        Geopolitics: "politics OR war OR diplomacy",
        Tech: "technology OR cyber OR AI",
        "Natural Disasters": "earthquake OR flood OR hurricane OR wildfire",
        Economy: "economy OR trade OR inflation OR market",
        "Human Rights": "human rights OR humanitarian OR refugees",
      };
      const categoryQuery = categoryMap[category];
      if (categoryQuery) {
        query = `${country} AND (${categoryQuery})`;
      }
    }

    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", query);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "5");
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.message || "NewsAPI request failed", status: response.status }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
