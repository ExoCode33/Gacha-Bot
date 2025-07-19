// src/systems/enhanced-turn-based-pvp.js - FIXED with Rarity-Based Dropdown Selection
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
        
        console.log('⚔️ Enhanced Turn-Based PvP System initialized');
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

    // FIXED: Show fruit selection with rarity-based dropdowns
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

            // Convert to array and organize by rarity
            const uniqueFruits = Array.from(fruitGroups.values());
            
            // Organize fruits by rarity
            const fruitsByRarity = {
                divine: [],
                omnipotent: [],
                mythical: [],
                legendary: [],
                epic: [],
                rare: [],
                uncommon: [],
                common: []
            };

            uniqueFruits.forEach(fruit => {
                const rarity = fruit.fruit_rarity;
                if (fruitsByRarity[rarity]) {
                    fruitsByRarity[rarity].push(fruit);
                }
            });

            // Sort fruits within each rarity by name
            Object.keys(fruitsByRarity).forEach(rarity => {
                fruitsByRarity[rarity].sort((a, b) => a.fruit_name.localeCompare(b.fruit_name));
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

            // Create embed with rarity summary
            const rarityOverview = Object.entries(fruitsByRarity)
                .filter(([rarity, fruits]) => fruits.length > 0)
                .map(([rarity, fruits]) => {
                    const emoji = getRarityEmoji(rarity);
                    const totalCount = fruits.reduce((sum, fruit) => sum + fruit.count, 0);
                    return `${emoji} **${rarity.charAt(0).toUpperCase() + rarity.slice(1)}**: ${fruits.length} unique (${totalCount} total)`;
                }).join('\n');

            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('⚔️ Enhanced Turn-Based PvP - Rarity-Based Selection')
                .setDescription(
                    isVsNPC 
                        ? `🔥 **Prepare for an epic turn-based battle!**\n\n**Select 5 unique Devil Fruits from your collection:**`
                        : `🔥 **Enhanced PvP Battle Starting!**\n\nSelect 5 unique Devil Fruits for turn-based combat.`
                )
                .addFields([
                    {
                        name: '🏴‍☠️ Your Stats',
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
                        name: '🍈 Your Devil Fruits by Rarity',
                        value: rarityOverview || 'No fruits available',
                        inline: false
                    }
                ])
                .setFooter({ text: `Select your strongest 5 unique fruits! Use dropdowns organized by rarity.` })
                .setTimestamp();

            // Create rarity-based dropdown menus
            const components = [];
            const rarityOrder = ['divine', 'omnipotent', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

            let menuIndex = 0;
            for (const rarity of rarityOrder) {
                const fruits = fruitsByRarity[rarity];
                if (fruits.length === 0) continue; // Skip rarities the player doesn't have

                const rarityEmoji = getRarityEmoji(rarity);
                const rarityName = rarity.charAt(0).toUpperCase() + rarity.slice(1);

                // Create options for this rarity (max 25 per menu)
                const fruitOptions = fruits.slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const cooldown = ability ? ability.cooldown : 0;
                    const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    
                    return {
                        label: `${fruit.fruit_name.length > 20 ? fruit.fruit_name.slice(0, 17) + '...' : fruit.fruit_name}${duplicateText}`,
                        description: `${damage}dmg ${cooldown}cd • ${ability?.name || 'Unknown Ability'}`,
                        value: `fruit_${rarity}_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}`,
                        emoji: rarityEmoji
                    };
                });

                if (fruitOptions.length > 0) {
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_${rarity}_${menuIndex}`)
                        .setPlaceholder(`${rarityEmoji} Select from ${rarityName} fruits (${fruits.length} available)`)
                        .setMinValues(0)
                        .setMaxValues(Math.min(5, fruitOptions.length))
                        .addOptions(fruitOptions);

                    const row = new ActionRowBuilder().addComponents(selectMenu);
                    components.push(row);
                    menuIndex++;

                    // Discord limit: max 5 action rows
                    if (components.length >= 4) break;
                }
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
                    content: '❌ An error occurred while setting up rarity-based fruit selection. Please try again.',
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

    // FIXED: Handle rarity-based fruit selection
    async handleFruitSelection(interaction, battleId, userId, rarity, menuIndex = 0) {
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

            // Group fruits by name and organize by rarity
            const fruitGroups = new Map();
            player.fruits.forEach(fruit => {
                const fruitName = fruit.fruit_name;
                if (!fruitGroups.has(fruitName)) {
                    fruitGroups.set(fruitName, { ...fruit, count: 1 });
                } else {
                    fruitGroups.get(fruitName).count++;
                }
            });

            const fruitsByRarity = {};
            Array.from(fruitGroups.values()).forEach(fruit => {
                const rarityKey = fruit.fruit_rarity;
                if (!fruitsByRarity[rarityKey]) fruitsByRarity[rarityKey] = [];
                fruitsByRarity[rarityKey].push(fruit);
            });

            // Initialize player selection if not exists
            if (!player.tempSelectedFruits) {
                player.tempSelectedFruits = [];
            }

            // Get selected fruits from this rarity menu
            const selectedValues = interaction.values || [];
            const rarityFruits = fruitsByRarity[rarity] || [];
            
            // Remove previous selections from this rarity
            player.tempSelectedFruits = player.tempSelectedFruits.filter(fruit => 
                fruit.fruit_rarity !== rarity
            );

            // Add new selections from this rarity
            selectedValues.forEach(value => {
                const parts = value.split('_');
                const fruitIndex = parseInt(parts[2]);
                const selectedFruit = rarityFruits[fruitIndex];
                
                if (selectedFruit && player.tempSelectedFruits.length < 5) {
                    // Check if not already selected from another rarity
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
            const embed = this.createRaritySelectionProgressEmbed(battleData, player);
            const components = await this.createUpdatedRaritySelectionComponents(battleData, player);

            await interaction.update({
                embeds: [embed],
                components: components
            });

        } catch (error) {
            console.error('Error updating rarity-based fruit selection:', error);
            
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ An error occurred while updating your selection. Please try again.',
                        ephemeral: true
                    });
                }
            } catch (followUpError) {
                console.error('Failed to send fallback error message:', followUpError);
            }
        }
    }

    // Create rarity selection progress embed
    createRaritySelectionProgressEmbed(battleData, player) {
        const selectedCount = player.tempSelectedFruits?.length || 0;
        const { isVsNPC } = battleData;

        const embed = new EmbedBuilder()
            .setColor(selectedCount === 5 ? 0x00FF00 : 0x3498DB)
            .setTitle('⚔️ Enhanced Turn-Based PvP - Rarity Selection Progress')
            .setDescription(
                `**Selection Progress: ${selectedCount}/5 unique fruits selected**\n\n` +
                (selectedCount === 5 ? '✅ **Ready for enhanced turn-based battle! Click Confirm to proceed.**' : 
                `🔄 **Select ${5 - selectedCount} more unique fruits from the rarity dropdowns.**`)
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
                    name: '⚡ Selection Method',
                    value: [
                        `**Rarity-Based Dropdowns**: ✅`,
                        `**No Character Limits**: ✅`,
                        `**Duplicate Info Shown**: ✅`,
                        `**Only Your Rarities**: ✅`
                    ].join('\n'),
                    inline: true
                }
            ]);

        // Show selected fruits organized by rarity
        if (selectedCount > 0) {
            const selectedByRarity = {};
            player.tempSelectedFruits.forEach(fruit => {
                const rarity = fruit.fruit_rarity;
                if (!selectedByRarity[rarity]) selectedByRarity[rarity] = [];
                selectedByRarity[rarity].push(fruit);
            });

            let selectedText = '';
            const rarityOrder = ['divine', 'omnipotent', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
            
            rarityOrder.forEach(rarity => {
                const fruits = selectedByRarity[rarity];
                if (fruits && fruits.length > 0) {
                    const emoji = getRarityEmoji(rarity);
                    selectedText += `${emoji} **${rarity.charAt(0).toUpperCase() + rarity.slice(1)}**:\n`;
                    
                    fruits.forEach(fruit => {
                        const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                        const damage = ability ? ability.damage : 100;
                        const duplicateCount = player.fruits.filter(f => f.fruit_name === fruit.fruit_name).length;
                        const duplicateText = duplicateCount > 1 ? ` (x${duplicateCount})` : '';
                        
                        selectedText += `  • ${fruit.fruit_name}${duplicateText} (${damage} dmg)\n`;
                    });
                    selectedText += '\n';
                }
            });

            embed.addFields({
                name: '✅ Currently Selected Fruits by Rarity',
                value: selectedText.trim() || 'No fruits selected',
                inline: false
            });
        }

        return embed;
    }

    // Create updated rarity selection components
    async createUpdatedRaritySelectionComponents(battleData, player) {
        const components = [];
        const selectedCount = player.tempSelectedFruits?.length || 0;
        const selectedNames = new Set(player.tempSelectedFruits?.map(f => f.fruit_name) || []);

        // Group fruits by rarity
        const fruitGroups = new Map();
        player.fruits.forEach(fruit => {
            const fruitName = fruit.fruit_name;
            if (!fruitGroups.has(fruitName)) {
                fruitGroups.set(fruitName, { ...fruit, count: 1 });
            } else {
                fruitGroups.get(fruitName).count++;
            }
        });

        const fruitsByRarity = {};
        Array.from(fruitGroups.values()).forEach(fruit => {
            const rarity = fruit.fruit_rarity;
            if (!fruitsByRarity[rarity]) fruitsByRarity[rarity] = [];
            fruitsByRarity[rarity].push(fruit);
        });

        // Sort fruits within each rarity by name
        Object.keys(fruitsByRarity).forEach(rarity => {
            fruitsByRarity[rarity].sort((a, b) => a.fruit_name.localeCompare(b.fruit_name));
        });

        // Create rarity-based dropdown menus
        const rarityOrder = ['divine', 'omnipotent', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
        let menuIndex = 0;

        for (const rarity of rarityOrder) {
            const fruits = fruitsByRarity[rarity];
            if (!fruits || fruits.length === 0) continue;

            const rarityEmoji = getRarityEmoji(rarity);
            const rarityName = rarity.charAt(0).toUpperCase() + rarity.slice(1);

            const fruitOptions = fruits.slice(0, 25).map((fruit, index) => {
                const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                const damage = ability ? ability.damage : 100;
                const cooldown = ability ? ability.cooldown : 0;
                const isSelected = selectedNames.has(fruit.fruit_name);
                const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                
                return {
                    label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.length > 17 ? fruit.fruit_name.slice(0, 14) + '...' : fruit.fruit_name}${duplicateText}`,
                    description: `${damage}dmg ${cooldown}cd • ${ability?.name || 'Unknown'}`,
                    value: `fruit_${rarity}_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}`,
                    emoji: rarityEmoji,
                    default: isSelected
                };
            });

            if (fruitOptions.length > 0) {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_${rarity}_${menuIndex}`)
                    .setPlaceholder(`${rarityEmoji} ${rarityName} (${selectedCount}/5 selected)`)
                    .setMinValues(0)
                    .setMaxValues(Math.min(5, fruitOptions.length))
                    .addOptions(fruitOptions);

                const row = new ActionRowBuilder().addComponents(selectMenu);
                components.push(row);
                menuIndex++;

                if (components.length >= 4) break; // Leave room for buttons
            }
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
                    content: '✅ Fruits selected! Waiting for opponent...',
                    embeds: [],
                    components: []
                });
            }

        } catch (error) {
            console.error('Error confirming fruit selection:', error);
            
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ An error occurred while confirming your selection. Please try again.',
                        ephemeral: true
                    });
                }
            } catch (followUpError) {
                console.error('Failed to send confirmation error message:', followUpError);
            }
        }
    }

    // Reveal boss and start battle (same implementation)
    async revealBossAndStartBattle(interaction, battleData) {
        const { npcBoss, player1 } = battleData;
        
        const bossEmbed = new EmbedBuilder()
            .setColor(getRarityColor('mythical'))
            .setTitle(`${npcBoss.emoji} ENHANCED TURN-BASED BOSS REVEALED!`)
            .setDescription(`**${npcBoss.title}**\n*${npcBoss.description}*\n\n🔥 **Enhanced real-time turn-based combat begins!**`)
            .addFields([
                {
                    name: '🏴‍☠️ Your Battle Lineup',
                    value: player1.selectedFruits.map((fruit, i) => {
                        const duplicateCount = player1.fruits.filter(f => f.fruit_name === fruit.fruit_name).length;
                        const duplicateText = duplicateCount > 1 ? ` (x${duplicateCount})` : '';
                        return `${i + 1}. ${getRarityEmoji(fruit.fruit_rarity)} ${fruit.fruit_name}${duplicateText}`;
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
            .setFooter({ text: 'Enhanced turn-based battle starting in 3 seconds...' })
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
            .setDescription(`🔥 **${currentPlayerData.username}'s Turn** - Choose your Devil Fruit ability!`)
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
                text: isCurrentPlayerTurn ? 'Select your Devil Fruit ability!' : 'Waiting for opponent...' 
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

    // Create skill selection components
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
            
            return new ButtonBuilder()
                .setCustomId(`use_skill_${battleData.id}_${playerData.userId}_${index}`)
                .setLabel(`${fruit.fruit_name.slice(0, 12)}${duplicateText}`)
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

    // Process an attack
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
        
        let attackMessage = '';
        if (hit) {
            attackMessage = `⚡ **${attacker.username}** uses **${ability.name}** with **${fruit.fruit_name}**${duplicateText}!\n💥 Deals **${damage}** damage to **${defender.username}**!`;
            
            if (ability.effect) {
                defender.effects.push({
                    name: ability.effect,
                    duration: 2,
                    description: `Affected by ${ability.effect}`
                });
                attackMessage += ` ✨ **${ability.effect} applied!**`;
            }
        } else {
            attackMessage = `⚡ **${attacker.username}** uses **${ability.name}** with **${fruit.fruit_name}**${duplicateText} but misses!`;
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
            .setDescription(`**${winner.username}** emerges victorious in this epic turn-based battle!`)
            .addFields([
                {
                    name: '🎉 Victory!',
                    value: `**${winner.username}** defeats **${loser.username}**!\n\n**Final HP**: ${winner.hp}/${winner.maxHealth}\n**Turns**: ${battleData.currentTurn}`,
                    inline: false
                }
            ])
            .setFooter({ text: 'Enhanced turn-based combat complete!' })
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
        return recent.map(entry => entry.message).join('\n') || 'Enhanced turn-based battle starting...';
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
                console.log(`🧹 Cleaned up old enhanced battle: ${battleId}`);
            }
        }
    }
}

// Enhanced interaction handler for rarity-based selection
class PvPInteractionHandler {
    static async handleInteraction(interaction) {
        const customId = interaction.customId;
        const pvpSystem = module.exports;

        try {
            // Handle rarity-based fruit selection
            if (customId.startsWith('fruit_selection_')) {
                const parts = customId.split('_');
                const battleId = parts[2];
                const userId = parts[3];
                const rarity = parts[4];
                const menuIndex = parts[5] ? parseInt(parts[5]) : 0;
                
                await pvpSystem.handleFruitSelection(interaction, battleId, userId, rarity, menuIndex);
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
            console.error('Error handling enhanced PvP interaction:', error);
            
            if (error.code === 10062) {
                console.warn('⚠️ Enhanced PvP interaction expired');
                return true;
            }
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred during the enhanced turn-based battle.',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('Failed to send enhanced PvP error reply:', replyError);
            }
            
            return true;
        }
    }

    // Show detailed skill information
    static async showSkillDetails(interaction, battleId, userId, pvpSystem) {
        const battleData = pvpSystem.activeBattles.get(battleId);
        if (!battleData) return;

        const playerData = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        
        const skillsEmbed = new EmbedBuilder()
            .setColor(0x9932CC)
            .setTitle('📋 Your Enhanced Battle Abilities')
            .setDescription('Detailed information about your selected fruits, abilities, and duplicate bonuses')
            .setFooter({ text: 'Rarity-based selection system shows all details!' });

        playerData.selectedFruits.forEach((fruit, index) => {
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

            skillsEmbed.addFields({
                name: `${index + 1}. ${emoji} ${fruit.fruit_name}${duplicateText}`,
                value: [
                    `⚔️ **${ability.name}**`,
                    `💥 **Base Damage**: ${ability.damage}`,
                    `⏱️ **Cooldown**: ${ability.cooldown} turns`,
                    `🎯 **Accuracy**: ${ability.accuracy || 85}%`,
                    `📝 **Description**: ${ability.description}${effectText}`
                ].join('\n'),
                inline: false
            });
        });

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

        const embed = pvpSystem.createRaritySelectionProgressEmbed(battleData, player);
        const components = await pvpSystem.createUpdatedRaritySelectionComponents(battleData, player);

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
            .setDescription(`**${surrenderingPlayer.username}** has surrendered the enhanced turn-based battle!`)
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
                        `**Selection Method**: Rarity-Based Dropdowns`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Enhanced rarity-based system - strategic retreat!' })
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

console.log('✅ Enhanced Turn-Based PvP System with Rarity-Based Selection fully loaded!');

module.exports = enhancedTurnBasedPvP;
module.exports.PvPInteractionHandler = PvPInteractionHandler;
