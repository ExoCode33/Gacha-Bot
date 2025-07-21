// src/systems/pvp/enhanced-turn-based-pvp.js - COMPLETE WORKING VERSION
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const DatabaseManager = require('../../database/manager');
const { getRarityEmoji, getRarityColor } = require('../../data/devil-fruits');

// Import abilities safely
let balancedDevilFruitAbilities = {};
let statusEffects = {};

try {
    const abilitiesData = require('../../data/balanced-devil-fruit-abilities');
    balancedDevilFruitAbilities = abilitiesData.balancedDevilFruitAbilities || {};
    statusEffects = abilitiesData.statusEffects || {};
} catch (error) {
    console.log('⚠️ Abilities not found, using defaults');
    balancedDevilFruitAbilities = {};
    statusEffects = {};
}

class EnhancedTurnBasedPvP {
    constructor() {
        this.activeBattles = new Map();
        this.battleTimeouts = new Map();
        this.BATTLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
        this.TURN_TIMEOUT = 60 * 1000; // 1 minute per turn
        this.SELECTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes for fruit selection
        
        // Start cleanup interval
        this.startCleanupInterval();
    }

    startCleanupInterval() {
        setInterval(() => {
            try {
                this.cleanupExpiredBattles();
            } catch (error) {
                console.error('Error in PvP cleanup:', error);
            }
        }, 60000); // Check every minute
    }

    cleanupExpiredBattles() {
        const now = Date.now();
        for (const [battleId, battle] of this.activeBattles.entries()) {
            if (battle.lastActivity && (now - battle.lastActivity) > this.BATTLE_TIMEOUT) {
                this.endBattle(battleId, 'timeout');
                console.log(`🧹 Cleaned up expired battle: ${battleId}`);
            }
        }
    }

    // Safe interaction helpers
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
            console.error('Error in safeReply:', error);
            return null;
        }
    }

    async safeUpdate(interaction, payload) {
        try {
            if (interaction.deferred || interaction.replied) {
                return await interaction.editReply(payload);
            } else {
                return await interaction.update(payload);
            }
        } catch (error) {
            console.error('Error in safeUpdate:', error);
            return null;
        }
    }

    // Main battle initiation
    async initiateBattle(interaction, targetUser) {
        try {
            const challenger = interaction.user;
            const target = targetUser;

            // Validation checks
            if (challenger.id === target.id) {
                return await this.safeReply(interaction, '❌ You cannot challenge yourself to a battle!', true);
            }

            // Check if users are already in battles
            const existingBattle = this.findUserBattle(challenger.id) || this.findUserBattle(target.id);
            if (existingBattle) {
                return await this.safeReply(interaction, '❌ One of the users is already in a battle!', true);
            }

            // Get user data from database
            await DatabaseManager.ensureUser(challenger.id, challenger.username);
            await DatabaseManager.ensureUser(target.id, target.username);
            
            const challengerData = await DatabaseManager.getUser(challenger.id);
            const targetData = await DatabaseManager.getUser(target.id);

            if (!challengerData || !targetData) {
                return await this.safeReply(interaction, '❌ Both players must be registered in the game!', true);
            }

            // Get user fruits
            const challengerFruits = await DatabaseManager.getUserDevilFruits(challenger.id);
            const targetFruits = await DatabaseManager.getUserDevilFruits(target.id);

            if (challengerFruits.length === 0 || targetFruits.length === 0) {
                return await this.safeReply(interaction, '❌ Both players must have at least 1 Devil Fruit to battle!', true);
            }

            // Create battle invitation
            const battleId = `${challenger.id}_${target.id}_${Date.now()}`;
            const embed = new EmbedBuilder()
                .setTitle('⚔️ Enhanced Turn-Based PvP Challenge!')
                .setDescription(`${challenger.username} has challenged ${target.username} to an enhanced turn-based battle!`)
                .addFields([
                    { 
                        name: `🏴‍☠️ ${challenger.username}`, 
                        value: [
                            `**Level**: ${challengerData.level || 0}`,
                            `**Total CP**: ${challengerData.total_cp?.toLocaleString() || 0}`,
                            `**Fruits**: ${challengerFruits.length}`
                        ].join('\n'), 
                        inline: true 
                    },
                    { 
                        name: `🏴‍☠️ ${target.username}`, 
                        value: [
                            `**Level**: ${targetData.level || 0}`,
                            `**Total CP**: ${targetData.total_cp?.toLocaleString() || 0}`,
                            `**Fruits**: ${targetFruits.length}`
                        ].join('\n'), 
                        inline: true 
                    },
                    {
                        name: '⚔️ Battle Type',
                        value: '🎯 **Enhanced Turn-Based Combat**\n• Choose 5 fruits for battle\n• Turn-based skill combat\n• Strategic depth and timing',
                        inline: false
                    }
                ])
                .setColor(0x3498DB)
                .setFooter({ text: 'Accept to enter fruit selection phase!' })
                .setTimestamp();

            const acceptButton = new ButtonBuilder()
                .setCustomId(`accept_enhanced_battle_${battleId}`)
                .setLabel('⚔️ Accept Battle')
                .setStyle(ButtonStyle.Success);

            const declineButton = new ButtonBuilder()
                .setCustomId(`decline_enhanced_battle_${battleId}`)
                .setLabel('❌ Decline')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);

            // Store battle invitation
            this.activeBattles.set(battleId, {
                type: 'invitation',
                challenger: { ...challengerData, fruits: challengerFruits },
                target: { ...targetData, fruits: targetFruits },
                channelId: interaction.channel.id,
                createdAt: Date.now(),
                lastActivity: Date.now()
            });

            // Set timeout for invitation
            this.battleTimeouts.set(battleId, setTimeout(() => {
                this.endBattle(battleId, 'invitation_timeout');
            }, 60000)); // 1 minute to accept

            await this.safeReply(interaction, null, false, [embed], [row]);

        } catch (error) {
            console.error('Error initiating enhanced battle:', error);
            await this.safeReply(interaction, '❌ An error occurred while initiating the battle.', true);
        }
    }

    // Handle battle response (accept/decline)
    async handleBattleResponse(interaction) {
        try {
            const parts = interaction.customId.split('_');
            const action = parts[0]; // accept or decline
            const battleId = parts.slice(3).join('_'); // everything after "enhanced_battle_"
            
            const battle = this.activeBattles.get(battleId);

            if (!battle || battle.type !== 'invitation') {
                return await this.safeReply(interaction, '❌ This battle invitation has expired.', true);
            }

            // Only the target can respond
            if (interaction.user.id !== battle.target.user_id) {
                return await this.safeReply(interaction, '❌ Only the challenged player can respond to this invitation.', true);
            }

            if (action === 'decline') {
                await this.endBattle(battleId, 'declined');
                return await this.safeUpdate(interaction, { 
                    content: `❌ ${battle.target.username} declined the battle challenge.`, 
                    embeds: [], 
                    components: [] 
                });
            }

            if (action === 'accept') {
                await this.startFruitSelection(interaction, battleId);
            }

        } catch (error) {
            console.error('Error handling enhanced battle response:', error);
            await this.safeReply(interaction, '❌ An error occurred while processing the battle response.', true);
        }
    }

    // Start fruit selection phase
    async startFruitSelection(interaction, battleId) {
        try {
            const battle = this.activeBattles.get(battleId);
            
            // Calculate balanced CP for both players
            const player1BalancedCP = Math.floor(battle.challenger.total_cp * 0.8);
            const player2BalancedCP = Math.floor(battle.target.total_cp * 0.8);
            
            // Update battle state for fruit selection
            const battleData = {
                id: battleId,
                type: 'fruit_selection',
                status: 'fruit_selection',
                player1: {
                    userId: battle.challenger.user_id,
                    username: battle.challenger.username,
                    level: battle.challenger.level || 0,
                    fruits: battle.challenger.fruits || [],
                    balancedCP: player1BalancedCP,
                    maxHealth: 200 + (battle.challenger.level * 10),
                    selectedFruits: []
                },
                player2: {
                    userId: battle.target.user_id,
                    username: battle.target.username,
                    level: battle.target.level || 0,
                    fruits: battle.target.fruits || [],
                    balancedCP: player2BalancedCP,
                    maxHealth: 200 + (battle.target.level * 10),
                    selectedFruits: []
                },
                selectionData: {
                    player1: { selectedFruits: [], selectionComplete: false, currentPage: 'high', lastUpdate: Date.now() },
                    player2: { selectedFruits: [], selectionComplete: false, currentPage: 'high', lastUpdate: Date.now() }
                },
                isVsNPC: false,
                channelId: battle.channelId,
                createdAt: Date.now(),
                lastActivity: Date.now()
            };

            this.activeBattles.set(battleId, battleData);

            // Clear invitation timeout
            if (this.battleTimeouts.has(battleId)) {
                clearTimeout(this.battleTimeouts.get(battleId));
                this.battleTimeouts.delete(battleId);
            }

            // Create public selection screen
            const publicEmbed = this.createPublicSelectionScreen(battleData);
            await this.safeUpdate(interaction, {
                embeds: [publicEmbed],
                components: []
            });

            // Send private selection interfaces
            await this.sendPrivateSelection(interaction, battleData, battleData.player1);
            await this.sendPrivateSelection(interaction, battleData, battleData.player2);

            // Set selection timeout
            this.battleTimeouts.set(battleId, setTimeout(() => {
                this.endBattle(battleId, 'selection_timeout');
            }, this.SELECTION_TIMEOUT));

        } catch (error) {
            console.error('Error starting fruit selection:', error);
            await this.safeUpdate(interaction, { 
                content: '❌ An error occurred while starting fruit selection.', 
                embeds: [], 
                components: [] 
            });
        }
    }

    // Create public selection screen
    createPublicSelectionScreen(battleData) {
        const { player1, player2, selectionData } = battleData;
        
        const p1Progress = this.getSelectionProgress(selectionData.player1.selectedFruits.length);
        const p2Progress = this.getSelectionProgress(selectionData.player2.selectedFruits.length);
        
        const p1Status = selectionData.player1.selectionComplete ? '✅ Ready' : 
                        selectionData.player1.selectedFruits.length === 5 ? '⏳ Confirming' : 
                        `⏳ Selecting fruits...`;
                        
        const p2Status = selectionData.player2.selectionComplete ? '✅ Ready' :
                        selectionData.player2.selectedFruits.length === 5 ? '⏳ Confirming' :
                        `⏳ Selecting fruits...`;

        const p1RarityBreakdown = this.getRarityBreakdown(selectionData.player1.selectedFruits);
        const p2RarityBreakdown = this.getRarityBreakdown(selectionData.player2.selectedFruits);

        return new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('⚔️ Enhanced Turn-Based Battle - Fruit Selection')
            .setDescription(`🔥 **Players are selecting their battle fruits!**\n*Battle ID: \`${battleData.id}\`*`)
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
                    name: `🏴‍☠️ ${player2.username}`,
                    value: [
                        `${p2Progress} **${selectionData.player2.selectedFruits.length}/5 fruits**`,
                        `**Status**: ${p2Status}`,
                        `**Level**: ${player2.level} | **CP**: ${player2.balancedCP.toLocaleString()}`,
                        `**Selection**: ${p2RarityBreakdown}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🎯 Battle Information',
                    value: [
                        `**Battle Type**: Enhanced Turn-Based PvP`,
                        `**Selection System**: 5 fruits each player`,
                        `**Combat**: Turn-based with abilities`,
                        `**Time Limit**: 5 minutes for selection`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Enhanced Turn-Based Combat - Watch the selection!' })
            .setTimestamp();
    }

    // Send private selection interface
    async sendPrivateSelection(interaction, battleData, player) {
        try {
            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);
            
            await interaction.followUp({
                content: `🔒 **${player.username}'s Private Selection** - Choose your 5 battle fruits!\n*Battle ID: \`${battleData.id}\`*`,
                embeds: [embed],
                components: components,
                flags: MessageFlags.Ephemeral
            });
            
        } catch (error) {
            console.error('Error sending private selection:', error);
        }
    }

    // Create private selection embed
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

    // Create private selection components
    async createPrivateSelectionComponents(battleData, player) {
        const components = [];
        const playerKey = player.userId === battleData.player1.userId ? 'player1' : 'player2';
        const selectionData = battleData.selectionData[playerKey];
        const selectedCount = selectionData.selectedFruits.length;
        const currentPage = selectionData.currentPage;

        // Fruit selection dropdown
        const organizedFruits = this.organizeFruitsByRarity(player.fruits);
        const pageRarities = currentPage === 'high' ? 
            ['divine', 'mythical', 'legendary', 'epic'] : 
            ['rare', 'uncommon', 'common'];

        // Create dropdown options for available fruits
        const options = [];
        pageRarities.forEach(rarity => {
            const fruitsOfRarity = organizedFruits[rarity] || [];
            fruitsOfRarity.forEach(fruit => {
                // Check if fruit is already selected
                const alreadySelected = selectionData.selectedFruits.some(
                    selected => selected.fruit_name === fruit.fruit_name
                );
                
                if (!alreadySelected && options.length < 25) { // Discord limit
                    const emoji = getRarityEmoji(rarity);
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                    const damage = ability ? ability.damage : 100;
                    
                    options.push({
                        label: fruit.fruit_name.slice(0, 100), // Discord limit
                        value: `select_fruit_${battleData.id}_${player.userId}_${fruit.id}`,
                        description: `${rarity} - ${damage} damage`.slice(0, 100),
                        emoji: emoji
                    });
                }
            });
        });

        if (options.length > 0) {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`fruit_selection_${battleData.id}_${player.userId}`)
                .setPlaceholder(`Choose from ${currentPage} rarity fruits...`)
                .addOptions(options.slice(0, 25)); // Discord limit

            const selectRow = new ActionRowBuilder().addComponents(selectMenu);
            components.push(selectRow);
        }

        // Action buttons row
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`page_switch_${battleData.id}_${player.userId}`)
                    .setLabel(currentPage === 'high' ? '⚡ Switch to Low Rarity' : '🔥 Switch to High Rarity')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`confirm_selection_${battleData.id}_${player.userId}`)
                    .setLabel(selectedCount === 5 ? '⚔️ Confirm & Ready!' : `✅ Confirm (${selectedCount}/5)`)
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

    // Handle fruit selection from dropdown
    async handleFruitSelection(interaction, battleId, userId, fruitId) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData || battleData.status !== 'fruit_selection') {
                return await this.safeReply(interaction, '❌ Fruit selection is not active!', true);
            }

            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player) {
                return await this.safeReply(interaction, '❌ Player not found!', true);
            }

            // Check if already selected 5 fruits
            if (selectionData.selectedFruits.length >= 5) {
                return await this.safeReply(interaction, '❌ You have already selected 5 fruits! Clear some first.', true);
            }

            // Find the fruit by ID
            const fruit = player.fruits.find(f => f.id == fruitId);
            if (!fruit) {
                return await this.safeReply(interaction, '❌ Fruit not found in your collection!', true);
            }

            // Check if fruit is already selected
            const alreadySelected = selectionData.selectedFruits.some(
                selected => selected.fruit_name === fruit.fruit_name
            );
            
            if (alreadySelected) {
                return await this.safeReply(interaction, '❌ You have already selected this fruit!', true);
            }

            // Add fruit to selection
            selectionData.selectedFruits.push(fruit);
            selectionData.lastUpdate = Date.now();
            battleData.lastActivity = Date.now();
            this.activeBattles.set(battleId, battleData);

            // Update selection interface
            await this.updatePrivateSelection(interaction, battleData, player);
            await this.updatePublicBattleScreen(interaction, battleData);

            console.log(`🍈 ${player.username} selected ${fruit.fruit_name} (${selectionData.selectedFruits.length}/5)`);

        } catch (error) {
            console.error('Error in handleFruitSelection:', error);
            await this.safeReply(interaction, '❌ Error selecting fruit. Please try again.', true);
        }
    }

    // Update private selection interface
    async updatePrivateSelection(interaction, battleData, player) {
        try {
            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);

            await this.safeUpdate(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Error updating private selection:', error);
        }
    }

    // Update public battle screen
    async updatePublicBattleScreen(interaction, battleData) {
        try {
            const publicEmbed = this.createPublicSelectionScreen(battleData);
            
            // Get the original message and update it
            const channel = interaction.client.channels.cache.get(battleData.channelId);
            if (channel) {
                // Find the battle message (this is a simple approach)
                const messages = await channel.messages.fetch({ limit: 10 });
                const battleMessage = messages.find(msg => 
                    msg.embeds[0]?.title?.includes('Enhanced Turn-Based Battle') &&
                    msg.embeds[0]?.description?.includes(battleData.id)
                );
                
                if (battleMessage) {
                    await battleMessage.edit({ embeds: [publicEmbed] });
                }
            }
        } catch (error) {
            console.error('Error updating public battle screen:', error);
        }
    }

    // Handle page switching
    async handlePageSwitch(interaction, battleId, userId) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData || battleData.status !== 'fruit_selection') {
                return await this.safeReply(interaction, '❌ Battle not found or not in selection phase!', true);
            }

            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player) {
                return await this.safeReply(interaction, '❌ Player not found!', true);
            }

            // Switch page
            selectionData.currentPage = selectionData.currentPage === 'high' ? 'low' : 'high';
            selectionData.lastUpdate = Date.now();
            battleData.lastActivity = Date.now();
            this.activeBattles.set(battleId, battleData);

            // Update interface
            await this.updatePrivateSelection(interaction, battleData, player);

            console.log(`📋 ${player.username} switched to ${selectionData.currentPage} rarity page`);

        } catch (error) {
            console.error('Error in handlePageSwitch:', error);
            await this.safeReply(interaction, '❌ Error switching page. Please try again.', true);
        }
    }

    // Handle confirm selection
    async handleConfirmSelection(interaction, battleId, userId) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData || battleData.status !== 'fruit_selection') {
                return await this.safeReply(interaction, '❌ Battle not found or not in selection phase!', true);
            }

            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player || selectionData.selectedFruits.length !== 5) {
                return await this.safeReply(interaction, 
                    `❌ You must select exactly 5 fruits! Currently selected: ${selectionData.selectedFruits?.length || 0}`, 
                    true);
            }

            // Confirm selection
            player.selectedFruits = [...selectionData.selectedFruits];
            selectionData.selectionComplete = true;
            selectionData.lastUpdate = Date.now();
            battleData.lastActivity = Date.now();
            this.activeBattles.set(battleId, battleData);

            await this.safeReply(interaction, '✅ Selection confirmed! Waiting for opponent...', true);

            // Check if both players have confirmed
            if (battleData.selectionData.player1.selectionComplete && 
                battleData.selectionData.player2.selectionComplete) {
                
                setTimeout(() => {
                    this.startTurnBasedBattle(interaction, battleData);
                }, 2000);
            }

            await this.updatePublicBattleScreen(interaction, battleData);

            console.log(`✅ ${player.username} confirmed selection of 5 fruits`);

        } catch (error) {
            console.error('Error in handleConfirmSelection:', error);
            await this.safeReply(interaction, '❌ Error confirming selection. Please try again.', true);
        }
    }

    // Handle clear selection
    async handleClearSelection(interaction, battleId, userId) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData || battleData.status !== 'fruit_selection') {
                return await this.safeReply(interaction, '❌ Battle not found or not in selection phase!', true);
            }

            const playerKey = battleData.player1.userId === userId ? 'player1' : 'player2';
            const player = battleData[playerKey];
            const selectionData = battleData.selectionData[playerKey];
            
            if (!player) {
                return await this.safeReply(interaction, '❌ Player not found!', true);
            }

            // Clear selection
            selectionData.selectedFruits = [];
            selectionData.selectionComplete = false;
            selectionData.lastUpdate = Date.now();
            battleData.lastActivity = Date.now();
            this.activeBattles.set(battleId, battleData);

            // Update interface
            await this.updatePrivateSelection(interaction, battleData, player);
            await this.updatePublicBattleScreen(interaction
