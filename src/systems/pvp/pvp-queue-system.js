// src/systems/pvp/pvp-queue-system.js - Simple fallback queue system
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

class PvPQueueSystem {
    constructor(enhancedPvPSystem) {
        this.enhancedPvP = enhancedPvPSystem;
        this.queue = new Map(); // userId -> queueData
        this.queueTimers = new Map(); // userId -> timeoutId
        this.maxQueueSize = 20;
        this.matchmakingTime = 2 * 60 * 1000; // 2 minutes
        this.cooldowns = new Map(); // userId -> lastBattleTime
        this.battleCooldown = 5 * 60 * 1000; // 5 minutes between battles
        
        console.log('🎯 Simple PvP Queue System initialized');
    }

    // Join the matchmaking queue
    async joinQueue(interaction, fighter) {
        const userId = fighter.userId;

        try {
            // Check if queue is full
            if (this.queue.size >= this.maxQueueSize) {
                return await interaction.reply({
                    content: `❌ Queue is full! (${this.queue.size}/${this.maxQueueSize})`,
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

            // Add to queue
            const queueData = {
                userId,
                username: fighter.username,
                fighter,
                joinTime: Date.now(),
                balancedCP: fighter.balancedCP
            };

            this.queue.set(userId, queueData);
            
            // Start simple matchmaking
            await this.startSimpleMatchmaking(interaction, queueData);

        } catch (error) {
            console.error('Error joining queue:', error);
            await interaction.reply({
                content: '❌ Error joining queue.',
                ephemeral: true
            });
        }
    }

    // Simple matchmaking process
    async startSimpleMatchmaking(interaction, queueData) {
        await interaction.deferReply();
        
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🎯 Searching for Opponent')
            .setDescription(`**${queueData.username}** is looking for a battle!`)
            .addFields([
                {
                    name: '🏴‍☠️ Your Stats',
                    value: [
                        `**Level**: ${queueData.fighter.level}`,
                        `**CP**: ${queueData.fighter.balancedCP.toLocaleString()}`,
                        `**Fruits**: ${queueData.fighter.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎯 Queue Status',
                    value: [
                        `**Players**: ${this.queue.size}/${this.maxQueueSize}`,
                        `**Searching**: 60 seconds`,
                        `**Fallback**: Boss battle`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Searching for 60 seconds...' });

        const leaveButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`leave_queue_${queueData.userId}`)
                    .setLabel('🚪 Leave Queue')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [leaveButton]
        });

        // Set timeout for boss battle
        const timeoutId = setTimeout(async () => {
            if (this.queue.has(queueData.userId)) {
                await this.startBossBattle(interaction, queueData);
            }
        }, 60000); // 60 seconds

        this.queueTimers.set(queueData.userId, timeoutId);
    }

    // Start boss battle after timeout
    async startBossBattle(interaction, queueData) {
        this.removeFromQueue(queueData.userId);

        try {
            const battleId = await this.enhancedPvP.startBattle(interaction, queueData.fighter, null);
            console.log(`🤖 Boss battle started for ${queueData.username}`);
        } catch (error) {
            console.error('Error starting boss battle:', error);
            await interaction.editReply({
                content: '❌ Failed to start boss battle.',
                embeds: [],
                components: []
            });
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

        this.removeFromQueue(userId);
        
        const embed = new EmbedBuilder()
            .setColor(0xFF8000)
            .setTitle('🚪 Left Queue')
            .setDescription('You have left the matchmaking queue.');

        await interaction.update({
            embeds: [embed],
            components: []
        });
    }

    // Handle leave queue button
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
                clearTimeout(this.queueTimers.get(userId));
                this.queueTimers.delete(userId);
            }
            
            console.log(`🚪 ${userId} removed from queue. Size: ${this.queue.size}`);
        }
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
            averageWaitTime: 60 // Fixed 60 second wait
        };
    }

    // Cleanup
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [userId, queueData] of this.queue) {
            if (now - queueData.joinTime > 5 * 60 * 1000) { // 5 minutes
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
