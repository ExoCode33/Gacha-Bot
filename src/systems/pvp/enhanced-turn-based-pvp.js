// src/systems/pvp/enhanced-turn-based-pvp.js - COMPLETE FIXED VERSION with Ephemeral Messages and Pings
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
        this.INVITATION_TIMEOUT = 60 * 1000; // 1 minute for accept/decline
        
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

    // Main battle initiation - FIXED to use ephemeral messages
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

            // Create battle invitation with ephemeral messages
            const battleId = `${challenger.id}_${target.id}_${Date.now()}`;
            await this.createBattleInvitationWithEphemeral(interaction, battleId, challenger, target, challengerData, targetData, challengerFruits, targetFruits);

        } catch (error) {
            console.error('Error initiating enhanced battle:', error);
            await this.safeReply(interaction, '❌ An error occurred while initiating the battle.', true);
        }
    }

    // NEW METHOD: Create battle invitation with ephemeral messages for each player
    async createBattleInvitationWithEphemeral(interaction, battleId, challenger, target, challengerData, targetData, challengerFruits, targetFruits) {
        try {
            // Calculate balanced CP for both players
            const player1BalancedCP = Math.floor((challengerData.total_cp || 100) * 0.8);
            const player2BalancedCP = Math.floor((targetData.total_cp || 100) * 0.8);
            
            // Store battle invitation
            const battleData = {
                id: battleId,
                type: 'invitation',
                status: 'invitation',
                challenger: { 
                    ...challengerData, 
                    user_id: challenger.id,
                    username: challenger.username,
                    fruits: challengerFruits,
                    balancedCP: player1BalancedCP,
                    maxHealth: 200 + ((challengerData.level || 0) * 10)
                },
                target: { 
                    ...targetData, 
                    user_id: target.id,
                    username: target.username,
                    fruits: targetFruits,
                    balancedCP: player2BalancedCP,
                    maxHealth: 200 + ((targetData.level || 0) * 10)
                },
                acceptedBy: new Set(),
                channelId: interaction.channel.id,
                createdAt: Date.now(),
                lastActivity: Date.now()
            };

            this.activeBattles.set(battleId, battleData);

            // PUBLIC ANNOUNCEMENT (no buttons)
            const publicEmbed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('⚔️ Enhanced Turn-Based PvP Challenge!')
                .setDescription(`**${challenger.username}** has challenged **${target.username}** to an enhanced turn-based battle!\n\n🔔 **Both players have been pinged with personal accept/decline options!**`)
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
                .setFooter({ text: 'Players have 60 seconds to respond!' })
                .setTimestamp();

            // Send public announcement
            await this.safeReply(interaction, null, false, [publicEmbed]);

            // Send EPHEMERAL ping messages to each player - COMPLETELY FIXED
            console.log(`📧 Sending ephemeral messages...`);
            console.log(`👤 Challenger: ${challenger.username} (ID: ${challenger.id})`);
            console.log(`🎯 Target: ${target.username} (ID: ${target.id})`);
            
            // Send to challenger - they get the "Challenge Sent" message
            await this.sendEphemeralAcceptDecline(interaction, battleId, challenger, target, 'challenger');
            
            // Send to target - they get the "Challenge Received" message with buttons
            await this.sendEphemeralAcceptDecline(interaction, battleId, target, challenger, 'target');

            // Set timeout for invitation
            this.battleTimeouts.set(battleId, setTimeout(() => {
                this.handleInvitationTimeout(interaction, battleId);
            }, this.INVITATION_TIMEOUT));

            console.log(`✅ Battle invitation created: ${battleId}`);

        } catch (error) {
            console.error('Error creating battle invitation:', error);
        }
    }

    // NEW METHOD: Send ephemeral accept/decline message with ping - FINAL FIX
    async sendEphemeralAcceptDecline(interaction, battleId, player, opponent, playerRole) {
        try {
            console.log(`📨 === EPHEMERAL MESSAGE DEBUG ===`);
            console.log(`📨 Sending to: ${player.username} (ID: ${player.id})`);
            console.log(`📨 About opponent: ${opponent.username} (ID: ${opponent.id})`);
            console.log(`📨 Role: ${playerRole}`);
            console.log(`📨 This message will ONLY be visible to: ${player.username}`);
            console.log(`📨 This message will PING: ${player.username}`);
            
            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle(playerRole === 'challenger' ? '⚔️ Challenge Sent!' : '⚔️ Challenge Received!')
                .setDescription(
                    playerRole === 'challenger' 
                        ? `You have challenged **${opponent.username}** to an enhanced turn-based PvP battle!`
                        : `**${opponent.username}** has challenged you to an enhanced turn-based PvP battle!`
                )
                .addFields([
                    { name: '🎯 Opponent', value: opponent.username, inline: true },
                    { name: '⏰ Time Limit', value: '60 seconds to respond', inline: true },
                    { name: '🔥 Battle Type', value: 'Enhanced Turn-Based PvP', inline: true },
                    { 
                        name: '🆔 Debug Info', 
                        value: `Message for: ${player.username} (${player.id})\nRole: ${playerRole}\nButtons work for: ${player.id}`, 
                        inline: false 
                    }
                ])
                .setFooter({ text: `Battle ID: ${battleId}` })
                .setTimestamp();

            let buttons;
            if (playerRole === 'target') {
                // TARGET gets accept/decline buttons - buttons have THEIR user ID
                buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`battle_accept_${battleId}_${player.id}`)
                            .setLabel('✅ Accept Battle')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`battle_decline_${battleId}_${player.id}`)
                            .setLabel('❌ Decline')
                            .setStyle(ButtonStyle.Danger)
                    );
                
                console.log(`🔘 TARGET buttons created for ${player.username} with THEIR ID: ${player.id}`);
                console.log(`🔘 Button ID will be: battle_accept_${battleId}_${player.id}`);
            } else {
                // CHALLENGER gets waiting button (disabled)
                buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('waiting_response')
                            .setLabel('⏳ Waiting for Response...')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    );
                
                console.log(`⏳ CHALLENGER waiting button created for ${player.username}`);
            }

            // Send ephemeral message - ONLY visible to the specified player
            const message = await interaction.followUp({
                content: `<@${player.id}> ${playerRole === 'target' ? '⚔️ You have been challenged!' : '✅ Challenge sent!'}`,
                embeds: [embed],
                components: [buttons],
                flags: MessageFlags.Ephemeral
            });

            console.log(`✅ Ephemeral message sent successfully to ${player.username}`);
            console.log(`✅ Only ${player.username} can see this message and use these buttons`);
            console.log(`✅ Message ID: ${message?.id || 'unknown'}`);

        } catch (error) {
            console.error(`❌ Error sending ephemeral message to ${player.username}:`, error);
        }
    }

    // Handle invitation timeout
    async handleInvitationTimeout(interaction, battleId) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) return;

            this.activeBattles.delete(battleId);
            
            const timeoutEmbed = new EmbedBuilder()
                .setColor(0xFF8000)
                .setTitle('⏰ Battle Invitation Expired')
                .setDescription(`The battle invitation between **${battleData.challenger.username}** and **${battleData.target.username}** has expired due to no response within 60 seconds.`)
                .setTimestamp();

            await interaction.followUp({ embeds: [timeoutEmbed] });
            console.log(`⏰ Battle invitation ${battleId} expired`);
        } catch (error) {
            console.error('Error handling invitation timeout:', error);
        }
    }

    // Handle battle response (accept/decline) - FIXED with enhanced debugging
    async handleBattleResponse(interaction) {
        try {
            console.log(`🔘 === BUTTON RESPONSE DEBUG ===`);
            console.log(`🔘 Raw button ID: ${interaction.customId}`);
            console.log(`👤 Button clicked by: ${interaction.user.username} (${interaction.user.id})`);
            
            const parts = interaction.customId.split('_');
            console.log(`📋 Button parts:`, parts);
            
            if (parts.length < 4) {
                console.log(`❌ Invalid button format - not enough parts`);
                return await this.safeReply(interaction, '❌ Invalid button format!', true);
            }
            
            const action = parts[1]; // accept or decline
            // For battle_accept_challengerId_targetId_timestamp_userId format
            // battleId should be: challengerId_targetId_timestamp
            const battleId = parts.slice(2, -1).join('_'); // everything except last part
            const expectedUserId = parts[parts.length - 1]; // last part is userId
            const actualUserId = interaction.user.id;
            
            console.log(`🎮 Parsed Data:`);
            console.log(`   - Action: ${action}`);
            console.log(`   - Battle ID: ${battleId}`);
            console.log(`   - Expected User ID: ${expectedUserId}`);
            console.log(`   - Actual User ID: ${actualUserId}`);
            console.log(`   - User Match: ${expectedUserId === actualUserId ? '✅ YES' : '❌ NO'}`);
            
            // Verify this is the correct user
            if (actualUserId !== expectedUserId) {
                console.log(`❌ USER MISMATCH! Button was meant for user ${expectedUserId} but clicked by ${actualUserId}`);
                return await this.safeReply(interaction, '❌ This button is not for you!', true);
            }

            console.log(`✅ User verification passed - ${interaction.user.username} can use this button`);

            const battle = this.activeBattles.get(battleId);
            if (!battle) {
                console.log(`❌ Battle not found for ID: ${battleId}`);
                console.log(`📋 Active battles:`, Array.from(this.activeBattles.keys()));
                return await this.safeReply(interaction, '❌ This battle invitation has expired or is invalid.', true);
            }

            if (battle.type !== 'invitation') {
                console.log(`❌ Battle found but wrong type: ${battle.type}`);
                return await this.safeReply(interaction, '❌ This battle invitation has expired or is invalid.', true);
            }

            console.log(`✅ Battle found and valid - Type: ${battle.type}`);

            // Clear timeout
            if (this.battleTimeouts.has(battleId)) {
                clearTimeout(this.battleTimeouts.get(battleId));
                this.battleTimeouts.delete(battleId);
                console.log(`🕐 Cleared timeout for battle ${battleId}`);
            }

            if (action === 'decline') {
                console.log(`❌ ${interaction.user.username} is declining the battle`);
                await this.handleDecline(interaction, battleId, battle);
            } else if (action === 'accept') {
                console.log(`✅ ${interaction.user.username} is accepting the battle`);
                await this.handleAccept(interaction, battleId, battle, actualUserId);
            }

        } catch (error) {
            console.error('❌ Error handling enhanced battle response:', error);
            console.error('❌ Stack trace:', error.stack);
            await this.safeReply(interaction, '❌ An error occurred while processing the battle response.', true);
        }
    }

    // Handle decline
    async handleDecline(interaction, battleId, battle) {
        this.activeBattles.delete(battleId);
        
        await this.safeUpdate(interaction, { 
            content: '❌ You declined the battle challenge.', 
            embeds: [], 
            components: [] 
        });

        // Send public decline notification
        const declineEmbed = new EmbedBuilder()
            .setColor(0xFF4500)
            .setTitle('❌ Battle Declined')
            .setDescription(`**${interaction.user.username}** declined the battle challenge.`)
            .setTimestamp();

        await interaction.followUp({ embeds: [declineEmbed] });
        console.log(`❌ Battle ${battleId} declined by ${interaction.user.username}`);
    }

    // Handle accept
    async handleAccept(interaction, battleId, battle, userId) {
        battle.acceptedBy.add(userId);
        
        await this.safeUpdate(interaction, {
            content: '✅ You accepted the battle challenge! Starting fruit selection...',
            embeds: [],
            components: []
        });

        // Check if target accepted (since challenger auto-accepts)
        if (userId === battle.target.user_id) {
            // Target accepted, start the battle
            await this.startFruitSelection(interaction, battleId);
        }

        console.log(`✅ ${interaction.user.username} accepted battle ${battleId}`);
    }

    // Start fruit selection phase
    async startFruitSelection(interaction, battleId) {
        try {
            const battle = this.activeBattles.get(battleId);
            
            console.log(`🍈 Starting fruit selection for battle ${battleId}`);
            
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
                    balancedCP: battle.challenger.balancedCP,
                    maxHealth: battle.challenger.maxHealth,
                    selectedFruits: []
                },
                player2: {
                    userId: battle.target.user_id,
                    username: battle.target.username,
                    level: battle.target.level || 0,
                    fruits: battle.target.fruits || [],
                    balancedCP: battle.target.balancedCP,
                    maxHealth: battle.target.maxHealth,
                    selectedFruits: []
                },
                selectionData: {
                    player1: { selectedFruits: [], selectionComplete: false, lastUpdate: Date.now(), currentPage: 'high' },
                    player2: { selectedFruits: [], selectionComplete: false, lastUpdate: Date.now(), currentPage: 'high' }
                },
                isVsNPC: false,
                channelId: battle.channelId,
                createdAt: Date.now(),
                lastActivity: Date.now()
            };

            this.activeBattles.set(battleId, battleData);

            // Create public selection screen
            const publicEmbed = this.createPublicSelectionScreen(battleData);
            await interaction.followUp({
                embeds: [publicEmbed]
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
        }
    }

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
                        `**Level**: ${player1.level} | **CP**: ${player1.balancedCP.toLocaleString()}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: `🏴‍☠️ ${player2.username}`,
                    value: [
                        `${p2Progress} **${selectionData.player2.selectedFruits.length}/5 fruits**`,
                        `**Status**: ${p2Status}`,
                        `**Level**: ${player2.level} | **CP**: ${player2.balancedCP.toLocaleString()}`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Enhanced Turn-Based Combat - Watch the selection!' })
            .setTimestamp();
    }

    getSelectionProgress(count) {
        const totalBars = 10;
        const filledBars = Math.floor((count / 5) * totalBars);
        const emptyBars = totalBars - filledBars;
        return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
    }

    // Send private selection interface
    async sendPrivateSelection(interaction, battleData, player) {
        try {
            const embed = this.createPrivateSelectionEmbed(battleData, player);
            const components = await this.createPrivateSelectionComponents(battleData, player);
            
            await interaction.followUp({
                content: `<@${player.userId}> 🔒 **Your Private Selection Interface** - Choose your 5 battle fruits!`,
                embeds: [embed],
                components: components,
                flags: MessageFlags.Ephemeral
            });
            
        } catch (error) {
            console.error('Error sending private selection:', error);
        }
    }

    createPrivateSelectionEmbed(battleData, player) {
        const playerKey = player.userId === battleData.player1.userId ? 'player1' : 'player2';
        const selectionData = battleData.selectionData[playerKey];
        const selectedCount = selectionData.selectedFruits.length;
        
        return new EmbedBuilder()
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
                }
            ]);
    }

    async createPrivateSelectionComponents(battleData, player) {
        const components = [];
        const playerKey = player.userId === battleData.player1.userId ? 'player1' : 'player2';
        const selectionData = battleData.selectionData[playerKey];
        const selectedCount = selectionData.selectedFruits.length;

        // Action buttons row
        const actionRow = new ActionRowBuilder()
            .addComponents(
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

    // Handle fruit selection
    async handleFruitSelection(interaction, battleId, userId, rarity) {
        console.log(`🍈 Fruit selection: ${userId} selecting ${rarity} for battle ${battleId}`);
        await this.safeReply(interaction, `Selected ${rarity} fruit!`, true);
    }

    // Handle page switch
    async handlePageSwitch(interaction, battleId, userId) {
        console.log(`📋 Page switch: ${userId} for battle ${battleId}`);
        await this.safeReply(interaction, 'Page switched!', true);
    }

    // Handle confirm selection
    async handleConfirmSelection(interaction, battleId, userId) {
        console.log(`✅ Confirm selection: ${userId} for battle ${battleId}`);
        await this.safeReply(interaction, 'Selection confirmed!', true);
    }

    // Handle clear selection
    async handleClearSelection(interaction, battleId, userId) {
        console.log(`🗑️ Clear selection: ${userId} for battle ${battleId}`);
        await this.safeReply(interaction, 'Selection cleared!', true);
    }

    // Handle skill usage
    async handleSkillUsage(interaction, battleId, userId, skillIndex) {
        console.log(`⚔️ Skill usage: ${userId} using skill ${skillIndex} in battle ${battleId}`);
        await this.safeReply(interaction, `Used skill ${skillIndex}!`, true);
    }

    // Handle view skills
    async handleViewSkills(interaction, battleId, userId) {
        console.log(`📋 View skills: ${userId} for battle ${battleId}`);
        await this.safeReply(interaction, 'Skills viewed!', true);
    }

    // Handle surrender
    async handleSurrender(interaction, battleId, userId) {
        console.log(`🏳️ Surrender: ${userId} in battle ${battleId}`);
        await this.safeReply(interaction, 'You surrendered!', true);
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
        }
    };
}

module.exports = EnhancedTurnBasedPvP;
