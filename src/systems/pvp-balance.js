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
            // Use basic attack if ability on cooldown
            const basicDamage = this.calculateBasicAttack(attacker.balancedCP, defender.balancedCP, turn, defender.effects);
            defender.currentHealth = Math.max(0, defender.currentHealth - basicDamage);
            return basicDamage;
        }

        // Use devil fruit ability
        const damage = calculatePvPDamage(attacker.ability, attacker.balancedCP, defender.balancedCP, turn, defender.effects);
        
        // Apply damage
        defender.currentHealth = Math.max(0, defender.currentHealth - damage);
        
        // Apply ability effects
        this.applyAbilityEffect(attacker, defender);
        
        // Set cooldown
        attacker.abilityCooldown = attacker.ability.cooldown;
        
        return damage;
    }

    // Calculate basic attack damage when ability is on cooldown
    calculateBasicAttack(attackerCP, defenderCP, turn, defenderEffects) {
        const baseDamage = 60; // Basic punch damage
        const cpRatio = Math.min(attackerCP / defenderCP, 2.0);
        const balancedRatio = 1 + ((cpRatio - 1) * 0.3);
        const turnMultiplier = turn === 1 ? 0.2 : 1.0;
        
        let effectMultiplier = 1.0;
        defenderEffects.forEach(effect => {
            switch(effect) {
                case 'shield_small': effectMultiplier *= 0.7; break;
                case 'shield_medium': effectMultiplier *= 0.5; break;
                case 'shield_large': effectMultiplier *= 0.3; break;
            }
        });
        
        return Math.floor(baseDamage * balancedRatio * turnMultiplier * effectMultiplier);
    }

    // Apply ability effects
    applyAbilityEffect(attacker, defender) {
        const effect = attacker.ability.effect;
        if (!effect) return;

        switch(effect) {
            case 'dodge_next':
                attacker.effects.push({ type: 'dodge_next', duration: 1 });
                break;
            case 'shield_small':
                attacker.effects.push({ type: 'shield_small', duration: 1 });
                break;
            case 'shield_medium':
                attacker.effects.push({ type: 'shield_medium', duration: 1 });
                break;
            case 'shield_large':
                attacker.effects.push({ type: 'shield_large', duration: 1 });
                break;
            case 'burn_damage':
                defender.effects.push({ type: 'burn_damage', duration: 2, damage: 20 });
                break;
            case 'poison_severe':
                defender.effects.push({ type: 'poison_severe', duration: 3, damage: 30 });
                break;
            case 'freeze':
                defender.effects.push({ type: 'freeze', duration: 1 });
                break;
            case 'bind_one_turn':
                defender.effects.push({ type: 'bind_one_turn', duration: 1 });
                break;
            case 'slow_next':
                defender.effects.push({ type: 'slow_next', duration: 1 });
                break;
            case 'slow_two_turns':
                defender.effects.push({ type: 'slow_two_turns', duration: 2 });
                break;
            case 'life_drain':
                const healAmount = Math.floor(attacker.ability.damage * 0.5);
                attacker.currentHealth = Math.min(attacker.maxHealth, attacker.currentHealth + healAmount);
                break;
            case 'full_heal':
                attacker.currentHealth = attacker.maxHealth;
                break;
            case 'execute_condition':
                // Double damage if enemy below 30% HP
                if (defender.currentHealth < defender.maxHealth * 0.3) {
                    const extraDamage = attacker.ability.damage;
                    defender.currentHealth = Math.max(0, defender.currentHealth - extraDamage);
                }
                break;
        }
    }

    // Process ongoing effects
    processEffects(fighter) {
        fighter.effects = fighter.effects.filter(effect => {
            // Apply damage effects
            if (effect.type === 'burn_damage' || effect.type === 'poison_severe') {
                fighter.currentHealth = Math.max(0, fighter.currentHealth - effect.damage);
            }
            
            // Reduce duration
            effect.duration--;
            return effect.duration > 0;
        });
    }

    // Create fight embed for Discord
    createFightEmbed(fightResult) {
        const { winner, loser, fightLog } = fightResult;
        
        let description = '';
        fightLog.forEach(log => {
            switch(log.type) {
                case 'start':
                    description += `${log.message}\n\n`;
                    break;
                case 'dice':
                    description += `${log.message}\n\n`;
                    break;
                case 'turn_start':
                    description += `**${log.message}**\n`;
                    break;
                case 'attack':
                    description += `⚡ ${log.attacker} uses **${log.ability}**!\n`;
                    description += `💥 Deals ${log.damage} damage to ${log.defender}!\n`;
                    description += `❤️ ${log.defender}: ${log.remainingHP} HP remaining\n\n`;
                    break;
                case 'result':
                    description += `🏆 **${log.winner} wins!**\n`;
                    description += `Final HP: ${log.fighter1HP} vs ${log.fighter2HP}`;
                    break;
            }
        });

        return {
            color: winner ? 0x00FF00 : 0xFF0000,
            title: '⚔️ Devil Fruit PvP Battle',
            description,
            footer: { text: '3-turn fight with Turn 1 damage reduction' },
            timestamp: new Date()
        };
    }

    // Get PvP stats comparison
    async getPvPComparison(userId1, userId2) {
        try {
            const fighter1 = await this.createPvPFighter(userId1);
            const fighter2 = await this.createPvPFighter(userId2);
            
            if (!fighter1 || !fighter2) {
                return null;
            }

            return {
                fighter1: {
                    username: fighter1.username,
                    level: fighter1.level,
                    balancedCP: fighter1.balancedCP,
                    health: fighter1.maxHealth,
                    ability: fighter1.ability.name,
                    fruit: fighter1.strongestFruit
                },
                fighter2: {
                    username: fighter2.username,
                    level: fighter2.level,
                    balancedCP: fighter2.balancedCP,
                    health: fighter2.maxHealth,
                    ability: fighter2.ability.name,
                    fruit: fighter2.strongestFruit
                },
                balanceRatio: Math.min(fighter1.balancedCP / fighter2.balancedCP, fighter2.balancedCP / fighter1.balancedCP)
            };

        } catch (error) {
            console.error('Error getting PvP comparison:', error);
            return null;
        }
    }

    // Calculate win probability
    calculateWinProbability(fighter1CP, fighter2CP) {
        const ratio = fighter1CP / fighter2CP;
        const baseProb = 0.5;
        
        // Sigmoid function for win probability (caps at 80% advantage)
        const advantage = (ratio - 1) * 0.3;
        const probability = baseProb + advantage;
        
        return Math.max(0.2, Math.min(0.8, probability));
    }

    // Get balance report
    getBalanceReport() {
        const levelDiff = this.balancedLevelScaling[50] / this.balancedLevelScaling[0];
        const rarityDiff = this.balancedRarityScaling.omnipotent.max / this.balancedRarityScaling.common.min;
        
        return {
            maxLevelAdvantage: `${levelDiff}x (reduced from 6x)`,
            maxRarityAdvantage: `${rarityDiff}x (reduced from 12x)`,
            turn1DamageReduction: '80%',
            maxFightDuration: '3 turns',
            cpImpactReduction: '70% (only 30% of CP difference applies)',
            recommendedBalance: levelDiff * rarityDiff < 15 ? 'Good' : 'Needs adjustment'
        };
    }

    // Validate fight balance
    validateFightBalance(fighter1, fighter2) {
        const cpRatio = Math.max(fighter1.balancedCP / fighter2.balancedCP, fighter2.balancedCP / fighter1.balancedCP);
        const healthRatio = Math.max(fighter1.maxHealth / fighter2.maxHealth, fighter2.maxHealth / fighter1.maxHealth);
        const levelDiff = Math.abs(fighter1.level - fighter2.level);
        
        const issues = [];
        
        if (cpRatio > 3.0) {
            issues.push(`CP difference too high: ${cpRatio.toFixed(1)}x`);
        }
        
        if (healthRatio > 2.0) {
            issues.push(`Health difference too high: ${healthRatio.toFixed(1)}x`);
        }
        
        if (levelDiff > 25) {
            issues.push(`Level difference too high: ${levelDiff} levels`);
        }
        
        // Check for one-shot potential (even with 80% DR)
        const maxTurn1Damage = Math.max(
            fighter1.ability.damage * 0.2 * (cpRatio > 1 ? cpRatio * 0.3 + 0.7 : 1),
            fighter2.ability.damage * 0.2 * (cpRatio < 1 ? (1/cpRatio) * 0.3 + 0.7 : 1)
        );
        
        const minHealth = Math.min(fighter1.maxHealth, fighter2.maxHealth);
        
        if (maxTurn1Damage > minHealth * 0.6) {
            issues.push(`Potential turn 1 one-shot: ${maxTurn1Damage} vs ${minHealth} HP`);
        }
        
        return {
            isBalanced: issues.length === 0,
            issues,
            cpRatio,
            healthRatio,
            levelDiff,
            maxTurn1Damage,
            recommendation: issues.length === 0 ? 'Fight is balanced' : 'Consider adjusting matchmaking'
        };
    }
}

module.exports = new PvPBalanceSystem();
