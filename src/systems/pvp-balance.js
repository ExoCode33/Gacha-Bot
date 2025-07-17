// src/systems/pvp-balance.js - Balanced PvP System
const DatabaseManager = require('../database/manager');
const { getAbilityByFruitId, calculatePvPDamage, calculatePvPHealth } = require('../data/devil-fruit-abilities');

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
            omnipotent: { min: 3.2, max: 4.0 }   // +220-300%
        };

        console.log('⚔️ PvP Balance System initialized');
    }

    // Calculate balanced CP for PvP
    calculateBalancedCP(level, fruits) {
        const balancedBaseCP = this.balancedLevelScaling[level] || 100;
        let totalCP = balancedBaseCP;

        // Group fruits by ID for duplicates
        const fruitGroups = {};
        fruits.forEach(fruit => {
            if (!fruitGroups[fruit.fruit_id]) {
                fruitGroups[fruit.fruit_id] = {
                    rarity: fruit.fruit_rarity,
                    count: 0
                };
            }
            fruitGroups[fruit.fruit_id].count++;
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

    // Create PvP fighter object
    async createPvPFighter(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            const fruits = await DatabaseManager.getUserDevilFruits(userId);
            
            if (!user || fruits.length === 0) {
                return null;
            }

            // Get strongest fruit for ability
            const strongestFruit = fruits.reduce((max, fruit) => 
                fruit.base_cp > (max?.base_cp || 0) ? fruit : max, null);

            const ability = getAbilityByFruitId(strongestFruit.fruit_id);
            const balancedCP = this.calculateBalancedCP(user.level, fruits);
            const health = calculatePvPHealth(user.level, this.getAverageRarityMultiplier(fruits));

            return {
                userId: user.user_id,
                username: user.username,
                level: user.level,
                balancedCP,
                maxHealth: health,
                currentHealth: health,
                ability,
                strongestFruit: strongestFruit.fruit_name,
                effects: [],
                abilityCooldown: 0
            };

        } catch (error) {
            console.error('Error creating PvP fighter:', error);
            return null;
        }
    }

    // Get average rarity multiplier for health calculation
    getAverageRarityMultiplier(fruits) {
        if (fruits.length === 0) return 1.0;

        let totalMultiplier = 0;
        fruits.forEach(fruit => {
            const rarityRange = this.balancedRarityScaling[fruit.fruit_rarity];
            if (rarityRange) {
                totalMultiplier += (rarityRange.min + rarityRange.max) / 2;
            } else {
                totalMultiplier += 1.0;
            }
        });

        return totalMultiplier / fruits.length;
    }

    // Simulate a 3-turn PvP fight
    async simulateFight(fighter1, fighter2) {
        const fightLog = [];
        let turn = 1;

        // Dice roll for first turn
        const firstAttacker = Math.random() < 0.5 ? fighter1 : fighter2;
        const secondAttacker = firstAttacker === fighter1 ? fighter2 : fighter1;

        fightLog.push({
            type: 'start',
            message: `⚔️ ${fighter1.username} (${fighter1.strongestFruit}) vs ${fighter2.username} (${fighter2.strongestFruit})`,
            turn: 0
        });

        fightLog.push({
            type: 'dice',
            message: `🎲 ${firstAttacker.username} wins the dice roll and goes first!`,
            turn: 0
        });

        // 3-turn fight
        for (turn = 1; turn <= 3; turn++) {
            if (fighter1.currentHealth <= 0 || fighter2.currentHealth <= 0) break;

            fightLog.push({
                type: 'turn_start',
                message: `🔥 Turn ${turn} ${turn === 1 ? '(80% Damage Reduction)' : ''}`,
                turn
            });

            // First attacker's turn
            if (firstAttacker.currentHealth > 0 && secondAttacker.currentHealth > 0) {
                const damage = this.executeAttack(firstAttacker, secondAttacker, turn);
                fightLog.push({
                    type: 'attack',
                    attacker: firstAttacker.username,
                    defender: secondAttacker.username,
                    ability: firstAttacker.ability.name,
                    damage,
                    remainingHP: secondAttacker.currentHealth,
                    turn
                });
            }

            // Second attacker's turn (if still alive)
            if (secondAttacker.currentHealth > 0 && firstAttacker.currentHealth > 0) {
                const damage = this.executeAttack(secondAttacker, firstAttacker, turn);
                fightLog.push({
                    type: 'attack',
                    attacker: secondAttacker.username,
                    defender: firstAttacker.username,
                    ability: secondAttacker.ability.name,
                    damage,
                    remainingHP: firstAttacker.currentHealth,
                    turn
                });
            }

            // Process effects and cooldowns
            this.processEffects(fighter1);
            this.processEffects(fighter2);
        }

        // Determine winner
        let winner = null;
        if (fighter1.currentHealth <= 0) winner = fighter2;
        else if (fighter2.currentHealth <= 0) winner = fighter1;
        else winner = fighter1.currentHealth > fighter2.currentHealth ? fighter1 : fighter2;

        fightLog.push({
            type: 'result',
            winner: winner.username,
            fighter1HP: fighter1.currentHealth,
            fighter2HP: fighter2.currentHealth,
            turn
        });

        return {
            winner,
            loser: winner === fighter1 ? fighter2 : fighter1,
            fightLog,
            totalTurns: turn
        };
    }

    // Execute an attack
    executeAttack(attacker, defender, turn) {
        // Check if ability is on cooldown
        if (attacker.abilityCooldown > 0) {
            attacker.abilityCooldown--;
