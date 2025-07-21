// src/systems/pvp/pvp-queue-system.js - Enhanced Matchmaking Queue
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../../database/manager');

class PvPQueueSystem {
    constructor(enhancedPvPSystem) {
        this.enhancedPvP = enhancedPvPSystem;
        this.queue = new Map(); // userId -> queueData
        this.queueTimers = new Map(); // userId -> timeoutId
        this.maxQueueSize = 20;
        this.matchmakingTime = 2 * 60 * 1000; // 2 minutes
        this.cooldowns = new Map(); // userId -> lastBattleTime
        this.battleCooldown = 5 * 60 * 1000; // 5 minutes between battles
        
        console.log('🎯 Enhanced Matchmaking Queue System initialized');
    }

    // Join the matchmaking queue
    async joinQueue(interaction, fighter) {
        const userId = fighter.userId;
        const username = fighter.username;

        try {
            // Check if queue is full
            if (this.queue.size >= this.maxQueueSize) {
                return await interaction.reply({
                    content: `❌ Queue is full! (${this.queue.size}/${this.maxQueueSize})\nTry again in a few minutes.`,
                    ephemeral: true
                });
            }

            // Check if already in queue
            if (this.queue.has(userId)) {
                return await interaction.reply({
                    content: '⚔️ You are already in the matchmaking queue!',
                    ephemeral: true
                });
            }

            // Check for active battle
            const activeBattle = this.enhancedPvP.getUserActiveBattle(userId);
            if (activeBattle) {
                return await interaction.reply({
                    content: '⚔️ You already have an active battle!',
                    ephemeral: true
                });
            }

            // Check cooldown
            if (this.isOnCooldown(userId)) {
                const remaining = Math.ceil(this.getRemainingCooldown(userId) / 60000);
                return await interaction.reply({
                    content: `⏰ Wait ${remaining} more minutes before joining another battle.`,
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
                channelId: interaction.channel.id
            };

            this.queue.set(userId, queueData);
            await interaction.deferReply();

            // Start matchmaking timer
            await this.startMatchmakingTimer(interaction, queueData);

        } catch (error) {
            console.error('Error joining queue:', error);
            await interaction.reply({
                content: '❌ Error joining queue.',
                ephemeral: true
            });
        }
    }

    // Start the matchmaking countdown
    async startMatchmakingTimer(interaction, queueData) {
        const { userId, username, fighter } = queueData;
        let timeRemaining = this.matchmakingTime;
        const updateInterval = 5000; // Update every 5 seconds

        console.log(`🎯 Starting matchmaking for ${username}`);

        // Create initial countdown embed
        await this.updateMatchmakingEmbed(interaction, queueData, timeRemaining);

        // Set up countdown interval
        const countdownInterval = setInterval(async () => {
            timeRemaining -= updateInterval;

            // Check if player was matched or left
            if (!this.queue.has(userId)) {
                clearInterval(countdownInterval);
                return;
            }

            if (timeRemaining <= 0) {
                clearInterval(countdownInterval);
                await this.handleMatchmakingTimeout(interaction, queueData);
            } else {
                // Try to find a match
                const opponent = await this.findBalancedMatch(fighter);
                if (opponent) {
                    clearInterval(countdownInterval);
                    await this.startMatchedBattle(interaction, queueData, opponent);
                    return;
                }

                // Update countdown
                await this.updateMatchmakingEmbed(interaction, queueData, timeRemaining);
            }
        }, updateInterval);

        this.queueTimers.set(userId, countdownInterval);
    }

    // Update matchmaking embed
    async updateMatchmakingEmbed(interaction, queueData, timeRemaining) {
        const { username, fighter } = queueData;
        const secondsLeft = Math.ceil(timeRemaining / 1000);
        const progress = ((this.matchmakingTime - timeRemaining) / this.matchmakingTime) * 100;
        
        // Progress bar
        const progressBars = 20;
        const filledBars = Math.floor((progress / 100) * progressBars);
        const emptyBars = progressBars - filledBars;
        const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

        const embed = new EmbedBuilder()
            .setColor(progress < 50 ? 0x3498DB : 0xF39C12)
            .setTitle('🎯 Enhanced Matchmaking - Searching')
            .setDescription(
                `**${username}** searching for opponent!\n\n` +
                `${progressBar}\n` +
                `⏰ **Time**: ${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}\n` +
                `🎮 **Position**: ${Array.from(this.queue.keys()).indexOf(queueData.userId) + 1}/${this.queue.size}`
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
                        `**Range**: ${Math.floor(fighter.balancedCP * 0.7).toLocaleString()} - ${Math.floor(fighter.balancedCP * 1.3).toLocaleString()} CP`,
                        `**Queue**: ${this.queue.size}/${this.maxQueueSize}`,
                        `**Status**: Searching...`,
                        `**Fallback**: Boss battle`,
                        `**Type**: Turn-Based PvP`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ 
                text: secondsLeft > 30 ? 'Looking for opponent...' : 'Preparing boss battle...' 
            })
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
            console.error('Error updating embed:', error);
            this.removeFromQueue(queueData.userId);
        }
    }

    // Find balanced match
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

    // Handle timeout - start boss battle
    async handleMatchmakingTimeout(interaction, queueData) {
        const { userId, fighter } = queueData;

        console.log(`⏰ Timeout for ${queueData.username} - starting boss battle`);

        this.removeFromQueue(userId);
        this.setCooldown(userId);

        try {
            // Start enhanced battle vs boss
            const battleId = await this.enhancedPvP.startBattle(interaction, fighter, null);
            console.log(`🤖 Boss battle started - ID: ${battleId}`);
        } catch (error) {
            console.error('Error starting boss battle:', error);
            await interaction.editReply({
                content: '❌ Failed to start boss battle.',
                embeds: [],
                components: []
            });
        }
    }

    // Start matched PvP battle
    async startMatchedBattle(interaction, player1Data, player2Data) {
        const { userId: userId1, fighter: fighter1 } = player1Data;
        const { userId: userId2, fighter: fighter2 } = player2Data;

        console.log(`⚔️ PvP: ${fighter1.username} vs ${fighter2.username}`);

        this.removeFromQueue(userId1);
        this.removeFromQueue(userId2);
        this.setCooldown(userId1);
        this.setCooldown(userId2);

        try {
            const matchEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎯 MATCH FOUND!')
                .setDescription(`**${fighter1.username}** vs **${fighter2.username}**\n\nStarting turn-based battle...`)
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
                .setFooter({ text: 'Starting in 3 seconds...' });

            await interaction.editReply({
                embeds: [matchEmbed],
                components: []
            });

            setTimeout(async () => {
                try {
                    const battleId = await this.enhancedPvP.startBattle(interaction, fighter1, fighter2);
                    console.log(`⚔️ PvP battle started - ID: ${battleId}`);
                } catch (error) {
                    console.error('Error starting PvP battle:', error);
                }
            }, 3000);

        } catch (error) {
            console.error('Error in matched battle:', error);
        }
    }

    // Leave queue
    async leaveQueue(interaction, userId) {
        if (!this.queue.has(userId)) {
            return await interaction.reply({
                content: '❌ You are not in queue.',
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
                    name: '📊 Status',
                    value: [
                        `**Queue Size**: ${this.queue.size}/${this.maxQueueSize}`,
                        `**Your Status**: Not in queue`,
                        `**Time in Queue**: ${Math.floor((Date.now() - queueData.joinTime) / 1000)}s`
                    ].join('\n')
                }
            ]);

        await interaction.update({
            embeds: [embed],
            components: []
        });
    }

    // Handle leave button
    async handleLeaveQueueButton(interaction, userId) {
        if (interaction.user.id !== userId) {
            return await interaction.reply({
                content: '❌ You can only interact with your own queue!',
                ephemeral: true
            });
        }
        await this.leaveQueue(interaction, userId);
    }

    // Remove from queue
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

    // Get queue stats
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

    // Cleanup old entries
    cleanup() {
        const now = Date.now();
        const maxWaitTime = 10 * 60 * 1000; // 10 minutes
        
        let cleaned = 0;
        for (const [userId, queueData] of this.queue) {
            if (now - queueData.joinTime > maxWaitTime) {
                this.removeFromQueue(userId);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} old queue entries`);
        }
    }
}

module.exports = PvPQueueSystem;
