// index.js - Fixed Main Bot File with Proper PvP Integration
const { Client, GatewayIntentBits, Events, Collection, MessageFlags } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

console.log('🔍 Starting One Piece Gacha Bot initialization...');

// Validate environment variables
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is required in environment variables');
    process.exit(1);
}

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

// Initialize systems
let DatabaseManager;
let EconomySystem;
let LevelSystem;
let AutoIncomeSystem;
let EnhancedTurnBasedPvP;
let pvpSystem;

// Load systems safely
try {
    console.log('📦 Loading database manager...');
    DatabaseManager = require('./src/database/manager');
    console.log('✅ Database manager loaded');
} catch (error) {
    console.error('❌ Failed to load database manager:', error.message);
}

try {
    console.log('💰 Loading economy system...');
    EconomySystem = require('./src/systems/economy');
    console.log('✅ Economy system loaded');
} catch (error) {
    console.error('❌ Failed to load economy system:', error.message);
}

try {
    console.log('⭐ Loading level system...');
    LevelSystem = require('./src/systems/levels');
    console.log('✅ Level system loaded');
} catch (error) {
    console.error('❌ Failed to load level system:', error.message);
}

try {
    console.log('⏰ Loading auto income system...');
    AutoIncomeSystem = require('./src/systems/auto-income');
    console.log('✅ Auto income system loaded');
} catch (error) {
    console.error('❌ Failed to load auto income system:', error.message);
}

// FIXED: Enhanced PvP System Loading and Storage
try {
    console.log('⚔️ Loading enhanced PvP system...');
    const EnhancedTurnBasedPvPClass = require('./src/systems/pvp/enhanced-turn-based-pvp');
    pvpSystem = new EnhancedTurnBasedPvPClass();
    
    // CRITICAL: Store PvP system on client for access by commands
    client.pvpSystem = pvpSystem;
    
    console.log('✅ Enhanced PvP system loaded and stored on client');
    console.log('📊 PvP system type:', typeof pvpSystem);
    console.log('🔧 PvP methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(pvpSystem)));
} catch (error) {
    console.error('❌ Failed to load PvP system:', error.message);
    pvpSystem = null;
    client.pvpSystem = null;
}

// Load command files
const commandsPath = path.join(__dirname, 'src', 'commands');
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
            console.error(`❌ Error loading command ${file}:`, error.message);
        }
    }
} else {
    console.log('⚠️ Commands directory not found, using inline commands only');
}

// Bot ready event
client.once(Events.Ready, async () => {
    console.log(`🏴‍☠️ ${client.user.tag} is ready to sail the Grand Line!`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
    console.log(`👥 Serving ${client.users.cache.size} users`);
    
    // Initialize database
    if (DatabaseManager) {
        try {
            await DatabaseManager.initialize();
            console.log('📦 Database initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error.message);
        }
    }
    
    // Initialize systems
    if (EconomySystem) {
        try {
            await EconomySystem.initialize();
            console.log('💰 Economy system initialized');
        } catch (error) {
            console.error('❌ Economy system initialization failed:', error.message);
        }
    }
    
    if (LevelSystem) {
        try {
            await LevelSystem.initialize(client);
            console.log('⭐ Level system initialized');
        } catch (error) {
            console.error('❌ Level system initialization failed:', error.message);
        }
    }
    
    if (AutoIncomeSystem) {
        try {
            await AutoIncomeSystem.initialize(client);
            console.log('⏰ Auto income system initialized');
        } catch (error) {
            console.error('❌ Auto income system initialization failed:', error.message);
        }
    }
    
    // Set bot presence
    try {
        client.user.setPresence({
            activities: [{ name: 'the Grand Line for Devil Fruits! 🍈', type: 0 }],
            status: 'online'
        });
        console.log('✅ Bot presence set successfully');
    } catch (error) {
        console.error('❌ Error setting bot presence:', error.message);
    }
    
    console.log('🎉 One Piece Gacha Bot is fully ready!');
    console.log(`🎮 Enhanced PvP System Status: ${client.pvpSystem ? 'Available' : 'Not Available'}`);
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
    } else if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
    } else if (interaction.isStringSelectMenu()) {
        await handleSelectMenuInteraction(interaction);
    }
});

// Handle slash commands
async function handleSlashCommand(interaction) {
    const { commandName } = interaction;
    
    console.log(`📝 Slash command: /${commandName} from ${interaction.user.username}`);
    
    try {
        // Check for loaded commands first
        const command = client.commands.get(commandName);
        if (command) {
            await command.execute(interaction);
            return;
        }
        
        // Handle built-in commands
        switch (commandName) {
            case 'pvp':
                await handlePvPCommand(interaction);
                break;
                
            case 'pull':
                await handlePullCommand(interaction);
                break;
                
            case 'collection':
                await handleCollectionCommand(interaction);
                break;
                
            case 'balance':
                await handleBalanceCommand(interaction);
                break;
                
            case 'stats':
                await handleStatsCommand(interaction);
                break;
                
            case 'income':
                await handleIncomeCommand(interaction);
                break;
                
            case 'leaderboard':
                await handleLeaderboardCommand(interaction);
                break;
                
            case 'info':
                await handleInfoCommand(interaction);
                break;
                
            case 'help':
                await handleHelpCommand(interaction);
                break;
                
            default:
                await interaction.reply({
                    content: '❌ Unknown command! Use `/help` to see available commands.',
                    ephemeral: true
                });
        }
        
    } catch (error) {
        console.error(`❌ Error handling command /${commandName}:`, error);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred while processing this command. Please try again later.',
                    ephemeral: true
                });
            }
        } catch (replyError) {
            console.error('Failed to send error reply:', replyError);
        }
    }
}

// FIXED: Handle PvP command with proper subcommand handling
async function handlePvPCommand(interaction) {
    if (!client.pvpSystem) {
        await interaction.reply({
            content: `❌ Enhanced PvP system is not available. Please contact an administrator.`,
            flags: MessageFlags.Ephemeral
        });
        return;
    }
    
    const subcommand = interaction.options.getSubcommand();
    
    console.log(`🎯 PvP subcommand: ${subcommand} from ${interaction.user.username}`);
    
    switch (subcommand) {
        case 'challenge':
            const targetUser = interaction.options.getUser('opponent');
            
            if (!targetUser) {
                return await interaction.reply({
                    content: '❌ Please specify a valid user to challenge.',
                    flags: MessageFlags.Ephemeral
                });
            }
            
            if (targetUser.bot) {
                return await interaction.reply({
                    content: '❌ You cannot challenge a bot to battle.',
                    ephemeral: true
                });
            }
            
            if (targetUser.id === interaction.user.id) {
                return await interaction.reply({
                    content: '❌ You cannot challenge yourself to a battle.',
                    ephemeral: true
                });
            }
            
            console.log(`🎯 PvP Challenge: ${interaction.user.username} challenging ${targetUser.username}`);
            await client.pvpSystem.initiateBattle(interaction, targetUser);
            break;
            
        case 'queue':
            await handleQueueJoin(interaction);
            break;
            
        case 'quick':
            // Quick match - same as queue for now
            await handleQueueJoin(interaction);
            break;
            
        case 'queue-status':
            await handleQueueStatus(interaction);
            break;
            
        default:
            await interaction.reply({
                content: '❌ Unknown PvP subcommand!',
                ephemeral: true
            });
    }
}

// FIXED: Handle queue operations
async function handleQueueJoin(interaction) {
    try {
        // Load PvP queue system
        const PvPQueueSystem = require('./src/systems/pvp/pvp-queue-system');
        
        // Check if user has enough fruits
        if (!DatabaseManager) {
            return await interaction.reply({
                content: '❌ Database system is not available.',
                ephemeral: true
            });
        }
        
        await DatabaseManager.ensureUser(interaction.user.id, interaction.user.username, interaction.guild?.id);
        const userFruits = await DatabaseManager.getUserDevilFruits(interaction.user.id);
        
        if (userFruits.length < 5) {
            return await interaction.reply({
                content: `❌ You need at least 5 Devil Fruits to join the PvP queue! You have ${userFruits.length}.`,
                ephemeral: true
            });
        }
        
        // Join queue
        const result = PvPQueueSystem.joinQueue(interaction.user.id, interaction.user.username);
        
        if (result.success) {
            if (result.matched) {
                await interaction.reply({
                    content: `⚔️ **Match Found!** Battle starting between **${result.player1.username}** and **${result.player2.username}**!`
                });
                
                // Start enhanced battle if both players are human
                if (client.pvpSystem && !result.player2.username.includes('Bot')) {
                    // Create mock user object for player 2
                    const player2User = {
                        id: result.player2.userId,
                        username: result.player2.username
                    };
                    
                    setTimeout(async () => {
                        try {
                            await client.pvpSystem.initiateBattle(interaction, player2User);
                        } catch (error) {
                            console.error('Error starting queue battle:', error);
                        }
                    }, 2000);
                }
            } else {
                await interaction.reply({
                    content: `🔍 **Joined PvP Queue!**\n\n**Position:** #${result.position}\n**Players in Queue:** ${result.queueSize}\n**Estimated Wait:** ${Math.max(1, result.position * 30)} seconds`,
                    ephemeral: true
                });
            }
        } else {
            await interaction.reply({
                content: `❌ Failed to join queue: ${result.message}`,
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('Error handling queue join:', error);
        await interaction.reply({
            content: '❌ PvP queue system is not available.',
            ephemeral: true
        });
    }
}

async function handleQueueStatus(interaction) {
    try {
        const PvPQueueSystem = require('./src/systems/pvp/pvp-queue-system');
        const status = PvPQueueSystem.getQueueStatus();
        
        let queueList = 'No players in queue';
        if (status.queuedPlayers.length > 0) {
            queueList = status.queuedPlayers
                .slice(0, 10)
                .map((player, index) => `${index + 1}. ${player.username}`)
                .join('\n');
        }
        
        await interaction.reply({
            content: `📊 **PvP Queue Status**\n\n**Players in Queue:** ${status.queueSize}\n**Active Matches:** ${status.activeMatches}\n\n**Queue List:**\n${queueList}`,
            ephemeral: true
        });
    } catch (error) {
        await interaction.reply({
            content: '❌ PvP queue system is not available.',
            ephemeral: true
        });
    }
}

// Handle pull command
async function handlePullCommand(interaction) {
    try {
        await interaction.reply({
            content: '🎰 **Gacha Pull System**\n\nThe gacha system is currently being implemented! Check back soon for Devil Fruit pulls.',
            ephemeral: true
        });
    } catch (error) {
        console.error('Error in pull command:', error);
    }
}

// Handle collection command
async function handleCollectionCommand(interaction) {
    try {
        if (!DatabaseManager) {
            return await interaction.reply({
                content: '❌ Database system is not available.',
                ephemeral: true
            });
        }
        
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userData = await DatabaseManager.getUser(targetUser.id);
        
        if (!userData) {
            return await interaction.reply({
                content: `${targetUser.username} hasn't started their pirate journey yet! Use \`/pull\` to get your first Devil Fruit.`,
                ephemeral: true
            });
        }
        
        const userFruits = await DatabaseManager.getUserDevilFruits(targetUser.id);
        
        await interaction.reply({
            content: `🍈 **${targetUser.username}'s Collection**\n\n` +
                   `**Total Fruits**: ${userFruits.length}\n` +
                   `**Total CP**: ${userData.total_cp?.toLocaleString() || 0}\n` +
                   `**Level**: ${userData.level || 0}\n\n` +
                   `Collection viewer is being enhanced! Full collection interface coming soon.`,
            ephemeral: true
        });
        
    } catch (error) {
        console.error('Error in collection command:', error);
        await interaction.reply({
            content: '❌ Error retrieving collection information.',
            ephemeral: true
        });
    }
}

// Handle balance command
async function handleBalanceCommand(interaction) {
    try {
        if (!DatabaseManager) {
            return await interaction.reply({
                content: '❌ Database system is not available.',
                ephemeral: true
            });
        }
        
        await DatabaseManager.ensureUser(interaction.user.id, interaction.user.username);
        const userData = await DatabaseManager.getUser(interaction.user.id);
        
        if (!userData) {
            return await interaction.reply({
                content: '❌ Could not retrieve your account information.',
                ephemeral: true
            });
        }
        
        await interaction.reply({
            content: `💰 **${interaction.user.username}'s Balance**\n\n` +
                   `🪙 **Berries**: ${userData.berries?.toLocaleString() || 0}\n` +
                   `⭐ **Level**: ${userData.level || 0}\n` +
                   `💎 **Total CP**: ${userData.total_cp?.toLocaleString() || 0}\n` +
                   `🍈 **Devil Fruits**: Use \`/collection\` to view`,
            ephemeral: true
        });
        
    } catch (error) {
        console.error('Error in balance command:', error);
        await interaction.reply({
            content: '❌ Error retrieving balance information.',
            ephemeral: true
        });
    }
}

// Handle stats command
async function handleStatsCommand(interaction) {
    try {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        if (!DatabaseManager) {
            return await interaction.reply({
                content: '❌ Database system is not available.',
                ephemeral: true
            });
        }
        
        const userData = await DatabaseManager.getUser(targetUser.id);
        
        if (!userData) {
            return await interaction.reply({
                content: `${targetUser.username} hasn't started their pirate journey yet!`,
                ephemeral: true
            });
        }
        
        await interaction.reply({
            content: `📊 **${targetUser.username}'s Pirate Stats**\n\n` +
                   `⭐ **Level**: ${userData.level || 0}\n` +
                   `💎 **Total CP**: ${userData.total_cp?.toLocaleString() || 0}\n` +
                   `💪 **Base CP**: ${userData.base_cp?.toLocaleString() || 0}\n` +
                   `💰 **Berries**: ${userData.berries?.toLocaleString() || 0}\n` +
                   `📅 **Joined**: ${userData.created_at ? new Date(userData.created_at).toLocaleDateString() : 'Unknown'}`,
            ephemeral: true
        });
        
    } catch (error) {
        console.error('Error in stats command:', error);
        await interaction.reply({
            content: '❌ Error retrieving stats information.',
            ephemeral: true
        });
    }
}

// Handle income command
async function handleIncomeCommand(interaction) {
    try {
        if (!EconomySystem || !DatabaseManager) {
            return await interaction.reply({
                content: '❌ Economy system is not available.',
                ephemeral: true
            });
        }
        
        await DatabaseManager.ensureUser(interaction.user.id, interaction.user.username);
        const result = await EconomySystem.processManualIncome(interaction.user.id, interaction.user.username);
        
        if (!result.success) {
            return await interaction.reply({
                content: `⏰ ${result.message}`,
                ephemeral: true
            });
        }
        
        await interaction.reply({
            content: `💰 **Income Collected!**\n\n` +
                   `**Amount**: ${result.amount.toLocaleString()} berries\n` +
                   `**New Balance**: ${result.newBalance.toLocaleString()} berries\n` +
                   `**Next Collection**: ${result.cooldownMinutes} minutes`,
            ephemeral: true
        });
        
    } catch (error) {
        console.error('Error in income command:', error);
        await interaction.reply({
            content: '❌ Error processing income collection.',
            ephemeral: true
        });
    }
}

// Handle leaderboard command
async function handleLeaderboardCommand(interaction) {
    try {
        if (!DatabaseManager) {
            return await interaction.reply({
                content: '❌ Database system is not available.',
                ephemeral: true
            });
        }
        
        const type = interaction.options.getString('type') || 'cp';
        const leaderboard = await DatabaseManager.getLeaderboard(type, 10);
        
        if (!leaderboard || leaderboard.length === 0) {
            return await interaction.reply({
                content: '📊 **Empty Leaderboard**\n\nNo data available yet! Be the first to make your mark!',
                ephemeral: true
            });
        }
        
        const leaderboardText = leaderboard.map((user, index) => {
            const position = index + 1;
            const positionEmoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
            
            let value = '';
            switch (type) {
                case 'cp':
                    value = `${user.total_cp?.toLocaleString() || 0} CP`;
                    break;
                case 'berries':
                    value = `${user.berries?.toLocaleString() || 0} berries`;
                    break;
                case 'level':
                    value = `Level ${user.level || 0}`;
                    break;
                default:
                    value = 'Unknown';
            }
            
            return `${positionEmoji} ${user.username} - ${value}`;
        }).join('\n');
        
        const typeNames = {
            cp: 'Combat Power',
            berries: 'Berry Wealth',
            level: 'Level Rankings'
        };
        
        await interaction.reply({
            content: `🏆 **${typeNames[type] || 'Leaderboard'}**\n\n${leaderboardText}`,
            ephemeral: true
        });
        
    } catch (error) {
        console.error('Error in leaderboard command:', error);
        await interaction.reply({
            content: '❌ Error retrieving leaderboard information.',
            ephemeral: true
        });
    }
}

// Handle info command
async function handleInfoCommand(interaction) {
    await interaction.reply({
        content: `ℹ️ **One Piece Devil Fruit Gacha Bot**\n\n` +
               `🏴‍☠️ **Welcome to the Grand Line!**\n` +
               `Collect Devil Fruits, build your power, and become the Pirate King!\n\n` +
               `**🎯 Key Features:**\n` +
               `• 🍈 150+ unique Devil Fruits across 7 rarity tiers\n` +
               `• ⚔️ Enhanced turn-based PvP battles\n` +
               `• 💰 Automated economy with berry income\n` +
               `• ⭐ Role-based leveling system\n` +
               `• 🎮 Animated gacha pulls (coming soon!)\n\n` +
               `**📋 Commands:**\n` +
               `• \`/pull\` - Get Devil Fruits (coming soon)\n` +
               `• \`/pvp challenge @user\` - Challenge to battle\n` +
               `• \`/pvp queue\` - Join matchmaking queue\n` +
               `• \`/pvp queue-status\` - Check queue status\n` +
               `• \`/collection\` - View your fruits\n` +
               `• \`/balance\` - Check your berries\n` +
               `• \`/income\` - Collect berry income\n` +
               `• \`/stats\` - View your pirate stats\n` +
               `• \`/leaderboard\` - Server rankings\n\n` +
               `Start your adventure today! 🌊`,
        ephemeral: true
    });
}

// Handle help command
async function handleHelpCommand(interaction) {
    await interaction.reply({
        content: `📖 **One Piece Gacha Bot - Command Help**\n\n` +
               `**🎮 Core Commands:**\n` +
               `• \`/pull\` - Pull Devil Fruits from gacha\n` +
               `• \`/collection [user]\` - View Devil Fruit collection\n` +
               `• \`/balance\` - Check your berry balance\n` +
               `• \`/stats [user]\` - View pirate statistics\n` +
               `• \`/income\` - Collect berry income\n\n` +
               `**⚔️ Battle System:**\n` +
               `• \`/pvp challenge @user\` - Challenge someone to PvP\n` +
               `• \`/pvp queue\` - Join matchmaking queue\n` +
               `• \`/pvp queue-status\` - View queue status\n\n` +
               `**📊 Information:**\n` +
               `• \`/leaderboard [type]\` - View server rankings\n` +
               `• \`/info\` - Game information and mechanics\n` +
               `• \`/help\` - This help menu\n\n` +
               `**💡 Tips:**\n` +
               `• Use \`/income\` regularly to collect berries\n` +
               `• Higher levels give better base CP\n` +
               `• Collect multiple fruits to boost your power!\n\n` +
               `🏴‍☠️ **Set sail for adventure!**`,
        ephemeral: true
    });
}

// FIXED: Enhanced Button Interaction Handler
async function handleButtonInteraction(interaction) {
    const { customId } = interaction;
    
    console.log(`🔘 Button: ${customId} by ${interaction.user.username}`);
    
    try {
        // Handle Enhanced PvP system buttons (PRIORITY HANDLING)
        if (client.pvpSystem && (
            customId.startsWith('accept_') || 
            customId.startsWith('decline_') ||
            customId.startsWith('battle_') ||
            customId.includes('enhanced') ||
            customId.includes('fruit_selection') ||
            customId.includes('confirm_selection') ||
            customId.includes('clear_selection') ||
            customId.includes('page_switch') ||
            customId.includes('use_skill') ||
            customId.includes('surrender') ||
            customId.includes('show_skills')
        )) {
            console.log('🎮 Handling Enhanced PvP button interaction...');
            await client.pvpSystem.handleBattleResponse(interaction);
            return;
        }
        
        // Handle other button types here
        await interaction.reply({
            content: '❌ Unknown button interaction.',
            ephemeral: true
        });
        
    } catch (error) {
        console.error('❌ Error handling button interaction:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({
                    content: '❌ An error occurred while processing this action.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send button error reply:', replyError);
            }
        }
    }
}

// Handle select menu interactions
async function handleSelectMenuInteraction(interaction) {
    console.log(`📋 Select menu: ${interaction.customId}`);
    
    try {
        // Handle Enhanced PvP select menus
        if (client.pvpSystem && interaction.customId.includes('fruit_selection')) {
            console.log('🍈 Handling PvP fruit selection menu...');
            await client.pvpSystem.handleBattleResponse(interaction);
            return;
        }
        
        await interaction.reply({
            content: '📋 Select menu interactions are being implemented!',
            ephemeral: true
        });
    } catch (error) {
        console.error('Error handling select menu:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({
                    content: '❌ An error occurred while processing this selection.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send select menu error reply:', replyError);
            }
        }
    }
}

// Handle guild member updates (role changes)
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (LevelSystem) {
        try {
            await LevelSystem.handleRoleChange(oldMember, newMember);
        } catch (error) {
            console.error('Error handling role change:', error);
        }
    }
});

// Error handling
client.on('error', error => {
    console.error('❌ Discord client error:', error);
});

client.on('warn', warning => {
    console.warn('⚠️ Discord client warning:', warning);
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
    if (AutoIncomeSystem && AutoIncomeSystem.stop) {
        AutoIncomeSystem.stop();
    }
    if (DatabaseManager && DatabaseManager.close) {
        DatabaseManager.close();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🔄 Received SIGTERM, shutting down gracefully...');
    client.destroy();
    if (AutoIncomeSystem && AutoIncomeSystem.stop) {
        AutoIncomeSystem.stop();
    }
    if (DatabaseManager && DatabaseManager.close) {
        DatabaseManager.close();
    }
    process.exit(0);
});

// Login to Discord
console.log('🔐 Attempting to login to Discord...');
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Failed to login:', error);
    process.exit(1);
});
