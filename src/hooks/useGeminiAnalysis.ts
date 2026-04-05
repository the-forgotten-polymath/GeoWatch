import { useState } from "react";
import { aiService, Persona, AnalysisResult } from "@/services/aiService";

export type { Persona, AnalysisResult };

export interface ArticleData {
  title: string;
  source: { name: string };
  description?: string;
}

export const useGeminiAnalysis = () => {
  const [results, setResults] = useState<Record<Persona, AnalysisResult | null>>({
    Analyst: null,
    Humanist: null,
    Strategist: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (articles: ArticleData[]) => {
    if (!articles || articles.length === 0) {
      setResults({ Analyst: null, Humanist: null, Strategist: null });
      return;
    }

    setLoading(true);
    setError(null);

    const articlesText = articles
      .slice(0, 5) // limit context size
      .map((a) => `Title: ${a.title}\nSource: ${a.source.name}\nDescription: ${a.description || ""}`)
      .join("\n\n");

    const personas: Persona[] = ["Analyst", "Humanist", "Strategist"];

    try {
      if (aiService.isLocal()) {
        // Sequential for local models to prevent overloading
        for (const persona of personas) {
          const data = await aiService.analyze(articlesText, persona);
          setResults(prev => ({ ...prev, [persona]: data }));
        }
      } else {
        // Parallel for Gemini
        const promises = personas.map(async (persona) => {
          const data = await aiService.analyze(articlesText, persona);
          return { persona, data };
        });

        const completed = await Promise.all(promises);
        const newResults: Record<Persona, AnalysisResult | null> = {
          Analyst: null,
          Humanist: null,
          Strategist: null,
        };
        completed.forEach(({ persona, data }) => {
          newResults[persona] = data;
        });
        setResults(newResults);
      }
    } catch (err: unknown) {
      console.error("AI Analysis Error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate analysis.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResults({ Analyst: null, Humanist: null, Strategist: null });
    setError(null);
    setLoading(false);
  };

  const hasApiKey = aiService.getProviderName() === "GEMINI" ? !!import.meta.env.VITE_GEMINI_API_KEY : true;

  return { analyze, reset, results, loading, error, hasApiKey };
};
