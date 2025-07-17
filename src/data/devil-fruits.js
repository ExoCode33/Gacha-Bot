// src/data/devil-fruits.js - Main devil fruits module (Fixed)

// Import all modules
const fruitsModule = require('./fruits');
const typesModule = require('./fruit-types');
const cpModule = require('./fruit-cp');

// Extract main data
const {
    DEVIL_FRUITS,
    RARITY_RATES,
    RARITY_COLORS,
    RARITY_EMOJIS,
    ELEMENT_COUNTERS,
    getRandomFruit: getRandomFruitBase,
    getFruitById: getFruitByIdBase,
    getFruitsByRarity,
    getAllFruits,
    getRarityColor,
    getRarityEmoji,
    getStats: getFruitStats
} = fruitsModule;

const {
    FRUIT_TYPES,
    TYPE_COUNTERS,
    getFruitType,
    getTypeEmoji,
    calculateBattleEffectiveness
} = typesModule;

const {
    FRUIT_CP_MULTIPLIERS,
    getFruitCP,
    getFruitCPAsInt,
    calculateTotalCP,
    calculateDuplicateBonus
} = cpModule;

// Enhanced functions that combine all data
function getRandomFruit() {
    const baseFruit = getRandomFruitBase();
    const typeData = getFruitType(baseFruit.id);
    const cpMultiplier = getFruitCP(baseFruit.id);
    
    return {
        ...baseFruit,
        fruitType: typeData.fruitType,
        element: typeData.fruitType, // For backwards compatibility
        multiplier: cpMultiplier
    };
}

function getFruitById(id) {
    const baseFruit = getFruitByIdBase(id);
    if (!baseFruit) return null;
    
    const typeData = getFruitType(id);
    const cpMultiplier = getFruitCP(id);
    
    return {
        ...baseFruit,
        fruitType: typeData.fruitType,
        element: typeData.fruitType, // For backwards compatibility
        multiplier: cpMultiplier
    };
}

// Level scaling for CP calculations
function calculateBaseCPFromLevel(level) {
    const levelScaling = {
        0: 100,
        5: 150,
        10: 200,
        15: 250,
        20: 300,
        25: 350,
        30: 400,
        35: 450,
        40: 500,
        45: 550,
        50: 600
    };
    
    return levelScaling[level] || 100;
}

// Get fruit ability (placeholder for now)
function getFruitAbility(fruitName) {
    // This would connect to the abilities system
    return {
        name: `${fruitName} Power`,
        damage: 100,
        cooldown: 2,
        effect: null,
        description: 'A powerful devil fruit ability'
    };
}

// Calculate PvP damage (simplified)
function calculatePvPDamage(attacker, defender, turn, skillName) {
    const baseDamage = 100;
    const turnMultiplier = turn === 1 ? 0.2 : 1.0; // 80% damage reduction on turn 1
    const cpRatio = Math.min(attacker.totalCP / defender.totalCP, 2.0);
    
    return Math.floor(baseDamage * turnMultiplier * cpRatio);
}

// Calculate health from CP
function calculateHealthFromCP(cp, rarity) {
    const baseHP = 1000;
    const cpMultiplier = 1 + (cp / 1000) * 0.1;
    const rarityMultipliers = {
        common: 1.0,
        uncommon: 1.1,
        rare: 1.3,
        epic: 1.6,
        legendary: 2.0,
        mythical: 2.5,
        omnipotent: 3.0
    };
    
    const rarityMultiplier = rarityMultipliers[rarity] || 1.0;
    return Math.floor(baseHP * cpMultiplier * rarityMultiplier);
}

// Export everything needed by the commands
module.exports = {
    // Core data
    DEVIL_FRUITS,
    RARITY_RATES,
    ELEMENT_COUNTERS,
    
    // Enhanced functions
    getRandomFruit,
    getFruitById,
    getFruitsByRarity,
    getAllFruits,
    getRarityColor,
    getRarityEmoji,
    getFruitAbility,
    
    // CP and level functions
    calculateBaseCPFromLevel,
    calculateTotalCP,
    calculateDuplicateBonus,
    getFruitCP,
    getFruitCPAsInt,
    
    // Type system
    getFruitType,
    getTypeEmoji,
    calculateBattleEffectiveness,
    
    // PvP functions
    calculatePvPDamage,
    calculateHealthFromCP,
    
    // Stats
    getStats: getFruitStats,
    
    // Constants
    TOTAL_FRUITS: Object.keys(DEVIL_FRUITS).length,
    RARITIES: Object.keys(RARITY_RATES)
};
