// src/systems/pvp.js - Main PvP System (Fixed)
const DatabaseManager = require('../database/manager');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

// Import subsystems safely
let BalanceSystem, QueueSystem, BattleSystem, NPCBosses, InteractionHandler;

try {
    BalanceSystem = require('./pvp/balance');
    console.log('✅ PvP Balance System loaded');
} catch (error) {
    console.error('❌ Failed to load Balance System:', error.message);
    BalanceSystem = null;
}

try {
    QueueSystem = require('./pvp-queue-system');
    console.log('✅ PvP Queue System loaded');
} catch (error) {
    console.error('❌ Failed to load Queue System:', error.message);
    QueueSystem = null;
}

try {
    BattleSystem = require('./pvp/battle');
    console.log('✅ PvP Battle System loaded');
} catch (error) {
    console.error('❌ Failed to load Battle System:', error.message);
    BattleSystem = null;
}

try {
    NPCBosses = require('./pvp/npc-bosses');
    console.log('✅ NPC Boss System loaded');
} catch (error) {
    console.error('❌ Failed to load NPC Boss System:', error.message);
    NPCBosses = null;
}

class PvPSystem {
    constructor() {
        this.activeBattles = new Map();
        this.loadedSystems = new Set();
        
        // Initialize subsystems
        this.balance = BalanceSystem ? new BalanceSystem() : null;
        this.queue = QueueSystem ? new QueueSystem(this) : null;
        this.battle = BattleSystem ? new BattleSystem(this) : null;
        this.npcBosses = NPCBosses || null;
        
        if (this.balance) this.loadedSystems.add('balance');
        if (this.queue) this.loadedSystems.add('queue');
        if (this.battle) this.loadedSystems.add('battle');
        
        console.log(`⚔️ PvP System initialized with ${this.loadedSystems.size}/3 subsystems`);
    }

    isLoaded(systemName) {
        return this.loadedSystems.has(systemName);
    }

    // Join matchmaking queue
    async joinQueue(interaction) {
        try {
            if (!this.isLoaded('balance')) {
                return interaction.reply({
                    content: '❌ PvP balance system is not available. Please try again later.',
                    ephemeral: true
                });
            }

            const fighter = await this.balance.createFighter(interaction.user.id);
            if (!fighter) {
                return interaction.reply({
                    content: '❌ You need at least 5 Devil Fruits to participate in PvP battles! Use `/pull` to get more fruits.',
                    ephemeral: true
                });
            }

            if (this.queue && this.isLoaded('queue')) {
                await this.queue.joinQueue(interaction, fighter);
            } else {
                // Fallback to simple matchmaking
                await this.fallbackMatchmaking(interaction, fighter);
            }

        } catch (error) {
            console.error('Error in joinQueue:', error);
            await interaction.reply({
                content: '❌ An error occurred while joining the queue.',
                ephemeral: true
            });
        }
    }

    // Challenge another player
    async challenge(interaction, opponent) {
        try {
            if (!this.isLoaded('balance')) {
                return interaction.reply({
                    content: '❌ PvP challenge system is not available.',
                    ephemeral: true
                });
            }

            if (opponent.bot) {
                return interaction.reply({
                    content: '❌ You cannot challenge a bot!',
                    ephemeral: true
                });
            }

            if (opponent.id === interaction.user.id) {
                return interaction.reply({
                    content: '❌ You cannot challenge yourself!',
                    ephemeral: true
                });
            }

            const challenger = await this.balance.createFighter(interaction.user.id);
            const defender = await this.balance.createFighter(opponent.id);

            if (!challenger) {
                return interaction.reply({
                    content: '❌ You need at least 5 Devil Fruits to challenge someone!',
                    ephemeral: true
                });
            }

            if (!defender) {
                return interaction.reply({
                    content: `❌ ${opponent.username} needs at least 5 Devil Fruits to be challenged!`,
                    ephemeral: true
                });
            }

            if (this.battle && this.isLoaded('battle')) {
                await this.battle.startChallenge(interaction, challenger, defender);
            } else {
                // Fallback to simple challenge
                await this.fallbackChallenge(interaction, challenger, defender);
            }

        } catch (error) {
            console.error('Error in challenge:', error);
            await interaction.reply({
                content: '❌ An error occurred while issuing the challenge.',
                ephemeral: true
            });
        }
    }

    // Quick battle simulation
    async quickBattle(interaction, opponent) {
        try {
            if (!this.isLoaded('balance')) {
                return interaction.reply({
                    content: '❌ Quick battle system is not available.',
                    ephemeral: true
                });
            }

            if (opponent.bot) {
                return interaction.reply({
                    content: '❌ You cannot battle a bot with quick battle!',
                    ephemeral: true
                });
            }

            if (opponent.id === interaction.user.id) {
                return interaction.reply({
                    content: '❌ You cannot battle yourself!',
                    ephemeral: true
                });
            }

            const fighter1 = await this.balance.createFighter(interaction.user.id);
            const fighter2 = await this.balance.createFighter(opponent.id);

            if (!fighter1) {
                return interaction.reply({
                    content: '❌ You need at least 5 Devil Fruits to battle!',
                    ephemeral: true
                });
            }

            if (!fighter2) {
                return interaction.reply({
                    content: `❌ ${opponent.username} needs at least 5 Devil Fruits to battle!`,
                    ephemeral: true
                });
            }

            await this.balance.simulateQuickBattle(interaction, fighter1, fighter2);

        } catch (error) {
            console.error('Error in quickBattle:', error);
            await interaction.reply({
                content: '❌ An error occurred during the quick battle.',
                ephemeral: true
            });
        }
    }

    // Show PvP stats
    async showStats(interaction, user) {
        try {
            if (!this.isLoaded('balance')) {
                return interaction.reply({
                    content: '❌ Stats system is not available.',
                    ephemeral: true
                });
            }

            const fighter = await this.balance.createFighter(user.id);
            
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
                const queueStatus = this.queue && this.queue.queue ? this.queue.queue.has(user.id) : false;
                const activeBattle = this.getUserActiveBattle(user.id);

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
                                `**In Queue**: ${queueStatus ? '🎯 Yes' : '❌ No'}`,
                                `**Active Battle**: ${activeBattle ? '⚔️ Yes' : '❌ No'}`,
                                `**System Status**: ${this.loadedSystems.size}/3 loaded`
                            ].join('\n'),
                            inline: true
                        }
                    ]);
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in showStats:', error);
            await interaction.reply({
                content: '❌ An error occurred while loading stats.',
                ephemeral: true
            });
        }
    }

    // Show system status
    async showStatus(interaction) {
        try {
            const queueStats = this.queue && this.queue.getQueueStats ? 
                this.queue.getQueueStats() : { size: 0, maxSize: 0, averageCP: 0 };
            const battleCount = this.activeBattles.size;

            const embed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('🎯 PvP System Status')
                .setDescription('Current status of the Devil Fruit PvP Battle System')
                .addFields([
                    {
                        name: '🔧 System Components',
                        value: [
                            `**Balance System**: ${this.isLoaded('balance') ? '✅ Active' : '❌ Inactive'}`,
                            `**Queue System**: ${this.isLoaded('queue') ? '✅ Active' : '❌ Inactive'}`,
                            `**Battle System**: ${this.isLoaded('battle') ? '✅ Active' : '❌ Inactive'}`,
                            `**NPC Bosses**: ${this.npcBosses ? '✅ Active' : '❌ Inactive'}`
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
            console.error('Error in showStatus:', error);
            await interaction.reply({
                content: '❌ An error occurred while loading system status.',
                ephemeral: true
            });
        }
    }

    // Fallback systems for when subsystems fail to load
    async fallbackMatchmaking(interaction, fighter) {
        const embed = new EmbedBuilder()
            .setColor(0xFF8000)
            .setTitle('🎯 Simple Matchmaking')
            .setDescription(`**${fighter.username}** is ready for battle!`)
            .addFields([
                {
                    name: '🏴‍☠️ Your Stats',
                    value: [
                        `**Level**: ${fighter.level}`,
                        `**Balanced CP**: ${fighter.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${fighter.maxHealth}`,
                        `**Fruits Available**: ${fighter.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚠️ System Notice',
                    value: [
                        `**Queue System**: Unavailable`,
                        `**Mode**: Direct Challenge Only`,
                        `**Recommendation**: Use \`/pvp challenge @user\``,
                        `**Alternative**: Use \`/pvp quick @user\``
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Advanced queue system temporarily unavailable' });

        await interaction.reply({ embeds: [embed] });
    }

    async fallbackChallenge(interaction, challenger, defender) {
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('⚔️ Simple PvP Challenge')
            .setDescription(`**${challenger.username}** challenges **${defender.username}** to battle!`)
            .addFields([
                {
                    name: '🏴‍☠️ Challenger',
                    value: [
                        `**${challenger.username}**`,
                        `Level: ${challenger.level}`,
                        `CP: ${challenger.balancedCP.toLocaleString()}`,
                        `HP: ${challenger.maxHealth}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🏴‍☠️ Defender',
                    value: [
                        `**${defender.username}**`,
                        `Level: ${defender.level}`,
                        `CP: ${defender.balancedCP.toLocaleString()}`,
                        `HP: ${defender.maxHealth}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎮 Quick Solution',
                    value: [
                        `**Recommendation**: Use \`/pvp quick @${defender.username}\``,
                        `**Alternative**: Enhanced battles coming soon`,
                        `**Status**: Battle system initializing`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Enhanced battle system temporarily unavailable' });

        await interaction.reply({ embeds: [embed] });
    }

    // Utility functions
    getUserActiveBattle(userId) {
        for (const [battleId, battleData] of this.activeBattles) {
            if (battleData.player1?.userId === userId || battleData.player2?.userId === userId) {
                return battleData;
            }
        }
        return null;
    }

    async handleInteraction(interaction) {
        try {
            // Handle queue leave buttons
            if (interaction.customId.startsWith('leave_queue_')) {
                const userId = interaction.customId.replace('leave_queue_', '');
                
                if (interaction.user.id !== userId) {
                    return await interaction.reply({
                        content: '❌ You can only interact with your own queue!',
                        ephemeral: true
                    });
                }

                if (this.queue && this.queue.handleLeaveQueueButton) {
                    await this.queue.handleLeaveQueueButton(interaction, userId);
                } else {
                    await interaction.reply({
                        content: '❌ Queue system is not available.',
                        ephemeral: true
                    });
                }
                return true;
            }

            // Handle challenge buttons
            if (interaction.customId.startsWith('accept_challenge_') || 
                interaction.customId.startsWith('decline_challenge_')) {
                
                const parts = interaction.customId.split('_');
                const challengerId = parts[2];
                const defenderId = parts[3];
                const action = parts[0];

                if (interaction.user.id !== defenderId) {
                    return await interaction.reply({
                        content: '❌ Only the challenged player can respond!',
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor(action === 'accept' ? 0x00FF00 : 0xFF0000)
                    .setTitle(action === 'accept' ? '⚔️ Challenge Accepted!' : '❌ Challenge Declined')
                    .setDescription(action === 'accept' ? 
                        'The battle will begin shortly...' : 
                        'The challenge has been declined.')
                    .setFooter({ text: action === 'accept' ? 
                        'Enhanced battle system coming soon!' : 
                        'Maybe next time!' });

                await interaction.update({
                    embeds: [embed],
                    components: []
                });

                if (action === 'accept' && this.balance) {
                    // Start a quick battle after a delay
                    setTimeout(async () => {
                        try {
                            const challenger = await this.balance.createFighter(challengerId);
                            const defender = await this.balance.createFighter(defenderId);
                            
                            if (challenger && defender) {
                                await this.balance.simulateQuickBattle(interaction, challenger, defender);
                            }
                        } catch (error) {
                            console.error('Error starting challenge battle:', error);
                        }
                    }, 3000);
                }

                return true;
            }

            return false;

        } catch (error) {
            console.error('Error handling PvP interaction:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred during the PvP interaction.',
                    ephemeral: true
                });
            }
            
            return true;
        }
    }

    // Cleanup function
    cleanup() {
        if (this.queue && this.queue.cleanup) {
            this.queue.cleanup();
        }
        
        // Clean old battles
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        for (const [battleId, battleData] of this.activeBattles) {
            if (now - battleData.created > maxAge) {
                this.activeBattles.delete(battleId);
            }
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
