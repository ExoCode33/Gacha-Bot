// src/systems/enhanced-turn-based-pvp.js - FIXED Complete Turn-Based PvP with Actual Battle Interface
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
        
        console.log('⚔️ Enhanced Turn-Based PvP System initialized with COMPLETE Battle Interface');
    }

    // FIXED: Custom ID parsing method
    parseCustomId(customId, expectedPrefix) {
        try {
            if (!customId.startsWith(expectedPrefix)) {
                return null;
            }

            const withoutPrefix = customId.replace(expectedPrefix, '');
            const parts = withoutPrefix.split('_');

            console.log(`🔧 Parsing custom ID: ${customId}`);
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

    // Generate battle ID
    generateBattleId() {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 5);
        return `${timestamp}_${randomId}`;
    }

    // Start a battle
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
            
            let battleData = this.activeBattles.get(battleId);
            
            if (!battleData && battleId.includes('_')) {
                const timestampPart = battleId.split('_')[0];
                for (const [storedBattleId, storedBattleData] of this.activeBattles) {
                    if (storedBattleId.startsWith(timestampPart)) {
                        battleData = storedBattleData;
                        battleId = storedBattleId;
                        break;
                    }
                }
            }
            
            if (!battleData) {
                return await interaction.reply({ 
                    content: `❌ Battle not found!`, 
                    flags: MessageFlags.Ephemeral
                });
            }

            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player) {
                return await interaction.reply({ 
                    content: `❌ Player not found in battle!`, 
                    flags: MessageFlags.Ephemeral
                });
            }

            const organizedFruits = this.organizeFruitsByRarity(player.fruits, selectionData.currentPage);
            const rarityFruits = organizedFruits[rarity] || [];
            const selectedValues = interaction.values || [];
            
            // Remove all fruits of this rarity from selection first
            selectionData.selectedFruits = selectionData.selectedFruits.filter(fruit => {
                return fruit.fruit_rarity !== rarity;
            });

            // Add newly selected fruits of this rarity
            selectedValues.forEach(value => {
                const parts = value.split('_');
                const fruitIndex = parseInt(parts[1]);
                const selectedFruit = rarityFruits[fruitIndex];
                
                if (selectedFruit && selectionData.selectedFruits.length < 5) {
                    const exists = selectionData.selectedFruits.find(f => f.fruit_name === selectedFruit.fruit_name);
                    if (!exists) {
                        selectionData.selectedFruits.push(selectedFruit);
                    }
                }
            });

            if (selectionData.selectedFruits.length > 5) {
                selectionData.selectedFruits = selectionData.selectedFruits.slice(0, 5);
            }

            selectionData.lastUpdate = Date.now();
            this.activeBattles.set(battleId, battleData);

            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);

            await interaction.update({
                embeds: [embed],
                components: components
            });

            await this.updatePublicBattleScreen(interaction, battleData);

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

    // Handle page switching
    async handlePageSwitch(interaction, battleId, userId) {
        try {
            let battleData = this.activeBattles.get(battleId);
            
            if (!battleData && battleId.includes('_')) {
                const timestampPart = battleId.split('_')[0];
                for (const [storedBattleId, storedBattleData] of this.activeBattles) {
                    if (storedBattleId.startsWith(timestampPart)) {
                        battleData = storedBattleData;
                        battleId = storedBattleId;
                        break;
                    }
                }
            }
            
            if (!battleData) {
                return await interaction.reply({ 
                    content: `❌ Battle not found!`, 
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

            selectionData.currentPage = selectionData.currentPage === 'high' ? 'low' : 'high';
            selectionData.lastUpdate = Date.now();
            this.activeBattles.set(battleId, battleData);

            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);

            await interaction.update({
                embeds: [embed],
                components: components
            });

            await this.updatePublicBattleScreen(interaction, battleData);

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
                    content: `❌ Battle not found!`, 
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
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await interaction.reply({ 
                    content: `❌ Battle not found!`, 
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

            selectionData.selectedFruits = [];
            selectionData.lastUpdate = Date.now();
            this.activeBattles.set(battleId, battleData);

            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);

            await interaction.update({
                embeds: [embed],
                components: components
            });

            await this.updatePublicBattleScreen(interaction, battleData);

        } catch (error) {
            console.error('Error clearing selection:', error);
        }
    }

    // FIXED: Reveal boss and start battle with proper interface
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
            .setFooter({ text: 'Click "Start Battle" to begin the turn-based combat!' })
            .setTimestamp();

        const startButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`start_battle_${battleData.id}`)
                    .setLabel('⚔️ Start Turn-Based Battle!')
                    .setStyle(ButtonStyle.Success)
            );

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    embeds: [bossEmbed],
                    components: [startButton]
                });
            } else {
                await interaction.update({
                    embeds: [bossEmbed],
                    components: [startButton]
                });
            }
        } catch (error) {
            console.error('Error revealing boss:', error);
            await interaction.followUp({
                embeds: [bossEmbed],
                components: [startButton]
            });
        }
    }

    // FIXED: Start the actual turn-based battle with COMPLETE interface
    async startTurnBasedBattle(interaction, battleData) {
        console.log(`⚔️ Starting COMPLETE turn-based battle interface for ${battleData.id}`);
        
        battleData.status = 'battle';
        
        // Initialize battle properly
        battleData.player1.hp = battleData.player1.maxHealth;
        battleData.player2.hp = battleData.player2.maxHealth;
        battleData.player1.effects = [];
        battleData.player2.effects = [];
        battleData.currentTurn = 1;
        
        battleData.battleLog = [];
        battleData.battleLog.push({
            type: 'battle_start',
            message: `⚔️ **BATTLE BEGINS!** ⚔️`,
            timestamp: Date.now(),
            turn: 0
        });

        // Determine first player
        const firstPlayer = Math.random() < 0.5 ? 'player1' : 'player2';
        battleData.currentPlayer = firstPlayer;
        
        const firstPlayerName = battleData[firstPlayer].username;
        battleData.battleLog.push({
            type: 'first_turn',
            message: `🎲 ${firstPlayerName} wins the dice roll and goes first!`,
            timestamp: Date.now(),
            turn: 0
        });
        
        this.activeBattles.set(battleData.id, battleData);

        // Show the ACTUAL battle interface with HP bars and skill selection
        await this.showBattleInterface(interaction, battleData);
    }

    // FIXED: Show main battle interface with HP bars and turn options
    async showBattleInterface(interaction, battleData) {
        const { player1, player2, currentTurn, currentPlayer, battleLog } = battleData;
        
        // Create HP bars
        const p1HPPercent = (player1.hp / player1.maxHealth) * 100;
        const p2HPPercent = (player2.hp / player2.maxHealth) * 100;
        
        const p1HPBar = this.createHPBar(p1HPPercent);
        const p2HPBar = this.createHPBar(p2HPPercent);

        // Get current player's available skills
        const currentPlayerData = battleData[currentPlayer];
        const isCurrentPlayerTurn = !battleData.isVsNPC || currentPlayer === 'player1';

        const embed = new EmbedBuilder()
            .setColor(currentPlayer === 'player1' ? 0x3498DB : 0xE74C3C)
            .setTitle(`⚔️ Turn ${currentTurn} - ${currentPlayerData.username}'s Turn`)
            .setDescription(this.getBattleDescription(battleData))
            .addFields([
                {
                    name: `🏴‍☠️ ${player1.username} ${player1.title ? `(${player1.title})` : ''}`,
                    value: [
                        `${p1HPBar}`,
                        `**HP**: ${player1.hp}/${player1.maxHealth} (${p1HPPercent.toFixed(1)}%)`,
                        `**CP**: ${player1.balancedCP.toLocaleString()}`,
                        `**Effects**: ${this.getEffectsString(player1.effects)}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: `${player2.isNPC ? player2.npcData.emoji : '🏴‍☠️'} ${player2.username} ${player2.title ? `(${player2.title})` : ''}`,
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
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    embeds: [embed],
                    components
                });
            } else {
                await interaction.reply({
                    embeds: [embed],
                    components
                });
            }
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

    // Get battle description with dramatic flair
    getBattleDescription(battleData) {
        const { currentTurn, player1, player2 } = battleData;
        
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
        
        // Process the attack
        await this.processAttack(interaction, battleData, currentPlayerData, ability, selectedFruit);
    }

    // Process an attack
    async processAttack(interaction, battleData, attacker, ability, fruit) {
        const defender = battleData.currentPlayer === 'player1' ? battleData.player2 : battleData.player1;
        
        // Simple damage calculation
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
        const recent = battleLog.slice(-5); // Last 5 entries
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
                
                const parts = customId.split('_');
                console.log(`🔍 Custom ID parts: ${JSON.stringify(parts)}`);
                
                const selectionIndex = parts.findIndex(part => part === 'selection');
                if (selectionIndex === -1 || selectionIndex + 3 >= parts.length) {
                    console.error(`❌ Invalid fruit selection custom ID format: ${customId}`);
                    return false;
                }
                
                const battleIdStart = selectionIndex + 1;
                const userIdIndex = parts.length - 2;
                const rarityIndex = parts.length - 1;
                
                const battleId = parts.slice(battleIdStart, userIdIndex).join('_');
                const userId = parts[userIdIndex];
                const rarity = parts[rarityIndex];
                
                console.log(`🔍 Extracted - Battle ID: "${battleId}", User ID: "${userId}", Rarity: "${rarity}"`);
                
                await pvpSystem.handleFruitSelection(interaction, battleId, userId, rarity);
                return true;
            }

            // Handle page switching
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

            // FIXED: Handle skill usage
            if (customId.startsWith('use_skill_')) {
                const parts = customId.split('_');
                if (parts.length >= 5) {
                    const battleId = parts.slice(2, -2).join('_'); // Everything between use_skill and last two parts
                    const userId = parts[parts.length - 2];
                    const skillIndex = parseInt(parts[parts.length - 1]);
                    
                    console.log(`🎯 Skill usage - Battle: ${battleId}, User: ${userId}, Skill: ${skillIndex}`);
                    await pvpSystem.handleSkillUsage(interaction, battleId, userId, skillIndex);
                    return true;
                }
                
                console.error(`❌ Failed to parse use_skill custom ID: ${customId}`);
                return false;
            }

            // Handle skill info view
            if (customId.startsWith('show_skills_')) {
                const parsed = pvpSystem.parseCustomId(customId, 'show_skills_');
                if (parsed) {
                    await this.showSkillDetails(interaction, parsed.battleId, parsed.userId, pvpSystem);
                    return true;
                }
                
                console.error(`❌ Failed to parse show_skills custom ID: ${customId}`);
                return false;
            }

            // Handle surrender
            if (customId.startsWith('surrender_')) {
                const parsed = pvpSystem.parseCustomId(customId, 'surrender_');
                if (parsed) {
                    await this.handleSurrender(interaction, parsed.battleId, parsed.userId, pvpSystem);
                    return true;
                }
                
                console.error(`❌ Failed to parse surrender custom ID: ${customId}`);
                return false;
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

    // Show detailed skill information
    static async showSkillDetails(interaction, battleId, userId, pvpSystem) {
        const battleData = pvpSystem.activeBattles.get(battleId);
        if (!battleData) return;

        const playerData = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        
        const skillsEmbed = new EmbedBuilder()
            .setColor(0x9932CC)
            .setTitle('📋 Your Devil Fruit Abilities')
            .setDescription('Detailed information about your selected fruits and their abilities')
            .setFooter({ text: 'Use these abilities strategically in battle!' });

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

    // Handle surrender
    static async handleSurrender(interaction, battleId, userId, pvpSystem) {
        const battleData = pvpSystem.activeBattles.get(battleId);
        if (!battleData) return;

        const surrenderingPlayer = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        const winner = surrenderingPlayer === battleData.player1 ? battleData.player2 : battleData.player1;

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
                        `**Turns Played**: ${battleData.currentTurn}`,
                        `**Battle Type**: ${battleData.isVsNPC ? 'PvE' : 'PvP'}`,
                        `**${surrenderingPlayer.username} HP**: ${surrenderingPlayer.hp}/${surrenderingPlayer.maxHealth}`,
                        `**${winner.username} HP**: ${winner.hp}/${winner.maxHealth}`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Sometimes retreat is the wisest strategy.' })
            .setTimestamp();

        await interaction.update({
            embeds: [surrenderEmbed],
            components: []
        });

        // Clean up battle
        pvpSystem.activeBattles.delete(battleId);
    }
}

// Create and export the enhanced singleton instance
const enhancedTurnBasedPvP = new EnhancedTurnBasedPvP();

// Set up cleanup interval
setInterval(() => {
    enhancedTurnBasedPvP.cleanupOldBattles();
}, 5 * 60 * 1000);

console.log('✅ Enhanced Turn-Based PvP System with COMPLETE Battle Interface loaded!');
console.log('✅ Features: Full HP bars, skill selection, turn-based combat, proper battle flow');

// Export both the main system and the interaction handler
module.exports = enhancedTurnBasedPvP;
module.exports.PvPInteractionHandler = PvPInteractionHandler;
module.exports.activeBattles = enhancedTurnBasedPvP.activeBattles;

// Also add to the main system for direct access
enhancedTurnBasedPvP.PvPInteractionHandler = PvPInteractionHandler;(interaction, battleData, attacker, defender);
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

        await interaction.editReply({
            embeds: [winnerEmbed],
            components: []
        });

        // Clean up
        this.activeBattles.delete(battleData.id);
    }

    // End battle by timeout
    async endBattleByTimeout(interaction, battleData) {
        const { player1, player2 } = battleData;
        const winner = player1.hp > player2.hp ? player1 : player2;
        const loser = winner === player1 ? player2 : player1;
        
        await this.endBattle
