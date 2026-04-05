import { useQuery } from "@tanstack/react-query";
import { Category } from "@/data/countryData";

export interface GdeltFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    url?: string;
    name?: string;
    html?: string;
    [key: string]: unknown;
  };
}

export interface GdeltGeoJson {
  type: "FeatureCollection";
  features: GdeltFeature[];
}

const MOCK_EVENTS: GdeltGeoJson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [37.6173, 55.7558] },
      properties: { name: "Diplomatic talks stall amid regional tensions", html: "<strong>Global News</strong><br/>Diplomatic talks stall amid regional tensions" }
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [34.7818, 32.0853] },
      properties: { name: "Protests erupt over new legislation", html: "<strong>Local Source</strong><br/>Protests erupt over new legislation" }
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [30.5234, 50.4501] },
      properties: { name: "Infrastructure damaged in recent strikes", html: "<strong>News Wire</strong><br/>Infrastructure damaged in recent strikes" }
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-77.0369, 38.9072] },
      properties: { name: "Summit concludes with new trade agreements", html: "<strong>World Watch</strong><br/>Summit concludes with new trade agreements" }
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [121.5654, 25.0330] },
      properties: { name: "Naval drills reported off the coast", html: "<strong>Pacific Times</strong><br/>Naval drills reported off the coast" }
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [116.4074, 39.9042] },
      properties: { name: "New economic policies announced", html: "<strong>Asia Finance</strong><br/>New economic policies announced" }
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [10.1815, 36.8065] },
      properties: { name: "Election results spark demonstrations", html: "<strong>MENA Report</strong><br/>Election results spark demonstrations" }
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-43.1729, -22.9068] },
      properties: { name: "Environmental summit addresses deforestation", html: "<strong>EcoWatch</strong><br/>Environmental summit addresses deforestation" }
    }
  ]
};

export const useGdeltEvents = (category: Category, timespan: string = "24hours", isLive: boolean = false) => {
  return useQuery({
    queryKey: ["gdelt-events", category, timespan],
    queryFn: async (): Promise<GdeltGeoJson> => {
      try {
        const queryStr = category === "All" ? "events" : category;
        const url = `/api/gdelt?query=${encodeURIComponent(
          queryStr
        )}&mode=pointdata&format=geojson&maxrows=100&timespan=${timespan}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          console.warn("GDELT API returned an error, falling back to mock data.");
          return MOCK_EVENTS;
        }

        const data = await res.json();
        if (!data || !data.features || data.features.length === 0) {
           return MOCK_EVENTS;
        }
        return data as GdeltGeoJson;
      } catch (err) {
        console.warn("Fetch failed, using mock data:", err);
        return MOCK_EVENTS; 
      }
    },
    refetchInterval: isLive ? 300000 : false, // 5 minutes if LIVE
    refetchOnWindowFocus: isLive,
  });
};
