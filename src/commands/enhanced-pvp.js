// Enhanced PvP System Module
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class EnhancedPvPSystem {
    constructor() {
        this.pendingChallenges = new Map(); // battleId -> challenge data
        this.acceptedPlayers = new Map(); // battleId -> Set of userId
        this.battleTimeout = 60000; // 60 seconds
        this.DEBUG_BOT_IDS = ['DEBUG_BOT_ID_1', 'DEBUG_BOT_ID_2']; // Add your debug bot IDs
    }

    async createPvPChallenge(interaction, targetUser, battleType = 'enhanced') {
        const challenger = interaction.user;
        const target = targetUser;
        
        // Generate unique battle ID
        const battleId = `pvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Get player data from your existing database system
        const challengerData = await this.getUserData(challenger.id);
        const targetData = await this.getUserData(target.id);
        
        // Store challenge data
        const challengeData = {
            battleId,
            challenger: {
                user: challenger,
                data: challengerData,
                accepted: false
            },
            target: {
                user: target,
                data: targetData,
                accepted: false
            },
            battleType,
            timestamp: Date.now(),
            channel: interaction.channel
        };
        
        this.pendingChallenges.set(battleId, challengeData);
        this.acceptedPlayers.set(battleId, new Set());
        
        // Create individual messages for each player
        await this.sendChallengerMessage(interaction, challengeData);
        await this.sendTargetMessage(interaction, challengeData);
        
        // Auto-accept for debug bot
        if (this.isDebugBot(target)) {
            setTimeout(() => {
                this.autoAcceptDebugBot(battleId, target.id);
            }, 1000);
        }
        
        // Set timeout for challenge expiration
        setTimeout(() => {
            this.expireChallenge(battleId);
        }, this.battleTimeout);
        
        return battleId;
    }

    async sendChallengerMessage(interaction, challengeData) {
        const { challenger, target, battleId } = challengeData;
        
        const embed = new EmbedBuilder()
            .setColor('#FF6B35')
            .setTitle('⚔️ Enhanced Turn-Based PvP Battle Challenge!')
            .setDescription(`${challenger.user.username} has challenged ${target.user.displayName}!`)
            .addFields([
                {
                    name: '🔥 Challenger',
                    value: `**${challenger.user.username}**\nLevel: ${challenger.data.level || 'N/A'}\nTotal CP: ${(challenger.data.totalCP || 0).toLocaleString()}\nFruits: ${challenger.data.fruits || 0}`,
                    inline: true
                },
                {
                    name: '🎯 Target',
                    value: `**${target.user.displayName}**\nLevel: ${target.data.level || 'N/A'}\nTotal CP: ${(target.data.totalCP || 0).toLocaleString()}\nFruits: ${target.data.fruits || 0}`,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: '\u200B',
                    inline: true
                },
                {
                    name: '⚔️ Battle System',
                    value: '🎯 Enhanced Turn-Based Combat\n🍎 Choose 5 fruits for battle\n⚡ Turn-based skill combat\n🧠 Strategic depth and timing',
                    inline: false
                },
                {
                    name: '⏰ Time Limit',
                    value: '🚨 60 seconds to accept!',
                    inline: false
                }
            ])
            .setFooter({ text: `Battle ID: ${battleId} • Both players must accept! • ${new Date().toLocaleTimeString()}` })
            .setTimestamp();

        const challengerButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`pvp_accept_${battleId}_${challenger.user.id}`)
                    .setLabel(`${challenger.user.username} Accept`)
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId(`pvp_decline_${battleId}_${challenger.user.id}`)
                    .setLabel(`${challenger.user.username} Decline`)
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        await interaction.followUp({
            embeds: [embed],
            components: [challengerButton],
            ephemeral: false
        });
    }

    async sendTargetMessage(interaction, challengeData) {
        const { challenger, target, battleId } = challengeData;
        
        const embed = new EmbedBuilder()
            .setColor('#4ECDC4')
            .setTitle('⚔️ You\'ve Been Challenged!')
            .setDescription(`${target.user.displayName}, you've been challenged to an enhanced PvP battle!`)
            .addFields([
                {
                    name: '🔥 Challenger',
                    value: `**${challenger.user.username}**\nLevel: ${challenger.data.level || 'N/A'}\nTotal CP: ${(challenger.data.totalCP || 0).toLocaleString()}\nFruits: ${challenger.data.fruits || 0}`,
                    inline: true
                },
                {
                    name: '🎯 You',
                    value: `**${target.user.displayName}**\nLevel: ${target.data.level || 'N/A'}\nTotal CP: ${(target.data.totalCP || 0).toLocaleString()}\nFruits: ${target.data.fruits || 0}`,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: '\u200B',
                    inline: true
                },
                {
                    name: '⚔️ Battle System',
                    value: '🎯 Enhanced Turn-Based Combat\n🍎 Choose 5 fruits for battle\n⚡ Turn-based skill combat\n🧠 Strategic depth and timing',
                    inline: false
                }
            ])
            .setFooter({ text: `Battle ID: ${battleId} • Both players must accept!` })
            .setTimestamp();

        const targetButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`pvp_accept_${battleId}_${target.user.id}`)
                    .setLabel(`${target.user.displayName} Accept`)
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId(`pvp_decline_${battleId}_${target.user.id}`)
                    .setLabel(`${target.user.displayName} Decline`)
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        await interaction.followUp({
            content: `<@${target.user.id}>`,
            embeds: [embed],
            components: [targetButton],
            ephemeral: false
        });
    }

    async handleButtonInteraction(interaction) {
        const [action, type, battleId, userId] = interaction.customId.split('_');
        
        if (action !== 'pvp' || !['accept', 'decline'].includes(type)) return false;
        
        const challengeData = this.pendingChallenges.get(battleId);
        if (!challengeData) {
            await interaction.reply({
                content: '❌ This challenge has expired or no longer exists.',
                ephemeral: true
            });
            return true;
        }

        // Check if user is part of this challenge
        const isChallenger = challengeData.challenger.user.id === userId;
        const isTarget = challengeData.target.user.id === userId;
        
        if (!isChallenger && !isTarget) {
            await interaction.reply({
                content: '❌ You are not part of this challenge.',
                ephemeral: true
            });
            return true;
        }

        if (type === 'decline') {
            await this.declineChallenge(interaction, battleId, userId);
        } else if (type === 'accept') {
            await this.acceptChallenge(interaction, battleId, userId);
        }
        
        return true; // Indicates this interaction was handled
    }

    async acceptChallenge(interaction, battleId, userId) {
        const challengeData = this.pendingChallenges.get(battleId);
        const acceptedSet = this.acceptedPlayers.get(battleId);
        
        if (acceptedSet.has(userId)) {
            return await interaction.reply({
                content: '✅ You have already accepted this challenge!',
                ephemeral: true
            });
        }

        acceptedSet.add(userId);
        
        // Update challenge data
        if (challengeData.challenger.user.id === userId) {
            challengeData.challenger.accepted = true;
        } else if (challengeData.target.user.id === userId) {
            challengeData.target.accepted = true;
        }

        await interaction.reply({
            content: '✅ Challenge accepted! Waiting for the other player...',
            ephemeral: true
        });

        // Check if both players accepted
        if (acceptedSet.size === 2) {
            await this.startBattle(challengeData);
        }
    }

    async declineChallenge(interaction, battleId, userId) {
        const challengeData = this.pendingChallenges.get(battleId);
        
        await interaction.reply({
            content: '❌ Challenge declined.',
            ephemeral: true
        });

        // Send decline notification to channel
        const declineEmbed = new EmbedBuilder()
            .setColor('#FF4757')
            .setTitle('❌ Challenge Declined')
            .setDescription(`The PvP challenge has been declined by ${interaction.user.displayName}.`)
            .setTimestamp();

        await challengeData.channel.send({ embeds: [declineEmbed] });
        
        // Clean up
        this.pendingChallenges.delete(battleId);
        this.acceptedPlayers.delete(battleId);
    }

    async autoAcceptDebugBot(battleId, debugBotId) {
        const challengeData = this.pendingChallenges.get(battleId);
        if (!challengeData) return;

        const acceptedSet = this.acceptedPlayers.get(battleId);
        if (acceptedSet.has(debugBotId)) return;

        acceptedSet.add(debugBotId);
        
        // Update challenge data
        if (challengeData.target.user.id === debugBotId) {
            challengeData.target.accepted = true;
        }

        // Send auto-accept message
        const autoAcceptEmbed = new EmbedBuilder()
            .setColor('#00D2D3')
            .setTitle('🤖 Debug Bot Auto-Accept')
            .setDescription(`Debug bot has automatically accepted the challenge!`)
            .setTimestamp();

        await challengeData.channel.send({ embeds: [autoAcceptEmbed] });

        // Check if both players accepted
        if (acceptedSet.size === 2) {
            await this.startBattle(challengeData);
        }
    }

    async startBattle(challengeData) {
        const { battleId, challenger, target, channel } = challengeData;
        
        // Send battle start confirmation
        const startEmbed = new EmbedBuilder()
            .setColor('#FFD93D')
            .setTitle('🔥 Battle Starting!')
            .setDescription(`Both players have accepted! The enhanced PvP battle is about to begin!`)
            .addFields([
                {
                    name: '⚔️ Combatants',
                    value: `${challenger.user.username} vs ${target.user.displayName}`,
                    inline: false
                },
                {
                    name: '🎯 Battle Type',
                    value: 'Enhanced Turn-Based Combat',
                    inline: true
                },
                {
                    name: '🍎 Fruit Selection',
                    value: 'Choose your 5 battle fruits!',
                    inline: true
                }
            ])
            .setTimestamp();

        await channel.send({ embeds: [startEmbed] });
        
        // Clean up challenge data
        this.pendingChallenges.delete(battleId);
        this.acceptedPlayers.delete(battleId);
        
        // Initialize the actual battle system
        await this.initializeBattle(challenger, target, channel, battleId);
    }

    async expireChallenge(battleId) {
        const challengeData = this.pendingChallenges.get(battleId);
        if (!challengeData) return;

        const acceptedSet = this.acceptedPlayers.get(battleId);
        if (acceptedSet && acceptedSet.size < 2) {
            const expireEmbed = new EmbedBuilder()
                .setColor('#95A5A6')
                .setTitle('⏰ Challenge Expired')
                .setDescription('The PvP challenge has expired due to timeout.')
                .setTimestamp();

            await challengeData.channel.send({ embeds: [expireEmbed] });
            
            // Clean up
            this.pendingChallenges.delete(battleId);
            this.acceptedPlayers.delete(battleId);
        }
    }

    async initializeBattle(challenger, target, channel, battleId) {
        // Placeholder for actual battle system integration
        const battleEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('⚔️ Battle System Initialized')
            .setDescription(`Battle ${battleId} has started between ${challenger.user.username} and ${target.user.displayName}!`)
            .addFields([
                {
                    name: '📝 Next Steps',
                    value: '• Select your battle fruits\n• Prepare your strategy\n• Battle begins in 10 seconds!',
                    inline: false
                }
            ])
            .setTimestamp();

        await channel.send({ embeds: [battleEmbed] });
        
        // TODO: Integrate with your existing battle system
        // Example: await this.battleManager.startEnhancedBattle(challenger, target, channel, battleId);
    }

    isDebugBot(user) {
        return user.username.toLowerCase().includes('debug') || 
               user.username.toLowerCase().includes('bot') ||
               this.DEBUG_BOT_IDS.includes(user.id) ||
               user.bot === true;
    }

    async getUserData(userId) {
        // TODO: Replace with your actual database calls
        // This should integrate with your existing database manager
        try {
            // Example integration with your database:
            // const db = require('../../database/manager');
            // const userData = await db.getUser(userId);
            // const userFruits = await db.getUserFruits(userId);
            // const userLevel = await db.getUserLevel(userId);
            
            // Placeholder data - replace with actual database calls
            return {
                level: Math.floor(Math.random() * 50) + 1,
                totalCP: Math.floor(Math.random() * 10000) + 1000,
                fruits: Math.floor(Math.random() * 100) + 10,
                wins: Math.floor(Math.random() * 20),
                losses: Math.floor(Math.random() * 15)
            };
        } catch (error) {
            console.error(`Error fetching user data for ${userId}:`, error);
            return {
                level: 1,
                totalCP: 1000,
                fruits: 10,
                wins: 0,
                losses: 0
            };
        }
    }
}

module.exports = EnhancedPvPSystem;
