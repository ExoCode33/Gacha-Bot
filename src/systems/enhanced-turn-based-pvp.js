// src/systems/enhanced-turn-based-pvp.js - COMPLETE High/Low Rarity Pages with Real-Time Public Updates
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
        
        // Define rarity organization for pages
        this.rarityPages = {
            high: {
                divine: [],
                mythical: [],
                legendary: [],
                epic: []
            },
            low: {
                rare: [],
                uncommon: [],
                common: []
            }
        };
        
        console.log('⚔️ Enhanced Turn-Based PvP System initialized with High/Low Rarity Pages');
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
                status: 'fruit_selection',
                publicMessageId: null,
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
                        selectionComplete: false,
                        lastUpdate: Date.now()
                    }
                }
            };

            this.activeBattles.set(battleId, battleData);
            await this.startFruitSelection(interaction, battleData);
            
            return battleId;

        } catch (error) {
            console.error('Error starting enhanced battle:', error);
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

    // Start fruit selection phase with dual-message system
    async startFruitSelection(interaction, battleData) {
        const { player1, player2, isVsNPC } = battleData;

        try {
            // Create public battle screen first
            const publicEmbed = this.createPublicBattleScreen(battleData);
            const publicMessage = await interaction.reply({
                embeds: [publicEmbed],
                fetchReply: true
            });
            
            // Store public message ID for updates
            battleData.publicMessageId = publicMessage.id;

            if (isVsNPC) {
                // Auto-complete NPC selection
                this.completeNPCSelection(battleData);
                
                // Send private selection to player1
                await this.sendPrivateSelection(interaction, battleData, player1);
            } else {
                // Send private selection to both players
                await this.sendPrivateSelection(interaction, battleData, player1);
                // In a real implementation, send to player2 as well via DM or followUp
            }

            // Update public screen with initial selections
            await this.updatePublicBattleScreen(interaction, battleData);

        } catch (error) {
            console.error('Error starting fruit selection:', error);
            throw error;
        }
    }

    // Create public battle screen that everyone can see
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
            .setDescription('🔥 **Real-time fruit selection in progress!**\n*Watch as both fighters choose their battle lineup*')
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
                        `**High Rarity Page**: ${this.rarityPages.high.divine.length + this.rarityPages.high.mythical.length + this.rarityPages.high.legendary.length + this.rarityPages.high.epic.length} Divine/Mythical/Legendary/Epic`,
                        `**Low Rarity Page**: ${this.rarityPages.low.rare.length + this.rarityPages.low.uncommon.length + this.rarityPages.low.common.length} Rare/Uncommon/Common`,
                        `**Real-Time Updates**: ✅ Live selection tracking`
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

    // Send private selection interface to player
    async sendPrivateSelection(interaction, battleData, player) {
        try {
            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);
            
            // Send ephemeral reply for private interface
            await interaction.followUp({
                content: `🔒 **Your Private Selection Interface** - Choose your 5 battle fruits!`,
                embeds: [embed],
                components: components,
                ephemeral: true
            });
            
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
                `**Progress: ${selectedCount}/5 fruits selected**\n\n` +
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

        // Show currently selected fruits
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

    // Create private selection components for current page
    async createPrivateSelectionComponents(battleData, player) {
        const components = [];
        const selectionData = battleData.selectionData[player.userId === battleData.player1.userId ? 'player1' : 'player2'];
        const selectedCount = selectionData.selectedFruits.length;
        const currentPage = selectionData.currentPage;
        const selectedNames = new Set(selectionData.selectedFruits.map(f => f.fruit_name));

        // Organize fruits by rarity for current page
        const organizedFruits = this.organizeFruitsByRarity(player.fruits, currentPage);

        if (currentPage === 'high') {
            // High Rarity Page - Divine, Mythical, Legendary, Epic dropdowns
            
            // Divine Dropdown
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

            // Mythical Dropdown
            if (organizedFruits.mythical.length > 0) {
                const mythicalOptions = organizedFruits.mythical.slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const isSelected = selectedNames.has(fruit.fruit_name);
                    const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    
                    return {
                        label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.slice(0, 18)}${duplicateText}`,
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

            // Legendary Dropdown
            if (organizedFruits.legendary.length > 0) {
                const legendaryOptions = organizedFruits.legendary.slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const isSelected = selectedNames.has(fruit.fruit_name);
                    const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    
                    return {
                        label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.slice(0, 18)}${duplicateText}`,
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

            // Epic Dropdown
            if (organizedFruits.epic.length > 0) {
                const epicOptions = organizedFruits.epic.slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const isSelected = selectedNames.has(fruit.fruit_name);
                    const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    
                    return {
                        label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.slice(0, 18)}${duplicateText}`,
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
            // Low Rarity Page - Rare, Uncommon, Common dropdowns
            
            // Rare Dropdown
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

            // Uncommon Dropdown
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

            // Common Dropdown
            if (organizedFruits.common.length > 0) {
                const commonOptions = organizedFruits.common.slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const isSelected = selectedNames.has(fruit.fruit_name);
                    const duplicateText = fruit.count > 1 ? ` (x${fruit.count})` : '';
                    
                    return {
                        label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.slice(0, 20)}${duplicateText}`,
                        description: `${damage}dmg • ${ability?.name || 'Basic Power'}`,
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
        // Group fruits by name and count duplicates
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

        // Sort fruits into appropriate rarity arrays
        Array.from(fruitGroups.values()).forEach(fruit => {
            const rarity = fruit.fruit_rarity;
            if (organized.hasOwnProperty(rarity)) {
                organized[rarity].push(fruit);
            }
        });

        // Sort each rarity by name
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
        
        // Set NPC's actual selected fruits
        npcPlayer.selectedFruits = selectedFruits;
    }

    // Handle fruit selection from dropdowns
    async handleFruitSelection(interaction, battleId, userId, rarity) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await interaction.reply({ 
                    content: '❌ Battle not found! It may have expired.', 
                    ephemeral: true 
                });
            }

            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player) {
                return await interaction.reply({ 
                    content: '❌ Player not found in this battle!', 
                    ephemeral: true 
                });
            }

            // Get organized fruits for current page
            const organizedFruits = this.organizeFruitsByRarity(player.fruits, selectionData.currentPage);
            const rarityFruits = organizedFruits[rarity] || [];

            // Get selected fruits from this dropdown
            const selectedValues = interaction.values || [];
            
            // Remove previous selections from this rarity
            selectionData.selectedFruits = selectionData.selectedFruits.filter(fruit => {
                return fruit.fruit_rarity !== rarity;
            });

            // Add new selections from this rarity
            selectedValues.forEach(value => {
                const parts = value.split('_');
                const fruitIndex = parseInt(parts[1]);
                const selectedFruit = rarityFruits[fruitIndex];
                
                if (selectedFruit && selectionData.selectedFruits.length < 5) {
                    // Check if not already selected from another rarity
                    const exists = selectionData.selectedFruits.find(f => f.fruit_name === selectedFruit.fruit_name);
                    if (!exists) {
                        selectionData.selectedFruits.push(selectedFruit);
                    }
                }
            });

            // Ensure max 5 fruits
            if (selectionData.selectedFruits.length > 5) {
                selectionData.selectedFruits = selectionData.selectedFruits.slice(0, 5);
            }

            // Update timestamp
            selectionData.lastUpdate = Date.now();

            // Update private interface
            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);

            await interaction.update({
                embeds: [embed],
                components: components
            });

            // Update public battle screen
            await this.updatePublicBattleScreen(interaction, battleData);

        } catch (error) {
            console.error('Error handling fruit selection:', error);
            
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ An error occurred while updating your selection. Please try again.',
                        ephemeral: true
                    });
                }
            } catch (followUpError) {
                console.error('Failed to send error message:', followUpError);
            }
        }
    }

    // Handle page switching
    async handlePageSwitch(interaction, battleId, userId) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await interaction.reply({ 
                    content: '❌ Battle not found!', 
                    ephemeral: true 
                });
            }

            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player) {
                return await interaction.reply({ 
                    content: '❌ Player not found!', 
                    ephemeral: true 
                });
            }

            // Switch page
            selectionData.currentPage = selectionData.currentPage === 'high' ? 'low' : 'high';
            selectionData.lastUpdate = Date.now();

            // Update private interface with new page
            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);

            await interaction.update({
                embeds: [embed],
                components: components
            });

            // Update public battle screen to show page change
            await this.updatePublicBattleScreen(interaction, battleData);

        } catch (error) {
            console.error('Error handling page switch:', error);
            
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ An error occurred while switching pages.',
                        ephemeral: true
                    });
                }
            } catch (followUpError) {
                console.error('Failed to send page switch error:', followUpError);
            }
        }
    }

    // Handle selection confirmation
    async handleConfirmSelection(interaction, battleId, userId) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await interaction.reply({ 
                    content: '❌ Battle not found!', 
                    ephemeral: true 
                });
            }

            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player || !selectionData.selectedFruits || selectionData.selectedFruits.length !== 5) {
                return await interaction.reply({ 
                    content: `❌ You must select exactly 5 fruits! Currently selected: ${selectionData.selectedFruits?.length || 0}`,
                    ephemeral: true 
                });
            }

            // Confirm the selection
            selectionData.selectionComplete = true;
            selectionData.lastUpdate = Date.now();
            player.selectedFruits = [...selectionData.selectedFruits];

            // Update private interface to show confirmed state
            await interaction.update({
                content: '✅ **Selection Confirmed!** Your 5 fruits are locked in.',
                embeds: [],
                components: []
            });

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
                // Update public screen to show one player is ready
                await this.updatePublicBattleScreen(interaction, battleData);
            }

        } catch (error) {
            console.error('Error confirming selection:', error);
            
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ An error occurred while confirming your selection.',
                        ephemeral: true
                    });
                }
            } catch (followUpError) {
                console.error('Failed to send confirmation error:', followUpError);
            }
        }
    }

    // Handle clear selection
    async handleClearSelection(interaction, battleId, userId) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await interaction.reply({ 
                    content: '❌ Battle not found!', 
                    ephemeral: true 
                });
            }

            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player) {
                return await interaction.reply({ 
                    content: '❌ Player not found!', 
                    ephemeral: true 
                });
            }

            // Clear selection
            selectionData.selectedFruits = [];
            selectionData.selectionComplete = false;
            selectionData.lastUpdate = Date.now();

            // Update private interface
            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);

            await interaction.update({
                embeds: [embed],
                components: components
            });

            // Update public battle screen
            await this.updatePublicBattleScreen(interaction, battleData);

        } catch (error) {
            console.error('Error clearing selection:', error);
        }
    }

    // Update public battle screen with real-time data
    async updatePublicBattleScreen(interaction, battleData) {
        try {
            if (!battleData.publicMessageId) return;

            const publicEmbed = this.createPublicBattleScreen(battleData);
            
            // Get the original public message
            const channel = interaction.channel;
            const publicMessage = await channel.messages.fetch(battleData.publicMessageId);
            
            if (publicMessage) {
                await publicMessage.edit({
                    embeds: [publicEmbed]
                });
            }

        } catch (error) {
            console.error('Error updating public battle screen:', error);
        }
    }

    // Reveal boss and start battle
    async revealBossAndStartBattle(interaction, battleData) {
        const { npcBoss, player1 } = battleData;
        
        try {
            const bossEmbed = new EmbedBuilder()
                .setColor(getRarityColor('mythical'))
                .setTitle(`${npcBoss.emoji} BOSS REVEALED!`)
                .setDescription(`**${npcBoss.title}**\n*${npcBoss.description}*\n\n🔥 **Enhanced turn-based combat begins!**`)
                .addFields([
                    {
                        name: '🏴‍☠️ Your Battle Lineup (High/Low Pages Selection)',
                        value: player1.selectedFruits.map((fruit, i) => {
                            const duplicateCount = player1.fruits.filter(f => f.fruit_name === fruit.fruit_name).length;
                            const duplicateText = duplicateCount > 1 ? ` (x${duplicateCount})` : '';
                            const pageType = ['divine', 'mythical', 'legendary', 'epic'].includes(fruit.fruit_rarity) ? '🔥' : '⚡';
                            return `${i + 1}. ${pageType} ${getRarityEmoji(fruit.fruit_rarity)} ${fruit.fruit_name}${duplicateText}`;
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
                .setFooter({ text: 'High/Low page selection complete - enhanced turn-based battle starting!' })
                .setTimestamp();

            // Update the public message with boss reveal
            const channel = interaction.channel;
            const publicMessage = await channel.messages.fetch(battleData.publicMessageId);
            
            if (publicMessage) {
                await publicMessage.edit({
                    embeds: [bossEmbed],
                    components: []
                });
            }

            // Auto-start after 3 seconds
            setTimeout(async () => {
                try {
                    await this.startTurnBasedBattle(interaction, battleData);
                } catch (error) {
                    console.error('Error auto-starting battle:', error);
                }
            }, 3000);

        } catch (error) {
            console.error('Error revealing boss:', error);
        }
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
            .setDescription(`🔥 **${currentPlayerData.username}'s Turn** - Choose your Devil Fruit ability!\n*Selected via High/Low rarity pages*`)
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
                text: isCurrentPlayerTurn ? 'Select your Devil Fruit ability from your High/Low page selection!' : 'Waiting for opponent...' 
            })
            .setTimestamp();

        let components = [];
        if (isCurrentPlayerTurn) {
            components = await this.createSkillSelectionComponents(battleData, currentPlayerData);
        }

        try {
            // Update the public message with battle interface
            const channel = interaction.channel;
            const publicMessage = await channel.messages.fetch(battleData.publicMessageId);
            
            if (publicMessage) {
                await publicMessage.edit({
                    embeds: [embed],
                    components: components
                });
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

    // Create skill selection components with High/Low page indicators
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
            const pageIndicator = ['divine', 'mythical', 'legendary', 'epic'].includes(fruit.fruit_rarity) ? '🔥' : '⚡';
            
            return new ButtonBuilder()
                .setCustomId(`use_skill_${battleData.id}_${playerData.userId}_${index}`)
                .setLabel(`${pageIndicator}${fruit.fruit_name.slice(0, 8)}${duplicateText}`)
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

    // Process an attack with High/Low page bonus display
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
        const pageIndicator = ['divine', 'mythical', 'legendary', 'epic'].includes(fruit.fruit_rarity) ? '🔥 High' : '⚡ Low';
        
        let attackMessage = '';
        if (hit) {
            attackMessage = `⚡ **${attacker.username}** uses **${ability.name}** with **${fruit.fruit_name}**${duplicateText} [${pageIndicator} Page]!\n💥 Deals **${damage}** damage to **${defender.username}**!`;
            
            if (ability.effect) {
                defender.effects.push({
                    name: ability.effect,
                    duration: 2,
                    description: `Affected by ${ability.effect}`
                });
                attackMessage += ` ✨ **${ability.effect} applied!**`;
            }
        } else {
            attackMessage = `⚡ **${attacker.username}** uses **${ability.name}** with **${fruit.fruit_name}**${duplicateText} [${pageIndicator} Page] but misses!`;
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
            pageType: ['divine', 'mythical', 'legendary', 'epic'].includes(fruit.fruit_rarity) ? 'high' : 'low',
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
            .setDescription(`**${winner.username}** emerges victorious in this epic High/Low page turn-based battle!`)
            .addFields([
                {
                    name: '🎉 Victory!',
                    value: `**${winner.username}** defeats **${loser.username}**!\n\n**Final HP**: ${winner.hp}/${winner.maxHealth}\n**Turns**: ${battleData.currentTurn}\n**Selection Method**: High/Low Rarity Pages`,
                    inline: false
                }
            ])
            .setFooter({ text: 'High/Low rarity page enhanced turn-based combat complete!' })
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

        // Update the public message with final results
        try {
            const channel = interaction.channel;
            const publicMessage = await channel.messages.fetch(battleData.publicMessageId);
            
            if (publicMessage) {
                await publicMessage.edit({
                    embeds: [winnerEmbed],
                    components: []
                });
            }
        } catch (error) {
            console.error('Error updating final battle results:', error);
        }

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
        return recent.map(entry => entry.message).join('\n') || 'Enhanced High/Low page turn-based battle starting...';
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
                console.log(`🧹 Cleaned up old enhanced High/Low page battle: ${battleId}`);
            }
        }
    }
}

// Enhanced interaction handler for High/Low rarity pages
class PvPInteractionHandler {
    static async handleInteraction(interaction) {
        const customId = interaction.customId;
        const pvpSystem = module.exports;

        try {
            // Handle High/Low page fruit selection from specific rarity dropdowns
            if (customId.includes('_divine') || customId.includes('_mythical') || 
                customId.includes('_legendary') || customId.includes('_epic') ||
                customId.includes('_rare') || customId.includes('_uncommon') || customId.includes('_common')) {
                
                const parts = customId.split('_');
                const battleId = parts[2];
                const userId = parts[3];
                const rarity = parts[4]; // divine, mythical, legendary, epic, rare, uncommon, common
                
                await pvpSystem.handleFruitSelection(interaction, battleId, userId, rarity);
                return true;
            }

            // Handle page switching
            if (customId.startsWith('page_switch_')) {
                const parts = customId.split('_');
                const battleId = parts[2];
                const userId = parts[3];
                
                await pvpSystem.handlePageSwitch(interaction, battleId, userId);
                return true;
            }

            // Handle confirm selection
            if (customId.startsWith('confirm_selection_')) {
                const parts = customId.split('_');
                const battleId = parts[2];
                const userId = parts[3];
                
                await pvpSystem.handleConfirmSelection(interaction, battleId, userId);
                return true;
            }

            // Handle clear selection
            if (customId.startsWith('clear_selection_')) {
                const parts = customId.split('_');
                const battleId = parts[2];
                const userId = parts[3];
                
                await pvpSystem.handleClearSelection(interaction, battleId, userId);
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
            console.error('Error handling enhanced High/Low page PvP interaction:', error);
            
            if (error.code === 10062) {
                console.warn('⚠️ Enhanced High/Low page PvP interaction expired');
                return true;
            }
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred during the enhanced High/Low page turn-based battle.',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('Failed to send enhanced High/Low page PvP error reply:', replyError);
            }
            
            return true;
        }
    }

    // Show detailed skill information with High/Low page indicators
    static async showSkillDetails(interaction, battleId, userId, pvpSystem) {
        const battleData = pvpSystem.activeBattles.get(battleId);
        if (!battleData) return;

        const playerData = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        
        const skillsEmbed = new EmbedBuilder()
            .setColor(0x9932CC)
            .setTitle('📋 Your Enhanced Battle Abilities (High/Low Page System)')
            .setDescription('Detailed information about your selected fruits organized by High/Low rarity pages')
            .setFooter({ text: 'High/Low page selection system shows all details with perfect organization!' });

        // Organize by High/Low pages
        const skillsByPage = { high: [], low: [] };
        
        playerData.selectedFruits.forEach((fruit, index) => {
            const page = ['divine', 'mythical', 'legendary', 'epic'].includes(fruit.fruit_rarity) ? 'high' : 'low';
            skillsByPage[page].push({ fruit, index });
        });

        // Add High Page skills
        if (skillsByPage.high.length > 0) {
            let highSkillsText = '';
            skillsByPage.high.forEach(({ fruit, index }) => {
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
                name: '🔥 High Rarity Page Abilities (Divine, Mythical, Legendary, Epic)',
                value: highSkillsText.trim(),
                inline: false
            });
        }

        // Add Low Page skills
        if (skillsByPage.low.length > 0) {
            let lowSkillsText = '';
            skillsByPage.low.forEach(({ fruit, index }) => {
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
                name: '⚡ Low Rarity Page Abilities (Rare, Uncommon, Common)',
                value: lowSkillsText.trim(),
                inline: false
            });
        }

        await interaction.reply({
            embeds: [skillsEmbed],
            ephemeral: true
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
            .setDescription(`**${surrenderingPlayer.username}** has surrendered the enhanced High/Low page turn-based battle!`)
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
                        `**Selection Method**: High/Low Rarity Pages`,
                        `**Page System**: 4 High + 3 Low dropdowns ✅`,
                        `**Real-Time Updates**: ✅`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Enhanced High/Low rarity page system - strategic retreat!' })
            .setTimestamp();

        // Update the public message with surrender results
        try {
            const channel = interaction.channel;
            const publicMessage = await channel.messages.fetch(battleData.publicMessageId);
            
            if (publicMessage) {
                await publicMessage.edit({
                    embeds: [surrenderEmbed],
                    components: []
                });
            }
        } catch (error) {
            console.error('Error updating surrender results:', error);
        }

        // Also update the interaction for the surrendering player
        await interaction.update({
            content: '🏳️ **You have surrendered the battle.**',
            embeds: [],
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

console.log('✅ Enhanced Turn-Based PvP System with High/Low Rarity Pages and Real-Time Public Updates fully loaded!');
console.log('🔥 High Rarity Page: Divine, Mythical, Legendary, Epic (4 dropdowns)');
console.log('⚡ Low Rarity Page: Rare, Uncommon, Common (3 dropdowns)');
console.log('📺 Real-Time Public Battle Screen: Everyone watches live selection progress');
console.log('🔒 Private Selection Interface: Only you see your dropdowns and page navigation');
console.log('📊 Benefits: Perfect organization, no character limits, fits Discord limits, transparency');

module.exports = enhancedTurnBasedPvP;
module.exports.PvPInteractionHandler = PvPInteractionHandler;
