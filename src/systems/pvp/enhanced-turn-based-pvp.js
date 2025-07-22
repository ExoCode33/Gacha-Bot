// src/systems/pvp/enhanced-turn-based-pvp.js - FIXED VERSION with Individual Accept Messages
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
        this.pendingInvitations = new Map(); // Track pending invitations
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
                this.cleanupExpiredInvitations();
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

    cleanupExpiredInvitations() {
        const now = Date.now();
        for (const [invitationId, invitation] of this.pendingInvitations.entries()) {
            if (invitation.createdAt && (now - invitation.createdAt) > this.INVITATION_TIMEOUT) {
                this.pendingInvitations.delete(invitationId);
                console.log(`🧹 Cleaned up expired invitation: ${invitationId}`);
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

    // Main battle initiation - FIXED to use individual accept messages
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

            // Create battle invitation with individual accept messages
            const invitationId = `pvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await this.createIndividualInvitationMessages(interaction, invitationId, challenger, target, challengerData, targetData, challengerFruits, targetFruits);

        } catch (error) {
            console.error('Error initiating enhanced battle:', error);
            await this.safeReply(interaction, '❌ An error occurred while initiating the battle.', true);
        }
    }

    // NEW METHOD: Create individual invitation messages for each player
    async createIndividualInvitationMessages(interaction, invitationId, challenger, target, challengerData, targetData, challengerFruits, targetFruits) {
        try {
            // Calculate balanced CP for both players
            const player1BalancedCP = Math.floor((challengerData.total_cp || 100) * 0.8);
            const player2BalancedCP = Math.floor((targetData.total_cp || 100) * 0.8);
            
            // Store invitation data
            const invitationData = {
                id: invitationId,
                challenger: { 
                    ...challengerData, 
                    user_id: challenger.id,
                    username: challenger.username,
                    fruits: challengerFruits,
                    balancedCP: player1BalancedCP,
                    maxHealth: 200 + ((challengerData.level || 0) * 10),
                    accepted: false
                },
                target: { 
                    ...targetData, 
                    user_id: target.id,
                    username: target.username,
                    fruits: targetFruits,
                    balancedCP: player2BalancedCP,
                    maxHealth: 200 + ((targetData.level || 0) * 10),
                    accepted: false
                },
                channelId: interaction.channel.id,
                createdAt: Date.now(),
                status: 'pending'
            };

            this.pendingInvitations.set(invitationId, invitationData);
            console.log(`💾 Stored invitation with ID: ${invitationId}`);

            // Send initial public announcement
            const publicEmbed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('⚔️ Enhanced Turn-Based PvP Challenge!')
                .setDescription(`**${challenger.username}** has challenged **${target.username}** to an enhanced turn-based battle!\n\n🔥 **Individual accept messages have been sent to both players!**`)
                .addFields([
                    { 
                        name: `🏴‍☠️ ${challenger.username} (Challenger)`, 
                        value: [
                            `**Level**: ${challengerData.level || 0}`,
                            `**Total CP**: ${challengerData.total_cp?.toLocaleString() || 0}`,
                            `**Fruits**: ${challengerFruits.length}`,
                            `**Status**: ⏳ Sending individual message...`
                        ].join('\n'), 
                        inline: true 
                    },
                    { 
                        name: `🏴‍☠️ ${target.username} (Target)`, 
                        value: [
                            `**Level**: ${targetData.level || 0}`,
                            `**Total CP**: ${targetData.total_cp?.toLocaleString() || 0}`,
                            `**Fruits**: ${targetFruits.length}`,
                            `**Status**: ⏳ Sending individual message...`
                        ].join('\n'), 
                        inline: true 
                    },
                    {
                        name: '⚔️ Battle System',
                        value: [
                            '🎯 **Enhanced Turn-Based Combat**',
                            '🍈 Choose 5 fruits for battle',
                            '⚡ Turn-based skill combat',
                            '🎮 Strategic depth and timing',
                            '⏰ **60 seconds to accept**'
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setFooter({ text: `Invitation ID: ${invitationId} • Check your individual messages!` })
                .setTimestamp();

            await this.safeReply(interaction, `<@${challenger.id}> <@${target.id}> 🔥 **PvP Challenge Sent!**`, false, [publicEmbed]);

            // Send individual messages to each player
            await this.sendIndividualInvitationMessage(challenger, invitationData, 'challenger');
            await this.sendIndividualInvitationMessage(target, invitationData, 'target');

            // Set timeout for invitation
            setTimeout(() => {
                this.handleInvitationTimeout(interaction, invitationId);
            }, this.INVITATION_TIMEOUT);

            console.log(`✅ Individual invitation messages sent for: ${invitationId}`);

        } catch (error) {
            console.error('Error creating individual invitation messages:', error);
        }
    }

    // Send individual invitation message to each player
    async sendIndividualInvitationMessage(user, invitationData, role) {
        try {
            const isChallenger = role === 'challenger';
            const opponent = isChallenger ? invitationData.target : invitationData.challenger;
            
            const embed = new EmbedBuilder()
                .setColor(isChallenger ? 0x3498DB : 0xE74C3C)
                .setTitle(isChallenger ? '⚔️ You Challenged Someone!' : '⚔️ You\'ve Been Challenged!')
                .setDescription(
                    isChallenger 
                        ? `You have challenged **${opponent.username}** to an enhanced turn-based PvP battle!`
                        : `**${opponent.username}** has challenged you to an enhanced turn-based PvP battle!`
                )
                .addFields([
                    { 
                        name: '🎯 Opponent', 
                        value: `**${opponent.username}**\nLevel ${opponent.level || 0} | ${opponent.total_cp?.toLocaleString() || 0} CP`, 
                        inline: true 
                    },
                    { 
                        name: '⏰ Time Limit', 
                        value: '60 seconds to respond', 
                        inline: true 
                    },
                    { 
                        name: '🔥 Battle Type', 
                        value: 'Enhanced Turn-Based PvP', 
                        inline: true 
                    },
                    { 
                        name: '🎮 What Happens Next?', 
                        value: isChallenger 
                            ? 'If both players accept, you\'ll enter fruit selection phase, then strategic turn-based combat!'
                            : 'Accept to enter fruit selection, then engage in strategic turn-based combat!', 
                        inline: false 
                    }
                ])
                .setFooter({ text: `Invitation ID: ${invitationData.id}` })
                .setTimestamp();

            // Create accept/decline buttons for each player individually
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`accept_invitation_${invitationData.id}_${user.id}`)
                        .setLabel('✅ Accept Challenge')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`decline_invitation_${invitationData.id}_${user.id}`)
                        .setLabel('❌ Decline')
                        .setStyle(ButtonStyle.Danger)
                );

            // Check if this is a debug bot and auto-accept
            const isDebugBot = global.debugBots && global.debugBots.has(user.id);
            if (isDebugBot) {
                console.log(`🤖 Debug bot ${user.username} detected - will auto-accept`);
                
                // Send the message first
                await user.send({
                    embeds: [embed],
                    components: [buttons]
                });

                // Auto-accept for debug bot after a short delay
                setTimeout(async () => {
                    try {
                        console.log(`🤖 Auto-accepting for debug bot ${user.username}`);
                        await this.handleBotAutoAccept(invitationData.id, user.id);
                    } catch (error) {
                        console.error('Error in bot auto-accept:', error);
                    }
                }, 2000);
            } else {
                // Send normal message for human players
                await user.send({
                    embeds: [embed],
                    components: [buttons]
                });
            }

            console.log(`✅ Individual invitation sent to ${user.username} (${role})`);

        } catch (error) {
            console.error(`❌ Error sending individual invitation to ${user.username}:`, error);
            
            // If DM fails, this is not critical for debug bots
            if (!(global.debugBots && global.debugBots.has(user.id))) {
                console.error(`Failed to send DM to ${user.username}. This may cause issues.`);
            }
        }
    }

    // Handle bot auto-accept for debug bots
    async handleBotAutoAccept(invitationId, botUserId) {
        try {
            const invitationData = this.pendingInvitations.get(invitationId);
            if (!invitationData) {
                console.log(`⚠️ Invitation ${invitationId} not found for bot auto-accept`);
                return;
            }

            console.log(`🤖 Processing auto-accept for bot ${botUserId} in invitation ${invitationId}`);

            // Mark the bot as accepted
            if (invitationData.challenger.user_id === botUserId) {
                invitationData.challenger.accepted = true;
                console.log(`🤖 Bot challenger ${invitationData.challenger.username} auto-accepted`);
            } else if (invitationData.target.user_id === botUserId) {
                invitationData.target.accepted = true;
                console.log(`🤖 Bot target ${invitationData.target.username} auto-accepted`);
            }

            // Check if both players have now accepted
            if (invitationData.challenger.accepted && invitationData.target.accepted) {
                console.log(`🔥 Both players accepted (including bot)! Starting battle...`);
                await this.startBattleFromInvitation(invitationData);
            } else {
                console.log(`⏳ Waiting for other player to accept...`);
                this.pendingInvitations.set(invitationId, invitationData);
            }

        } catch (error) {
            console.error('Error in bot auto-accept:', error);
        }
    }

    // Handle invitation timeout
    async handleInvitationTimeout(interaction, invitationId) {
        try {
            const invitationData = this.pendingInvitations.get(invitationId);
            if (!invitationData) return;

            this.pendingInvitations.delete(invitationId);
            
            const timeoutEmbed = new EmbedBuilder()
                .setColor(0xFF8000)
                .setTitle('⏰ Battle Invitation Expired')
                .setDescription(`The battle invitation between **${invitationData.challenger.username}** and **${invitationData.target.username}** has expired due to no response within 60 seconds.`)
                .setTimestamp();

            await interaction.followUp({ embeds: [timeoutEmbed] });
            console.log(`⏰ Battle invitation ${invitationId} expired`);
        } catch (error) {
            console.error('Error handling invitation timeout:', error);
        }
    }

    // Handle battle response (accept/decline) - FIXED with correct parsing
    async handleBattleResponse(interaction) {
        try {
            console.log(`🔘 === BUTTON RESPONSE DEBUG ===`);
            console.log(`🔘 Raw button ID: ${interaction.customId}`);
            console.log(`👤 Button clicked by: ${interaction.user.username} (${interaction.user.id})`);
            
            const parts = interaction.customId.split('_');
            console.log(`📋 Button parts:`, parts);
            
            // Handle new invitation format: accept_invitation_ID_USER or decline_invitation_ID_USER
            if (parts[0] === 'accept' && parts[1] === 'invitation') {
                const invitationId = parts[2];
                const userId = parts[3];
                
                console.log(`✅ Accept invitation: ${invitationId} by user ${userId}`);
                
                if (userId !== interaction.user.id) {
                    return await this.safeReply(interaction, '❌ This invitation is not for you!', true);
                }
                
                await this.handleInvitationAccept(interaction, invitationId, userId);
                return;
            }
            
            if (parts[0] === 'decline' && parts[1] === 'invitation') {
                const invitationId = parts[2];
                const userId = parts[3];
                
                console.log(`❌ Decline invitation: ${invitationId} by user ${userId}`);
                
                if (userId !== interaction.user.id) {
                    return await this.safeReply(interaction, '❌ This invitation is not for you!', true);
                }
                
                await this.handleInvitationDecline(interaction, invitationId, userId);
                return;
            }
            
            // Handle legacy format if needed (for backwards compatibility)
            if (parts.length >= 3) {
                const action = parts[0]; // accept or decline
                const battleId = parts[1]; // battle ID
                const expectedUserId = parts[2]; // user ID
                const actualUserId = interaction.user.id;
                
                console.log(`🎮 Legacy format - Action: ${action}, Battle: ${battleId}, User: ${expectedUserId}`);
                
                if (actualUserId !== expectedUserId) {
                    return await this.safeReply(interaction, '❌ This button is not for you!', true);
                }

                const battle = this.activeBattles.get(battleId);
                if (!battle) {
                    return await this.safeReply(interaction, '❌ This battle invitation has expired.', true);
                }

                if (action === 'decline') {
                    await this.handleDecline(interaction, battleId, battle);
                } else if (action === 'accept') {
                    await this.handleAccept(interaction, battleId, battle, actualUserId);
                }
                return;
            }

            console.log(`❓ Unknown button format: ${interaction.customId}`);
            await this.safeReply(interaction, '❌ Unknown button interaction.', true);

        } catch (error) {
            console.error('❌ Error handling enhanced battle response:', error);
            console.error('❌ Stack trace:', error.stack);
            await this.safeReply(interaction, '❌ An error occurred while processing the battle response.', true);
        }
    }

    // Handle invitation accept
    async handleInvitationAccept(interaction, invitationId, userId) {
        try {
            const invitationData = this.pendingInvitations.get(invitationId);
            if (!invitationData) {
                return await this.safeUpdate(interaction, { 
                    content: '❌ This invitation has expired.',
                    embeds: [], 
                    components: [] 
                });
            }

            console.log(`✅ ${interaction.user.username} accepting invitation ${invitationId}`);

            // Mark this player as accepted
            if (invitationData.challenger.user_id === userId) {
                invitationData.challenger.accepted = true;
            } else if (invitationData.target.user_id === userId) {
                invitationData.target.accepted = true;
            }

            await this.safeUpdate(interaction, {
                content: `✅ You accepted the challenge! Waiting for the other player...`,
                embeds: [],
                components: []
            });

            // Check if both players have accepted
            if (invitationData.challenger.accepted && invitationData.target.accepted) {
                console.log(`🔥 Both players accepted! Starting battle...`);
                await this.startBattleFromInvitation(invitationData);
            } else {
                console.log(`⏳ Waiting for other player to accept...`);
                this.pendingInvitations.set(invitationId, invitationData);
            }

        } catch (error) {
            console.error('Error handling invitation accept:', error);
        }
    }

    // Handle invitation decline  
    async handleInvitationDecline(interaction, invitationId, userId) {
        try {
            const invitationData = this.pendingInvitations.get(invitationId);
            if (!invitationData) {
                return await this.safeUpdate(interaction, { 
                    content: '❌ This invitation has expired.',
                    embeds: [], 
                    components: [] 
                });
            }

            this.pendingInvitations.delete(invitationId);
            
            await this.safeUpdate(interaction, { 
                content: `❌ You declined the battle challenge.`,
                embeds: [], 
                components: [] 
            });

            console.log(`❌ ${interaction.user.username} declined invitation ${invitationId}`);

        } catch (error) {
            console.error('Error handling invitation decline:', error);
        }
    }

    // Start battle from accepted invitation
    async startBattleFromInvitation(invitationData) {
        try {
            console.log(`🔥 Starting battle from accepted invitation ${invitationData.id}`);

            // Create battle data
            const battleData = {
                id: invitationData.id,
                type: 'fruit_selection',
                status: 'fruit_selection',
                player1: {
                    userId: invitationData.challenger.user_id,
                    username: invitationData.challenger.username,
                    level: invitationData.challenger.level || 0,
                    fruits: invitationData.challenger.fruits || [],
                    balancedCP: invitationData.challenger.balancedCP,
                    maxHealth: invitationData.challenger.maxHealth,
                    selectedFruits: []
                },
                player2: {
                    userId: invitationData.target.user_id,
                    username: invitationData.target.username,
                    level: invitationData.target.level || 0,
                    fruits: invitationData.target.fruits || [],
                    balancedCP: invitationData.target.balancedCP,
                    maxHealth: invitationData.target.maxHealth,
                    selectedFruits: []
                },
                selectionData: {
                    player1: { selectedFruits: [], selectionComplete: false, lastUpdate: Date.now(), currentPage: 'high' },
                    player2: { selectedFruits: [], selectionComplete: false, lastUpdate: Date.now(), currentPage: 'high' }
                },
                isVsNPC: false,
                channelId: invitationData.channelId,
                createdAt: Date.now(),
                lastActivity: Date.now()
            };

            this.activeBattles.set(invitationData.id, battleData);
            this.pendingInvitations.delete(invitationData.id);

            console.log(`✅ Battle ${invitationData.id} started - entering fruit selection phase`);

        } catch (error) {
            console.error('Error starting battle from invitation:', error);
        }
    }

    // Handle decline (legacy)
    async handleDecline(interaction, battleId, battle) {
        this.activeBattles.delete(battleId);
        
        await this.safeUpdate(interaction, { 
            content: `❌ **${interaction.user.username}** declined the battle challenge.`,
            embeds: [], 
            components: [] 
        });

        console.log(`❌ Battle ${battleId} declined by ${interaction.user.username}`);
    }

    // Handle accept (legacy)
    async handleAccept(interaction, battleId, battle, userId) {
        battle.acceptedBy.add(userId);
        battle.lastActivity = Date.now();
        
        console.log(`✅ ${interaction.user.username} accepted battle ${battleId}`);

        const challengerAccepted = battle.acceptedBy.has(battle.challenger.user_id);
        const targetAccepted = battle.acceptedBy.has(battle.target.user_id);

        if (challengerAccepted && targetAccepted) {
            await this.safeUpdate(interaction, {
                content: `🔥 **BOTH PLAYERS ACCEPTED!** Starting enhanced turn-based battle!`,
                embeds: [],
                components: []
            });

            await this.startFruitSelection(interaction, battleId);
        } else {
            const statusText = `✅ **${interaction.user.username}** accepted the challenge!\n\n` +
                `**${battle.challenger.username}**: ${challengerAccepted ? '✅ Ready' : '⏳ Waiting...'}\n` +
                `**${battle.target.username}**: ${targetAccepted ? '✅ Ready' : '⏳ Waiting...'}`;

            await this.safeUpdate(interaction, {
                content: statusText,
                embeds: [],
                components: []
            });
        }
    }

    // Start fruit selection phase (placeholder)
    async startFruitSelection(interaction, battleId) {
        try {
            console.log(`🍈 Starting fruit selection for battle ${battleId}`);
            // Fruit selection implementation would go here
            await interaction.followUp({
                content: `🍈 **Fruit Selection Phase**\nFruit selection system is being implemented!`
            });
        } catch (error) {
            console.error('Error starting fruit selection:', error);
        }
    }

    // Placeholder methods for other interactions
    async handleFruitSelection(interaction, battleId, userId, rarity) {
        console.log(`🍈 Fruit selection: ${userId} selecting ${rarity} for battle ${battleId}`);
        await this.safeReply(interaction, `Selected ${rarity} fruit!`, true);
    }

    async handlePageSwitch(interaction, battleId, userId) {
        console.log(`📋 Page switch: ${userId} for battle ${battleId}`);
        await this.safeReply(interaction, 'Page switched!', true);
    }

    async handleConfirmSelection(interaction, battleId, userId) {
        console.log(`✅ Confirm selection: ${userId} for battle ${battleId}`);
        await this.safeReply(interaction, 'Selection confirmed!', true);
    }

    async handleClearSelection(interaction, battleId, userId) {
        console.log(`🗑️ Clear selection: ${userId} for battle ${battleId}`);
        await this.safeReply(interaction, 'Selection cleared!', true);
    }

    async handleSkillUsage(interaction, battleId, userId, skillIndex) {
        console.log(`⚔️ Skill usage: ${userId} using skill ${skillIndex} in battle ${battleId}`);
        await this.safeReply(interaction, `Used skill ${skillIndex}!`, true);
    }

    async handleViewSkills(interaction, battleId, userId) {
        console.log(`📋 View skills: ${userId} for battle ${battleId}`);
        await this.safeReply(interaction, 'Skills viewed!', true);
    }

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
        
        // Also check pending invitations
        for (const [invitationId, invitation] of this.pendingInvitations.entries()) {
            if (invitation.challenger.user_id === userId || invitation.target.user_id === userId) {
                return invitationId;
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
            
            // Also clean up from pending invitations
            this.pendingInvitations.delete(battleId);
        } catch (error) {
            console.error('Error ending battle:', error);
        }
    }

    // Get battle stats
    getBattleStats() {
        const activeBattles = this.activeBattles.size;
        const pendingInvitations = this.pendingInvitations.size;
        
        const battles = Array.from(this.activeBattles.values()).map(battle => ({
            players: [
                battle.player1?.username || battle.challenger?.username || 'Unknown',
                battle.player2?.username || battle.target?.username || 'Unknown'
            ],
            status: battle.status || battle.type || 'unknown'
        }));

        const invitations = Array.from(this.pendingInvitations.values()).map(invitation => ({
            players: [invitation.challenger.username, invitation.target.username],
            status: 'pending_invitation'
        }));

        return {
            activeBattles,
            pendingInvitations,
            battles: [...battles, ...invitations]
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
