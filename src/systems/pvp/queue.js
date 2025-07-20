const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

class QueueSystem {
    constructor(pvpSystem) {
        this.pvpSystem = pvpSystem;
        this.queue = new Map();
        this.maxQueueSize = 20;
        this.matchmakingTime = 2 * 60 * 1000; // 2 minutes
    }

    async init() {
        console.log('🎯 PvP Queue System initialized');
    }

    async join(interaction, fighter) {
        const userId = fighter.userId;

        if (this.queue.size >= this.maxQueueSize) {
            return await interaction.reply({
                content: `❌ Queue is full! (${this.queue.size}/${this.maxQueueSize})`,
                ephemeral: true
            });
        }

        if (this.queue.has(userId)) {
            return await interaction.reply({
                content: '⚔️ You are already in the queue!',
                ephemeral: true
            });
        }

        const queueData = {
            userId,
            username: fighter.username,
            fighter,
            joinTime: Date.now(),
            balancedCP: fighter.balancedCP
        };

        this.queue.set(userId, queueData);
        await interaction.deferReply();

        // Start matchmaking countdown
        await this.startMatchmaking(interaction, queueData);
    }

    async startMatchmaking(interaction, queueData) {
        let timeRemaining = this.matchmakingTime;
        const updateInterval = 10000; // 10 seconds

        const countdownInterval = setInterval(async () => {
            if (!this.queue.has(queueData.userId)) {
                clearInterval(countdownInterval);
                return;
            }

            timeRemaining -= updateInterval;

            // Try to find match
            const opponent = this.findMatch(queueData.fighter);
            if (opponent) {
                clearInterval(countdownInterval);
                await this.startMatchedBattle(interaction, queueData, opponent);
                return;
            }

            if (timeRemaining <= 0) {
                clearInterval(countdownInterval);
                await this.startBossBattle(interaction, queueData);
                return;
            }

            // Update countdown
            await this.updateCountdown(interaction, queueData, timeRemaining);
        }, updateInterval);

        // Initial display
        await this.updateCountdown(interaction, queueData, timeRemaining);
    }

    async updateCountdown(interaction, queueData, timeRemaining) {
        const secondsLeft = Math.ceil(timeRemaining / 1000);
        const progress = ((this.matchmakingTime - timeRemaining) / this.matchmakingTime) * 100;
        
        const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));

        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🎯 Matchmaking - Searching for Opponent')
            .setDescription(
                `**${queueData.username}** is searching for a balanced opponent!\n\n` +
                `${progressBar}\n` +
                `⏰ **Time Remaining**: ${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}`
            )
            .addFields([
                {
                    name: '🏴‍☠️ Your Stats',
                    value: [
                        `**Level**: ${queueData.fighter.level}`,
                        `**Balanced CP**: ${queueData.fighter.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${queueData.fighter.maxHealth}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎯 Queue Info',
                    value: [
                        `**Players in Queue**: ${this.queue.size}/${this.maxQueueSize}`,
                        `**Search Range**: ±30% CP`,
                        `**Fallback**: Boss battle`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Finding the perfect opponent...' });

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
            console.error('Error updating countdown:', error);
            this.removeFromQueue(queueData.userId);
        }
    }

    findMatch(playerFighter) {
        const playerCP = playerFighter.balancedCP;
        const minCP = Math.floor(playerCP * 0.7);
        const maxCP = Math.floor(playerCP * 1.3);

        for (const [opponentId, opponentData] of this.queue) {
            if (opponentId === playerFighter.userId) continue;

            const opponentCP = opponentData.fighter.balancedCP;
            if (opponentCP >= minCP && opponentCP <= maxCP) {
                return opponentData;
            }
        }
        return null;
    }

    async startMatchedBattle(interaction, player1Data, player2Data) {
        console.log(`⚔️ Match found: ${player1Data.username} vs ${player2Data.username}`);
        
        this.removeFromQueue(player1Data.userId);
        this.removeFromQueue(player2Data.userId);

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 MATCH FOUND!')
            .setDescription(`**${player1Data.username}** vs **${player2Data.username}**`)
            .addFields([
                {
                    name: '🏴‍☠️ Players',
                    value: `${player1Data.username} (${player1Data.fighter.balancedCP.toLocaleString()} CP)\nvs\n${player2Data.username} (${player2Data.fighter.balancedCP.toLocaleString()} CP)`,
                    inline: false
                }
            ])
            .setFooter({ text: 'Enhanced battle system coming soon!' });

        await interaction.editReply
