// src/systems/enhanced-turn-based-pvp.js - FIXED Custom ID Parsing & Complete Turn-Based PvP System
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
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
        
        console.log('⚔️ Enhanced Turn-Based PvP System initialized with FIXED Custom ID Parsing');
    }

    // FIXED: Custom ID parsing method
    parseCustomId(customId, expectedPrefix) {
        try {
            if (!customId.startsWith(expectedPrefix)) {
                return null;
            }

            // Remove the prefix
            const withoutPrefix = customId.replace(expectedPrefix, '');
            const parts = withoutPrefix.split('_');

            console.log(`🔧 Parsing custom ID: ${customId}`);
            console.log(`🔧 Without prefix: ${withoutPrefix}`);
            console.log(`🔧 Parts: ${JSON.stringify(parts)}`);

            // Find the last part that looks like a Discord user ID (17-19 digits)
            for (let i = parts.length - 1; i >= 0; i--) {
                if (parts[i].match(/^\d{17,19}$/)) {
                    const userId = parts[i];
                    const battleId = parts.slice(0, i).join('_');
                    
                    console.log(`🔧 Parsed successfully: battleId="${battleId}", userId="${userId}"`);
                    return { battleId, userId };
                }
            }

            console.error(`❌ Could not parse custom ID: ${customId}`);
            return null;
        } catch (error) {
            console.error('Error parsing custom ID:', error);
            return null;
        }
    }

    // Generate battle ID (simplified for better compatibility)
    generateBattleId() {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 5);
        return `${timestamp}_${randomId}`;
    }

    // FIXED: Start a battle with better ID generation
    async startBattle(interaction, player1Fighter, player2Fighter = null) {
        const battleId = this.generateBattleId();
        
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
                status: 'fruit_selection',
                publicMessageId: null,
                channelId: interaction.channel?.id,
                guildId: interaction.guild?.id,
                selectionData: {
                    player1: {
                        selectedFruits: [],
                        currentPage: 'high',
                        selectionComplete: false,
                        lastUpdate: Date.now()
                    },
                    player2: {
                        selectedFruits: [],
                        currentPage: 'high', 
                        selectionComplete: isVsNPC,
                        lastUpdate: Date.now()
                    }
                }
            };

            this.activeBattles.set(battleId, battleData);
            console.log(`⚔️ Battle ${battleId} created and stored. Active battles: ${this.activeBattles.size}`);
            
            await this.startFruitSelection(interaction, battleData);
            
            return battleId;

        } catch (error) {
            console.error('Error starting enhanced battle:', error);
            if (this.activeBattles.has(battleId)) {
                this.activeBattles.delete(battleId);
                console.log(`🗑️ Cleaned up failed battle ${battleId}`);
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
        const { player1, player2, isVsNPC } = battleData;

        try {
            const publicEmbed = this.createPublicBattleScreen(battleData);
            
            await interaction.editReply({
                embeds: [publicEmbed]
            });
            
            const publicMessage = await interaction.fetchReply();
            battleData.publicMessageId = publicMessage.id;
            this.activeBattles.set(battleData.id, battleData);
            console.log(`📺 Public battle screen created for ${battleData.id}`);

            if (isVsNPC) {
                this.completeNPCSelection(battleData);
                console.log(`🤖 NPC selection completed for ${battleData.id}`);
            }
            
            await this.sendPrivateSelection(interaction, battleData, player1);
            await this.updatePublicBattleScreen(interaction, battleData);

        } catch (error) {
            console.error('Error starting fruit selection:', error);
            throw error;
        }
    }

    // Create public battle screen
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
            .setDescription(`🔥 **Real-time fruit selection in progress!**\n*Battle ID: \`${battleData.id}\`*\n*Watch as both fighters choose their battle lineup*`)
            .addFields([
                {
                    name: `🏴‍☠️ ${player1.username} ${player1.title ? `(${player1.title})` : ''}`,
                    value: [
                        `${p1Progress} **${selectionData.player1.selectedFruits.length}/5 fruits**`,
                        `**Status**: ${p1Status}`,
                        `**Level**: ${player1.level} | **CP**: ${player1.balancedCP.toLocaleString()}`,
                        `**Selection**: ${p1RarityBreakdown}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: `${isVsNPC ? player2.npcData.emoji : '🏴‍☠️'} ${player2.username} ${player2.title ? `(${player2.title})` : ''}`,
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
                        `**High Rarity Page**: Divine/Mythical/Legendary/Epic`,
                        `**Low Rarity Page**: Rare/Uncommon/Common`,
                        `**Real-Time Updates**: ✅ Live selection tracking`,
                        `**Active Battles**: ${this.activeBattles.size}`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ 
                text: 'Enhanced High/Low Page System - Everyone can watch the selection progress!' 
            })
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
            divine: 0,
            mythical: 0, 
            legendary: 0,
            epic: 0,
            rare: 0,
            uncommon: 0,
            common: 0
        };
        
        selectedFruits.forEach(fruit => {
            const rarity = fruit.fruit_rarity || 'common';
            if (breakdown.hasOwnProperty(rarity)) {
                breakdown[rarity]++;
            }
        });
        
        const parts = [];
        if (breakdown.divine > 0) parts.push(`Divine(${breakdown.divine})`);
        if (breakdown.mythical > 0) parts.push(`Mythical(${breakdown.mythical})`);
        if (breakdown.legendary > 0) parts.push(`Legendary(${breakdown.legendary})`);
        if (breakdown.epic > 0) parts.push(`Epic(${breakdown.epic})`);
        if (breakdown.rare > 0) parts.push(`Rare(${breakdown.rare})`);
        if (breakdown.uncommon > 0) parts.push(`Uncommon(${breakdown.uncommon})`);
        if (breakdown.common > 0) parts.push(`Common(${breakdown.common})`);
        
        return parts.join(', ') || 'No fruits selected';
    }

    // Send private selection interface
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
            
            console.log(`🔒 Private selection sent to ${player.username} for battle ${battleData.id}`);
            
        } catch (error) {
            console.error('Error sending private selection:', error);
        }
    }

    // Create private selection embed
    createPrivateSelectionEmbed(battleData, player) {
        const selectionData = battleData.selectionData[player.userId === battleData.player1.userId ? 'player1' : 'player2'];
        const selectedCount = selectionData.selectedFruits.length;
        const currentPage = selectionData.currentPage;
        
        const embed = new EmbedBuilder()
            .setColor(selectedCount === 5 ? 0x00FF00 : 0x3498DB)
            .setTitle(`🔒 Your Private Fruit Selection - ${currentPage === 'high' ? 'High' : 'Low'} Rarity Page`)
            .setDescription(
                `**Progress: ${selectedCount}/5 fruits selected**\n` +
                `*Battle ID: \`${battleData.id}\`*\n\n` +
                (selectedCount === 5 ? 
                    '✅ **Perfect! You have 5 fruits selected. Click Confirm to lock in your choices!**' : 
                    `🔄 **Select ${5 - selectedCount} more fruits from the dropdowns below.**`)
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
                            `⭐ **Divine**: Your ultimate powers`,
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
                const duplicateCount = player.fruits.filter(f => f.fruit_name === fruit.fruit_name).length;
                const duplicateText = duplicateCount > 1 ? ` (x${duplicateCount})` : '';
                
                return `${index + 1}. ${emoji} **${fruit.fruit_name}**${duplicateText} (${damage} dmg)`;
            }).join('\n');

            embed.addFields({
                name: '✅ Currently Selected Fruits',
                value: selectedText,
                inline: false
            });
        }

        return embed;
    }

    // Create private selection components
    async createPrivateSelectionComponents(battleData, player) {
        const components = [];
        const selectionData = battleData.selectionData[player.userId === battleData.player1.userId ? 'player1' : 'player2'];
        const selectedCount = selectionData.selectedFruits.length;
        const currentPage = selectionData.currentPage;
        const selectedNames = new Set(selectionData.selectedFruits.map(f => f.fruit_name));

        const organizedFruits = this.organizeFruitsByRarity(player.fruits, currentPage);

        if (currentPage === 'high') {
            // High Rarity Page dropdowns
            
            if (organizedFruits.divine.length > 0) {
                const divineOptions = organizedFruits.divine.slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const isSelected = selectedNames.has(fruit.fruit_name);
                    const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    
                    return {
                        label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.slice(0, 20)}${duplicateText}`,
                        description: `${damage}dmg • ${ability?.name || 'Divine Power'}`,
                        value: `divine_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                        emoji: '⭐',
                        default: isSelected
                    };
                });

                const divineMenu = new StringSelectMenuBuilder()
                    .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_divine`)
                    .setPlaceholder(`⭐ Divine Fruits (${organizedFruits.divine.length} available)`)
                    .setMinValues(0)
                    .setMaxValues(Math.min(5, divineOptions.length))
                    .addOptions(divineOptions);

                components.push(new ActionRowBuilder().addComponents(divineMenu));
            }

            if (organizedFruits.mythical.length > 0) {
                const mythicalOptions = organizedFruits.mythical.slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const isSelected = selectedNames.has(fruit.fruit_name);
                    const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    
                    return {
                        label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.slice(0, 20)}${duplicateText}`,
                        description: `${damage}dmg • ${ability?.name || 'Mythical Power'}`,
                        value: `mythical_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                        emoji: '🟧',
                        default: isSelected
                    };
                });

                const mythicalMenu = new StringSelectMenuBuilder()
                    .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_mythical`)
                    .setPlaceholder(`🟧 Mythical Fruits (${organizedFruits.mythical.length} available)`)
                    .setMinValues(0)
                    .setMaxValues(Math.min(5, mythicalOptions.length))
                    .addOptions(mythicalOptions);

                components.push(new ActionRowBuilder().addComponents(mythicalMenu));
            }

            if (organizedFruits.legendary.length > 0) {
                const legendaryOptions = organizedFruits.legendary.slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const isSelected = selectedNames.has(fruit.fruit_name);
                    const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    
                    return {
                        label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.slice(0, 20)}${duplicateText}`,
                        description: `${damage}dmg • ${ability?.name || 'Legendary Power'}`,
                        value: `legendary_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                        emoji: '🟨',
                        default: isSelected
                    };
                });

                const legendaryMenu = new StringSelectMenuBuilder()
                    .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_legendary`)
                    .setPlaceholder(`🟨 Legendary Fruits (${organizedFruits.legendary.length} available)`)
                    .setMinValues(0)
                    .setMaxValues(Math.min(5, legendaryOptions.length))
                    .addOptions(legendaryOptions);

                components.push(new ActionRowBuilder().addComponents(legendaryMenu));
            }

            if (organizedFruits.epic.length > 0) {
                const epicOptions = organizedFruits.epic.slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const isSelected = selectedNames.has(fruit.fruit_name);
                    const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    
                    return {
                        label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.slice(0, 20)}${duplicateText}`,
                        description: `${damage}dmg • ${ability?.name || 'Epic Power'}`,
                        value: `epic_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                        emoji: '🟪',
                        default: isSelected
                    };
                });

                const epicMenu = new StringSelectMenuBuilder()
                    .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_epic`)
                    .setPlaceholder(`🟪 Epic Fruits (${organizedFruits.epic.length} available)`)
                    .setMinValues(0)
                    .setMaxValues(Math.min(5, epicOptions.length))
                    .addOptions(epicOptions);

                components.push(new ActionRowBuilder().addComponents(epicMenu));
            }

        } else {
            // Low Rarity Page dropdowns
            
            if (organizedFruits.rare.length > 0) {
                const rareOptions = organizedFruits.rare.slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const isSelected = selectedNames.has(fruit.fruit_name);
                    const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    
                    return {
                        label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.slice(0, 20)}${duplicateText}`,
                        description: `${damage}dmg • ${ability?.name || 'Rare Power'}`,
                        value: `rare_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                        emoji: '🟦',
                        default: isSelected
                    };
                });

                const rareMenu = new StringSelectMenuBuilder()
                    .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_rare`)
                    .setPlaceholder(`🟦 Rare Fruits (${organizedFruits.rare.length} available)`)
                    .setMinValues(0)
                    .setMaxValues(Math.min(5, rareOptions.length))
                    .addOptions(rareOptions);

                components.push(new ActionRowBuilder().addComponents(rareMenu));
            }

            if (organizedFruits.uncommon.length > 0) {
                const uncommonOptions = organizedFruits.uncommon.slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const isSelected = selectedNames.has(fruit.fruit_name);
                    const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    
                    return {
                        label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.slice(0, 20)}${duplicateText}`,
                        description: `${damage}dmg • ${ability?.name || 'Uncommon Power'}`,
                        value: `uncommon_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                        emoji: '🟩',
                        default: isSelected
                    };
                });

                const uncommonMenu = new StringSelectMenuBuilder()
                    .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_uncommon`)
                    .setPlaceholder(`🟩 Uncommon Fruits (${organizedFruits.uncommon.length} available)`)
                    .setMinValues(0)
                    .setMaxValues(Math.min(5, uncommonOptions.length))
                    .addOptions(uncommonOptions);

                components.push(new ActionRowBuilder().addComponents(uncommonMenu));
            }

            if (organizedFruits.common.length > 0) {
                const commonOptions = organizedFruits.common.slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const isSelected = selectedNames.has(fruit.fruit_name);
                    const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    
                    return {
                        label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.slice(0, 20)}${duplicateText}`,
                        description: `${damage}dmg • ${ability?.name || 'Common Power'}`,
                        value: `common_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                        emoji: '🟫',
                        default: isSelected
                    };
                });

                const commonMenu = new StringSelectMenuBuilder()
                    .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_common`)
                    .setPlaceholder(`🟫 Common Fruits (${organizedFruits.common.length} available)`)
                    .setMinValues(0)
                    .setMaxValues(Math.min(5, commonOptions.length))
                    .addOptions(commonOptions);

                components.push(new ActionRowBuilder().addComponents(commonMenu));
            }
        }

        // Add page navigation and action buttons
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

    // Organize fruits by rarity for current page
    organizeFruitsByRarity(fruits, currentPage) {
        const fruitGroups = new Map();
        fruits.forEach(fruit => {
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

        const organized = {
            divine: [],
            mythical: [],
            legendary: [],
            epic: [],
            rare: [],
            uncommon: [],
            common: []
        };

        Array.from(fruitGroups.values()).forEach(fruit => {
            const rarity = fruit.fruit_rarity;
            if (organized.hasOwnProperty(rarity)) {
                organized[rarity].push(fruit);
            }
        });

        Object.keys(organized).forEach(rarity => {
            organized[rarity].sort((a, b) => a.fruit_name.localeCompare(b.fruit_name));
        });

        return organized;
    }

    // Complete NPC selection automatically
    completeNPCSelection(battleData) {
        const npcPlayer = battleData.player2;
        const selectedFruits = npcPlayer.selectedFruits.map(fruitName => ({
            fruit_name: fruitName,
            fruit_rarity: this.getFruitRarity(fruitName)
        }));
        
        battleData.selectionData.player2.selectedFruits = selectedFruits;
        battleData.selectionData.player2.selectionComplete = true;
        battleData.selectionData.player2.lastUpdate = Date.now();
        
        npcPlayer.selectedFruits = selectedFruits;
        this.activeBattles.set(battleData.id, battleData);
    }

    // Update public battle screen with real-time data
    async updatePublicBattleScreen(interaction, battleData) {
        try {
            if (!battleData.publicMessageId) return;

            const publicEmbed = this.createPublicBattleScreen(battleData);
            
            try {
                await interaction.editReply({
                    embeds: [publicEmbed]
                });
            } catch (editError) {
                try {
                    const channel = interaction.channel;
                    const publicMessage = await channel.messages.fetch(battleData.publicMessageId);
                    
                    if (publicMessage) {
                        await publicMessage.edit({
                            embeds: [publicEmbed]
                        });
                    }
                } catch (fetchError) {
                    console.error('Error fetching/editing public message:', fetchError);
                }
            }

        } catch (error) {
            console.error('Error updating public battle screen:', error);
        }
    }

    // FIXED: Handle fruit selection with robust battle ID lookup
    async handleFruitSelection(interaction, battleId, userId, rarity) {
        try {
            console.log(`🍈 Handling fruit selection: Battle "${battleId}", User "${userId}", Rarity "${rarity}"`);
            console.log(`📊 Active battles: ${this.activeBattles.size}`);
            console.log(`📊 Available battle IDs: [${Array.from(this.activeBattles.keys()).map(id => `"${id}"`).join(', ')}]`);
            
            // Try multiple lookup strategies
            let battleData = null;
            let finalBattleId = battleId;
            
            // Strategy 1: Exact match
            battleData = this.activeBattles.get(battleId);
            if (battleData) {
                console.log(`✅ Found battle with exact match: "${battleId}"`);
            }
            
            // Strategy 2: Partial match by timestamp
            if (!battleData && battleId.includes('_')) {
                const timestampPart = battleId.split('_')[0];
                console.log(`🔍 Searching for battle with timestamp: "${timestampPart}"`);
                
                for (const [storedBattleId, storedBattleData] of this.activeBattles) {
                    if (storedBattleId.startsWith(timestampPart)) {
                        battleData = storedBattleData;
                        finalBattleId = storedBattleId;
                        console.log(`✅ Found battle with timestamp match: "${finalBattleId}"`);
                        break;
                    }
                }
            }
            
            // Strategy 3: Reverse lookup - timestamp only
            if (!battleData) {
                console.log(`🔍 Trying reverse lookup for timestamp: "${battleId}"`);
                
                for (const [storedBattleId, storedBattleData] of this.activeBattles) {
                    if (storedBattleId.startsWith(battleId)) {
                        battleData = storedBattleData;
                        finalBattleId = storedBattleId;
                        console.log(`✅ Found battle with reverse lookup: "${finalBattleId}"`);
                        break;
                    }
                }
            }
            
            if (!battleData) {
                console.error(`❌ Battle "${battleId}" not found after all lookup strategies`);
                return await interaction.reply({ 
                    content: `❌ Battle not found!\n**Looking for**: \`${battleId}\`\n**Available**: \`${Array.from(this.activeBattles.keys()).join('`, `')}\`\n\nThe battle may have expired or there's an ID mismatch.`, 
                    flags: MessageFlags.Ephemeral
                });
            }

            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player) {
                return await interaction.reply({ 
                    content: `❌ Player "${userId}" not found in battle "${finalBattleId}"!`, 
                    flags: MessageFlags.Ephemeral
                });
            }

            const organizedFruits = this.organizeFruitsByRarity(player.fruits, selectionData.currentPage);
            const rarityFruits = organizedFruits[rarity] || [];

            const selectedValues = interaction.values || [];
            console.log(`🎯 Selected values: ${JSON.stringify(selectedValues)}`);
            
            // Remove all fruits of this rarity from selection first
            const previousCount = selectionData.selectedFruits.length;
            selectionData.selectedFruits = selectionData.selectedFruits.filter(fruit => {
                return fruit.fruit_rarity !== rarity;
            });
            console.log(`🗑️ Removed ${previousCount - selectionData.selectedFruits.length} fruits of rarity "${rarity}"`);

            // Add newly selected fruits of this rarity
            selectedValues.forEach(value => {
                const parts = value.split('_');
                const fruitIndex = parseInt(parts[1]);
                const selectedFruit = rarityFruits[fruitIndex];
                
                if (selectedFruit && selectionData.selectedFruits.length < 5) {
                    const exists = selectionData.selectedFruits.find(f => f.fruit_name === selectedFruit.fruit_name);
                    if (!exists) {
                        selectionData.selectedFruits.push(selectedFruit);
                        console.log(`✅ Added fruit: ${selectedFruit.fruit_name} (${selectedFruit.fruit_rarity})`);
                    }
                }
            });

            // Ensure we don't exceed 5 fruits
            if (selectionData.selectedFruits.length > 5) {
                selectionData.selectedFruits = selectionData.selectedFruits.slice(0, 5);
            }

            selectionData.lastUpdate = Date.now();
            this.activeBattles.set(finalBattleId, battleData);

            console.log(`📊 Final selection count: ${selectionData.selectedFruits.length}/5`);

            // Update the private interface
            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);

            await interaction.update({
                embeds: [embed],
                components: components
            });

            // Update public battle screen
            await this.updatePublicBattleScreen(interaction, battleData);
            
            console.log(`✅ Fruit selection updated for ${player.username}: ${selectionData.selectedFruits.length}/5 fruits`);

        } catch (error) {
            console.error('Error handling fruit selection:', error);
            
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: `❌ Error during fruit selection: ${error.message}`,
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (followUpError) {
                console.error('Failed to send error message:', followUpError);
            }
        }
    }

    // FIXED: Handle page switching with improved battle ID handling
    async handlePageSwitch(interaction, battleId, userId) {
        try {
            console.log(`🔄 Handling page switch: Battle ${battleId}, User ${userId}`);
            
            // Try to find battle with exact ID first
            let battleData = this.activeBattles.get(battleId);
            
            // If not found, try to find by partial ID (timestamp part)
            if (!battleData && battleId.includes('_')) {
                const timestampPart = battleId.split('_')[0];
                console.log(`🔍 Searching for battle with timestamp: ${timestampPart}`);
                
                for (const [storedBattleId, storedBattleData] of this.activeBattles) {
                    if (storedBattleId.startsWith(timestampPart)) {
                        battleData = storedBattleData;
                        battleId = storedBattleId; // Update to use the correct stored ID
                        console.log(`✅ Found battle with corrected ID: ${battleId}`);
                        break;
                    }
                }
            }
            
            if (!battleData) {
                return await interaction.reply({ 
                    content: `❌ Battle not found! Battle ID: \`${battleId}\``, 
                    flags: MessageFlags.Ephemeral
                });
            }

            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player) {
                return await interaction.reply({ 
                    content: '❌ Player not found in this battle!', 
                    flags: MessageFlags.Ephemeral
                });
            }

            // Switch page
            selectionData.currentPage = selectionData.currentPage === 'high' ? 'low' : 'high';
            selectionData.lastUpdate = Date.now();
            this.activeBattles.set(battleId, battleData);

            // Update the interface with new page
            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);

            await interaction.update({
                embeds: [embed],
                components: components
            });

            await this.updatePublicBattleScreen(interaction, battleData);
            console.log(`✅ Page switched to ${selectionData.currentPage} for ${player.username}`);

        } catch (error) {
            console.error('Error handling page switch:', error);
            
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ An error occurred while switching pages.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (followUpError) {
                console.error('Failed to send error message:', followUpError);
            }
        }
    }

    // Handle confirm selection
    async handleConfirmSelection(interaction, battleId, userId) {
        try {
            console.log(`✅ Handling confirm selection: Battle ${battleId}, User ${userId}`);
            
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await interaction.reply({ 
                    content: `❌ Battle not found! Battle ID: \`${battleId}\``, 
                    flags: MessageFlags.Ephemeral
                });
            }

            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player || !selectionData.selectedFruits || selectionData.selectedFruits.length !== 5) {
                return await interaction.reply({ 
                    content: `❌ You must select exactly 5 fruits! Currently selected: ${selectionData.selectedFruits?.length || 0}`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Confirm the selection
            player.selectedFruits = [...selectionData.selectedFruits];
            selectionData.selectionComplete = true;
            selectionData.lastUpdate = Date.now();
            this.activeBattles.set(battleId, battleData);

            // Check if all players have selected
            const allSelected = battleData.isVsNPC || 
                (battleData.selectionData.player1.selectionComplete && battleData.selectionData.player2.selectionComplete);

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

            await this.updatePublicBattleScreen(interaction, battleData);
            console.log(`✅ Selection confirmed for ${player.username}: 5 fruits locked in`);

        } catch (error) {
            console.error('Error confirming selection:', error);
            
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ An error occurred while confirming your selection.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (followUpError) {
                console.error('Failed to send error message:', followUpError);
            }
        }
    }

    // Handle clear selection
    async handleClearSelection(interaction, battleId, userId) {
        try {
            console.log(`🗑️ Handling clear selection: Battle ${battleId}, User ${userId}`);
            
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await interaction.reply({ 
                    content: `❌ Battle not found! Battle ID: \`${battleId}\``, 
                    flags: MessageFlags.Ephemeral
                });
            }

            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player) {
                return await interaction.reply({ 
                    content: '❌ Player not found in this battle!', 
                    flags: MessageFlags.Ephemeral
                });
            }

            // Clear selection
            selectionData.selectedFruits = [];
            selectionData.lastUpdate = Date.now();
            this.activeBattles.set(battleId, battleData);

            // Update the interface
            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);

            await interaction.update({
                embeds: [embed],
                components: components
            });

            await this.updatePublicBattleScreen(interaction, battleData);
            console.log(`✅ Selection cleared for ${player.username}`);

        } catch (error) {
            console.error('Error clearing selection:', error);
            
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ An error occurred while clearing your selection.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (followUpError) {
                console.error('Failed to send error message:', followUpError);
            }
        }
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

        await interaction.editReply({
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
            message: `⚔️ **BATTLE BEGINS!** ⚔️`,
            timestamp: Date.now()
        });
        
        this.activeBattles.set(battleData.id, battleData);

        const battleEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('⚔️ Enhanced Turn-Based Battle Started!')
            .setDescription(`The epic battle begins! Both fighters have selected their fruits and are ready for combat!\n\n*Battle ID: \`${battleData.id}\`*`)
            .addFields([
                {
                    name: '🏴‍☠️ Battle Participants',
                    value: `**${battleData.player1.username}** vs **${battleData.player2.username}**`,
                    inline: false
                },
                {
                    name: '🍈 Selected Fruits',
                    value: `Both fighters have selected their 5 battle fruits and are ready for enhanced turn-based combat!`,
                    inline: false
                },
                {
                    name: '📊 Battle Info',
                    value: [
                        `**Battle Type**: ${battleData.isVsNPC ? 'PvE (Player vs NPC Boss)' : 'PvP (Player vs Player)'}`,
                        `**Battle System**: Enhanced Turn-Based Combat`,
                        `**Battle ID**: \`${battleData.id}\``,
                        `**Status**: Combat Ready ✅`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Enhanced Turn-Based Battle System - Combat mechanics ready!' })
            .setTimestamp();

        await interaction.editReply({
            embeds: [battleEmbed],
            components: []
        });

        console.log(`⚔️ Enhanced turn-based battle ${battleData.id} started successfully!`);
    }

    // Get active battle for user
    getUserActiveBattle(userId) {
        for (const [battleId, battleData] of this.activeBattles) {
            if (battleData.player1.userId === userId || battleData.player2.userId === userId) {
                return battleData;
            }
        }
        return null;
    }

    // Enhanced cleanup with better logging
    cleanupOldBattles() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes
        let cleanedCount = 0;
        
        for (const [battleId, battleData] of this.activeBattles) {
            if (now - battleData.created > maxAge) {
                this.activeBattles.delete(battleId);
                cleanedCount++;
                console.log(`🧹 Cleaned up old battle: ${battleId} (age: ${Math.floor((now - battleData.created) / 60000)}min)`);
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleanup complete: Removed ${cleanedCount} old battles. Active battles: ${this.activeBattles.size}`);
        }
    }
}

// FIXED: Enhanced interaction handler with proper custom ID parsing
class PvPInteractionHandler {
    static async handleInteraction(interaction) {
        const customId = interaction.customId;
        const pvpSystem = module.exports;

        try {
            console.log(`🎮 Processing PvP interaction: ${customId}`);

            // FIXED: Handle fruit selection from specific rarity dropdowns with improved ID parsing
            if (customId.includes('_divine') || customId.includes('_mythical') || 
                customId.includes('_legendary') || customId.includes('_epic') ||
                customId.includes('_rare') || customId.includes('_uncommon') || customId.includes('_common')) {
                
                console.log(`🔍 Parsing fruit selection custom ID: ${customId}`);
                
                // Extract parts more carefully
                const parts = customId.split('_');
                console.log(`🔍 Custom ID parts: ${JSON.stringify(parts)}`);
                
                // Find fruit_selection prefix index
                const selectionIndex = parts.findIndex(part => part === 'selection');
                if (selectionIndex === -1 || selectionIndex + 3 >= parts.length) {
                    console.error(`❌ Invalid fruit selection custom ID format: ${customId}`);
                    return false;
                }
                
                // Extract battle ID (everything between fruit_selection and user ID)
                // Format: fruit_selection_BATTLEID_USERID_RARITY
                const battleIdStart = selectionIndex + 1;
                const userIdIndex = parts.length - 2; // Second to last part is user ID
                const rarityIndex = parts.length - 1;  // Last part is rarity
                
                const battleId = parts.slice(battleIdStart, userIdIndex).join('_');
                const userId = parts[userIdIndex];
                const rarity = parts[rarityIndex];
                
                console.log(`🔍 Extracted - Battle ID: "${battleId}", User ID: "${userId}", Rarity: "${rarity}"`);
                
                await pvpSystem.handleFruitSelection(interaction, battleId, userId, rarity);
                return true;
            }

            // FIXED: Handle page switching with proper parsing
            if (customId.startsWith('page_switch_')) {
                const parsed = pvpSystem.parseCustomId(customId, 'page_switch_');
                if (parsed) {
                    await pvpSystem.handlePageSwitch(interaction, parsed.battleId, parsed.userId);
                    return true;
                }
                
                console.error(`❌ Failed to parse page_switch custom ID: ${customId}`);
                return false;
            }

            // Handle confirm selection
            if (customId.startsWith('confirm_selection_')) {
                const parsed = pvpSystem.parseCustomId(customId, 'confirm_selection_');
                if (parsed) {
                    await pvpSystem.handleConfirmSelection(interaction, parsed.battleId, parsed.userId);
                    return true;
                }
                
                console.error(`❌ Failed to parse confirm_selection custom ID: ${customId}`);
                return false;
            }

            // Handle clear selection
            if (customId.startsWith('clear_selection_')) {
                const parsed = pvpSystem.parseCustomId(customId, 'clear_selection_');
                if (parsed) {
                    await pvpSystem.handleClearSelection(interaction, parsed.battleId, parsed.userId);
                    return true;
                }
                
                console.error(`❌ Failed to parse clear_selection custom ID: ${customId}`);
                return false;
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
            console.error('Error handling enhanced PvP interaction:', error);
            
            if (error.code === 10062) {
                console.warn('⚠️ Enhanced PvP interaction expired - this is normal for old interactions');
                return true;
            }
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred during the enhanced turn-based battle.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                console.error('Failed to send enhanced PvP error reply:', replyError);
            }
            
            return true;
        }
    }
}

// Create and export the enhanced singleton instance
const enhancedTurnBasedPvP = new EnhancedTurnBasedPvP();

// Set up cleanup interval
setInterval(() => {
    enhancedTurnBasedPvP.cleanupOldBattles();
}, 5 * 60 * 1000);

console.log('✅ Enhanced Turn-Based PvP System with FIXED Custom ID Parsing loaded!');
console.log('✅ Features: Proper battle ID parsing, enhanced logging, fixed page switching');

// Export both the main system and the interaction handler
module.exports = enhancedTurnBasedPvP;
module.exports.PvPInteractionHandler = PvPInteractionHandler;
module.exports.activeBattles = enhancedTurnBasedPvP.activeBattles;

// Also add to the main system for direct access
enhancedTurnBasedPvP.PvPInteractionHandler = PvPInteractionHandler;
