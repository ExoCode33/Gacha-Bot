// src/systems/pvp-helpers/battle-interface-helper.js - Battle Interface Module
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { getRarityEmoji } = require('../../data/devil-fruits');
const DatabaseManager = require('../../database/manager');

// Import abilities safely
let balancedDevilFruitAbilities = {};
let statusEffects = {};

try {
    const abilitiesData = require('../../data/balanced-devil-fruit-abilities');
    balancedDevilFruitAbilities = abilitiesData.balancedDevilFruitAbilities || {};
    statusEffects = abilitiesData.statusEffects || {};
} catch (error) {
    balancedDevilFruitAbilities = {};
    statusEffects = {};
}

class BattleInterfaceHelper {
    constructor(pvpSystem) {
        this.pvpSystem = pvpSystem;
    }

    // Show main battle interface with HP bars and turn options
    async showBattleInterface(interaction, battleData) {
        const { player1, player2, currentTurn, currentPlayer, battleLog } = battleData;
        
        // Create HP bars
        const p1HPPercent = (player1.hp / player1.maxHealth) * 100;
        const p2HPPercent = (player2.hp / player2.maxHealth) * 100;
        
        const p1HPBar = this.createHPBar(p1HPPercent);
        const p2HPBar = this.createHPBar(p2HPPercent);

        // Get current player data
        const currentPlayerData = battleData[currentPlayer];
        const isCurrentPlayerTurn = !battleData.isVsNPC || currentPlayer === 'player1';

        const embed = new EmbedBuilder()
            .setColor(currentPlayer === 'player1' ? 0x3498DB : 0xE74C3C)
            .setTitle(`⚔️ Turn ${currentTurn} - ${currentPlayerData.username}'s Turn`)
            .setDescription(this.getBattleDescription(battleData))
            .addFields([
                {
                    name: `🏴‍☠️ ${player1.username}`,
                    value: [
                        `${p1HPBar}`,
                        `**HP**: ${player1.hp}/${player1.maxHealth} (${p1HPPercent.toFixed(1)}%)`,
                        `**CP**: ${player1.balancedCP.toLocaleString()}`,
                        `**Effects**: ${this.getEffectsString(player1.effects)}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: `${player2.isNPC ? player2.npcData.emoji : '🏴‍☠️'} ${player2.username}`,
                    value: [
                        `${p2HPBar}`,
                        `**HP**: ${player2.hp}/${player2.maxHealth} (${p2HPPercent.toFixed(1)}%)`,
                        `**CP**: ${player2.balancedCP.toLocaleString()}`,
                        `**Effects**: ${this.getEffectsString(player2.effects)}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📜 Recent Battle Log',
                    value: this.getRecentBattleLog(battleLog),
                    inline: false
                }
            ])
            .setFooter({ 
                text: isCurrentPlayerTurn ? 'Select your attack!' : 'Waiting for opponent...' 
            })
            .setTimestamp();

        let components = [];

        if (isCurrentPlayerTurn) {
            // Show skill selection for human player
            components = await this.createSkillSelectionComponents(battleData, currentPlayerData);
        }

        try {
            await this.pvpSystem.safeUpdate(interaction, {
                embeds: [embed],
                components
            });
        } catch (error) {
            console.error('Error showing battle interface:', error);
        }

        // If it's NPC turn, process automatically
        if (battleData.isVsNPC && currentPlayer === 'player2') {
            setTimeout(() => {
                this.processNPCTurn(interaction, battleData);
            }, 2000);
        }
    }

    // Create HP bar visualization
    createHPBar(percentage) {
        const barLength = 20;
        const filledLength = Math.round((percentage / 100) * barLength);
        const emptyLength = barLength - filledLength;
        
        let fillEmoji = '🟢';
        if (percentage < 30) fillEmoji = '🔴';
        else if (percentage < 60) fillEmoji = '🟡';
        
        return fillEmoji.repeat(filledLength) + '⚫'.repeat(emptyLength);
    }

    // Get battle description
    getBattleDescription(battleData) {
        const { currentTurn } = battleData;
        
        if (currentTurn === 1) {
            return `🔥 **The battle begins!** Two powerful fighters clash with their Devil Fruit abilities!`;
        } else if (currentTurn <= 3) {
            return `⚡ **Early combat!** Both fighters are testing each other's defenses!`;
        } else if (currentTurn <= 7) {
            return `💥 **Intense battle!** The fight is heating up with devastating attacks!`;
        } else {
            return `🌟 **Epic finale!** This legendary battle will be remembered forever!`;
        }
    }

    // Create skill selection components
    async createSkillSelectionComponents(battleData, playerData) {
        const components = [];
        
        // Create skill selection buttons (up to 5 fruits)
        const skillButtons = playerData.selectedFruits.slice(0, 5).map((fruit, index) => {
            const ability = balancedDevilFruitAbilities[fruit.fruit_name] || {
                name: 'Unknown Skill',
                damage: 100,
                cooldown: 0
            };
            const emoji = getRarityEmoji(fruit.fruit_rarity);
            const cooldownInfo = ability.cooldown > 0 ? ` (${ability.cooldown}cd)` : '';
            
            return new ButtonBuilder()
                .setCustomId(`use_skill_${battleData.id}_${playerData.userId}_${index}`)
                .setLabel(`${fruit.fruit_name.slice(0, 15)}${cooldownInfo}`)
                .setEmoji(emoji)
                .setStyle(ButtonStyle.Primary);
        });

        // Split into rows (max 5 buttons per row)
        for (let i = 0; i < skillButtons.length; i += 5) {
            const row = new ActionRowBuilder()
                .addComponents(skillButtons.slice(i, i + 5));
            components.push(row);
        }

        // Add battle options row
        const battleOptionsRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`show_skills_${battleData.id}_${playerData.userId}`)
                    .setLabel('📋 View Skills')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`surrender_${battleData.id}_${playerData.userId}`)
                    .setLabel('🏳️ Surrender')
                    .setStyle(ButtonStyle.Danger)
            );
        
        components.push(battleOptionsRow);
        
        return components;
    }

    // Handle skill usage
    async handleSkillUsage(interaction, battleId, userId, skillIndex) {
        const battleData = this.pvpSystem.activeBattles.get(battleId);
        if (!battleData || battleData.status !== 'battle') {
            return this.pvpSystem.safeReply(interaction, '❌ Battle not found or not active!', true);
        }

        const currentPlayerData = battleData[battleData.currentPlayer];
        if (currentPlayerData.userId !== userId) {
            return this.pvpSystem.safeReply(interaction, '❌ It\'s not your turn!', true);
        }

        const selectedFruit = currentPlayerData.selectedFruits[skillIndex];
        const ability = balancedDevilFruitAbilities[selectedFruit.fruit_name] || {
            name: 'Basic Attack',
            damage: 100,
            cooldown: 0,
            effect: null,
            accuracy: 85
        };
        
        // Process the attack
        await this.processAttack(interaction, battleData, currentPlayerData, ability, selectedFruit);
    }

    // Process an attack
    async processAttack(interaction, battleData, attacker, ability, fruit) {
        const defender = battleData.currentPlayer === 'player1' ? battleData.player2 : battleData.player1;
        
        // Calculate damage
        const baseDamage = ability.damage || 100;
        const accuracy = ability.accuracy || 85;
        const hit = Math.random() * 100 <= accuracy;
        
        let damage = 0;
        if (hit) {
            const cpRatio = Math.min(attacker.balancedCP / defender.balancedCP, 1.5);
            const turnMultiplier = battleData.currentTurn === 1 ? 0.5 : 
                                 battleData.currentTurn === 2 ? 0.7 : 1.0;
            
            damage = Math.floor(baseDamage * cpRatio * turnMultiplier);
            damage = Math.max(5, damage);
            
            defender.hp = Math.max(0, defender.hp - damage);
        }

        // Create attack message
        let attackMessage = '';
        if (hit) {
            attackMessage = `⚡ **${attacker.username}** uses **${ability.name}**!\n` +
                          `💥 Deals **${damage}** damage to **${defender.username}**!`;
            
            if (ability.effect) {
                defender.effects.push({
                    name: ability.effect,
                    duration: 2,
                    description: `Affected by ${ability.effect}`
                });
                attackMessage += ` ✨ **${ability.effect} applied!**`;
            }
        } else {
            attackMessage = `⚡ **${attacker.username}** uses **${ability.name}** but misses!`;
        }

        // Add to battle log
        battleData.battleLog.push({
            type: 'attack',
            attacker: attacker.username,
            defender: defender.username,
            ability: ability.name,
            damage: damage,
            hit: hit,
            message: attackMessage,
            timestamp: Date.now(),
            turn: battleData.currentTurn
        });

        // Check for battle end
        if (defender.hp <= 0) {
            await this.endBattle(interaction, battleData, attacker, defender);
            return;
        }

        // Switch turns
        battleData.currentPlayer = battleData.currentPlayer === 'player1' ? 'player2' : 'player1';
        battleData.currentTurn++;

        // Check max turns
        if (battleData.currentTurn > 15) {
            await this.endBattleByTimeout(interaction, battleData);
            return;
        }

        // Process ongoing effects
        this.processOngoingEffects(battleData);

        // Show updated battle interface
        await this.showBattleInterface(interaction, battleData);
    }

    // Process NPC turn automatically
    async processNPCTurn(interaction, battleData) {
        const npcPlayer = battleData.player2;
        const availableFruits = npcPlayer.selectedFruits;
        
        // NPC AI selects a fruit
        const selectedFruitIndex = Math.floor(Math.random() * availableFruits.length);
        const selectedFruit = availableFruits[selectedFruitIndex];
        const ability = balancedDevilFruitAbilities[selectedFruit.fruit_name] || {
            name: 'Boss Attack',
            damage: 120,
            cooldown: 0,
            effect: null,
            accuracy: 85
        };

        await this.processAttack(interaction, battleData, npcPlayer, ability, selectedFruit);
    }

    // Process ongoing effects
    processOngoingEffects(battleData) {
        [battleData.player1, battleData.player2].forEach(player => {
            player.effects = player.effects.filter(effect => {
                if (effect.name.includes('burn') || effect.name.includes('poison')) {
                    const dotDamage = effect.name.includes('burn') ? 20 : 15;
                    player.hp = Math.max(0, player.hp - dotDamage);
                    
                    battleData.battleLog.push({
                        type: 'effect',
                        player: player.username,
                        effect: effect.name,
                        damage: dotDamage,
                        message: `🔥 ${player.username} takes ${dotDamage} ${effect.name} damage!`,
                        timestamp: Date.now()
                    });
                }
                
                effect.duration--;
                return effect.duration > 0;
            });
        });
    }

    // End battle with winner
    async endBattle(interaction, battleData, winner, loser) {
        battleData.status = 'ended';
        
        const winnerEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🏆 BATTLE COMPLETE!')
            .setDescription(`**${winner.username}** emerges victorious!`)
            .addFields([
                {
                    name: '🎉 Victory!',
                    value: `**${winner.username}** defeats **${loser.username}**!\n\n` +
                           `**Final HP**: ${winner.hp}/${winner.maxHealth}\n` +
                           `**Turns**: ${battleData.currentTurn}\n` +
                           `**Battle Type**: ${battleData.isVsNPC ? 'PvE' : 'PvP'}`,
                    inline: false
                },
                {
                    name: '📜 Battle Summary',
                    value: this.getBattleSummary(battleData),
                    inline: false
                }
            ])
            .setFooter({ text: 'Great battle! Your legend grows...' })
            .setTimestamp();

        // Award berries for PvE victory
        if (battleData.isVsNPC && winner.userId === battleData.player1.userId) {
            const berryReward = this.calculateBerryReward(battleData.npcBoss.difficulty);
            try {
                await DatabaseManager.updateUserBerries(winner.userId, berryReward, 'PvE Victory');
                
                winnerEmbed.addFields([{
                    name: '💰 Rewards',
                    value: `+${berryReward.toLocaleString()} berries`,
                    inline: true
                }]);
            } catch (error) {
                console.error('Error awarding berries:', error);
            }
        }

        await this.pvpSystem.safeUpdate(interaction, {
            embeds: [winnerEmbed],
            components: []
        });

        // Clean up
        this.pvpSystem.activeBattles.delete(battleData.id);
    }

    // End battle by timeout
    async endBattleByTimeout(interaction, battleData) {
        const { player1, player2 } = battleData;
        const winner = player1.hp > player2.hp ? player1 : player2;
        const loser = winner === player1 ? player2 : player1;
        
        await this.endBattle(interaction, battleData, winner, loser);
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

    // Get effects string
    getEffectsString(effects) {
        if (!effects || effects.length === 0) return 'None';
        return effects.map(e => `${e.name} (${e.duration})`).join(', ');
    }

    // Get recent battle log
    getRecentBattleLog(battleLog) {
        const recent = battleLog.slice(-5);
        return recent.map(entry => entry.message).join('\n') || 'Battle starting...';
    }

    // Get battle summary
    getBattleSummary(battleData) {
        const totalAttacks = battleData.battleLog.filter(l => l.type === 'attack').length;
        const totalDamage = battleData.battleLog
            .filter(l => l.type === 'attack' && l.hit)
            .reduce((sum, l) => sum + l.damage, 0);
        
        return `**Total Attacks**: ${totalAttacks}\n` +
               `**Total Damage**: ${totalDamage.toLocaleString()}\n` +
               `**Battle Duration**: ${battleData.currentTurn} turns`;
    }
}

module.exports = BattleInterfaceHelper;
