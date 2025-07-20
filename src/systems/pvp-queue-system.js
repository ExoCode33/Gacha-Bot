// src/systems/pvp-queue-system.js - Enhanced Matchmaking Queue with Timer
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../database/manager');
const PvPBalanceSystem = require('./pvp-balance');

class PvPQueueSystem {
    constructor(enhancedPvPSystem) {
        this.enhancedPvP = enhancedPvPSystem;
        this.queue = new Map(); // userId -> queueData
        this.queueTimers = new Map(); // userId -> timeoutId
        this.maxQueueSize = 20;
        this.matchmakingTime = 2 * 60 * 1000; // 2 minutes in milliseconds
        this.cooldowns = new Map(); // userId -> lastBattleTime
        this.battleCooldown = 5 * 60 * 1000; // 5 minutes between battles
        
        console.log('🎯 Enhanced Matchmaking Queue System initialized');
        console.log(`   - Max Queue Size: ${this.maxQueueSize} players`);
        console.log(`   - Matchmaking Timer: ${this.matchmakingTime / 1000} seconds`);
        console.log(`   - Battle Cooldown: ${this.battleCooldown / 60000} minutes`);
    }

    // Join the matchmaking queue
    async joinQueue(interaction, fighter) {
        const userId = fighter.userId;
        const username = fighter.username;

        try {
            // Check if queue is full
            if (this.queue.size >= this.maxQueueSize) {
                return await interaction.reply({
                    content: `❌ Matchmaking queue is full! (${this.queue.size}/${this.maxQueueSize} players)\nPlease try again in a few minutes.`,
                    ephemeral: true
                });
            }

            // Check if player already in queue
            if (this.queue.has(userId)) {
                return await interaction.reply({
                    content: '⚔️ You are already in the matchmaking queue!',
                    ephemeral: true
                });
            }

            // Check if player has active battle
            const activeBattle = this.enhancedPvP.getUserActiveBattle(userId);
            if (activeBattle) {
                return await interaction.reply({
                    content: '⚔️ You already have an active battle! Finish it first.',
                    ephemeral: true
                });
            }

            // Check cooldown
            if (this.isOnCooldown(userId)) {
                const remaining = this.getRemainingCooldown(userId);
                return await interaction.reply({
                    content: `⏰ You must wait ${Math.ceil(remaining / 60000)} more minutes before joining another battle.`,
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
                guildId: interaction.guild?.id
            };

            this.queue.set(userId, queueData);

            // Defer reply for countdown
            await interaction.deferReply();

            // Start matchmaking timer
            await this.startMatchmakingTimer(interaction, queueData);

        } catch (error) {
            console.error('Error joining queue:', error);
            await interaction.reply({
                content: '❌ An error occurred while joining the queue.',
                ephemeral: true
            });
        }
    }

    // Start the 2-minute matchmaking countdown
    async startMatchmakingTimer(interaction, queueData) {
        const { userId, username, fighter } = queueData;
        let timeRemaining = this.matchmakingTime;
        const updateInterval = 5000; // Update every 5 seconds

        console.log(`🎯 Starting matchmaking timer for ${username} (${timeRemaining / 1000}s)`);

        // Create initial countdown embed
        await this.updateMatchmakingEmbed(interaction, queueData, timeRemaining);

        // Set up the countdown interval
        const countdownInterval = setInterval(async () => {
            timeRemaining -= updateInterval;

            // Check if player was matched or left queue
            if (!this.queue.has(userId)) {
                clearInterval(countdownInterval);
                return;
            }

            if (timeRemaining <= 0) {
                clearInterval(countdownInterval);
                await this.handleMatchmakingTimeout(interaction, queueData);
            } else {
                // Try to find a match every update
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

        // Store the interval ID for cleanup
        this.queueTimers.set(userId, countdownInterval);
    }

    // Update the matchmaking countdown embed
    async updateMatchmakingEmbed(interaction, queueData, timeRemaining) {
        const { username, fighter } = queueData;
        const secondsLeft = Math.ceil(timeRemaining / 1000);
        const progress = ((this.matchmakingTime - timeRemaining) / this.matchmakingTime) * 100;
        
        // Create progress bar
        const progressBars = 20;
        const filledBars = Math.floor((progress / 100) * progressBars);
        const emptyBars = progressBars - filledBars;
        const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

        const embed = new EmbedBuilder()
            .setColor(progress < 50 ? 0x3498DB : progress < 80 ? 0xF39C12 : 0xE74C3C)
            .setTitle('🎯 Enhanced Matchmaking - Searching for Opponent')
            .setDescription(
                `**${username}** is searching for a balanced opponent!\n\n` +
                `${progressBar}\n` +
                `⏰ **Time Remaining**: ${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}\n` +
                `🎮 **Queue Position**: ${Array.from(this.queue.keys()).indexOf(queueData.userId) + 1}/${this.queue.size}`
            )
            .addFields([
                {
                    name: '🏴‍☠️ Your Battle Stats',
                    value: [
                        `**Name**: ${fighter.username}`,
                        `**Level**: ${fighter.level}`,
                        `**Balanced CP**: ${fighter.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${fighter.maxHealth}`,
                        `**Fruits Available**: ${fighter.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎯 Matchmaking Info',
                    value: [
                        `**Search Range**: ${Math.floor(fighter.balancedCP * 0.7).toLocaleString()} - ${Math.floor(fighter.balancedCP * 1.3).toLocaleString()} CP`,
                        `**Players in Queue**: ${this.queue.size}/${this.maxQueueSize}`,
                        `**Matches Found**: Searching...`,
                        `**Fallback**: Boss battle if no match`,
                        `**Battle Type**: Enhanced Turn-Based PvP`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚡ What Happens Next?',
                    value: [
                        `🔍 **Searching**: Finding balanced opponents`,
                        `⚔️ **Match Found**: Instant battle start`,
                        `🤖 **No Match**: Face mysterious boss`,
                        `🔥 **Battle Type**: Real-time turn-based`,
                        `🏆 **Rewards**: Berries for PvE wins`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ 
                text: secondsLeft > 30 ? 
                    'Looking for the perfect opponent...' : 
                    'Preparing boss battle as backup...' 
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
            // If edit fails, the user might have left or interaction expired
            console.error('Error updating matchmaking embed:', error);
            this.removeFromQueue(queueData.userId);
        }
    }

    // Find a balanced match from the queue
    async findBalancedMatch(playerFighter) {
        const playerCP = playerFighter.balancedCP;
        const minCP = Math.floor(playerCP * 0.7); // 30% below
        const maxCP = Math.floor(playerCP * 1.3); // 30% above

        // Look for opponents in CP range (excluding the player themselves)
        for (const [opponentId, opponentData] of this.queue) {
            if (opponentId === playerFighter.userId) continue;

            const opponentCP = opponentData.fighter.balancedCP;
            
            // Check if CP is in acceptable range
            if (opponentCP >= minCP && opponentCP <= maxCP) {
                console.log(`🎯 Match found! ${playerFighter.username} (${playerCP} CP) vs ${opponentData.username} (${opponentCP} CP)`);
                return opponentData;
            }
        }

        return null; // No suitable opponent found
    }

    // Handle matchmaking timeout (no player found)
    async handleMatchmakingTimeout(interaction, queueData) {
        const { userId, fighter } = queueData;

        console.log(`⏰ Matchmaking timeout for ${queueData.username} - starting boss battle`);

        // Remove from queue
        this.removeFromQueue(userId);

        // Set cooldown
        this.setCooldown(userId);

        try {
            // Start enhanced battle vs NPC boss
            const battleId = await this.enhancedPvP.startBattle(interaction, fighter, null);
            
            console.log(`🤖 Boss battle started for ${queueData.username} - Battle ID: ${battleId}`);

        } catch (error) {
            console.error('Error starting boss battle:', error);
            await interaction.editReply({
                content: '❌ Failed to start boss battle. Please try again.',
                embeds: [],
                components: []
            });
        }
    }

    // Start a matched battle between two players
    async startMatchedBattle(interaction, player1Data, player2Data) {
        const { userId: userId1, fighter: fighter1 } = player1Data;
        const { userId: userId2, fighter: fighter2 } = player2Data;

        console.log(`⚔️ Starting matched battle: ${fighter1.username} vs ${fighter2.username}`);

        // Remove both players from queue
        this.removeFromQueue(userId1);
        this.removeFromQueue(userId2);

        // Set cooldowns for both players
        this.setCooldown(userId1);
        this.setCooldown(userId2);

        try {
            // Create match found embed
            const matchEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎯 MATCH FOUND!')
                .setDescription(`**${fighter1.username}** vs **${fighter2.username}**\n\nStarting enhanced turn-based battle...`)
                .addFields([
                    {
                        name: '🏴‍☠️ Player 1',
                        value: [
                            `**${fighter1.username}**`,
                            `Level: ${fighter1.level}`,
                            `CP: ${fighter1.balancedCP.toLocaleString()}`,
                            `HP: ${fighter1.maxHealth}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🏴‍☠️ Player 2', 
                        value: [
                            `**${fighter2.username}**`,
                            `Level: ${fighter2.level}`,
                            `CP: ${fighter2.balancedCP.toLocaleString()}`,
                            `HP: ${fighter2.maxHealth}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '⚔️ Battle Info',
                        value: [
                            `**Type**: Enhanced Turn-Based PvP`,
                            `**Balanced**: ✅ Fair matchmaking`,
                            `**Real-Time**: ✅ Live combat`,
                            `**Max Turns**: 15`,
                            `**Rewards**: Honor and glory!`
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setFooter({ text: 'Battle starting in 3 seconds...' })
                .setTimestamp();

            await interaction.editReply({
                embeds: [matchEmbed],
                components: []
            });

            // Brief delay for dramatic effect
            setTimeout(async () => {
                try {
                    // Start the enhanced PvP battle
                    const battleId = await this.enhancedPvP.startBattle(interaction, fighter1, fighter2);
                    console.log(`⚔️ PvP battle started - Battle ID: ${battleId}`);
                } catch (error) {
                    console.error('Error starting PvP battle:', error);
                }
            }, 3000);

        } catch (error) {
            console.error('Error in matched battle:', error);
            await interaction.editReply({
                content: '❌ Failed to start the matched battle. Please try again.',
                embeds: [],
                components: []
            });
        }
    }

    // Leave the queue
    async leaveQueue(interaction, userId) {
        if (!this.queue.has(userId)) {
            return await interaction.reply({
                content: '❌ You are not in the matchmaking queue.',
                ephemeral: true
            });
        }

        const queueData = this.queue.get(userId);
        this.removeFromQueue(userId);

        const embed = new EmbedBuilder()
            .setColor(0xFF8000)
            .setTitle('🚪 Left Matchmaking Queue')
            .setDescription(`**${queueData.username}** has left the matchmaking queue.`)
            .addFields([
                {
                    name: '📊 Queue Status',
                    value: [
                        `**Players in Queue**: ${this.queue.size}/${this.maxQueueSize}`,
                        `**Your Status**: Not in queue`,
                        `**Time in Queue**: ${Math.floor((Date.now() - queueData.joinTime) / 1000)}s`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'You can rejoin anytime with /pvp queue' });

        await interaction.update({
            embeds: [embed],
            components: []
        });
    }

    // Handle leave queue button
    async handleLeaveQueueButton(interaction, userId) {
        const buttonUserId = interaction.user.id;
        
        if (buttonUserId !== userId) {
            return await interaction.reply({
                content: '❌ You can only interact with your own queue!',
                ephemeral: true
            });
        }

        await this.leaveQueue(interaction, userId);
    }

    // Remove player from queue and cleanup
    removeFromQueue(userId) {
        if (this.queue.has(userId)) {
            this.queue.delete(userId);
            
            // Clear any active timer
            if (this.queueTimers.has(userId)) {
                clearInterval(this.queueTimers.get(userId));
                this.queueTimers.delete(userId);
            }
            
            console.log(`🚪 ${userId} removed from matchmaking queue. Queue size: ${this.queue.size}`);
        }
    }

    // Check if player is on cooldown
    isOnCooldown(userId) {
        if (!this.cooldowns.has(userId)) return false;
        
        const lastBattle = this.cooldowns.get(userId);
        return (Date.now() - lastBattle) < this.battleCooldown;
    }

    // Get remaining cooldown time
    getRemainingCooldown(userId) {
        if (!this.cooldowns.has(userId)) return 0;
        
        const lastBattle = this.cooldowns.get(userId);
        const elapsed = Date.now() - lastBattle;
        return Math.max(0, this.battleCooldown - elapsed);
    }

    // Set cooldown for player
    setCooldown(userId) {
        this.cooldowns.set(userId, Date.now());
    }

    // Get queue statistics
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

    // Cleanup old queue entries (run periodically)
    cleanup() {
        const now = Date.now();
        const maxWaitTime = 10 * 60 * 1000; // 10 minutes max
        
        let cleanedCount = 0;
        for (const [userId, queueData] of this.queue) {
            if (now - queueData.joinTime > maxWaitTime) {
                this.removeFromQueue(userId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} old queue entries`);
        }
        
        // Clean old cooldowns
        let cooldownsCleaned = 0;
        for (const [userId, lastBattle] of this.cooldowns) {
            if (now - lastBattle > this.battleCooldown * 2) { // Keep for 2x cooldown time
                this.cooldowns.delete(userId);
                cooldownsCleaned++;
            }
        }
        
        if (cooldownsCleaned > 0) {
            console.log(`🧹 Cleaned up ${cooldownsCleaned} old cooldowns`);
        }
    }
}

module.exports = PvPQueueSystem;
