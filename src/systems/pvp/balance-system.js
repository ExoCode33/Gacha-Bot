// src/systems/pvp/balance-system.js - PvP Balance System
const DatabaseManager = require('../../database/manager');

// Import abilities safely
let balancedDevilFruitAbilities = {};
let PvPDamageCalculator = {};

try {
    const abilitiesData = require('../../data/balanced-devil-fruit-abilities');
    balancedDevilFruitAbilities = abilitiesData.balancedDevilFruitAbilities || {};
    PvPDamageCalculator = abilitiesData.PvPDamageCalculator || {};
} catch (error) {
    console.warn('⚠️ Could not load abilities for PvP Balance System');
    balancedDevilFruitAbilities = {};
    PvPDamageCalculator = {
        calculateDamage: (ability, attackerCP, defenderCP, turn) => ({
            damage: ability.damage || 100,
            hit: true,
            effect: ability.effect,
            critical: false
        })
    };
}

const { calculateBaseCPFromLevel } = require('../../data/devil-fruits');

class PvPBalanceSystem {
    constructor() {
        // Balanced level scaling (reduced from 6x to 3x power difference)
        this.balancedLevelScaling = {
            0: 100,   // Base
            5: 120,   // +20%
            10: 140,  // +40%
            15: 160,  // +60%
            20: 180,  // +80%
            25: 200,  // +100%
            30: 220,  // +120%
            35: 240,  // +140%
            40: 260,  // +160%
            45: 280,  // +180%
            50: 300   // +200% (3x total instead of 6x)
        };

        // Balanced rarity scaling (reduced from 12x to 4x power difference)
        this.balancedRarityScaling = {
            common: { min: 1.0, max: 1.2 },      // Base power
            uncommon: { min: 1.2, max: 1.4 },    // +20-40%
            rare: { min: 1.4, max: 1.7 },        // +40-70%
            epic: { min: 1.7, max: 2.1 },        // +70-110%
            legendary: { min: 2.1, max: 2.6 },   // +110-160%
            mythical: { min: 2.6, max: 3.2 },    // +160-220%
            divine: { min: 3.2, max: 4.0 }       // +220-300%
        };

        console.log('⚔️ PvP Balance System initialized');
    }

    // Calculate balanced CP for PvP
    calculateBalancedCP(level, fruits) {
        const balancedBaseCP = this.balancedLevelScaling[level] || 100;
        let totalCP = balancedBaseCP;

        // Group fruits by name for duplicates
        const fruitGroups = {};
        fruits.forEach(fruit => {
            const fruitName = fruit.fruit_name || fruit.name;
            if (!fruitGroups[fruitName]) {
                fruitGroups[fruitName] = {
                    rarity: fruit.fruit_rarity || fruit.rarity,
                    count: 0
                };
            }
            fruitGroups[fruitName].count++;
        });

        // Apply balanced rarity scaling
        Object.values(fruitGroups).forEach(group => {
            const rarityRange = this.balancedRarityScaling[group.rarity];
            if (rarityRange) {
                // Use average of min/max for consistency
                const avgMultiplier = (rarityRange.min + rarityRange.max) / 2;
                const duplicateBonus = 1 + ((group.count - 1) * 0.01); // 1% per duplicate
                const fruitCP = (balancedBaseCP * avgMultiplier) * duplicateBonus;
                totalCP += fruitCP;
            }
        });

        return Math.floor(totalCP);
    }

    // Calculate health from CP for PvP
    calculateHealthFromCP(cp, rarity) {
        const baseHP = 200;
        const cpMultiplier = 1 + (cp / 1000) * 0.2;
        const rarityMultipliers = {
            common: 1.0,
            uncommon: 1.1,
            rare: 1.3,
            epic: 1.6,
            legendary: 2.0,
            mythical: 2.5,
            divine: 3.0
        };
        
        const rarityMultiplier = rarityMultipliers[rarity] || 1.0;
        return Math.floor(baseHP * cpMultiplier * rarityMultiplier);
    }

    // Create PvP fighter object
    async createPvPFighter(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            const fruits = await DatabaseManager.getUserDevilFruits(userId);
            
            if (!user || !fruits || fruits.length < 5) {
                return null;
            }

            // Get strongest fruit for ability
            const strongestFruit = fruits.reduce((max, fruit) => 
                (fruit.base_cp || 100) > ((max?.base_cp || 100)) ? fruit : max, fruits[0]);

            const balancedCP = this.calculateBalancedCP(user.level, fruits);
            const averageRarity = this.getAverageRarity(fruits);
            const health = this.calculateHealthFromCP(balancedCP, averageRarity);

            // Get ability for strongest fruit
            const ability = this.getFruitAbility(strongestFruit.fruit_name);

            return {
                userId: user.user_id,
                username: user.username,
                level: user.level,
                originalCP: user.total_cp,
                balancedCP,
                maxHealth: health,
                hp: health, // Current HP
                fruits: fruits,
                strongestFruit: strongestFruit,
                ability: ability,
                effects: [],
                abilityCooldown: 0
            };

        } catch (error) {
            console.error('Error creating PvP fighter:', error);
            return null;
        }
    }

    // Get fruit ability
    getFruitAbility(fruitName) {
        const ability = balancedDevilFruitAbilities[fruitName];
        
        if (ability) {
            return ability;
        }
        
        // Fallback ability
        return {
            name: 'Devil Fruit Power',
            damage: 100,
            cooldown: 2,
            effect: null,
            description: 'A mysterious devil fruit ability',
            accuracy: 85,
            type: 'unknown'
        };
    }

    // Get average rarity for health calculation
    getAverageRarity(fruits) {
        if (!fruits || fruits.length === 0) return 'common';
        
        const rarityValues = {
            common: 1,
            uncommon: 2,
            rare: 3,
            epic: 4,
            legendary: 5,
            mythical: 6,
            divine: 7
        };
        
        const totalValue = fruits.reduce((sum, fruit) => {
            return sum + (rarityValues[fruit.fruit_rarity] || 1);
        }, 0);
        
        const averageValue = totalValue / fruits.length;
        
        // Convert back to rarity string
        if (averageValue >= 6.5) return 'divine';
        if (averageValue >= 5.5) return 'mythical';
        if (averageValue >= 4.5) return 'legendary';
        if (averageValue >= 3.5) return 'epic';
        if (averageValue >= 2.5) return 'rare';
        if (averageValue >= 1.5) return 'uncommon';
        return 'common';
    }

    // Simulate a fight between two fighters
    async simulateFight(fighter1, fighter2) {
        // Reset health for simulation
        fighter1.hp = fighter1.maxHealth;
        fighter2.hp = fighter2.maxHealth;
        fighter1.effects = [];
        fighter2.effects = [];
        fighter1.abilityCooldown = 0;
        fighter2.abilityCooldown = 0;

        const fightLog = [];
        let turn = 1;

        // Dice roll for first turn
        const firstAttacker = Math.random() < 0.5 ? fighter1 : fighter2;
        const secondAttacker = firstAttacker === fighter1 ? fighter2 : fighter1;

        fightLog.push({
            type: 'start',
            message: `⚔️ ${fighter1.username} vs ${fighter2.username}`,
            turn: 0
        });

        fightLog.push({
            type: 'dice',
            message: `🎲 ${firstAttacker.username} wins the dice roll and goes first!`,
            turn: 0
        });

        // Battle loop (max 10 turns)
        while (turn <= 10 && fighter1.hp > 0 && fighter2.hp > 0) {
            fightLog.push({
                type: 'turn_start',
                message: `🔥 Turn ${turn}`,
                turn
            });

            // First attacker's turn
            if (firstAttacker.hp > 0 && secondAttacker.hp > 0) {
                const result = this.executeAttack(firstAttacker, secondAttacker, turn);
                fightLog.push({
                    type: 'attack',
                    attacker: firstAttacker.username,
                    defender: secondAttacker.username,
                    ability: result.abilityName,
                    damage: result.damage,
                    hit: result.hit,
                    remainingHP: secondAttacker.hp,
                    turn
                });
            }

            // Second attacker's turn (if still alive)
