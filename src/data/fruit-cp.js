// src/data/fruit-cp.js - CP Multipliers for 149 Canonical Devil Fruits

const FRUIT_CP_MULTIPLIERS = {
  // =====================================================
  // COMMON FRUITS (1.0x - 1.2x multiplier)
  // =====================================================
  "Gomu Gomu no Mi": 1.05,
  "Bara Bara no Mi": 1.02,
  "Sube Sube no Mi": 1.01,
  "Bomu Bomu no Mi": 1.12,
  "Kilo Kilo no Mi": 1.08,
  "Doru Doru no Mi": 1.06,
  "Bane Bane no Mi": 1.03,
  "Supa Supa no Mi": 1.10,
  "Toge Toge no Mi": 1.07,
  "Ori Ori no Mi": 1.04,
  "Baku Baku no Mi": 1.09,
  "Mane Mane no Mi": 1.05,
  "Hana Hana no Mi": 1.11,
  "Shari Shari no Mi": 1.03,
  "Beri Beri no Mi": 1.02,
  "Sabi Sabi no Mi": 1.01,
  "Shabon Shabon no Mi": 1.04,
  "Awa Awa no Mi": 1.06,
  "Goe Goe no Mi": 1.08,
  "Hiso Hiso no Mi": 1.02,
  "Kama Kama no Mi": 1.09,
  "Kachi Kachi no Mi": 1.10,
  "Nemu Nemu no Mi": 1.01,
  "Mini Mini no Mi": 1.03,

  // =====================================================
  // UNCOMMON FRUITS (1.2x - 1.4x multiplier)
  // =====================================================
  "Horo Horo no Mi": 1.25,
  "Suke Suke no Mi": 1.32,
  "Nikyu Nikyu no Mi": 1.38,
  "Mero Mero no Mi": 1.28,
  "Doa Doa no Mi": 1.22,
  "Kage Kage no Mi": 1.35,
  "Horu Horu no Mi": 1.26,
  "Choki Choki no Mi": 1.34,
  "Yomi Yomi no Mi": 1.30,
  "Kuma Kuma no Mi": 1.36,
  "Ushi Ushi no Mi, Model: Bison": 1.38,
  "Hito Hito no Mi": 1.20,
  "Tori Tori no Mi, Model: Falcon": 1.33,
  "Mogu Mogu no Mi": 1.27,
  "Inu Inu no Mi, Model: Dachshund": 1.24,
  "Inu Inu no Mi, Model: Jackal": 1.31,
  "Tori Tori no Mi, Model: Eagle": 1.35,
  "Saru Saru no Mi": 1.29,
  "Uma Uma no Mi": 1.37,
  "Neko Neko no Mi, Model: Leopard": 1.39,
  "Zou Zou no Mi": 1.40,
  "Inu Inu no Mi, Model: Wolf": 1.34,
  "Neko Neko no Mi, Model: Saber Tiger": 1.36,
  "Batto Batto no Mi, Model: Vampire": 1.31,
  "Kumo Kumo no Mi, Model: Rosamygale Grauvogeli": 1.35,
  "Ryu Ryu no Mi, Model: Spinosaurus": 1.38,
  "Ryu Ryu no Mi, Model: Pteranodon": 1.37,
  "Ryu Ryu no Mi, Model: Brachiosaurus": 1.40,
  "Ryu Ryu no Mi, Model: Allosaurus": 1.36,
  "Ryu Ryu no Mi, Model: Triceratops": 1.39,
  "Zou Zou no Mi, Model: Mammoth": 1.40,
  "Ryu Ryu no Mi, Model: Pachycephalosaurus": 1.38,
  "Neko Neko no Mi, Model: Smilodon": 1.37,
  "Inu Inu no Mi, Model: Kyubi no Kitsune": 1.35,
  "Sara Sara no Mi, Model: Axolotl": 1.28,

  // =====================================================
  // RARE FRUITS (1.4x - 1.7x multiplier)
  // =====================================================
  "Mera Mera no Mi": 1.65,
  "Hie Hie no Mi": 1.63,
  "Suna Suna no Mi": 1.60,
  "Moku Moku no Mi": 1.45,
  "Goro Goro no Mi": 1.70,
  "Numa Numa no Mi": 1.50,
  "Gasu Gasu no Mi": 1.52,
  "Yuki Yuki no Mi": 1.48,
  "Beta Beta no Mi": 1.42,
  "Noro Noro no Mi": 1.41,
  "Doku Doku no Mi": 1.58,
  "Hobi Hobi no Mi": 1.55,
  "Bari Bari no Mi": 1.53,
  "Nui Nui no Mi": 1.46,
  "Gura Gura no Mi": 1.68,
  "Yami Yami no Mi": 1.66,
  "Kira Kira no Mi": 1.62,
  "Sabi Sabi no Mi": 1.44,
  "Ito Ito no Mi": 1.64,
  "Zushi Zushi no Mi": 1.67,

  // =====================================================
  // EPIC FRUITS (1.7x - 2.1x multiplier)
  // =====================================================
  "Pika Pika no Mi": 2.05,
  "Magu Magu no Mi": 2.10,
  "Ope Ope no Mi": 1.90,
  "Nikyu Nikyu no Mi, Awakened": 2.00,
  "Mochi Mochi no Mi": 1.95,
  "Memo Memo no Mi": 1.80,
  "Bisu Bisu no Mi": 1.98,
  "Pero Pero no Mi": 1.85,
  "Soru Soru no Mi": 2.08,
  "Mira Mira no Mi": 1.92,
  "Hoya Hoya no Mi": 1.88,
  "Netsu Netsu no Mi": 2.02,
  "Kuku Kuku no Mi": 1.82,
  "Gocha Gocha no Mi": 2.06,
  "Oshi Oshi no Mi": 1.96,

  // =====================================================
  // LEGENDARY FRUITS (2.1x - 2.6x multiplier)
  // =====================================================
  "Hito Hito no Mi, Model: Nika": 2.50,
  "Tori Tori no Mi, Model: Phoenix": 2.40,
  "Uo Uo no Mi, Model: Seiryu": 2.55,
  "Hito Hito no Mi, Model: Daibutsu": 2.45,
  "Hebi Hebi no Mi, Model: Yamata-no-Orochi": 2.35,
  "Inu Inu no Mi, Model: Okuchi no Makami": 2.25,
  "Toki Toki no Mi": 2.20,
  "Yami Yami no Mi, Awakened": 2.58,
  "Gura Gura no Mi, Awakened": 2.60,
  "Ope Ope no Mi, Ultimate": 2.50,

  // =====================================================
  // MYTHICAL FRUITS (2.6x - 3.2x multiplier)
  // =====================================================
  "Hito Hito no Mi, Model: Nika, Awakened": 3.00,
  "Yami Yami no Mi + Gura Gura no Mi": 3.20,
  "Soru Soru no Mi, Awakened": 2.80,
  "Magu Magu no Mi, Awakened": 3.05,
  "Pika Pika no Mi, Awakened": 2.95,
  "Goro Goro no Mi, Awakened": 3.15,
  "Hobi Hobi no Mi, Awakened": 2.70,

  // =====================================================
  // OMNIPOTENT FRUITS (3.2x - 4.0x multiplier)
  // =====================================================
  "Hito Hito no Mi, Model: Nika, Perfect": 3.80,
  "Im-sama's Power": 4.00,
  "Joy Boy's Will": 3.60,
  "One Piece": 4.00,
  "Void Century Weapon": 3.40
};

// CP ranges for validation
const CP_RANGES = {
  common: { min: 1.0, max: 1.2 },
  uncommon: { min: 1.2, max: 1.4 },
  rare: { min: 1.4, max: 1.7 },
  epic: { min: 1.7, max: 2.1 },
  legendary: { min: 2.1, max: 2.6 },
  mythical: { min: 2.6, max: 3.2 },
  omnipotent: { min: 3.2, max: 4.0 }
};

// Utility functions
function getFruitCP(fruitName) {
  return FRUIT_CP_MULTIPLIERS[fruitName] || 1.0;
}

function getFruitCPAsInt(fruitName) {
  return Math.floor(getFruitCP(fruitName) * 100);
}

function intToCP(intValue) {
  return intValue / 100;
}

function getCPRange(rarity) {
  return CP_RANGES[rarity] || { min: 1.0, max: 1.2 };
}

function isValidCP(cp, rarity) {
  const range = getCPRange(rarity);
  return cp >= range.min && cp <= range.max;
}

function getRandomCPForRarity(rarity) {
  const range = getCPRange(rarity);
  return Math.random() * (range.max - range.min) + range.min;
}

function getRarityFromCP(cp) {
  for (const [rarity, range] of Object.entries(CP_RANGES)) {
    if (cp >= range.min && cp <= range.max) {
      return rarity;
    }
  }
  return 'common';
}

function getCPTierDescription(cp) {
  if (cp >= 3.2) return 'Omnipotent';
  if (cp >= 2.6) return 'Mythical';
  if (cp >= 2.1) return 'Legendary';
  if (cp >= 1.7) return 'Epic';
  if (cp >= 1.4) return 'Rare';
  if (cp >= 1.2) return 'Uncommon';
  return 'Common';
}

function calculateTotalCP(baseCPFromLevel, fruits) {
  if (!fruits || fruits.length === 0) return baseCPFromLevel;
  
  const fruitGroups = {};
  
  // Group fruits by name to handle duplicates
  fruits.forEach(fruit => {
    const fruitName = fruit.fruit_name || fruit.name;
    if (!fruitGroups[fruitName]) {
      fruitGroups[fruitName] = {
        cpMultiplier: getFruitCP(fruitName),
        count: 0
      };
    }
    fruitGroups[fruitName].count++;
  });
  
  // Calculate total CP with duplicates
  let totalMultiplier = 0;
  Object.values(fruitGroups).forEach(group => {
    const baseMultiplier = group.cpMultiplier;
    const duplicateBonus = (group.count - 1) * 0.01; // 1% per duplicate
    totalMultiplier += baseMultiplier + duplicateBonus;
  });
  
  return Math.floor(baseCPFromLevel * (1 + totalMultiplier));
}

function calculateDuplicateBonus(duplicateCount) {
  return 1 + ((duplicateCount - 1) * 0.01);
}

function getCPStats() {
  const allCPs = Object.values(FRUIT_CP_MULTIPLIERS);
  return {
    total: allCPs.length,
    average: allCPs.reduce((sum, cp) => sum + cp, 0) / allCPs.length,
    min: Math.min(...allCPs),
    max: Math.max(...allCPs)
  };
}

function getTopCPFruits(limit = 10) {
  return Object.entries(FRUIT_CP_MULTIPLIERS)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([fruitName, cp]) => ({ fruitName, cp }));
}

function getFruitsByCPRange(minCP, maxCP) {
  return Object.entries(FRUIT_CP_MULTIPLIERS)
    .filter(([,cp]) => cp >= minCP && cp <= maxCP)
    .map(([fruitName, cp]) => ({ fruitName, cp }));
}

function getFruitsByRarity(rarity) {
  const range = getCPRange(rarity);
  return getFruitsByCPRange(range.min, range.max);
}

function validateCPMultipliers() {
  const errors = [];
  const stats = { total: 0, byRarity: {} };
  
  for (const [fruitName, cp] of Object.entries(FRUIT_CP_MULTIPLIERS)) {
    const rarity = getRarityFromCP(cp);
    
    if (!isValidCP(cp, rarity)) {
      errors.push(`${fruitName}: CP ${cp} doesn't match expected rarity ${rarity}`);
    }
    
    stats.total++;
    stats.byRarity[rarity] = (stats.byRarity[rarity] || 0) + 1;
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.slice(0, 10), // Limit to first 10 errors
    stats,
    totalFruits: stats.total
  };
}

module.exports = {
  FRUIT_CP_MULTIPLIERS,
  CP_RANGES,
  getFruitCP,
  getFruitCPAsInt,
  intToCP,
  getCPRange,
  getFruitsByCPRange,
  getFruitsByRarity,
  getTopCPFruits,
  calculateTotalCP,
  calculateDuplicateBonus,
  getCPStats,
  getRandomCPForRarity,
  getRarityFromCP,
  isValidCP,
  getCPTierDescription,
  validateCPMultipliers
};
