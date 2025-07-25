// src/systems/pvp/pvp-helpers/fruit-selection-helper.js - Create the missing helper directory and file
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { getRarityEmoji, getRarityColor } = require('../../../data/devil-fruits');

// Import abilities safely
let balancedDevilFruitAbilities = {};
try {
    const abilitiesData = require('../../../data/balanced-devil-fruit-abilities');
    balancedDevilFruitAbilities = abilitiesData.balancedDevilFruitAbilities || {};
} catch (error) {
    console.warn('⚠️ Could not load abilities for fruit selection helper');
    balancedDevilFruitAbilities = {};
}

class FruitSelectionHelper {
    constructor(pvpSystem) {
        this.pvpSystem = pvpSystem;
    }

    // Create public battle screen showing live selection progress
    createPublicBattleScreen(battleData) {
        const { player1, player2, isVsNPC, selectionData } = battleData;
        
        const p1Progress = this.getSelectionProgress(selectionData.player1.selectedFruits.length);
        const p2Progress = isVsNPC ? this.getSelectionProgress(5) : this.getSelectionProgress(selectionData.player2.selectedFruits.length);
        
        const p1Status = selectionData.player1.selectionComplete ? '✅ Ready' : 
                        selectionData.player1.selectedFruits.length === 5 ? '⏳ Confirming' : 
                        `⏳ Selecting (${selectionData.player1.currentPage} page)`;
                        
        const p2Status = isVsNPC ? '✅ Ready (NPC)' :
                        selectionData.player2.selectionComplete ? '✅ Ready' :
                        selectionData.player2.selectedFruits.length === 5 ? '⏳ Confirming' :
                        `⏳ Selecting (${selectionData.player2.currentPage} page)`;

        const p1RarityBreakdown = this.getRarityBreakdown(selectionData.player1.selectedFruits);
        const p2RarityBreakdown = isVsNPC ? 'Mysterious Boss Powers' : this.getRarityBreakdown(selectionData.player2.selectedFruits);

        return new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('⚔️ Enhanced Turn-Based PvP Battle - Live Selection')
            .setDescription(`🔥 **Real-time fruit selection in progress!**\n*Battle ID: \`${battleData.id}\`*`)
            .addFields([
                {
                    name: `🏴‍☠️ ${player1.username}`,
                    value: [
                        `${p1Progress} **${selectionData.player1.selectedFruits.length}/5 fruits**`,
                        `**Status**: ${p1Status}`,
                        `**Level**: ${player1.level} | **CP**: ${player1.balancedCP.toLocaleString()}`,
                        `**Selection**: ${p1RarityBreakdown}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: `${isVsNPC ? player2.npcData?.emoji || '🤖' : '🏴‍☠️'} ${player2.username}`,
                    value: [
                        `${p2Progress} **${isVsNPC ? '5' : selectionData.player2.selectedFruits.length}/5 fruits**`,
                        `**Status**: ${p2Status}`,
                        `**Level**: ${player2.level} | **CP**: ${player2.balancedCP.toLocaleString()}`,
                        `**Selection**: ${p2RarityBreakdown}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🎯 Battle Information',
                    value: [
                        `**Battle Type**: ${isVsNPC ? 'PvE Enhanced Turn-Based' : 'PvP Enhanced Turn-Based'}`,
                        `**Selection System**: High/Low Rarity Pages`,
                        `**Real-Time Updates**: ✅ Live selection tracking`,
                        `**Active Battles**: ${this.pvpSystem.activeBattles?.size || 0}`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Enhanced High/Low Page System - Watch the live selection!' })
            .setTimestamp();
    }

    // Get selection progress bar
    getSelectionProgress(count) {
        const totalBars = 10;
        const filledBars = Math.floor((count / 5) * totalBars);
        const emptyBars = totalBars - filledBars;
        return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
    }

    // Get rarity breakdown for public display
    getRarityBreakdown(selectedFruits) {
        if (!selectedFruits || selectedFruits.length === 0) {
            return 'No fruits selected yet';
        }
        
        const breakdown = {
            divine: 0, mythical: 0, legendary: 0, epic: 0,
            rare: 0, uncommon: 0, common: 0
        };
        
        selectedFruits.forEach(fruit => {
            const rarity = fruit.fruit_rarity || 'common';
            if (breakdown.hasOwnProperty(rarity)) {
                breakdown[rarity]++;
            }
        });
        
        const parts = [];
        Object.entries(breakdown).forEach(([rarity, count]) => {
            if (count > 0) {
                parts.push(`${rarity.charAt(0).toUpperCase() + rarity.slice(1)}(${count})`);
            }
        });
        
        return parts.join(', ') || 'No fruits selected';
    }

    // Send private selection interface to user
    async sendPrivateSelection(interaction, battleData, player) {
        try {
            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);
            
            await interaction.followUp({
                content: `🔒 **Your Private Selection Interface** - Choose your 5 battle fruits!\n*Battle ID: \`${battleData.id}\`*`,
                embeds: [embed],
                components: components,
                flags: MessageFlags.Ephemeral
            });
            
        } catch (error) {
            console.error('Error sending private selection:', error);
        }
    }

    // Create private selection embed for user
    createPrivateSelectionEmbed(battleData, player) {
        const playerKey = player.userId === battleData.player1.userId ? 'player1' : 'player2';
        const selectionData = battleData.selectionData[playerKey];
        const selectedCount = selectionData.selectedFruits.length;
        const currentPage = selectionData.currentPage;
        
        const embed = new EmbedBuilder()
            .setColor(selectedCount === 5 ? 0x00FF00 : 0x3498DB)
            .setTitle(`🔒 Your Private Fruit Selection - ${currentPage === 'high' ? 'High' : 'Low'} Rarity Page`)
            .setDescription(
                `**Progress: ${selectedCount}/5 fruits selected**\n\n` +
                (selectedCount === 5 ? 
                    '✅ **Perfect! You have 5 fruits selected. Click Confirm to proceed!**' : 
                    `🔄 **Select ${5 - selectedCount} more fruits to continue.**`)
            )
            .addFields([
                {
                    name: '🏴‍☠️ Your Battle Stats',
                    value: [
                        `**Name**: ${player.username}`,
                        `**Level**: ${player.level}`,
                        `**Balanced CP**: ${player.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${player.maxHealth}`,
                        `**Available Fruits**: ${player.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: `📋 ${currentPage === 'high' ? 'High' : 'Low'} Rarity Page`,
                    value: currentPage === 'high' ? 
                        [
                            `⭐ **Divine**: Ultimate powers`,
                            `🟧 **Mythical**: Legendary abilities`,
                            `🟨 **Legendary**: Elite techniques`,
                            `🟪 **Epic**: Powerful skills`
                        ].join('\n') :
                        [
                            `🟦 **Rare**: Solid abilities`,
                            `🟩 **Uncommon**: Reliable skills`,
                            `🟫 **Common**: Basic techniques`
                        ].join('\n'),
                    inline: true
                }
            ]);

        if (selectedCount > 0) {
            const selectedText = selectionData.selectedFruits.map((fruit, index) => {
                const emoji = getRarityEmoji(fruit.fruit_rarity);
                const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                const damage = ability ? ability.damage : 100;
                
                return `${index + 1}. ${emoji} **${fruit.fruit_name}** (${damage} dmg)`;
            }).join('\n');

            embed.addFields({
                name: '✅ Currently Selected Fruits',
                value: selectedText,
                inline: false
            });
        }

        return embed;
    }

    // Create private selection components (buttons for page switching, confirm, clear)
    async createPrivateSelectionComponents(battleData, player) {
        const components = [];
        const playerKey = player.userId === battleData.player1.userId ? 'player1' : 'player2';
        const selectionData = battleData.selectionData[playerKey];
        const selectedCount = selectionData.selectedFruits.length;
        const currentPage = selectionData.currentPage;

        // Action buttons row
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`page_switch_${battleData.id}_${player.userId}`)
                    .setLabel(currentPage === 'high' ? '⚡ Switch to Low Rarity Page' : '🔥 Switch to High Rarity Page')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`confirm_selection_${battleData.id}_${player.userId}`)
                    .setLabel(selectedCount === 5 ? '⚔️ Confirm & Start Battle!' : `✅ Confirm (${selectedCount}/5)`)
                    .setStyle(selectedCount === 5 ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(selectedCount !== 5),
                new ButtonBuilder()
                    .setCustomId(`clear_selection_${battleData.id}_${player.userId}`)
                    .setLabel('🗑️ Clear All')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(selectedCount === 0)
            );
        
        components.push(actionRow);
        return components;
    }

    // Handle fruit selection from player
    async handleFruitSelection(interaction, battleData, userId, rarity) {
        try {
            // For now, just acknowledge the selection
            // In a full implementation, this would show dropdown menus for fruit selection
            console.log(`🍈 ${userId} attempting to select ${rarity} rarity fruit for battle ${battleData.id}`);
            
            return { success: true };
        } catch (error) {
            console.error('Error in handleFruitSelection:', error);
            return { success: false, error: error.message };
        }
    }

    // Handle page switching between high/low rarity
    async handlePageSwitch(interaction, battleData, userId) {
        try {
            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player) {
                throw new Error('Player not found');
            }

            // Switch between high and low rarity pages
            selectionData.currentPage = selectionData.currentPage === 'high' ? 'low' : 'high';
            selectionData.lastUpdate = Date.now();
            this.pvpSystem.activeBattles.set(battleData.id, battleData);

            // Update the private selection embed
            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);

            await interaction.update({
                embeds: [embed],
                components: components
            });

            console.log(`📋 ${player.username} switched to ${selectionData.currentPage} rarity page`);

        } catch (error) {
            console.error('Error in handlePageSwitch:', error);
            throw error;
        }
    }

    // Handle confirm selection
    async handleConfirmSelection(interaction, battleData, userId) {
        try {
            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player || !selectionData.selectedFruits || selectionData.selectedFruits.length !== 5) {
                return {
                    success: false,
                    error: `You must select exactly 5 fruits! Currently selected: ${selectionData.selectedFruits?.length || 0}`
                };
            }

            // Confirm the selection
            player.selectedFruits = [...selectionData.selectedFruits];
            selectionData.selectionComplete = true;
            selectionData.lastUpdate = Date.now();
            this.pvpSystem.activeBattles.set(battleData.id, battleData);

            console.log(`✅ ${player.username} confirmed selection of 5 fruits`);

            // Check if all players have selected
            const allSelected = battleData.isVsNPC || 
                (battleData.selectionData.player1.selectionComplete && battleData.selectionData.player2.selectionComplete);

            return {
                success: true,
                allSelected: allSelected
            };

        } catch (error) {
            console.error('Error in handleConfirmSelection:', error);
            return { success: false, error: error.message };
        }
    }

    // Handle clear selection
    async handleClearSelection(interaction, battleData, userId) {
        try {
            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player) {
                throw new Error('Player not found');
            }

            // Clear all selected fruits
            selectionData.selectedFruits = [];
            selectionData.selectionComplete = false;
            selectionData.lastUpdate = Date.now();
            this.pvpSystem.activeBattles.set(battleData.id, battleData);

            // Update the interface
            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);

            await interaction.update({
                embeds: [embed],
                components: components
            });

            console.log(`🗑️ ${player.username} cleared their selection`);

        } catch (error) {
            console.error('Error in handleClearSelection:', error);
            throw error;
        }
    }

    // Update public battle screen with current selection status
    async updatePublicBattleScreen(interaction, battleData) {
        try {
            if (!battleData.publicMessageId) return;

            // Get the original message
            const channel = interaction.client.channels.cache.get(battleData.channelId);
            if (!channel) return;

            const message = await channel.messages.fetch(battleData.publicMessageId).catch(() => null);
            if (!message) return;

            const publicEmbed = this.createPublicBattleScreen(battleData);
            
            await message.edit({
                embeds: [publicEmbed]
            });

        } catch (error) {
            console.error('Error updating public battle screen:', error);
        }
    }
}

module.exports = FruitSelectionHelper;
