// src/data/fruits.js - Main Devil Fruits Database

// Import fruit arrays from fruit-cp module
const { 
    commonFruits, uncommonFruits, rareFruits, epicFruits, 
    legendaryFruits, mythicalFruits, omnipotentFruits 
} = require('./fruit-cp');

// Create unified devil fruits database
const DEVIL_FRUITS = {};

// Add all fruits to the database with their rarity
const addFruitsToDatabase = (fruits, rarity) => {
    fruits.forEach(fruit => {
        DEVIL_FRUITS[fruit.id] = {
            ...fruit,
            rarity
        };
    });
};

// Add fruits by rarity
addFruitsToDatabase(commonFruits, 'common');
addFruitsToDatabase(uncommonFruits, 'uncommon');
addFruitsToDatabase(rareFruits, 'rare');
addFruitsToDatabase(epicFruits, 'epic');
addFruitsToDatabase(legendaryFruits, 'legendary');
addFruitsToDatabase(mythicalFruits, 'mythical');
addFruitsToDatabase(omnipotentFruits, 'omnipotent');

// Rarity rates for gacha system
const RARITY_RATES = {
    common: 0.40,      // 40%
    uncommon: 0.30,    // 30%
    rare: 0.20,        // 20%
    epic: 0.07,        // 7%
    legendary: 0.025,  // 2.5%
    mythical: 0.004,   // 0.4%
    omnipotent: 0.001  // 0.1%
};

// Rarity colors for embeds
const RARITY_COLORS = {
    common: 0x8B4513,     // Brown
    uncommon: 0x00FF00,   // Green
    rare: 0x0080FF,       // Blue
    epic: 0x8000FF,       // Purple
    legendary: 0xFFD700,  // Gold
    mythical: 0xFF8000,   // Orange
    omnipotent: 0xFF0000  // Red
};

// Rarity emojis
const RARITY_EMOJIS = {
    common: '🟫',
    uncommon: '🟩',
    rare: '🟦',
    epic: '🟪',
    legendary: '🟨',
    mythical: '🟧',
    omnipotent: '🌈'
};

// Utility functions
function getRandomFruit() {
    // Calculate total weight
    const totalWeight = Object.values(RARITY_RATES).reduce((sum, rate) => sum + rate, 0);
    
    // Generate random number
    let random = Math.random() * totalWeight;
    
    // Find rarity based on weight
    for (const [rarity, rate] of Object.entries(RARITY_RATES)) {
        random -= rate;
        if (random <= 0) {
            // Get fruits of this rarity
            const fruitsOfRarity = Object.values(DEVIL_FRUITS).filter(fruit => fruit.rarity === rarity);
            
            if (fruitsOfRarity.length === 0) {
                // Fallback to common if no fruits found
                const commonFruitsList = Object.values(DEVIL_FRUITS).filter(fruit => fruit.rarity === 'common');
                return commonFruitsList[Math.floor(Math.random() * commonFruitsList.length)];
            }
            
            // Return random fruit of this rarity
            return fruitsOfRarity[Math.floor(Math.random() * fruitsOfRarity.length)];
        }
    }
    
    // Fallback to first fruit if something goes wrong
    return Object.values(DEVIL_FRUITS)[0];
}

function getFruitById(id) {
    return DEVIL_FRUITS[id] || null;
}

function getFruitsByRarity(rarity) {
    return Object.values(DEVIL_FRUITS).filter(fruit => fruit.rarity === rarity);
}

function getAllFruits() {
    return Object.values(DEVIL_FRUITS);
}

function getRarityColor(rarity) {
    return RARITY_COLORS[rarity] || 0x8B4513;
}

function getRarityEmoji(rarity) {
    return RARITY_EMOJIS[rarity] || '🟫';
}

function getStats() {
    const total = Object.keys(DEVIL_FRUITS).length;
    const byRarity = {};
    
    Object.values(DEVIL_FRUITS).forEach(fruit => {
        byRarity[fruit.rarity] = (byRarity[fruit.rarity] || 0) + 1;
    });
    
    return {
        total,
        byRarity,
        rarities: Object.keys(RARITY_RATES)
    };
}

function validateFruits() {
    const errors = [];
    
    // Check if we have fruits for each rarity
    for (const rarity of Object.keys(RARITY_RATES)) {
        const fruitsOfRarity = getFruitsByRarity(rarity);
        if (fruitsOfRarity.length === 0) {
            errors.push(`No fruits found for rarity: ${rarity}`);
        }
    }
    
    // Check for missing required fields
    Object.entries(DEVIL_FRUITS).forEach(([id, fruit]) => {
        if (!fruit.name) errors.push(`Missing name for fruit: ${id}`);
        if (!fruit.type) errors.push(`Missing type for fruit: ${id}`);
        if (!fruit.power) errors.push(`Missing power for fruit: ${id}`);
        if (!fruit.rarity) errors.push(`Missing rarity for fruit: ${id}`);
    });
    
    return {
        isValid: errors.length === 0,
        errors,
        totalFruits: Object.keys(DEVIL_FRUITS).length
    };
}

// Element counters (legacy support)
const ELEMENT_COUNTERS = {
    'Fire': ['Ice', 'Water'],
    'Ice': ['Fire'],
    'Water': ['Fire'],
    'Lightning': ['Water'],
    'Earth': ['Lightning'],
    'Wind': ['Earth'],
    'Light': ['Darkness'],
    'Darkness': ['Light']
};

module.exports = {
    DEVIL_FRUITS,
    RARITY_RATES,
    RARITY_COLORS,
    RARITY_EMOJIS,
    ELEMENT_COUNTERS,
    getRandomFruit,
    getFruitById,
    getFruitsByRarity,
    getAllFruits,
    getRarityColor,
    getRarityEmoji,
    getStats,
    validateFruits
};
