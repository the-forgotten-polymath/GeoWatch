import React from "react";

const THREAT_WORDS = new Set([
  "war", "attack", "strike", "crisis", "conflict", "casualties", "death", "dead",
  "killed", "injured", "military", "forces", "missile", "drone", "terror", "threat",
  "bomb", "explosion", "shooting", "rebel", "insurgent", "troops", "army", "navy",
  "nuclear", "weapon", "weapons", "cyberattack", "hackers", "breach", "classified",
  "blood", "assassination", "coup", "dictator", "invasion", "deploy"
]);

const ENTITY_WORDS = new Set([
  "government", "nato", "un", "police", "agency", "president", "minister", "official",
  "council", "parliament", "regime", "state", "federal", "court", "supreme", "election",
  "vote", "law", "treaty", "cyber", "intelligence", "cia", "fbi", "nsa", "kgb", "mi6", "interpol",
  "jurisdiction", "sovereignty"
]);

const ORG_REGEX = /^[A-Z]{2,}$/; // Acronyms like NATO, UN, USA

const MARKDOWN_LINK_REGEX = /(\[[^\]]+\]\([^)]+\))/g;
const EXACT_MARKDOWN_LINK = /^\[([^\]]+)\]\(([^)]+)\)$/;

export const FormattedText = ({ text, className = "" }: { text?: string | null; className?: string }) => {
  if (!text) return null;

  // Split by markdown links first to avoid breaking URLs with word boundaries
  const parts = text.split(MARKDOWN_LINK_REGEX);

  return (
    <span className={className}>
      {parts.map((part, pIdx) => {
        if (!part) return null;
        
        const linkMatch = part.match(EXACT_MARKDOWN_LINK);
        if (linkMatch) {
          const [, label, url] = linkMatch;
          return (
            <a 
              key={pIdx} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-white underline decoration-primary/50 hover:decoration-white transition-colors"
            >
              {label}
            </a>
          );
        }

        // Split by alphanumeric word boundaries to preserve all punctuation and spacing
        const tokens = part.split(/(\b[a-zA-Z0-9]+\b)/g);

        return tokens.map((token, i) => {
          if (!token) return null;
          
          // If not a word/number, render as raw text (punctuation, spacing)
          if (!/^[a-zA-Z0-9]+$/.test(token)) {
            return <React.Fragment key={`${pIdx}-${i}`}>{token}</React.Fragment>;
          }

          const lower = token.toLowerCase();

          // Numbers/Metrics -> Cyan Italics
          if (/^\d+/.test(token)) {
            return <span key={`${pIdx}-${i}`} className="text-cyan-400 font-bold italic">{token}</span>;
          }
          
          // Threat Keywords -> Red Bold Uppercase
          if (THREAT_WORDS.has(lower)) {
            return <span key={`${pIdx}-${i}`} className="text-red-500 font-bold uppercase tracking-wider">{token}</span>;
          }

          // Entity Keywords -> Primary Green Bold
          if (ENTITY_WORDS.has(lower)) {
            return <span key={`${pIdx}-${i}`} className="text-primary font-bold">{token}</span>;
          }

          // Acronyms -> Bright White Wide
          if (ORG_REGEX.test(token)) {
            return <span key={`${pIdx}-${i}`} className="text-white font-bold tracking-widest">{token}</span>;
          }

          // Proper Nouns -> Slightly emphasized
          if (/^[A-Z][a-z]+$/.test(token)) {
            return <span key={`${pIdx}-${i}`} className="text-foreground/90 font-medium">{token}</span>;
          }

          // Standard words inherit parent color
          return <React.Fragment key={`${pIdx}-${i}`}>{token}</React.Fragment>;
        });
      })}
    </span>
  );
};
