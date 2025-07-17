// src/data/fruit-cp.js
// CP (Combat Power) calculation functions for Devil Fruits

/**
 * Calculate base CP for a given level
 * @param {number} level - User level (0-50)
 * @returns {number} Base CP value
 */
function calculateBaseCp(level) {
    // Linear scaling from 100 CP at level 0 to 300 CP at level 50
    return 100 + (level * 4);
}

/**
 * Get rarity multiplier for CP calculation
 * @param {string} rarity - Fruit rarity tier
 * @returns {number} Multiplier value
 */
function getRarityMultiplier(rarity) {
    const multipliers = {
        'Common': 1.0,
        'Uncommon': 1.2,
        'Rare': 1.5,
        'Epic': 2.0,
        'Legendary': 2.5,
        'Mythical': 3.0,
        'Omnipotent': 4.0
    };
    return multipliers[rarity] || 1.0;
}

/**
 * Get type multiplier for different fruit categories
 * @param {string} type - Fruit type
 * @returns {number} Type multiplier
 */
function getTypeMultiplier(type) {
    const multipliers = {
        'Paramecia': 1.0,
        'Zoan': 1.1,
        'Logia': 1.3,
        'Ancient Zoan': 1.4,
        'Mythical Zoan': 1.5
    };
    return multipliers[type] || 1.0;
}

/**
 * Calculate total CP for a fruit
 * @param {number} level - User level
 * @param {string} rarity - Fruit rarity
 * @param {string} type - Fruit type
 * @returns {number} Total CP value
 */
function calculateTotalCp(level, rarity, type) {
    const baseCp = calculateBaseCp(level);
    const rarityMultiplier = getRarityMultiplier(rarity);
    const typeMultiplier = getTypeMultiplier(type);
    
    return Math.floor(baseCp * rarityMultiplier * typeMultiplier);
}

/**
 * Calculate hourly berry income based on CP
 * @param {number} cp - Combat Power
 * @returns {number} Berries per hour
 */
function calculateBerryIncome(cp) {
    const baseIncome = 50;
    const cpBonus = Math.floor(cp * 0.1);
    return baseIncome + cpBonus;
}

/**
 * Get user level from Discord roles
 * @param {Object} member - Discord member object
 * @returns {number} User level (0-50)
 */
function getUserLevel(member) {
    if (!member || !member.roles || !member.roles.cache) return 0;
    
    // Check for level roles (assuming format like "Level 1", "Level 25", etc.)
    const levelRoles = member.roles.cache.filter(role => 
        role.name.toLowerCase().startsWith('level ')
    );
    
    if (levelRoles.size === 0) return 0;
    
    // Get the highest level role
    let highestLevel = 0;
    levelRoles.forEach(role => {
        const levelMatch = role.name.match(/level (\d+)/i);
        if (levelMatch) {
            const level = parseInt(levelMatch[1]);
            if (level > highestLevel) {
                highestLevel = level;
            }
        }
    });
    
    return Math.min(highestLevel, 50); // Cap at level 50
}

/**
 * Format CP display with berries income
 * @param {number} cp - Combat Power
 * @returns {string} Formatted CP string
 */
function formatCpDisplay(cp) {
    const berryIncome = calculateBerryIncome(cp);
    return `**${cp} CP** (${berryIncome} berries/hour)`;
}

module.exports = {
    calculateBaseCp,
    getRarityMultiplier,
    getTypeMultiplier,
    calculateTotalCp,
    calculateBerryIncome,
    getUserLevel,
    formatCpDisplay
};
