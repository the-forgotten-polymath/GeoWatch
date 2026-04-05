import { useQuery } from "@tanstack/react-query";
import { countryScores } from "@/data/countryData";
import type { Article } from "@/types";

// ──────────────────────────────────────────
//  Keyword-based sentiment dictionary for local tone analysis
//  Values range roughly from -3 (very negative) to +3 (very positive)
// ──────────────────────────────────────────
const SENTIMENT_WORDS: Record<string, number> = {
  // Strongly negative (-3)
  war: -3, massacre: -3, genocide: -3, bombing: -3, invasion: -3, terror: -3, terrorism: -3,
  atrocity: -3, catastrophe: -3, assassination: -3, slaughter: -3,
  // Negative (-2)
  attack: -2, conflict: -2, crisis: -2, sanctions: -2, killed: -2, deaths: -2,
  strikes: -2, missile: -2, threat: -2, violence: -2, hostage: -2, coup: -2,
  explosion: -2, famine: -2, casualties: -2, shelling: -2, detained: -2,
  // Mildly negative (-1)
  tensions: -1, protest: -1, dispute: -1, arrest: -1, warned: -1, fears: -1,
  instability: -1, recession: -1, downturn: -1, unrest: -1, criticism: -1,
  controversy: -1, condemned: -1, collapsed: -1, drought: -1, refugees: -1,
  // Mildly positive (+1)
  talks: 1, negotiations: 1, dialogue: 1, reform: 1, recovery: 1, growth: 1,
  election: 1, vote: 1, investment: 1, development: 1, progress: 1, stability: 1,
  // Positive (+2)
  agreement: 2, deal: 2, ceasefire: 2, treaty: 2, cooperation: 2, alliance: 2,
  aid: 2, humanitarian: 2, partnership: 2, breakthrough: 2, summit: 2, prosperity: 2,
  // Strongly positive (+3)
  peace: 3, liberation: 3, reunification: 3, victory: 3, freedom: 3,
};

/**
 * Analyse a batch of article titles/descriptions and return a tone from -10 to +10.
 * Uses a simple bag-of-words sentiment approach.
 */
function analyseLocalSentiment(articles: Article[]): number | null {
  if (articles.length === 0) return null;

  let totalScore = 0;
  let matchedWords = 0;

  for (const a of articles) {
    const text = `${a.title} ${a.description || ""}`.toLowerCase();
    const words = text.replace(/[^a-z\s]/g, "").split(/\s+/);

    for (const word of words) {
      if (SENTIMENT_WORDS[word] !== undefined) {
        totalScore += SENTIMENT_WORDS[word];
        matchedWords++;
      }
    }
  }

  if (matchedWords === 0) return null;

  // Average per matched word, then scale from dictionary range (-3..+3) to tone range (-10..+10)
  const avgPerWord = totalScore / matchedWords;
  return (avgPerWord / 3) * 10;
}

export interface CountryGoldstein {
  avgTone: number;
  color: string;
  label: string;
}

/**
 * Map GDELT article tone (-10 to +10) to a 4-tier Goldstein-inspired color.
 * More negative = more conflictual (red).
 * More positive = more cooperative (blue).
 */
export function getGoldsteinColor(tone: number): string {
  if (tone <= -4) return "#ef4444"; // Red: Conflict
  if (tone <= -1) return "#f97316"; // Orange: Tension
  if (tone <= 2)  return "#22c55e"; // Green: Stable
  return "#3b82f6";                 // Blue: Cooperative
}

export function getGoldsteinLabel(tone: number): string {
  if (tone <= -4) return "Conflict";
  if (tone <= -1) return "Tension";
  if (tone <= 2)  return "Stable";
  return "Cooperative";
}

/** Derive a Goldstein-like tone from the existing static 0-10 severity score. */
function scoreToFallbackTone(score: number): number {
  // score 10 (Ukraine) → tone -10 (extreme conflict)
  // score  5            → tone   0 (neutral)
  // score  0            → tone +10 (cooperative)
  return (5 - score) * 2;
}

/**
 * Fetch Google News RSS for a country and return a local sentiment tone.
 */
async function fetchGoogleNewsTone(countryName: string, keywords: string[]): Promise<number | null> {
  try {
    let q = countryName;
    if (keywords.length > 0) {
      q += " " + keywords.slice(0, 2).join(" OR ");
    }
    const feedUrl = `/api/google-news/rss/search?q=${encodeURIComponent(q)}&hl=en&gl=US&ceid=US:en`;
    const res = await fetch(feedUrl);
    if (!res.ok) return null;

    const xmlText = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");
    const items = doc.querySelectorAll("item");
    const articles: Article[] = [];

    items.forEach((item) => {
      const title = item.querySelector("title")?.textContent?.trim() || "";
      const description = item.querySelector("description")?.textContent?.replace(/<[^>]*>/g, "").trim() || "";
      articles.push({
        title,
        source: { name: "Google News" },
        publishedAt: new Date().toISOString(),
        urlToImage: null,
        url: "",
        description,
      });
    });

    return analyseLocalSentiment(articles);
  } catch {
    return null;
  }
}

// Country keywords mapping (must match newsService)
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  UKR: ["Kyiv", "Zelensky", "Donbas", "Kharkiv"],
  RUS: ["Moscow", "Kremlin", "Putin"],
  ISR: ["Jerusalem", "Tel Aviv", "Netanyahu", "Gaza"],
  PSE: ["Gaza", "West Bank", "Ramallah", "Hamas"],
  SDN: ["Khartoum", "RSF", "Darfur"],
  MMR: ["Naypyidaw", "Rohingya", "junta"],
  SYR: ["Damascus", "Aleppo", "Assad"],
  YEM: ["Sanaa", "Houthi", "Aden"],
  AFG: ["Kabul", "Taliban", "Kandahar"],
  IRN: ["Tehran", "Khamenei", "IRGC"],
  PRK: ["Pyongyang", "Kim Jong-un", "DPRK"],
  CHN: ["Beijing", "Xi Jinping", "Shanghai"],
  TWN: ["Taipei", "TSMC", "strait"],
  USA: ["Washington", "White House", "Congress"],
  GBR: ["London", "Westminster", "Parliament"],
  DEU: ["Berlin", "Bundestag", "Scholz"],
  FRA: ["Paris", "Macron", "Lyon"],
  JPN: ["Tokyo", "Osaka", "Kishida"],
  IND: ["New Delhi", "Modi", "Mumbai"],
  BRA: ["Brasília", "Lula", "Amazon"],
  NGA: ["Abuja", "Lagos", "Boko Haram"],
  ETH: ["Addis Ababa", "Tigray", "Abiy Ahmed"],
  COD: ["Kinshasa", "M23", "Goma"],
  SOM: ["Mogadishu", "al-Shabaab", "Puntland"],
  LBY: ["Tripoli", "Benghazi", "Haftar"],
  VEN: ["Caracas", "Maduro", "opposition"],
  MEX: ["Mexico City", "cartel", "fentanyl"],
  PAK: ["Islamabad", "Karachi", "Lahore"],
  TUR: ["Ankara", "Istanbul", "Erdoğan"],
  PHL: ["Manila", "Marcos", "Mindanao"],
  AUS: ["Canberra", "Sydney", "Albanese"],
  CAN: ["Ottawa", "Toronto", "Trudeau"],
  KOR: ["Seoul", "semiconductors", "Yoon"],
  ZAF: ["Pretoria", "Cape Town", "ANC"],
  EGY: ["Cairo", "el-Sisi", "Suez Canal"],
  SAU: ["Riyadh", "MBS", "OPEC"],
  IDN: ["Jakarta", "Prabowo", "Bali"],
  HTI: ["Port-au-Prince", "gang", "crisis"],
  COL: ["Bogotá", "FARC", "Petro"],
  ARG: ["Buenos Aires", "Milei", "IMF"],
};

/**
 * Fetch the average article tone for a country from the GDELT DOC API.
 * Uses `mode=timelinetone` which returns hourly average tone values for the last 24h.
 */
async function fetchCountryTone(countryName: string): Promise<number | null> {
  try {
    const url = `/api/gdelt-doc?query=${encodeURIComponent(countryName)}&mode=timelinetone&format=json&timespan=24h`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const text = await res.text();
    if (!text || text.trim().length === 0) return null;

    const data = JSON.parse(text);

    let values: number[] = [];

    const timeline = data?.timeline;
    if (Array.isArray(timeline) && timeline.length > 0) {
      const first = timeline[0];
      
      const series = first?.series;
      if (Array.isArray(series) && series.length > 0) {
        const entries = series[0]?.data;
        if (Array.isArray(entries)) {
          for (const entry of entries) {
            if (Array.isArray(entry) && entry.length >= 2) {
              values.push(parseFloat(entry[1]));
            } else if (typeof entry === "object" && entry.value !== undefined) {
              values.push(parseFloat(entry.value));
            }
          }
        }
      }

      if (values.length === 0 && Array.isArray(first?.data)) {
        for (const entry of first.data) {
          if (Array.isArray(entry) && entry.length >= 2) {
            values.push(parseFloat(entry[1]));
          } else if (typeof entry === "object" && entry.value !== undefined) {
            values.push(parseFloat(entry.value));
          }
        }
      }
    }

    values = values.filter((v) => !isNaN(v));
    if (values.length === 0) return null;

    return values.reduce((a, b) => a + b, 0) / values.length;
  } catch {
    return null;
  }
}

/**
 * React-Query hook that returns Goldstein-scale color data for every tracked country.
 * Fetches GDELT DOC API tone data in parallel batches; falls back to static scores.
 */
export function useGoldsteinScores() {
  return useQuery({
    queryKey: ["goldstein-scores"],
    queryFn: async (): Promise<Record<string, CountryGoldstein>> => {
      const CACHE_KEY = "gdelt-goldstein-scores-cache";
      const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

      // 1. Check if we have valid, fresh data in cache
      const cachedStr = localStorage.getItem(CACHE_KEY);
      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr);
          if (Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log("Using cached Goldstein scores to prevent map lag.");
            return cached.data;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      const entries = Object.entries(countryScores);
      const results: Record<string, CountryGoldstein> = {};

      console.log("Fetching fresh GDELT Goldstein scores...");

      // Process in batches of 5 to avoid overwhelming the APIs
      for (let i = 0; i < entries.length; i += 5) {
        const batch = entries.slice(i, i + 5);
        const tones = await Promise.allSettled(
          batch.map(([, data]) => fetchCountryTone(data.name))
        );
        const googleTones = await Promise.allSettled(
          batch.map(([iso, data]) => {
            const kw = COUNTRY_KEYWORDS[iso] ?? [];
            return fetchGoogleNewsTone(data.name, kw);
          })
        );

        batch.forEach(([iso, data], idx) => {
          const gdeltResult = tones[idx];
          const googleResult = googleTones[idx];

          const gdeltTone =
            gdeltResult.status === "fulfilled" && gdeltResult.value !== null
              ? gdeltResult.value
              : null;
          const googleTone =
            googleResult.status === "fulfilled" && googleResult.value !== null
              ? googleResult.value
              : null;

          let tone: number;
          if (gdeltTone !== null && googleTone !== null) {
            // Blend: weight GDELT 70%, Google News 30%
            tone = gdeltTone * 0.7 + googleTone * 0.3;
          } else if (gdeltTone !== null) {
            tone = gdeltTone;
          } else if (googleTone !== null) {
            tone = googleTone;
          } else {
            tone = scoreToFallbackTone(data.score);
          }

          results[iso] = {
            avgTone: tone,
            color: getGoldsteinColor(tone),
            label: getGoldsteinLabel(tone),
          };
        });

        // Small delay between batches
        if (i + 5 < entries.length) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      // 2. Cache the new results
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          data: results,
        })
      );

      return results;
    },
    staleTime: 10 * 60 * 1000,       // 10 minutes
    gcTime: 30 * 60 * 1000,          // 30 minutes
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 min (matches GDELT update cadence)
  });
}
