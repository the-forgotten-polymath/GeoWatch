export interface CountryData {
  name: string;
  score: number; // 0-10
  category: string;
}

export const countryScores: Record<string, CountryData> = {
  UKR: { name: "Ukraine", score: 10, category: "Geopolitics" },
  RUS: { name: "Russia", score: 9, category: "Geopolitics" },
  ISR: { name: "Israel", score: 9, category: "Geopolitics" },
  PSE: { name: "Palestine", score: 10, category: "Human Rights" },
  SDN: { name: "Sudan", score: 9, category: "Human Rights" },
  MMR: { name: "Myanmar", score: 8, category: "Human Rights" },
  SYR: { name: "Syria", score: 8, category: "Geopolitics" },
  YEM: { name: "Yemen", score: 8, category: "Geopolitics" },
  AFG: { name: "Afghanistan", score: 8, category: "Human Rights" },
  IRN: { name: "Iran", score: 7, category: "Geopolitics" },
  PRK: { name: "North Korea", score: 7, category: "Geopolitics" },
  CHN: { name: "China", score: 6, category: "Tech" },
  TWN: { name: "Taiwan", score: 6, category: "Geopolitics" },
  USA: { name: "United States", score: 4, category: "Economy" },
  GBR: { name: "United Kingdom", score: 3, category: "Economy" },
  DEU: { name: "Germany", score: 3, category: "Economy" },
  FRA: { name: "France", score: 3, category: "Economy" },
  JPN: { name: "Japan", score: 2, category: "Natural Disasters" },
  IND: { name: "India", score: 5, category: "Tech" },
  BRA: { name: "Brazil", score: 4, category: "Natural Disasters" },
  NGA: { name: "Nigeria", score: 6, category: "Economy" },
  ETH: { name: "Ethiopia", score: 7, category: "Human Rights" },
  COD: { name: "DR Congo", score: 8, category: "Human Rights" },
  SOM: { name: "Somalia", score: 8, category: "Geopolitics" },
  LBY: { name: "Libya", score: 7, category: "Geopolitics" },
  VEN: { name: "Venezuela", score: 6, category: "Economy" },
  MEX: { name: "Mexico", score: 5, category: "Economy" },
  PAK: { name: "Pakistan", score: 6, category: "Natural Disasters" },
  TUR: { name: "Turkey", score: 5, category: "Natural Disasters" },
  PHL: { name: "Philippines", score: 4, category: "Natural Disasters" },
  AUS: { name: "Australia", score: 2, category: "Natural Disasters" },
  CAN: { name: "Canada", score: 1, category: "Economy" },
  KOR: { name: "South Korea", score: 3, category: "Tech" },
  ZAF: { name: "South Africa", score: 5, category: "Economy" },
  EGY: { name: "Egypt", score: 5, category: "Geopolitics" },
  SAU: { name: "Saudi Arabia", score: 4, category: "Geopolitics" },
  IDN: { name: "Indonesia", score: 3, category: "Natural Disasters" },
  HTI: { name: "Haiti", score: 7, category: "Natural Disasters" },
  COL: { name: "Colombia", score: 4, category: "Economy" },
  ARG: { name: "Argentina", score: 4, category: "Economy" },
  ARM: { name: "Armenia", score: 7, category: "Geopolitics" },
  AZE: { name: "Azerbaijan", score: 7, category: "Geopolitics" },
  SSD: { name: "South Sudan", score: 8, category: "Human Rights" },
  THA: { name: "Thailand", score: 4, category: "Geopolitics" },
  GRC: { name: "Greece", score: 3, category: "Economy" },
  ARE: { name: "UAE", score: 3, category: "Economy" },
  POL: { name: "Poland", score: 3, category: "Geopolitics" },
  ITA: { name: "Italy", score: 2, category: "Economy" },
  NLD: { name: "Netherlands", score: 2, category: "Economy" },
  BLR: { name: "Belarus", score: 7, category: "Geopolitics" },
};

export const countryTimezones: Record<string, string> = {
  UKR: "Europe/Kyiv",
  RUS: "Europe/Moscow",
  ISR: "Asia/Jerusalem",
  PSE: "Asia/Gaza",
  SDN: "Africa/Khartoum",
  MMR: "Asia/Yangon",
  SYR: "Asia/Damascus",
  YEM: "Asia/Riyadh",
  AFG: "Asia/Kabul",
  IRN: "Asia/Tehran",
  PRK: "Asia/Pyongyang",
  CHN: "Asia/Shanghai",
  TWN: "Asia/Taipei",
  USA: "America/New_York",
  GBR: "Europe/London",
  DEU: "Europe/Berlin",
  FRA: "Europe/Paris",
  JPN: "Asia/Tokyo",
  IND: "Asia/Kolkata",
  BRA: "America/Sao_Paulo",
  NGA: "Africa/Lagos",
  ETH: "Africa/Addis_Ababa",
  COD: "Africa/Kinshasa",
  SOM: "Africa/Mogadishu",
  LBY: "Africa/Tripoli",
  VEN: "America/Caracas",
  MEX: "America/Mexico_City",
  PAK: "Asia/Karachi",
  TUR: "Europe/Istanbul",
  PHL: "Asia/Manila",
  AUS: "Australia/Sydney",
  CAN: "America/Toronto",
  KOR: "Asia/Seoul",
  ZAF: "Africa/Johannesburg",
  EGY: "Africa/Cairo",
  SAU: "Asia/Riyadh",
  IDN: "Asia/Jakarta",
  HTI: "America/Port-au-Prince",
  COL: "America/Bogota",
  ARG: "America/Argentina/Buenos_Aires",
  ARM: "Asia/Yerevan",
  AZE: "Asia/Baku",
  SSD: "Africa/Juba",
  THA: "Asia/Bangkok",
  GRC: "Europe/Athens",
  ARE: "Asia/Dubai",
  POL: "Europe/Warsaw",
  ITA: "Europe/Rome",
  NLD: "Europe/Amsterdam",
  BLR: "Europe/Minsk",
};

export function getCountryTime(iso: string): string | null {
  const tz = countryTimezones[iso];
  if (!tz) return null;
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date());
  } catch (e) {
    return null;
  }
}

export const categories = [
  "All",
  "Geopolitics",
  "Tech",
  "Natural Disasters",
  "Economy",
  "Human Rights",
] as const;

export type Category = (typeof categories)[number];

/** Legacy score-based color (used as fallback before Goldstein data loads). */
export function getColor(score: number): string {
  if (score >= 9) return "#ef4444"; // Red
  if (score >= 7) return "#f97316"; // Orange
  if (score >= 5) return "#eab308"; // Yellow
  if (score >= 3) return "#22c55e"; // Green
  if (score >= 1) return "#14532d"; // Dark Green
  return "hsl(0, 0%, 8%)";
}

export const unknownColor = "hsl(0, 0%, 5%)";
