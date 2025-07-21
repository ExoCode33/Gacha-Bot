// src/systems/pvp/pvp-queue-system.js - Enhanced Queue with Smart Matching and Fruit Selection
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../../database/manager');
const PvPBalanceSystem = require('../pvp-balance');
const { getRarityEmoji, getRarityColor } = require('../../data/devil-fruits');

// Import abilities safely
let balancedDevilFruitAbilities = {};
try {
    const abilitiesData = require('../../data/balanced-devil-fruit-abilities');
    balancedDevilFruitAbilities = abilitiesData.balancedDevilFruitAbilities || {};
} catch (error) {
    balancedDevilFruitAbilities = {};
}

class PvPQueueSystem {
    constructor(enhancedPvPSystem) {
        this.enhancedPvP = enhancedPvPSystem;
        this.queue = new Map(); // userId -> queueData
        this.queueTimers = new Map(); // userId -> timeoutId
        this.matchingTimers = new Map(); // userId -> timeoutId for matching attempts
        this.maxQueueSize = 20;
        this.queueTime = 2 * 60 * 1000; // 2 minutes
        this.matchingGraceTime = 15 * 1000; // 15 seconds to allow more players to queue
        this.cooldowns = new Map(); // userId -> lastBattleTime
        this.battleCooldown = 5 * 60 * 1000; // 5 minutes between battles
        this.selectionData = new Map(); // battleId -> selectionData
        
        console.log('🎯 Enhanced PvP Queue System initialized');
        console.log(`   - Max Queue Size: ${this.maxQueueSize} players`);
        console.log(`   - Queue Time: ${this.queueTime / 1000} seconds`);
        console.log(`   - Matching Grace: ${this.matchingGraceTime / 1000} seconds`);
    }

    // Join the matchmaking queue
    async joinQueue(interaction, fighter) {
        const userId = fighter.userId;
        const username = fighter.username;

        try {
            // Validation checks
            if (this.queue.size >= this.maxQueueSize) {
                return await interaction.reply({
                    content: `❌ Queue is full! (${this.queue.size}/${this.maxQueueSize} players)`,
                    ephemeral: true
                });
            }

            if (this.queue.has(userId)) {
                return await interaction.reply({
                    content: '⚔️ You are already in the queue!',
                    ephemeral: true
                });
            }

            if (this.enhancedPvP.getUserActiveBattle(userId)) {
                return await interaction.reply({
                    content: '⚔️ You already have an active battle!',
                    ephemeral: true
                });
            }

            if (this.isOnCooldown(userId)) {
                const remaining = this.getRemainingCooldown(userId);
                return await interaction.reply({
                    content: `⏰ Wait ${Math.ceil(remaining / 60000)} more minutes before joining.`,
                    ephemeral: true
                });
            }

            // Add to queue
            const queueData = {
                userId,
                username,
                fighter,
                joinTime: Date.now(),
                balancedCP: fighter.balancedCP,
                level: fighter.level,
                channelId: interaction.channel.id,
                guildId: interaction.guild?.id,
                interaction: interaction
            };

            this.queue.set(userId, queueData);
            await interaction.deferReply();

            console.log(`🎯 ${username} joined queue (${this.queue.size}/${this.maxQueueSize})`);

            // Start timer and matching process
            await this.startQueueProcess(queueData);

        } catch (error) {
            console.error('Error joining queue:', error);
            await this.safeReply(interaction, '❌ Error joining queue.');
        }
    }

    // Start the queue process with smart matching
    async startQueueProcess(queueData) {
        const { userId, fighter } = queueData;
        let timeRemaining = this.queueTime;
        
        // Initial check for immediate match if queue has 2+ players
        if (this.queue.size >= 2) {
            // Wait grace period for more players to join
            setTimeout(async () => {
                const match = await this.findBalancedMatch(fighter);
                if (match && this.queue.has(userId)) {
                    await this.startMatchedBattle(queueData, match);
                    return;
                }
            }, this.matchingGraceTime);
        }

        // Update timer every 5 seconds
        const updateInterval = 5000;
        await this.updateQueueEmbed(queueData, timeRemaining);

        const timerInterval = setInterval(async () => {
            timeRemaining -= updateInterval;

            if (!this.queue.has(userId)) {
                clearInterval(timerInterval);
                return;
            }

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                await this.handleQueueTimeout(queueData);
            } else {
                // Try matching every 30 seconds after grace period
                if (timeRemaining % 30000 === 0 && timeRemaining < (this.queueTime - this.matchingGraceTime)) {
                    const match = await this.findBalancedMatch(fighter);
                    if (match) {
                        clearInterval(timerInterval);
                        await this.startMatchedBattle(queueData, match);
                        return;
                    }
                }
                await this.updateQueueEmbed(queueData, timeRemaining);
            }
        }, updateInterval);

        this.queueTimers.set(userId, timerInterval);
    }

    // Update queue countdown embed
    async updateQueueEmbed(queueData, timeRemaining) {
        const { username, fighter, interaction } = queueData;
        const secondsLeft = Math.ceil(timeRemaining / 1000);
        const progress = ((this.queueTime - timeRemaining) / this.queueTime) * 100;
        
        const progressBars = 20;
        const filledBars = Math.floor((progress / 100) * progressBars);
        const emptyBars = progressBars - filledBars;
        const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

        const embed = new EmbedBuilder()
            .setColor(progress < 50 ? 0x3498DB : progress < 80 ? 0xF39C12 : 0xE74C3C)
            .setTitle('🎯 PvP Queue - Searching for Opponents')
            .setDescription(
                `**${username}** is searching for a balanced fight!\n\n` +
                `${progressBar}\n` +
                `⏰ **Time Remaining**: ${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}\n` +
                `👥 **Players in Queue**: ${this.queue.size}/${this.maxQueueSize}`
            )
            .addFields([
                {
                    name: '🏴‍☠️ Your Stats',
                    value: [
                        `**Name**: ${fighter.username}`,
                        `**Level**: ${fighter.level}`,
                        `**CP**: ${fighter.balancedCP.toLocaleString()}`,
                        `**HP**: ${fighter.maxHealth}`,
                        `**Fruits**: ${fighter.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎯 Matchmaking',
                    value: [
                        `**Search Range**: ${Math.floor(fighter.balancedCP * 0.7).toLocaleString()} - ${Math.floor(fighter.balancedCP * 1.3).toLocaleString()} CP`,
                        `**Fallback**: Boss battle if no match`,
                        `**Status**: ${secondsLeft > 90 ? 'Finding opponents...' : 'Preparing boss battle...'}`,
                        `**Queue Position**: ${Array.from(this.queue.keys()).indexOf(queueData.userId) + 1}`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Enhanced Turn-Based PvP with Fruit Selection' })
            .setTimestamp();

        const leaveButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`leave_queue_${queueData.userId}`)
                    .setLabel('🚪 Leave Queue')
                    .setStyle(ButtonStyle.Danger)
            );

        try {
            await interaction.editReply({
                embeds: [embed],
                components: [leaveButton]
            });
        } catch (error) {
            console.error('Error updating queue embed:', error);
            this.removeFromQueue(queueData.userId);
        }
    }

    // Find balanced match from queue
    async findBalancedMatch(playerFighter) {
        const playerCP = playerFighter.balancedCP;
        const minCP = Math.floor(playerCP * 0.7);
        const maxCP = Math.floor(playerCP * 1.3);

        for (const [opponentId, opponentData] of this.queue) {
            if (opponentId === playerFighter.userId) continue;

            const opponentCP = opponentData.fighter.balancedCP;
            
            if (opponentCP >= minCP && opponentCP <= maxCP) {
                console.log(`🎯 Match found! ${playerFighter.username} vs ${opponentData.username}`);
                return opponentData;
            }
        }

        return null;
    }

    // Start matched battle with fruit selection
    async startMatchedBattle(player1Data, player2Data) {
        const { userId: userId1, fighter: fighter1, interaction: interaction1 } = player1Data;
        const { userId: userId2, fighter: fighter2, interaction: interaction2 } = player2Data;

        console.log(`⚔️ Starting PvP: ${fighter1.username} vs ${fighter2.username}`);

        // Remove from queue and set cooldowns
        this.removeFromQueue(userId1);
        this.removeFromQueue(userId2);
        this.setCooldown(userId1);
        this.setCooldown(userId2);

        try {
            // Create battle ID and selection data
            const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            this.selectionData.set(battleId, {
                player1: {
                    userId: userId1,
                    fighter: fighter1,
                    selectedFruits: [],
                    currentPage: 'high',
                    selectionComplete: false
                },
                player2: {
                    userId: userId2,
                    fighter: fighter2,
                    selectedFruits: [],
                    currentPage: 'high',
                    selectionComplete: false
                },
                isVsNPC: false,
                battleId: battleId
            });

            // Show match found embed
            const matchEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎯 MATCH FOUND!')
                .setDescription(`**${fighter1.username}** vs **${fighter2.username}**\n\nStarting fruit selection...`)
                .addFields([
                    {
                        name: '🏴‍☠️ Player 1',
                        value: [
                            `**${fighter1.username}**`,
                            `Level: ${fighter1.level}`,
                            `CP: ${fighter1.balancedCP.toLocaleString()}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🏴‍☠️ Player 2',
                        value: [
                            `**${fighter2.username}**`,
                            `Level: ${fighter2.level}`,
                            `CP: ${fighter2.balancedCP.toLocaleString()}`
                        ].join('\n'),
                        inline: true
                    }
                ])
                .setFooter({ text: 'Both players will receive private fruit selection interfaces!' })
                .setTimestamp();

            await interaction1.editReply({ embeds: [matchEmbed], components: [] });
            
            // Send private selection interfaces
            await this.sendFruitSelection(interaction1, fighter1, battleId);
            await this.sendFruitSelection(interaction2, fighter2, battleId);

        } catch (error) {
            console.error('Error starting matched battle:', error);
            await this.safeEditReply(interaction1, '❌ Failed to start battle.');
        }
    }

    // Handle queue timeout - start boss battle
    async handleQueueTimeout(queueData) {
        const { userId, fighter, interaction } = queueData;

        console.log(`⏰ Queue timeout for ${queueData.username} - starting boss battle`);

        this.removeFromQueue(userId);
        this.setCooldown(userId);

        try {
            // Create battle ID for boss battle
            const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            this.selectionData.set(battleId, {
                player1: {
                    userId: userId,
                    fighter: fighter,
                    selectedFruits: [],
                    currentPage: 'high',
                    selectionComplete: false
                },
                player2: {
                    userId: 'npc_boss',
                    fighter: null,
                    selectedFruits: [],
                    currentPage: 'high',
                    selectionComplete: true
                },
                isVsNPC: true,
                battleId: battleId
            });

            const bossEmbed = new EmbedBuilder()
                .setColor(0xFF8000)
                .setTitle('🤖 No Match Found - Boss Battle!')
                .setDescription(`No suitable opponent found. You'll face a mysterious boss!\n\nPreparing fruit selection...`)
                .addFields([
                    {
                        name: '🏴‍☠️ Your Stats',
                        value: [
                            `**Name**: ${fighter.username}`,
                            `**Level**: ${fighter.level}`,
                            `**CP**: ${fighter.balancedCP.toLocaleString()}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🤖 Boss Battle',
                        value: [
                            `**Type**: PvE`,
                            `**Difficulty**: Balanced`,
                            `**Rewards**: Berries for victory`
                        ].join('\n'),
                        inline: true
                    }
                ]);

            await interaction.editReply({ embeds: [bossEmbed], components: [] });
            
            // Send fruit selection
            await this.sendFruitSelection(interaction, fighter, battleId);

        } catch (error) {
            console.error('Error starting boss battle:', error);
            await this.safeEditReply(interaction, '❌ Failed to start boss battle.');
        }
    }

    // Send fruit selection interface
    async sendFruitSelection(interaction, fighter, battleId) {
        try {
            const selectionData = this.selectionData.get(battleId);
            const playerKey = fighter.userId === selectionData.player1.userId ? 'player1' : 'player2';
            const playerData = selectionData[playerKey];

            const embed = this.createSelectionEmbed(fighter, playerData, selectionData.isVsNPC);
            const components = await this.createSelectionComponents(fighter, playerData, battleId);

            await interaction.followUp({
                content: `🔒 **Private Fruit Selection** - Choose your 5 battle fruits!\n*Battle ID: \`${battleId}\`*`,
                embeds: [embed],
                components: components,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error sending fruit selection:', error);
        }
    }

    // Create selection embed
    createSelectionEmbed(fighter, playerData, isVsNPC) {
        const selectedCount = playerData.selectedFruits.length;
        const currentPage = playerData.currentPage;
        
        return new EmbedBuilder()
            .setColor(selectedCount === 5 ? 0x00FF00 : 0x3498DB)
            .setTitle(`🔒 Fruit Selection - ${currentPage === 'high' ? 'High' : 'Low'} Rarity Page`)
            .setDescription(
                `**Progress: ${selectedCount}/5 fruits selected**\n\n` +
                (selectedCount === 5 ? 
                    '✅ **Perfect! Click Confirm to start battle!**' : 
                    `🔄 **Select ${5 - selectedCount} more fruits.**`)
            )
            .addFields([
                {
                    name: '🏴‍☠️ Your Stats',
                    value: [
                        `**Name**: ${fighter.username}`,
                        `**Level**: ${fighter.level}`,
                        `**CP**: ${fighter.balancedCP.toLocaleString()}`,
                        `**Available Fruits**: ${fighter.fruits.length}`
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
    }

    // Create selection components
    async createSelectionComponents(fighter, playerData, battleId) {
        const components = [];
        const selectedCount = playerData.selectedFruits.length;
        const currentPage = playerData.currentPage;
        const selectedNames = new Set(playerData.selectedFruits.map(f => f.fruit_name));

        const organizedFruits = this.organizeFruitsByRarity(fighter.fruits, currentPage);

        // Create dropdowns based on current page
        const rarities = currentPage === 'high' ? 
            ['divine', 'mythical', 'legendary', 'epic'] : 
            ['rare', 'uncommon', 'common'];

        rarities.forEach(rarity => {
            if (organizedFruits[rarity].length > 0) {
                const options = organizedFruits[rarity].slice(0, 25).map((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    const isSelected = selectedNames.has(fruit.fruit_name);
                    
                    return {
                        label: `${isSelected ? '✅ ' : ''}${fruit.fruit_name.slice(0, 20)}`,
                        description: `${damage}dmg • ${ability?.name || 'Power'}`,
                        value: `${rarity}_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                        emoji: getRarityEmoji(rarity),
                        default: isSelected
                    };
                });

                const menu = new StringSelectMenuBuilder()
                    .setCustomId(`fruit_selection_${battleId}_${fighter.userId}_${rarity}`)
                    .setPlaceholder(`${getRarityEmoji(rarity)} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)} (${organizedFruits[rarity].length})`)
                    .setMinValues(0)
                    .setMaxValues(Math.min(5, options.length))
                    .addOptions(options);

                components.push(new ActionRowBuilder().addComponents(menu));
            }
        });

        // Add action buttons
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`page_switch_${battleId}_${fighter.userId}`)
                    .setLabel(currentPage === 'high' ? '⚡ Low Rarity Page' : '🔥 High Rarity Page')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`confirm_selection_${battleId}_${fighter.userId}`)
                    .setLabel(selectedCount === 5 ? '⚔️ Confirm & Battle!' : `✅ Confirm (${selectedCount}/5)`)
                    .setStyle(selectedCount === 5 ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(selectedCount !== 5),
                new ButtonBuilder()
                    .setCustomId(`clear_selection_${battleId}_${fighter.userId}`)
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
                fruitGroups.set(fruitName, { ...fruit, count: 1 });
            }
        });

        const organized = {
            divine: [], mythical: [], legendary: [], epic: [],
            rare: [], uncommon: [], common: []
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

    // Handle fruit selection interactions
    async handleFruitSelection(interaction, battleId, userId, rarity) {
        try {
            const selectionData = this.selectionData.get(battleId);
            if (!selectionData) return false;

            const playerKey = userId === selectionData.player1.userId ? 'player1' : 'player2';
            const playerData = selectionData[playerKey];
            const fighter = playerData.fighter;

            const organizedFruits = this.organizeFruitsByRarity(fighter.fruits, playerData.currentPage);
            const rarityFruits = organizedFruits[rarity] || [];
            const selectedValues = interaction.values || [];
            
            // Remove all fruits of this rarity from selection first
            playerData.selectedFruits = playerData.selectedFruits.filter(fruit => {
                return fruit.fruit_rarity !== rarity;
            });

            // Add newly selected fruits of this rarity
            selectedValues.forEach(value => {
                const parts = value.split('_');
                const fruitIndex = parseInt(parts[1]);
                const selectedFruit = rarityFruits[fruitIndex];
                
                if (selectedFruit && playerData.selectedFruits.length < 5) {
                    const exists = playerData.selectedFruits.find(f => f.fruit_name === selectedFruit.fruit_name);
                    if (!exists) {
                        playerData.selectedFruits.push(selectedFruit);
                    }
                }
            });

            if (playerData.selectedFruits.length > 5) {
                playerData.selectedFruits = playerData.selectedFruits.slice(0, 5);
            }

            const embed = this.createSelectionEmbed(fighter, playerData, selectionData.isVsNPC);
            const components = await this.createSelectionComponents(fighter, playerData, battleId);

            await interaction.update({
                embeds: [embed],
                components: components
            });

            return true;

        } catch (error) {
            console.error('Error in handleFruitSelection:', error);
            return false;
        }
    }

    // Handle page switch
    async handlePageSwitch(interaction, battleId, userId) {
        try {
            const selectionData = this.selectionData.get(battleId);
            if (!selectionData) return false;

            const playerKey = userId === selectionData.player1.userId ? 'player1' : 'player2';
            const playerData = selectionData[playerKey];
            const fighter = playerData.fighter;

            playerData.currentPage = playerData.currentPage === 'high' ? 'low' : 'high';

            const embed = this.createSelectionEmbed(fighter, playerData, selectionData.isVsNPC);
            const components = await this.createSelectionComponents(fighter, playerData, battleId);

            await interaction.update({
                embeds: [embed],
                components: components
            });

            return true;

        } catch (error) {
            console.error('Error in handlePageSwitch:', error);
            return false;
        }
    }

    // Handle confirm selection
    async handleConfirmSelection(interaction, battleId, userId) {
        try {
            const selectionData = this.selectionData.get(battleId);
            if (!selectionData) return false;

            const playerKey = userId === selectionData.player1.userId ? 'player1' : 'player2';
            const playerData = selectionData[playerKey];

            if (playerData.selectedFruits.length !== 5) {
                return await interaction.reply({
                    content: `❌ You must select exactly 5 fruits! Currently: ${playerData.selectedFruits.length}`,
                    ephemeral: true
                });
            }

            playerData.selectionComplete = true;

            // Check if all players ready
            const allReady = selectionData.player1.selectionComplete && selectionData.player2.selectionComplete;

            if (allReady) {
                // Start the enhanced battle
                await this.startEnhancedBattle(interaction, selectionData);
            } else {
                await interaction.update({
                    content: '✅ Fruits selected! Waiting for opponent...',
                    embeds: [],
                    components: []
                });
            }

            return true;

        } catch (error) {
            console.error('Error in handleConfirmSelection:', error);
            return false;
        }
    }

    // Handle clear selection
    async handleClearSelection(interaction, battleId, userId) {
        try {
            const selectionData = this.selectionData.get(battleId);
            if (!selectionData) return false;

            const playerKey = userId === selectionData.player1.userId ? 'player1' : 'player2';
            const playerData = selectionData[playerKey];
            const fighter = playerData.fighter;

            playerData.selectedFruits = [];

            const embed = this.createSelectionEmbed(fighter, playerData, selectionData.isVsNPC);
            const components = await this.createSelectionComponents(fighter, playerData, battleId);

            await interaction.update({
                embeds: [embed],
                components: components
            });

            return true;

        } catch (error) {
            console.error('Error in handleClearSelection:', error);
            return false;
        }
    }

    // Start enhanced battle after fruit selection
    async startEnhancedBattle(interaction, selectionData) {
        try {
            const { player1, player2, isVsNPC, battleId } = selectionData;
            
            // Set selected fruits on fighters
            player1.fighter.selectedFruits = player1.selectedFruits;
            if (!isVsNPC) {
                player2.fighter.selectedFruits = player2.selectedFruits;
            }

            console.log(`⚔️ Starting enhanced battle: ${battleId}`);

            // Start the enhanced PvP battle
            await this.enhancedPvP.startBattle(
                interaction, 
                player1.fighter, 
                isVsNPC ? null : player2.fighter
            );

            // Clean up selection data
            this.selectionData.delete(battleId);

        } catch (error) {
            console.error('Error starting enhanced battle:', error);
            await this.safeReply(interaction, '❌ Failed to start battle.');
        }
    }

    // Leave queue
    async leaveQueue(interaction, userId) {
        if (!this.queue.has(userId)) {
            return await interaction.reply({
                content: '❌ You are not in the queue.',
                ephemeral: true
            });
        }

        const queueData = this.queue.get(userId);
        this.removeFromQueue(userId);

        const embed = new EmbedBuilder()
            .setColor(0xFF8000)
            .setTitle('🚪 Left Queue')
            .setDescription(`**${queueData.username}** left the queue.`)
            .addFields([
                {
                    name: '📊 Queue Status',
                    value: [
                        `**Players**: ${this.queue.size}/${this.maxQueueSize}`,
                        `**Your Status**: Not in queue`,
                        `**Time**: ${Math.floor((Date.now() - queueData.joinTime) / 1000)}s`
                    ].join('\n'),
                    inline: true
                }
            ]);

        await interaction.update({ embeds: [embed], components: [] });
    }

    // Remove player from queue
    removeFromQueue(userId) {
        if (this.queue.has(userId)) {
            this.queue.delete(userId);
            
            if (this.queueTimers.has(userId)) {
                clearInterval(this.queueTimers.get(userId));
                this.queueTimers.delete(userId);
            }
            
            console.log(`🚪 ${userId} removed from queue. Size: ${this.queue.size}`);
        }
    }

    // Cooldown management
    isOnCooldown(userId) {
        if (!this.cooldowns.has(userId)) return false;
        const lastBattle = this.cooldowns.get(userId);
        return (Date.now() - lastBattle) < this.battleCooldown;
    }

    getRemainingCooldown(userId) {
        if (!this.cooldowns.has(userId)) return 0;
        const lastBattle = this.cooldowns.get(userId);
        const elapsed = Date.now() - lastBattle;
        return Math.max(0, this.battleCooldown - elapsed);
    }

    setCooldown(userId) {
        this.cooldowns.set(userId, Date.now());
    }

    // Queue statistics
    getQueueStats() {
        const players = Array.from(this.queue.values());
        const cpValues = players.map(p => p.balancedCP);
        
        return {
            size: this.queue.size,
            maxSize: this.maxQueueSize,
            averageCP: cpValues.length > 0 ? Math.floor(cpValues.reduce((a, b) => a + b, 0) / cpValues.length) : 0,
            minCP: cpValues.length > 0 ? Math.min(...cpValues) : 0,
            maxCP: cpValues.length > 0 ? Math.max(...cpValues) : 0,
            averageWaitTime: players.length > 0 ? Math.floor(players.reduce((sum, p) => sum + (Date.now() - p.joinTime), 0) / players.length / 1000) : 0
        };
    }

    // Cleanup old data
    cleanup() {
        const now = Date.now();
        const maxWaitTime = 10 * 60 * 1000; // 10 minutes
        
        // Clean old queue entries
        let queueCleaned = 0;
        for (const [userId, queueData] of this.queue) {
            if (now - queueData.joinTime > maxWaitTime) {
                this.removeFromQueue(userId);
                queueCleaned++;
            }
        }
        
        // Clean old cooldowns
        let cooldownsCleaned = 0;
        for (const [userId, lastBattle] of this.cooldowns) {
            if (now - lastBattle > this.battleCooldown * 2) {
                this.cooldowns.delete(userId);
                cooldownsCleaned++;
            }
        }

        // Clean old selection data
        let selectionCleaned = 0;
        for (const [battleId, selectionData] of this.selectionData) {
            // Clean selection data older than 30 minutes
            if (now - parseInt(battleId.split('_')[1]) > 30 * 60 * 1000) {
                this.selectionData.delete(battleId);
                selectionCleaned++;
            }
        }
        
        if (queueCleaned > 0 || cooldownsCleaned > 0 || selectionCleaned > 0) {
            console.log(`🧹 Cleanup: ${queueCleaned} queue, ${cooldownsCleaned} cooldowns, ${selectionCleaned} selections`);
        }
    }

    // Helper methods
    async safeReply(interaction, content) {
        try {
            if (interaction.replied || interaction.deferred) {
                return await interaction.followUp({ content, ephemeral: true });
            } else {
                return await interaction.reply({ content, ephemeral: true });
            }
        } catch (error) {
            console.error('Error in safe reply:', error);
        }
    }

    async safeEditReply(interaction, content) {
        try {
            return await interaction.editReply(typeof content === 'string' ? { content } : content);
        } catch (error) {
            console.error('Error in safe edit reply:', error);
        }
    }
}

module.exports = PvPQueueSystem;
