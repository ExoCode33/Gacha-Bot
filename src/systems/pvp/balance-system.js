// src/systems/pvp/balance-system.js - PvP Balance System
const DatabaseManager = require('../../database/manager');

// Import abilities safely
let balancedDevilFruitAbilities = {};
let PvPDamageCalculator = {};

try {
    const abilitiesData = require('../../data/devil-fruits.json');
    balancedDevilFruitAbilities = abilitiesData.balancedAbilities || {};
    console.log('✅ Devil fruit abilities loaded for PvP balance');
} catch (error) {
    console.log('⚠️ Devil fruit abilities not found, using defaults');
    balancedDevilFruitAbilities = getDefaultAbilities();
}

try {
    PvPDamageCalculator = require('./pvp-helpers/damage-calculator');
    console.log('✅ PvP Damage Calculator loaded');
} catch (error) {
    console.log('⚠️ PvP Damage Calculator not found, using defaults');
    PvPDamageCalculator = getDefaultDamageCalculator();
}

class PvPBalanceSystem {
    constructor() {
        this.balanceConfig = {
            // Base stats scaling
            healthMultiplier: 1.2,
            attackMultiplier: 1.0,
            defenseMultiplier: 1.1,
            speedMultiplier: 0.9,
            
            // Level scaling
            maxLevelDifference: 10,
            levelScalingFactor: 0.05,
            
            // Devil Fruit balancing
            devilFruitPowerCap: 150,
            rarityMultipliers: {
                'Common': 0.8,
                'Uncommon': 1.0,
                'Rare': 1.2,
                'Epic': 1.4,
                'Legendary': 1.6,
                'Mythical': 1.8
            },
            
            // Turn-based combat settings
            turnTimeLimit: 30000, // 30 seconds per turn
            maxTurns: 20,
            
            // Reward scaling
            winRewardBase: 100,
            lossRewardBase: 25,
            streakBonusMultiplier: 0.1
        };
    }

    /**
     * Get balanced player stats for PvP
     */
    async getBalancedPlayerStats(userId) {
        try {
            const userData = await DatabaseManager.getUser(userId);
            if (!userData) {
                throw new Error('User data not found');
            }

            const baseStats = {
                health: userData.health || 100,
                attack: userData.attack || 20,
                defense: userData.defense || 15,
                speed: userData.speed || 10,
                level: userData.level || 1
            };

            // Apply balance multipliers
            const balancedStats = {
                health: Math.floor(baseStats.health * this.balanceConfig.healthMultiplier),
                attack: Math.floor(baseStats.attack * this.balanceConfig.attackMultiplier),
                defense: Math.floor(baseStats.defense * this.balanceConfig.defenseMultiplier),
                speed: Math.floor(baseStats.speed * this.balanceConfig.speedMultiplier),
                level: baseStats.level
            };

            // Add devil fruit bonuses if available
            if (userData.devil_fruit) {
                const fruitBonus = this.getDevilFruitBonus(userData.devil_fruit);
                balancedStats.attack += fruitBonus.attack;
                balancedStats.defense += fruitBonus.defense;
                balancedStats.health += fruitBonus.health;
                balancedStats.special = fruitBonus.special;
            }

            // Ensure minimum values
            balancedStats.health = Math.max(balancedStats.health, 50);
            balancedStats.attack = Math.max(balancedStats.attack, 10);
            balancedStats.defense = Math.max(balancedStats.defense, 5);
            balancedStats.speed = Math.max(balancedStats.speed, 5);

            return {
                ...balancedStats,
                maxHealth: balancedStats.health,
                userId: userId,
                username: userData.username || 'Unknown',
                devilFruit: userData.devil_fruit || null
            };
        } catch (error) {
            console.error('Error getting balanced player stats:', error);
            // Return default stats if error occurs
            return {
                health: 100,
                maxHealth: 100,
                attack: 20,
                defense: 15,
                speed: 10,
                level: 1,
                userId: userId,
                username: 'Unknown',
                devilFruit: null
            };
        }
    }

    /**
     * Calculate level-based stat adjustments
     */
    calculateLevelBalance(player1Level, player2Level) {
        const levelDiff = Math.abs(player1Level - player2Level);
        
        if (levelDiff <= this.balanceConfig.maxLevelDifference) {
            return { player1Modifier: 1.0, player2Modifier: 1.0 };
        }

        const adjustment = Math.min(levelDiff * this.balanceConfig.levelScalingFactor, 0.3);
        
        if (player1Level > player2Level) {
            return {
                player1Modifier: 1.0 - adjustment,
                player2Modifier: 1.0 + adjustment
            };
        } else {
            return {
                player1Modifier: 1.0 + adjustment,
                player2Modifier: 1.0 - adjustment
            };
        }
    }

    /**
     * Get devil fruit bonuses for PvP
     */
    getDevilFruitBonus(devilFruitName) {
        const defaultBonus = { attack: 0, defense: 0, health: 0, special: null };
        
        if (!devilFruitName || !balancedDevilFruitAbilities[devilFruitName]) {
            return defaultBonus;
        }

        const fruit = balancedDevilFruitAbilities[devilFruitName];
        const rarityMultiplier = this.balanceConfig.rarityMultipliers[fruit.rarity] || 1.0;

        return {
            attack: Math.floor((fruit.attackBonus || 0) * rarityMultiplier),
            defense: Math.floor((fruit.defenseBonus || 0) * rarityMultiplier),
            health: Math.floor((fruit.healthBonus || 0) * rarityMultiplier),
            special: fruit.specialAbility || null
        };
    }

    /**
     * Calculate damage with balance considerations
     */
    calculateBalancedDamage(attacker, defender, attackType = 'normal') {
        try {
            // Use PvP damage calculator if available
            if (PvPDamageCalculator && PvPDamageCalculator.calculateDamage) {
                return PvPDamageCalculator.calculateDamage(attacker, defender, attackType);
            }
            
            // Fallback damage calculation
            return this.defaultDamageCalculation(attacker, defender, attackType);
        } catch (error) {
            console.error('Error calculating balanced damage:', error);
            return this.defaultDamageCalculation(attacker, defender, attackType);
        }
    }

    /**
     * Default damage calculation
     */
    defaultDamageCalculation(attacker, defender, attackType) {
        let baseDamage = attacker.attack;
        
        // Apply attack type multipliers
        switch (attackType) {
            case 'heavy':
                baseDamage *= 1.5;
                break;
            case 'special':
                baseDamage *= 2.0;
                break;
            case 'critical':
                baseDamage *= 1.8;
                break;
            default: // normal
                baseDamage *= 1.0;
        }
        
        // Apply defense
        const defense = defender.defense || 0;
        const damage = Math.max(1, Math.floor(baseDamage - (defense * 0.5)));
        
        // Add some randomness (±10%)
        const randomFactor = 0.9 + (Math.random() * 0.2);
        
        return Math.floor(damage * randomFactor);
    }

    /**
     * Calculate PvP rewards
     */
    calculatePvPRewards(winner, loser, winnerStreak = 0) {
        const baseWinReward = this.balanceConfig.winRewardBase;
        const baseLossReward = this.balanceConfig.lossRewardBase;
        
        // Streak bonus for winner
        const streakBonus = Math.floor(baseWinReward * winnerStreak * this.balanceConfig.streakBonusMultiplier);
        const winnerReward = baseWinReward + streakBonus;
        
        // Level difference bonus
        const levelDiff = Math.abs(winner.level - loser.level);
        const levelBonus = levelDiff > 5 ? Math.floor(baseWinReward * 0.2) : 0;
        
        return {
            winnerReward: winnerReward + levelBonus,
            loserReward: baseLossReward,
            streakBonus: streakBonus,
            levelBonus: levelBonus
        };
    }

    /**
     * Check if players are balanced for matchmaking
     */
    isBalancedMatch(player1, player2) {
        const levelDiff = Math.abs(player1.level - player2.level);
        const powerDiff = Math.abs(
            (player1.attack + player1.defense + player1.health) - 
            (player2.attack + player2.defense + player2.health)
        );
        
        return {
            balanced: levelDiff <= this.balanceConfig.maxLevelDifference && powerDiff <= 100,
            levelDifference: levelDiff,
            powerDifference: powerDiff,
            recommendation: this.getMatchRecommendation(levelDiff, powerDiff)
        };
    }

    /**
     * Get match recommendation
     */
    getMatchRecommendation(levelDiff, powerDiff) {
        if (levelDiff <= 3 && powerDiff <= 30) {
            return 'Perfect match!';
        } else if (levelDiff <= 7 && powerDiff <= 60) {
            return 'Good match';
        } else if (levelDiff <= 10 && powerDiff <= 100) {
            return 'Fair match';
        } else {
            return 'Unbalanced match';
        }
    }
}

/**
 * Default abilities if devil fruits data is not available
 */
function getDefaultAbilities() {
    return {
        'Gomu Gomu no Mi': {
            rarity: 'Legendary',
            attackBonus: 15,
            defenseBonus: 10,
            healthBonus: 20,
            specialAbility: 'Rubber immunity to blunt attacks'
        },
        'Mera Mera no Mi': {
            rarity: 'Legendary',
            attackBonus: 25,
            defenseBonus: 5,
            healthBonus: 10,
            specialAbility: 'Fire damage over time'
        },
        'Hie Hie no Mi': {
            rarity: 'Legendary',
            attackBonus: 20,
            defenseBonus: 15,
            healthBonus: 5,
            specialAbility: 'Freeze chance on attacks'
        }
    };
}

/**
 * Default damage calculator if not available
 */
function getDefaultDamageCalculator() {
    return {
        calculateDamage: (attacker, defender, attackType) => {
            let damage = attacker.attack;
            
            switch (attackType) {
                case 'heavy': damage *= 1.5; break;
                case 'special': damage *= 2.0; break;
                case 'critical': damage *= 1.8; break;
            }
            
            damage = Math.max(1, damage - (defender.defense * 0.5));
            return Math.floor(damage * (0.9 + Math.random() * 0.2));
        }
    };
}

module.exports = new PvPBalanceSystem();
