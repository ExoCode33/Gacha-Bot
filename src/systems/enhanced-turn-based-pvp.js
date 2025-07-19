// src/systems/enhanced-turn-based-pvp.js - COMPLETE UPDATED VERSION with All Fruits by Rarity
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const PvPBalanceSystem = require('./pvp-balance');
const NPCBossSystem = require('./npc-bosses');
const { getRarityEmoji, getRarityColor } = require('../data/devil-fruits');

// Import abilities safely
let balancedDevilFruitAbilities = {};
let statusEffects = {};

try {
    const abilitiesData = require('../data/balanced-devil-fruit-abilities');
    balancedDevilFruitAbilities = abilitiesData.balancedDevilFruitAbilities || {};
    statusEffects = abilitiesData.statusEffects || {};
} catch (error) {
    console.warn('⚠️ Could not load devil fruit abilities, using fallback system');
}

class EnhancedTurnBasedPvP {
    constructor() {
        this.activeBattles = new Map(); // battleId -> battleData
        this.playerSelections = new Map(); // userId -> selectedFruits
        this.battleQueue = new Set();
        this.battleCooldowns = new Map();
        
        console.log('⚔️ Enhanced Turn-Based PvP System initialized');
    }

    // Start a battle (from queue or challenge)
    async startBattle(interaction, player1Fighter, player2Fighter = null) {
        const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // If no player2, get balanced NPC boss
        let isVsNPC = false;
        let npcBoss = null;
        
        if (!player2Fighter) {
            npcBoss = NPCBossSystem.getBalancedBossForPlayer(player1Fighter.balancedCP);
            player2Fighter = await this.createNPCFighter(npcBoss);
            isVsNPC = true;
        }

        const battleData = {
            id: battleId,
            player1: player1Fighter,
            player2: player2Fighter,
            isVsNPC,
            npcBoss,
            currentTurn: 1,
            currentPlayer: Math.random() < 0.5 ? 'player1' : 'player2', // Random first turn
            battleLog: [],
            turnTimeout: null,
            created: Date.now(),
            status: 'fruit_selection'
        };

        this.activeBattles.set(battleId, battleData);

        // Start fruit selection phase
        await this.startFruitSelection(interaction, battleData);
        
        return battleId;
    }

    // Create NPC fighter
    async createNPCFighter(npcBoss) {
        const selectedFruits = NPCBossSystem.selectFruitsForNPC(npcBoss);
        
        return {
            userId: `npc_${npcBoss.name.toLowerCase().replace(/\s/g, '_')}`,
            username: npcBoss.name,
            title: npcBoss.title,
            level: npcBoss.level,
            balancedCP: npcBoss.totalCP,
            maxHealth: Math.floor(npcBoss.totalCP * 0.8), // Balanced health
            hp: Math.floor(npcBoss.totalCP * 0.8),
            fruits: selectedFruits.map(fruitName => ({
                fruit_name: fruitName,
                fruit_rarity: this.getFruitRarity(fruitName)
            })),
            selectedFruits: selectedFruits,
            effects: [],
            isNPC: true,
            npcData: npcBoss
        };
    }

    // Get fruit rarity (fallback method)
    getFruitRarity(fruitName) {
        // Try to get from devil fruits data
        try {
            const { getFruitByName } = require('../data/devil-fruits');
            const fruit = getFruitByName(fruitName);
            return fruit?.rarity || 'common';
        } catch (error) {
            // Fallback based on name patterns
            if (fruitName.includes('Mythical') || fruitName.includes('Phoenix') || fruitName.includes('Nika')) {
                return 'mythical';
            } else if (fruitName.includes('Legendary') || fruitName.includes('Gura') || fruitName.includes('Yami')) {
                return 'legendary';
            } else if (fruitName.includes('Logia') || fruitName.includes('Magu') || fruitName.includes('Pika')) {
                return 'epic';
            }
            return 'common';
        }
    }

    // Start fruit selection phase
    async startFruitSelection(interaction, battleData) {
        const { player1, player2, isVsNPC } = battleData;

        if (isVsNPC) {
            // Player vs NPC - only player needs to select fruits
            await this.showFruitSelectionForPlayer(interaction, battleData, player1);
        } else {
            // Player vs Player - both need to select fruits
            await this.showFruitSelectionForPlayer(interaction, battleData, player1);
            // Send selection to player2 as well (in a real implementation)
        }
    }

    // FIXED: Show fruit selection interface with ALL fruits sorted by rarity
    async showFruitSelectionForPlayer(interaction, battleData, player) {
        const { isVsNPC, npcBoss } = battleData;
        
        // Sort fruits by rarity (highest first) then by name
        const rarityOrder = ['divine', 'omnipotent', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
        const sortedFruits = [...player.fruits].sort((a, b) => {
            const rarityDiff = rarityOrder.indexOf(a.fruit_rarity) - rarityOrder.indexOf(b.fruit_rarity);
            if (rarityDiff !== 0) return rarityDiff;
            return a.fruit_name.localeCompare(b.fruit_name);
        });

        // Create detailed fruit selection display
        const fruitListText = sortedFruits.slice(0, 15).map((fruit, index) => {
            const emoji = getRarityEmoji(fruit.fruit_rarity);
            const ability = balancedDevilFruitAbilities[fruit.fruit_name];
            const damage = ability ? ability.damage : 100;
            const cooldown = ability ? ability.cooldown : 0;
            const effect = ability && ability.effect ? ` • ${ability.effect}` : '';
            
            return `${emoji} **${fruit.fruit_name}**\n   ⚔️ ${ability?.name || 'Unknown'} - ${damage} dmg, ${cooldown}cd${effect}`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('⚔️ PvP Battle - Fruit Selection')
            .setDescription(
                isVsNPC 
                    ? `You're about to face a mysterious opponent!\n\n**Select 5 Devil Fruits for battle:**`
                    : `**PvP Battle Starting!**\n\nBoth players select 5 Devil Fruits for battle.`
            )
            .addFields([
                {
                    name: '🏴‍☠️ Your Stats',
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
                    name: '⚡ Battle Info',
                    value: [
                        `**Battle Type**: ${isVsNPC ? 'PvE (vs Mysterious Boss)' : 'PvP (Player vs Player)'}`,
                        `**Turn Based**: Yes`,
                        `**Max Turns**: 15`,
                        `**Skill Selection**: Real-time`,
                        `**Battle Log**: Live updates`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🍈 Your Devil Fruits (Sorted by Rarity)',
                    value: fruitListText + (sortedFruits.length > 15 ? `\n\n...and ${sortedFruits.length - 15} more fruits` : ''),
                    inline: false
                }
            ])
            .setFooter({ text: `Select your strongest 5 fruits from ${sortedFruits.length} available!` })
            .setTimestamp();

        // Create multiple selection menus if needed (Discord limit: 25 options per menu)
        const components = [];
        const maxOptionsPerMenu = 25;
        const totalMenus = Math.ceil(sortedFruits.length / maxOptionsPerMenu);

        for (let menuIndex = 0; menuIndex < totalMenus && menuIndex < 4; menuIndex++) { // Max 4 menus (100 fruits)
            const startIndex = menuIndex * maxOptionsPerMenu;
            const endIndex = Math.min(startIndex + maxOptionsPerMenu, sortedFruits.length);
            const menuFruits = sortedFruits.slice(startIndex, endIndex);

            const fruitOptions = menuFruits.map((fruit, localIndex) => {
                const globalIndex = startIndex + localIndex;
                const emoji = getRarityEmoji(fruit.fruit_rarity);
                const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                const damage = ability ? ability.damage : 100;
                const cooldown = ability ? ability.cooldown : 0;
                
                return {
                    label: fruit.fruit_name.length > 25 ? fruit.fruit_name.slice(0, 22) + '...' : fruit.fruit_name,
                    description: `${fruit.fruit_rarity} • ${damage}dmg ${cooldown}cd • ${ability?.name || 'Unknown'}`,
                    value: `fruit_${globalIndex}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}`,
                    emoji: emoji
                };
            });

            if (fruitOptions.length > 0) {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_menu${menuIndex}`)
                    .setPlaceholder(`Select fruits from this group (${startIndex + 1}-${endIndex})...`)
                    .setMinValues(0)
                    .setMaxValues(Math.min(5, fruitOptions.length))
                    .addOptions(fruitOptions);

                const row = new ActionRowBuilder().addComponents(selectMenu);
                components.push(row);
            }
        }

        // Add confirm button
        if (components.length > 0) {
            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirm_fruit_selection_${battleData.id}_${player.userId}`)
                        .setLabel('✅ Confirm Selection (Select exactly 5 fruits)')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true) // Will be enabled when 5 fruits selected
                );
            components.push(confirmRow);
        }

        // Ensure we have fruits to select
        if (sortedFruits.length < 5) {
            return interaction.reply({
                content: '❌ You need at least 5 Devil Fruits to participate in turn-based battles!',
                ephemeral: true
            });
        }

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: components
            });
        } else {
            await interaction.reply({
                embeds: [embed],
                components: components
            });
        }
    }

    // FIXED: Handle fruit selection (updated for multi-menu system)
    async handleFruitSelection(interaction, battleId, userId, menuIndex = 0) {
        const battleData = this.activeBattles.get(battleId);
        if (!battleData) {
            return interaction.reply({ content: '❌ Battle not found!', ephemeral: true });
        }

        const player = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        if (!player) {
            return interaction.reply({ content: '❌ Player not found in this battle!', ephemeral: true });
        }

        // Initialize player selection if not exists
        if (!player.tempSelectedFruits) {
            player.tempSelectedFruits = [];
        }

        // Get selected fruits from this menu
        const selectedValues = interaction.values || [];
        const selectedFruits = selectedValues.map(value => {
            const parts = value.split('_');
            const fruitIndex = parseInt(parts[1]);
            return player.fruits[fruitIndex];
        }).filter(fruit => fruit); // Remove any undefined fruits

        // Add to temporary selection (remove duplicates)
        selectedFruits.forEach(fruit => {
            const exists = player.tempSelectedFruits.find(f => f.fruit_name === fruit.fruit_name);
            if (!exists) {
                player.tempSelectedFruits.push(fruit);
            }
        });

        // Remove fruits that were deselected
        const selectedFruitNames = selectedFruits.map(f => f.fruit_name);
        player.tempSelectedFruits = player.tempSelectedFruits.filter(fruit => {
            const stillSelected = selectedFruitNames.includes(fruit.fruit_name) || 
                                 selectedValues.length === 0; // Keep all if nothing selected in this menu
            return stillSelected;
        });

        // Create updated embed showing current selection
        const embed = this.createSelectionProgressEmbed(battleData, player);
        
        // Update components to show current selection and enable/disable confirm
        const components = await this.createUpdatedSelectionComponents(battleData, player);

        try {
            await interaction.update({
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Error updating fruit selection:', error);
            // Fallback to reply if update fails
            await interaction.followUp({
                content: `✅ Selected ${selectedFruits.length} fruits. Total selected: ${player.tempSelectedFruits?.length || 0}/5`,
                ephemeral: true
            });
        }
    }

    // Handle confirm fruit selection
    async handleConfirmFruitSelection(interaction, battleId, userId) {
        const battleData = this.activeBattles.get(battleId);
        if (!battleData) {
            return interaction.reply({ content: '❌ Battle not found!', ephemeral: true });
        }

        const player = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        if (!player || !player.tempSelectedFruits || player.tempSelectedFruits.length !== 5) {
            return interaction.reply({ 
                content: `❌ You must select exactly 5 fruits! Currently selected: ${player.tempSelectedFruits?.length || 0}`,
                ephemeral: true 
            });
        }

        // Confirm the selection
        player.selectedFruits = [...player.tempSelectedFruits];
        this.playerSelections.set(userId, player.selectedFruits);

        // Check if all players have selected
        const allSelected = battleData.isVsNPC || 
            (battleData.player1.selectedFruits && battleData.player2.selectedFruits);

        if (allSelected) {
            // Reveal boss if vs NPC and start battle
            if (battleData.isVsNPC) {
                await this.revealBossAndStartBattle(interaction, battleData);
            } else {
                await this.startTurnBasedBattle(interaction, battleData);
            }
        } else {
            await interaction.update({
                content: '✅ Fruits selected! Waiting for opponent...',
                embeds: [],
                components: []
            });
        }
    }

    // Create selection progress embed
    createSelectionProgressEmbed(battleData, player) {
        const selectedCount = player.tempSelectedFruits?.length || 0;
        const { isVsNPC } = battleData;

        const embed = new EmbedBuilder()
            .setColor(selectedCount === 5 ? 0x00FF00 : 0x3498DB)
            .setTitle('⚔️ PvP Battle - Fruit Selection Progress')
            .setDescription(
                `**Selection Progress: ${selectedCount}/5 fruits selected**\n\n` +
                (selectedCount === 5 ? '✅ **Ready to battle! Click Confirm to proceed.**' : 
                `🔄 **Select ${5 - selectedCount} more fruits to continue.**`)
            )
            .addFields([
                {
                    name: '🏴‍☠️ Your Stats',
                    value: [
                        `**Name**: ${player.username}`,
                        `**Level**: ${player.level}`,
                        `**Balanced CP**: ${player.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${player.maxHealth}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚡ Battle Info',
                    value: [
                        `**Battle Type**: ${isVsNPC ? 'PvE (vs Boss)' : 'PvP'}`,
                        `**Turn Based**: Yes`,
                        `**Max Turns**: 15`,
                        `**Skill Selection**: Real-time`
                    ].join('\n'),
                    inline: true
                }
            ]);

        // Show selected fruits
        if (selectedCount > 0) {
            const selectedText = player.tempSelectedFruits.map((fruit, index) => {
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

    // Create updated selection components
    async createUpdatedSelectionComponents(battleData, player) {
        const components = [];
        const selectedCount = player.tempSelectedFruits?.length || 0;
        const selectedNames = new Set(player.tempSelectedFruits?.map(f => f.fruit_name) || []);

        // Sort fruits by rarity (highest first)
        const rarityOrder = ['divine', 'omnipotent', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
        const sortedFruits = [...player.fruits].sort((a, b) => {
            const rarityDiff = rarityOrder.indexOf(a.fruit_rarity) - rarityOrder.indexOf(b.fruit_rarity);
            if (rarityDiff !== 0) return rarityDiff;
            return a.fruit_name.localeCompare(b.fruit_name);
        });

        // Create selection menus
        const maxOptionsPerMenu = 25;
        const totalMenus = Math.ceil(sortedFruits.length / maxOptionsPerMenu);

        for (let menuIndex = 0; menuIndex < totalMenus && menuIndex < 4; menuIndex++) {
            const startIndex = menuIndex * maxOptionsPerMenu;
            const endIndex = Math.min(startIndex + maxOptionsPerMenu, sortedFruits.length);
            const menuFruits = sortedFruits.slice(startIndex, endIndex);

            const fruitOptions = menuFruits.map((fruit, localIndex) => {
                const globalIndex = startIndex + localIndex;
                const emoji = getRarityEmoji(fruit.fruit_rarity);
                const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                const damage = ability ? ability.damage : 100;
                const cooldown = ability ? ability.cooldown : 0;
                const isSelected = selectedNames.has(fruit.fruit_name);
                
                return {
                    label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.length > 20 ? fruit.fruit_name.slice(0, 17) + '...' : fruit.fruit_name}`,
                    description: `${fruit.fruit_rarity} • ${damage}dmg ${cooldown}cd • ${ability?.name || 'Unknown'}`,
                    value: `fruit_${globalIndex}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}`,
                    emoji: emoji,
                    default: isSelected
                };
            });

            if (fruitOptions.length > 0) {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_menu${menuIndex}`)
                    .setPlaceholder(`Fruits ${startIndex + 1}-${endIndex} (Selected: ${selectedCount}/5)`)
                    .setMinValues(0)
                    .setMaxValues(Math.min(5, fruitOptions.length))
                    .addOptions(fruitOptions);

                const row = new ActionRowBuilder().addComponents(selectMenu);
                components.push(row);
            }
        }

        // Add confirm button
        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_fruit_selection_${battleData.id}_${player.userId}`)
                    .setLabel(selectedCount === 5 ? '⚔️ Confirm & Start Battle!' : `✅ Confirm Selection (${selectedCount}/5)`)
                    .setStyle(selectedCount === 5 ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(selectedCount !== 5),
                new ButtonBuilder()
                    .setCustomId(`clear_fruit_selection_${battleData.id}_${player.userId}`)
                    .setLabel('🗑️ Clear Selection')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(selectedCount === 0)
            );
        components.push(confirmRow);

        return components;
    }

    // Reveal boss and start battle
    async revealBossAndStartBattle(interaction, battleData) {
        const { npcBoss, player1 } = battleData;
        
        const bossEmbed = new EmbedBuilder()
            .setColor(getRarityColor('mythical'))
            .setTitle(`${npcBoss.emoji} BOSS REVEALED!`)
            .setDescription(`**${npcBoss.title}**\n*${npcBoss.description}*`)
            .addFields([
                {
                    name: '🏴‍☠️ Your Battle Lineup',
                    value: player1.selectedFruits.map((fruit, i) => 
                        `${i + 1}. ${getRarityEmoji(fruit.fruit_rarity)} ${fruit.fruit_name}`
                    ).join('\n'),
                    inline: true
                },
                {
                    name: `${npcBoss.emoji} Boss Stats`,
                    value: [
                        `**Name**: ${npcBoss.name}`,
                        `**Level**: ${npcBoss.level}`,
                        `**CP**: ${npcBoss.totalCP.toLocaleString()}`,
                        `**Difficulty**: ${npcBoss.difficulty}`,
                        `**HP**: ${battleData.player2.maxHealth}`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Battle starting in 3 seconds...' })
            .setTimestamp();

        const startButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`start_battle_${battleData.id}`)
                    .setLabel('⚔️ Start Battle!')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.update({
            embeds: [bossEmbed],
            components: [startButton]
        });

        // Auto-start after 3 seconds
        setTimeout(async () => {
            try {
                await this.startTurnBasedBattle(interaction, battleData);
            } catch (error) {
                console.error('Error auto-starting battle:', error);
            }
        }, 3000);
    }

    // Get active battle for user
    getUserActiveBattle(userId) {
        for (const [battleId, battleData] of this.activeBattles) {
            if (battleData.player1.userId === userId || battleData.player2.userId === userId) {
                return { battleId, battleData };
            }
        }
        return null;
    }

    // Clean up old battles
    cleanupOldBattles() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        for (const [battleId, battleData] of this.activeBattles) {
            if (now - battleData.created > maxAge) {
                this.activeBattles.delete(battleId);
                console.log(`🧹 Cleaned up old battle: ${battleId}`);
            }
        }
    }

    // ... (rest of the methods remain the same - battle interface, attack processing, etc.)
}

// UPDATED interaction handler for multi-menu support
class PvPInteractionHandler {
    static async handleInteraction(interaction) {
        const customId = interaction.customId;
        const pvpSystem = module.exports;

        try {
            // Handle fruit selection (multi-menu support)
            if (customId.startsWith('fruit_selection_')) {
                const parts = customId.split('_');
                const battleId = parts[2];
                const userId = parts[3];
                const menuIndex = parts[4] ? parseInt(parts[4].replace('menu', '')) : 0;
                
                await pvpSystem.handleFruitSelection(interaction, battleId, userId, menuIndex);
                return true;
            }

            // Handle confirm fruit selection
            if (customId.startsWith('confirm_fruit_selection_')) {
                const parts = customId.split('_');
                const battleId = parts[3];
                const userId = parts[4];
                
                await pvpSystem.handleConfirmFruitSelection(interaction, battleId, userId);
                return true;
            }

            // Handle clear fruit selection
            if (customId.startsWith('clear_fruit_selection_')) {
                const parts = customId.split('_');
                const battleId = parts[3];
                const userId = parts[4];
                
                await this.handleClearFruitSelection(interaction, battleId, userId, pvpSystem);
                return true;
            }

            // Handle skill usage
            if (customId.startsWith('use_skill_')) {
                const parts = customId.split('_');
                const battleId = parts[2];
                const userId = parts[3];
                const skillIndex = parseInt(parts[4]);
                
                await pvpSystem.handleSkillUsage(interaction, battleId, userId, skillIndex);
                return true;
            }

            // Handle battle start
            if (customId.startsWith('start_battle_')) {
                const battleId = customId.replace('start_battle_', '');
                const battleData = pvpSystem.activeBattles.get(battleId);
                
                if (battleData) {
                    await pvpSystem.startTurnBasedBattle(interaction, battleData);
                }
                return true;
            }

            return false;

        } catch (error) {
            console.error('Error handling PvP interaction:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred during the battle.',
                    ephemeral: true
                });
            }
            return true;
        }
    }

    // Handle clear fruit selection
    static async handleClearFruitSelection(interaction, battleId, userId, pvpSystem) {
        const battleData = pvpSystem.activeBattles.get(battleId);
        if (!battleData) return;

        const player = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        if (!player) return;

        // Clear temporary selection
        player.tempSelectedFruits = [];

        // Create updated embed and components
        const embed = pvpSystem.createSelectionProgressEmbed(battleData, player);
        const components = await pvpSystem.createUpdatedSelectionComponents(battleData, player);

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }
}

// Create and export the singleton instance
const enhancedTurnBasedPvP = new EnhancedTurnBasedPvP();

// Set up cleanup interval
setInterval(() => {
    enhancedTurnBasedPvP.cleanupOldBattles();
}, 5 * 60 * 1000); // Clean up every 5 minutes

module.exports = enhancedTurnBasedPvP;
module.exports.PvPInteractionHandler = PvPInteractionHandler;
