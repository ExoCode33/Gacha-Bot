// src/systems/pvp/enhanced-turn-based-pvp.js - FIXED VERSION with Public Accept/Decline
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

    // Main battle initiation - FIXED to use public accept/decline
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

            // Create battle invitation with public accept/decline
            const battleId = `pvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await this.createPublicBattleInvitation(interaction, battleId, challenger, target, challengerData, targetData, challengerFruits, targetFruits);

        } catch (error) {
            console.error('Error initiating enhanced battle:', error);
            await this.safeReply(interaction, '❌ An error occurred while initiating the battle.', true);
        }
    }

    // NEW METHOD: Create battle invitation with public accept/decline buttons
    async createPublicBattleInvitation(interaction, battleId, challenger, target, challengerData, targetData, challengerFruits, targetFruits) {
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
            console.log(`💾 Stored battle with ID: ${battleId}`);
            console.log(`📋 Battle data keys:`, Object.keys(battleData));

            // PUBLIC MESSAGE with accept/decline buttons for BOTH players
            const publicEmbed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('⚔️ Enhanced Turn-Based PvP Battle Challenge!')
                .setDescription(`**${challenger.username}** has challenged **${target.username}** to an enhanced turn-based battle!\n\n🔥 **Both players must accept to start the battle!**`)
                .addFields([
                    { 
                        name: `🏴‍☠️ ${challenger.username} (Challenger)`, 
                        value: [
                            `**Level**: ${challengerData.level || 0}`,
                            `**Total CP**: ${challengerData.total_cp?.toLocaleString() || 0}`,
                            `**Fruits**: ${challengerFruits.length}`,
                            `**Status**: ⏳ Waiting to accept...`
                        ].join('\n'), 
                        inline: true 
                    },
                    { 
                        name: `🏴‍☠️ ${target.username} (Target)`, 
                        value: [
                            `**Level**: ${targetData.level || 0}`,
                            `**Total CP**: ${targetData.total_cp?.toLocaleString() || 0}`,
                            `**Fruits**: ${targetFruits.length}`,
                            `**Status**: ⏳ Waiting to accept...`
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
                .setFooter({ text: `Battle ID: ${battleId} • Both players must accept!` })
                .setTimestamp();

            // FIXED: Create buttons with simple, correct format
            const acceptDeclineRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`accept_${battleId}_${challenger.id}`)
                        .setLabel(`✅ ${challenger.username} Accept`)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`decline_${battleId}_${challenger.id}`)
                        .setLabel(`❌ ${challenger.username} Decline`)
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`accept_${battleId}_${target.id}`)
                        .setLabel(`✅ ${target.username} Accept`)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`decline_${battleId}_${target.id}`)
                        .setLabel(`❌ ${target.username} Decline`)
                        .setStyle(ButtonStyle.Danger)
                );

            console.log(`🔘 Created buttons:`);
            console.log(`   - accept_${battleId}_${challenger.id} for ${challenger.username}`);
            console.log(`   - decline_${battleId}_${challenger.id} for ${challenger.username}`);
            console.log(`   - accept_${battleId}_${target.id} for ${target.username}`);
            console.log(`   - decline_${battleId}_${target.id} for ${target.username}`);

            // Send public message with buttons
            await this.safeReply(interaction, `<@${challenger.id}> <@${target.id}> 🔥 **PvP Challenge!**`, false, [publicEmbed], [acceptDeclineRow]);

            // Set timeout for invitation
            this.battleTimeouts.set(battleId, setTimeout(() => {
                this.handleInvitationTimeout(interaction, battleId);
            }, this.INVITATION_TIMEOUT));

            console.log(`✅ Public battle invitation created: ${battleId}`);

        } catch (error) {
            console.error('Error creating public battle invitation:', error);
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

    // Handle battle response (accept/decline) - FIXED with simple parsing
    async handleBattleResponse(interaction) {
        try {
            console.log(`🔘 === BUTTON RESPONSE DEBUG ===`);
            console.log(`🔘 Raw button ID: ${interaction.customId}`);
            console.log(`👤 Button clicked by: ${interaction.user.username} (${interaction.user.id})`);
            
            const parts = interaction.customId.split('_');
            console.log(`📋 Button parts:`, parts);
            
            if (parts.length < 3) {
                console.log(`❌ Invalid button format - not enough parts`);
                return await this.safeReply(interaction, '❌ Invalid button format!', true);
            }
            
            const action = parts[0]; // accept or decline
            const battleId = parts[1]; // battle ID
            const expectedUserId = parts[2]; // user ID
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
            content: `❌ **${interaction.user.username}** declined the battle challenge.`,
            embeds: [], 
            components: [] 
        });

        console.log(`❌ Battle ${battleId} declined by ${interaction.user.username}`);
    }

    // Handle accept
    async handleAccept(interaction, battleId, battle, userId) {
        battle.acceptedBy.add(userId);
        battle.lastActivity = Date.now();
        
        console.log(`✅ ${interaction.user.username} accepted battle ${battleId}`);
        console.log(`📊 Accepted by: ${Array.from(battle.acceptedBy)}`);
        console.log(`🎯 Need acceptance from: ${battle.challenger.user_id}, ${battle.target.user_id}`);

        // Check if both players have accepted
        const challengerAccepted = battle.acceptedBy.has(battle.challenger.user_id);
        const targetAccepted = battle.acceptedBy.has(battle.target.user_id);
        
        console.log(`✅ Challenger ${battle.challenger.username} accepted: ${challengerAccepted}`);
        console.log(`✅ Target ${battle.target.username} accepted: ${targetAccepted}`);

        if (challengerAccepted && targetAccepted) {
            // Both players accepted, start the battle
            console.log(`🔥 Both players accepted! Starting fruit selection...`);
            
            await this.safeUpdate(interaction, {
                content: `🔥 **BOTH PLAYERS ACCEPTED!** Starting enhanced turn-based battle between **${battle.challenger.username}** and **${battle.target.username}**!`,
                embeds: [],
                components: []
            });

            // Start fruit selection phase
            await this.startFruitSelection(interaction, battleId);
        } else {
            // Update the message to show who has accepted
            const statusText = `✅ **${interaction.user.username}** accepted the challenge!\n\n` +
                `**${battle.challenger.username}**: ${challengerAccepted ? '✅ Ready' : '⏳ Waiting...'}\n` +
                `**${battle.target.username}**: ${targetAccepted ? '✅ Ready' : '⏳ Waiting...'}\n\n` +
                `${challengerAccepted && targetAccepted ? '🔥 **Starting battle!**' : '⏳ Waiting for the other player...'}`;

            await this.safeUpdate(interaction, {
                content: statusText,
                embeds: [],
                components: []
            });
        }
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
