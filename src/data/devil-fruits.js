// src/data/devil-fruits.js - Main devil fruits data module

// Import all fruit data
const { commonFruits, uncommonFruits, rareFruits, epicFruits, legendaryFruits, mythicalFruits, omnipotentFruits } = require('./fruits');
const { fruitTypes } = require('./fruit-types');
const { devilFruitAbilities } = require('./devil-fruit-abilities');

// Rarity configuration
const rarityConfig = {
  common: { 
    weight: 40, 
    emoji: '🟫',
    cpMultiplier: { min: 1.0, max: 1.2 },
    fruits: commonFruits
  },
  uncommon: { 
    weight: 30, 
    emoji: '🟩',
    cpMultiplier: { min: 1.2, max: 1.4 },
    fruits: uncommonFruits
  },
  rare: { 
    weight: 20, 
    emoji: '🟦',
    cpMultiplier: { min: 1.4, max: 1.7 },
    fruits: rareFruits
  },
  epic: { 
    weight: 7, 
    emoji: '🟪',
    cpMultiplier: { min: 1.7, max: 2.1 },
    fruits: epicFruits
  },
  legendary: { 
    weight: 2.5, 
    emoji: '🟨',
    cpMultiplier: { min: 2.1, max: 2.6 },
    fruits: legendaryFruits
  },
  mythical: { 
    weight: 0.4, 
    emoji: '🟧',
    cpMultiplier: { min: 2.6, max: 3.2 },
    fruits: mythicalFruits
  },
  omnipotent: { 
    weight: 0.1, 
    emoji: '🌈',
    cpMultiplier: { min: 3.2, max: 4.0 },
    fruits: omnipotentFruits
  }
};

// Level scaling for balanced PvP
const levelScaling = {
  'Level-0': 100,
  'Level-5': 120,
  'Level-10': 140,
  'Level-15': 160,
  'Level-20': 180,
  'Level-25': 200,
  'Level-30': 220,
  'Level-35': 240,
  'Level-40': 260,
  'Level-45': 280,
  'Level-50': 300
};

// Utility functions
function getRarityEmoji(rarity) {
  return rarityConfig[rarity]?.emoji || '❓';
}

function getRarityWeight(rarity) {
  return rarityConfig[rarity]?.weight || 0;
}

function getRarityMultiplier(rarity) {
  const config = rarityConfig[rarity];
  if (!config) return 1.0;
  
  const { min, max } = config.cpMultiplier;
  return Math.random() * (max - min) + min;
}

function getRandomFruit() {
  // Calculate total weight
  const totalWeight = Object.values(rarityConfig).reduce((sum, config) => sum + config.weight, 0);
  
  // Generate random number
  let random = Math.random() * totalWeight;
  
  // Find rarity based on weight
  for (const [rarity, config] of Object.entries(rarityConfig)) {
    random -= config.weight;
    if (random <= 0) {
      // Get random fruit from this rarity
      const fruits = config.fruits;
      const randomFruit = fruits[Math.floor(Math.random() * fruits.length)];
      
      return {
        ...randomFruit,
        rarity: rarity,
        cpMultiplier: getRarityMultiplier(rarity)
      };
    }
  }
  
  // Fallback to common if something goes wrong
  const commonFruit = commonFruits[Math.floor(Math.random() * commonFruits.length)];
  return {
    ...commonFruit,
    rarity: 'common',
    cpMultiplier: getRarityMultiplier('common')
  };
}

function getAllFruits() {
  const allFruits = [];
  
  for (const [rarity, config] of Object.entries(rarityConfig)) {
    config.fruits.forEach(fruit => {
      allFruits.push({
        ...fruit,
        rarity: rarity,
        emoji: config.emoji
      });
    });
  }
  
  return allFruits;
}

function getFruitByName(name) {
  const allFruits = getAllFruits();
  return allFruits.find(fruit => 
    fruit.name.toLowerCase() === name.toLowerCase() ||
    fruit.name.toLowerCase().includes(name.toLowerCase())
  );
}

function getFruitsByRarity(rarity) {
  const config = rarityConfig[rarity];
  if (!config) return [];
  
  return config.fruits.map(fruit => ({
    ...fruit,
    rarity: rarity,
    emoji: config.emoji
  }));
}

function getFruitsByType(type) {
  const allFruits = getAllFruits();
  return allFruits.filter(fruit => fruit.type === type);
}

function calculateBaseCPFromLevel(level) {
  return levelScaling[level] || 100;
}

function calculateTotalCP(baseCPFromLevel, fruits) {
  if (!fruits || fruits.length === 0) return baseCPFromLevel;
  
  const totalMultiplier = fruits.reduce((sum, fruit) => {
    const baseMultiplier = fruit.cpMultiplier || 1.0;
    const duplicateBonus = (fruit.duplicates || 0) * 0.01; // 1% per duplicate
    return sum + baseMultiplier + duplicateBonus;
  }, 0);
  
  return Math.floor(baseCPFromLevel * totalMultiplier);
}

function getFruitAbility(fruitName) {
  return devilFruitAbilities[fruitName] || null;
}

function calculatePvPDamage(attacker, defender, turn, skillName) {
  const ability = getFruitAbility(skillName);
  if (!ability) return 0;
  
  const baseDamage = ability.damage || 0;
  const attackerCP = attacker.totalCP || 100;
  const defenderCP = defender.totalCP || 100;
  
  // CP difference mitigation (max 2x advantage)
  const cpRatio = Math.min(attackerCP / defenderCP, 2.0);
  const balancedRatio = 1 + ((cpRatio - 1) * 0.5);
  
  // Turn 1 damage reduction (80% DR)
  const turnMultiplier = turn === 1 ? 0.2 : 1.0;
  
  // Calculate final damage
  const finalDamage = baseDamage * balancedRatio * turnMultiplier;
  
  return Math.floor(finalDamage);
}

function calculateHealthFromCP(cp, rarity) {
  const baseHP = 1000;
  const cpMultiplier = 1 + (cp / 1000) * 0.1; // 10% per 1000 CP
  const rarityMultiplier = Math.sqrt(getRarityMultiplier(rarity));
  
  return Math.floor(baseHP * cpMultiplier * rarityMultiplier);
}

function validateFruitData() {
  const issues = [];
  
  // Check if all rarities have fruits
  for (const [rarity, config] of Object.entries(rarityConfig)) {
    if (!config.fruits || config.fruits.length === 0) {
      issues.push(`No fruits found for rarity: ${rarity}`);
    }
  }
  
  // Check for duplicate fruit names
  const allFruits = getAllFruits();
  const names = allFruits.map(f => f.name);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  
  if (duplicates.length > 0) {
    issues.push(`Duplicate fruit names found: ${duplicates.join(', ')}`);
  }
  
  // Check abilities exist for fruits
  const missingAbilities = [];
  allFruits.forEach(fruit => {
    if (!devilFruitAbilities[fruit.name]) {
      missingAbilities.push(fruit.name);
    }
  });
  
  if (missingAbilities.length > 0) {
    issues.push(`Missing abilities for: ${missingAbilities.slice(0, 5).join(', ')}${missingAbilities.length > 5 ? '...' : ''}`);
  }
  
  return issues;
}

// Export everything
module.exports = {
  // Data
  rarityConfig,
  levelScaling,
  fruitTypes,
  devilFruitAbilities,
  
  // Functions
  getRarityEmoji,
  getRarityWeight,
  getRarityMultiplier,
  getRandomFruit,
  getAllFruits,
  getFruitByName,
  getFruitsByRarity,
  getFruitsByType,
  getFruitAbility,
  
  // CP and Level calculations
  calculateBaseCPFromLevel,
  calculateTotalCP,
  calculateHealthFromCP,
  
  // PvP functions
  calculatePvPDamage,
  
  // Utility
  validateFruitData,
  
  // Constants
  TOTAL_FRUITS: getAllFruits().length,
  RARITIES: Object.keys(rarityConfig)
};
