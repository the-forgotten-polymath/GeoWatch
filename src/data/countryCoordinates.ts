// Accurate capital/major-city coordinates for every country in countryScores + relationship edges.
// Format: ISO Alpha-3 -> [longitude, latitude]

export const countryCoordinates: Record<string, [number, number]> = {
  // === Countries from countryScores ===
  UKR: [30.5234, 50.4501],    // Kyiv
  RUS: [37.6173, 55.7558],    // Moscow
  ISR: [35.2137, 31.7683],    // Jerusalem
  PSE: [35.2332, 31.9522],    // Ramallah
  SDN: [32.5599, 15.5007],    // Khartoum
  MMR: [96.1951, 16.8661],    // Yangon
  SYR: [36.2765, 33.5138],    // Damascus
  YEM: [44.2075, 15.3694],    // Sanaa
  AFG: [69.1723, 34.5553],    // Kabul
  IRN: [51.3890, 35.6892],    // Tehran
  PRK: [125.7625, 39.0392],   // Pyongyang
  CHN: [116.4074, 39.9042],   // Beijing
  TWN: [121.5654, 25.0330],   // Taipei
  USA: [-77.0369, 38.9072],   // Washington D.C.
  GBR: [-0.1276, 51.5074],    // London
  DEU: [13.4050, 52.5200],    // Berlin
  FRA: [2.3522, 48.8566],     // Paris
  JPN: [139.6917, 35.6895],   // Tokyo
  IND: [77.2090, 28.6139],    // New Delhi
  BRA: [-47.8825, -15.7942],  // Brasília
  NGA: [7.4951, 9.0579],      // Abuja
  ETH: [38.7578, 9.0192],     // Addis Ababa
  COD: [15.2663, -4.4419],    // Kinshasa
  SOM: [45.3182, 2.0469],     // Mogadishu
  LBY: [13.1913, 32.8872],    // Tripoli
  VEN: [-66.9036, 10.4806],   // Caracas
  MEX: [-99.1332, 19.4326],   // Mexico City
  PAK: [73.0479, 33.6844],    // Islamabad
  TUR: [32.8597, 39.9334],    // Ankara
  PHL: [120.9842, 14.5995],   // Manila
  AUS: [149.1300, -35.2809],  // Canberra
  CAN: [-75.6972, 45.4215],   // Ottawa
  KOR: [126.9780, 37.5665],   // Seoul
  ZAF: [28.0473, -25.7479],   // Pretoria
  EGY: [31.2357, 30.0444],    // Cairo
  SAU: [46.6753, 24.7136],    // Riyadh
  IDN: [106.8456, -6.2088],   // Jakarta
  HTI: [-72.3388, 18.5944],   // Port-au-Prince
  COL: [-74.0721, 4.7110],    // Bogotá
  ARG: [-58.3816, -34.6037],  // Buenos Aires

  // === Additional countries from relationships (not in countryScores) ===
  SSD: [31.5825, 4.8594],     // Juba (South Sudan)
  THA: [100.5018, 13.7563],   // Bangkok
  ARM: [44.5152, 40.1792],    // Yerevan
  AZE: [49.8671, 40.4093],    // Baku
  BLR: [27.5615, 53.9006],    // Minsk
  GRC: [23.7275, 37.9838],    // Athens
  ITA: [12.4964, 41.9028],    // Rome
  NLD: [4.9041, 52.3676],     // Amsterdam
  POL: [21.0122, 52.2297],    // Warsaw
  ARE: [54.3773, 24.4539],    // Abu Dhabi
};
