// Extract functions from types// src/data/devil-fruits.js - Main Devil Fruit System (Fixed CommonJS imports)
const fruitsModule = require('./fruits');
const typesModule = require('./fruit-types');
const cpModule = require('./fruit-cp');

// Extract functions from fruits module
const {
    DEVIL_FRUITS, 
    RARITY_RATES, 
    getRandomFruit: getRandomFruitFromDB,
    getFruitById: getFruitByIdFromDB,
    getFruitsByRarity,
    getRarityColor,
    getRarityEmoji,
    getAllFruits,
    getStats: getFruitStats
} = fruitsModule;

// Extract functions from types module (with fallbacks in case module doesn't exist)
let FRUIT_TYPES, TYPE_COUNTERS, TYPE_EFFECTIVENESS, getTypeMatchup, getFruitType, 
    getFruitsByType, getAllFruitTypes, getTypeEmoji, calculateBattleEffectiveness, 
    getTypeInfo, getTypeStats;

try {
    const typesModuleData = typesModule;
    FRUIT_TYPES = typesModuleData.FRUIT_TYPES;
    TYPE_COUNTERS = typesModuleData.TYPE_COUNTERS;
    TYPE_EFFECTIVENESS = typesModuleData.TYPE_EFFECTIVENESS;
    getTypeMatchup = typesModuleData.getTypeMatchup;
    getFruitType = typesModuleData.getFruitType;
    getFruitsByType = typesModuleData.getFruitsByType;
    getAllFruitTypes = typesModuleData.getAllFruitTypes;
    getTypeEmoji = typesModuleData.getTypeEmoji;
    calculateBattleEffectiveness = typesModuleData.calculateBattleEffectiveness;
    getTypeInfo = typesModuleData.getTypeInfo;
    getTypeStats = typesModuleData.getTypeStats;
} catch (error) {
    console.warn('Types module not found, using fallback functions');
    // Fallback implementations
    FRUIT_TYPES = {};
    TYPE_COUNTERS = {};
    TYPE_EFFECTIVENESS = { NORMAL: 1.0 };
    getTypeMatchup = () => 1.0;
    getFruitType = (id) => ({ type: 'Paramecia', fruitType: 'Unknown' });
    getFruitsByType = () => [];
    getAllFruitTypes = () => ['Unknown'];
    getTypeEmoji = () => '❓';
    calculateBattleEffectiveness = () => ({ effectiveness: 1.0, message: 'Normal' });
    getTypeInfo = () => ({ name: 'Unknown', emoji: '❓' });
    getTypeStats = () => ({ totalTypes: 0 });
}

// Extract functions from CP module (with fallbacks in case module doesn't exist)
let FRUIT_CP_MULTIPLIERS, CP_RANGES, getFruitCP, getFruitCPAsInt, intToCP, getCPRange, 
    getFruitsByCPRange, getTopCPFruits, calculateTotalCP, calculateDuplicateBonus, 
    getCPStats, getRandomCPForRarity, getRarityFromCP, isValidCP, getCPTierDescription;

try {
    const cpModuleData = cpModule;
    FRUIT_CP_MULTIPLIERS = cpModuleData.FRUIT_CP_MULTIPLIERS;
    CP_RANGES = cpModuleData.CP_RANGES;
    getFruitCP = cpModuleData.getFruitCP;
    getFruitCPAsInt = cpModuleData.getFruitCPAsInt;
    intToCP = cpModuleData.intToCP;
    getCPRange = cpModuleData.getCPRange;
    getFruitsByCPRange = cpModuleData.getFruitsByCPRange;
    getTopCPFruits = cpModuleData.getTopCPFruits;
    calculateTotalCP = cpModuleData.calculateTotalCP;
    calculateDuplicateBonus = cpModuleData.calculateDuplicateBonus;
    getCPStats = cpModuleData.getCPStats;
    getRandomCPForRarity = cpModuleData.getRandomCPForRarity;
    getRarityFromCP = cpModuleData.getRarityFromCP;
    isValidCP = cpModuleData.isValidCP;
    getCPTierDescription = cpModuleData.getCPTierDescription;
} catch (error) {
    console.warn('CP module not found, using fallback functions');
    // Fallback implementations
    FRUIT_CP_MULTIPLIERS = {};
    CP_RANGES = {};
    getFruitCP = (id) => 1.0;
    getFruitCPAsInt = (id) => 100;
    intToCP = (val) => val / 100;
    getCPRange = () => ({ min: 1.0, max: 1.5 });
    getFruitsByCPRange = () => [];
    getTopCPFruits = () => [];
    calculateTotalCP = (base) => base;
    calculateDuplicateBonus = () => 1.0;
    getCPStats = () => ({ total: 0, average: 1.0 });
    getRandomCPForRarity = () => 1.0;
    getRarityFromCP = () => 'common';
    isValidCP = () => true;
    getCPTierDescription = () => 'Common';
}

// Enhanced function to get complete fruit data
function getRandomFruit() {
    const fruit = getRandomFruitFromDB();
    const fruitType = getFruitType(fruit.id);
    const cpMultiplier = getFruitCP(fruit.id);
    
    return {
        ...fruit,
        type: fruitType?.type || 'Paramecia',
        fruitType: fruitType?.fruitType || 'Unknown',
        element: fruitType?.fruitType || 'Unknown', // For backwards compatibility
        multiplier: cpMultiplier
    };
}

// Enhanced function to get fruit by ID with complete data
function getFruitById(id) {
    const fruit = getFruitByIdFromDB(id);
    if (!fruit) return null;
    
    const fruitType = getFruitType(id);
    const cpMultiplier = getFruitCP(id);
    
    return {
        ...fruit,
        type: fruitType?.type || 'Paramecia',
        fruitType: fruitType?.fruitType || 'Unknown',
        element: fruitType?.fruitType || 'Unknown', // For backwards compatibility
        multiplier: cpMultiplier
    };
}

// Enhanced function to get fruits by element (now fruitType)
function getFruitsByElement(element) {
    return getFruitsByType(element);
}

// Calculate element advantage (now type advantage)
function calculateElementAdvantage(attackerElement, defenderElement) {
    return getTypeMatchup(attackerElement, defenderElement);
}

// Get comprehensive stats
function getStats() {
    const fruitStats = getFruitStats();
    const typeStats = getTypeStats();
    let cpStats;
    try {
        cpStats = getCPStats();
    } catch (error) {
        cpStats = { total: 0, average: 1.0 };
    }
    
    return {
        fruits: fruitStats,
        types: typeStats,
        cp: cpStats,
        combined: {
            totalFruits: fruitStats.total,
            totalTypes: typeStats.totalTypes || 0,
            averageCP: cpStats.average || 1.0,
            topCPFruit: (() => {
                try {
                    return getTopCPFruits(1)[0];
                } catch (error) {
                    return null;
                }
            })()
        }
    };
}

// Enhanced fruit creation for database storage
function createFruitForStorage(fruitId) {
    const fruit = getFruitById(fruitId);
    if (!fruit) return null;
    
    return {
        id: fruit.id,
        name: fruit.name,
        type: fruit.type,
        rarity: fruit.rarity,
        fruitType: fruit.fruitType,
        power: fruit.power,
        description: fruit.description || fruit.power,
        cpMultiplier: getFruitCPAsInt(fruitId), // Store as integer
        source: fruit.source
    };
}

// Battle system integration
function simulateBattle(attackerFruitId, defenderFruitId) {
    const battle = calculateBattleEffectiveness(attackerFruitId, defenderFruitId);
    const attackerCP = getFruitCP(attackerFruitId);
    const defenderCP = getFruitCP(defenderFruitId);
    
    const baseDamage = attackerCP * 100; // Base damage calculation
    const finalDamage = Math.floor(baseDamage * battle.effectiveness);
    
    return {
        ...battle,
        attackerCP,
        defenderCP,
        baseDamage,
        finalDamage,
        damageMultiplier: battle.effectiveness
    };
}

// Utility function to get fruit display info
function getFruitDisplayInfo(fruitId) {
    const fruit = getFruitById(fruitId);
    if (!fruit) return null;
    
    const typeInfo = getTypeInfo(fruit.fruitType);
    const cpTier = getCPTierDescription(fruit.multiplier);
    
    return {
        ...fruit,
        typeEmoji: getTypeEmoji(fruit.fruitType),
        rarityEmoji: getRarityEmoji(fruit.rarity),
        rarityColor: getRarityColor(fruit.rarity),
        cpTier,
        typeInfo,
        displayName: `${getRarityEmoji(fruit.rarity)} ${fruit.name}`,
        powerLevel: `${fruit.multiplier}x CP`,
        category: `${getTypeEmoji(fruit.fruitType)} ${fruit.fruitType}`
    };
}

// Function to get fruits suitable for a specific level
function getFruitsForLevel(level, count = 5) {
    let targetRarity;
    
    if (level >= 50) targetRarity = 'omnipotent';
    else if (level >= 40) targetRarity = 'mythical';
    else if (level >= 30) targetRarity = 'legendary';
    else if (level >= 20) targetRarity = 'epic';
    else if (level >= 10) targetRarity = 'rare';
    else if (level >= 5) targetRarity = 'uncommon';
    else targetRarity = 'common';
    
    const fruits = getFruitsByRarity(targetRarity);
    const randomFruits = [];
    
    for (let i = 0; i < Math.min(count, fruits.length); i++) {
        const randomIndex = Math.floor(Math.random() * fruits.length);
        const fruitId = fruits[randomIndex].id;
        randomFruits.push(getFruitDisplayInfo(fruitId));
    }
    
    return randomFruits;
}

// Function to validate fruit data integrity
function validateFruitData() {
    const errors = [];
    const allFruitIds = Object.keys(DEVIL_FRUITS);
    
    // Check if all fruits have CP multipliers
    for (const fruitId of allFruitIds) {
        if (!FRUIT_CP_MULTIPLIERS[fruitId]) {
            errors.push(`Missing CP multiplier for ${fruitId}`);
        }
        
        if (!FRUIT_TYPES[fruitId]) {
            errors.push(`Missing type data for ${fruitId}`);
        }
    }
    
    // Check CP ranges match rarity
    for (const fruitId of allFruitIds) {
        const fruit = DEVIL_FRUITS[fruitId];
        const cp = FRUIT_CP_MULTIPLIERS[fruitId];
        
        if (cp && !isValidCP(cp, fruit.rarity)) {
            errors.push(`CP ${cp} invalid for ${fruit.rarity} fruit ${fruitId}`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        totalFruits: allFruitIds.length,
        checkedComponents: ['fruits', 'types', 'cp']
    };
}

// Export all functions and data
module.exports = {
    // Legacy exports (for backwards compatibility)
    DEVIL_FRUITS,
    RARITY_RATES,
    ELEMENT_COUNTERS: TYPE_COUNTERS, // Renamed for compatibility
    getRandomFruit,
    getFruitById,
    getFruitsByRarity,
    getFruitsByElement,
    calculateElementAdvantage,
    getRarityColor,
    getRarityEmoji,
    getAllFruits,
    getStats,
    
    // New exports
    FRUIT_TYPES,
    TYPE_COUNTERS,
    FRUIT_CP_MULTIPLIERS,
    CP_RANGES,
    TYPE_EFFECTIVENESS,
    
    // Type system functions
    getTypeMatchup,
    getFruitType,
    getFruitsByType,
    getAllFruitTypes,
    getTypeEmoji,
    calculateBattleEffectiveness,
    getTypeInfo,
    getTypeStats,
    
    // CP system functions
    getFruitCP,
    getFruitCPAsInt,
    intToCP,
    getCPRange,
    getFruitsByCPRange,
    getTopCPFruits,
    calculateTotalCP,
    calculateDuplicateBonus,
    getCPStats,
    getRandomCPForRarity,
    getRarityFromCP,
    isValidCP,
    getCPTierDescription,
    
    // Enhanced functions
    createFruitForStorage,
    simulateBattle,
    getFruitDisplayInfo,
    getFruitsForLevel,
    validateFruitData
};
