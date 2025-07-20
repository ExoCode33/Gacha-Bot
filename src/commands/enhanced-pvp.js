// src/commands/enhanced-pvp.js - Updated with Enhanced Queue System
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const PvPBalanceSystem = require('../systems/pvp-balance');

// Enhanced turn-based system with queue
let EnhancedTurnBasedPvP = null;
let PvPInteractionHandler = null;
let PvPQueueSystem = null;

try {
    const enhancedPvPModule = require('../systems/enhanced-turn-based-pvp');
    EnhancedTurnBasedPvP = enhancedPvPModule;
    PvPInteractionHandler = enhancedPvPModule.PvPInteractionHandler;
    
    // Initialize queue system
    const PvPQueueSystemClass = require('../systems/pvp-queue-system');
    PvPQueueSystem = new PvPQueueSystemClass(EnhancedTurnBasedPvP);
    
    console.log('✅ Enhanced Turn-Based PvP system with Queue loaded successfully');
} catch (error) {
    console.error('❌ FAILED to load Enhanced Turn-Based PvP system:', error);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp')
        .setDescription('⚔️ Enhanced Devil Fruit Turn-Based PvP Battle System')
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('🎯 Join enhanced matchmaking queue (20 players max, 2min timer, auto-boss)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('challenge')
                .setDescription('⚔️ Challenge another player to enhanced turn-based PvP')
                .addUserOption(option => 
                    option.setName('opponent')
                        .setDescription('The pirate to challenge to turn-based combat')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('quick')
                .setDescription('⚡ Quick battle simulation (instant result, no turn-based combat)')
                .addUserOption(option => 
                    option.setName('opponent')
                        .setDescription('The pirate to simulate battle against')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 View your enhanced PvP battle stats')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('View another user\'s battle stats')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('🚪 Leave the matchmaking queue')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue-status')
                .setDescription('📊 View current matchmaking queue status')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('system')
                .setDescription('🔧 View enhanced turn-based PvP system information')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'queue':
                    await this.handleQueue(interaction);
                    break;
                case 'challenge':
                    await this.handleChallenge(interaction);
                    break;
                case 'quick':
                    await this.handleQuickBattle(interaction);
                    break;
                case 'stats':
                    await this.handleStats(interaction);
                    break;
                case 'leave':
                    await this.handleLeave(interaction);
                    break;
                case 'queue-status':
                    await this.handleQueueStatus(interaction);
                    break;
                case 'system':
                    await this.handleSystemInfo(interaction);
                    break;
                default:
                    await interaction.reply({
            content: `${opponent}, you have been challenged to an **enhanced turn-based PvP battle**!`,
            embeds: [challengeEmbed]
        });
    },

    async handleQuickBattle(interaction) {
        const user1 = interaction.user;
        const user2 = interaction.options.getUser('opponent');

        if (user1.id === user2.id) {
            return interaction.reply({
                content: '⚔️ You cannot battle against yourself!',
                ephemeral: true
            });
        }

        // Use balance system for quick battle (instant simulation)
        const fighter1 = await PvPBalanceSystem.createPvPFighter(user1.id);
        const fighter2 = await PvPBalanceSystem.createPvPFighter(user2.id);

        if (!fighter1 || !fighter2) {
            return interaction.reply({
                content: '❌ Both users need at least 5 Devil Fruits to simulate a battle!',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            // Use the balance system's simulation for instant results
            const battleResult = await PvPBalanceSystem.simulateFight(fighter1, fighter2);
            const resultEmbed = PvPBalanceSystem.createFightEmbed(battleResult);

            resultEmbed.title = '⚡ Quick Battle Simulation (Instant Result)';
            resultEmbed.fields.push({
                name: '🎮 Battle Type',
                value: 'Quick Simulation (No rewards)\nUse `/pvp queue` for enhanced turn-based battles with rewards!',
                inline: true
            });

            await interaction.editReply({
                embeds: [resultEmbed]
            });
        } catch (error) {
            console.error('Error in quick battle:', error);
            await interaction.editReply({
                content: '❌ An error occurred during the battle simulation.',
            });
        }
    },

    async handleStats(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        // Use balance system for stats
        const fighter = await PvPBalanceSystem.createPvPFighter(targetUser.id);
        
        if (!fighter) {
            return interaction.reply({
                content: '❌ This user hasn\'t started their pirate journey yet or needs more Devil Fruits!',
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle(`⚔️ ${targetUser.username}'s Enhanced Turn-Based PvP Stats`)
            .addFields([
                {
                    name: '🏴‍☠️ Enhanced Fighter Info',
                    value: [
                        `**Level**: ${fighter.level}`,
                        `**Balanced CP**: ${fighter.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${fighter.maxHealth}`,
                        `**Original CP**: ${fighter.originalCP?.toLocaleString() || 'N/A'}`,
                        `**Total Fruits**: ${fighter.fruits?.length || 0}`,
                        `**Enhanced Battle Ready**: ${(fighter.fruits?.length || 0) >= 5 ? '✅ Yes' : '❌ Need more fruits'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚖️ Enhanced Balance Info',
                    value: [
                        `**Balance Ratio**: ${fighter.originalCP ? (fighter.balancedCP / fighter.originalCP * 100).toFixed(1) + '%' : 'N/A'}`,
                        `**Health Scaling**: Level + rarity based`,
                        `**CP Scaling**: Balanced for fair PvP`,
                        `**Max Level Advantage**: 3x (reduced)`,
                        `**Max Rarity Advantage**: 4x (reduced)`,
                        `**Enhanced System**: ${EnhancedTurnBasedPvP ? '✅ Available' : '❌ Unavailable'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎯 Matchmaking Info',
                    value: [
                        `**Queue Status**: ${PvPQueueSystem && PvPQueueSystem.queue.has(targetUser.id) ? '🎯 In Queue' : '⭕ Not in Queue'}`,
                        `**Battle Cooldown**: ${PvPQueueSystem && PvPQueueSystem.isOnCooldown(targetUser.id) ? `⏰ ${Math.ceil(PvPQueueSystem.getRemainingCooldown(targetUser.id) / 60000)}m` : '✅ Ready'}`,
                        `**CP Search Range**: ${Math.floor(fighter.balancedCP * 0.7).toLocaleString()} - ${Math.floor(fighter.balancedCP * 1.3).toLocaleString()}`,
                        `**Queue Position**: ${PvPQueueSystem && PvPQueueSystem.queue.has(targetUser.id) ? Array.from(PvPQueueSystem.queue.keys()).indexOf(targetUser.id) + 1 : 'N/A'}`,
                        `**Active Battle**: ${EnhancedTurnBasedPvP?.getUserActiveBattle(targetUser.id) ? '⚔️ Yes' : '⭕ No'}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🔥 Enhanced Features',
                    value: [
                        `✅ **Real-Time Turn-Based Combat**`,
                        `✅ **Smart Matchmaking (20 players max)**`,
                        `✅ **2-Minute Search Timer**`,
                        `✅ **Auto Boss Fallback**`,
                        `✅ **Live HP Bars & Battle Log**`,
                        `✅ **Professional Battle Interface**`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🍈 Strongest Battle Fruit',
                    value: fighter.strongestFruit ? 
                        `**${fighter.strongestFruit.fruit_name}**\n${fighter.ability?.name || 'Unknown Ability'}\n${fighter.ability?.damage || 0} damage • ${fighter.ability?.cooldown || 0} cooldown` :
                        'No fruits available',
                    inline: false
                }
            ])
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({ text: 'Enhanced stats for turn-based battles with smart matchmaking' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },

    async handleLeave(interaction) {
        const userId = interaction.user.id;
        
        if (!PvPQueueSystem) {
            return interaction.reply({
                content: '❌ Queue system is not available.',
                ephemeral: true
            });
        }
        
        // Check if user has an active enhanced battle
        if (EnhancedTurnBasedPvP) {
            const activeBattle = EnhancedTurnBasedPvP.getUserActiveBattle(userId);
            if (activeBattle) {
                return interaction.reply({
                    content: '⚔️ You have an active enhanced turn-based battle! Use the surrender button in the battle interface to leave.',
                    ephemeral: true
                });
            }
        }
        
        if (!PvPQueueSystem.queue.has(userId)) {
            return interaction.reply({
                content: '❌ You are not in the enhanced matchmaking queue.',
                ephemeral: true
            });
        }

        // Use the queue system's leave method
        await PvPQueueSystem.leaveQueue(interaction, userId);
    },

    async handleQueueStatus(interaction) {
        if (!PvPQueueSystem) {
            return interaction.reply({
                content: '❌ Queue system is not available.',
                ephemeral: true
            });
        }

        const stats = PvPQueueSystem.getQueueStats();
        const queueList = Array.from(PvPQueueSystem.queue.values())
            .sort((a, b) => a.joinTime - b.joinTime)
            .slice(0, 10) // Show top 10
            .map((player, index) => {
                const waitTime = Math.floor((Date.now() - player.joinTime) / 1000);
                return `${index + 1}. **${player.username}** (${player.balancedCP.toLocaleString()} CP) - ${waitTime}s`;
            }).join('\n');

        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🎯 Enhanced Matchmaking Queue Status')
            .setDescription(`**Live queue information and statistics**`)
            .addFields([
                {
                    name: '📊 Queue Statistics',
                    value: [
                        `**Players in Queue**: ${stats.size}/${stats.maxSize}`,
                        `**Average CP**: ${stats.averageCP.toLocaleString()}`,
                        `**CP Range**: ${stats.minCP.toLocaleString()} - ${stats.maxCP.toLocaleString()}`,
                        `**Average Wait Time**: ${stats.averageWaitTime}s`,
                        `**Active Battles**: ${EnhancedTurnBasedPvP ? EnhancedTurnBasedPvP.activeBattles.size : 0}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚙️ System Settings',
                    value: [
                        `**Max Queue Size**: 20 players`,
                        `**Search Timer**: 2 minutes`,
                        `**Battle Cooldown**: 5 minutes`,
                        `**CP Balance Range**: ±30%`,
                        `**Auto Boss Fallback**: ✅ Enabled`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '👥 Current Queue (Top 10)',
                    value: queueList || 'No players in queue',
                    inline: false
                }
            ])
            .setFooter({ text: 'Join with /pvp queue • Real-time matchmaking active' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleSystemInfo(interaction) {
        const balanceReport = PvPBalanceSystem.getBalanceReport();
        const queueStats = PvPQueueSystem ? PvPQueueSystem.getQueueStats() : null;
        
        const embed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('🔥 Enhanced Turn-Based PvP System v2.0')
            .setDescription('**Advanced Devil Fruit PvP with smart matchmaking, real-time turn-based combat, and professional battle interface**')
            .addFields([
                {
                    name: '🎯 Enhanced Matchmaking System',
                    value: [
                        `**System Status**: ${PvPQueueSystem ? '✅ ACTIVE' : '❌ INACTIVE'}`,
                        `**Queue Capacity**: 20 players maximum`,
                        `**Search Timer**: 2 minutes with live countdown`, 
                        `**Auto Boss Fallback**: Mysterious opponents`,
                        `**Battle Cooldown**: 5 minutes between battles`,
                        `**Smart Matching**: ±30% CP balance range`,
                        `**Current Queue**: ${queueStats ? `${queueStats.size}/${queueStats.maxSize} players` : 'N/A'}`,
                        `**Live Updates**: Real-time queue tracking`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⚔️ Enhanced Turn-Based Features',
                    value: [
                        `**Battle System**: ${EnhancedTurnBasedPvP ? '✅ ACTIVE' : '❌ INACTIVE'}`,
                        `**Real-Time Battles**: Interactive turn-based combat`, 
                        `**Live HP Visualization**: Real-time health bars`,
                        `**Enhanced Battle Log**: Expanding combat history`,
                        `**Boss Reveals**: See your NPC opponent details`,
                        `**Skill Selection**: View abilities and effects`,
                        `**Unique Fruit Selection**: No duplicates in selection`,
                        `**Duplicate Display**: Shows (x2), (x3) counts`,
                        `**Professional Interface**: Smooth combat flow`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⚖️ Advanced Balance System',
                    value: [
                        `• **Max Level Advantage**: ${balanceReport.maxLevelAdvantage}`,
                        `• **Max Rarity Advantage**: ${balanceReport.maxRarityAdvantage}`,
                        `• **Turn 1 Damage Reduction**: ${balanceReport.turn1DamageReduction}`,
                        `• **Max Fight Duration**: 15 turns`,
                        `• **Duplicate Bonuses**: +1% damage per duplicate`,
                        `• **Balanced Matchmaking**: Auto-matching`,
                        `• **Enhanced NPC AI**: Smart boss selection`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🎮 Battle Types & Rewards',
                    value: [
                        `• **Queue Battles**: Enhanced turn-based vs players/bosses`,
                        `• **Smart Matchmaking**: 2min timer with 20 player queue`,
                        `• **Challenge System**: Challenge specific players`,
                        `• **Quick Battles**: Instant simulation results`,
                        `• **Enhanced NPC Bosses**: Fight One Piece characters`,
                        `• **Berry Rewards**: Enhanced rewards for PvE victories`,
                        `• **Cooldown System**: 5min between battles for balance`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🔧 System Status',
                    value: [
                        `**Enhanced System**: ${EnhancedTurnBasedPvP ? '✅ LOADED' : '❌ FAILED'}`,
                        `**Queue System**: ${PvPQueueSystem ? '✅ LOADED' : '❌ FAILED'}`,
                        `**Interaction Handler**: ${PvPInteractionHandler ? '✅ LOADED' : '❌ FAILED'}`,
                        `**Active Battles**: ${EnhancedTurnBasedPvP ? EnhancedTurnBasedPvP.activeBattles.size : 0}`,
                        `**Queue Size**: ${queueStats ? queueStats.size : 0}/${queueStats ? queueStats.maxSize : 20}`,
                        `**System Version**: Enhanced v2.0 with Smart Queue`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Start enhanced battles with /pvp queue!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};

// Export enhanced PvP data for compatibility
module.exports.EnhancedTurnBasedPvP = EnhancedTurnBasedPvP;
module.exports.PvPInteractionHandler = PvPInteractionHandler;
module.exports.PvPQueueSystem = PvPQueueSystem;
                        content: 'Unknown enhanced PvP command.',
                        ephemeral: true
                    });
            }
        } catch (error) {
            console.error('Error in enhanced PvP command:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Enhanced PvP System Error')
                .setDescription('An error occurred during enhanced PvP command execution!')
                .setFooter({ text: 'Please try again later.' });
            
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

        console.log(`🎯 ${username} joining enhanced matchmaking queue`);

        // Check if enhanced systems are available
        if (!EnhancedTurnBasedPvP || !PvPQueueSystem) {
            return await interaction.reply({
                content: '❌ Enhanced Turn-Based PvP system is not available! The system failed to load properly.',
                ephemeral: true
            });
        }

        try {
            // Create PvP fighter using balance system
            const fighter = await PvPBalanceSystem.createPvPFighter(userId);
            
            if (!fighter) {
                const userFruits = await DatabaseManager.getUserDevilFruits(userId);
                return await interaction.reply({
                    content: `❌ You need at least 5 Devil Fruits to participate in enhanced turn-based battles!\nYou currently have ${userFruits?.length || 0} fruits. Use \`/pull\` to get more fruits.`,
                    ephemeral: true
                });
            }

            // Join the enhanced matchmaking queue
            await PvPQueueSystem.joinQueue(interaction, fighter);

        } catch (error) {
            console.error('Error in enhanced handleQueue:', error);
            
            try {
                await interaction.reply({
                    content: '❌ An error occurred while joining the enhanced matchmaking queue. Please try again.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
            }
        }
    },

    async handleChallenge(interaction) {
        const challenger = interaction.user;
        const opponent = interaction.options.getUser('opponent');

        if (challenger.id === opponent.id) {
            return interaction.reply({
                content: '⚔️ You cannot challenge yourself!',
                ephemeral: true
            });
        }

        if (opponent.bot) {
            return interaction.reply({
                content: '⚔️ You cannot challenge a bot! Use `/pvp queue` to fight enhanced NPC bosses.',
                ephemeral: true
            });
        }

        // Check if enhanced system is available
        if (!EnhancedTurnBasedPvP) {
            return await interaction.reply({
                content: '❌ Enhanced Turn-Based PvP system is not available for challenges!',
                ephemeral: true
            });
        }

        // Check if either user has an active battle
        const challengerBattle = EnhancedTurnBasedPvP.getUserActiveBattle(challenger.id);
        const opponentBattle = EnhancedTurnBasedPvP.getUserActiveBattle(opponent.id);
        
        if (challengerBattle || opponentBattle) {
            return interaction.reply({
                content: '⚔️ One of you already has an active enhanced turn-based battle! Wait for it to finish.',
                ephemeral: true
            });
        }

        // Create fighters
        const challengerFighter = await PvPBalanceSystem.createPvPFighter(challenger.id);
        const opponentFighter = await PvPBalanceSystem.createPvPFighter(opponent.id);

        if (!challengerFighter || !opponentFighter) {
            return interaction.reply({
                content: '❌ Both players need at least 5 Devil Fruits for enhanced turn-based battles!',
                ephemeral: true
            });
        }

        // Check balance
        const balanceCheck = PvPBalanceSystem.validateFightBalance(challengerFighter, opponentFighter);
        
        const challengeEmbed = new EmbedBuilder()
            .setColor(balanceCheck.isBalanced ? 0x00FF00 : 0xFF8000)
            .setTitle('⚔️ Enhanced Turn-Based PvP Challenge')
            .setDescription(`**${challenger.username}** challenges **${opponent.username}** to an **enhanced real-time turn-based** Devil Fruit battle!`)
            .addFields([
                {
                    name: '🏴‍☠️ Challenger Stats',
                    value: [
                        `**${challenger.username}**`,
                        `Level: ${challengerFighter.level}`,
                        `Balanced CP: ${challengerFighter.balancedCP.toLocaleString()}`,
                        `Battle HP: ${challengerFighter.maxHealth}`,
                        `Fruits: ${challengerFighter.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🏴‍☠️ Opponent Stats',
                    value: [
                        `**${opponent.username}**`,
                        `Level: ${opponentFighter.level}`,
                        `Balanced CP: ${opponentFighter.balancedCP.toLocaleString()}`,
                        `Battle HP: ${opponentFighter.maxHealth}`,
                        `Fruits: ${opponentFighter.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚖️ Balance Analysis',
                    value: [
                        `**Balanced**: ${balanceCheck.isBalanced ? '✅ Yes' : '⚠️ Unbalanced'}`,
                        `**CP Ratio**: ${balanceCheck.cpRatio.toFixed(2)}x`,
                        `**Level Difference**: ${balanceCheck.levelDiff}`,
                        `**Recommendation**: ${balanceCheck.recommendation}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🔥 Enhanced Features',
                    value: [
                        `✅ **Real-Time Turn-Based Combat**`,
                        `✅ **Interactive Skill Selection**`,
                        `✅ **Live HP Bars & Battle Log**`,
                        `✅ **Unique Fruit Selection with Duplicates**`,
                        `✅ **Advanced Status Effects**`,
                        `✅ **Professional Battle Interface**`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ 
                text: 'Enhanced turn-based system ready for epic battles!'
            })
            .setTimestamp();

        await interaction.reply({
