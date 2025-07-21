// src/commands/enhanced-pvp.js - Updated PvP Command using new modular system
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const PvPSystem = require('../systems/pvp/index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp')
        .setDescription('⚔️ Enhanced Devil Fruit PvP Battle System')
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('🎯 Join enhanced matchmaking queue with turn-based battles')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('challenge')
                .setDescription('⚔️ Challenge another player to enhanced PvP')
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
                .setDescription('📊 View PvP battle stats and system status')
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
                .setDescription('📊 View enhanced matchmaking queue status')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('system')
                .setDescription('🔧 View enhanced PvP system information')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            // Check if PvP system is initialized
            if (!PvPSystem.isInitialized) {
                return await interaction.reply({
                    content: '❌ Enhanced PvP system is not available. Please contact an administrator.',
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
            console.error('Error in enhanced PvP command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Enhanced PvP System Error')
                .setDescription('An error occurred during PvP command execution!')
                .addFields([
                    {
                        name: '🔧 System Status',
                        value: [
                            `**PvP System**: ${PvPSystem.isInitialized ? '✅ Active' : '❌ Failed'}`,
                            `**Error**: ${error.message || 'Unknown error'}`,
                            `**Command**: /${subcommand}`
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setFooter({ text: 'Please try again or contact support.' });
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
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
            // Check for active battle
            const activeBattle = PvPSystem.getUserActiveBattle(userId);
            if (activeBattle) {
                return await interaction.reply({
                    content: '⚔️ You already have an active enhanced battle! Finish it first.',
                    ephemeral: true
                });
            }

            // Create PvP fighter
            const fighter = await PvPSystem.createFighter(userId);
            
            if (!fighter) {
                return await interaction.reply({
                    content: `❌ You need at least 5 Devil Fruits to participate in enhanced PvP battles!\nUse \`/pull\` to get more fruits.`,
                    ephemeral: true
                });
            }

            console.log(`🎯 Fighter created for ${username}: ${fighter.balancedCP} CP`);

            // Join enhanced queue
            await PvPSystem.joinQueue(interaction, fighter);

        } catch (error) {
            console.error('Error in handleQueue:', error);
            await interaction.reply({
                content: '❌ An error occurred while joining the enhanced queue. Please try again.',
                ephemeral: true
            });
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
                content: '⚔️ You cannot challenge a bot! Use `/pvp queue` instead.',
                ephemeral: true
            });
        }

        try {
            // Create fighters
            const challengerFighter = await PvPSystem.createFighter(challenger.id);
            const opponentFighter = await PvPSystem.createFighter(opponent.id);

            if (!challengerFighter || !opponentFighter) {
                return interaction.reply({
                    content: '❌ Both players need at least 5 Devil Fruits for enhanced PvP battles!',
                    ephemeral: true
                });
            }

            // Check balance
            const balanceCheck = PvPSystem.balanceSystem.validateFightBalance(challengerFighter, opponentFighter);
            
            const challengeEmbed = new EmbedBuilder()
                .setColor(balanceCheck.isBalanced ? 0x00FF00 : 0xFF8000)
                .setTitle('⚔️ Enhanced PvP Challenge')
                .setDescription(`**${challenger.username}** challenges **${opponent.username}** to an enhanced Devil Fruit battle!`)
                .addFields([
                    {
                        name: '🏴‍☠️ Challenger',
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
                        name: '🏴‍☠️ Opponent',
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
                        name: '⚖️ Enhanced Balance Check',
                        value: [
                            `**Balanced**: ${balanceCheck.isBalanced ? '✅ Yes' : '⚠️ Unbalanced'}`,
                            `**CP Ratio**: ${balanceCheck.cpRatio.toFixed(2)}x`,
                            `**Level Diff**: ${balanceCheck.levelDiff}`,
                            `**Battle Type**: Enhanced Turn-Based PvP`,
                            `**Features**: Real-time fruit selection, live combat`
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setFooter({ text: 'Enhanced turn-based system with live interaction!' })
                .setTimestamp();

            await interaction.reply({
                content: `${opponent}, you have been challenged to an enhanced PvP battle!`,
                embeds: [challengeEmbed]
            });

        } catch (error) {
            console.error('Error in handleChallenge:', error);
            await interaction.reply({
                content: '❌ An error occurred while creating the challenge.',
                ephemeral: true
            });
        }
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

        try {
            const fighter1 = await PvPSystem.createFighter(user1.id);
            const fighter2 = await PvPSystem.createFighter(user2.id);

            if (!fighter1 || !fighter2) {
                return interaction.reply({
                    content: '❌ Both users need at least 5 Devil Fruits to battle!',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            const battleResult = await PvPSystem.balanceSystem.simulateFight(fighter1, fighter2);
            const resultEmbed = PvPSystem.balanceSystem.createFightEmbed(battleResult);

            resultEmbed.title = '⚡ Quick Battle Simulation';
            resultEmbed.fields.push({
                name: '🎮 Battle Type',
                value: 'Quick Simulation (No rewards)\nUse `/pvp queue` for enhanced turn-based battles!',
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
        
        try {
            const fighter = await PvPSystem.createFighter(targetUser.id);
            const systemStatus = PvPSystem.getSystemStatus();
            const battleStatus = PvPSystem.balanceSystem.getBattleStatus ? 
                PvPSystem.balanceSystem.getBattleStatus(targetUser.id) : null;
            
            if (!fighter) {
                return interaction.reply({
                    content: '❌ This user needs more Devil Fruits to participate in enhanced PvP!',
                    ephemeral: true
                });
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle(`⚔️ ${targetUser.username}'s Enhanced PvP Stats`)
                .addFields([
                    {
                        name: '🏴‍☠️ Enhanced Fighter Info',
                        value: [
                            `**Level**: ${fighter.level}`,
                            `**Balanced CP**: ${fighter.balancedCP.toLocaleString()}`,
                            `**Battle HP**: ${fighter.maxHealth}`,
                            `**Total Fruits**: ${fighter.fruits?.length || 0}`,
                            `**Battle Ready**: ${(fighter.fruits?.length || 0) >= 5 ? '✅ Yes' : '❌ No'}`,
                            `**Strongest Fruit**: ${fighter.strongestFruit?.fruit_name || 'None'}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🎯 Enhanced System Status',
                        value: [
                            `**System**: ${systemStatus.initialized ? '✅ Active' : '❌ Inactive'}`,
                            `**Queue System**: ${systemStatus.components.queueSystem ? '✅ Active' : '❌ Inactive'}`,
                            `**Turn-Based PvP**: ${systemStatus.components.turnBasedPvP ? '✅ Active' : '❌ Inactive'}`,
                            `**In Queue**: ${PvPSystem.queueSystem?.queue.has(targetUser.id) ? '🎯 Yes' : '⭕ No'}`,
                            `**Active Battle**: ${PvPSystem.getUserActiveBattle(targetUser.id) ? '⚔️ Yes' : '⭕ No'}`,
                            `**Total Active Battles**: ${systemStatus.activeBattles}`
                        ].join('\n'),
                        inline: true
                    }
                ])
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            if (battleStatus) {
                embed.addFields([{
                    name: '⚔️ Current Battle Status',
                    value: [
                        `**Status**: ${battleStatus.inBattle ? 'In Battle' : 'Available'}`,
                        `**Battle Phase**: ${battleStatus.status || 'None'}`,
                        `**Current Turn**: ${battleStatus.currentTurn || 0}`,
                        `**My Turn**: ${battleStatus.isMyTurn ? '✅ Yes' : '⭕ No'}`,
                        `**My HP**: ${battleStatus.myHP || 0}/${battleStatus.myMaxHP || 0}`,
                        `**Effects**: ${battleStatus.myEffects?.length || 0} active`
                    ].join('\n'),
                    inline: false
                }]);
            }
            
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in handleStats:', error);
            await interaction.reply({
                content: '❌ An error occurred while loading stats.',
                ephemeral: true
            });
        }
    },

    async handleLeave(interaction) {
        try {
            if (PvPSystem.queueSystem && PvPSystem.queueSystem.queue.has(interaction.user.id)) {
                await PvPSystem.leaveQueue(interaction, interaction.user.id);
            } else {
                await interaction.reply({
                    content: '❌ You are not in the enhanced matchmaking queue.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error in handleLeave:', error);
            await interaction.reply({
                content: '❌ An error occurred while leaving the queue.',
                ephemeral: true
            });
        }
    },

    async handleQueueStatus(interaction) {
        try {
            if (!PvPSystem.queueSystem) {
                return interaction.reply({
                    content: '❌ Enhanced queue system is not available.',
                    ephemeral: true
                });
            }

            const stats = PvPSystem.getQueueStats();
            
            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('🎯 Enhanced Matchmaking Queue Status')
                .addFields([
                    {
                        name: '📊 Queue Statistics',
                        value: [
                            `**Players in Queue**: ${stats.size}/${stats.maxSize}`,
                            `**Average CP**: ${stats.averageCP.toLocaleString()}`,
                            `**CP Range**: ${stats.minCP.toLocaleString()} - ${stats.maxCP.toLocaleString()}`,
                            `**Average Wait Time**: ${stats.averageWaitTime}s`,
                            `**Queue Type**: Enhanced Turn-Based PvP`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '⚔️ Battle Features',
                        value: [
                            `🔥 **Real-time turn-based combat**`,
                            `🎯 **Balanced matchmaking (±30% CP)**`,
                            `⏰ **2-minute search timer**`,
                            `🤖 **NPC boss fallback**`,
                            `📱 **Live fruit selection interface**`,
                            `🏆 **Berry rewards for PvE wins**`
                        ].join('\n'),
                        inline: true
                    }
                ])
                .setFooter({ text: 'Join with /pvp queue for enhanced battles!' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in handleQueueStatus:', error);
            await interaction.reply({
                content: '❌ An error occurred while loading queue status.',
                ephemeral: true
            });
        }
    },

    async handleSystemInfo(interaction) {
        try {
            const systemEmbed = PvPSystem.createSystemInfoEmbed();
            const status = PvPSystem.getSystemStatus();
            
            // Add additional technical details
            systemEmbed.addFields([
                {
                    name: '🔧 Technical Details',
                    value: [
                        `**Node.js**: ${process.version}`,
                        `**Memory Usage**: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                        `**Uptime**: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
                        `**Active Battles**: ${status.activeBattles}`,
                        `**Queue Size**: ${status.queueSize}/20`,
                        `**System Version**: Enhanced v3.0`
                    ].join('\n'),
                    inline: true
                }
            ]);
            
            await interaction.reply({ embeds: [systemEmbed] });

        } catch (error) {
            console.error('Error in handleSystemInfo:', error);
            await interaction.reply({
                content: '❌ An error occurred while loading system information.',
                ephemeral: true
            });
        }
    }
};

// Export for use in interaction handler
module.exports.PvPSystem = PvPSystem;
