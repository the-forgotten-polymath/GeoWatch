import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export type Persona = "Analyst" | "Humanist" | "Strategist";

export interface Entity {
  name: string;
  type: "person" | "place" | "organization" | "other";
}

export interface AnalysisResult {
  summary: string[];
  confidence: number;
  entities: Entity[];
}

const personaPrompts: Record<Persona, string> = {
  Analyst: "You are a cold, neutral intelligence analyst. Summarize the provided articles factually, cite causes and likely outcomes in exactly 3 paragraphs.",
  Humanist: "You are a human rights journalist. Focus on the human impact, civilian stories, and moral dimensions of the events described in the articles in exactly 3 paragraphs.",
  Strategist: "You are a geopolitical strategist at a hedge fund. Focus on economic, trade, and market implications based on the articles provided in exactly 3 paragraphs.",
};

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Exactly 3 paragraphs of summary about the articles based on the persona.",
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: "A confidence score between 0 and 100.",
    },
    entities: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          type: {
            type: SchemaType.STRING,
            enum: ["person", "place", "organization", "other"],
          },
        },
        required: ["name", "type"],
      },
    },
  },
  required: ["summary", "confidence", "entities"],
};

// Config
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || "gemini";
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const OLLAMA_BASE = import.meta.env.VITE_OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || "phi3:mini";

const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

export const getAIProvider = () => AI_PROVIDER;

async function geminiChat(prompt: string): Promise<string> {
  if (!genAI) throw new Error("Gemini API key not configured.");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function geminiAnalyze(articlesText: string, persona: Persona): Promise<AnalysisResult> {
  if (!genAI) throw new Error("Gemini API key not configured.");
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: responseSchema as any,
    },
  });
  const prompt = `${personaPrompts[persona]}\n\nArticles:\n${articlesText}`;
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

async function ollamaChat(prompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Ollama request failed: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function ollamaAnalyze(articlesText: string, persona: Persona): Promise<AnalysisResult> {
  const prompt = `${personaPrompts[persona]}

Articles:
${articlesText}

Respond with ONLY a valid JSON object. No markdown, no code fences, no text before or after the JSON.
The "summary" field MUST be an array of exactly 3 plain text strings (paragraphs), NOT objects.

Example of the exact format required:
{"summary":["This is the first paragraph of analysis.","This is the second paragraph of analysis.","This is the third paragraph of analysis."],"confidence":75,"entities":[{"name":"Example Person","type":"person"}]}`;

  const res = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });
  
  if (!res.ok) throw new Error(`Ollama request failed: ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";

  // Extract JSON object from response (strip any surrounding text/fences)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;
  
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      ...parsed,
      summary: normalizeSummary(parsed.summary),
    } as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse Ollama analysis JSON:", text);
    return {
      summary: [text.slice(0, 300), "Extraction failed.", ""],
      confidence: 50,
      entities: []
    };
  }
}

/**
 * Coerces any shape the model might return for "summary" into string[].
 * Handles: string[], object[] (e.g. [{para1:"..."}]), single object, plain string.
 */
function normalizeSummary(summary: unknown): string[] {
  if (!summary) return [];
  // Already a flat string array
  if (Array.isArray(summary)) {
    return summary.map((item) => {
      if (typeof item === "string") return item;
      // e.g. {"para1": "...", "para2": "..."} or {"0": "..."}
      if (typeof item === "object" && item !== null) {
        return Object.values(item as Record<string, unknown>)
          .map(String)
          .join(" ")
          .trim();
      }
      return String(item);
    });
  }
  // Model returned a single object instead of an array
  if (typeof summary === "object" && summary !== null) {
    return Object.values(summary as Record<string, unknown>).map(String);
  }
  // Fallback: plain string
  return [String(summary)];
};

export const aiService = {
  chat: (prompt: string) => (AI_PROVIDER === "ollama" ? ollamaChat(prompt) : geminiChat(prompt)),
  analyze: (articlesText: string, persona: Persona) => 
    (AI_PROVIDER === "ollama" ? ollamaAnalyze(articlesText, persona) : geminiAnalyze(articlesText, persona)),
  getProviderName: () => AI_PROVIDER.toUpperCase(),
  isLocal: () => AI_PROVIDER === "ollama"
};
