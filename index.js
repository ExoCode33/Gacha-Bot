// index.js - Complete main bot file
const { Client, GatewayIntentBits, Events, Collection, MessageFlags } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

console.log('🔍 Starting bot initialization...');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

// Initialize commands collection
client.commands = new Collection();

// Initialize PvP system
let EnhancedTurnBasedPvP;
let pvpSystem;

try {
    console.log('🔄 Attempting to load PvP system...');
    EnhancedTurnBasedPvP = require('./src/systems/pvp/enhanced-turn-based-pvp');
    pvpSystem = new EnhancedTurnBasedPvP();
    console.log('✅ PvP system created successfully');
    console.log('📊 PvP system type:', typeof pvpSystem);
    console.log('🔧 PvP methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(pvpSystem)));
} catch (error) {
    console.error('❌ PvP system initialization failed:', error.message);
    console.error('📍 Stack trace:', error.stack);
    pvpSystem = null;
}

// Load database manager
let DatabaseManager;
try {
    DatabaseManager = require('./src/database/manager');
    console.log('✅ Database manager loaded');
} catch (error) {
    console.error('❌ Failed to load database manager:', error);
}

// PvP Queue System
const pvpQueue = {
    players: new Map(), // userId -> { user, timestamp, guildId }
    
    addToQueue(user, guildId) {
        this.players.set(user.id, {
            user: user,
            timestamp: Date.now(),
            guildId: guildId
        });
        console.log(`📝 Added ${user.username} to PvP queue`);
    },
    
    removeFromQueue(userId) {
        const removed = this.players.delete(userId);
        console.log(`🗑️ Removed user ${userId} from queue: ${removed}`);
        return removed;
    },
    
    isInQueue(userId) {
        return this.players.has(userId);
    },
    
    getQueueSize() {
        return this.players.size;
    },
    
    getQueueList() {
        return Array.from(this.players.values());
    },
    
    findMatch(excludeUserId) {
        // Find another player in queue (excluding the current user)
        for (const [userId, playerData] of this.players.entries()) {
            if (userId !== excludeUserId) {
                return playerData;
            }
        }
        return null;
    },
    
    clearExpiredEntries() {
        const now = Date.now();
        const QUEUE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
        
        for (const [userId, playerData] of this.players.entries()) {
            if (now - playerData.timestamp > QUEUE_TIMEOUT) {
                this.players.delete(userId);
                console.log(`⏰ Removed expired queue entry for user ${userId}`);
            }
        }
    }
};

// Clean queue every 5 minutes
setInterval(() => {
    pvpQueue.clearExpiredEntries();
}, 5 * 60 * 1000);

// Load command files (if you have a commands directory)
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`✅ Loaded command: ${command.data.name}`);
            } else {
                console.log(`⚠️ Command at ${filePath} is missing required "data" or "execute" property.`);
            }
        } catch (error) {
            console.error(`❌ Error loading command ${file}:`, error);
        }
    }
}

// Bot ready event
client.once(Events.Ready, async () => {
    console.log(`🤖 Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`🎮 PvP System Status: ${pvpSystem ? 'Available' : 'Not Available'}`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
    console.log(`👥 Serving ${client.users.cache.size} users`);
    
    // Test database connection if available
    if (DatabaseManager) {
        try {
            console.log('📦 Database connection ready');
        } catch (error) {
            console.error('❌ Database connection test failed:', error);
        }
    }
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
    // Handle chat input commands (slash commands)
    if (interaction.isChatInputCommand()) {
        console.log(`📝 Slash command received: /${interaction.commandName} from ${interaction.user.username} in ${interaction.guild?.name || 'DM'}`);
        
        try {
            const { commandName } = interaction;

            switch (commandName) {
                case 'pvp':
                    const subcommand = interaction.options.getSubcommand(false);
                    console.log(`🎯 PvP command with subcommand: ${subcommand || 'challenge'}`);
                    
                    if (!pvpSystem) {
                        console.error('❌ PvP system not initialized');
                        return await interaction.reply({
                            content: '❌ PvP system is not available. Please contact an administrator.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    if (subcommand === 'queue') {
                        // Handle PvP queue
                        console.log(`📋 PvP queue command from ${interaction.user.username}`);
                        
                        if (pvpQueue.isInQueue(interaction.user.id)) {
                            // Remove from queue
                            pvpQueue.removeFromQueue(interaction.user.id);
                            await interaction.reply({
                                content: '❌ **Left PvP Queue**\nYou have been removed from the PvP queue.',
                                flags: MessageFlags.Ephemeral
                            });
                        } else {
                            // Add to queue and try to find match
                            pvpQueue.addToQueue(interaction.user, interaction.guild.id);
                            
                            // Look for a match
                            const opponent = pvpQueue.findMatch(interaction.user.id);
                            
                            if (opponent) {
                                // Found a match! Remove both from queue and start battle
                                pvpQueue.removeFromQueue(interaction.user.id);
                                pvpQueue.removeFromQueue(opponent.user.id);
                                
                                console.log(`⚔️ Queue match found: ${interaction.user.username} vs ${opponent.user.username}`);
                                
                                await interaction.reply({
                                    content: `🎯 **Match Found!**\n${interaction.user.username} vs ${opponent.user.username}\nStarting battle...`
                                });
                                
                                // Start the battle automatically
                                try {
                                    await pvpSystem.initiateBattle(interaction, opponent.user);
                                } catch (battleError) {
                                    console.error('❌ Error starting queued battle:', battleError);
                                    await interaction.followUp({
                                        content: '❌ Error starting the battle. Please try again.',
                                        flags: MessageFlags.Ephemeral
                                    });
                                }
                            } else {
                                // No match found, waiting in queue
                                await interaction.reply({
                                    content: `🔄 **Joined PvP Queue**\nWaiting for an opponent...\n\n` +
                                           `👥 **Queue Status:** ${pvpQueue.getQueueSize()} player(s) waiting\n` +
                                           `⏱️ You will be automatically matched when another player joins.\n` +
                                           `💡 Use \`/pvp queue\` again to leave the queue.`,
                                    flags: MessageFlags.Ephemeral
                                });
                            }
                        }
                    } else if (subcommand === 'quick') {
                        // Handle quick match (same as queue but with different messaging)
                        console.log(`⚡ Quick match command from ${interaction.user.username}`);
                        
                        if (pvpQueue.isInQueue(interaction.user.id)) {
                            await interaction.reply({
                                content: '⚠️ **Already in Queue**\nYou are already waiting for a match. Use `/pvp queue` to leave the queue first.',
                                flags: MessageFlags.Ephemeral
                            });
                        } else {
                            // Add to queue and try to find match immediately
                            pvpQueue.addToQueue(interaction.user, interaction.guild.id);
                            
                            const opponent = pvpQueue.findMatch(interaction.user.id);
                            
                            if (opponent) {
                                // Found a match! Remove both from queue and start battle
                                pvpQueue.removeFromQueue(interaction.user.id);
                                pvpQueue.removeFromQueue(opponent.user.id);
                                
                                console.log(`⚡ Quick match found: ${interaction.user.username} vs ${opponent.user.username}`);
                                
                                await interaction.reply({
                                    content: `⚡ **Quick Match Found!**\n${interaction.user.username} vs ${opponent.user.username}\nStarting battle now...`
                                });
                                
                                try {
                                    await pvpSystem.initiateBattle(interaction, opponent.user);
                                } catch (battleError) {
                                    console.error('❌ Error starting quick battle:', battleError);
                                    await interaction.followUp({
                                        content: '❌ Error starting the battle. Please try again.',
                                        flags: MessageFlags.Ephemeral
                                    });
                                }
                            } else {
                                // No match found, added to queue
                                await interaction.reply({
                                    content: `⚡ **Quick Match Search**\nNo opponents available right now. Added you to the queue.\n\n` +
                                           `👥 **Queue Status:** ${pvpQueue.getQueueSize()} player(s) waiting\n` +
                                           `🔥 You'll be matched instantly when someone else joins!`,
                                    flags: MessageFlags.Ephemeral
                                });
                            }
                        }
                    } else if (subcommand === 'queue-status') {
                        // Handle queue status
                        const queueList = pvpQueue.getQueueList();
                        const queueSize = pvpQueue.getQueueSize();
                        
                        if (queueSize === 0) {
                            await interaction.reply({
                                content: '📋 **PvP Queue is Empty**\nNo players are currently waiting for matches.\nUse `/pvp queue` or `/pvp quick` to join!',
                                flags: MessageFlags.Ephemeral
                            });
                        } else {
                            const queueNames = queueList.map(p => p.user.username).join(', ');
                            const userInQueue = pvpQueue.isInQueue(interaction.user.id);
                            
                            await interaction.reply({
                                content: `📋 **PvP Queue Status**\n` +
                                       `👥 **${queueSize}** player(s) waiting\n` +
                                       `🎮 **Players:** ${queueNames}\n` +
                                       `${userInQueue ? '✅ **You are in the queue**' : '❌ **You are not in the queue**'}\n\n` +
                                       `💡 Use \`/pvp queue\` or \`/pvp quick\` to join!`,
                                flags: MessageFlags.Ephemeral
                            });
                        }
                    } else if (subcommand === 'challenge') {
                        // Handle direct challenge (original PvP command)
                        const targetUser = interaction.options.getUser('user');
                        console.log('🎯 Direct PvP challenge - Target user:', targetUser?.username || 'undefined');

                        if (!targetUser) {
                            return await interaction.reply({
                                content: '❌ Please specify a valid user to challenge, or use `/pvp queue` to join the matchmaking queue.',
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        if (targetUser.bot) {
                            return await interaction.reply({
                                content: '❌ You cannot challenge a bot to battle.',
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        if (targetUser.id === interaction.user.id) {
                            return await interaction.reply({
                                content: '❌ You cannot challenge yourself to a battle. Use `/pvp queue` to find other players!',
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        console.log('⚔️ Calling pvpSystem.initiateBattle...');
                        await pvpSystem.initiateBattle(interaction, targetUser);
                        console.log('✅ PvP battle initiated successfully');
                    } else {
                        // Default to challenge if no subcommand (backwards compatibility)
                        const targetUser = interaction.options.getUser('user');
                        
                        if (!targetUser) {
                            return await interaction.reply({
                                content: '❌ **Unknown PvP Command**\n\nAvailable options:\n' +
                                       '• `/pvp challenge @user` - Challenge specific user\n' +
                                       '• `/pvp queue` - Join matchmaking queue\n' +
                                       '• `/pvp quick` - Quick match search\n' +
                                       '• `/pvp queue-status` - Check queue status',
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        console.log('⚔️ Default challenge mode');
                        await pvpSystem.initiateBattle(interaction, targetUser);
                    }
                    break;

                case 'balance':
                    try {
                        if (!DatabaseManager) {
                            return await interaction.reply({
                                content: '❌ Database system not available.',
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        const userData = await DatabaseManager.getUser(interaction.user.id);
                        if (!userData) {
                            return await interaction.reply({
                                content: '❌ You are not registered. Use a command to register first!',
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        await interaction.reply({
                            content: `💰 **${interaction.user.username}'s Balance**\n` +
                                   `🪙 Coins: ${userData.coins || 0}\n` +
                                   `🍃 Devil Fruit: ${userData.devil_fruit || 'None'}\n` +
                                   `⭐ Rarity: ${userData.devil_fruit_rarity || 'None'}\n` +
                                   `⚔️ PvP Wins: ${userData.pvp_wins || 0}\n` +
                                   `💀 PvP Losses: ${userData.pvp_losses || 0}`,
                            flags: MessageFlags.Ephemeral
                        });
                    } catch (error) {
                        console.error('Error in balance command:', error);
                        await interaction.reply({
                            content: '❌ Error retrieving balance information.',
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    break;

                case 'queue':
                    // Show current PvP queue status
                    const queueList = pvpQueue.getQueueList();
                    const queueSize = pvpQueue.getQueueSize();
                    
                    if (queueSize === 0) {
                        await interaction.reply({
                            content: '📋 **PvP Queue is Empty**\nNo players are currently waiting for matches.\nUse `/pvp queue` to join!',
                            flags: MessageFlags.Ephemeral
                        });
                    } else {
                        const queueNames = queueList.map(p => p.user.username).join(', ');
                        await interaction.reply({
                            content: `📋 **PvP Queue Status**\n` +
                                   `👥 **${queueSize}** player(s) waiting\n` +
                                   `🎮 **Players:** ${queueNames}\n\n` +
                                   `💡 Use \`/pvp queue\` to join the queue!`,
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    break;

                case 'income':
                    await interaction.reply({
                        content: '💰 **Income System**\n' +
                               '📊 **Daily Sources:**\n' +
                               '• Daily Rewards: 100-500 coins\n' +
                               '• PvP Victories: 50-200 coins\n' +
                               '• Gacha Pulls: Devil Fruits & Items\n\n' +
                               '🔜 More income sources coming soon!',
                        flags: MessageFlags.Ephemeral
                    });
                    break;

                case 'inventory':
                    await interaction.reply({
                        content: '🎒 **Inventory System**\nInventory feature coming soon!',
                        flags: MessageFlags.Ephemeral
                    });
                    break;

                case 'daily':
                    await interaction.reply({
                        content: '📅 **Daily Rewards**\nDaily rewards feature coming soon!',
                        flags: MessageFlags.Ephemeral
                    });
                    break;

                case 'pull':
                case 'gacha':
                    await interaction.reply({
                        content: '🎰 **Gacha System**\nGacha feature coming soon!',
                        flags: MessageFlags.Ephemeral
                    });
                    break;

                case 'leaderboard':
                    const leaderboardType = interaction.options.getString('type') || 'all';
                    await interaction.reply({
                        content: `🏆 **${leaderboardType.toUpperCase()} Leaderboard**\n` +
                               `📊 **Top Players:**\n` +
                               `1. Player1 - 1000 points\n` +
                               `2. Player2 - 850 points\n` +
                               `3. Player3 - 720 points\n\n` +
                               `🔜 Full leaderboard system coming soon!`,
                        flags: MessageFlags.Ephemeral
                    });
                    break;

                case 'profile':
                    const targetUser = interaction.options.getUser('user') || interaction.user;
                    await interaction.reply({
                        content: `👤 **${targetUser.username}'s Profile**\n` +
                               `🆔 User ID: ${targetUser.id}\n` +
                               `📅 Joined Discord: ${targetUser.createdAt.toDateString()}\n` +
                               `🏆 Level: 1\n` +
                               `⭐ Rank: Beginner\n\n` +
                               `🔜 Full profile system coming soon!`,
                        flags: MessageFlags.Ephemeral
                    });
                    break;

                case 'shop':
                    await interaction.reply({
                        content: '🛒 **Shop System**\n' +
                               '💰 **Available Items:**\n' +
                               '• Devil Fruit Upgrade - 1000 coins\n' +
                               '• Energy Boost - 500 coins\n' +
                               '• XP Multiplier - 750 coins\n\n' +
                               '🔜 Full shop system coming soon!',
                        flags: MessageFlags.Ephemeral
                    });
                    break;

                case 'work':
                    await interaction.reply({
                        content: '💼 **Work System**\n' +
                               '⏰ You worked hard and earned 50 coins!\n' +
                               '🕐 Next work available in 1 hour.\n\n' +
                               '🔜 Full work system coming soon!',
                        flags: MessageFlags.Ephemeral
                    });
                    break;

                case 'claim':
                    await interaction.reply({
                        content: '🎁 **Claim System**\n' +
                               '✅ Daily reward claimed: 100 coins!\n' +
                               '⏰ Next claim available in 24 hours.\n\n' +
                               '🔜 More claimable rewards coming soon!',
                        flags: MessageFlags.Ephemeral
                    });
                    break;

                case 'help':
                    await interaction.reply({
                        content: '📖 **Gacha Bot Commands**\n' +
                               '**🎮 PvP Commands:**\n' +
                               '`/pvp challenge @user` - Challenge a specific user\n' +
                               '`/pvp queue` - Join matchmaking queue\n' +
                               '`/pvp quick` - Quick match search\n' +
                               '`/pvp queue-status` - Check queue status\n' +
                               '`/queue` - Check PvP queue status\n\n' +
                               '**💰 Economy Commands:**\n' +
                               '`/balance` - Check your balance\n' +
                               '`/income` - Check income sources\n' +
                               '`/work` - Work to earn coins\n' +
                               '`/daily` - Claim daily rewards\n' +
                               '`/claim` - Claim various rewards\n\n' +
                               '**🎰 Gacha Commands:**\n' +
                               '`/gacha` or `/pull` - Use gacha system\n' +
                               '`/inventory` - View your items\n\n' +
                               '**📊 Info Commands:**\n' +
                               '`/profile [@user]` - View profile\n' +
                               '`/leaderboard [type]` - View leaderboards\n' +
                               '`/shop` - View shop\n' +
                               '`/help` - Show this menu',
                        flags: MessageFlags.Ephemeral
                    });
                    break;

                default:
                    // Check if it's a loaded command file
                    const command = client.commands.get(commandName);
                    if (command) {
                        await command.execute(interaction);
                    } else {
                        await interaction.reply({
                            content: '❌ Unknown command!',
                            flags: MessageFlags.Ephemeral
                        });
                    }
            }

        } catch (error) {
            console.error('❌ Error handling slash command:', error);
            
            // Respond to avoid "Unknown Integration" error
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred while processing this command. Please try again later.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }

    // Handle button interactions for PvP system
    else if (interaction.isButton()) {
        console.log(`🔘 Button interaction: ${interaction.customId} from ${interaction.user.username}`);
        
        try {
            if (!pvpSystem) {
                console.error('❌ PvP system not available for button interaction');
                return await interaction.reply({
                    content: '❌ PvP system is not available.',
                    flags: MessageFlags.Ephemeral
                });
            }

            if (interaction.customId.startsWith('accept_battle_') || 
                interaction.customId.startsWith('decline_battle_')) {
                console.log('🎮 Handling battle response...');
                await pvpSystem.handleBattleResponse(interaction);
            } 
            else if (interaction.customId.startsWith('battle_')) {
                console.log('⚔️ Handling battle action...');
                await pvpSystem.handleBattleAction(interaction);
            }
            else {
                console.log('❓ Unknown button interaction');
                await interaction.reply({
                    content: '❌ Unknown button interaction.',
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (error) {
            console.error('❌ Error handling button interaction:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred while processing this action.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }

    // Handle other interaction types (select menus, modals, etc.)
    else if (interaction.isStringSelectMenu()) {
        console.log(`📋 Select menu interaction: ${interaction.customId}`);
        await interaction.reply({
            content: '📋 Select menu interactions not implemented yet.',
            flags: MessageFlags.Ephemeral
        });
    }
});

// Handle message events (for prefix commands if needed)
client.on(Events.MessageCreate, async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Add any prefix command handling here if needed
    // Example: if (message.content.startsWith('!')) { ... }
});

// Error handling
client.on('error', error => {
    console.error('❌ Discord client error:', error);
});

client.on('warn', warning => {
    console.warn('⚠️ Discord client warning:', warning);
});

client.on('debug', info => {
    // Uncomment for detailed debug info
    // console.log('🔍 Discord debug:', info);
});

// Process error handling
process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🔄 Received SIGINT, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🔄 Received SIGTERM, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

// Login to Discord
console.log('🔐 Attempting to login to Discord...');
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Failed to login:', error);
    process.exit(1);
});
