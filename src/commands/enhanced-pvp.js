// src/commands/enhanced-pvp.js - FIXED VERSION - Removed duplicate SlashCommandBuilder
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');

// Simplified loading with fallbacks
let EnhancedTurnBasedPvP = null;
let PvPQueueSystem = null;

// Safe loading function
function loadPvPSystems() {
    try {
        // Try to load enhanced PvP system
        console.log('🔄 Loading Enhanced PvP system...');
        const enhancedPvPModule = require('../systems/pvp/enhanced-turn-based-pvp');
        EnhancedTurnBasedPvP = enhancedPvPModule;
        console.log('✅ Enhanced Turn-Based PvP system loaded');
        
        // Try to load queue system
        try {
            console.log('🔄 Loading PvP Queue system...');
            PvPQueueSystem = require('../systems/pvp/pvp-queue-system');
            console.log('✅ PvP Queue System loaded');
        } catch (queueError) {
            console.warn('⚠️ Queue system failed to load:', queueError.message);
            console.log('🔄 Continuing without queue system...');
        }
        
    } catch (enhancedError) {
        console.warn('⚠️ Enhanced PvP system failed to load:', enhancedError.message);
        console.log('🔄 PvP system not available...');
    }
}

// Load systems on module initialization
loadPvPSystems();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp')
        .setDescription('⚔️ Enhanced PvP Battle System')
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('🎯 Join the PvP matchmaking queue for battles')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('quick')
                .setDescription('⚡ Quick match - find any available opponent')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue-status')
                .setDescription('📊 Check current PvP queue status and active battles')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave-queue')
                .setDescription('🚪 Leave the matchmaking queue')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 View your PvP battle statistics')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('View another user\'s PvP stats')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('system-info')
                .setDescription('🔧 View PvP system information and status')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            console.log(`🎯 PvP Enhanced Command: ${subcommand} by ${interaction.user.username}`);

            switch (subcommand) {
                case 'queue':
                    await this.handleQueue(interaction);
                    break;
                case 'quick':
                    await this.handleQuickMatch(interaction);
                    break;
                case 'queue-status':
                    await this.handleQueueStatus(interaction);
                    break;
                case 'leave-queue':
                    await this.handleLeaveQueue(interaction);
                    break;
                case 'stats':
                    await this.handleStats(interaction);
                    break;
                case 'system-info':
                    await this.handleSystemInfo(interaction);
                    break;
                default:
                    await interaction.reply({
                        content: '❌ Unknown PvP subcommand!',
                        ephemeral: true
                    });
            }
        } catch (error) {
            console.error('Error in enhanced PvP command:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ PvP System Error')
                .setDescription('An error occurred during PvP command execution!')
                .addFields([
                    {
                        name: '🔧 System Status',
                        value: [
                            `**Enhanced PvP**: ${EnhancedTurnBasedPvP ? '✅ Loaded' : '❌ Failed'}`,
                            `**Queue System**: ${PvPQueueSystem ? '✅ Loaded' : '❌ Failed'}`,
                            `**Error**: ${error.message || 'Unknown error'}`
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setFooter({ text: 'Please try again or contact support.' });
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    await interaction.followUp({ embeds: [embed], ephemeral: true });
                }
            } catch (interactionError) {
                console.error('Failed to send error message:', interactionError);
            }
        }
    },

    async handleQueue(interaction) {
        const userId = interaction.user.id;
        const username = interaction.user.username;

        console.log(`🎯 ${username} attempting to join enhanced PvP queue`);

        try {
            // Check if systems are available
            if (!PvPQueueSystem) {
                return await interaction.reply({
                    content: '❌ PvP queue system is not available. Please contact an administrator.',
                    ephemeral: true
                });
            }

            // Check if user has enough fruits
            await DatabaseManager.ensureUser(userId, username, interaction.guild?.id);
            const userFruits = await DatabaseManager.getUserDevilFruits(userId);
            
            if (userFruits.length < 5) {
                return await interaction.reply({
                    content: `❌ You need at least 5 Devil Fruits to join the PvP queue! You have ${userFruits.length}.\n💡 Use \`/debug-queue action:Add Test Fruits\` to get test fruits.`,
                    ephemeral: true
                });
            }

            // Check if user is already in a battle
            if (EnhancedTurnBasedPvP && EnhancedTurnBasedPvP.findUserBattle && EnhancedTurnBasedPvP.findUserBattle(userId)) {
                return await interaction.reply({
                    content: '❌ You are already in an active battle!',
                    ephemeral: true
                });
            }

            // Join queue
            const result = PvPQueueSystem.joinQueue(userId, username);
            
            if (result.success) {
                if (result.matched) {
                    await interaction.reply({
                        content: `⚔️ **Match Found!** Battle starting between **${result.player1.username}** and **${result.player2.username}**!`
                    });
                    
                    // Start enhanced battle if both players are human
                    if (EnhancedTurnBasedPvP && !result.player2.username.includes('Bot')) {
                        // Create mock user object for player 2
                        const player2User = {
                            id: result.player2.userId,
                            username: result.player2.username
                        };
                        
                        setTimeout(async () => {
                            try {
                                await EnhancedTurnBasedPvP.initiateBattle(interaction, player2User);
                            } catch (error) {
                                console.error('Error starting queue battle:', error);
                            }
                        }, 2000);
                    }
                } else {
                    const embed = new EmbedBuilder()
                        .setColor(0x3498DB)
                        .setTitle('🔍 Joined PvP Queue!')
                        .setDescription('Searching for an opponent...')
                        .addFields([
                            { name: '📊 Queue Position', value: `#${result.position}`, inline: true },
                            { name: '👥 Players in Queue', value: `${result.queueSize}`, inline: true },
                            { name: '⏰ Estimated Wait', value: `${Math.max(1, result.position * 30)} seconds`, inline: true },
                            { name: '🎮 Battle Type', value: 'Enhanced Turn-Based PvP', inline: false },
                            { name: '💡 Tips', value: 'While waiting, check `/pvp queue-status` for updates!', inline: false }
                        ])
                        .setFooter({ text: 'You\'ll be notified when a match is found!' })
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            } else {
                await interaction.reply({
                    content: `❌ Failed to join queue: ${result.message}`,
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('Error in handleQueue:', error);
            await interaction.reply({
                content: '❌ An error occurred while joining the queue. Please try again.',
                ephemeral: true
            });
        }
    },

    async handleQuickMatch(interaction) {
        // Quick match is the same as regular queue for now
        await this.handleQueue(interaction);
    },

    async handleQueueStatus(interaction) {
        try {
            if (!PvPQueueSystem) {
                return await interaction.reply({
                    content: '❌ PvP queue system is not available.',
                    ephemeral: true
                });
            }

            const status = PvPQueueSystem.getQueueStatus();
            const enhancedStats = EnhancedTurnBasedPvP ? EnhancedTurnBasedPvP.getBattleStats() : { activeBattles: 0, battles: [] };
            
            let queueList = 'No players in queue';
            if (status.queuedPlayers.length > 0) {
                queueList = status.queuedPlayers
                    .slice(0, 10)
                    .map((player, index) => `${index + 1}. ${player.username}`)
                    .join('\n');
                
                if (status.queuedPlayers.length > 10) {
                    queueList += `\n...and ${status.queuedPlayers.length - 10} more`;
                }
            }

            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('📊 Enhanced PvP Queue Status')
                .setDescription('Real-time queue and battle information')
                .addFields([
                    {
                        name: '🎯 Queue Information',
                        value: [
                            `**Players in Queue**: ${status.queueSize}`,
                            `**Active Matches**: ${status.activeMatches}`,
                            `**Enhanced Battles**: ${enhancedStats.activeBattles}`,
                            `**Average Wait**: ${Math.max(1, status.queueSize * 30)} seconds`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🔧 System Status',
                        value: [
                            `**Queue System**: ${PvPQueueSystem ? '✅ Online' : '❌ Offline'}`,
                            `**Enhanced PvP**: ${EnhancedTurnBasedPvP ? '✅ Online' : '❌ Offline'}`,
                            `**Battle Engine**: Enhanced Turn-Based`,
                            `**Matchmaking**: Automatic`
                        ].join('\n'),
                        inline: true
                    }
                ])
                .setTimestamp();

            if (status.queuedPlayers.length > 0) {
                embed.addFields([{
                    name: '📋 Current Queue',
                    value: queueList,
                    inline: false
                }]);
            }

            if (enhancedStats.activeBattles > 0) {
                const battleList = enhancedStats.battles
                    .slice(0, 3)
                    .map(battle => `**${battle.players[0] || 'Unknown'}** vs **${battle.players[1] || 'Unknown'}** (${battle.status})`)
                    .join('\n');
                
                if (battleList) {
                    embed.addFields([{
                        name: '⚔️ Active Battles',
                        value: battleList,
                        inline: false
                    }]);
                }
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in handleQueueStatus:', error);
            await interaction.reply({
                content: '❌ Failed to get queue status.',
                ephemeral: true
            });
        }
    },

    async handleLeaveQueue(interaction) {
        try {
            if (!PvPQueueSystem) {
                return await interaction.reply({
                    content: '❌ PvP queue system is not available.',
                    ephemeral: true
                });
            }

            const result = PvPQueueSystem.leaveQueue(interaction.user.id);
            
            const embed = new EmbedBuilder()
                .setTimestamp();

            if (result.success) {
                embed
                    .setColor(0x00FF00)
                    .setTitle('✅ Left Queue')
                    .setDescription('You have successfully left the PvP queue.')
                    .addFields([
                        { name: '👤 Player', value: interaction.user.username, inline: true },
                        { name: '📊 Status', value: 'Successfully removed', inline: true }
                    ]);
            } else {
                embed
                    .setColor(0xFF8000)
                    .setTitle('❌ Not in Queue')
                    .setDescription('You are not currently in the PvP queue.')
                    .addFields([
                        { name: '💡 Tip', value: 'Use `/pvp queue` to join the queue first!', inline: false }
                    ]);
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error in handleLeaveQueue:', error);
            await interaction.reply({
                content: '❌ Failed to leave queue.',
                ephemeral: true
            });
        }
    },

    async handleStats(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        try {
            if (!DatabaseManager) {
                return await interaction.reply({
                    content: '❌ Database system is not available.',
                    ephemeral: true
                });
            }

            // Get basic user stats
            const user = await DatabaseManager.getUser(targetUser.id);
            if (!user) {
                return await interaction.reply({
                    content: `${targetUser.username} is not registered in the system. Use a command to register first!`,
                    ephemeral: true
                });
            }

            // Get user's devil fruits for battle readiness
            const userFruits = await DatabaseManager.getUserDevilFruits(targetUser.id);
            
            // Check current status
            const inQueue = PvPQueueSystem && PvPQueueSystem.queue && PvPQueueSystem.queue.has(targetUser.id);
            const inBattle = EnhancedTurnBasedPvP && EnhancedTurnBasedPvP.findUserBattle && EnhancedTurnBasedPvP.findUserBattle(targetUser.id);
            
            let currentStatus = '💤 Available';
            if (inBattle) currentStatus = '⚔️ In Battle';
            else if (inQueue) currentStatus = '🔍 In Queue';

            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle(`⚔️ ${targetUser.username}'s Enhanced PvP Stats`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields([
                    {
                        name: '🏆 PvP Record',
                        value: [
                            `**Wins**: ${user.pvp_wins || 0}`,
                            `**Losses**: ${user.pvp_losses || 0}`,
                            `**Win Rate**: ${this.calculateWinRate(user.pvp_wins || 0, user.pvp_losses || 0)}`,
                            `**Current Status**: ${currentStatus}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '💎 Combat Stats',
                        value: [
                            `**Level**: ${user.level || 0}`,
                            `**Total CP**: ${(user.total_cp || 0).toLocaleString()}`,
                            `**Base CP**: ${(user.base_cp || 0).toLocaleString()}`,
                            `**Battle Ready**: ${userFruits.length >= 5 ? '✅ Yes' : '❌ No'}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🍈 Collection',
                        value: [
                            `**Total Fruits**: ${userFruits.length}`,
                            `**Unique Fruits**: ${new Set(userFruits.map(f => f.fruit_name)).size}`,
                            `**For PvP**: ${userFruits.length}/5 minimum`,
                            `**Berries**: ${(user.berries || 0).toLocaleString()}`
                        ].join('\n'),
                        inline: true
                    }
                ])
                .setTimestamp();

            // Add battle readiness info
            if (userFruits.length < 5) {
                embed.addFields([{
                    name: '📝 Battle Requirements',
                    value: `You need at least 5 Devil Fruits to participate in enhanced turn-based PvP.\n` +
                           `Current: ${userFruits.length}/5 fruits\n` +
                           `💡 Use \`/debug-queue action:Add Test Fruits\` to get test fruits!`,
                    inline: false
                }]);
            } else {
                // Show fruit rarity breakdown
                const rarityBreakdown = {};
                userFruits.forEach(fruit => {
                    const rarity = fruit.fruit_rarity;
                    rarityBreakdown[rarity] = (rarityBreakdown[rarity] || 0) + 1;
                });
                
                const rarityText = Object.entries(rarityBreakdown)
                    .map(([rarity, count]) => `${rarity}: ${count}`)
                    .join(', ');
                    
                embed.addFields([{
                    name: '🍈 Fruit Collection Breakdown',
                    value: rarityText,
                    inline: false
                }]);
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching PvP stats:', error);
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error')
                .setDescription('Could not fetch PvP statistics. Please try again.')
                .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    async handleSystemInfo(interaction) {
        const enhancedStats = EnhancedTurnBasedPvP ? EnhancedTurnBasedPvP.getBattleStats() : { activeBattles: 0, battles: [] };
        const queueStatus = PvPQueueSystem ? PvPQueueSystem.getQueueStatus() : { queueSize: 0, activeMatches: 0 };
        
        const embed = new EmbedBuilder()
            .setColor(0x9932CC)
            .setTitle('🎮 Enhanced Turn-Based PvP System')
            .setDescription('Complete information about the enhanced PvP system')
            .addFields([
                {
                    name: '⚔️ Battle System Features',
                    value: [
                        '🎯 **Turn-Based Combat**: Strategic gameplay',
                        '🍈 **Fruit Selection**: Choose 5 fruits per battle',
                        '📊 **Balanced CP**: Fair matchmaking system',
                        '🔥 **Real Abilities**: Use actual Devil Fruit powers',
                        '⏱️ **Live Updates**: Real-time battle progression',
                        '🎮 **Enhanced UI**: Modern selection interface'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📋 How It Works',
                    value: [
                        '1️⃣ Join queue with `/pvp queue`',
                        '2️⃣ Automatic matchmaking finds opponent',
                        '3️⃣ Turn-based combat begins with fruit selection',
                        '4️⃣ Use fruit abilities strategically',
                        '5️⃣ Winner takes victory!'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📊 Current Statistics',
                    value: [
                        `**Active Battles**: ${enhancedStats.activeBattles}`,
                        `**Queue Size**: ${queueStatus.queueSize}`,
                        `**System Status**: ${EnhancedTurnBasedPvP ? '✅ Operational' : '❌ Offline'}`,
                        `**Battle Types**: Enhanced Turn-Based`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🎯 Requirements',
                    value: [
                        '**Minimum Level**: 0 (Any level)',
                        '**Required Fruits**: 5 Devil Fruits minimum',
                        '**Battle Time**: 5-15 minutes typical',
                        '**Selection Time**: 5 minutes maximum'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🔧 Available Commands',
                    value: [
                        '`/pvp queue` - Join matchmaking queue',
                        '`/pvp queue-status` - Check queue status',
                        '`/pvp leave-queue` - Leave queue',
                        '`/pvp stats` - View your PvP statistics',
                        '`/pvp system-info` - View this information'
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Enhanced Turn-Based PvP - Strategic Devil Fruit Combat' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    // Helper function
    calculateWinRate(wins, losses) {
        const total = wins + losses;
        if (total === 0) return '0%';
        return `${Math.round((wins / total) * 100)}%`;
    }
};
