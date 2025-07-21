// src/systems/pvp/pvp-helpers/interaction-handler.js - Interaction Handler Module
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
    balancedDevilFruitAbilities = {};
    statusEffects = {};
}

class PvPInteractionHandler {
    constructor(pvpSystem) {
        this.pvpSystem = pvpSystem;
    }

    // Main interaction handler
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

            // Handle page switching
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

            // Handle battle start
            if (customId.startsWith('start_battle_')) {
                const battleId = customId.replace('start_battle_', '');
                const battleData = this.pvpSystem.activeBattles.get(battleId);
                
                if (battleData) {
                    await this.pvpSystem.startTurnBasedBattle(interaction, battleData);
                }
                return true;
            }

            // Handle skill usage
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

            return false;

        } catch (error) {
            console.error('Error handling PvP interaction:', error);
            
            if (error.code === 10062) {
                console.warn('⚠️ PvP interaction expired');
                return true;
            }
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred during the battle.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
            }
            
            return true;
        }
    }

    // Show detailed skill information
    async showSkillDetails(interaction, battleId, userId) {
        const battleData = this.pvpSystem.activeBattles.get(battleId);
        if (!battleData) return;

        const playerData = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        
        const skillsEmbed = new EmbedBuilder()
            .setColor(0x9932CC)
            .setTitle('📋 Your Devil Fruit Abilities')
            .setDescription('Detailed information about your selected fruits');

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

        await interaction.reply({
            embeds: [skillsEmbed],
            flags: MessageFlags.Ephemeral
        });
    }

    // Handle surrender
    async handleSurrender(interaction, battleId, userId) {
        const battleData = this.pvpSystem.activeBattles.get(battleId);
        if (!battleData) return;

        const surrenderingPlayer = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        const winner = surrenderingPlayer === battleData.player1 ? battleData.player2 : battleData.player1;

        const surrenderEmbed = new EmbedBuilder()
            .setColor(0xFF4500)
            .setTitle('🏳️ Battle Ended - Surrender')
            .setDescription(`**${surrenderingPlayer.username}** has surrendered!`)
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
            .setTimestamp();

        await this.pvpSystem.safeUpdate(interaction, {
            embeds: [surrenderEmbed],
            components: []
        });

        this.pvpSystem.activeBattles.delete(battleId);
    }
}

module.exports = PvPInteractionHandler;
