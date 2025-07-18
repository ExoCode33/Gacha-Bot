// src/data/devil-fruits.js - Main devil fruits module (128 New Fruits with Divine Rarity)

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

// Level scaling for CP calculations (updated for better balance)
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
            'divine': { name: 'Divine Technique', damage: 270, cooldown: 6 }
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

// Calculate PvP damage (updated for balance)
function calculatePvPDamage(attacker, defender, turn, skillName) {
    const baseDamage = 100;
    const turnMultiplier = turn === 1 ? 0.5 : (turn === 2 ? 0.7 : 1.0);
    const cpRatio = Math.min(attacker.totalCP / defender.totalCP, 2.5); // Limited to 2.5x
    
    return Math.floor(baseDamage * turnMultiplier * cpRatio);
}

// Calculate health from CP (updated for balance)
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
        divine: 3.0 // New divine tier
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

// Get system statistics (updated for divine tier)
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
        validation: validateAllData(),
        newFeatures: {
            divineRarity: true,
            maxCPMultiplier: 3.0,
            totalFruits: 128,
            balancedPvP: true
        }
    };
}

// Get fruits by multiple criteria (updated)
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
            fruit.type.toLowerCase().includes(searchTerm) ||
            fruit.power.toLowerCase().includes(searchTerm) ||
            fruit.user.toLowerCase().includes(searchTerm) ||
            fruit.rarity.toLowerCase().includes(searchTerm)
        );
    }
    
    return fruits;
}

// Get recommended fruits for collection (updated for divine tier)
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
    
    // Sort by rarity and CP (updated with divine tier)
    return uniqueRecommendations.sort((a, b) => {
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical', 'divine'];
        const rarityDiff = rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
        if (rarityDiff !== 0) return rarityDiff;
        
        return getFruitCP(b.name) - getFruitCP(a.name);
    }).slice(0, 10); // Top 10 recommendations
}

// Get divine fruits specifically
function getDivineFruits() {
    return getFruitsByRarity('divine');
}

// Check if fruit is divine tier
function isDivineFruit(fruitName) {
    const fruit = getFruitByName(fruitName);
    return fruit && fruit.rarity === 'divine';
}

// Get rarity tier info (updated with divine)
function getRarityTierInfo(rarity) {
    const tierInfo = {
        common: {
            name: 'Common',
            emoji: '🟫',
            color: 0x8B4513,
            rate: '40%',
            cpRange: '1.0x - 1.2x',
            description: 'Basic devil fruits with standard abilities'
        },
        uncommon: {
            name: 'Uncommon',
            emoji: '🟩',
            color: 0x00FF00,
            rate: '30%',
            cpRange: '1.2x - 1.4x',
            description: 'Enhanced fruits with improved capabilities'
        },
        rare: {
            name: 'Rare',
            emoji: '🟦',
            color: 0x0080FF,
            rate: '20%',
            cpRange: '1.4x - 1.7x',
            description: 'Powerful fruits with unique abilities'
        },
        epic: {
            name: 'Epic',
            emoji: '🟪',
            color: 0x8000FF,
            rate: '7%',
            cpRange: '1.7x - 2.1x',
            description: 'Exceptional fruits with devastating powers'
        },
        legendary: {
            name: 'Legendary',
            emoji: '🟨',
            color: 0xFFD700,
            rate: '2.5%',
            cpRange: '2.1x - 2.4x',
            description: 'Legendary fruits that shape the world'
        },
        mythical: {
            name: 'Mythical',
            emoji: '🟧',
            color: 0xFF8000,
            rate: '0.4%',
            cpRange: '2.4x - 2.7x',
            description: 'Mythical powers beyond mortal comprehension'
        },
        divine: {
            name: 'Divine',
            emoji: '⭐',
            color: 0xFFFFFF,
            rate: '0.1%',
            cpRange: '2.7x - 3.0x',
            description: 'Divine powers that transcend all limits'
        }
    };
    
    return tierInfo[rarity] || tierInfo.common;
}

// Calculate balanced CP for PvP (prevents overwhelming advantages)
function calculateBalancedPvPCP(totalCP, fruits) {
    // Apply diminishing returns for very high CP
    const balancedCP = Math.floor(totalCP * 0.8); // 80% of full power for PvP balance
    
    // Additional balance based on fruit count
    const fruitCount = fruits ? fruits.length : 0;
    const countPenalty = Math.max(0.6, 1 - (fruitCount * 0.02)); // Max 40% reduction for having too many fruits
    
    return Math.floor(balancedCP * countPenalty);
}

// Get gacha rates info (updated with divine)
function getGachaRatesInfo() {
    return {
        rates: RARITY_RATES,
        expectedPulls: {
            common: 2.5,
            uncommon: 3.3,
            rare: 5,
            epic: 14.3,
            legendary: 40,
            mythical: 250,
            divine: 1000
        },
        pullCost: 1000,
        maxCPMultiplier: 3.0,
        totalFruits: Object.keys(DEVIL_FRUITS).length
    };
}

// Export everything needed by the commands (updated with divine tier)
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
    
    // PvP functions (updated for balance)
    calculatePvPDamage,
    calculateHealthFromCP,
    calculateBalancedPvPCP,
    
    // Search and filtering
    searchFruits,
    getFruitsByUser,
    getFruitsByMultipleCriteria,
    getRecommendedFruits,
    
    // Divine tier functions
    getDivineFruits,
    isDivineFruit,
    getRarityTierInfo,
    getGachaRatesInfo,
    
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
    
    // Constants (updated)
    TOTAL_FRUITS: Object.keys(DEVIL_FRUITS).length,
    RARITIES: Object.keys(RARITY_RATES),
    CANONICAL_COUNT: 128,
    MAX_CP_MULTIPLIER: 3.0,
    DIVINE_RARITY: true
};
