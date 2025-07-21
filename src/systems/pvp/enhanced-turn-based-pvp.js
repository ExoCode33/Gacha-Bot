// src/systems/pvp/enhanced-turn-based-pvp.js - FIXED VERSION
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
    console.log('✅ Devil Fruit abilities loaded for PvP system');
} catch (error) {
    console.log('⚠️ Abilities not found, using defaults');
    balancedDevilFruitAbilities = getDefaultAbilities();
    statusEffects = getDefaultStatusEffects();
}

class EnhancedTurnBasedPvP {
    constructor() {
        this.activeBattles = new Map();
        this.battleTimeouts = new Map();
        this.BATTLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
        this.TURN_TIMEOUT = 60 * 1000; // 1 minute per turn
        this.SELECTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes for fruit selection
        
        console.log('🎮 Enhanced Turn-Based PvP System initialized successfully');
        
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
    async safeReply(interaction, content, ephemeral = false, embeds = [], components = []) {
        try {
            const payload = {};
            if (content) payload.content = content;
            if (embeds.length > 0) payload.embeds = embeds;
            if (components.length > 0) payload.components = components;
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

            console.log(`🎯 Initiating battle: ${challenger.username} vs ${target.username}`);

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

            if (challengerFruits.length < 5 || targetFruits.length < 5) {
                return await this.safeReply(interaction, '❌ Both players must have at least 5 Devil Fruits to battle!', true);
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
                        name: '⚔️ Battle System',
                        value: [
                            '🎯 **Enhanced Turn-Based Combat**',
                            '🍈 Choose 5 fruits for battle',
                            '⚡ Turn-based skill combat',
                            '🎮 Strategic depth and timing'
                        ].join('\n'),
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

            console.log(`✅ Battle invitation created: ${battleId}`);

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
            
            console.log(`🎮 Handling battle response: ${action} for battle ${battleId}`);
            
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
            
            console.log(`🍈 Starting fruit selection for battle ${battleId}`);
            
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
                    player1: { selectedFruits: [], selectionComplete: false, lastUpdate: Date.now() },
                    player2: { selectedFruits: [], selectionComplete: false, lastUpdate: Date.now() }
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

            console.log(`✅ Fruit selection started for battle ${battleId}`);

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
                        `⏳ Selecting fruits... (${selectionData.player1.selectedFruits.length}/5)`;
                        
        const p2Status = selectionData.player2.selectionComplete ? '✅ Ready' :
                        selectionData.player2.selectedFruits.length === 5 ? '⏳ Confirming' :
                        `⏳ Selecting fruits... (${selectionData.player2.selectedFruits.length}/5)`;

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
        
        const embed = new EmbedBuilder()
            .setColor(selectedCount === 5 ? 0x00FF00 : 0x3498DB)
            .setTitle(`🔒 Your Private Fruit Selection`)
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
                    name: '📋 Selection Info',
                    value: [
                        `🎯 **Select your best 5 fruits**`,
                        `⚡ **Higher rarity = more damage**`,
                        `🔥 **Diverse selection recommended**`,
                        `⏰ **5 minute time limit**`
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

        // Organize fruits by rarity
        const organizedFruits = this.organizeFruitsByRarity(player.fruits);
        const allRarities = ['divine', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

        // Create dropdown options for available fruits
        const options = [];
        allRarities.forEach(rarity => {
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
                .setPlaceholder(`Choose from your fruits...`)
                .addOptions(options.slice(0, 25)); // Discord limit

            const selectRow = new ActionRowBuilder().addComponents(selectMenu);
            components.push(selectRow);
        }

        // Action buttons row
        const actionRow = new ActionRowBuilder()
            .addComponents(
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
            await this.updatePublicBattleScreen(battleData);

            console.log(`🍈 ${player.username} selected ${fruit.fruit_name} (${selectionData.selectedFruits.length}/5)`);

        } catch (error) {
            console.error('Error in handleFruitSelection:', error);
            await this.safeReply(interaction, '❌ Error selecting fruit. Please try again.', true);
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

            await this.updatePublicBattleScreen(battleData);

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
            await this.updatePublicBattleScreen(battleData);

            console.log(`🗑️ ${player.username} cleared their selection`);

        } catch (error) {
            console.error('Error in handleClearSelection:', error);
            await this.safeReply(interaction, '❌ Error clearing selection. Please try again.', true);
        }
    }

    // Start the actual turn-based battle
    async startTurnBasedBattle(interaction, battleData) {
        try {
            console.log(`⚔️ Starting turn-based battle for ${battleData.id}`);

            // Initialize battle state
            battleData.status = 'battle';
            battleData.currentTurn = 1;
            battleData.currentPlayer = 'player1';
            battleData.maxTurns = 15;
            battleData.battleLog = [];
            
            // Set initial HP
            battleData.player1.hp = battleData.player1.maxHealth;
            battleData.player2.hp = battleData.player2.maxHealth;
            battleData.player1.effects = [];
            battleData.player2.effects = [];

            this.activeBattles.set(battleData.id, battleData);

            // Create battle interface
            const battleEmbed = this.createBattleEmbed(battleData);
            const components = this.createBattleButtons(battleData);

            // Try to update existing message or send new one
            try {
                if (interaction.message) {
                    await interaction.editReply({
                        embeds: [battleEmbed],
                        components: components
                    });
                } else {
                    await this.safeReply(interaction, null, false, [battleEmbed], components);
                }
            } catch (error) {
                // Fallback: send a follow-up
                await interaction.followUp({
                    embeds: [battleEmbed],
                    components: components
                });
            }

            // Set battle timeout
            this.battleTimeouts.set(battleData.id, setTimeout(() => {
                this.endBattle(battleData.id, 'timeout');
            }, this.BATTLE_TIMEOUT));

            console.log(`✅ Turn-based battle started: ${battleData.id}`);

        } catch (error) {
            console.error('Error starting turn-based battle:', error);
        }
    }

    // Create battle embed
    createBattleEmbed(battleData) {
        const { player1, player2, currentTurn, currentPlayer } = battleData;
        const currentPlayerData = battleData[currentPlayer];
        
        const p1HPPercent = (player1.hp / player1.maxHealth) * 100;
        const p2HPPercent = (player2.hp / player2.maxHealth) * 100;
        
        const p1HPBar = this.createHPBar(p1HPPercent);
        const p2HPBar = this.createHPBar(p2HPPercent);

        return new EmbedBuilder()
            .setColor(currentPlayer === 'player1' ? 0x3498DB : 0xE74C3C)
            .setTitle(`⚔️ Turn ${currentTurn} - ${currentPlayerData.username}'s Turn`)
            .setDescription(`🔥 **Enhanced Turn-Based Combat!**\nSelect your Devil Fruit ability!`)
            .addFields([
                {
                    name: `🏴‍☠️ ${player1.username}`,
                    value: [
                        `${p1HPBar}`,
                        `**HP**: ${player1.hp}/${player1.maxHealth} (${p1HPPercent.toFixed(1)}%)`,
                        `**Level**: ${player1.level} | **CP**: ${player1.balancedCP.toLocaleString()}`,
                        `**Effects**: ${this.getEffectsString(player1.effects)}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: `🏴‍☠️ ${player2.username}`,
                    value: [
                        `${p2HPBar}`,
                        `**HP**: ${player2.hp}/${player2.maxHealth} (${p2HPPercent.toFixed(1)}%)`,
                        `**Level**: ${player2.level} | **CP**: ${player2.balancedCP.toLocaleString()}`,
                        `**Effects**: ${this.getEffectsString(player2.effects)}`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: `Turn ${currentTurn}/${battleData.maxTurns} • Select your attack!` })
            .setTimestamp();
    }

    // Create battle buttons for skill selection
    createBattleButtons(battleData) {
        const currentPlayerData = battleData[battleData.currentPlayer];
        const components = [];
        
        // Create skill buttons (up to 5 fruits)
        const skillButtons = (currentPlayerData.selectedFruits || []).slice(0, 5).map((fruit, index) => {
            const ability = balancedDevilFruitAbilities[fruit.fruit_name] || {
                name: 'Unknown Skill',
                damage: 100,
                cooldown: 0
            };
            const emoji = getRarityEmoji(fruit.fruit_rarity);
            
            return new ButtonBuilder()
                .setCustomId(`use_skill_${battleData.id}_${currentPlayerData.userId}_${index}`)
                .setLabel(`${fruit.fruit_name.slice(0, 20)}`)
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
                    .setCustomId(`view_skills_${battleData.id}_${currentPlayerData.userId}`)
                    .setLabel('📋 View Skills')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`surrender_${battleData.id}_${currentPlayerData.userId}`)
                    .setLabel('🏳️ Surrender')
                    .setStyle(ButtonStyle.Danger)
            );
        
        components.push(battleOptionsRow);
        
        return components;
    }

    // Handle skill usage
    async handleSkillUsage(interaction, battleId, userId, skillIndex) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData || battleData.status !== 'battle') {
                return await this.safeReply(interaction, '❌ Battle not found or not active!', true);
            }

            const currentPlayerData = battleData[battleData.currentPlayer];
            if (currentPlayerData.userId !== userId) {
                return await this.safeReply(interaction, '❌ It\'s not your turn!', true);
            }

            const selectedFruit = currentPlayerData.selectedFruits[skillIndex];
            if (!selectedFruit) {
                return await this.safeReply(interaction, '❌ Invalid skill selection!', true);
            }

            const ability = balancedDevilFruitAbilities[selectedFruit.fruit_name] || {
                name: 'Basic Attack',
                damage: 100,
                cooldown: 0,
                effect: null,
                accuracy: 85
            };
            
            // Process the attack
            await this.processAttack(interaction, battleData, currentPlayerData, ability, selectedFruit);

        } catch (error) {
            console.error('Error in handleSkillUsage:', error);
            await this.safeReply(interaction, '❌ Error using skill. Please try again.', true);
        }
    }

    // Process an attack between players
    async processAttack(interaction, battleData, attacker, ability, fruit) {
        try {
            const defender = battleData.currentPlayer === 'player1' ? battleData.player2 : battleData.player1;
            
            // Calculate damage
            const baseDamage = ability.damage || 100;
            const accuracy = ability.accuracy || 85;
            const hit = Math.random() * 100 <= accuracy;
            
            let damage = 0;
            if (hit) {
                const cpRatio = Math.min(attacker.balancedCP / defender.balancedCP, 1.5);
                const turnMultiplier = battleData.currentTurn === 1 ? 0.6 : 
                                     battleData.currentTurn === 2 ? 0.8 : 1.0;
                
                damage = Math.floor(baseDamage * cpRatio * turnMultiplier * (0.8 + Math.random() * 0.4));
                damage = Math.max(10, damage);
                
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
            battleData.battleLog = battleData.battleLog || [];
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
                await this.endBattleWithWinner(interaction, battleData, attacker, defender);
                return;
            }

            // Switch turns
            battleData.currentPlayer = battleData.currentPlayer === 'player1' ? 'player2' : 'player1';
            battleData.currentTurn++;

            // Check max turns
            if (battleData.currentTurn > battleData.maxTurns) {
                await this.endBattleByTimeout(interaction, battleData);
                return;
            }

            // Process ongoing effects
            this.processOngoingEffects(battleData);
            battleData.lastActivity = Date.now();
            this.activeBattles.set(battleData.id, battleData);

            // Show updated battle interface
            const updatedEmbed = this.createBattleEmbed(battleData);
            const components = this.createBattleButtons(battleData);
            
            // Add recent action to embed
            updatedEmbed.addFields([{ 
                name: '⚡ Last Action', 
                value: attackMessage, 
                inline: false 
            }]);

            await this.safeUpdate(interaction, {
                embeds: [updatedEmbed],
                components: components
            });

        } catch (error) {
            console.error('Error processing attack:', error);
        }
    }

    // Handle view skills
    async handleViewSkills(interaction, battleId, userId) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await this.safeReply(interaction, '❌ Battle not found!', true);
            }

            const playerData = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
            if (!playerData) {
                return await this.safeReply(interaction, '❌ Player not found!', true);
            }
            
            const skillsEmbed = new EmbedBuilder()
                .setColor(0x9932CC)
                .setTitle('📋 Your Devil Fruit Abilities')
                .setDescription('Detailed information about your selected fruits');

            if (!playerData.selectedFruits || playerData.selectedFruits.length === 0) {
                skillsEmbed.addFields({
                    name: '❓ No Skills Available',
                    value: 'You haven\'t selected any fruits yet.',
                    inline: false
                });
            } else {
                playerData.selectedFruits.forEach((fruit, index) => {
                    const ability = balancedDevilFruitAbilities[fruit.fruit_name] || {
                        name: 'Unknown Ability',
                        damage: 100,
                        cooldown: 0,
                        description: 'A mysterious power',
                        accuracy: 85
                    };
                    const emoji = getRarityEmoji(fruit.fruit_rarity);
                    
                    skillsEmbed.addFields({
                        name: `${index + 1}. ${emoji} ${fruit.fruit_name}`,
                        value: [
                            `⚔️ **${ability.name}**`,
                            `💥 **Damage**: ${ability.damage}`,
                            `⏱️ **Cooldown**: ${ability.cooldown} turns`,
                            `🎯 **Accuracy**: ${ability.accuracy}%`,
                            `📝 ${ability.description}`
                        ].join('\n'),
                        inline: false
                    });
                });
            }

            await this.safeReply(interaction, null, true, [skillsEmbed]);

        } catch (error) {
            console.error('Error in handleViewSkills:', error);
        }
    }

    // Handle surrender
    async handleSurrender(interaction, battleId, userId) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await this.safeReply(interaction, '❌ Battle not found!', true);
            }

            const surrenderingPlayer = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
            const winner = surrenderingPlayer === battleData.player1 ? battleData.player2 : battleData.player1;

            if (!surrenderingPlayer) {
                return await this.safeReply(interaction, '❌ You are not part of this battle!', true);
            }

            await this.endBattleWithWinner(interaction, battleData, winner, surrenderingPlayer, 'surrender');

        } catch (error) {
            console.error('Error in handleSurrender:', error);
        }
    }

    // End battle with winner
    async endBattleWithWinner(interaction, battleData, winner, loser, reason = 'victory') {
        try {
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
                               `**Reason**: ${reason === 'surrender' ? 'Surrender' : 'KO'}`,
                        inline: false
                    }
                ])
                .setFooter({ text: 'Great battle! Your legend grows...' })
                .setTimestamp();

            await this.safeUpdate(interaction, {
                embeds: [winnerEmbed],
                components: []
            });

            // Clean up
            this.activeBattles.delete(battleData.id);
            if (this.battleTimeouts.has(battleData.id)) {
                clearTimeout(this.battleTimeouts.get(battleData.id));
                this.battleTimeouts.delete(battleData.id);
            }

            console.log(`🏆 Battle completed: ${winner.username} defeats ${loser.username} (${reason})`);

        } catch (error) {
            console.error('Error ending battle:', error);
        }
    }

    // End battle by timeout
    async endBattleByTimeout(interaction, battleData) {
        const { player1, player2 } = battleData;
        const winner = player1.hp > player2.hp ? player1 : player2;
        const loser = winner === player1 ? player2 : player1;
        
        await this.endBattleWithWinner(interaction, battleData, winner, loser, 'timeout');
    }

    // Process ongoing effects (DoT, debuffs, etc.)
    processOngoingEffects(battleData) {
        [battleData.player1, battleData.player2].forEach(player => {
            player.effects = (player.effects || []).filter(effect => {
                if (effect.name.includes('burn') || effect.name.includes('poison')) {
                    const dotDamage = effect.name.includes('burn') ? 15 : 10;
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

    // Helper methods
    createHPBar(percentage, length = 20) {
        const filledLength = Math.round((percentage / 100) * length);
        const emptyLength = length - filledLength;
        
        let fillEmoji = '🟢';
        if (percentage < 30) fillEmoji = '🔴';
        else if (percentage < 60) fillEmoji = '🟡';
        
        return fillEmoji.repeat(filledLength) + '⚫'.repeat(emptyLength);
    }

    getSelectionProgress(count) {
        const totalBars = 10;
        const filledBars = Math.floor((count / 5) * totalBars);
        const emptyBars = totalBars - filledBars;
        return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
    }

    getRarityBreakdown(fruits) {
        if (!fruits || fruits.length === 0) {
            return 'No fruits selected';
        }
        
        const breakdown = {
            divine: 0, mythical: 0, legendary: 0, epic: 0,
            rare: 0, uncommon: 0, common: 0
        };
        
        fruits.forEach(fruit => {
            const rarity = fruit.fruit_rarity || 'common';
            if (breakdown.hasOwnProperty(rarity)) {
                breakdown[rarity]++;
            }
        });
        
        const parts = [];
        Object.entries(breakdown).forEach(([rarity, count]) => {
            if (count > 0) {
                const emoji = getRarityEmoji(rarity);
                parts.push(`${emoji}${count}`);
            }
        });
        
        return parts.join(' ') || 'No fruits';
    }

    organizeFruitsByRarity(fruits) {
        const organized = {
            divine: [], mythical: [], legendary: [], epic: [],
            rare: [], uncommon: [], common: []
        };

        fruits.forEach(fruit => {
            const rarity = fruit.fruit_rarity || 'common';
            if (organized.hasOwnProperty(rarity)) {
                organized[rarity].push(fruit);
            }
        });

        return organized;
    }

    getEffectsString(effects) {
        if (!effects || effects.length === 0) return 'None';
        return effects.map(e => `${e.name} (${e.duration})`).join(', ');
    }

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

    async updatePublicBattleScreen(battleData) {
        try {
            // This would update the public battle screen
            // For now, we'll skip this to avoid complexity
            console.log(`📊 Battle ${battleData.id} selection updated`);
        } catch (error) {
            console.error('Error updating public battle screen:', error);
        }
    }

    // Find user battle
    findUserBattle(userId) {
        for (const [battleId, battle] of this.activeBattles.entries()) {
            if ((battle.player1 && battle.player1.userId === userId) ||
                (battle.player2 && battle.player2.userId === userId) ||
                (battle.challenger && battle.challenger.user_id === userId) ||
                (battle.target && battle.target.user_id === userId)) {
                return battleId;
            }
        }
        return null;
    }

    // End battle cleanup
    endBattle(battleId, reason) {
        try {
            const battle = this.activeBattles.get(battleId);
            if (battle) {
                console.log(`🧹 Ending battle ${battleId} due to ${reason}`);
                this.activeBattles.delete(battleId);
            }
            
            if (this.battleTimeouts.has(battleId)) {
                clearTimeout(this.battleTimeouts.get(battleId));
                this.battleTimeouts.delete(battleId);
            }
        } catch (error) {
            console.error('Error ending battle:', error);
        }
    }

    // Get battle stats
    getBattleStats() {
        const activeBattles = this.activeBattles.size;
        const battles = Array.from(this.activeBattles.values()).map(battle => ({
            players: [
                battle.player1?.username || battle.challenger?.username || 'Unknown',
                battle.player2?.username || battle.target?.username || 'Unknown'
            ],
            status: battle.status || battle.type || 'unknown'
        }));

        return {
            activeBattles,
            battles
        };
    }
}

// Default abilities if none are loaded
function getDefaultAbilities() {
    return {
        'Gomu Gomu no Mi': {
            name: 'Gum-Gum Pistol',
            damage: 180,
            cooldown: 4,
            effect: null,
            description: 'Rubber fist attack',
            accuracy: 90
        },
        'Mera Mera no Mi': {
            name: 'Fire Fist',
            damage: 140,
            cooldown: 3,
            effect: 'burn',
            description: 'Flaming punch attack',
            accuracy: 85
        },
        'Default Fruit': {
            name: 'Basic Attack',
            damage: 100,
            cooldown: 0,
            effect: null,
            description: 'A basic devil fruit power',
            accuracy: 85
        }
    };
}

function getDefaultStatusEffects() {
    return {
        'burn': {
            type: 'dot',
            damage: 15,
            duration: 3,
            description: 'Fire damage over time'
        },
        'poison': {
            type: 'dot',
            damage: 10,
            duration: 2,
            description: 'Poison damage over time'
        }
    };
}

module.exports = EnhancedTurnBasedPvP;
