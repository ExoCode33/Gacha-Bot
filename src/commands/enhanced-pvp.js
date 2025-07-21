// src/commands/enhanced-pvp.js - FIXED VERSION
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Import PvP systems with proper error handling
let EnhancedTurnBasedPvP = null;
let PvPQueueSystem = null;

try {
    const EnhancedTurnBasedPvPClass = require('../systems/pvp/enhanced-turn-based-pvp');
    EnhancedTurnBasedPvP = new EnhancedTurnBasedPvPClass();
    console.log('✅ Enhanced Turn-Based PvP System loaded successfully');
} catch (error) {
    console.log('❌ Enhanced Turn-Based PvP System failed to load:', error.message);
}

try {
    PvPQueueSystem = require('../systems/pvp/pvp-queue-system');
    console.log('✅ PvP Queue System loaded successfully');
} catch (error) {
    console.log('❌ PvP Queue System failed to load:', error.message);
}

const DatabaseManager = require('../database/manager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp')
        .setDescription('Enhanced PvP system with turn-based combat and fruit selection')
        .addSubcommand(subcommand =>
            subcommand
                .setName('challenge')
                .setDescription('Challenge another player to enhanced turn-based PvP')
                .addUserOption(option =>
                    option.setName('opponent')
                        .setDescription('The player you want to challenge')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('Join the PvP matchmaking queue'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave-queue')
                .setDescription('Leave the PvP matchmaking queue'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue-status')
                .setDescription('Check the current PvP queue status'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View PvP battle statistics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('system-info')
                .setDescription('View enhanced PvP system information')),

    async execute(interaction) {
        // Check if Enhanced PvP system is available
        if (!EnhancedTurnBasedPvP) {
            const embed = new EmbedBuilder()
                .setTitle('🚧 Enhanced PvP System Unavailable')
                .setDescription('The enhanced turn-based PvP system failed to load. Please check the console for errors.')
                .addFields([
                    {
                        name: '🔧 Troubleshooting',
                        value: [
                            '• Check if `src/systems/pvp/enhanced-turn-based-pvp.js` exists',
                            '• Verify all required dependencies are installed',
                            '• Check console logs for specific error messages',
                            '• Ensure database connection is working'
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setColor('#FF6B6B')
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const userName = interaction.user.username;

        try {
            switch (subcommand) {
                case 'challenge':
                    await handleChallenge(interaction, userId, userName);
                    break;
                case 'queue':
                    await handleQueue(interaction, userId, userName);
                    break;
                case 'leave-queue':
                    await handleLeaveQueue(interaction, userId);
                    break;
                case 'queue-status':
                    await handleQueueStatus(interaction);
                    break;
                case 'stats':
                    await handleStats(interaction, userId);
                    break;
                case 'system-info':
                    await handleSystemInfo(interaction);
                    break;
                default:
                    await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
            }
        } catch (error) {
            console.error('Enhanced PvP command error:', error);
            
            // Handle interaction already replied error
            if (error.code === 'InteractionAlreadyReplied') {
                console.log('⚠️ Interaction already replied - this is normal for complex flows');
                return;
            }
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('An error occurred while processing your PvP request. Please try again.')
                .setColor('#FF6B6B')
                .setTimestamp();

            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    await interaction.followUp({ embeds: [embed], ephemeral: true });
                }
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
            }
        }
    }
};

async function handleChallenge(interaction, userId, userName) {
    const opponent = interaction.options.getUser('opponent');
    
    if (opponent.id === userId) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Invalid Challenge')
            .setDescription('You cannot challenge yourself to PvP!')
            .setColor('#FF6B6B');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (opponent.bot) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Invalid Challenge')
            .setDescription('You cannot challenge a bot to PvP!')
            .setColor('#FF6B6B');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if either player is already in a battle
    const existingBattle = EnhancedTurnBasedPvP.findUserBattle(userId) || 
                          EnhancedTurnBasedPvP.findUserBattle(opponent.id);
    
    if (existingBattle) {
        const embed = new EmbedBuilder()
            .setTitle('⚔️ Battle in Progress')
            .setDescription('One of the players is already in a battle!')
            .setColor('#FF6B6B');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if both players have enough fruits
    try {
        await DatabaseManager.ensureUser(userId, userName);
        await DatabaseManager.ensureUser(opponent.id, opponent.username);
        
        const challengerFruits = await DatabaseManager.getUserDevilFruits(userId);
        const opponentFruits = await DatabaseManager.getUserDevilFruits(opponent.id);
        
        if (challengerFruits.length < 5) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Insufficient Devil Fruits')
                .setDescription(`You need at least 5 Devil Fruits to battle! You have ${challengerFruits.length}.`)
                .addFields([
                    {
                        name: '💡 How to get more fruits',
                        value: 'Use `/pull` to get more Devil Fruits from the gacha system!',
                        inline: false
                    }
                ])
                .setColor('#FF6B6B');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (opponentFruits.length < 5) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Opponent Insufficient Devil Fruits')
                .setDescription(`${opponent.username} needs at least 5 Devil Fruits to battle! They have ${opponentFruits.length}.`)
                .setColor('#FF6B6B');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    } catch (error) {
        console.error('Error checking user fruits:', error);
        const embed = new EmbedBuilder()
            .setTitle('❌ Database Error')
            .setDescription('Could not verify Devil Fruit collections. Please try again.')
            .setColor('#FF6B6B');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Initiate the enhanced turn-based battle
    await EnhancedTurnBasedPvP.initiateBattle(interaction, opponent);
}

async function handleQueue(interaction, userId, userName) {
    if (!PvPQueueSystem) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Queue System Unavailable')
            .setDescription('The PvP queue system is not available.')
            .setColor('#FF6B6B');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if user is already in a battle
    const existingBattle = EnhancedTurnBasedPvP.findUserBattle(userId);
    if (existingBattle) {
        const embed = new EmbedBuilder()
            .setTitle('⚔️ Already in Battle')
            .setDescription('You are already in an active battle!')
            .setColor('#FF6B6B');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if user has enough fruits
    try {
        await DatabaseManager.ensureUser(userId, userName);
        const userFruits = await DatabaseManager.getUserDevilFruits(userId);
        
        if (userFruits.length < 5) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Insufficient Devil Fruits')
                .setDescription(`You need at least 5 Devil Fruits to join the PvP queue! You have ${userFruits.length}.`)
                .addFields([
                    {
                        name: '💡 How to get more fruits',
                        value: 'Use `/pull` to get more Devil Fruits from the gacha system!',
                        inline: false
                    }
                ])
                .setColor('#FF6B6B');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    } catch (error) {
        console.error('Error checking user fruits for queue:', error);
        const embed = new EmbedBuilder()
            .setTitle('❌ Database Error')
            .setDescription('Could not verify your Devil Fruit collection. Please try again.')
            .setColor('#FF6B6B');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const result = PvPQueueSystem.joinQueue(userId, userName);
    
    const embed = new EmbedBuilder()
        .setTimestamp();

    if (result.success) {
        if (result.matched) {
            embed
                .setTitle('⚔️ Match Found!')
                .setDescription(`Battle starting between **${result.player1.username}** and **${result.player2.username}**!`)
                .setColor('#4ECDC4');
            
            // Reply first, then start the battle
            await interaction.reply({ embeds: [embed] });
            
            // Start enhanced turn-based battle
            try {
                // Create a mock target user object for the matched player
                const targetUser = {
                    id: result.player2.userId,
                    username: result.player2.username
                };
                
                // Use a timeout to avoid interaction conflicts
                setTimeout(async () => {
                    try {
                        await EnhancedTurnBasedPvP.initiateBattle(interaction, targetUser);
                    } catch (error) {
                        console.error('Error starting queue battle:', error);
                    }
                }, 1000);
                
            } catch (error) {
                console.error('Error starting battle from queue:', error);
                await interaction.followUp({
                    content: '❌ Battle could not start. Please try again.',
                    ephemeral: true
                });
            }
        } else {
            embed
                .setTitle('🔍 Joined Queue')
                .setDescription(`You've joined the PvP queue! Current position: **${result.position}**`)
                .addFields([
                    { name: '👥 Players in Queue', value: result.queueSize.toString(), inline: true },
                    { name: '⏱️ Estimated Wait', value: `${Math.max(1, result.position * 30)} seconds`, inline: true },
                    { name: '🎮 Queue System', value: 'Enhanced Turn-Based PvP', inline: true }
                ])
                .setColor('#F39C12');
            
            await interaction.reply({ embeds: [embed] });
        }
    } else {
        embed
            .setTitle('❌ Queue Error')
            .setDescription(result.message)
            .setColor('#FF6B6B');
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

async function handleLeaveQueue(interaction, userId) {
    if (!PvPQueueSystem) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Queue System Unavailable')
            .setDescription('The PvP queue system is not available.')
            .setColor('#FF6B6B');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const result = PvPQueueSystem.leaveQueue(userId);
    
    const embed = new EmbedBuilder()
        .setTimestamp();

    if (result.success) {
        embed
            .setTitle('✅ Left Queue')
            .setDescription('You have successfully left the PvP queue.')
            .setColor('#4ECDC4');
    } else {
        embed
            .setTitle('❌ Not in Queue')
            .setDescription('You are not currently in the PvP queue.')
            .setColor('#FF6B6B');
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleQueueStatus(interaction) {
    if (!PvPQueueSystem) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Queue System Unavailable')
            .setDescription('The PvP queue system is not available.')
            .setColor('#FF6B6B');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const queueStatus = PvPQueueSystem.getQueueStatus();
    const battleStats = EnhancedTurnBasedPvP.getBattleStats();
    
    const embed = new EmbedBuilder()
        .setTitle('📊 Enhanced PvP System Status')
        .addFields([
            { name: '👥 Players in Queue', value: queueStatus.queueSize.toString(), inline: true },
            { name: '⚔️ Active Battles', value: battleStats.activeBattles.toString(), inline: true },
            { name: '⏱️ Average Wait Time', value: `${Math.max(1, queueStatus.queueSize * 30)} seconds`, inline: true }
        ])
        .setColor('#F39C12')
        .setTimestamp();

    if (queueStatus.queuedPlayers.length > 0) {
        const queueList = queueStatus.queuedPlayers
            .slice(0, 5) // Show top 5 players
            .map((player, index) => `${index + 1}. ${player.username}`)
            .join('\n');
        
        embed.addFields([
            { name: '📋 Queue List (Top 5)', value: queueList || 'No players in queue', inline: false }
        ]);
    }

    if (battleStats.activeBattles > 0) {
        const battleList = battleStats.battles
            .slice(0, 3) // Show top 3 battles
            .map(battle => `**${battle.players[0] || 'Unknown'}** vs **${battle.players[1] || 'Unknown'}** (${battle.status})`)
            .join('\n');
        
        embed.addFields([
            { name: '⚔️ Active Battles (Top 3)', value: battleList || 'No active battles', inline: false }
        ]);
    }

    await interaction.reply({ embeds: [embed] });
}

async function handleStats(interaction, userId) {
    try {
        // Get basic user stats
        const user = await DatabaseManager.getUser(userId);
        if (!user) {
            const embed = new EmbedBuilder()
                .setTitle('❌ User Not Found')
                .setDescription('You are not registered in the system. Use a command to register first!')
                .setColor('#FF6B6B');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Get user's devil fruits for battle readiness
        const userFruits = await DatabaseManager.getUserDevilFruits(userId);
        
        const embed = new EmbedBuilder()
            .setTitle(`⚔️ ${interaction.user.username}'s Enhanced PvP Stats`)
            .addFields([
                { name: '🏆 PvP Wins', value: (user.pvp_wins || 0).toString(), inline: true },
                { name: '💀 PvP Losses', value: (user.pvp_losses || 0).toString(), inline: true },
                { name: '📊 Win Rate', value: calculateWinRate(user.pvp_wins || 0, user.pvp_losses || 0), inline: true },
                { name: '⭐ Level', value: (user.level || 0).toString(), inline: true },
                { name: '💎 Total CP', value: (user.total_cp || 0).toLocaleString(), inline: true },
                { name: '🍈 Devil Fruits', value: userFruits.length.toString(), inline: true },
                { name: '⚔️ Battle Ready', value: userFruits.length >= 5 ? '✅ Yes' : '❌ Need more fruits', inline: true },
                { name: '🎯 Current Status', value: getCurrentBattleStatus(userId), inline: true }
            ])
            .setColor('#4ECDC4')
            .setTimestamp();

        // Add battle readiness info
        if (userFruits.length < 5) {
            embed.addFields([{
                name: '📝 Battle Requirements',
                value: `You need at least 5 Devil Fruits to participate in enhanced turn-based PvP.\n` +
                       `Current: ${userFruits.length}/5 fruits\n` +
                       `Use \`/pull\` to get more Devil Fruits!`,
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
            .setTitle('❌ Error')
            .setDescription('Could not fetch your PvP statistics. Please try again.')
            .setColor('#FF6B6B');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

async function handleSystemInfo(interaction) {
    const battleStats = EnhancedTurnBasedPvP.getBattleStats();
    const queueStatus = PvPQueueSystem ? PvPQueueSystem.getQueueStatus() : { queueSize: 0, activeMatches: 0 };
    
    const embed = new EmbedBuilder()
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
                    '1️⃣ Challenge a player or join queue',
                    '2️⃣ Both players select 5 battle fruits',
                    '3️⃣ Turn-based combat begins',
                    '4️⃣ Use fruit abilities strategically',
                    '5️⃣ Winner takes victory!'
                ].join('\n'),
                inline: false
            },
            {
                name: '📊 Current Statistics',
                value: [
                    `**Active Battles**: ${battleStats.activeBattles}`,
                    `**Queue Size**: ${queueStatus.queueSize}`,
                    `**System Status**: ✅ Operational`,
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
                name: '🔧 System Commands',
                value: [
                    '`/pvp challenge @user` - Challenge specific user',
                    '`/pvp queue` - Join matchmaking queue',
                    '`/pvp leave-queue` - Leave queue',
                    '`/pvp queue-status` - Check queue status',
                    '`/pvp stats` - View your PvP statistics',
                    '`/pvp system-info` - View this information'
                ].join('\n'),
                inline: false
            }
        ])
        .setColor('#9932CC')
        .setFooter({ text: 'Enhanced Turn-Based PvP - Strategic Devil Fruit Combat' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

// Helper functions
function calculateWinRate(wins, losses) {
    const total = wins + losses;
    if (total === 0) return '0%';
    return `${Math.round((wins / total) * 100)}%`;
}

function getCurrentBattleStatus(userId) {
    const existingBattle = EnhancedTurnBasedPvP.findUserBattle(userId);
    if (existingBattle) {
        return '⚔️ In Battle';
    }
    
    if (PvPQueueSystem && PvPQueueSystem.queue.has(userId)) {
        return '🔍 In Queue';
    }
    
    return '💤 Available';
}
