export type RelationType = 'conflict' | 'tension' | 'alliance' | 'trade';

export interface RelationEdge {
  source: string;
  target: string;
  type: RelationType;
  weight: number; // 1 to 10
}

export const globalRelations: RelationEdge[] = [
  // High Intensity Conflicts
  { source: 'RUS', target: 'UKR', type: 'conflict', weight: 10 },
  { source: 'ISR', target: 'IRN', type: 'conflict', weight: 9 },
  { source: 'SYR', target: 'TUR', type: 'conflict', weight: 8 },
  { source: 'SDN', target: 'SSD', type: 'conflict', weight: 8 },
  { source: 'ARM', target: 'AZE', type: 'conflict', weight: 7 },
  { source: 'MMR', target: 'THA', type: 'conflict', weight: 6 },
  
  // Severe Geopolitical Tensions
  { source: 'USA', target: 'CHN', type: 'tension', weight: 9 },
  { source: 'USA', target: 'RUS', type: 'tension', weight: 9 },
  { source: 'USA', target: 'IRN', type: 'tension', weight: 8 },
  { source: 'USA', target: 'PRK', type: 'tension', weight: 8 },
  { source: 'CHN', target: 'TWN', type: 'tension', weight: 10 },
  { source: 'IND', target: 'PAK', type: 'tension', weight: 9 },
  { source: 'IND', target: 'CHN', type: 'tension', weight: 8 },
  { source: 'KOR', target: 'PRK', type: 'tension', weight: 9 },
  { source: 'JPN', target: 'CHN', type: 'tension', weight: 7 },
  { source: 'JPN', target: 'PRK', type: 'tension', weight: 8 },
  { source: 'SAU', target: 'IRN', type: 'tension', weight: 8 },
  { source: 'EGY', target: 'ETH', type: 'tension', weight: 7 },
  { source: 'GRC', target: 'TUR', type: 'tension', weight: 7 },
  
  // High-Grade Strategic Alliances
  { source: 'USA', target: 'GBR', type: 'alliance', weight: 10 },
  { source: 'USA', target: 'FRA', type: 'alliance', weight: 8 },
  { source: 'USA', target: 'DEU', type: 'alliance', weight: 8 },
  { source: 'USA', target: 'JPN', type: 'alliance', weight: 9 },
  { source: 'USA', target: 'KOR', type: 'alliance', weight: 9 },
  { source: 'USA', target: 'ISR', type: 'alliance', weight: 10 },
  { source: 'USA', target: 'AUS', type: 'alliance', weight: 9 },
  { source: 'USA', target: 'CAN', type: 'alliance', weight: 10 },
  { source: 'RUS', target: 'CHN', type: 'alliance', weight: 8 },
  { source: 'RUS', target: 'IRN', type: 'alliance', weight: 8 },
  { source: 'RUS', target: 'PRK', type: 'alliance', weight: 9 },
  { source: 'RUS', target: 'SYR', type: 'alliance', weight: 8 },
  { source: 'RUS', target: 'BLR', type: 'alliance', weight: 9 },
  { source: 'CHN', target: 'PAK', type: 'alliance', weight: 9 },
  { source: 'GBR', target: 'FRA', type: 'alliance', weight: 8 },
  
  // Massive Global Trade/Economic Dependency Webs
  { source: 'USA', target: 'MEX', type: 'trade', weight: 10 },
  { source: 'CHN', target: 'DEU', type: 'trade', weight: 8 },
  { source: 'CHN', target: 'BRA', type: 'trade', weight: 7 },
  { source: 'CHN', target: 'AUS', type: 'trade', weight: 7 },
  { source: 'CHN', target: 'KOR', type: 'trade', weight: 8 },
  { source: 'CHN', target: 'JPN', type: 'trade', weight: 8 },
  { source: 'DEU', target: 'FRA', type: 'trade', weight: 9 },
  { source: 'DEU', target: 'ITA', type: 'trade', weight: 8 },
  { source: 'DEU', target: 'NLD', type: 'trade', weight: 9 },
  { source: 'DEU', target: 'POL', type: 'trade', weight: 8 },
  { source: 'UKR', target: 'POL', type: 'trade', weight: 7 },
  { source: 'IND', target: 'USA', type: 'trade', weight: 8 },
  { source: 'IND', target: 'ARE', type: 'trade', weight: 7 },
  { source: 'SAU', target: 'CHN', type: 'trade', weight: 8 },
  { source: 'ZAF', target: 'CHN', type: 'trade', weight: 6 }
];
