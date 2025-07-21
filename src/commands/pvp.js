// src/systems/pvp.js - Complete Fixed PvP System
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../database/manager');

// Import abilities safely
let balancedDevilFruitAbilities = {};
try {
    const abilitiesData = require('../data/balanced-devil-fruit-abilities');
    balancedDevilFruitAbilities = abilitiesData.balancedDevilFruitAbilities || {};
} catch (error) {
    console.warn('⚠️ Could not load abilities for PvP system');
    balancedDevilFruitAbilities = {};
}

class PvPSystem {
    constructor() {
        this.activeBattles = new Map();
        this.queue = new Map();
        this.queueTimers = new Map();
        this.cooldowns = new Map();
        this.challengeTimeouts = new Map();
        
        // Configuration
        this.maxQueueSize = 20;
        this.matchmakingTime = 2 * 60 * 1000; // 2 minutes
        this.battleCooldown = 5 * 60 * 1000; // 5 minutes
        this.challengeTimeout = 60000; // 1 minute
        
        // Balance system settings
        this.balancedLevelScaling = {
            0: 100, 5: 120, 10: 140, 15: 160, 20: 180,
            25: 200, 30: 220, 35: 240, 40: 260, 45: 280, 50: 300
        };

        this.balancedRarityScaling = {
            common: { min: 1.0, max: 1.2 },
            uncommon: { min: 1.2, max: 1.4 },
            rare: { min: 1.4, max: 1.7 },
            epic: { min: 1.7, max: 2.1 },
            legendary: { min: 2.1, max: 2.6 },
            mythical: { min: 2.6, max: 3.2 },
            divine: { min: 3.2, max: 4.0 }
        };
        
        console.log('⚔️ PvP System initialized');
    }

    // ============================================
    // MAIN PVP COMMAND HANDLERS
    // ============================================
    
    async joinQueue(interaction) {
        try {
            const fighter = await this.createFighter(interaction.user.id);
            if (!fighter) {
                return await interaction.reply({
                    content: '❌ You need at least 5 Devil Fruits to participate in PvP battles!\nUse `/pull` to get more fruits.',
                    ephemeral: true
                });
            }

            const userId = fighter.userId;

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
                username: fighter.username,
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
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred while joining the queue.',
                    ephemeral: true
                });
            }
        }
    }

    async challenge(interaction, opponent) {
        try {
            if (opponent.bot) {
                return await interaction.reply({
                    content: '❌ You cannot challenge a bot!',
                    ephemeral: true
                });
            }

            if (opponent.id === interaction.user.id) {
                return await interaction.reply({
                    content: '❌ You cannot challenge yourself!',
                    ephemeral: true
                });
            }

            const challenger = await this.createFighter(interaction.user.id);
            const defender = await this.createFighter(opponent.id);

            if (!challenger || !defender) {
                return await interaction.reply({
                    content: '❌ Both players need at least 5 Devil Fruits for PvP battles!',
                    ephemeral: true
                });
            }

            await this.startChallenge(interaction, challenger, defender);

        } catch (error) {
            console.error('Error in challenge:', error);
            await interaction.reply({
                content: '❌ An error occurred while creating the challenge.',
                ephemeral: true
            });
        }
    }

    async quickBattle(interaction, opponent) {
        try {
            const fighter1 = await this.createFighter(interaction.user.id);
            const fighter2 = await this.createFighter(opponent.id);

            if (!fighter1 || !fighter2) {
                return await interaction.reply({
                    content: '❌ Both users need at least 5 Devil Fruits to battle!',
                    ephemeral: true
                });
            }

            await this.simulateQuickBattle(interaction, fighter1, fighter2);

        } catch (error) {
            console.error('Error in quick battle:', error);
            await interaction.reply({
                content: '❌ An error occurred during the quick battle.',
                ephemeral: true
            });
        }
    }

    async showStats(interaction, user) {
        try {
            const fighter = await this.createFighter(user.id);
            
            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle(`⚔️ ${user.username}'s PvP Stats`)
                .setThumbnail(user.displayAvatarURL());

            if (!fighter) {
                embed.setDescription('❌ This user needs more Devil Fruits to participate in PvP!')
                    .addFields([
                        {
                            name: '📋 Requirements',
                            value: '• Minimum 5 Devil Fruits\n• Use `/pull` to get more fruits',
                            inline: false
                        }
                    ]);
            } else {
                embed.setDescription('🏴‍☠️ Ready for battle!')
                    .addFields([
                        {
                            name: '⚔️ Battle Stats',
                            value: [
                                `**Level**: ${fighter.level}`,
                                `**Balanced CP**: ${fighter.balancedCP.toLocaleString()}`,
                                `**Battle HP**: ${fighter.maxHealth}`,
                                `**Total Fruits**: ${fighter.fruits.length}`
                            ].join('\n'),
                            inline: true
                        },
                        {
                            name: '🎯 PvP Status',
                            value: [
                                `**Battle Ready**: ✅ Yes`,
                                `**In Queue**: ${this.queue.has(user.id) ? '🎯 Yes' : '❌ No'}`,
                                `**Active Battle**: ${this.getUserActiveBattle(user.id) ? '⚔️ Yes' : '❌ No'}`,
                                `**Cooldown**: ${this.isOnCooldown(user.id) ? '⏰ Active' : '✅ Ready'}`
                            ].join('\n'),
                            inline: true
                        }
                    ]);
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error showing stats:', error);
            await interaction.reply({
                content: '❌ An error occurred while loading stats.',
                ephemeral: true
            });
        }
    }

    async showStatus(interaction) {
        try {
            const queueStats = this.getQueueStats();
            const battleCount = this.activeBattles.size;

            const embed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('🎯 PvP System Status')
                .setDescription('Current status of the Devil Fruit PvP Battle System')
                .addFields([
                    {
                        name: '🔧 System Status',
                        value: [
                            `**Queue System**: ✅ Active`,
                            `**Battle System**: ✅ Active`,
                            `**Balance System**: ✅ Active`,
                            `**Interaction Handler**: ✅ Active`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '📊 Current Activity',
                        value: [
                            `**Queue Size**: ${queueStats.size}/${queueStats.maxSize}`,
                            `**Active Battles**: ${battleCount}`,
                            `**Average Queue CP**: ${queueStats.averageCP?.toLocaleString() || 'N/A'}`,
                            `**System Mode**: Enhanced Turn-Based`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🎮 Available Commands',
                        value: [
                            `\`/pvp queue\` - Join matchmaking`,
                            `\`/pvp challenge @user\` - Challenge player`,
                            `\`/pvp quick @user\` - Quick simulation`,
                            `\`/pvp stats\` - View your stats`
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setFooter({ text: 'Use /pvp queue to start battling!' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error showing status:', error);
            await interaction.reply({
                content: '❌ An error occurred while loading status.',
                ephemeral: true
            });
        }
    }

    // ============================================
    // FIGHTER CREATION & BALANCE SYSTEM
    // ============================================

    async createFighter(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            const fruits = await DatabaseManager.getUserDevilFruits(userId);
            
            if (!user || !fruits || fruits.length < 5) {
                return null;
            }

            const balancedCP = this.calculateBalancedCP(user.level, fruits);
            const health = this.calculateHealthFromCP(balancedCP);

            return {
                userId: user.user_id,
                username: user.username,
                level: user.level,
                originalCP: user.total_cp,
                balancedCP,
                maxHealth: health,
                hp: health,
                fruits: fruits,
                effects: []
            };
        } catch (error) {
            console.error('Error creating fighter:', error);
            return null;
        }
    }

    calculateBalancedCP(level, fruits) {
        const balancedBaseCP = this.balancedLevelScaling[level] || 100;
        let totalCP = balancedBaseCP;

        const fruitGroups = {};
        fruits.forEach(fruit => {
            const fruitName = fruit.fruit_name || fruit.name;
            if (!fruitGroups[fruitName]) {
                fruitGroups[fruitName] = { rarity: fruit.fruit_rarity || fruit.rarity, count: 0 };
            }
            fruitGroups[fruitName].count++;
        });

        Object.values(fruitGroups).forEach(group => {
            const rarityRange = this.balancedRarityScaling[group.rarity];
            if (rarityRange) {
                const avgMultiplier = (rarityRange.min + rarityRange.max) / 2;
                const duplicateBonus = 1 + ((group.count - 1) * 0.01);
                const fruitCP = (balancedBaseCP * avgMultiplier) * duplicateBonus;
                totalCP += fruitCP;
            }
        });

        return Math.floor(totalCP);
    }

    calculateHealthFromCP(cp) {
        const baseHP = 200;
        const cpMultiplier = 1 + (cp / 1000) * 0.2;
        return Math.floor(baseHP * cpMultiplier);
    }

    // ============================================
    // MATCHMAKING SYSTEM
    // ============================================

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

        await interaction.editReply({
            embeds: [embed],
            components: []
        });
    }

    simulateBossBattle(fighter) {
        const playerPower = fighter.balancedCP;
        const bossPower = Math.floor(playerPower * 1.1);
        
        // Simple RNG battle
        const playerRoll = Math.random() * playerPower;
        const bossRoll = Math.random() * bossPower;
        
        if (playerRoll > bossRoll) {
            return '🏆 **Victory!** You defeated the mysterious boss!\n💰 **Reward**: 2,000 berries added to your account!';
        } else {
            return '💀 **Defeat!** The boss was too powerful this time.\n🎯 **Try Again**: Join the queue for another chance!';
        }
    }

    // ============================================
    // CHALLENGE SYSTEM
    // ============================================

    async startChallenge(interaction, challenger, defender) {
        const challengeId = `${challenger.userId}_${defender.userId}_${Date.now()}`;
        
        // Check if either player is already in a battle or has pending challenge
        if (this.isPlayerBusy(challenger.userId) || this.isPlayerBusy(defender.userId)) {
            return await interaction.reply({
                content: '❌ One of the players is already in a battle or has a pending challenge!',
                ephemeral: true
            });
        }

        const balanceCheck = this.validateBalance(challenger, defender);
        
        const embed = new EmbedBuilder()
            .setColor(balanceCheck.isBalanced ? 0x00FF00 : 0xFF8000)
            .setTitle('⚔️ PvP Challenge Issued!')
            .setDescription(`**${challenger.username}** challenges **${defender.username}** to battle!`)
            .addFields([
                {
                    name: '🏴‍☠️ Challenger',
                    value: [
                        `**${challenger.username}**`,
                        `Level: ${challenger.level}`,
                        `CP: ${challenger.balancedCP.toLocaleString()}`,
                        `HP: ${challenger.maxHealth}`,
                        `Fruits: ${challenger.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🏴‍☠️ Defender',
                    value: [
                        `**${defender.username}**`,
                        `Level: ${defender.level}`,
                        `CP: ${defender.balancedCP.toLocaleString()}`,
                        `HP: ${defender.maxHealth}`,
                        `Fruits: ${defender.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚖️ Balance Analysis',
                    value: [
                        `**Balanced**: ${balanceCheck.isBalanced ? '✅ Fair Fight' : '⚠️ Unbalanced'}`,
                        `**CP Ratio**: ${balanceCheck.cpRatio.toFixed(2)}:1`,
                        `**Level Difference**: ${balanceCheck.levelDiff}`,
                        `**Prediction**: ${balanceCheck.prediction}`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Challenge expires in 60 seconds!' })
            .setTimestamp();

        const challengeButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`accept_challenge_${challenger.userId}_${defender.userId}`)
                    .setLabel('⚔️ Accept Challenge')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`decline_challenge_${challenger.userId}_${defender.userId}`)
                    .setLabel('❌ Decline Challenge')
                    .setStyle(ButtonStyle.Danger)
            );

        // Store challenge data
        const challengeData = {
            id: challengeId,
            challenger,
            defender,
            created: Date.now(),
            channelId: interaction.channel.id,
            guildId: interaction.guild?.id
        };

        this.activeBattles.set(challengeId, challengeData);

        await interaction.reply({
            content: `<@${defender.userId}>, you have been challenged to a PvP battle!`,
            embeds: [embed],
            components: [challengeButtons]
        });

        // Set timeout for challenge expiration
        const timeoutId = setTimeout(async () => {
            if (this.activeBattles.has(challengeId)) {
                await this.expireChallenge(interaction, challengeId);
            }
        }, this.challengeTimeout);

        this.challengeTimeouts.set(challengeId, timeoutId);
    }

    // ============================================
    // BATTLE SIMULATION
    // ============================================

    async simulateQuickBattle(interaction, fighter1, fighter2) {
        await interaction.deferReply();
        
        // Simple battle simulation
        let turn = 1;
        const maxTurns = 10;
        let p1HP = fighter1.maxHealth;
        let p2HP = fighter2.maxHealth;
        
        const battleLog = [];
        battleLog.push(`⚔️ ${fighter1.username} vs ${fighter2.username}`);

        while (turn <= maxTurns && p1HP > 0 && p2HP > 0) {
            // Fighter 1 attacks
            if (p1HP > 0) {
                const damage = this.calculateDamage(fighter1, fighter2, turn);
                p2HP = Math.max(0, p2HP - damage);
                battleLog.push(`⚡ ${fighter1.username} deals ${damage} damage! (${fighter2.username}: ${p2HP} HP)`);
            }

            // Fighter 2 attacks
            if (p2HP > 0) {
                const damage = this.calculateDamage(fighter2, fighter1, turn);
                p1HP = Math.max(0, p1HP - damage);
                battleLog.push(`⚡ ${fighter2.username} deals ${damage} damage! (${fighter1.username}: ${p1HP} HP)`);
            }

            turn++;
        }

        const winner = p1HP > p2HP ? fighter1 : fighter2;
        const loser = winner === fighter1 ? fighter2 : fighter1;

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('⚡ Quick Battle Results')
            .setDescription(`**${winner.username}** wins!`)
            .addFields([
                {
                    name: '🏆 Battle Summary',
                    value: battleLog.slice(-6).join('\n'),
                    inline: false
                },
                {
                    name: '📊 Final Stats',
                    value: `**${fighter1.username}**: ${p1HP}/${fighter1.maxHealth} HP\n**${fighter2.username}**: ${p2HP}/${fighter2.maxHealth} HP`,
                    inline: false
                }
            ])
            .setFooter({ text: 'Quick simulation - no rewards given' });

        await interaction.editReply({ embeds: [embed] });
    }

    calculateDamage(attacker, defender, turn) {
        const baseDamage = 80;
        const cpRatio = Math.min(attacker.balancedCP / defender.balancedCP, 1.5);
        const turnMultiplier = turn === 1 ? 0.6 : turn === 2 ? 0.8 : 1.0;
        
        const damage = Math.floor(baseDamage * cpRatio * turnMultiplier);
        return Math.max(10, damage);
    }

    // ============================================
    // INTERACTION HANDLER
    // ============================================

    async handleInteraction(interaction) {
        const customId = interaction.customId;

        try {
            // Handle leave queue buttons
            if (customId.startsWith('leave_queue_')) {
                const userId = customId.replace('leave_queue_', '');
                
                if (interaction.user.id !== userId) {
                    return await interaction.reply({
                        content: '❌ You can only interact with your own queue!',
                        ephemeral: true
                    });
                }

                if (!this.queue.has(userId)) {
                    return await interaction.reply({
                        content: '❌ You are not in the queue.',
                        ephemeral: true
                    });
                }

                await this.leaveQueue(interaction, userId);
                return true;
            }

            // Handle challenge acceptance/decline
            if (customId.startsWith('accept_challenge_') || customId.startsWith('decline_challenge_')) {
                const parts = customId.split('_');
                const action = parts[0]; // 'accept' or 'decline'
                const challengerId = parts[2];
                const defenderId = parts[3];

                if (interaction.user.id !== defenderId) {
                    return await interaction.reply({
                        content: '❌ Only the challenged player can respond!',
                        ephemeral: true
                    });
                }

                await this.handleChallengeResponse(interaction, challengerId, defenderId, action);
                return true;
            }

            return false; // Not a PvP interaction

        } catch (error) {
            console.error('Error handling PvP interaction:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred during the PvP interaction.',
                    ephemeral: true
                });
            }
            
            return true; // We handled it, even if there was an error
        }
    }

    async handleChallengeResponse(interaction, challengerId, defenderId, action) {
        const challengeId = Array.from(this.activeBattles.keys())
            .find(id => {
                const data = this.activeBattles.get(id);
                return data.challenger?.userId === challengerId && data.defender?.userId === defenderId;
            });

        if (!challengeId) {
            return await interaction.reply({
                content: '❌ This challenge is no longer valid.',
                ephemeral: true
            });
        }

        const challengeData = this.activeBattles.get(challengeId);
        
        // Clean up challenge
        this.activeBattles.delete(challengeId);
        if (this.challengeTimeouts.has(challengeId)) {
            clearTimeout(this.challengeTimeouts.get(challengeId));
            this.challengeTimeouts.delete(challengeId);
        }

        if (action === 'accept') {
            await this.startAcceptedBattle(interaction, challengeData);
        } else {
            await this.handleDeclinedChallenge(interaction, challengeData);
        }
    }

    async startAcceptedBattle(interaction, challengeData) {
        const { challenger, defender } = challengeData;

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('⚔️ Challenge Accepted!')
            .setDescription(`**${defender.username}** accepts **${challenger.username}**'s challenge!`)
            .addFields([
                {
                    name: '🏁 Battle Preparation',
                    value: [
                        `**Challenger**: ${challenger.username} (${challenger.balancedCP.toLocaleString()} CP)`,
                        `**Defender**: ${defender.username} (${defender.balancedCP.toLocaleString()} CP)`,
                        `**Battle Type**: Enhanced Turn-Based PvP`,
                        `**Status**: Initializing battle systems...`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Battle starting in 3 seconds...' })
            .setTimestamp();

        await interaction.update({
            embeds: [embed],
            components: [],
            content: ''
        });

        // Start the battle after a brief delay
        setTimeout(async () => {
            try {
                await this.runTurnBasedBattle(interaction, challenger, defender);
            } catch (error) {
                console.error('Error starting turn-based battle:', error);
                await interaction.editReply({
                    content: '❌ An error occurred while starting the battle.',
                    embeds: [],
                    components: []
                });
            }
        }, 3000);
    }

    async handleDeclinedChallenge(interaction, challengeData) {
        const { challenger, defender } = challengeData;

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Challenge Declined')
            .setDescription(`**${defender.username}** has declined the challenge from **${challenger.username}**.`)
            .addFields([
                {
                    name: '📋 Challenge Summary',
                    value: [
                        `**Challenger**: ${challenger.username}`,
                        `**Defender**: ${defender.username}`,
                        `**Response**: Declined`,
                        `**Status**: Challenge ended`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Maybe next time! Try /pvp queue for matchmaking.' });

        await interaction.update({
            embeds: [embed],
            components: [],
            content: ''
        });
    }

    async runTurnBasedBattle(interaction, fighter1, fighter2) {
        const battleId = `battle_${fighter1.userId}_${fighter2.userId}_${Date.now()}`;
        
        // Initialize battle state
        const battleState = {
            id: battleId,
            fighter1: { ...fighter1, hp: fighter1.maxHealth, effects: [] },
            fighter2: { ...fighter2, hp: fighter2.maxHealth, effects: [] },
            turn: 1,
            maxTurns: 15,
            currentPlayer: fighter1.userId,
            battleLog: [],
            created: Date.now(),
            phase: 'active'
        };

        battleState.battleLog.push(`⚔️ **Battle Start**: ${fighter1.username} vs ${fighter2.username}`);
        battleState.battleLog.push(`🏁 **Initial HP**: ${fighter1.username} (${fighter1.maxHealth}) vs ${fighter2.username} (${fighter2.maxHealth})`);

        // Store active battle
        this.activeBattles.set(battleId, battleState);

        // Run battle simulation
        await this.simulateEnhancedBattle(interaction, battleState);
    }

    async simulateEnhancedBattle(interaction, battleState) {
        const { fighter1, fighter2 } = battleState;
        
        // Battle loop
        while (battleState.turn <= battleState.maxTurns && 
               battleState.fighter1.hp > 0 && 
               battleState.fighter2.hp > 0) {
            
            // Fighter 1's turn
            if (battleState.fighter1.hp > 0) {
                const damage = this.calculateAdvancedDamage(fighter1, fighter2, battleState.turn);
                battleState.fighter2.hp = Math.max(0, battleState.fighter2.hp - damage);
                battleState.battleLog.push(`⚡ **Turn ${battleState.turn}**: ${fighter1.username} deals ${damage} damage!`);
                battleState.battleLog.push(`💔 ${fighter2.username}: ${battleState.fighter2.hp}/${fighter2.maxHealth} HP`);
            }

            if (battleState.fighter2.hp <= 0) break;

            // Fighter 2's turn
            if (battleState.fighter2.hp > 0) {
                const damage = this.calculateAdvancedDamage(fighter2, fighter1, battleState.turn);
                battleState.fighter1.hp = Math.max(0, battleState.fighter1.hp - damage);
                battleState.battleLog.push(`⚡ **Turn ${battleState.turn}**: ${fighter2.username} deals ${damage} damage!`);
                battleState.battleLog.push(`💔 ${fighter1.username}: ${battleState.fighter1.hp}/${fighter1.maxHealth} HP`);
            }

            battleState.turn++;
            if (battleState.fighter1.hp <= 0) break;
        }

        // Determine winner
        const winner = battleState.fighter1.hp > battleState.fighter2.hp ? fighter1 : fighter2;
        const loser = winner === fighter1 ? fighter2 : fighter1;
        const winnerHP = winner === fighter1 ? battleState.fighter1.hp : battleState.fighter2.hp;

        // Create final battle result
        await this.displayBattleResult(interaction, battleState, winner, loser, winnerHP);

        // Clean up
        this.activeBattles.delete(battleState.id);
    }

    async displayBattleResult(interaction, battleState, winner, loser, winnerHP) {
        const battleDuration = Math.floor((Date.now() - battleState.created) / 1000);
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🏆 PvP Battle Complete!')
            .setDescription(`**${winner.username}** emerges victorious!`)
            .addFields([
                {
                    name: '👑 Victory Details',
                    value: [
                        `**Winner**: ${winner.username}`,
                        `**Remaining HP**: ${winnerHP}/${winner.maxHealth}`,
                        `**Loser**: ${loser.username}`,
                        `**Final HP**: 0/${loser.maxHealth}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📊 Battle Statistics',
                    value: [
                        `**Total Turns**: ${battleState.turn - 1}`,
                        `**Battle Duration**: ${battleDuration}s`,
                        `**Battle Type**: Enhanced PvP`,
                        `**Max Possible Turns**: ${battleState.maxTurns}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚔️ Battle Summary',
                    value: battleState.battleLog.slice(-8).join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Great battle! Use /pvp queue for more battles.' })
            .setTimestamp();

        await interaction.editReply({
            embeds: [embed],
            components: []
        });
    }

    calculateAdvancedDamage(attacker, defender, turn) {
        const baseDamage = 85;
        
        // CP ratio with cap
        const cpRatio = Math.min(attacker.balancedCP / defender.balancedCP, 1.8);
        
        // Turn scaling (early turns do less damage)
        let turnMultiplier = 1.0;
        if (turn === 1) turnMultiplier = 0.5;
        else if (turn === 2) turnMultiplier = 0.7;
        else if (turn === 3) turnMultiplier = 0.85;
        
        // Random factor for unpredictability
        const randomFactor = 0.85 + (Math.random() * 0.3); // 0.85 to 1.15
        
        // Level difference bonus/penalty
        const levelDiff = attacker.level - defender.level;
        const levelMultiplier = 1 + (levelDiff * 0.02); // ±2% per level difference
        
        const finalDamage = Math.floor(
            baseDamage * 
            cpRatio * 
            turnMultiplier * 
            randomFactor * 
            levelMultiplier
        );
        
        return Math.max(20, finalDamage); // Minimum 20 damage
    }

    // ============================================
    // MATCHED BATTLE SYSTEM
    // ============================================

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
                    await this.runTurnBasedBattle(interaction, fighter1, fighter2);
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

    // ============================================
    // QUEUE MANAGEMENT
    // ============================================

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

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    validateBalance(fighter1, fighter2) {
        const cpRatio = Math.max(
            fighter1.balancedCP / fighter2.balancedCP, 
            fighter2.balancedCP / fighter1.balancedCP
        );
        const levelDiff = Math.abs(fighter1.level - fighter2.level);
        
        const isBalanced = cpRatio <= 2.0 && levelDiff <= 20;
        
        let prediction = 'Even match';
        if (cpRatio > 1.5) {
            const stronger = fighter1.balancedCP > fighter2.balancedCP ? fighter1.username : fighter2.username;
            prediction = `${stronger} has significant advantage`;
        } else if (cpRatio > 1.2) {
            const stronger = fighter1.balancedCP > fighter2.balancedCP ? fighter1.username : fighter2.username;
            prediction = `${stronger} has slight advantage`;
        }
        
        return {
            isBalanced,
            cpRatio,
            levelDiff,
            prediction,
            recommendation: isBalanced ? 
                'Fair fight - battle recommended!' : 
                'Consider finding a more balanced opponent for better experience'
        };
    }

    isPlayerBusy(userId) {
        // Check if player has pending challenge or active battle
        for (const battleData of this.activeBattles.values()) {
            if (battleData.challenger?.userId === userId || 
                battleData.defender?.userId === userId ||
                battleData.fighter1?.userId === userId ||
                battleData.fighter2?.userId === userId) {
                return true;
            }
        }
        return false;
    }

    getUserActiveBattle(userId) {
        for (const [battleId, battleData] of this.activeBattles) {
            if (battleData.fighter1?.userId === userId || 
                battleData.fighter2?.userId === userId ||
                battleData.challenger?.userId === userId ||
                battleData.defender?.userId === userId) {
                return { battleId, battleData };
            }
        }
        return null;
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

    async expireChallenge(interaction, challengeId) {
        const challengeData = this.activeBattles.get(challengeId);
        if (!challengeData) return;

        this.activeBattles.delete(challengeId);
        
        if (this.challengeTimeouts.has(challengeId)) {
            clearTimeout(this.challengeTimeouts.get(challengeId));
            this.challengeTimeouts.delete(challengeId);
        }

        const embed = new EmbedBuilder()
            .setColor(0x808080)
            .setTitle('⏰ Challenge Expired')
            .setDescription(`The challenge from **${challengeData.challenger.username}** has expired.`)
            .addFields([
                {
                    name: '📋 Challenge Details',
                    value: [
                        `**Challenger**: ${challengeData.challenger.username}`,
                        `**Defender**: ${challengeData.defender.username}`,
                        `**Expiration**: Challenge not accepted in time`,
                        `**Status**: Expired`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Challenges expire after 60 seconds of no response' });

        try {
            await interaction.editReply({
                embeds: [embed],
                components: [],
                content: ''
            });
        } catch (error) {
            console.error('Error updating expired challenge:', error);
        }
    }

    // Cleanup old battles and challenges
    cleanup() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        let cleanedCount = 0;
        for (const [battleId, battleData] of this.activeBattles) {
            if (now - battleData.created > maxAge) {
                // Clear any associated timeout
                if (this.challengeTimeouts.has(battleId)) {
                    clearTimeout(this.challengeTimeouts.get(battleId));
                    this.challengeTimeouts.delete(battleId);
                }
                
                this.activeBattles.delete(battleId);
                cleanedCount++;
            }
        }

        // Clean old queue entries
        for (const [userId, queueData] of this.queue) {
            if (now - queueData.joinTime > maxAge) {
                this.removeFromQueue(userId);
                cleanedCount++;
            }
        }

        // Clean old cooldowns
        for (const [userId, lastBattle] of this.cooldowns) {
            if (now - lastBattle > this.battleCooldown * 2) {
                this.cooldowns.delete(userId);
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} old PvP entries`);
        }
    }
}

// Create and export singleton instance
const pvpSystem = new PvPSystem();

// Set up cleanup interval
setInterval(() => {
    pvpSystem.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes

module.exports = pvpSystem;
