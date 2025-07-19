// src/commands/enhanced-pvp.js - COMPLETE FIXED Enhanced PvP Command
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const PvPBalanceSystem = require('../systems/pvp-balance');

// Simple battle tracking for compatibility
const activeBattles = new Map();
const battleQueue = new Set();
const battleCooldowns = new Map();

// Enhanced turn-based system - FORCE LOAD
let EnhancedTurnBasedPvP = null;
let PvPInteractionHandler = null;

try {
    // Force require the enhanced system
    const enhancedPvPModule = require('../systems/enhanced-turn-based-pvp');
    EnhancedTurnBasedPvP = enhancedPvPModule;
    PvPInteractionHandler = enhancedPvPModule.PvPInteractionHandler;
    
    console.log('✅ Enhanced Turn-Based PvP system successfully loaded');
    console.log('✅ PvP Interaction Handler successfully loaded');
} catch (error) {
    console.error('❌ FAILED to load Enhanced Turn-Based PvP system:', error);
    console.log('❌ This should not happen - check enhanced-turn-based-pvp.js file');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp')
        .setDescription('⚔️ Enhanced Devil Fruit Turn-Based PvP Battle System')
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('🔥 Join enhanced turn-based battle queue with real-time combat!')
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
                .setDescription('🚪 Leave the battle queue')
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
                case 'system':
                    await this.handleSystemInfo(interaction);
                    break;
                default:
                    await interaction.reply({
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

        console.log(`⚔️ ${username} attempting to start enhanced turn-based battle`);

        // Check if enhanced system is available
        if (!EnhancedTurnBasedPvP) {
            return await interaction.reply({
                content: '❌ Enhanced Turn-Based PvP system is not available! The system failed to load properly.',
                ephemeral: true
            });
        }

        // Defer reply immediately to prevent timeout
        await interaction.deferReply();

        try {
            // Check if user already has an active battle
            const existingBattle = EnhancedTurnBasedPvP.getUserActiveBattle(userId);
            if (existingBattle) {
                return await interaction.editReply({
                    content: '⚔️ You already have an active enhanced turn-based battle! Finish it first before joining a new one.',
                });
            }

            // Create PvP fighter using balance system
            const fighter = await PvPBalanceSystem.createPvPFighter(userId);
            
            if (!fighter) {
                const userFruits = await DatabaseManager.getUserDevilFruits(userId);
                return await interaction.editReply({
                    content: `❌ You need at least 5 Devil Fruits to participate in enhanced turn-based battles!\nYou currently have ${userFruits?.length || 0} fruits. Use \`/pull\` to get more fruits.`,
                });
            }

            // Check cooldown
            const lastBattle = battleCooldowns.get(userId);
            if (lastBattle && Date.now() - lastBattle < 300000) { // 5 minute cooldown
                const remaining = Math.ceil((300000 - (Date.now() - lastBattle)) / 60000);
                return await interaction.editReply({
                    content: `⏰ You must wait ${remaining} more minutes before joining another enhanced battle.`,
                });
            }

            // Check if already in queue
            if (battleQueue.has(userId)) {
                return await interaction.editReply({
                    content: '⚔️ You are already in the enhanced battle queue! Use `/pvp leave` to leave the queue.',
                });
            }

            // Add to queue and set cooldown
            battleQueue.add(userId);
            battleCooldowns.set(userId, Date.now());
            
            console.log(`⚔️ ${username} starting enhanced turn-based battle with enhanced system`);
            
            // Try to find a balanced match with another player
            const opponent = await this.findBalancedMatch(fighter);
            
            if (opponent) {
                // Remove both players from queue
                battleQueue.delete(userId);
                battleQueue.delete(opponent.userId);
                battleCooldowns.set(opponent.userId, Date.now());
                
                // Start enhanced turn-based PvP battle (PvP)
                await EnhancedTurnBasedPvP.startBattle(interaction, fighter, opponent);
            } else {
                // No player available, start enhanced turn-based battle vs NPC
                battleQueue.delete(userId);
                await EnhancedTurnBasedPvP.startBattle(interaction, fighter, null);
            }

        } catch (error) {
            console.error('Error in enhanced handleQueue:', error);
            
            try {
                await interaction.editReply({
                    content: '❌ An error occurred while starting the enhanced turn-based battle. Please try again.',
                });
            } catch (editError) {
                console.error('Failed to edit reply:', editError);
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
            content: `${opponent}, you have been challenged to an **enhanced turn-based PvP battle**!`,
            embeds: [challengeEmbed]
        });
    },

    async findBalancedMatch(playerFighter) {
        // Look for another player in queue with balanced CP
        for (const queuedUserId of battleQueue) {
            if (queuedUserId !== playerFighter.userId) {
                const opponentFighter = await PvPBalanceSystem.createPvPFighter(queuedUserId);
                
                if (opponentFighter) {
                    // Check if match is balanced
                    const balanceCheck = PvPBalanceSystem.validateFightBalance(playerFighter, opponentFighter);
                    if (balanceCheck.isBalanced) {
                        return opponentFighter;
                    }
                }
            }
        }
        return null;
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
                    name: '🔥 Enhanced Features',
                    value: [
                        `✅ **Real-Time Turn-Based Combat**`,
                        `✅ **Unique Fruit Selection (with duplicates)**`,
                        `✅ **Interactive Skill Selection**`,
                        `✅ **Live HP Bars & Battle Log**`,
                        `✅ **Advanced Status Effects**`,
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
            .setFooter({ text: 'Enhanced stats for turn-based battles with unique fruit display' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },

    async handleLeave(interaction) {
        const userId = interaction.user.id;
        
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
        
        if (!battleQueue.has(userId)) {
            return interaction.reply({
                content: '❌ You are not in the enhanced battle queue.',
                ephemeral: true
            });
        }

        battleQueue.delete(userId);
        
        const embed = new EmbedBuilder()
            .setColor(0xFF8000)
            .setTitle('🚪 Left Enhanced Battle Queue')
            .setDescription('You have successfully left the enhanced turn-based battle queue.')
            .addFields([
                {
                    name: '📊 Queue Status',
                    value: `**Players in Queue**: ${battleQueue.size}\n**Your Status**: Not in queue`,
                    inline: true
                }
            ])
            .setFooter({ text: 'You can rejoin anytime with /pvp queue' });

        await interaction.reply({ embeds: [embed] });
    },

    async handleSystemInfo(interaction) {
        const balanceReport = PvPBalanceSystem.getBalanceReport();
        
        const embed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('🔥 Enhanced Turn-Based PvP System')
            .setDescription('**Advanced Devil Fruit PvP with real-time turn-based combat, unique fruit selection, and professional battle interface**')
            .addFields([
                {
                    name: '🎯 Enhanced Turn-Based Features',
                    value: [
                        `**System Status**: ${EnhancedTurnBasedPvP ? '✅ ACTIVE' : '❌ INACTIVE'}`,
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
                    name: '🎮 Enhanced Battle Types',
                    value: [
                        `• **Queue Battles**: Enhanced turn-based vs players/bosses`,
                        `• **Challenge System**: Challenge specific players (dev)`,
                        `• **Quick Battles**: Instant simulation results`,
                        `• **Enhanced NPC Bosses**: Fight One Piece characters`,
                        `• **Berry Rewards**: Enhanced rewards for PvE victories`,
                        `• **Unique Fruit System**: Select 5 unique fruits only`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🔧 System Status',
                    value: [
                        `**Enhanced System Loaded**: ${EnhancedTurnBasedPvP ? '✅ YES' : '❌ NO'}`,
                        `**Interaction Handler**: ${PvPInteractionHandler ? '✅ YES' : '❌ NO'}`,
                        `**Active Battles**: ${EnhancedTurnBasedPvP ? EnhancedTurnBasedPvP.activeBattles.size : 0}`,
                        `**Queue Size**: ${battleQueue.size}`,
                        `**System Version**: Enhanced v3.0`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Start enhanced turn-based battles with /pvp queue!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};

// Export battle data for compatibility
module.exports.activeBattles = activeBattles;
module.exports.battleQueue = battleQueue;
module.exports.battleCooldowns = battleCooldowns;
module.exports.EnhancedTurnBasedPvP = EnhancedTurnBasedPvP;
module.exports.PvPInteractionHandler = PvPInteractionHandler;
