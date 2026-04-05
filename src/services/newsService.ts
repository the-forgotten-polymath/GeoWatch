import type { Article } from "@/types";
import { countryScores } from "@/data/countryData";

// ──────────────────────────────────────────
//  Guardian API (free developer key, real-time)
// ──────────────────────────────────────────
interface GuardianResult {
  webTitle: string;
  webUrl: string;
  webPublicationDate: string;
  fields?: {
    trailText?: string;
    thumbnail?: string;
  };
  pillarName?: string;
}

interface GuardianResponse {
  response: {
    results: GuardianResult[];
  };
}

const GUARDIAN_API_KEY = import.meta.env.VITE_GUARDIAN_API_KEY || "test";

// ──────────────────────────────────────────
//  Guardian topic tags — pinpoints results to that country's coverage
//  See: https://www.theguardian.com/world
// ──────────────────────────────────────────
const COUNTRY_GUARDIAN_TAGS: Record<string, string> = {
  UKR: "world/ukraine",
  RUS: "world/russia",
  ISR: "world/israel",
  PSE: "world/palestinian-territories",
  SDN: "world/sudan",
  MMR: "world/myanmar",
  SYR: "world/syria",
  YEM: "world/yemen",
  AFG: "world/afghanistan",
  IRN: "world/iran",
  PRK: "world/north-korea",
  CHN: "world/china",
  TWN: "world/taiwan",
  USA: "world/usa",
  GBR: "world/uk",
  DEU: "world/germany",
  FRA: "world/france",
  JPN: "world/japan",
  IND: "world/india",
  BRA: "world/brazil",
  NGA: "world/nigeria",
  ETH: "world/ethiopia",
  COD: "world/democratic-republic-of-congo",
  SOM: "world/somalia",
  LBY: "world/libya",
  VEN: "world/venezuela",
  MEX: "world/mexico",
  PAK: "world/pakistan",
  TUR: "world/turkey",
  PHL: "world/philippines",
  AUS: "australia-news/australia",
  CAN: "world/canada",
  KOR: "world/south-korea",
  ZAF: "world/south-africa",
  EGY: "world/egypt",
  SAU: "world/saudi-arabia",
  IDN: "world/indonesia",
  HTI: "world/haiti",
  COL: "world/colombia",
  ARG: "world/argentina",
  ARM: "world/armenia",
  AZE: "world/azerbaijan",
  SSD: "world/south-sudan",
  THA: "world/thailand",
  GRC: "world/greece",
  ARE: "world/united-arab-emirates",
  POL: "world/poland",
  ITA: "world/italy",
  NLD: "world/netherlands",
  BLR: "world/belarus",
};

// ──────────────────────────────────────────
//  Country-specific search keywords
//  (capital city, key figures, regions, context)
//  Used to enrich the query when no tag is available or for fallback
// ──────────────────────────────────────────
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  UKR: ["Kyiv", "Zelensky", "Donbas", "Kharkiv"],
  RUS: ["Moscow", "Kremlin", "Putin", "St. Petersburg"],
  ISR: ["Jerusalem", "Tel Aviv", "Netanyahu", "Gaza"],
  PSE: ["Gaza", "West Bank", "Ramallah", "Hamas"],
  SDN: ["Khartoum", "RSF", "Darfur", "al-Burhan"],
  MMR: ["Naypyidaw", "Rohingya", "junta", "Mandalay"],
  SYR: ["Damascus", "Aleppo", "Assad", "Idlib"],
  YEM: ["Sanaa", "Houthi", "Aden", "Hodeidah"],
  AFG: ["Kabul", "Taliban", "Kandahar", "Helmand"],
  IRN: ["Tehran", "Khamenei", "IRGC", "nuclear"],
  PRK: ["Pyongyang", "Kim Jong-un", "DPRK", "missile"],
  CHN: ["Beijing", "Xi Jinping", "Shanghai", "CCP", "Chinese"],
  TWN: ["Taipei", "TSMC", "strait", "cross-strait", "Taiwanese"],
  USA: ["Washington", "White House", "Congress", "Pentagon", "USA", "US", "America", "American", "Biden", "United States"],
  GBR: ["London", "Westminster", "Downing Street", "Parliament", "UK", "Britain", "British", "Sunak"],
  DEU: ["Berlin", "Bundestag", "Scholz", "Frankfurt", "German", "Germany"],
  FRA: ["Paris", "Élysée", "Macron", "Lyon"],
  JPN: ["Tokyo", "Osaka", "tsunami", "Kishida"],
  IND: ["New Delhi", "Modi", "Mumbai", "BJP"],
  BRA: ["Brasília", "Lula", "Amazon", "São Paulo"],
  NGA: ["Abuja", "Lagos", "Boko Haram", "Niger Delta"],
  ETH: ["Addis Ababa", "Tigray", "Abiy Ahmed", "Amhara"],
  COD: ["Kinshasa", "M23", "Goma", "Kivu", "Congo", "DRC"],
  SOM: ["Mogadishu", "al-Shabaab", "Puntland", "Jubaland"],
  LBY: ["Tripoli", "Benghazi", "Dbeibeh", "Haftar"],
  VEN: ["Caracas", "Maduro", "Maracaibo", "opposition"],
  MEX: ["Mexico City", "cartel", "AMLO", "fentanyl"],
  PAK: ["Islamabad", "Karachi", "Lahore", "army"],
  TUR: ["Ankara", "Istanbul", "Erdoğan", "Bosphorus"],
  PHL: ["Manila", "Marcos", "Mindanao", "South China Sea"],
  AUS: ["Canberra", "Sydney", "Albanese", "Reef"],
  CAN: ["Ottawa", "Toronto", "Trudeau", "Quebec"],
  KOR: ["Seoul", "semiconductors", "Yoon", "Busan"],
  ZAF: ["Pretoria", "Cape Town", "ANC", "Johannesburg"],
  EGY: ["Cairo", "el-Sisi", "Suez Canal", "Alexandria"],
  SAU: ["Riyadh", "MBS", "OPEC", "Vision 2030"],
  IDN: ["Jakarta", "Prabowo", "Bali", "Borneo"],
  HTI: ["Port-au-Prince", "gang", "Ariel Henry", "crisis"],
  COL: ["Bogotá", "FARC", "Petro", "Medellín"],
  ARG: ["Buenos Aires", "Milei", "Córdoba", "IMF"],
  ARM: ["Yerevan", "Pashinyan", "Nagorno-Karabakh"],
  AZE: ["Baku", "Aliyev", "Nagorno-Karabakh"],
  SSD: ["Juba", "Kiir", "Machar"],
  THA: ["Bangkok", "Srettha", "Move Forward"],
  GRC: ["Athens", "Mitsotakis", "Aegean"],
  ARE: ["Dubai", "Abu Dhabi", "Zayed"],
  POL: ["Warsaw", "Tusk", "Duda", "border"],
  ITA: ["Rome", "Meloni", "Milan"],
  NLD: ["Amsterdam", "Wilders", "Rutte", "Hague"],
  BLR: ["Minsk", "Lukashenko", "border"],
};

// ──────────────────────────────────────────
//  Category → search terms
// ──────────────────────────────────────────
const CATEGORY_QUERY: Record<string, string> = {
  Geopolitics:     "politics OR diplomacy OR conflict OR military OR war OR sanctions",
  Tech:            "technology OR cyber OR AI OR semiconductor OR digital",
  "Natural Disasters": "earthquake OR flood OR hurricane OR typhoon OR wildfire OR drought",
  Economy:         "economy OR trade OR market OR inflation OR sanctions OR GDP",
  "Human Rights":  "human rights OR humanitarian OR refugees OR war crimes OR protest",
};

// ──────────────────────────────────────────
//  CNN RSS Feed URLs per category
// ──────────────────────────────────────────
const CNN_RSS_FEEDS: Record<string, string> = {
  All:              "/api/cnn-rss/rss/edition_world.rss",
  Geopolitics:      "/api/cnn-rss/rss/edition_world.rss",
  Tech:             "/api/cnn-rss/rss/edition_technology.rss",
  "Natural Disasters": "/api/cnn-rss/rss/edition_world.rss",
  Economy:          "/api/cnn-rss/rss/money_news_international.rss",
  "Human Rights":   "/api/cnn-rss/rss/edition_world.rss",
};

// ──────────────────────────────────────────
//  CNN RSS XML Parser
// ──────────────────────────────────────────
function parseCnnRssXml(xmlText: string): Article[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");
    const items = doc.querySelectorAll("item");
    const articles: Article[] = [];

    items.forEach((item) => {
      const title = item.querySelector("title")?.textContent?.replace(/^<!\[CDATA\[|]]>$/g, "").trim() || "";
      const link = item.querySelector("link")?.textContent?.trim() || "";
      const description = item.querySelector("description")?.textContent?.replace(/^<!\[CDATA\[|]]>$/g, "").trim() || "";
      const pubDate = item.querySelector("pubDate")?.textContent?.trim() || "";

      // Extract thumbnail from media:content
      let thumbnail: string | null = null;
      const mediaContents = item.querySelectorAll("content");
      for (const mc of mediaContents) {
        const url = mc.getAttribute("url");
        if (url && url.includes("super-169")) {
          thumbnail = url;
          break;
        }
      }
      if (!thumbnail) {
        const firstMedia = item.querySelector("content");
        thumbnail = firstMedia?.getAttribute("url") || null;
      }

      // Skip sponsored/ad items
      if (!link || link.includes("fool.com") || link.includes("lendingtree.com")) return;

      articles.push({
        title,
        source: { name: "CNN" },
        publishedAt: pubDate || new Date().toISOString(),
        urlToImage: thumbnail,
        url: link,
        description: description.replace(/<[^>]*>/g, "").slice(0, 200), // strip HTML
      });
    });

    return articles;
  } catch (e) {
    console.error("CNN RSS parse error:", e);
    return [];
  }
}

// ──────────────────────────────────────────
//  CNN fetch — fetches RSS and filters by country keywords
// ──────────────────────────────────────────
async function fetchFromCnn(
  iso: string,
  countryName: string,
  category?: string
): Promise<Article[]> {
  try {
    const feedUrl = CNN_RSS_FEEDS[category || "All"] || CNN_RSS_FEEDS.All;
    const res = await fetch(feedUrl);
    if (!res.ok) return [];

    const xmlText = await res.text();
    const allArticles = parseCnnRssXml(xmlText);

    // Filter articles that mention this country
    const keywords = COUNTRY_KEYWORDS[iso] ?? [];
    const searchTerms = [countryName.toLowerCase(), ...keywords.map(k => k.toLowerCase())];

    return allArticles.filter((a) => {
      const text = `${a.title} ${a.description}`.toLowerCase();
      return searchTerms.some((term) => text.includes(term));
    });
  } catch (e) {
    console.error("CNN RSS fetch error:", e);
    return [];
  }
}

// ──────────────────────────────────────────
//  Google News RSS XML Parser
// ──────────────────────────────────────────
function parseGoogleNewsRssXml(xmlText: string): Article[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");
    const items = doc.querySelectorAll("item");
    const articles: Article[] = [];

    items.forEach((item) => {
      const title = item.querySelector("title")?.textContent?.trim() || "";
      const link = item.querySelector("link")?.textContent?.trim() || "";
      const pubDate = item.querySelector("pubDate")?.textContent?.trim() || "";
      const description = item.querySelector("description")?.textContent?.trim() || "";

      // Extract the actual source name from the title (Google News format: "Title - Source")
      let sourceName = "Google News";
      const dashIdx = title.lastIndexOf(" - ");
      if (dashIdx > 0) {
        sourceName = title.substring(dashIdx + 3).trim();
      }

      if (!link) return;

      articles.push({
        title: dashIdx > 0 ? title.substring(0, dashIdx).trim() : title,
        source: { name: sourceName },
        publishedAt: pubDate || new Date().toISOString(),
        urlToImage: null,
        url: link,
        description: description.replace(/<[^>]*>/g, "").slice(0, 200),
      });
    });

    return articles;
  } catch (e) {
    console.error("Google News RSS parse error:", e);
    return [];
  }
}

// ──────────────────────────────────────────
//  Google News fetch — searches RSS by country + category keywords
// ──────────────────────────────────────────
async function fetchFromGoogleNews(
  iso: string,
  countryName: string,
  category?: string
): Promise<Article[]> {
  try {
    // Build search query
    const keywords = COUNTRY_KEYWORDS[iso] ?? [];
    let q = countryName;
    if (keywords.length > 0) {
      q += " " + keywords.slice(0, 2).join(" OR ");
    }
    if (category && category !== "All") {
      const catQ = CATEGORY_QUERY[category];
      if (catQ) {
        // pick only the first two category terms to keep the query tight
        const catTerms = catQ.split(" OR ").slice(0, 2).join(" OR ");
        q += ` ${catTerms}`;
      }
    }

    const feedUrl = `/api/google-news/rss/search?q=${encodeURIComponent(q)}&hl=en&gl=US&ceid=US:en`;
    const res = await fetch(feedUrl);
    if (!res.ok) return [];

    const xmlText = await res.text();
    return parseGoogleNewsRssXml(xmlText);
  } catch (e) {
    console.error("Google News RSS fetch error:", e);
    return [];
  }
}

// ──────────────────────────────────────────
//  Guardian fetch
// ──────────────────────────────────────────
async function fetchFromGuardian(
  iso: string,
  countryName: string,
  category?: string
): Promise<Article[]> {
  const url = new URL("https://content.guardianapis.com/search");

  const tag = COUNTRY_GUARDIAN_TAGS[iso];
  const extraKeywords = COUNTRY_KEYWORDS[iso] ?? [];

  // Build a targeted free-text query using country name + local keywords
  const keywordClause =
    extraKeywords.length > 0
      ? `${countryName} OR ${extraKeywords.slice(0, 2).join(" OR ")}`
      : countryName;

  let q = keywordClause;

  // Narrow by category if specified
  if (category && category !== "All") {
    const catQ = CATEGORY_QUERY[category];
    if (catQ) q = `(${keywordClause}) AND (${catQ})`;
  }

  url.searchParams.set("q", q);
  url.searchParams.set("order-by", "newest");
  url.searchParams.set("page-size", "10");
  url.searchParams.set("show-fields", "trailText,thumbnail");
  url.searchParams.set("api-key", GUARDIAN_API_KEY);
  
  // Only fetch articles from the last 30 days
  const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  url.searchParams.set("from-date", thirtyDaysAgoIso);

  // Pinpoint to country-level tagged coverage when available
  if (tag) {
    url.searchParams.set("tag", tag);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Guardian request failed: ${res.status}`);

  const data: GuardianResponse = await res.json();
  if (!data.response?.results || data.response.results.length === 0) {
    // Fallback: drop the tag and retry with the free-text query alone
    if (tag) {
      url.searchParams.delete("tag");
      const fallbackRes = await fetch(url.toString());
      if (!fallbackRes.ok) return [];
      const fallbackData: GuardianResponse = await fallbackRes.json();
      if (!fallbackData.response?.results) return [];
      return mapGuardianResults(fallbackData.response.results);
    }
    return [];
  }

  return mapGuardianResults(data.response.results);
}

function mapGuardianResults(results: GuardianResult[]): Article[] {
  return results.map((r) => ({
    title: r.webTitle,
    source: { name: "The Guardian" },
    publishedAt: r.webPublicationDate,
    urlToImage: r.fields?.thumbnail || null,
    url: r.webUrl,
    description: r.fields?.trailText || "",
  }));
}

// ──────────────────────────────────────────
//  Main Export — fetches from Guardian + CNN in parallel
// ──────────────────────────────────────────
export async function fetchNews(
  iso: string,
  countryName: string,
  category?: string
): Promise<{ articles: Article[]; sources: string[] }> {
  try {
    const [guardianArticles, cnnArticles, googleArticles] = await Promise.allSettled([
      fetchFromGuardian(iso, countryName, category),
      fetchFromCnn(iso, countryName, category),
      fetchFromGoogleNews(iso, countryName, category),
    ]);

    const guardian = guardianArticles.status === "fulfilled" ? guardianArticles.value : [];
    const cnn = cnnArticles.status === "fulfilled" ? cnnArticles.value : [];
    const google = googleArticles.status === "fulfilled" ? googleArticles.value : [];

    const getWords = (text: string) => 
      text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 3);

    // Pool all non-Guardian articles for cross-source matching
    const otherArticles = [...cnn, ...google];
    const otherUsed = new Set<string>();

    const multiSourceArticles: Article[] = [];
    const singleSourceArticles: Article[] = [];

    for (const gArt of guardian) {
      const gWords = new Set(getWords(gArt.title));
      const matchedOthers: Article[] = [];
      
      for (const oArt of otherArticles) {
        if (otherUsed.has(oArt.url)) continue;
        const oWords = new Set(getWords(oArt.title));
        let overlap = 0;
        for (const w of gWords) {
          if (oWords.has(w)) overlap++;
        }
        if (overlap >= 3 || (gWords.size > 0 && overlap / gWords.size >= 0.5)) {
          matchedOthers.push(oArt);
        }
      }

      const allSources = [{ name: gArt.source.name, url: gArt.url }];

      if (matchedOthers.length > 0) {
        let fallbackImage = gArt.urlToImage;
        for (const m of matchedOthers) {
          otherUsed.add(m.url);
          allSources.push({ name: m.source.name, url: m.url });
          if (!fallbackImage) fallbackImage = m.urlToImage;
        }

        const uniqueSourcesMap = new Map();
        for (const src of allSources) uniqueSourcesMap.set(src.name, src);
        const uniqueSources = Array.from(uniqueSourcesMap.values());

        multiSourceArticles.push({
          ...gArt,
          source: { name: uniqueSources.map(s => s.name === "The Guardian" ? "Guardian" : s.name).join(" & ") },
          urlToImage: fallbackImage,
          allSources: uniqueSources,
        });
      } else {
        singleSourceArticles.push({
          ...gArt,
          source: { name: gArt.source.name === "The Guardian" ? "Guardian" : gArt.source.name },
          allSources
        });
      }
    }

    for (const oArt of otherArticles) {
      if (!otherUsed.has(oArt.url)) {
        singleSourceArticles.push({
          ...oArt,
          allSources: [{ name: oArt.source.name, url: oArt.url }]
        });
      }
    }

    // Sort newest first within each priority group
    const sortByDateDesc = (a: Article, b: Article) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

    multiSourceArticles.sort(sortByDateDesc);
    singleSourceArticles.sort(sortByDateDesc);

    const mergedList = [...multiSourceArticles, ...singleSourceArticles];

    // Final Deduplication by URL 
    const seen = new Set<string>();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const finalFiltered = mergedList.filter((a) => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return new Date(a.publishedAt).getTime() > thirtyDaysAgo;
    });

    // Always show all sources in the News Menu
    const sources = ["Guardian", "CNN", "Google News"];

    return { articles: finalFiltered.slice(0, 20), sources };
  } catch (e) {
    console.error("News fetch error:", e);
    return { articles: [], sources: [] };
  }
}

// ──────────────────────────────────────────
//  Relational Graph Extractor
// ──────────────────────────────────────────
export interface RelationalEdge {
  source: string;
  target: string;
  article: Article;
}

export async function fetchGlobalRelationalNews(category?: string): Promise<RelationalEdge[]> {
  try {
    const url = new URL("https://content.guardianapis.com/search");
    
    // Narrow down or fallback to 'world'
    let q = "world OR geopolitics OR conflict OR diplomacy";
    if (category && category !== "All") {
      q = CATEGORY_QUERY[category] || q;
    }
    
    url.searchParams.set("q", q);
    url.searchParams.set("order-by", "newest");
    url.searchParams.set("page-size", "50"); // Fetch a solid batch to find intersections
    url.searchParams.set("show-fields", "trailText,thumbnail");
    url.searchParams.set("api-key", GUARDIAN_API_KEY);
    
    const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    url.searchParams.set("from-date", thirtyDaysAgoIso);

    let guardianArticles: Article[] = [];
    try {
      const res = await fetch(url.toString());
      if (res.ok) {
        const data: GuardianResponse = await res.json();
        if (data.response && data.response.results) {
          guardianArticles = mapGuardianResults(data.response.results);
        }
      }
    } catch {
      console.warn("Guardian API skipped or failed for relations map.");
    }

    // Also grab CNN + Google News world articles for more edges
    let cnnArticles: Article[] = [];
    let googleArticles: Article[] = [];
    try {
      const cnnRes = await fetch(CNN_RSS_FEEDS.All);
      if (cnnRes.ok) {
        cnnArticles = parseCnnRssXml(await cnnRes.text());
      }
    } catch { /* ignore CNN failures */ }
    try {
      const gNewsQ = "world geopolitics conflict diplomacy";
      const gNewsRes = await fetch(`/api/google-news/rss/search?q=${encodeURIComponent(gNewsQ)}&hl=en&gl=US&ceid=US:en`);
      if (gNewsRes.ok) {
        googleArticles = parseGoogleNewsRssXml(await gNewsRes.text());
      }
    } catch { /* ignore Google News failures */ }

    const articles = [...guardianArticles, ...cnnArticles, ...googleArticles];
    const edges: RelationalEdge[] = [];
    const seenCombos = new Set<string>();

    for (const article of articles) {
      const textToSearch = `${article.title} ${article.description}`.toLowerCase();
      
      const mentionedIsos: string[] = [];
      for (const [iso, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
        // Check local keywords or the country's actual name
        const countryName = countryScores[iso]?.name;
        
        let isMentioned = false;
        
        // Use word boundaries for rigorous matching of country names to prevent 'can' -> Canada matching
        if (countryName) {
           const regex = new RegExp(`\\b${countryName}\\b`, 'i');
           if (regex.test(textToSearch)) isMentioned = true;
        }
        
        if (!isMentioned) {
           isMentioned = keywords.some(kw => {
              // Only use regex for words > 3 chars, otherwise strict matching
              if (kw.length <= 3) return new RegExp(`\\b${kw}\\b`, 'i').test(textToSearch);
              return textToSearch.includes(kw.toLowerCase());
           });
        }
          
        if (isMentioned) {
          mentionedIsos.push(iso);
        }
      }

      // If at least 2 countries are mentioned in the same article, link them!
      if (mentionedIsos.length >= 2) {
        for (let i = 0; i < mentionedIsos.length; i++) {
          for (let j = i + 1; j < mentionedIsos.length; j++) {
            const source = mentionedIsos[i];
            const target = mentionedIsos[j];
            
            // Uniqueness key (so we don't add the same edge for the exact same article)
            const comboId = [source, target].sort().join('-') + '-' + article.url;
            if (!seenCombos.has(comboId)) {
              seenCombos.add(comboId);
              edges.push({ source, target, article });
            }
          }
        }
      }
    }
    
    return edges;
  } catch (e) {
    console.error("fetchGlobalRelationalNews error:", e);
    return [];
  }
}

// ──────────────────────────────────────────
//  Dedicated Bilateral News Fetcher (On-Demand)
// ──────────────────────────────────────────
export async function fetchDedicatedEdgeNews(sourceIso: string, targetIso: string): Promise<RelationalEdge[]> {
  try {
    const srcName = countryScores[sourceIso]?.name || sourceIso;
    const tgtName = countryScores[targetIso]?.name || targetIso;
    
    const url = new URL("https://content.guardianapis.com/search");
    url.searchParams.set("q", `"${srcName}" AND "${tgtName}"`);
    url.searchParams.set("order-by", "relevance"); // Crucial: ensure articles are specifically about this, not just random live-blogs
    url.searchParams.set("page-size", "5");
    url.searchParams.set("show-fields", "trailText,thumbnail");
    url.searchParams.set("api-key", GUARDIAN_API_KEY);
    
    // Check Guardian
    let guardianArticles: Article[] = [];
    try {
      const res = await fetch(url.toString());
      if (res.ok) {
        const data: GuardianResponse = await res.json();
        if (data.response?.results) {
          guardianArticles = mapGuardianResults(data.response.results);
        }
      }
    } catch { console.warn("Dedicated Guardian fetch failed."); }

    // Fallback: Check Google News specifically
    let googleArticles: Article[] = [];
    if (guardianArticles.length === 0) {
      try {
        const gNewsQ = `"${srcName}" "${tgtName}" relations`;
        const gNewsRes = await fetch(`/api/google-news/rss/search?q=${encodeURIComponent(gNewsQ)}&hl=en&gl=US&ceid=US:en`);
        if (gNewsRes.ok) {
          googleArticles = parseGoogleNewsRssXml(await gNewsRes.text());
        }
      } catch { console.warn("Dedicated Google News fetch failed."); }
    }

    const compiled = [...guardianArticles, ...googleArticles].map(article => ({
      source: sourceIso,
      target: targetIso,
      article
    }));

    return compiled.slice(0, 5);
  } catch (e) {
    console.error("fetchDedicatedEdgeNews error:", e);
    return [];
  }
}

export async function fetchLiveGlobalNews(category?: string): Promise<Article[]> {
  try {
    const url = new URL("https://content.guardianapis.com/search");
    
    let q = "world OR geopolitics OR conflict OR diplomacy OR breaking text";
    if (category && category !== "All") {
      q = CATEGORY_QUERY[category] || q;
    }
    
    url.searchParams.set("q", q);
    url.searchParams.set("order-by", "newest");
    url.searchParams.set("page-size", "5");
    url.searchParams.set("show-fields", "trailText,thumbnail");
    url.searchParams.set("api-key", GUARDIAN_API_KEY);
    
    const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    url.searchParams.set("from-date", thirtyDaysAgoIso);

    // Fetch Guardian + CNN + Google News live in parallel
    const gNewsLiveQ = "world breaking news geopolitics";
    const [guardianRes, cnnRes, gNewsRes] = await Promise.allSettled([
      fetch(url.toString()),
      fetch(CNN_RSS_FEEDS.All),
      fetch(`/api/google-news/rss/search?q=${encodeURIComponent(gNewsLiveQ)}&hl=en&gl=US&ceid=US:en`),
    ]);

    const articles: Article[] = [];

    if (guardianRes.status === "fulfilled" && guardianRes.value.ok) {
      const data: GuardianResponse = await guardianRes.value.json();
      if (data.response?.results) {
        articles.push(...mapGuardianResults(data.response.results));
      }
    }

    if (cnnRes.status === "fulfilled" && cnnRes.value.ok) {
      const cnnXml = await cnnRes.value.text();
      const cnnArticles = parseCnnRssXml(cnnXml);
      // Take the 5 most recent CNN articles for the live feed
      articles.push(...cnnArticles.slice(0, 5));
    }

    if (gNewsRes.status === "fulfilled" && gNewsRes.value.ok) {
      const gNewsXml = await gNewsRes.value.text();
      const gNewsArticles = parseGoogleNewsRssXml(gNewsXml);
      articles.push(...gNewsArticles.slice(0, 5));
    }

    // Deduplicate and filter out older articles
    const seen = new Set<string>();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const unique = articles.filter(a => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return new Date(a.publishedAt).getTime() > thirtyDaysAgo;
    });
    
    unique.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return unique.slice(0, 10);
  } catch (e) {
    console.error("fetchLiveGlobalNews error:", e);
    return [];
  }
}


