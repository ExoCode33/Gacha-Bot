// src/commands/enhanced-pvp.js - FIXED with Better Error Handling
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');

// Simplified loading with fallbacks
let PvPBalanceSystem = null;
let EnhancedTurnBasedPvP = null;
let PvPInteractionHandler = null;
let PvPQueueSystem = null;

// Safe loading function
function loadPvPSystems() {
    try {
        // Load balance system first
        PvPBalanceSystem = require('../systems/pvp-balance');
        console.log('✅ PvP Balance System loaded');
        
        // Try to load enhanced PvP system
        try {
            const enhancedPvPModule = require('../systems/enhanced-turn-based-pvp');
            EnhancedTurnBasedPvP = enhancedPvPModule;
            PvPInteractionHandler = enhancedPvPModule.PvPInteractionHandler;
            console.log('✅ Enhanced Turn-Based PvP system loaded');
            
            // Try to load queue system
            try {
                const PvPQueueSystemClass = require('../systems/pvp-queue-system');
                PvPQueueSystem = new PvPQueueSystemClass(EnhancedTurnBasedPvP);
                console.log('✅ PvP Queue System loaded');
            } catch (queueError) {
                console.warn('⚠️ Queue system failed to load:', queueError.message);
                console.log('🔄 Continuing without queue system...');
            }
            
        } catch (enhancedError) {
            console.warn('⚠️ Enhanced PvP system failed to load:', enhancedError.message);
            console.log('🔄 Continuing with basic PvP only...');
        }
        
    } catch (balanceError) {
        console.error('❌ Critical: PvP Balance System failed to load:', balanceError.message);
    }
}

// Load systems on module initialization
loadPvPSystems();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp')
        .setDescription('⚔️ Devil Fruit PvP Battle System')
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('🎯 Join matchmaking queue (Enhanced system with 20 players max, 2min timer)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('challenge')
                .setDescription('⚔️ Challenge another player to PvP')
                .addUserOption(option => 
                    option.setName('opponent')
                        .setDescription('The pirate to challenge')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('quick')
                .setDescription('⚡ Quick battle simulation (instant result)')
                .addUserOption(option => 
                    option.setName('opponent')
                        .setDescription('The pirate to battle')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 View PvP battle stats')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('View another user\'s stats')
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
                .setDescription('📊 View matchmaking queue status')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('system')
                .setDescription('🔧 View PvP system information')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            // Check if systems are available
            if (!PvPBalanceSystem) {
                return await interaction.reply({
                    content: '❌ PvP system is not available. Please contact an administrator.',
                    ephemeral: true
                });
            }

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
                        content: '❌ Unknown PvP command.',
                        ephemeral: true
                    });
            }
        } catch (error) {
            console.error('Error in PvP command:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ PvP System Error')
                .setDescription('An error occurred during PvP command execution!')
                .addFields([
                    {
                        name: '🔧 System Status',
                        value: [
                            `**Balance System**: ${PvPBalanceSystem ? '✅ Loaded' : '❌ Failed'}`,
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

        console.log(`🎯 ${username} attempting to join PvP queue`);

        try {
            // Create PvP fighter using balance system
            const fighter = await PvPBalanceSystem.createPvPFighter(userId);
            
            if (!fighter) {
                const userFruits = await DatabaseManager.getUserDevilFruits(userId);
                return await interaction.reply({
                    content: `❌ You need at least 5 Devil Fruits to participate in PvP battles!\nYou currently have ${userFruits?.length || 0} fruits. Use \`/pull\` to get more fruits.`,
                    ephemeral: true
                });
            }

            // Check if enhanced queue system is available
            if (PvPQueueSystem && EnhancedTurnBasedPvP) {
                console.log(`🎯 Using enhanced queue system for ${username}`);
                await PvPQueueSystem.joinQueue(interaction, fighter);
            } else {
                console.log(`🎯 Using fallback system for ${username}`);
                await this.fallbackQueue(interaction, fighter);
            }

        } catch (error) {
            console.error('Error in handleQueue:', error);
            await interaction.reply({
                content: '❌ An error occurred while joining the queue. Please try again.',
                ephemeral: true
            });
        }
    },

    // Fallback queue system when enhanced system isn't available
    async fallbackQueue(interaction, fighter) {
        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('⚔️ PvP Queue - Basic Mode')
            .setDescription(`**${fighter.username}** is searching for an opponent!`)
            .addFields([
                {
                    name: '🏴‍☠️ Your Stats',
                    value: [
                        `**Level**: ${fighter.level}`,
                        `**Balanced CP**: ${fighter.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${fighter.maxHealth}`,
                        `**Fruits**: ${fighter.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚠️ Basic Mode',
                    value: [
                        `**Enhanced System**: Not available`,
                        `**Queue**: Immediate boss battle`,
                        `**Battle Type**: Quick simulation`,
                        `**Fallback**: Active`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Starting boss battle...' });

        await interaction.editReply({ embeds: [embed] });

        // Simulate a quick battle vs NPC
        setTimeout(async () => {
            try {
                const NPCBossSystem = require('../systems/npc-bosses');
                const npcBoss = NPCBossSystem.getBalancedBossForPlayer(fighter.balancedCP);
                const npcFighter = await this.createNPCFighter(npcBoss);
                
                const battleResult = await PvPBalanceSystem.simulateFight(fighter, npcFighter);
                const resultEmbed = PvPBalanceSystem.createFightEmbed(battleResult);
                
                resultEmbed.title = '⚔️ PvP Queue Battle Complete';
                resultEmbed.fields.push({
                    name: '🎮 Battle Info',
                    value: `**Mode**: Basic PvP vs ${npcBoss.name}\n**Type**: Quick simulation\n**Opponent**: ${npcBoss.title}`,
                    inline: true
                });

                await interaction.editReply({ embeds: [resultEmbed] });
            } catch (error) {
                console.error('Error in fallback battle:', error);
                await interaction.editReply({
                    content: '❌ An error occurred during the battle.'
                });
            }
        }, 3000);
    },

    async createNPCFighter(npcBoss) {
        return {
            userId: `npc_${npcBoss.name.toLowerCase().replace(/\s/g, '_')}`,
            username: npcBoss.name,
            level: npcBoss.level,
            balancedCP: npcBoss.totalCP,
            maxHealth: Math.floor(npcBoss.totalCP * 0.8),
            hp: Math.floor(npcBoss.totalCP * 0.8),
            fruits: [],
            effects: [],
            isNPC: true,
            npcData: npcBoss
        };
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
                content: '⚔️ You cannot challenge a bot! Use `/pvp queue` instead.',
                ephemeral: true
            });
        }

        // Create fighters
        const challengerFighter = await PvPBalanceSystem.createPvPFighter(challenger.id);
        const opponentFighter = await PvPBalanceSystem.createPvPFighter(opponent.id);

        if (!challengerFighter || !opponentFighter) {
            return interaction.reply({
                content: '❌ Both players need at least 5 Devil Fruits for PvP battles!',
                ephemeral: true
            });
        }

        // Check balance
        const balanceCheck = PvPBalanceSystem.validateFightBalance(challengerFighter, opponentFighter);
        
        const challengeEmbed = new EmbedBuilder()
            .setColor(balanceCheck.isBalanced ? 0x00FF00 : 0xFF8000)
            .setTitle('⚔️ PvP Challenge')
            .setDescription(`**${challenger.username}** challenges **${opponent.username}** to a Devil Fruit battle!`)
            .addFields([
                {
                    name: '🏴‍☠️ Challenger',
                    value: [
                        `**${challenger.username}**`,
                        `Level: ${challengerFighter.level}`,
                        `CP: ${challengerFighter.balancedCP.toLocaleString()}`,
                        `HP: ${challengerFighter.maxHealth}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🏴‍☠️ Opponent',
                    value: [
                        `**${opponent.username}**`,
                        `Level: ${opponentFighter.level}`,
                        `CP: ${opponentFighter.balancedCP.toLocaleString()}`,
                        `HP: ${opponentFighter.maxHealth}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚖️ Balance Check',
                    value: [
                        `**Balanced**: ${balanceCheck.isBalanced ? '✅ Yes' : '⚠️ Unbalanced'}`,
                        `**CP Ratio**: ${balanceCheck.cpRatio.toFixed(2)}x`,
                        `**Level Diff**: ${balanceCheck.levelDiff}`,
                        `**Enhanced System**: ${EnhancedTurnBasedPvP ? '✅ Available' : '❌ Not Available'}`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: EnhancedTurnBasedPvP ? 'Enhanced turn-based system available!' : 'Basic simulation only' })
            .setTimestamp();

        await interaction.reply({
            content: `${opponent}, you have been challenged to a PvP battle!`,
            embeds: [challengeEmbed]
        });
    },

    async handleQuickBattle(interaction) {
        const user1 = interaction.user;
        const user2 = interaction.options.getUser('opponent');

        if (user1.id === user2.id) {
            return interaction.reply({
                content: '⚔️ You cannot battle yourself!',
                ephemeral: true
            });
        }

        const fighter1 = await PvPBalanceSystem.createPvPFighter(user1.id);
        const fighter2 = await PvPBalanceSystem.createPvPFighter(user2.id);

        if (!fighter1 || !fighter2) {
            return interaction.reply({
                content: '❌ Both users need at least 5 Devil Fruits to battle!',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            const battleResult = await PvPBalanceSystem.simulateFight(fighter1, fighter2);
            const resultEmbed = PvPBalanceSystem.createFightEmbed(battleResult);

            resultEmbed.title = '⚡ Quick Battle Simulation';
            resultEmbed.fields.push({
                name: '🎮 Battle Type',
                value: 'Quick Simulation (No rewards)\nUse `/pvp queue` for enhanced battles!',
                inline: true
            });

            await interaction.editReply({ embeds: [resultEmbed] });
        } catch (error) {
            console.error('Error in quick battle:', error);
            await interaction.editReply({
                content: '❌ An error occurred during the simulation.'
            });
        }
    },

    async handleStats(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        const fighter = await PvPBalanceSystem.createPvPFighter(targetUser.id);
        
        if (!fighter) {
            return interaction.reply({
                content: '❌ This user needs more Devil Fruits to participate in PvP!',
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle(`⚔️ ${targetUser.username}'s PvP Stats`)
            .addFields([
                {
                    name: '🏴‍☠️ Fighter Info',
                    value: [
                        `**Level**: ${fighter.level}`,
                        `**Balanced CP**: ${fighter.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${fighter.maxHealth}`,
                        `**Total Fruits**: ${fighter.fruits?.length || 0}`,
                        `**Battle Ready**: ${(fighter.fruits?.length || 0) >= 5 ? '✅ Yes' : '❌ No'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎯 System Status',
                    value: [
                        `**Balance System**: ${PvPBalanceSystem ? '✅ Active' : '❌ Inactive'}`,
                        `**Enhanced PvP**: ${EnhancedTurnBasedPvP ? '✅ Active' : '❌ Inactive'}`,
                        `**Queue System**: ${PvPQueueSystem ? '✅ Active' : '❌ Inactive'}`,
                        `**In Queue**: ${PvPQueueSystem?.queue.has(targetUser.id) ? '🎯 Yes' : '⭕ No'}`,
                        `**Active Battle**: ${EnhancedTurnBasedPvP?.getUserActiveBattle(targetUser.id) ? '⚔️ Yes' : '⭕ No'}`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },

    async handleLeave(interaction) {
        if (PvPQueueSystem && PvPQueueSystem.queue.has(interaction.user.id)) {
            await PvPQueueSystem.leaveQueue(interaction, interaction.user.id);
        } else {
            await interaction.reply({
                content: '❌ You are not in any queue.',
                ephemeral: true
            });
        }
    },

    async handleQueueStatus(interaction) {
        if (!PvPQueueSystem) {
            return interaction.reply({
                content: '❌ Enhanced queue system is not available.',
                ephemeral: true
            });
        }

        const stats = PvPQueueSystem.getQueueStats();
        
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🎯 Matchmaking Queue Status')
            .addFields([
                {
                    name: '📊 Queue Stats',
                    value: [
                        `**Players**: ${stats.size}/${stats.maxSize}`,
                        `**Average CP**: ${stats.averageCP.toLocaleString()}`,
                        `**CP Range**: ${stats.minCP.toLocaleString()} - ${stats.maxCP.toLocaleString()}`,
                        `**Average Wait**: ${stats.averageWaitTime}s`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleSystemInfo(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('🔥 PvP System Information')
            .setDescription('Devil Fruit PvP Battle System Status')
            .addFields([
                {
                    name: '🔧 System Status',
                    value: [
                        `**Balance System**: ${PvPBalanceSystem ? '✅ LOADED' : '❌ FAILED'}`,
                        `**Enhanced PvP**: ${EnhancedTurnBasedPvP ? '✅ LOADED' : '❌ FAILED'}`,
                        `**Queue System**: ${PvPQueueSystem ? '✅ LOADED' : '❌ FAILED'}`,
                        `**Interaction Handler**: ${PvPInteractionHandler ? '✅ LOADED' : '❌ FAILED'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📊 Current Activity',
                    value: [
                        `**Active Battles**: ${EnhancedTurnBasedPvP ? EnhancedTurnBasedPvP.activeBattles.size : 0}`,
                        `**Queue Size**: ${PvPQueueSystem ? PvPQueueSystem.queue.size : 0}`,
                        `**Max Queue**: ${PvPQueueSystem ? PvPQueueSystem.maxQueueSize : 'N/A'}`,
                        `**System Mode**: ${EnhancedTurnBasedPvP ? 'Enhanced' : 'Basic'}`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Use /pvp queue to start battling!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};

// Export for use in interaction handler
module.exports.PvPQueueSystem = PvPQueueSystem;
module.exports.EnhancedTurnBasedPvP = EnhancedTurnBasedPvP;
