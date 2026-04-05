import { useState } from 'react';
import { aiService } from '@/services/aiService';
import { countryScores } from '@/data/countryData';
import { fetchNews } from '@/services/newsService';

// ── Build a name→ISO lookup once from countryScores ──
const nameToIso: Record<string, string> = {};
for (const [iso, data] of Object.entries(countryScores)) {
  nameToIso[data.name.toLowerCase()] = iso;
}

/**
 * Reliable local ISO extraction — no LLM needed.
 * Scans the query for country names and ISO codes defined in countryScores.
 */
function extractIsosFromQuery(query: string): string[] {
  const lower = query.toLowerCase();
  const found = new Set<string>();

  for (const [name, iso] of Object.entries(nameToIso)) {
    if (lower.includes(name)) found.add(iso);
  }

  // Also catch bare ISO codes in the query (e.g. "UKR situation")
  for (const iso of Object.keys(countryScores)) {
    if (lower.includes(iso.toLowerCase())) found.add(iso);
  }

  return [...found];
}

export const useMapChat = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string, isos?: string[]}[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (query: string, onUpdateIsos: (isos: string[]) => void) => {
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      // ── Phase 1: Extract ISOs — local string match, never fails ──
      const extractedIsos = extractIsosFromQuery(query);
      onUpdateIsos(extractedIsos);

      // ── Phase 2: Fetch live news for matched countries ──
      let newsContext = "";
      const usedArticles: { title: string; url: string; source: string }[] = [];

      if (extractedIsos.length > 0) {
        setMessages(prev => [
          ...prev,
          { role: 'ai', content: `[SYSTEM: INTERCEPTING DATASTREAMS FOR ${extractedIsos.join(', ')}...]` }
        ]);

        const fetchPromises = extractedIsos.map(async (iso) => {
          const cData = countryScores[iso];
          if (!cData) return "";
          try {
            const result = await fetchNews(iso, cData.name, "All");
            if (result.articles.length > 0) {
              const top5 = result.articles.slice(0, 5);
              top5.forEach(a => {
                usedArticles.push({
                   title: a.title,
                   url: a.url,
                   source: a.source?.name || "News Source"
                });
              });

              const articleLines = top5.map((a, i) =>
                `[Article ${i + 1}]\nHeadline: ${a.title}\nURL: ${a.url}\nSummary: ${a.description ? a.description.slice(0, 250) : "N/A"}`
              ).join('\n\n');
              return `=== LIVE NEWS: ${cData.name} (${new Date().toDateString()}) ===\n${articleLines}`;
            }
          } catch (_) { /* ignore fetch errors */ }
          return "";
        });

        const results = await Promise.all(fetchPromises);
        newsContext = results.filter(Boolean).join('\n\n');
        setMessages(prev => prev.slice(0, -1)); // remove "intercepting" placeholder
      }

      // ── Phase 3: Synthesise ──
      // For small models (phi3:mini): put the reading material FIRST, question LAST.
      // Small models weight earlier tokens heavily — this ensures they read the news
      // before they see the question and fall back to training memory.
      let synthPrompt: string;

      if (newsContext) {
        synthPrompt =
`Read the following live news articles carefully:

${newsContext}

---
Now answer this question using ONLY the articles above. Do not use your training knowledge.
Question: ${query}

Write 3-4 sentences. Be specific and factual. If the articles do not answer the question, say so.`;
      } else {
        // No news available (unrecognised country or fetch failed) — use general knowledge
        synthPrompt =
`You are a geopolitical intelligence assistant.
Answer this question concisely in 3-4 sentences:
${query}`;
      }

      let answer = await aiService.chat(synthPrompt);
      
      // Auto-append verified sources to the output if articles were fetched and mapped
      if (usedArticles.length > 0) {
        // We limit to max 5 sources visually to not overwhelm the chat log
        const uniqueLinks = Array.from(new Map(usedArticles.map(item => [item.url, item])).values());
        const sourcesText = uniqueLinks.slice(0, 5).map(a => `• [${a.source}: ${a.title}](${a.url})`).join('\n');
        answer += `\n\n**Sources Analyzed:**\n${sourcesText}`;
      }

      setMessages(prev => [...prev, { role: 'ai', content: answer, isos: extractedIsos }]);

    } catch (e) {
      console.error(e);
      const provider = aiService.getProviderName();
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: `[ERR: NEURAL LINK FAILED. ${provider} CONNECTION ERROR.]` }
      ]);
      onUpdateIsos([]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage, setMessages };
};
