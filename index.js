// index.js - FIXED VERSION - Restores proper command loading
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

// Load database manager
let DatabaseManager;
try {
    DatabaseManager = require('./src/database/manager');
    console.log('✅ Database manager loaded');
} catch (error) {
    console.error('❌ Failed to load database manager:', error);
}

// Load systems
let AutoIncomeSystem, EconomySystem, LevelSystem;
try {
    AutoIncomeSystem = require('./src/systems/auto-income');
    EconomySystem = require('./src/systems/economy');
    LevelSystem = require('./src/systems/levels');
    console.log('✅ Core systems loaded');
} catch (error) {
    console.error('❌ Error loading systems:', error);
}

// Initialize PvP system (optional)
let EnhancedTurnBasedPvP, pvpSystem;
try {
    console.log('🔄 Attempting to load PvP system...');
    EnhancedTurnBasedPvP = require('./src/systems/pvp/enhanced-turn-based-pvp');
    pvpSystem = new EnhancedTurnBasedPvP();
    console.log('✅ PvP system created successfully');
} catch (error) {
    console.warn('⚠️ PvP system not available:', error.message);
    pvpSystem = null;
}

// PROPERLY Load command files from src/commands directory
const commandsPath = path.join(__dirname, 'src/commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    console.log(`📂 Found ${commandFiles.length} command files in src/commands/`);
    
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
} else {
    console.warn('⚠️ Commands directory not found at src/commands/');
}

// Load event files
const eventsPath = path.join(__dirname, 'src/events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        try {
            const event = require(filePath);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
            console.log(`✅ Loaded event: ${event.name}`);
        } catch (error) {
            console.error(`❌ Error loading event ${file}:`, error);
        }
    }
}

// Bot ready event
client.once(Events.Ready, async () => {
    console.log(`🤖 Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`🎮 PvP System Status: ${pvpSystem ? 'Available' : 'Not Available'}`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
    console.log(`👥 Serving ${client.users.cache.size} users`);
    console.log(`🎯 Loaded ${client.commands.size} commands`);
    
    // Initialize database
    if (DatabaseManager) {
        try {
            await DatabaseManager.initializeDatabase();
            console.log('📦 Database initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
        }
    }
    
    // Initialize systems
    if (AutoIncomeSystem) {
        try {
            await AutoIncomeSystem.initialize(client);
            console.log('💰 Auto income system started');
        } catch (error) {
            console.error('❌ Auto income system failed:', error);
        }
    }
    
    if (LevelSystem) {
        try {
            await LevelSystem.initialize(client);
            console.log('⭐ Level system initialized');
        } catch (error) {
            console.error('❌ Level system failed:', error);
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
        console.error('❌ Error setting bot presence:', error);
    }
});

// Handle slash command interactions - PROPERLY route to command files
client.on(Events.InteractionCreate, async (interaction) => {
    // Handle chat input commands (slash commands)
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`❌ No command matching ${interaction.commandName} was found.`);
            return await interaction.reply({
                content: '❌ Unknown command!',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            console.log(`📝 Executing command: /${interaction.commandName} for ${interaction.user.username}`);
            await command.execute(interaction);
        } catch (error) {
            console.error(`❌ Error executing ${interaction.commandName}:`, error);
            
            const errorMessage = { 
                content: 'There was an error while executing this command!', 
                flags: MessageFlags.Ephemeral
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
        return;
    }

    // Handle button and select menu interactions
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
        const customId = interaction.customId;

        try {
            // Handle PvP interactions first (if PvP system is available)
            if (pvpSystem && await handlePvPInteractions(interaction)) {
                return;
            }

            // Handle pull button interactions
            if (customId === 'pull_again' || customId === 'pull_10x') {
                const PullButtons = require('./src/commands/helpers/pull-buttons');
                const originalMessage = interaction.message;
                
                let originalUserId = null;
                
                if (originalMessage.interaction && originalMessage.interaction.user) {
                    originalUserId = originalMessage.interaction.user.id;
                } else {
                    originalUserId = interaction.user.id;
                }
                
                if (originalUserId) {
                    await PullButtons.handle(interaction, originalUserId);
                } else {
                    await interaction.reply({
                        content: '❌ Could not determine the original user for this pull.',
                        flags: MessageFlags.Ephemeral
                    });
                }
                return;
            }

            // Handle collection pagination buttons
            if (customId.startsWith('collection_')) {
                await handleCollectionButtons(interaction);
                return;
            }

            // Handle abilities command buttons
            if (customId.startsWith('abilities_')) {
                await handleAbilitiesButtons(interaction);
                return;
            }

            // Log unhandled interactions
            console.log(`❓ Unhandled interaction: ${customId}`);

        } catch (error) {
            console.error('❌ Error handling interaction:', error);
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred while processing your interaction.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
            }
        }
    }
});

// Handle PvP interactions (if PvP system is available)
async function handlePvPInteractions(interaction) {
    const customId = interaction.customId;
    
    if (!pvpSystem) return false;

    try {
        // Handle battle responses
        if (customId.startsWith('accept_battle_') || customId.startsWith('decline_battle_')) {
            console.log('🎮 Handling battle response...');
            await pvpSystem.handleBattleResponse(interaction);
            return true;
        } 
        // Handle battle actions
        else if (customId.startsWith('battle_')) {
            console.log('⚔️ Handling battle action...');
            await pvpSystem.handleBattleAction(interaction);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error handling PvP interaction:', error);
        
        if (error.code === 10062) {
            console.warn('⚠️ PvP interaction expired');
            return true;
        }
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred during the battle interaction.',
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (replyError) {
            console.error('Failed to send PvP error reply:', replyError);
        }
        
        return true;
    }
}

// Handle collection pagination buttons
async function handleCollectionButtons(interaction) {
    try {
        const parts = interaction.customId.split('_');
        const action = parts[1];
        const userId = parts[2];
        const currentPage = parseInt(parts[3]);
        const rarityFilter = parts[4] === 'all' ? null : parts[4];
        
        if (interaction.user.id !== userId) {
            return interaction.reply({
                content: '❌ You can only interact with your own collection!',
                flags: MessageFlags.Ephemeral
            });
        }
        
        const collectionCommand = client.commands.get('collection');
        if (collectionCommand && collectionCommand.handlePagination) {
            await collectionCommand.handlePagination(interaction, action, userId, currentPage, rarityFilter);
        } else {
            await interaction.reply({
                content: '❌ Collection pagination is not available.',
                flags: MessageFlags.Ephemeral
            });
        }
        
    } catch (error) {
        console.error('Error handling collection buttons:', error);
        await interaction.reply({
            content: '❌ An error occurred while handling the collection interaction.',
            flags: MessageFlags.Ephemeral
        });
    }
}

// Handle abilities command buttons
async function handleAbilitiesButtons(interaction) {
    try {
        const parts = interaction.customId.split('_');
        const action = parts[1];
        
        const abilitiesCommand = client.commands.get('abilities');
        if (abilitiesCommand && abilitiesCommand.handleButtonInteraction) {
            await abilitiesCommand.handleButtonInteraction(interaction, action, parts);
        } else {
            await interaction.reply({
                content: '❌ Abilities interaction is not available.',
                flags: MessageFlags.Ephemeral
            });
        }
        
    } catch (error) {
        console.error('Error handling abilities buttons:', error);
        await interaction.reply({
            content: '❌ An error occurred while handling the abilities interaction.',
            flags: MessageFlags.Ephemeral
        });
    }
}

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
