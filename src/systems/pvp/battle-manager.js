// src/systems/pvp/battle-manager.js - Battle State Management
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../../database/manager');
const { getRarityEmoji, getRarityColor } = require('../../data/devil-fruits');

// Import abilities safely
let balancedDevilFruitAbilities = {};
let statusEffects = {};

try {
    const abilitiesData = require('../../data/balanced-devil-fruit-abilities');
    balancedDevilFruitAbilities = abilitiesData.balancedDevilFruitAbilities || {};
    statusEffects = abilitiesData.statusEffects || {};
} catch (error) {
    console.warn('⚠️ Could not load abilities for battle manager');
    balancedDevilFruitAbilities = {};
    statusEffects = {};
}

class BattleManager {
    constructor() {
        this.activeBattles = new Map(); // battleId -> battleData
        this.battleTimeouts = new Map(); // battleId -> timeoutId
        this.maxBattleDuration = 30 * 60 * 1000; // 30 minutes
        
        console.log('⚔️ Battle Manager initialized');
    }

    // Create a new battle
    createBattle(player1, player2, isVsNPC = false, npcBoss = null) {
        const battleId = this.generateBattleId();
        
        const battleData = {
            id: battleId,
            player1,
            player2,
            isVsNPC,
            npcBoss,
            status: 'created', // created -> fruit_selection -> battle -> ended
            currentTurn: 1,
            currentPlayer: Math.random() < 0.5 ? 'player1' : 'player2',
            battleLog: [],
            created: Date.now(),
            lastActivity: Date.now(),
            maxTurns: 15,
            selectionPhase: {
                player1Complete: false,
                player2Complete: isVsNPC, // NPC auto-completes
                player1Fruits: [],
                player2Fruits: isVsNPC ? npcBoss?.selectedFruits || [] : []
            },
            battleStats: {
                totalDamageDealt: { player1: 0, player2: 0 },
                abilitiesUsed: { player1: 0, player2: 0 },
                effectsApplied: { player1: 0, player2: 0 },
                turnsSurvived: { player1: 0, player2: 0 }
            }
        };

        // Initialize player health and effects
        player1.hp = player1.maxHealth;
        player1.effects = [];
        player2.hp = player2.maxHealth;
        player2.effects = [];

        this.activeBattles.set(battleId, battleData);
        this.setBattleTimeout(battleId);
        
        console.log(`⚔️ Battle created: ${battleId} (${player1.username} vs ${player2.username})`);
        return battleData;
    }

    // Generate unique battle ID
    generateBattleId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5);
        return `battle_${timestamp}_${random}`;
    }

    // Get battle by ID
    getBattle(battleId) {
        return this.activeBattles.get(battleId);
    }

    // Update battle data
    updateBattle(battleId, updates) {
        const battle = this.activeBattles.get(battleId);
        if (battle) {
            Object.assign(battle, updates);
            battle.lastActivity = Date.now();
            this.activeBattles.set(battleId, battle);
        }
        return battle;
    }

    // Add to battle log
    addToBattleLog(battleId, logEntry) {
        const battle = this.activeBattles.get(battleId);
        if (battle) {
            logEntry.timestamp = Date.now();
            logEntry.turn = battle.currentTurn;
            battle.battleLog.push(logEntry);
            battle.lastActivity = Date.now();
            
            // Keep log size manageable
            if (battle.battleLog.length > 50) {
                battle.battleLog = battle.battleLog.slice(-30);
            }
            
            this.activeBattles.set(battleId, battle);
        }
    }

    // Process attack
    async processAttack(battleId, attackerId, targetId, ability, fruitData) {
        const battle = this.activeBattles.get(battleId);
        if (!battle || battle.status !== 'battle') {
            throw new Error('Battle not found or not in battle phase');
        }

        const attacker = battle.player1.userId === attackerId ? battle.player1 : battle.player2;
        const defender = battle.player1.userId === targetId ? battle.player1 : battle.player2;
        const attackerKey = battle.player1.userId === attackerId ? 'player1' : 'player2';

        if (!attacker || !defender) {
            throw new Error('Invalid attacker or defender');
        }

        // Calculate damage
        const damage = this.calculateDamage(ability, attacker, defender, battle.currentTurn);
        const accuracy = ability.accuracy || 85;
        const hit = Math.random() * 100 <= accuracy;

        let attackResult = {
            hit,
            damage: hit ? damage : 0,
            critical: hit && Math.random() * 100 <= 10,
            ability: ability.name,
            attacker: attacker.username,
            defender: defender.username,
            remainingHP: defender.hp
        };

        if (hit) {
            // Apply damage
            defender.hp = Math.max(0, defender.hp - damage);
            attackResult.remainingHP = defender.hp;
            
            // Update battle stats
            battle.battleStats.totalDamageDealt[attackerKey] += damage;
            battle.battleStats.abilitiesUsed[attackerKey]++;

            // Apply status effects
            if (ability.effect) {
                this.applyStatusEffect(defender, ability.effect);
                battle.battleStats.effectsApplied[attackerKey]++;
                attackResult.effectApplied = ability.effect;
            }

            // Create attack log entry
            let logMessage = `⚡ **${attacker.username}** uses **${ability.name}**!\n`;
            logMessage += `💥 Deals **${damage}** damage to **${defender.username}**!`;
            
            if (attackResult.critical) {
                logMessage += ` 🎯 **CRITICAL HIT!**`;
            }
            
            if (ability.effect) {
                logMessage += ` ✨ **${ability.effect} applied!**`;
            }

            this.addToBattleLog(battleId, {
                type: 'attack',
                message: logMessage,
                data: attackResult
            });
        } else {
            // Miss
            this.addToBattleLog(battleId, {
                type: 'miss',
                message: `⚡ **${attacker.username}** uses **${ability.name}** but misses!`,
                data: attackResult
            });
        }

        // Check for battle end
        if (defender.hp <= 0) {
            await this.endBattle(battleId, attacker, defender, 'knockout');
            return { ...attackResult, battleEnded: true, winner: attacker };
        }

        // Switch turns
        battle.currentPlayer = battle.currentPlayer === 'player1' ? 'player2' : 'player1';
        battle.currentTurn++;

        // Check max turns
        if (battle.currentTurn > battle.maxTurns) {
            const winner = battle.player1.hp > battle.player2.hp ? battle.player1 : battle.player2;
            const loser = winner === battle.player1 ? battle.player2 : battle.player1;
            await this.endBattle(battleId, winner, loser, 'timeout');
            return { ...attackResult, battleEnded: true, winner };
        }

        // Process ongoing effects
        this.processOngoingEffects(battleId);
        
        this.updateBattle(battleId, battle);
        return { ...attackResult, battleEnded: false };
    }

    // Calculate damage for an attack
    calculateDamage(ability, attacker, defender, turn) {
        const baseDamage = ability.damage || 100;
        
        // CP scaling (limited for balance)
        const cpRatio = Math.min(attacker.balancedCP / defender.balancedCP, 1.5);
        
        // Turn-based damage reduction (prevents early KOs)
        let turnMultiplier = 1.0;
        if (turn === 1) turnMultiplier = 0.5;
        else if (turn === 2) turnMultiplier = 0.7;
        else if (turn === 3) turnMultiplier = 0.85;
        
        // Apply defender damage reduction from effects
        let damageReduction = 1.0;
        defender.effects.forEach(effect => {
            if (statusEffects[effect.type]?.damageReduction) {
                damageReduction *= (100 - statusEffects[effect.type].damageReduction) / 100;
            }
        });
        
        let finalDamage = Math.floor(baseDamage * cpRatio * turnMultiplier * damageReduction);
        
        // Minimum damage
        finalDamage = Math.max(5, finalDamage);
        
        return finalDamage;
    }

    // Apply status effect
    applyStatusEffect(target, effectName) {
        const effect = statusEffects[effectName];
        if (!effect) return;

        // Don't stack the same effect
        const existingEffect = target.effects.find(e => e.type === effectName);
        if (existingEffect) {
            existingEffect.duration = Math.max(existingEffect.duration, effect.duration || 2);
        } else {
            target.effects.push({
                type: effectName,
                name: effectName,
                duration: effect.duration || 2,
                damage: effect.damage || 0,
                description: effect.description || 'Unknown effect'
            });
        }
    }

    // Process ongoing effects (DoT, debuffs, etc.)
    processOngoingEffects(battleId) {
        const battle = this.activeBattles.get(battleId);
        if (!battle) return;

        [battle.player1, battle.player2].forEach(player => {
            player.effects = player.effects.filter(effect => {
                // Apply damage over time effects
                if (effect.damage && effect.damage > 0) {
                    player.hp = Math.max(0, player.hp - effect.damage);
                    
                    this.addToBattleLog(battleId, {
                        type: 'effect_damage',
                        message: `🔥 ${player.username} takes ${effect.damage} ${effect.name} damage!`,
                        data: { player: player.username, effect: effect.name, damage: effect.damage }
                    });
                }
                
                // Reduce duration
                effect.duration--;
                return effect.duration > 0;
            });
        });

        this.updateBattle(battleId, battle);
    }

    // End battle
    async endBattle(battleId, winner, loser, reason = 'unknown') {
        const battle = this.activeBattles.get(battleId);
        if (!battle) return;

        battle.status = 'ended';
        battle.endTime = Date.now();
        battle.duration = battle.endTime - battle.created;
        battle.winner = winner;
        battle.loser = loser;
        battle.endReason = reason;

        // Calculate final stats
        const winnerKey = battle.player1.userId === winner.userId ? 'player1' : 'player2';
        const loserKey = winnerKey === 'player1' ? 'player2' : 'player1';
        
        battle.battleStats.turnsSurvived[winnerKey] = battle.currentTurn;
        battle.battleStats.turnsSurvived[loserKey] = battle.currentTurn - 1;

        // Award rewards for PvE victories
        if (battle.isVsNPC && winner.userId === battle.player1.userId) {
            const berryReward = this.calculateBerryReward(battle.npcBoss?.difficulty || 'Easy');
            try {
                await DatabaseManager.updateUserBerries(winner.userId, berryReward, 'PvE Victory');
                battle.berryReward = berryReward;
            } catch (error) {
                console.error('Error awarding berries:', error);
            }
        }

        this.addToBattleLog(battleId, {
            type: 'battle_end',
            message: `🏆 **${winner.username}** emerges victorious! (${reason})`,
            data: { winner: winner.username, loser: loser.username, reason, duration: battle.duration }
        });

        // Clear timeout
        this.clearBattleTimeout(battleId);
        
        // Keep battle data for a short while for final display, then cleanup
        setTimeout(() => {
            this.activeBattles.delete(battleId);
            console.log(`🧹 Battle ${battleId} cleaned up`);
        }, 5 * 60 * 1000); // 5 minutes

        console.log(`🏆 Battle ${battleId} ended: ${winner.username} defeats ${loser.username} (${reason})`);
        
        return battle;
    }

    // Calculate berry reward
    calculateBerryReward(difficulty) {
        const rewards = {
            'Easy': 500,
            'Medium': 1000,
            'Hard': 2000,
            'Very Hard': 4000,
            'Legendary': 7000,
            'Mythical': 10000,
            'Divine': 15000
        };
        
        return rewards[difficulty] || 500;
    }

    // Set battle timeout
    setBattleTimeout(battleId) {
        const timeoutId = setTimeout(() => {
            this.handleBattleTimeout(battleId);
        }, this.maxBattleDuration);
        
        this.battleTimeouts.set(battleId, timeoutId);
    }

    // Clear battle timeout
    clearBattleTimeout(battleId) {
        const timeoutId = this.battleTimeouts.get(battleId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.battleTimeouts.delete(battleId);
        }
    }

    // Handle battle timeout
    async handleBattleTimeout(battleId) {
        const battle = this.activeBattles.get(battleId);
        if (battle && battle.status === 'battle') {
            console.log(`⏰ Battle ${battleId} timed out`);
            
            const winner = battle.player1.hp > battle.player2.hp ? battle.player1 : battle.player2;
            const loser = winner === battle.player1 ? battle.player2 : battle.player1;
            
            await this.endBattle(battleId, winner, loser, 'timeout');
        }
    }

    // Get user's active battle
    getUserActiveBattle(userId) {
        for (const [battleId, battle] of this.activeBattles) {
            if ((battle.player1.userId === userId || battle.player2.userId === userId) && 
                battle.status !== 'ended') {
                return { battleId, battle };
            }
        }
        return null;
    }

    // Create battle summary embed
    createBattleSummaryEmbed(battle) {
        const { winner, loser, battleStats, duration, endReason } = battle;
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🏆 Battle Complete!')
            .setDescription(`**${winner.username}** defeats **${loser.username}**!`)
            .addFields([
                {
                    name: '📊 Battle Statistics',
                    value: [
                        `**Duration**: ${Math.floor(duration / 1000)}s`,
                        `**Turns**: ${battle.currentTurn}`,
                        `**End Reason**: ${endReason}`,
                        `**Battle Type**: ${battle.isVsNPC ? 'PvE' : 'PvP'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚔️ Combat Stats',
                    value: [
                        `**${winner.username}**: ${battleStats.totalDamageDealt.player1} dmg`,
                        `**${loser.username}**: ${battleStats.totalDamageDealt.player2} dmg`,
                        `**Abilities Used**: ${battleStats.abilitiesUsed.player1 + battleStats.abilitiesUsed.player2}`,
                        `**Effects Applied**: ${battleStats.effectsApplied.player1 + battleStats.effectsApplied.player2}`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: `Battle ID: ${battle.id}` })
            .setTimestamp();

        if (battle.berryReward) {
            embed.addFields([{
                name: '💰 Rewards',
                value: `+${battle.berryReward.toLocaleString()} berries`,
                inline: true
            }]);
        }

        return embed;
    }

    // Get battle status for user
    getBattleStatus(userId) {
        const userBattle = this.getUserActiveBattle(userId);
        if (!userBattle) {
            return { inBattle: false };
        }

        const { battle } = userBattle;
        const isPlayer1 = battle.player1.userId === userId;
        const player = isPlayer1 ? battle.player1 : battle.player2;
        const opponent = isPlayer1 ? battle.player2 : battle.player1;

        return {
            inBattle: true,
            battleId: battle.id,
            status: battle.status,
            currentTurn: battle.currentTurn,
            isMyTurn: battle.currentPlayer === (isPlayer1 ? 'player1' : 'player2'),
            myHP: player.hp,
            myMaxHP: player.maxHealth,
            opponentHP: opponent.hp,
            opponentMaxHP: opponent.maxHealth,
            myEffects: player.effects,
            opponentEffects: opponent.effects
        };
    }

    // Cleanup old battles
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [battleId, battle] of this.activeBattles) {
            // Clean battles older than 1 hour or ended battles older than 10 minutes
            const maxAge = battle.status === 'ended' ? 10 * 60 * 1000 : 60 * 60 * 1000;
            
            if (now - battle.lastActivity > maxAge) {
                this.activeBattles.delete(battleId);
                this.clearBattleTimeout(battleId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Battle Manager cleaned up ${cleanedCount} old battles`);
        }
    }

    // Get system statistics
    getStats() {
        const battles = Array.from(this.activeBattles.values());
        
        return {
            totalBattles: battles.length,
            activeBattles: battles.filter(b => b.status === 'battle').length,
            selectionPhase: battles.filter(b => b.status === 'fruit_selection').length,
            endedBattles: battles.filter(b => b.status === 'ended').length,
            pveBattles: battles.filter(b => b.isVsNPC).length,
            pvpBattles: battles.filter(b => !b.isVsNPC).length
        };
    }
}

module.exports = BattleManager;
