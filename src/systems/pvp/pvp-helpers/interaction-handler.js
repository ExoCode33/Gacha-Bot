// src/systems/pvp/pvp-helpers/interaction-handler.js - Create missing helper
const { EmbedBuilder, MessageFlags } = require('discord.js');
const { getRarityEmoji } = require('../../../data/devil-fruits');

// Import abilities safely
let balancedDevilFruitAbilities = {};
let statusEffects = {};

try {
    const abilitiesData = require('../../../data/balanced-devil-fruit-abilities');
    balancedDevilFruitAbilities = abilitiesData.balancedDevilFruitAbilities || {};
    statusEffects = abilitiesData.statusEffects || {};
} catch (error) {
    console.warn('⚠️ Could not load abilities for interaction handler');
    balancedDevilFruitAbilities = {};
    statusEffects = {};
}

class PvPInteractionHandler {
    constructor(pvpSystem) {
        this.pvpSystem = pvpSystem;
    }

    // Main interaction handler for all PvP interactions
    async handleInteraction(interaction) {
        const customId = interaction.customId;

        try {
            console.log(`🎮 Processing PvP interaction: ${customId}`);

            // Handle fruit selection from rarity dropdowns
            if (customId.includes('_divine') || customId.includes('_mythical') || 
                customId.includes('_legendary') || customId.includes('_epic') ||
                customId.includes('_rare') || customId.includes('_uncommon') || customId.includes('_common')) {
                
                const parts = customId.split('_');
                const selectionIndex = parts.findIndex(part => part === 'selection');
                
                if (selectionIndex !== -1 && selectionIndex + 3 < parts.length) {
                    const battleId = parts.slice(selectionIndex + 1, -2).join('_');
                    const userId = parts[parts.length - 2];
                    const rarity = parts[parts.length - 1];
                    
                    await this.pvpSystem.handleFruitSelection(interaction, battleId, userId, rarity);
                    return true;
                }
            }

            // Handle page switching between high/low rarity
            if (customId.startsWith('page_switch_')) {
                const parts = customId.split('_');
                if (parts.length >= 4) {
                    const battleId = parts.slice(2, -1).join('_');
                    const userId = parts[parts.length - 1];
                    await this.pvpSystem.handlePageSwitch(interaction, battleId, userId);
                    return true;
                }
            }

            // Handle confirm selection
            if (customId.startsWith('confirm_selection_')) {
                const parts = customId.split('_');
                if (parts.length >= 4) {
                    const battleId = parts.slice(2, -1).join('_');
                    const userId = parts[parts.length - 1];
                    await this.pvpSystem.handleConfirmSelection(interaction, battleId, userId);
                    return true;
                }
            }

            // Handle clear selection
            if (customId.startsWith('clear_selection_')) {
                const parts = customId.split('_');
                if (parts.length >= 4) {
                    const battleId = parts.slice(2, -1).join('_');
                    const userId = parts[parts.length - 1];
                    await this.pvpSystem.handleClearSelection(interaction, battleId, userId);
                    return true;
                }
            }

            // Handle battle start button
            if (customId.startsWith('start_battle_')) {
                const battleId = customId.replace('start_battle_', '');
                const battleData = this.pvpSystem.activeBattles.get(battleId);
                
                if (battleData) {
                    await this.pvpSystem.startTurnBasedBattle(interaction, battleData);
                }
                return true;
            }

            // Handle skill usage during battle
            if (customId.startsWith('use_skill_')) {
                const parts = customId.split('_');
                if (parts.length >= 5) {
                    const battleId = parts.slice(2, -2).join('_');
                    const userId = parts[parts.length - 2];
                    const skillIndex = parseInt(parts[parts.length - 1]);
                    
                    await this.pvpSystem.battleInterfaceHelper.handleSkillUsage(interaction, battleId, userId, skillIndex);
                    return true;
                }
            }

            // Handle skill info view
            if (customId.startsWith('show_skills_')) {
                const parts = customId.split('_');
                if (parts.length >= 4) {
                    const battleId = parts.slice(2, -1).join('_');
                    const userId = parts[parts.length - 1];
                    await this.showSkillDetails(interaction, battleId, userId);
                    return true;
                }
            }

            // Handle surrender
            if (customId.startsWith('surrender_')) {
                const parts = customId.split('_');
                if (parts.length >= 3) {
                    const battleId = parts.slice(1, -1).join('_');
                    const userId = parts[parts.length - 1];
                    await this.handleSurrender(interaction, battleId, userId);
                    return true;
                }
            }

            // Handle battle log viewing
            if (customId.startsWith('view_log_')) {
                const parts = customId.split('_');
                if (parts.length >= 4) {
                    const battleId = parts.slice(2, -1).join('_');
                    const userId = parts[parts.length - 1];
                    await this.showBattleLog(interaction, battleId, userId);
                    return true;
                }
            }

            // If no handler matched, return false
            console.log(`❓ No handler found for PvP interaction: ${customId}`);
            return false;

        } catch (error) {
            console.error('Error handling PvP interaction:', error);
            
            // Handle expired interactions gracefully
            if (error.code === 10062) {
                console.warn('⚠️ PvP interaction expired - this is normal for old interactions');
                return true;
            }
            
            // Handle interaction already replied errors
            if (error.code === 'InteractionNotReplied' || error.message.includes('InteractionNotReplied')) {
                console.warn('⚠️ Interaction not replied - this can happen during complex battle flows');
                return true;
            }
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred during the battle interaction.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
            }
            
            return true; // We attempted to handle it
        }
    }

    // Show detailed skill information for a player
    async showSkillDetails(interaction, battleId, userId) {
        const battleData = this.pvpSystem.activeBattles.get(battleId);
        if (!battleData) {
            return await this.safeReply(interaction, '❌ Battle not found!', true);
        }

        const playerData = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        if (!playerData) {
            return await this.safeReply(interaction, '❌ Player not found!', true);
        }
        
        const skillsEmbed = new EmbedBuilder()
            .setColor(0x9932CC)
            .setTitle('📋 Your Devil Fruit Abilities')
            .setDescription('Detailed information about your selected fruits');

        if (!playerData.selectedFruits || playerData.selectedFruits.length === 0) {
            skillsEmbed.addFields({
                name: '❓ No Skills Available',
                value: 'You haven\'t selected any fruits yet or the selection is incomplete.',
                inline: false
            });
        } else {
            playerData.selectedFruits.forEach((fruit, index) => {
                const ability = balancedDevilFruitAbilities[fruit.fruit_name] || {
                    name: 'Unknown Ability',
                    damage: 100,
                    cooldown: 0,
                    description: 'A mysterious power',
                    accuracy: 85
                };
                const emoji = getRarityEmoji(fruit.fruit_rarity);
                
                let effectText = '';
                if (ability.effect && statusEffects[ability.effect]) {
                    const effect = statusEffects[ability.effect];
                    effectText = `\n🌟 **Effect**: ${effect.description}`;
                    if (effect.duration) effectText += ` (${effect.duration} turns)`;
                    if (effect.damage) effectText += ` - ${effect.damage} dmg`;
                }
                
                skillsEmbed.addFields({
                    name: `${index + 1}. ${emoji} ${fruit.fruit_name}`,
                    value: [
                        `⚔️ **${ability.name}**`,
                        `💥 **Damage**: ${ability.damage}`,
                        `⏱️ **Cooldown**: ${ability.cooldown} turns`,
                        `🎯 **Accuracy**: ${ability.accuracy}%`,
                        `📝 ${ability.description}${effectText}`
                    ].join('\n'),
                    inline: false
                });
            });
        }

        await this.safeReply(interaction, null, true, [skillsEmbed]);
    }

    // Handle surrender action
    async handleSurrender(interaction, battleId, userId) {
        const battleData = this.pvpSystem.activeBattles.get(battleId);
        if (!battleData) {
            return await this.safeReply(interaction, '❌ Battle not found!', true);
        }

        const surrenderingPlayer = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        const winner = surrenderingPlayer === battleData.player1 ? battleData.player2 : battleData.player1;

        if (!surrenderingPlayer) {
            return await this.safeReply(interaction, '❌ You are not part of this battle!', true);
        }

        const surrenderEmbed = new EmbedBuilder()
            .setColor(0xFF4500)
            .setTitle('🏳️ Battle Ended - Surrender')
            .setDescription(`**${surrenderingPlayer.username}** has surrendered the battle!`)
            .addFields([
                {
                    name: '🏆 Winner',
                    value: `**${winner.username}** wins by surrender!`,
                    inline: true
                },
                {
                    name: '📊 Battle Stats',
                    value: [
                        `**Turns**: ${battleData.currentTurn}`,
                        `**Type**: ${battleData.isVsNPC ? 'PvE' : 'PvP'}`,
                        `**${surrenderingPlayer.username} HP**: ${surrenderingPlayer.hp}`,
                        `**${winner.username} HP**: ${winner.hp}`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Sometimes retreat is the wisest choice...' })
            .setTimestamp();

        // Award berries for PvE victories even on surrender (reduced amount)
        if (battleData.isVsNPC && winner.userId === battleData.player1.userId) {
            const berryReward = Math.floor(this.calculateBerryReward(battleData.npcBoss?.difficulty || 'Easy') * 0.3);
            try {
                await DatabaseManager.updateUserBerries(winner.userId, berryReward, 'PvE Victory (Surrender)');
                
                surrenderEmbed.addFields([{
                    name: '💰 Consolation Reward',
                    value: `+${berryReward.toLocaleString()} berries (30% of full reward)`,
                    inline: false
                }]);
            } catch (error) {
                console.error('Error awarding consolation berries:', error);
            }
        }

        await this.pvpSystem.safeUpdate(interaction, {
            embeds: [surrenderEmbed],
            components: []
        });

        // Clean up the battle
        this.pvpSystem.activeBattles.delete(battleId);
        console.log(`🏳️ Battle ${battleId} ended by surrender from ${surrenderingPlayer.username}`);
    }

    // Show battle log
    async showBattleLog(interaction, battleId, userId) {
        const battleData = this.pvpSystem.activeBattles.get(battleId);
        if (!battleData) {
            return await this.safeReply(interaction, '❌ Battle not found!', true);
        }

        const battleLog = battleData.battleLog || [];
        
        const logEmbed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('📜 Complete Battle Log')
            .setDescription(`**Battle ID**: \`${battleId}\`\n**Turn**: ${battleData.currentTurn}`)
            .setTimestamp();

        if (battleLog.length === 0) {
            logEmbed.addFields({
                name: '📝 Log Entries',
                value: 'No battle events recorded yet.',
                inline: false
            });
        } else {
            // Show last 10 log entries
            const recentLogs = battleLog.slice(-10);
            const logText = recentLogs.map((entry, index) => {
                const turnInfo = entry.turn ? `[T${entry.turn}]` : '[--]';
                const timeInfo = entry.timestamp ? `<t:${Math.floor(entry.timestamp / 1000)}:T>` : '';
                return `${turnInfo} ${entry.message} ${timeInfo}`;
            }).join('\n');

            logEmbed.addFields({
                name: `📝 Recent Log Entries (${recentLogs.length}/${battleLog.length})`,
                value: logText.slice(0, 1024), // Discord field limit
                inline: false
            });

            if (battleLog.length > 10) {
                logEmbed.setFooter({ text: `Showing last 10 of ${battleLog.length} total entries` });
            }
        }

        await this.safeReply(interaction, null, true, [logEmbed]);
    }

    // Calculate berry reward (helper method)
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

    // Safe reply helper
    async safeReply(interaction, content, ephemeral = false, embeds = []) {
        try {
            const payload = {};
            if (content) payload.content = content;
            if (embeds.length > 0) payload.embeds = embeds;
            if (ephemeral) payload.flags = MessageFlags.Ephemeral;

            if (interaction.replied || interaction.deferred) {
                return await interaction.followUp(payload);
            } else {
                return await interaction.reply(payload);
            }
        } catch (error) {
            console.error('Error in safe reply:', error);
            return null;
        }
    }
}

module.exports = PvPInteractionHandler;
