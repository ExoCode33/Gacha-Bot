// Enhanced PvP Challenge System - Complete Bot File
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, Collection } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Bot configuration
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const DEBUG_BOT_IDS = ['DEBUG_BOT_ID_1', 'DEBUG_BOT_ID_2']; // Add your debug bot IDs here

client.commands = new Collection();

class EnhancedPvPSystem {
    constructor() {
        this.pendingChallenges = new Map(); // battleId -> challenge data
        this.acceptedPlayers = new Map(); // battleId -> Set of userId
        this.battleTimeout = 60000; // 60 seconds
    }

    async createPvPChallenge(interaction, targetUser, battleType = 'enhanced') {
        const challenger = interaction.user;
        const target = targetUser;
        
        // Generate unique battle ID
        const battleId = `pvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Get player data (you'll need to implement getUserData function)
        const challengerData = await this.getUserData(challenger.id);
        const targetData = await this.getUserData(target.id);
        
        // Store challenge data
        const challengeData = {
            battleId,
            challenger: {
                user: challenger,
                data: challengerData,
                accepted: false
            },
            target: {
                user: target,
                data: targetData,
                accepted: false
            },
            battleType,
            timestamp: Date.now(),
            channel: interaction.channel
        };
        
        this.pendingChallenges.set(battleId, challengeData);
        this.acceptedPlayers.set(battleId, new Set());
        
        // Create individual messages for each player
        await this.sendChallengerMessage(interaction, challengeData);
        await this.sendTargetMessage(interaction, challengeData);
        
        // Auto-accept for debug bot
        if (this.isDebugBot(target)) {
            setTimeout(() => {
                this.autoAcceptDebugBot(battleId, target.id);
            }, 1000);
        }
        
        // Set timeout for challenge expiration
        setTimeout(() => {
            this.expireChallenge(battleId);
        }, this.battleTimeout);
        
        return battleId;
    }

    async sendChallengerMessage(interaction, challengeData) {
        const { challenger, target, battleId } = challengeData;
        
        const embed = new EmbedBuilder()
            .setColor('#FF6B35')
            .setTitle('⚔️ Enhanced Turn-Based PvP Battle Challenge!')
            .setDescription(`${challenger.user.username} has challenged ${target.user.displayName}!`)
            .addFields([
                {
                    name: '🔥 Challenger',
                    value: `**${challenger.user.username}**\nLevel: ${challenger.data.level}\nTotal CP: ${challenger.data.totalCP.toLocaleString()}\nFruits: ${challenger.data.fruits}`,
                    inline: true
                },
                {
                    name: '🎯 Target',
                    value: `**${target.user.displayName}**\nLevel: ${target.data.level}\nTotal CP: ${target.data.totalCP.toLocaleString()}\nFruits: ${target.data.fruits}`,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: '\u200B',
                    inline: true
                },
                {
                    name: '⚔️ Battle System',
                    value: '🎯 Enhanced Turn-Based Combat\n🍎 Choose 5 fruits for battle\n⚡ Turn-based skill combat\n🧠 Strategic depth and timing',
                    inline: false
                },
                {
                    name: '⏰ Time Limit',
                    value: '🚨 60 seconds to accept!',
                    inline: false
                }
            ])
            .setFooter({ text: `Battle ID: ${battleId} • Both players must accept! • ${new Date().toLocaleTimeString()}` })
            .setTimestamp();

        const challengerButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`pvp_accept_${battleId}_${challenger.user.id}`)
                    .setLabel(`${challenger.user.username} Accept`)
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId(`pvp_decline_${battleId}_${challenger.user.id}`)
                    .setLabel(`${challenger.user.username} Decline`)
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        await interaction.followUp({
            embeds: [embed],
            components: [challengerButton],
            ephemeral: false
        });
    }

    async sendTargetMessage(interaction, challengeData) {
        const { challenger, target, battleId } = challengeData;
        
        const embed = new EmbedBuilder()
            .setColor('#4ECDC4')
            .setTitle('⚔️ You\'ve Been Challenged!')
            .setDescription(`${target.user.displayName}, you've been challenged to an enhanced PvP battle!`)
            .addFields([
                {
                    name: '🔥 Challenger',
                    value: `**${challenger.user.username}**\nLevel: ${challenger.data.level}\nTotal CP: ${challenger.data.totalCP.toLocaleString()}\nFruits: ${challenger.data.fruits}`,
                    inline: true
                },
                {
                    name: '🎯 You',
                    value: `**${target.user.displayName}**\nLevel: ${target.data.level}\nTotal CP: ${target.data.totalCP.toLocaleString()}\nFruits: ${target.data.fruits}`,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: '\u200B',
                    inline: true
                },
                {
                    name: '⚔️ Battle System',
                    value: '🎯 Enhanced Turn-Based Combat\n🍎 Choose 5 fruits for battle\n⚡ Turn-based skill combat\n🧠 Strategic depth and timing',
                    inline: false
                }
            ])
            .setFooter({ text: `Battle ID: ${battleId} • Both players must accept!` })
            .setTimestamp();

        const targetButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`pvp_accept_${battleId}_${target.user.id}`)
                    .setLabel(`${target.user.displayName} Accept`)
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId(`pvp_decline_${battleId}_${target.user.id}`)
                    .setLabel(`${target.user.displayName} Decline`)
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        await interaction.followUp({
            content: `<@${target.user.id}>`,
            embeds: [embed],
            components: [targetButton],
            ephemeral: false
        });
    }

    async handleButtonInteraction(interaction) {
        const [action, type, battleId, userId] = interaction.customId.split('_');
        
        if (action !== 'pvp' || !['accept', 'decline'].includes(type)) return;
        
        const challengeData = this.pendingChallenges.get(battleId);
        if (!challengeData) {
            return await interaction.reply({
                content: '❌ This challenge has expired or no longer exists.',
                ephemeral: true
            });
        }

        // Check if user is part of this challenge
        const isChallenger = challengeData.challenger.user.id === userId;
        const isTarget = challengeData.target.user.id === userId;
        
        if (!isChallenger && !isTarget) {
            return await interaction.reply({
                content: '❌ You are not part of this challenge.',
                ephemeral: true
            });
        }

        if (type === 'decline') {
            await this.declineChallenge(interaction, battleId, userId);
        } else if (type === 'accept') {
            await this.acceptChallenge(interaction, battleId, userId);
        }
    }

    async acceptChallenge(interaction, battleId, userId) {
        const challengeData = this.pendingChallenges.get(battleId);
        const acceptedSet = this.acceptedPlayers.get(battleId);
        
        if (acceptedSet.has(userId)) {
            return await interaction.reply({
                content: '✅ You have already accepted this challenge!',
                ephemeral: true
            });
        }

        acceptedSet.add(userId);
        
        // Update challenge data
        if (challengeData.challenger.user.id === userId) {
            challengeData.challenger.accepted = true;
        } else if (challengeData.target.user.id === userId) {
            challengeData.target.accepted = true;
        }

        await interaction.reply({
            content: '✅ Challenge accepted! Waiting for the other player...',
            ephemeral: true
        });

        // Check if both players accepted
        if (acceptedSet.size === 2) {
            await this.startBattle(challengeData);
        }
    }

    async declineChallenge(interaction, battleId, userId) {
        const challengeData = this.pendingChallenges.get(battleId);
        
        await interaction.reply({
            content: '❌ Challenge declined.',
            ephemeral: true
        });

        // Send decline notification to channel
        const declineEmbed = new EmbedBuilder()
            .setColor('#FF4757')
            .setTitle('❌ Challenge Declined')
            .setDescription(`The PvP challenge has been declined by ${interaction.user.displayName}.`)
            .setTimestamp();

        await challengeData.channel.send({ embeds: [declineEmbed] });
        
        // Clean up
        this.pendingChallenges.delete(battleId);
        this.acceptedPlayers.delete(battleId);
    }

    async autoAcceptDebugBot(battleId, debugBotId) {
        const challengeData = this.pendingChallenges.get(battleId);
        if (!challengeData) return;

        const acceptedSet = this.acceptedPlayers.get(battleId);
        if (acceptedSet.has(debugBotId)) return;

        acceptedSet.add(debugBotId);
        
        // Update challenge data
        if (challengeData.target.user.id === debugBotId) {
            challengeData.target.accepted = true;
        }

        // Send auto-accept message
        const autoAcceptEmbed = new EmbedBuilder()
            .setColor('#00D2D3')
            .setTitle('🤖 Debug Bot Auto-Accept')
            .setDescription(`Debug bot has automatically accepted the challenge!`)
            .setTimestamp();

        await challengeData.channel.send({ embeds: [autoAcceptEmbed] });

        // Check if both players accepted
        if (acceptedSet.size === 2) {
            await this.startBattle(challengeData);
        }
    }

    async startBattle(challengeData) {
        const { battleId, challenger, target, channel } = challengeData;
        
        // Send battle start confirmation
        const startEmbed = new EmbedBuilder()
            .setColor('#FFD93D')
            .setTitle('🔥 Battle Starting!')
            .setDescription(`Both players have accepted! The enhanced PvP battle is about to begin!`)
            .addFields([
                {
                    name: '⚔️ Combatants',
                    value: `${challenger.user.username} vs ${target.user.displayName}`,
                    inline: false
                },
                {
                    name: '🎯 Battle Type',
                    value: 'Enhanced Turn-Based Combat',
                    inline: true
                },
                {
                    name: '🍎 Fruit Selection',
                    value: 'Choose your 5 battle fruits!',
                    inline: true
                }
            ])
            .setTimestamp();

        await channel.send({ embeds: [startEmbed] });
        
        // Clean up challenge data
        this.pendingChallenges.delete(battleId);
        this.acceptedPlayers.delete(battleId);
        
        // Initialize the actual battle system
        await this.initializeBattle(challenger, target, channel, battleId);
    }

    async expireChallenge(battleId) {
        const challengeData = this.pendingChallenges.get(battleId);
        if (!challengeData) return;

        const acceptedSet = this.acceptedPlayers.get(battleId);
        if (acceptedSet.size < 2) {
            const expireEmbed = new EmbedBuilder()
                .setColor('#95A5A6')
                .setTitle('⏰ Challenge Expired')
                .setDescription('The PvP challenge has expired due to timeout.')
                .setTimestamp();

            await challengeData.channel.send({ embeds: [expireEmbed] });
            
            // Clean up
            this.pendingChallenges.delete(battleId);
            this.acceptedPlayers.delete(battleId);
        }
    }

    async initializeBattle(challenger, target, channel, battleId) {
        // This is where you would initialize your actual battle system
        // For now, sending a placeholder message
        const battleEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('⚔️ Battle System Initialized')
            .setDescription(`Battle ${battleId} has started between ${challenger.user.username} and ${target.user.displayName}!`)
            .addFields([
                {
                    name: '📝 Next Steps',
                    value: '• Select your battle fruits\n• Prepare your strategy\n• Battle begins in 10 seconds!',
                    inline: false
                }
            ])
            .setTimestamp();

        await channel.send({ embeds: [battleEmbed] });
        
        // Here you would call your existing battle initialization code
        // Example: await this.battleManager.startEnhancedBattle(challenger, target, channel, battleId);
    }

    isDebugBot(user) {
        return user.username.toLowerCase().includes('debug') || 
               user.username.toLowerCase().includes('bot') ||
               DEBUG_BOT_IDS.includes(user.id) ||
               user.bot === true;
    }

    async getUserData(userId) {
    async getUserData(userId) {
        // Replace this with your actual database/user data retrieval system
        // This is a placeholder that returns mock data
        try {
            // Example: const userData = await database.getUser(userId);
            return {
                level: Math.floor(Math.random() * 50) + 1,
                totalCP: Math.floor(Math.random() * 10000) + 1000,
                fruits: Math.floor(Math.random() * 100) + 10,
                wins: Math.floor(Math.random() * 20),
                losses: Math.floor(Math.random() * 15)
            };
        } catch (error) {
            console.error(`Error fetching user data for ${userId}:`, error);
            return {
                level: 1,
                totalCP: 1000,
                fruits: 10,
                wins: 0,
                losses: 0
            };
        }
    }
}

// Initialize PvP System
const pvpSystem = new EnhancedPvPSystem();

// Slash Commands Setup
const commands = [
    new SlashCommandBuilder()
        .setName('debug-queue')
        .setDescription('Challenge another player to an enhanced PvP battle')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The player you want to challenge')
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('pvp-challenge')
        .setDescription('Challenge another player to PvP')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The player you want to challenge')
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('pvp-stats')
        .setDescription('View PvP statistics')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view stats for (defaults to yourself)')
                .setRequired(false)
        )
];

// Command Handlers
async function handleDebugQueueCommand(interaction) {
    const targetUser = interaction.options.getUser('target');
    
    if (targetUser.id === interaction.user.id) {
        return await interaction.reply({
            content: '❌ You cannot challenge yourself!',
            ephemeral: true
        });
    }

    await interaction.deferReply();
    
    try {
        const battleId = await pvpSystem.createPvPChallenge(interaction, targetUser, 'enhanced');
        console.log(`Created enhanced PvP challenge: ${battleId}`);
    } catch (error) {
        console.error('Error creating PvP challenge:', error);
        await interaction.followUp({
            content: '❌ An error occurred while creating the challenge. Please try again.',
            ephemeral: true
        });
    }
}

async function handlePvPChallengeCommand(interaction) {
    const targetUser = interaction.options.getUser('target');
    
    if (targetUser.id === interaction.user.id) {
        return await interaction.reply({
            content: '❌ You cannot challenge yourself!',
            ephemeral: true
        });
    }

    await interaction.deferReply();
    
    try {
        const battleId = await pvpSystem.createPvPChallenge(interaction, targetUser, 'standard');
        console.log(`Created PvP challenge: ${battleId}`);
    } catch (error) {
        console.error('Error creating PvP challenge:', error);
        await interaction.followUp({
            content: '❌ An error occurred while creating the challenge. Please try again.',
            ephemeral: true
        });
    }
}

async function handlePvPStatsCommand(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    try {
        const userData = await pvpSystem.getUserData(targetUser.id);
        
        const statsEmbed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle(`📊 PvP Stats for ${targetUser.displayName}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields([
                {
                    name: '👤 Player Info',
                    value: `Level: ${userData.level}\nTotal CP: ${userData.totalCP.toLocaleString()}\nFruits: ${userData.fruits}`,
                    inline: true
                },
                {
                    name: '⚔️ Battle Record',
                    value: `Wins: ${userData.wins}\nLosses: ${userData.losses}\nRatio: ${userData.losses > 0 ? (userData.wins / userData.losses).toFixed(2) : userData.wins}`,
                    inline: true
                },
                {
                    name: '🏆 Rank',
                    value: `${userData.wins > 50 ? 'Master' : userData.wins > 25 ? 'Expert' : userData.wins > 10 ? 'Advanced' : 'Beginner'}`,
                    inline: true
                }
            ])
            .setTimestamp();

        await interaction.reply({ embeds: [statsEmbed] });
    } catch (error) {
        console.error('Error fetching PvP stats:', error);
        await interaction.reply({
            content: '❌ An error occurred while fetching stats.',
            ephemeral: true
        });
    }
}

// Button Interaction Handler
async function handleButtonInteraction(interaction) {
    if (interaction.customId.startsWith('pvp_')) {
        try {
            await pvpSystem.handleButtonInteraction(interaction);
        } catch (error) {
            console.error('Error handling button interaction:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred while processing your action.',
                    ephemeral: true
                });
            }
        }
    }
}

// Bot Event Handlers
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} is online and ready!`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds with ${client.users.cache.size} users`);
    
    // Register slash commands
    try {
        console.log('🔄 Started refreshing application (/) commands.');
        await client.application.commands.set(commands);
        console.log('✅ Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('❌ Error registering slash commands:', error);
    }
    
    // Set bot status
    client.user.setActivity('Enhanced PvP Battles', { type: 'WATCHING' });
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            const { commandName } = interaction;
            
            switch (commandName) {
                case 'debug-queue':
                    await handleDebugQueueCommand(interaction);
                    break;
                case 'pvp-challenge':
                    await handlePvPChallengeCommand(interaction);
                    break;
                case 'pvp-stats':
                    await handlePvPStatsCommand(interaction);
                    break;
                default:
                    await interaction.reply({
                        content: '❌ Unknown command.',
                        ephemeral: true
                    });
            }
        } else if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        
        const errorMessage = {
            content: '❌ An error occurred while processing your request.',
            ephemeral: true
        };
        
        try {
            if (interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else if (!interaction.replied) {
                await interaction.reply(errorMessage);
            }
        } catch (e) {
            console.error('Error sending error message:', e);
        }
    }
});

client.on('error', error => {
    console.error('Discord client error:', error);
});

client.on('warn', warning => {
    console.warn('Discord client warning:', warning);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🔄 Shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

// Login to Discord
if (BOT_TOKEN && BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE') {
    client.login(BOT_TOKEN).catch(error => {
        console.error('❌ Failed to login to Discord:', error);
        process.exit(1);
    });
} else {
    console.error('❌ Please set your bot token in the BOT_TOKEN variable');
    process.exit(1);
}
