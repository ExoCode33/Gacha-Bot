// src/systems/pvp/queue.js - Complete Queue System (Fixed)
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

class QueueSystem {
    constructor(pvpSystem) {
        this.pvpSystem = pvpSystem;
        this.queue = new Map();
        this.queueTimers = new Map();
        this.cooldowns = new Map();
        this.maxQueueSize = 20;
        this.matchmakingTime = 2 * 60 * 1000; // 2 minutes
        this.battleCooldown = 5 * 60 * 1000; // 5 minutes between battles
    }

    async init() {
        console.log('🎯 PvP Queue System initialized');
    }

    async join(interaction, fighter) {
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
            const activeBattle = this.pvpSystem.getUserActiveBattle(userId);
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
            console.error('Error updating matchmaking embed:', error);
            this.removeFromQueue(queueData.userId);
        }
    }

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

    async handleMatchmakingTimeout(interaction, queueData) {
        const { userId, fighter } = queueData;

        console.log(`⏰ Matchmaking timeout for ${queueData.username} - starting boss battle`);

        // Remove from queue
        this.removeFromQueue(userId);

        // Set cooldown
        this.setCooldown(userId);

        try {
            // Start boss battle (fallback)
            await this.startBossBattle(interaction, queueData);
            
        } catch (error) {
            console.error('Error starting boss battle:', error);
            await interaction.editReply({
                content: '❌ Failed to start boss battle. Please try again.',
                embeds: [],
                components: []
            });
        }
    }

    async startBossBattle(interaction, queueData) {
        const { fighter } = queueData;

        // Simple boss battle simulation
        const embed = new EmbedBuilder()
            .setColor(0xFF4500)
            .setTitle('🤖 Boss Battle Started!')
            .setDescription(`**${fighter.username}** faces a mysterious boss!`)
            .addFields([
                {
                    name: '🏴‍☠️ Your Stats',
                    value: [
                        `**Level**: ${fighter.level}`,
                        `**Balanced CP**: ${fighter.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${fighter.maxHealth}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🤖 Boss Stats',
                    value: [
                        `**Level**: ${fighter.level + 2}`,
                        `**Boss CP**: ${Math.floor(fighter.balancedCP * 1.1).toLocaleString()}`,
                        `**Boss HP**: ${Math.floor(fighter.maxHealth * 1.2)}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚔️ Battle Result',
                    value: this.simulateBossBattle(fighter),
                    inline: false
                }
            ])
            .setFooter({ text: 'Boss battle complete! Try matchmaking again for PvP battles.' })
            .setTimestamp();
