// src/commands/enhanced-pvp.js - FIXED VERSION with Personal Accept/Decline Messages
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

// Store active match invitations
const activeMatchInvitations = new Map();

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

    // Create match invitation with personal accept/decline
    await createPersonalMatchInvitation(interaction, opponent);
}

async function createPersonalMatchInvitation(interaction, targetUser) {
    try {
        const challenger = interaction.user;
        
        // Generate unique invitation ID
        const invitationId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store invitation data
        activeMatchInvitations.set(invitationId, {
            challenger: {
                id: challenger.id,
                username: challenger.username,
                user: challenger
            },
            target: {
                id: targetUser.id,
                username: targetUser.username,
                user: targetUser
            },
            createdAt: Date.now(),
            channelId: interaction.channel.id,
            guildId: interaction.guild?.id
        });

        // Create public announcement (NO BUTTONS - just information)
        const publicEmbed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('⚔️ Enhanced PvP Challenge Sent!')
            .setDescription(`**${challenger.username}** has challenged **${targetUser.username}** to an enhanced turn-based battle!`)
            .addFields([
                { 
                    name: `🏴‍☠️ Challenger`, 
                    value: `${challenger.username}`, 
                    inline: true 
                },
                { 
                    name: '⚔️ VS ⚔️', 
                    value: 'CHALLENGE', 
                    inline: true 
                },
                { 
                    name: `🎯 Target`, 
                    value: `${targetUser.username}`, 
                    inline: true 
                },
                {
                    name: '🔒 Private Messages Sent',
                    value: 'Both players have been sent **private messages** to accept or decline this challenge.',
                    inline: false
                },
                {
                    name: '⏰ Time Limit',
                    value: '60 seconds to respond',
                    inline: false
                }
            ])
            .setFooter({ text: `Challenge ID: ${invitationId}` })
            .setTimestamp();

        // Send public announcement
        await interaction.reply({ embeds: [publicEmbed] });

        // Send PRIVATE messages to both players
        await sendPrivateChallengeMessage(challenger, targetUser, invitationId, interaction.client, 'challenger');
        await sendPrivateChallengeMessage(targetUser, challenger, invitationId, interaction.client, 'target');

        // Set timeout to auto-expire after 60 seconds
        setTimeout(() => {
            if (activeMatchInvitations.has(invitationId)) {
                const invitationData = activeMatchInvitations.get(invitationId);
                activeMatchInvitations.delete(invitationId);
                sendChallengeTimeoutMessage(interaction, invitationData);
            }
        }, 60000);

    } catch (error) {
        console.error('Error creating personal match invitation:', error);
    }
}

async function sendPrivateChallengeMessage(player, opponent, invitationId, client, playerRole) {
    try {
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle(playerRole === 'challenger' ? '⚔️ Challenge Sent!' : '⚔️ Challenge Received!')
            .setDescription(
                playerRole === 'challenger' 
                    ? `You have challenged **${opponent.username}** to an enhanced turn-based PvP battle!`
                    : `**${opponent.username}** has challenged you to an enhanced turn-based PvP battle!`
            )
            .addFields([
                { name: '🎯 Opponent', value: opponent.username, inline: true },
                { name: '⏰ Time Limit', value: '60 seconds to respond', inline: true },
                { name: '🔥 Battle Type', value: 'Enhanced Turn-Based PvP', inline: true },
                { name: '🎮 What Happens Next?', value: 'If both players accept, you\'ll enter fruit selection phase, then strategic turn-based combat!', inline: false }
            ])
            .setFooter({ text: `Challenge ID: ${invitationId}` })
            .setTimestamp();

        let buttons;
        if (playerRole === 'target') {
            // Only the target gets accept/decline buttons
            buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`pvp_challenge_accept_${invitationId}_${player.id}`)
                        .setLabel('✅ Accept Challenge')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`pvp_challenge_decline_${invitationId}_${player.id}`)
                        .setLabel('❌ Decline')
                        .setStyle(ButtonStyle.Danger)
                );
        } else {
            // Challenger gets a status button (disabled)
            buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('waiting_response')
                        .setLabel('⏳ Waiting for Response...')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );
        }

        await player.send({
            embeds: [embed],
            components: [buttons]
        });

        console.log(`✅ Private challenge message sent to ${player.username} (${playerRole})`);

    } catch (error) {
        console.error(`❌ Error sending private challenge message to ${player.username}:`, error);
        
        // If DM fails, try to notify in the original channel
        try {
            const channel = client.channels.cache.get(interaction.channelId);
            if (channel) {
                await channel.send(`⚠️ Could not send DM to ${player.username}. Please make sure your DMs are open.`);
            }
        } catch (channelError) {
            console.error('Could not send fallback message:', channelError);
        }
    }
}

async function sendChallengeTimeoutMessage(interaction, invitationData) {
    try {
        const timeoutEmbed = new EmbedBuilder()
            .setColor(0xFF8000)
            .setTitle('⏰ Challenge Expired')
            .setDescription(`The challenge from **${invitationData.challenger.username}** to **${invitationData.target.username}** has expired due to no response within 60 seconds.`)
            .addFields([
                { name: '🔄 What Now?', value: 'The challenger can send a new challenge using `/pvp challenge`', inline: false }
            ])
            .setTimestamp();

        await interaction.followUp({ embeds: [timeoutEmbed] });
        console.log(`⏰ Challenge ${invitationData.challenger.username} vs ${invitationData.target.username} expired`);
    } catch (error) {
        console.error('Error sending challenge timeout message:', error);
    }
}

// Button interaction handler for challenge accept/decline
async function handleChallengeButtons(interaction) {
    const customId = interaction.customId;
    
    console.log(`🔘 Challenge button interaction: ${customId} from ${interaction.user.username}`);
    
    if (customId.startsWith('pvp_challenge_accept_') || customId.startsWith('pvp_challenge_decline_')) {
        const parts = customId.split('_');
        const action = parts[2]; // accept or decline
        const invitationId = parts[3];
        const userId = parts[4];

        // Verify this is the correct user
        if (userId !== interaction.user.id) {
            return await interaction.reply({
                content: '❌ This button is not for you!',
                ephemeral: true
            });
        }

        const invitationData = activeMatchInvitations.get(invitationId);
        if (!invitationData) {
            return await interaction.reply({
                content: '❌ This challenge has expired or is no longer valid.',
                ephemeral: true
            });
        }

        if (action === 'decline') {
            // Handle decline
            activeMatchInvitations.delete(invitationId);
            
            await interaction.update({
                content: '❌ You declined the challenge.',
                embeds: [],
                components: []
            });

            // Notify the channel
            try {
                const channel = interaction.client.channels.cache.get(invitationData.channelId);
                if (channel) {
                    const declineEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Challenge Declined')
                        .setDescription(`**${interaction.user.username}** declined the challenge from **${invitationData.challenger.username}**.`)
                        .setTimestamp();

                    await channel.send({ embeds: [declineEmbed] });
                }
            } catch (error) {
                console.error('Error sending decline notification:', error);
            }

            console.log(`❌ ${interaction.user.username} declined challenge ${invitationId}`);

        } else if (action === 'accept') {
            // Handle accept
            activeMatchInvitations.delete(invitationId);
            
            await interaction.update({
                content: '✅ You accepted the challenge! Starting enhanced turn-based battle...',
                embeds: [],
                components: []
            });

            console.log(`✅ ${interaction.user.username} accepted challenge ${invitationId}. Starting battle...`);
            
            // Start the enhanced turn-based battle
            await startEnhancedBattleFromChallenge(interaction, invitationData);
        }
    }
}

async function startEnhancedBattleFromChallenge(interaction, invitationData) {
    try {
        const { challenger, target } = invitationData;
        
        console.log(`⚔️ Starting enhanced battle: ${challenger.username} vs ${target.username}`);
        
        // Find the channel to send the battle start message
        const channel = interaction.client.channels.cache.get(invitationData.channelId);
        if (!channel) {
            console.error('Could not find channel for battle');
            return;
        }

        const battleEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('⚔️ Enhanced Turn-Based Battle Starting!')
            .setDescription(`**${challenger.username}** vs **${target.username}**\n\n🔥 Challenge accepted! Enhanced Turn-Based Combat is beginning!`)
            .addFields([
                { 
                    name: `🏴‍☠️ ${challenger.username}`, 
                    value: `✅ Ready for battle`, 
                    inline: true 
                },
                { 
                    name: '⚔️ BATTLE ⚔️', 
                    value: '🔥\n**STARTING**\n🔥', 
                    inline: true 
                },
                { 
                    name: `🏴‍☠️ ${target.username}`, 
                    value: `✅ Ready for battle`, 
                    inline: true 
                }
            ])
            .setFooter({ text: 'Enhanced Turn-Based PvP System • Good luck!' })
            .setTimestamp();

        await channel.send({ embeds: [battleEmbed] });

        // Start the enhanced PvP battle using the existing system
        // Create a mock interaction for the battle system
        const mockInteraction = {
            user: challenger.user,
            channel: channel,
            guild: interaction.guild,
            channelId: channel.id,
            replied: false,
            deferred: false,
            reply: async (data) => {
                mockInteraction.replied = true;
                return await channel.send(data);
            },
            followUp: async (data) => await channel.send(data),
            editReply: async (data) => await channel.send(data),
            update: async (data) => await channel.send(data)
        };
        
        // Use the existing enhanced turn-based PvP system
        await EnhancedTurnBasedPvP.initiateBattle(mockInteraction, target.user);
        
        console.log(`✅ Enhanced PvP battle started successfully`);

    } catch (error) {
        console.error('Error starting enhanced PvP battle from challenge:', error);
    }
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
                    '2️⃣ Both players receive private accept/decline messages',
                    '3️⃣ Turn-based combat begins with fruit selection',
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

// Export the challenge button handler for use in main interaction handler
module.exports.handleChallengeButtons = handleChallengeButtons;
