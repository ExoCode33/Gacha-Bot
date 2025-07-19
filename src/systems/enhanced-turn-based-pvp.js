// src/systems/enhanced-turn-based-pvp.js - FIXED with High/Low Rarity Dropdown Selection
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
        this.activeBattles = new Map();
        this.playerSelections = new Map();
        this.battleQueue = new Set();
        this.battleCooldowns = new Map();
        
        // Define rarity groups for 2-dropdown system
        this.rarityGroups = {
            high: ['divine', 'omnipotent', 'mythical', 'legendary', 'epic'],
            low: ['rare', 'uncommon', 'common']
        };
        
        console.log('⚔️ Enhanced Turn-Based PvP System initialized with High/Low Rarity Selection');
    }

    // Start a battle (from queue or challenge)
    async startBattle(interaction, player1Fighter, player2Fighter = null) {
        const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
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
                currentPlayer: Math.random() < 0.5 ? 'player1' : 'player2',
                battleLog: [],
                turnTimeout: null,
                created: Date.now(),
                status: 'fruit_selection'
            };

            this.activeBattles.set(battleId, battleData);
            await this.startFruitSelection(interaction, battleData);
            
            return battleId;

        } catch (error) {
            console.error('Error starting battle:', error);
            if (this.activeBattles.has(battleId)) {
                this.activeBattles.delete(battleId);
            }
            throw error;
        }
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
            maxHealth: Math.floor(npcBoss.totalCP * 0.8),
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
        try {
            const { getFruitByName } = require('../data/devil-fruits');
            const fruit = getFruitByName(fruitName);
            return fruit?.rarity || 'common';
        } catch (error) {
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
        const { player1, isVsNPC } = battleData;

        if (isVsNPC) {
            await this.showFruitSelectionForPlayer(interaction, battleData, player1);
        } else {
            await this.showFruitSelectionForPlayer(interaction, battleData, player1);
        }
    }

    // FIXED: Show fruit selection with High/Low rarity dropdowns
    async showFruitSelectionForPlayer(interaction, battleData, player) {
        const { isVsNPC, npcBoss } = battleData;
        
        try {
            // Group fruits by name and count duplicates
            const fruitGroups = new Map();
            player.fruits.forEach(fruit => {
                const fruitName = fruit.fruit_name;
                if (fruitGroups.has(fruitName)) {
                    fruitGroups.get(fruitName).count++;
                } else {
                    fruitGroups.set(fruitName, {
                        ...fruit,
                        count: 1
                    });
                }
            });

            // Convert to array and organize by High/Low rarity groups
            const uniqueFruits = Array.from(fruitGroups.values());
            
            // Organize fruits into High and Low rarity groups
            const fruitsByGroup = {
                high: [],
                low: []
            };

            uniqueFruits.forEach(fruit => {
                const rarity = fruit.fruit_rarity;
                if (this.rarityGroups.high.includes(rarity)) {
                    fruitsByGroup.high.push(fruit);
                } else if (this.rarityGroups.low.includes(rarity)) {
                    fruitsByGroup.low.push(fruit);
                }
            });

            // Sort fruits within each group by rarity then name
            const rarityOrder = ['divine', 'omnipotent', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
            ['high', 'low'].forEach(group => {
                fruitsByGroup[group].sort((a, b) => {
                    const rarityDiff = rarityOrder.indexOf(a.fruit_rarity) - rarityOrder.indexOf(b.fruit_rarity);
                    if (rarityDiff !== 0) return rarityDiff;
                    return a.fruit_name.localeCompare(b.fruit_name);
                });
            });

            // Check if player has enough unique fruits
            if (uniqueFruits.length < 5) {
                const errorMessage = {
                    content: `❌ You need at least 5 **unique** Devil Fruits to participate in enhanced turn-based battles!\nYou currently have ${uniqueFruits.length} unique fruits. Use \`/pull\` to get more fruits.`,
                    ephemeral: true
                };

                if (interaction.deferred) {
                    return await interaction.editReply(errorMessage);
                } else {
                    return await interaction.reply(errorMessage);
                }
            }

            // Create rarity group summary
            const groupSummary = [
                `🔥 **High Rarity**: ${fruitsByGroup.high.length} unique (${this.rarityGroups.high.map(r => getRarityEmoji(r)).join('')} Divine, Omnipotent, Mythical, Legendary, Epic)`,
                `⚡ **Low Rarity**: ${fruitsByGroup.low.length} unique (${this.rarityGroups.low.map(r => getRarityEmoji(r)).join('')} Rare, Uncommon, Common)`
            ].join('\n');

            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('⚔️ Enhanced Turn-Based PvP - High/Low Rarity Selection')
                .setDescription(
                    isVsNPC 
                        ? `🔥 **Prepare for epic turn-based battle!**\n\n**Select 5 unique Devil Fruits using the organized dropdowns:**`
                        : `🔥 **Enhanced PvP Battle Starting!**\n\nSelect 5 unique Devil Fruits for turn-based combat using organized dropdowns.`
                )
                .addFields([
                    {
                        name: '🏴‍☠️ Your Battle Stats',
                        value: [
                            `**Name**: ${player.username}`,
                            `**Level**: ${player.level}`,
                            `**Balanced CP**: ${player.balancedCP.toLocaleString()}`,
                            `**Battle HP**: ${player.maxHealth}`,
                            `**Unique Fruits**: ${uniqueFruits.length}`,
                            `**Total Fruits**: ${player.fruits.length}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '⚡ Enhanced Battle Features',
                        value: [
                            `**Battle Type**: ${isVsNPC ? 'PvE Turn-Based' : 'PvP Turn-Based'}`,
                            `**Real-Time Combat**: Yes`,
                            `**Skill Selection**: Interactive`,
                            `**Battle Log**: Live updates`,
                            `**HP Visualization**: Real-time bars`,
                            `**Status Effects**: Advanced system`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🍈 Your Devil Fruits - Organized Selection',
                        value: groupSummary,
                        inline: false
                    },
                    {
                        name: '💡 Selection Instructions',
                        value: [
                            `🔥 **High Rarity Dropdown**: Select from your strongest fruits`,
                            `⚡ **Low Rarity Dropdown**: Select from your starter/common fruits`,
                            `✅ **Select exactly 5 unique fruits total** across both dropdowns`,
                            `🎯 **Duplicates shown**: (x2), (x3) = damage bonus in battle!`
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setFooter({ text: `High/Low rarity system - no character limits! Select 5 unique fruits total.` })
                .setTimestamp();

            // Create High/Low rarity dropdown menus
            const components = [];

            // High Rarity Dropdown (Divine, Omnipotent, Mythical, Legendary, Epic)
            if (fruitsByGroup.high.length > 0) {
                const highRarityOptions = fruitsByGroup.high.slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const cooldown = ability ? ability.cooldown : 0;
                    const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    const emoji = getRarityEmoji(fruit.fruit_rarity);
                    
                    return {
                        label: `${fruit.fruit_name.length > 20 ? fruit.fruit_name.slice(0, 17) + '...' : fruit.fruit_name}${duplicateText}`,
                        description: `${damage}dmg ${cooldown}cd • ${ability?.name || 'Unknown Ability'}`,
                        value: `high_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}`,
                        emoji: emoji
                    };
                });

                const highRarityMenu = new StringSelectMenuBuilder()
                    .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_high_rarity`)
                    .setPlaceholder(`🔥 High Rarity Fruits (${fruitsByGroup.high.length} available) - Select 0-5`)
                    .setMinValues(0)
                    .setMaxValues(Math.min(5, highRarityOptions.length))
                    .addOptions(highRarityOptions);

                const highRow = new ActionRowBuilder().addComponents(highRarityMenu);
                components.push(highRow);
            }

            // Low Rarity Dropdown (Rare, Uncommon, Common)
            if (fruitsByGroup.low.length > 0) {
                const lowRarityOptions = fruitsByGroup.low.slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const cooldown = ability ? ability.cooldown : 0;
                    const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    const emoji = getRarityEmoji(fruit.fruit_rarity);
                    
                    return {
                        label: `${fruit.fruit_name.length > 20 ? fruit.fruit_name.slice(0, 17) + '...' : fruit.fruit_name}${duplicateText}`,
                        description: `${damage}dmg ${cooldown}cd • ${ability?.name || 'Unknown Ability'}`,
                        value: `low_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}`,
                        emoji: emoji
                    };
                });

                const lowRarityMenu = new StringSelectMenuBuilder()
                    .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_low_rarity`)
                    .setPlaceholder(`⚡ Low Rarity Fruits (${fruitsByGroup.low.length} available) - Select 0-5`)
                    .setMinValues(0)
                    .setMaxValues(Math.min(5, lowRarityOptions.length))
                    .addOptions(lowRarityOptions);

                const lowRow = new ActionRowBuilder().addComponents(lowRarityMenu);
                components.push(lowRow);
            }

            // Add confirm and clear buttons
            if (components.length > 0) {
                const confirmRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`confirm_fruit_selection_${battleData.id}_${player.userId}`)
                            .setLabel('⚔️ Confirm Selection (Select exactly 5 unique fruits)')
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(`clear_fruit_selection_${battleData.id}_${player.userId}`)
                            .setLabel('🗑️ Clear All')
                            .setStyle(ButtonStyle.Danger)
                    );
                components.push(confirmRow);
            }

            // Send or edit reply based on interaction state
            if (interaction.deferred) {
                await interaction.editReply({
                    embeds: [embed],
                    components: components
                });
            } else if (interaction.replied) {
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

        } catch (error) {
            console.error('Error in showFruitSelectionForPlayer:', error);
            
            try {
                const errorMessage = {
                    content: '❌ An error occurred while setting up High/Low rarity fruit selection. Please try again.',
                    embeds: [],
                    components: []
                };

                if (interaction.deferred) {
                    await interaction.editReply(errorMessage);
                } else if (!interaction.replied) {
                    await interaction.reply({ ...errorMessage, ephemeral: true });
                } else {
                    await interaction.followUp({ ...errorMessage, ephemeral: true });
                }
            } catch (sendError) {
                console.error('Failed to send error message:', sendError);
            }
        }
    }

    // FIXED: Handle High/Low rarity fruit selection
    async handleFruitSelection(interaction, battleId, userId, rarityGroup) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await interaction.reply({ 
                    content: '❌ Battle not found! It may have expired.', 
                    ephemeral: true 
                });
            }

            const player = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
            if (!player) {
                return await interaction.reply({ 
                    content: '❌ Player not found in this battle!', 
                    ephemeral: true 
                });
            }

            // Group fruits by name and organize by High/Low rarity groups
            const fruitGroups = new Map();
            player.fruits.forEach(fruit => {
                const fruitName = fruit.fruit_name;
                if (!fruitGroups.has(fruitName)) {
                    fruitGroups.set(fruitName, { ...fruit, count: 1 });
                } else {
                    fruitGroups.get(fruitName).count++;
                }
            });

            const fruitsByGroup = {
                high: [],
                low: []
            };

            Array.from(fruitGroups.values()).forEach(fruit => {
                const rarity = fruit.fruit_rarity;
                if (this.rarityGroups.high.includes(rarity)) {
                    fruitsByGroup.high.push(fruit);
                } else if (this.rarityGroups.low.includes(rarity)) {
                    fruitsByGroup.low.push(fruit);
                }
            });

            // Initialize player selection if not exists
            if (!player.tempSelectedFruits) {
                player.tempSelectedFruits = [];
            }

            // Get selected fruits from this rarity group
            const selectedValues = interaction.values || [];
            const groupFruits = fruitsByGroup[rarityGroup] || [];
            
            // Remove previous selections from this rarity group
            player.tempSelectedFruits = player.tempSelectedFruits.filter(fruit => {
                const fruitRarity = fruit.fruit_rarity;
                const isFromCurrentGroup = (rarityGroup === 'high' && this.rarityGroups.high.includes(fruitRarity)) ||
                                          (rarityGroup === 'low' && this.rarityGroups.low.includes(fruitRarity));
                return !isFromCurrentGroup;
            });

            // Add new selections from this rarity group
            selectedValues.forEach(value => {
                const parts = value.split('_');
                const fruitIndex = parseInt(parts[1]);
                const selectedFruit = groupFruits[fruitIndex];
                
                if (selectedFruit && player.tempSelectedFruits.length < 5) {
                    // Check if not already selected from another group
                    const exists = player.tempSelectedFruits.find(f => f.fruit_name === selectedFruit.fruit_name);
                    if (!exists) {
                        player.tempSelectedFruits.push(selectedFruit);
                    }
                }
            });

            // Ensure max 5 fruits
            if (player.tempSelectedFruits.length > 5) {
                player.tempSelectedFruits = player.tempSelectedFruits.slice(0, 5);
            }

            // Create updated embed and components
            const embed = this.createHighLowSelectionProgressEmbed(battleData, player);
            const components = await this.createUpdatedHighLowSelectionComponents(battleData, player);

            await interaction.update({
                embeds: [embed],
                components: components
            });

        } catch (error) {
            console.error('Error updating High/Low rarity fruit selection:', error);
            
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ An error occurred while updating your High/Low selection. Please try again.',
                        ephemeral: true
                    });
                }
            } catch (followUpError) {
                console.error('Failed to send fallback error message:', followUpError);
            }
        }
    }

    // Create High/Low selection progress embed
    createHighLowSelectionProgressEmbed(battleData, player) {
        const selectedCount = player.tempSelectedFruits?.length || 0;
        const { isVsNPC } = battleData;

        const embed = new EmbedBuilder()
            .setColor(selectedCount === 5 ? 0x00FF00 : 0x3498DB)
            .setTitle('⚔️ Enhanced Turn-Based PvP - High/Low Selection Progress')
            .setDescription(
                `**Selection Progress: ${selectedCount}/5 unique fruits selected**\n\n` +
                (selectedCount === 5 ? '✅ **Ready for enhanced turn-based battle! Click Confirm to proceed.**' : 
                `🔄 **Select ${5 - selectedCount} more unique fruits from the High/Low dropdowns.**`)
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
                    name: '⚡ High/Low Selection',
                    value: [
                        `**High Rarity Dropdown**: ${this.rarityGroups.high.map(r => getRarityEmoji(r)).join('')}`,
                        `**Low Rarity Dropdown**: ${this.rarityGroups.low.map(r => getRarityEmoji(r)).join('')}`,
                        `**No Character Limits**: ✅`,
                        `**Duplicate Bonuses Shown**: ✅`
                    ].join('\n'),
                    inline: true
                }
            ]);

        // Show selected fruits organized by High/Low groups
        if (selectedCount > 0) {
            const selectedByGroup = {
                high: [],
                low: []
            };

            player.tempSelectedFruits.forEach(fruit => {
                const rarity = fruit.fruit_rarity;
                if (this.rarityGroups.high.includes(rarity)) {
                    selectedByGroup.high.push(fruit);
                } else if (this.rarityGroups.low.includes(rarity)) {
                    selectedByGroup.low.push(fruit);
                }
            });

            let selectedText = '';
            
            if (selectedByGroup.high.length > 0) {
                selectedText += `🔥 **High Rarity** (${selectedByGroup.high.length}):\n`;
                selectedByGroup.high.forEach(fruit => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const duplicateCount = player.fruits.filter(f => f.fruit_name === fruit.fruit_name).length;
                    const duplicateText = duplicateCount > 1 ? ` (x${duplicateCount})` : '';
                    
                    selectedText += `  ${getRarityEmoji(fruit.fruit_rarity)} ${fruit.fruit_name}${duplicateText} (${damage} dmg)\n`;
                });
                selectedText += '\n';
            }

            if (selectedByGroup.low.length > 0) {
                selectedText += `⚡ **Low Rarity** (${selectedByGroup.low.length}):\n`;
                selectedByGroup.low.forEach(fruit => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const duplicateCount = player.fruits.filter(f => f.fruit_name === fruit.fruit_name).length;
                    const duplicateText = duplicateCount > 1 ? ` (x${duplicateCount})` : '';
                    
                    selectedText += `  ${getRarityEmoji(fruit.fruit_rarity)} ${fruit.fruit_name}${duplicateText} (${damage} dmg)\n`;
                });
            }

            embed.addFields({
                name: '✅ Currently Selected Fruits',
                value: selectedText.trim() || 'No fruits selected',
                inline: false
            });
        }

        return embed;
    }

    // Create updated High/Low selection components
    async createUpdatedHighLowSelectionComponents(battleData, player) {
        const components = [];
        const selectedCount = player.tempSelectedFruits?.length || 0;
        const selectedNames = new Set(player.tempSelectedFruits?.map(f => f.fruit_name) || []);

        // Group fruits by High/Low rarity
        const fruitGroups = new Map();
        player.fruits.forEach(fruit => {
            const fruitName = fruit.fruit_name;
            if (!fruitGroups.has(fruitName)) {
                fruitGroups.set(fruitName, { ...fruit, count: 1 });
            } else {
                fruitGroups.get(fruitName).count++;
            }
        });

        const fruitsByGroup = {
            high: [],
            low: []
        };

        Array.from(fruitGroups.values()).forEach(fruit => {
            const rarity = fruit.fruit_rarity;
            if (this.rarityGroups.high.includes(rarity)) {
                fruitsByGroup.high.push(fruit);
            } else if (this.rarityGroups.low.includes(rarity)) {
                fruitsByGroup.low.push(fruit);
            }
        });

        // Sort fruits within each group
        const rarityOrder = ['divine', 'omnipotent', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
        ['high', 'low'].forEach(group => {
            fruitsByGroup[group].sort((a, b) => {
                const rarityDiff = rarityOrder.indexOf(a.fruit_rarity) - rarityOrder.indexOf(b.fruit_rarity);
                if (rarityDiff !== 0) return rarityDiff;
                return a.fruit_name.localeCompare(b.fruit_name);
            });
        });

        // High Rarity Dropdown
        if (fruitsByGroup.high.length > 0) {
            const highRarityOptions = fruitsByGroup.high.slice(0, 25).map((fruit, index) => {
                const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                const damage = ability ? ability.damage : 100;
                const cooldown = ability ? ability.cooldown : 0;
                const isSelected = selectedNames.has(fruit.fruit_name);
                const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                const emoji = getRarityEmoji(fruit.fruit_rarity);
                
                return {
                    label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.length > 17 ? fruit.fruit_name.slice(0, 14) + '...' : fruit.fruit_name}${duplicateText}`,
                    description: `${damage}dmg ${cooldown}cd • ${ability?.name || 'Unknown'}`,
                    value: `high_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}`,
                    emoji: emoji,
                    default: isSelected
                };
            });

            const highRarityMenu = new StringSelectMenuBuilder()
                .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_high_rarity`)
                .setPlaceholder(`🔥 High Rarity (${selectedCount}/5 total selected)`)
                .setMinValues(0)
                .setMaxValues(Math.min(5, highRarityOptions.length))
                .addOptions(highRarityOptions);

            const highRow = new ActionRowBuilder().addComponents(highRarityMenu);
            components.push(highRow);
        }

        // Low Rarity Dropdown
        if (fruitsByGroup.low.length > 0) {
            const lowRarityOptions = fruitsByGroup.low.slice(0, 25).map((fruit, index) => {
                const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                const damage = ability ? ability.damage : 100;
                const cooldown = ability ? ability.cooldown : 0;
                const isSelected = selectedNames.has(fruit.fruit_name);
                const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                const emoji = getRarityEmoji(fruit.fruit_rarity);
                
                return {
                    label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.length > 17 ? fruit.fruit_name.slice(0, 14) + '...' : fruit.fruit_name}${duplicateText}`,
                    description: `${damage}dmg ${cooldown}cd • ${ability?.name || 'Unknown'}`,
                    value: `low_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}`,
                    emoji: emoji,
                    default: isSelected
                };
            });

            const lowRarityMenu = new StringSelectMenuBuilder()
                .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_low_rarity`)
                .setPlaceholder(`⚡ Low Rarity (${selectedCount}/5 total selected)`)
                .setMinValues(0)
                .setMaxValues(Math.min(5, lowRarityOptions.length))
                .addOptions(lowRarityOptions);

            const lowRow = new ActionRowBuilder().addComponents(lowRarityMenu);
            components.push(lowRow);
        }

        // Add confirm and clear buttons
        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_fruit_selection_${battleData.id}_${player.userId}`)
                    .setLabel(selectedCount === 5 ? '⚔️ Start Enhanced Battle!' : `✅ Confirm (${selectedCount}/5)`)
                    .setStyle(selectedCount === 5 ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(selectedCount !== 5),
                new ButtonBuilder()
                    .setCustomId(`clear_fruit_selection_${battleData.id}_${player.userId}`)
                    .setLabel('🗑️ Clear All')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(selectedCount === 0)
            );
        components.push(confirmRow);

        return components;
    }

    // FIXED: Handle confirm fruit selection (same as before)
    async handleConfirmFruitSelection(interaction, battleId, userId) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await interaction.reply({ 
                    content: '❌ Battle not found! It may have expired.', 
                    ephemeral: true 
                });
            }

            const player = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
            if (!player || !player.tempSelectedFruits || player.tempSelectedFruits.length !== 5) {
                return await interaction.reply({ 
                    content: `❌ You must select exactly 5 unique fruits! Currently selected: ${player.tempSelectedFruits?.length || 0}`,
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
                if (battleData.isVsNPC) {
                    await this.revealBossAndStartBattle(interaction, battleData);
                } else {
                    await this.startTurnBasedBattle(interaction, battleData);
                }
            } else {
                await interaction.update({
                    content: '✅ Fruits selected using High/Low system! Waiting for opponent...',
                    embeds: [],
                    components: []
                });
            }

        } catch (error) {
            console.error('Error confirming fruit selection:', error);
            
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ An error occurred while confirming your High/Low selection. Please try again.',
                        ephemeral: true
                    });
                }
            } catch (followUpError) {
                console.error('Failed to send confirmation error message:', followUpError);
            }
        }
    }

    // Reveal boss and start battle
    async revealBossAndStartBattle(interaction, battleData) {
        const { npcBoss, player1 } = battleData;
        
        const bossEmbed = new EmbedBuilder()
            .setColor(getRarityColor('mythical'))
            .setTitle(`${npcBoss.emoji} ENHANCED TURN-BASED BOSS REVEALED!`)
            .setDescription(`**${npcBoss.title}**\n*${npcBoss.description}*\n\n🔥 **Enhanced real-time turn-based combat begins!**`)
            .addFields([
                {
                    name: '🏴‍☠️ Your Battle Lineup (High/Low Selected)',
                    value: player1.selectedFruits.map((fruit, i) => {
                        const duplicateCount = player1.fruits.filter(f => f.fruit_name === fruit.fruit_name).length;
                        const duplicateText = duplicateCount > 1 ? ` (x${duplicateCount})` : '';
                        const rarityGroup = this.rarityGroups.high.includes(fruit.fruit_rarity) ? '🔥' : '⚡';
                        return `${i + 1}. ${rarityGroup} ${getRarityEmoji(fruit.fruit_rarity)} ${fruit.fruit_name}${duplicateText}`;
                    }).join('\n'),
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
            .setFooter({ text: 'High/Low rarity selection complete - enhanced battle starting in 3 seconds...' })
            .setTimestamp();

        const startButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`start_battle_${battleData.id}`)
                    .setLabel('⚔️ Start Enhanced Turn-Based Battle!')
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

    // Start the actual turn-based battle
    async startTurnBasedBattle(interaction, battleData) {
        battleData.status = 'battle';
        battleData.battleLog.push({
            type: 'battle_start',
            message: `⚔️ **ENHANCED TURN-BASED BATTLE BEGINS!** ⚔️`,
            timestamp: Date.now()
        });

        const firstPlayer = Math.random() < 0.5 ? 'player1' : 'player2';
        battleData.currentPlayer = firstPlayer;
        
        const firstPlayerName = battleData[firstPlayer].username;
        battleData.battleLog.push({
            type: 'first_turn',
            message: `🎲 ${firstPlayerName} wins initiative and goes first!`,
            timestamp: Date.now()
        });

        await this.showBattleInterface(interaction, battleData);
    }

    // Show main battle interface
    async showBattleInterface(interaction, battleData) {
        const { player1, player2, currentTurn, currentPlayer } = battleData;
        
        const p1HPPercent = (player1.hp / player1.maxHealth) * 100;
        const p2HPPercent = (player2.hp / player2.maxHealth) * 100;
        
        const p1HPBar = this.createHPBar(p1HPPercent);
        const p2HPBar = this.createHPBar(p2HPPercent);

        const currentPlayerData = battleData[currentPlayer];
        const isCurrentPlayerTurn = !battleData.isVsNPC || currentPlayer === 'player1';

        const embed = new EmbedBuilder()
            .setColor(currentPlayer === 'player1' ? 0x3498DB : 0xE74C3C)
            .setTitle(`⚔️ Enhanced Turn-Based Battle - Turn ${currentTurn}`)
            .setDescription(`🔥 **${currentPlayerData.username}'s Turn** - Choose your Devil Fruit ability!\n*High/Low rarity system enabled*`)
            .addFields([
                {
                    name: `🏴‍☠️ ${player1.username}`,
                    value: [
                        `${p1HPBar}`,
                        `**HP**: ${player1.hp}/${player1.maxHealth} (${p1HPPercent.toFixed(1)}%)`,
                        `**CP**: ${player1.balancedCP.toLocaleString()}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: `${player2.isNPC ? player2.npcData.emoji : '🏴‍☠️'} ${player2.username}`,
                    value: [
                        `${p2HPBar}`,
                        `**HP**: ${player2.hp}/${player2.maxHealth} (${p2HPPercent.toFixed(1)}%)`,
                        `**CP**: ${player2.balancedCP.toLocaleString()}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📜 Live Battle Log',
                    value: this.getRecentBattleLog(battleData.battleLog),
                    inline: false
                }
            ])
            .setFooter({ 
                text: isCurrentPlayerTurn ? 'Select your Devil Fruit ability from your High/Low selection!' : 'Waiting for opponent...' 
            })
            .setTimestamp();

        let components = [];
        if (isCurrentPlayerTurn) {
            components = await this.createSkillSelectionComponents(battleData, currentPlayerData);
        }

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embed], components });
            } else {
                await interaction.reply({ embeds: [embed], components });
            }
        } catch (error) {
            console.error('Error showing battle interface:', error);
        }

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

    // Create skill selection components with High/Low indicators
    async createSkillSelectionComponents(battleData, playerData) {
        const components = [];
        
        const skillButtons = playerData.selectedFruits.slice(0, 5).map((fruit, index) => {
            const ability = balancedDevilFruitAbilities[fruit.fruit_name] || {
                name: 'Unknown Skill',
                damage: 100,
                cooldown: 0
            };
            const emoji = getRarityEmoji(fruit.fruit_rarity);
            const duplicateCount = playerData.fruits.filter(f => f.fruit_name === fruit.fruit_name).length;
            const duplicateText = duplicateCount > 1 ? ` x${duplicateCount}` : '';
            const rarityIndicator = this.rarityGroups.high.includes(fruit.fruit_rarity) ? '🔥' : '⚡';
            
            return new ButtonBuilder()
                .setCustomId(`use_skill_${battleData.id}_${playerData.userId}_${index}`)
                .setLabel(`${rarityIndicator}${fruit.fruit_name.slice(0, 10)}${duplicateText}`)
                .setEmoji(emoji)
                .setStyle(ButtonStyle.Primary);
        });

        for (let i = 0; i < skillButtons.length; i += 5) {
            const row = new ActionRowBuilder()
                .addComponents(skillButtons.slice(i, i + 5));
            components.push(row);
        }

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
        const battleData = this.activeBattles.get(battleId);
        if (!battleData || battleData.status !== 'battle') {
            return interaction.reply({ content: '❌ Battle not found or not active!', ephemeral: true });
        }

        const currentPlayerData = battleData[battleData.currentPlayer];
        if (currentPlayerData.userId !== userId) {
            return interaction.reply({ content: '❌ It\'s not your turn!', ephemeral: true });
        }

        const selectedFruit = currentPlayerData.selectedFruits[skillIndex];
        const ability = balancedDevilFruitAbilities[selectedFruit.fruit_name] || {
            name: 'Basic Attack',
            damage: 100,
            cooldown: 0,
            effect: null,
            accuracy: 85
        };
        
        await this.processAttack(interaction, battleData, currentPlayerData, ability, selectedFruit);
    }

    // Process an attack with High/Low rarity bonus display
    async processAttack(interaction, battleData, attacker, ability, fruit) {
        const defender = battleData.currentPlayer === 'player1' ? battleData.player2 : battleData.player1;
        
        const baseDamage = ability.damage || 100;
        const accuracy = ability.accuracy || 85;
        const hit = Math.random() * 100 <= accuracy;
        
        let damage = 0;
        if (hit) {
            const cpRatio = Math.min(attacker.balancedCP / defender.balancedCP, 1.5);
            const turnMultiplier = battleData.currentTurn === 1 ? 0.5 : 
                                 battleData.currentTurn === 2 ? 0.7 : 1.0;
            
            const duplicateCount = attacker.fruits.filter(f => f.fruit_name === fruit.fruit_name).length;
            const duplicateBonus = 1 + ((duplicateCount - 1) * 0.01);
            
            damage = Math.floor(baseDamage * cpRatio * turnMultiplier * duplicateBonus);
            damage = Math.max(5, damage);
            
            defender.hp = Math.max(0, defender.hp - damage);
        }

        const duplicateCount = attacker.fruits.filter(f => f.fruit_name === fruit.fruit_name).length;
        const duplicateText = duplicateCount > 1 ? ` (x${duplicateCount})` : '';
        const rarityIndicator = this.rarityGroups.high.includes(fruit.fruit_rarity) ? '🔥 High' : '⚡ Low';
        
        let attackMessage = '';
        if (hit) {
            attackMessage = `⚡ **${attacker.username}** uses **${ability.name}** with **${fruit.fruit_name}**${duplicateText} [${rarityIndicator}]!\n💥 Deals **${damage}** damage to **${defender.username}**!`;
            
            if (ability.effect) {
                defender.effects.push({
                    name: ability.effect,
                    duration: 2,
                    description: `Affected by ${ability.effect}`
                });
                attackMessage += ` ✨ **${ability.effect} applied!**`;
            }
        } else {
            attackMessage = `⚡ **${attacker.username}** uses **${ability.name}** with **${fruit.fruit_name}**${duplicateText} [${rarityIndicator}] but misses!`;
        }

        battleData.battleLog.push({
            type: 'attack',
            attacker: attacker.username,
            defender: defender.username,
            ability: ability.name,
            fruit: fruit.fruit_name,
            damage: damage,
            hit: hit,
            duplicateCount: duplicateCount,
            rarityGroup: this.rarityGroups.high.includes(fruit.fruit_rarity) ? 'high' : 'low',
            message: attackMessage,
            timestamp: Date.now(),
            turn: battleData.currentTurn
        });

        if (defender.hp <= 0) {
            await this.endBattle(interaction, battleData, attacker, defender);
            return;
        }

        battleData.currentPlayer = battleData.currentPlayer === 'player1' ? 'player2' : 'player1';
        battleData.currentTurn++;

        if (battleData.currentTurn > 15) {
            await this.endBattleByTimeout(interaction, battleData);
            return;
        }

        await this.showBattleInterface(interaction, battleData);
    }

    // Process NPC turn
    async processNPCTurn(interaction, battleData) {
        const npcPlayer = battleData.player2;
        const availableFruits = npcPlayer.selectedFruits;
        
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

    // End battle with winner
    async endBattle(interaction, battleData, winner, loser) {
        battleData.status = 'ended';
        
        const winnerEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🏆 ENHANCED TURN-BASED BATTLE COMPLETE!')
            .setDescription(`**${winner.username}** emerges victorious in this epic High/Low rarity turn-based battle!`)
            .addFields([
                {
                    name: '🎉 Victory!',
                    value: `**${winner.username}** defeats **${loser.username}**!\n\n**Final HP**: ${winner.hp}/${winner.maxHealth}\n**Turns**: ${battleData.currentTurn}\n**Selection Method**: High/Low Rarity System`,
                    inline: false
                }
            ])
            .setFooter({ text: 'High/Low rarity enhanced turn-based combat complete!' })
            .setTimestamp();

        if (battleData.isVsNPC && winner.userId === battleData.player1.userId) {
            const berryReward = this.calculateBerryReward(battleData.npcBoss.difficulty);
            try {
                await DatabaseManager.updateUserBerries(winner.userId, berryReward, 'Enhanced PvE Victory');
                
                winnerEmbed.addFields([{
                    name: '💰 Victory Rewards',
                    value: `+${berryReward.toLocaleString()} berries!`,
                    inline: true
                }]);
            } catch (error) {
                console.error('Error awarding berries:', error);
            }
        }

        await interaction.editReply({
            embeds: [winnerEmbed],
            components: []
        });

        this.activeBattles.delete(battleData.id);
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
            'Easy': 750,
            'Medium': 1500,
            'Hard': 3000,
            'Very Hard': 6000,
            'Legendary': 10000,
            'Mythical': 15000,
            'Divine': 25000
        };
        
        return rewards[difficulty] || 750;
    }

    // Get recent battle log
    getRecentBattleLog(battleLog) {
        const recent = battleLog.slice(-4);
        return recent.map(entry => entry.message).join('\n') || 'Enhanced High/Low rarity turn-based battle starting...';
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
        const maxAge = 30 * 60 * 1000;
        
        for (const [battleId, battleData] of this.activeBattles) {
            if (now - battleData.created > maxAge) {
                this.activeBattles.delete(battleId);
                console.log(`🧹 Cleaned up old enhanced High/Low battle: ${battleId}`);
            }
        }
    }
}

// Enhanced interaction handler for High/Low rarity selection
class PvPInteractionHandler {
    static async handleInteraction(interaction) {
        const customId = interaction.customId;
        const pvpSystem = module.exports;

        try {
            // Handle High/Low rarity fruit selection
            if (customId.includes('_high_rarity') || customId.includes('_low_rarity')) {
                const parts = customId.split('_');
                const battleId = parts[2];
                const userId = parts[3];
                const rarityGroup = customId.includes('_high_rarity') ? 'high' : 'low';
                
                await pvpSystem.handleFruitSelection(interaction, battleId, userId, rarityGroup);
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

            // Handle show skills
            if (customId.startsWith('show_skills_')) {
                const parts = customId.split('_');
                const battleId = parts[2];
                const userId = parts[3];
                
                await this.showSkillDetails(interaction, battleId, userId, pvpSystem);
                return true;
            }

            // Handle surrender
            if (customId.startsWith('surrender_')) {
                const parts = customId.split('_');
                const battleId = parts[1];
                const userId = parts[2];
                
                await this.handleSurrender(interaction, battleId, userId, pvpSystem);
                return true;
            }

            return false;

        } catch (error) {
            console.error('Error handling enhanced High/Low PvP interaction:', error);
            
            if (error.code === 10062) {
                console.warn('⚠️ Enhanced High/Low PvP interaction expired');
                return true;
            }
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred during the enhanced High/Low turn-based battle.',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('Failed to send enhanced High/Low PvP error reply:', replyError);
            }
            
            return true;
        }
    }

    // Show detailed skill information with High/Low indicators
    static async showSkillDetails(interaction, battleId, userId, pvpSystem) {
        const battleData = pvpSystem.activeBattles.get(battleId);
        if (!battleData) return;

        const playerData = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        
        const skillsEmbed = new EmbedBuilder()
            .setColor(0x9932CC)
            .setTitle('📋 Your Enhanced Battle Abilities (High/Low System)')
            .setDescription('Detailed information about your selected fruits organized by High/Low rarity groups')
            .setFooter({ text: 'High/Low rarity selection system shows all details!' });

        // Organize by High/Low groups
        const skillsByGroup = { high: [], low: [] };
        
        playerData.selectedFruits.forEach((fruit, index) => {
            const group = pvpSystem.rarityGroups.high.includes(fruit.fruit_rarity) ? 'high' : 'low';
            skillsByGroup[group].push({ fruit, index });
        });

        // Add High Rarity skills
        if (skillsByGroup.high.length > 0) {
            let highSkillsText = '';
            skillsByGroup.high.forEach(({ fruit, index }) => {
                const ability = balancedDevilFruitAbilities[fruit.fruit_name] || {
                    name: 'Unknown Ability',
                    damage: 100,
                    cooldown: 0,
                    effect: null,
                    description: 'A mysterious devil fruit power',
                    accuracy: 85
                };
                const emoji = getRarityEmoji(fruit.fruit_rarity);
                
                const duplicateCount = playerData.fruits.filter(f => f.fruit_name === fruit.fruit_name).length;
                const duplicateText = duplicateCount > 1 ? ` **(x${duplicateCount} = +${duplicateCount-1}% damage bonus)**` : '';
                
                let effectText = '';
                if (ability.effect && statusEffects[ability.effect]) {
                    const effect = statusEffects[ability.effect];
                    effectText = `\n🌟 **Effect**: ${effect.description}`;
                    if (effect.duration) effectText += ` (${effect.duration} turns)`;
                    if (effect.damage) effectText += ` - ${effect.damage} dmg`;
                }

                highSkillsText += `**${index + 1}. ${emoji} ${fruit.fruit_name}${duplicateText}**\n` +
                                 `⚔️ **${ability.name}** | 💥 ${ability.damage} dmg | ⏱️ ${ability.cooldown}cd | 🎯 ${ability.accuracy || 85}%\n` +
                                 `📝 ${ability.description}${effectText}\n\n`;
            });

            skillsEmbed.addFields({
                name: '🔥 High Rarity Abilities (Divine, Omnipotent, Mythical, Legendary, Epic)',
                value: highSkillsText.trim(),
                inline: false
            });
        }

        // Add Low Rarity skills
        if (skillsByGroup.low.length > 0) {
            let lowSkillsText = '';
            skillsByGroup.low.forEach(({ fruit, index }) => {
                const ability = balancedDevilFruitAbilities[fruit.fruit_name] || {
                    name: 'Unknown Ability',
                    damage: 100,
                    cooldown: 0,
                    effect: null,
                    description: 'A mysterious devil fruit power',
                    accuracy: 85
                };
                const emoji = getRarityEmoji(fruit.fruit_rarity);
                
                const duplicateCount = playerData.fruits.filter(f => f.fruit_name === fruit.fruit_name).length;
                const duplicateText = duplicateCount > 1 ? ` **(x${duplicateCount} = +${duplicateCount-1}% damage bonus)**` : '';
                
                let effectText = '';
                if (ability.effect && statusEffects[ability.effect]) {
                    const effect = statusEffects[ability.effect];
                    effectText = `\n🌟 **Effect**: ${effect.description}`;
                    if (effect.duration) effectText += ` (${effect.duration} turns)`;
                    if (effect.damage) effectText += ` - ${effect.damage} dmg`;
                }

                lowSkillsText += `**${index + 1}. ${emoji} ${fruit.fruit_name}${duplicateText}**\n` +
                                `⚔️ **${ability.name}** | 💥 ${ability.damage} dmg | ⏱️ ${ability.cooldown}cd | 🎯 ${ability.accuracy || 85}%\n` +
                                `📝 ${ability.description}${effectText}\n\n`;
            });

            skillsEmbed.addFields({
                name: '⚡ Low Rarity Abilities (Rare, Uncommon, Common)',
                value: lowSkillsText.trim(),
                inline: false
            });
        }

        await interaction.reply({
            embeds: [skillsEmbed],
            ephemeral: true
        });
    }

    // Handle clear fruit selection
    static async handleClearFruitSelection(interaction, battleId, userId, pvpSystem) {
        const battleData = pvpSystem.activeBattles.get(battleId);
        if (!battleData) return;

        const player = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        if (!player) return;

        player.tempSelectedFruits = [];

        const embed = pvpSystem.createHighLowSelectionProgressEmbed(battleData, player);
        const components = await pvpSystem.createUpdatedHighLowSelectionComponents(battleData, player);

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    // Handle surrender
    static async handleSurrender(interaction, battleId, userId, pvpSystem) {
        const battleData = pvpSystem.activeBattles.get(battleId);
        if (!battleData) return;

        const surrenderingPlayer = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        const winner = surrenderingPlayer === battleData.player1 ? battleData.player2 : battleData.player1;

        const surrenderEmbed = new EmbedBuilder()
            .setColor(0xFF4500)
            .setTitle('🏳️ Enhanced Turn-Based Battle Ended - Surrender')
            .setDescription(`**${surrenderingPlayer.username}** has surrendered the enhanced High/Low rarity turn-based battle!`)
            .addFields([
                {
                    name: '🏆 Winner',
                    value: `**${winner.username}** wins by surrender!`,
                    inline: true
                },
                {
                    name: '📊 Battle Stats',
                    value: [
                        `**Turns Played**: ${battleData.currentTurn}`,
                        `**Battle Type**: Enhanced ${battleData.isVsNPC ? 'PvE' : 'PvP'} Turn-Based`,
                        `**Selection Method**: High/Low Rarity System`,
                        `**System**: No Character Limits ✅`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Enhanced High/Low rarity system - strategic retreat!' })
            .setTimestamp();

        await interaction.update({
            embeds: [surrenderEmbed],
            components: []
        });

        pvpSystem.activeBattles.delete(battleId);
    }
}

// Create and export the enhanced singleton instance
const enhancedTurnBasedPvP = new EnhancedTurnBasedPvP();

// Set up cleanup interval
setInterval(() => {
    enhancedTurnBasedPvP.cleanupOldBattles();
}, 5 * 60 * 1000);

console.log('✅ Enhanced Turn-Based PvP System with High/Low Rarity Selection fully loaded!');
console.log('🔥 High Rarity: Divine, Omnipotent, Mythical, Legendary, Epic');
console.log('⚡ Low Rarity: Rare, Uncommon, Common');
console.log('📊 Benefits: No character limits, only 2 dropdowns, fits within Discord limits');

module.exports = enhancedTurnBasedPvP;
module.exports.PvPInteractionHandler = PvPInteractionHandler;
