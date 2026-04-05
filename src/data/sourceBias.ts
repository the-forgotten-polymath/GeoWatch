export type Bias = "Left" | "Center" | "Right" | "Mixed";

export const SOURCE_BIAS: Record<string, Bias> = {
  "The Guardian": "Left",
  "CNN": "Left",
  "New York Times": "Left",
  "Reuters": "Center",
  "AP": "Center",
  "GDELT": "Center",
  "Fox News": "Right",
  "WSJ": "Right",
  "Reddit": "Mixed",
  "Twitter": "Mixed",
  "X": "Mixed",
};

export function getBiasColor(bias: Bias): string {
  switch (bias) {
    case "Left": return "text-blue-400 border-blue-400/30 bg-blue-400/10";
    case "Center": return "text-white/60 border-white/20 bg-white/5";
    case "Right": return "text-red-400 border-red-400/30 bg-red-400/10";
    case "Mixed": return "text-purple-400 border-purple-400/30 bg-purple-400/10";
    default: return "text-white/40 border-white/10";
  }
}
