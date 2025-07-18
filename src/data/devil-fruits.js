// src/data/devil-fruits.js - Main devil fruits module (149 Canonical Fruits)

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
    getFruitByName: getFruitByNameBase,
    getFruitsByRarity,
    getAllFruits,
    getRarityColor,
    getRarityEmoji,
    getStats: getFruitStats,
    validateFruits,
    searchFruits,
    getFruitsByType,
    getFruitsByUser,
    getCanonicalFruitCount
} = fruitsModule;

const {
    FRUIT_TYPES,
    TYPE_COUNTERS,
    TYPE_EFFECTIVENESS,
    TYPE_EMOJIS,
    getFruitType,
    getTypeMatchup,
    getFruitsByType: getFruitsByTypeFromTypes,
    getFruitsByElement,
    getAllFruitTypes,
    getAllElements,
    getTypeEmoji,
    calculateBattleEffectiveness,
    getTypeInfo,
    getTypeStats,
    validateTypeData,
    getElementCounterChain,
    getBalancedTypeMatchups,
    getElementalAdvantageMatrix,
    findElementalCounterRecommendations
} = typesModule;

const {
    FRUIT_CP_MULTIPLIERS,
    CP_RANGES,
    getFruitCP,
    getFruitCPAsInt,
    intToCP,
    getCPRange,
    getFruitsByCPRange,
    getFruitsByRarity: getFruitsByRarityFromCP,
    getTopCPFruits,
    calculateTotalCP,
    calculateDuplicateBonus,
    getCPStats,
    getRandomCPForRarity,
    getRarityFromCP,
    isValidCP,
    getCPTierDescription,
    validateCPMultipliers
} = cpModule;

// Enhanced functions that combine all data
function getRandomFruit() {
    const baseFruit = getRandomFruitBase();
    const typeData = getFruitType(baseFruit.name);
    const cpMultiplier = getFruitCP(baseFruit.name);
    
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
    
    const typeData = getFruitType(baseFruit.name);
    const cpMultiplier = getFruitCP(baseFruit.name);
    
    return {
        ...baseFruit,
        fruitType: typeData.fruitType,
        element: typeData.fruitType, // For backwards compatibility
        multiplier: cpMultiplier
    };
}

function getFruitByName(name) {
    const baseFruit = getFruitByNameBase(name);
    if (!baseFruit) return null;
    
    const typeData = getFruitType(name);
    const cpMultiplier = getFruitCP(name);
    
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

// Get fruit ability (connects to abilities system)
function getFruitAbility(fruitName) {
    try {
        const { balancedDevilFruitAbilities } = require('./balanced-devil-fruit-abilities');
        const ability = balancedDevilFruitAbilities[fruitName];
        
        if (ability) {
            return ability;
        }
        
        // Fallback based on rarity
        const fruit = getFruitByName(fruitName);
        if (!fruit) return getDefaultAbility();
        
        const rarityAbilities = {
            'common': { name: 'Basic Attack', damage: 50, cooldown: 0 },
            'uncommon': { name: 'Enhanced Strike', damage: 70, cooldown: 1 },
            'rare': { name: 'Powerful Blow', damage: 100, cooldown: 2 },
            'epic': { name: 'Devastating Strike', damage: 140, cooldown: 3 },
            'legendary': { name: 'Legendary Technique', damage: 180, cooldown: 4 },
            'mythical': { name: 'Mythical Power', damage: 220, cooldown: 5 },
            'omnipotent': { name: 'Divine Technique', damage: 270, cooldown: 6 }
        };
        
        return rarityAbilities[fruit.rarity] || getDefaultAbility();
    } catch (error) {
        return getDefaultAbility();
    }
}

function getDefaultAbility() {
    return {
        name: 'Devil Fruit Power',
        damage: 100,
        cooldown: 2,
        effect: null,
        description: 'A mysterious devil fruit ability'
    };
}

// Calculate PvP damage (simplified)
function calculatePvPDamage(attacker, defender, turn, skillName) {
    const baseDamage = 100;
    const turnMultiplier = turn === 1 ? 0.5 : (turn === 2 ? 0.7 : 1.0);
    const cpRatio = Math.min(attacker.totalCP / defender.totalCP, 2.5);
    
    return Math.floor(baseDamage * turnMultiplier * cpRatio);
}

// Calculate health from CP
function calculateHealthFromCP(cp, rarity) {
    const baseHP = 200;
    const cpMultiplier = 1 + (cp / 1000) * 0.2;
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

// Enhanced validation function
function validateAllData() {
    const fruitsValidation = validateFruits();
    const typesValidation = validateTypeData();
    const cpValidation = validateCPMultipliers();
    
    return {
        fruits: fruitsValidation,
        types: typesValidation,
        cp: cpValidation,
        overall: {
            isValid: fruitsValidation.isValid && typesValidation.isValid && cpValidation.isValid,
            totalErrors: (fruitsValidation.errors?.length || 0) + 
                        (typesValidation.errors?.length || 0) + 
                        (cpValidation.errors?.length || 0)
        }
    };
}

// Get comprehensive fruit data
function getComprehensiveFruitData(fruitName) {
    const baseFruit = getFruitByName(fruitName);
    if (!baseFruit) return null;
    
    const typeData = getFruitType(fruitName);
    const cpMultiplier = getFruitCP(fruitName);
    const ability = getFruitAbility(fruitName);
    
    return {
        ...baseFruit,
        fruitType: typeData.fruitType,
        element: typeData.fruitType,
        multiplier: cpMultiplier,
        ability: ability,
        typeInfo: getTypeInfo(typeData.fruitType),
        battleEffectiveness: {
            strongAgainst: TYPE_COUNTERS[typeData.fruitType] || [],
            weakAgainst: Object.entries(TYPE_COUNTERS)
                .filter(([type, counters]) => counters.includes(typeData.fruitType))
                .map(([type]) => type)
        }
    };
}

// Get system statistics
function getSystemStats() {
    const fruitStats = getFruitStats();
    const typeStats = getTypeStats();
    const cpStats = getCPStats();
    const canonicalCount = getCanonicalFruitCount();
    
    return {
        fruits: fruitStats,
        types: typeStats,
        cp: cpStats,
        canonical: canonicalCount,
        validation: validateAllData()
    };
}

// Get fruits by multiple criteria
function getFruitsByMultipleCriteria(criteria) {
    let fruits = getAllFruits();
    
    if (criteria.rarity) {
        fruits = fruits.filter(fruit => fruit.rarity === criteria.rarity);
    }
    
    if (criteria.type) {
        fruits = fruits.filter(fruit => fruit.type === criteria.type);
    }
    
    if (criteria.user) {
        fruits = fruits.filter(fruit => 
            fruit.user.toLowerCase().includes(criteria.user.toLowerCase())
        );
    }
    
    if (criteria.minCP) {
        fruits = fruits.filter(fruit => getFruitCP(fruit.name) >= criteria.minCP);
    }
    
    if (criteria.maxCP) {
        fruits = fruits.filter(fruit => getFruitCP(fruit.name) <= criteria.maxCP);
    }
    
    if (criteria.element) {
        fruits = fruits.filter(fruit => {
            const typeData = getFruitType(fruit.name);
            return typeData.fruitType === criteria.element;
        });
    }
    
    if (criteria.search) {
        const searchTerm = criteria.search.toLowerCase();
        fruits = fruits.filter(fruit => 
            fruit.name.toLowerCase().includes(searchTerm) ||
            fruit.power.toLowerCase().includes(searchTerm) ||
            fruit.user.toLowerCase().includes(searchTerm)
        );
    }
    
    return fruits;
}

// Get recommended fruits for collection
function getRecommendedFruits(userFruits, criteria = {}) {
    const userElements = userFruits.map(fruit => {
        const typeData = getFruitType(fruit.name || fruit.fruit_name);
        return typeData.fruitType;
    });
    
    const counterRecommendations = findElementalCounterRecommendations(userElements);
    const allFruits = getAllFruits();
    
    // Get fruits that counter user's weaknesses
    const recommendedFruits = [];
    
    counterRecommendations.forEach(rec => {
        rec.recommendedCounters.forEach(counterElement => {
            const fruitsWithElement = allFruits.filter(fruit => {
                const typeData = getFruitType(fruit.name);
                return typeData.fruitType === counterElement;
            });
            
            recommendedFruits.push(...fruitsWithElement);
        });
    });
    
    // Remove duplicates and fruits user already has
    const userFruitNames = userFruits.map(fruit => fruit.name || fruit.fruit_name);
    const uniqueRecommendations = recommendedFruits.filter((fruit, index, self) => 
        index === self.findIndex(f => f.name === fruit.name) &&
        !userFruitNames.includes(fruit.name)
    );
    
    // Sort by rarity and CP
    return uniqueRecommendations.sort((a, b) => {
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical', 'omnipotent'];
        const rarityDiff = rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
        if (rarityDiff !== 0) return rarityDiff;
        
        return getFruitCP(b.name) - getFruitCP(a.name);
    }).slice(0, 10); // Top 10 recommendations
}

// Export everything needed by the commands
module.exports = {
    // Core data
    DEVIL_FRUITS,
    RARITY_RATES,
    RARITY_COLORS,
    RARITY_EMOJIS,
    ELEMENT_COUNTERS,
    FRUIT_TYPES,
    TYPE_COUNTERS,
    TYPE_EFFECTIVENESS,
    TYPE_EMOJIS,
    FRUIT_CP_MULTIPLIERS,
    CP_RANGES,
    
    // Enhanced functions
    getRandomFruit,
    getFruitById,
    getFruitByName,
    getFruitsByRarity,
    getAllFruits,
    getRarityColor,
    getRarityEmoji,
    getFruitAbility,
    getComprehensiveFruitData,
    
    // CP and level functions
    calculateBaseCPFromLevel,
    calculateTotalCP,
    calculateDuplicateBonus,
    getFruitCP,
    getFruitCPAsInt,
    intToCP,
    getCPRange,
    getFruitsByCPRange,
    getTopCPFruits,
    getRandomCPForRarity,
    getRarityFromCP,
    isValidCP,
    getCPTierDescription,
    
    // Type system
    getFruitType,
    getTypeMatchup,
    getFruitsByType,
    getFruitsByElement,
    getAllFruitTypes,
    getAllElements,
    getTypeEmoji,
    calculateBattleEffectiveness,
    getTypeInfo,
    getElementCounterChain,
    getBalancedTypeMatchups,
    getElementalAdvantageMatrix,
    findElementalCounterRecommendations,
    
    // PvP functions
    calculatePvPDamage,
    calculateHealthFromCP,
    
    // Search and filtering
    searchFruits,
    getFruitsByUser,
    getFruitsByMultipleCriteria,
    getRecommendedFruits,
    
    // Stats and validation
    getStats: getFruitStats,
    getTypeStats,
    getCPStats,
    getCanonicalFruitCount,
    getSystemStats,
    validateAllData,
    validateFruits,
    validateTypeData,
    validateCPMultipliers,
    
    // Constants
    TOTAL_FRUITS: Object.keys(DEVIL_FRUITS).length,
    RARITIES: Object.keys(RARITY_RATES),
    CANONICAL_COUNT: 149
};
