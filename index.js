// index.js - COMPLETE VERSION WITH ENHANCED PVP INTEGRATION
const { Client, GatewayIntentBits, Events, Collection, MessageFlags } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

// Create a new client instance
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ] 
});

// Create commands collection
client.commands = new Collection();

// Load commands from src/commands directory
const commandsPath = path.join(__dirname, 'src', 'commands');
console.log('🔍 Looking for commands in:', commandsPath);

try {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    console.log('📁 Found command files:', commandFiles);

    for (const file of commandFiles) {
        console.log(`🔄 Processing file: ${file}`);
        const filePath = path.join(commandsPath, file);
        
        try {
            delete require.cache[require.resolve(filePath)]; // Clear cache
            const command = require(filePath);
            
            console.log(`   📋 Command object keys:`, Object.keys(command));
            
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`   ✅ Loaded command: ${command.data.name}`);
            } else {
                console.log(`   ❌ Missing 'data' or 'execute' properties in ${file}`);
                console.log(`   🔍 Has data:`, 'data' in command);
                console.log(`   🔍 Has execute:`, 'execute' in command);
            }
        } catch (error) {
            console.log(`   ❌ Error loading ${file}:`, error.message);
            console.log(`   📍 Error stack:`, error.stack);
        }
    }
} catch (error) {
    console.error('❌ Error reading commands directory:', error);
}

// Debug: Show all loaded commands
console.log('\n🔍 Debug: All loaded commands:');
client.commands.forEach((command, name) => {
    console.log(`   ✅ ${name}`);
});
console.log(`📊 Total commands loaded: ${client.commands.size}\n`);

// Load events from src/events directory
const eventsPath = path.join(__dirname, 'src', 'events');
console.log('🔍 Looking for events in:', eventsPath);

try {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    console.log('📁 Found event files:', eventFiles);

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
            console.log(`❌ Error loading event ${file}:`, error.message);
        }
    }
} catch (error) {
    console.error('❌ Error reading events directory:', error);
}

// Initialize systems
console.log('🔧 Initializing systems...');

// Initialize Database
try {
    const DatabaseManager = require('./src/database/manager');
    console.log('✅ Database Manager loaded');
} catch (error) {
    console.log('❌ Database Manager failed to load:', error.message);
}

// Initialize Economy System
try {
    const EconomySystem = require('./src/systems/economy');
    console.log('✅ Economy System loaded');
} catch (error) {
    console.log('❌ Economy System failed to load:', error.message);
}

// Initialize Level System
try {
    const LevelSystem = require('./src/systems/levels');
    console.log('✅ Level System loaded');
} catch (error) {
    console.log('❌ Level System failed to load:', error.message);
}

// Initialize Auto Income (optional)
try {
    const AutoIncomeSystem = require('./src/systems/auto-income');
    if (AutoIncomeSystem && AutoIncomeSystem.startAutoIncome) {
        AutoIncomeSystem.startAutoIncome();
        console.log('✅ Auto Income System started');
    }
} catch (error) {
    console.log('⚠️ Auto Income System not available:', error.message);
}

// Initialize Enhanced PvP System (optional)
let EnhancedTurnBasedPvP = null;
try {
    const EnhancedTurnBasedPvPClass = require('./src/systems/pvp/enhanced-turn-based-pvp');
    EnhancedTurnBasedPvP = new EnhancedTurnBasedPvPClass();
    console.log('✅ Enhanced Turn-Based PvP System loaded');
} catch (error) {
    console.log('⚠️ Enhanced Turn-Based PvP System not available:', error.message);
}

// Initialize PvP Queue System (optional)
let PvPQueueSystem = null;
try {
    PvPQueueSystem = require('./src/systems/pvp/pvp-queue-system');
    console.log('✅ PvP Queue System loaded');
} catch (error) {
    console.log('⚠️ PvP Queue System not available:', error.message);
}

// Initialize Legacy Battle Manager (optional)
let BattleManager = null;
try {
    BattleManager = require('./src/systems/pvp/battle-manager');
    console.log('✅ Legacy Battle Manager loaded');
} catch (error) {
    console.log('⚠️ Legacy Battle Manager not available:', error.message);
}

// Ready event
client.once(Events.Ready, async () => {
    console.log('🏴‍☠️ Gacha-Bot is ready to sail the Grand Line!');
    console.log(`📊 Serving ${client.guilds.cache.size} server(s)`);
    console.log(`👥 Connected to ${client.users.cache.size} user(s)`);
    
    try {
        await client.user.setPresence({
            activities: [{ name: 'the Grand Line for Devil Fruits! 🍎', type: 0 }],
            status: 'online',
        });
        console.log('✅ Bot presence set successfully');
    } catch (error) {
        console.log('❌ Error setting bot presence:', error.message);
    }
    
    console.log('🎉 Ready event completed successfully!');
});

// Main interaction handler
client.on(Events.InteractionCreate, async interaction => {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        
        console.log(`📝 Executing command: /${interaction.commandName} for ${interaction.user.username}`);
        
        if (!command) {
            console.error(`❌ No command matching ${interaction.commandName} was found.`);
            console.log('🔍 Available commands:', Array.from(client.commands.keys()).join(', '));
            
            await interaction.reply({
                content: `❌ Command \`/${interaction.commandName}\` not found!`,
                ephemeral: true
            });
            return;
        }

        try {
            await command.execute(interaction);
            console.log(`✅ Command /${interaction.commandName} executed successfully`);
        } catch (error) {
            console.error(`❌ Error executing /${interaction.commandName}:`, error);
            
            const errorMessage = {
                content: 'There was an error while executing this command!',
                ephemeral: true
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    } 
    
    // Handle button interactions
    else if (interaction.isButton()) {
        console.log(`🔘 Button interaction: ${interaction.customId} from ${interaction.user.username}`);
        
        try {
            const customId = interaction.customId;

            // Enhanced PvP battle responses (accept/decline)
            if (customId.startsWith('accept_enhanced_battle_') || 
                customId.startsWith('decline_enhanced_battle_')) {
                
                console.log('🎮 Handling enhanced battle response...');
                
                if (!EnhancedTurnBasedPvP) {
                    return await interaction.reply({
                        content: '❌ Enhanced PvP system is not available.',
                        ephemeral: true
                    });
                }
                
                await EnhancedTurnBasedPvP.handleBattleResponse(interaction);
            }
            
            // Enhanced PvP fruit selection buttons
            else if (customId.startsWith('page_switch_') ||
                     customId.startsWith('confirm_selection_') ||
                     customId.startsWith('clear_selection_')) {
                
                console.log('🍈 Handling fruit selection...');
                
                if (!EnhancedTurnBasedPvP) {
                    return await interaction.reply({
                        content: '❌ Enhanced PvP system is not available.',
                        ephemeral: true
                    });
                }

                // Extract battle ID and user ID from custom ID
                const parts = customId.split('_');
                let battleId, userId;
                
                if (customId.startsWith('page_switch_')) {
                    battleId = parts.slice(2, -1).join('_');
                    userId = parts[parts.length - 1];
                    await EnhancedTurnBasedPvP.handlePageSwitch(interaction, battleId, userId);
                }
                else if (customId.startsWith('confirm_selection_')) {
                    battleId = parts.slice(2, -1).join('_');
                    userId = parts[parts.length - 1];
                    await EnhancedTurnBasedPvP.handleConfirmSelection(interaction, battleId, userId);
                }
                else if (customId.startsWith('clear_selection_')) {
                    battleId = parts.slice(2, -1).join('_');
                    userId = parts[parts.length - 1];
                    await EnhancedTurnBasedPvP.handleClearSelection(interaction, battleId, userId);
                }
            }
            
            // Enhanced PvP battle actions (skill usage, view skills, surrender)
            else if (customId.startsWith('use_skill_') ||
                     customId.startsWith('view_skills_') ||
                     customId.startsWith('surrender_')) {
                
                console.log('⚔️ Handling battle action...');
                
                if (!EnhancedTurnBasedPvP) {
                    return await interaction.reply({
                        content: '❌ Enhanced PvP system is not available.',
                        ephemeral: true
                    });
                }

                // Extract battle ID and user ID from custom ID
                const parts = customId.split('_');
                
                if (customId.startsWith('use_skill_')) {
                    // use_skill_battleId_userId_skillIndex
                    const battleId = parts.slice(2, -2).join('_');
                    const userId = parts[parts.length - 2];
                    const skillIndex = parseInt(parts[parts.length - 1]);
                    await EnhancedTurnBasedPvP.handleSkillUsage(interaction, battleId, userId, skillIndex);
                }
                else if (customId.startsWith('view_skills_')) {
                    // view_skills_battleId_userId
                    const battleId = parts.slice(2, -1).join('_');
                    const userId = parts[parts.length - 1];
                    await EnhancedTurnBasedPvP.handleViewSkills(interaction, battleId, userId);
                }
                else if (customId.startsWith('surrender_')) {
                    // surrender_battleId_userId
                    const battleId = parts.slice(1, -1).join('_');
                    const userId = parts[parts.length - 1];
                    await EnhancedTurnBasedPvP.handleSurrender(interaction, battleId, userId);
                }
            }
            
            // Legacy PvP system support (for backward compatibility)
            else if (customId.startsWith('pvp_accept_') || 
                     customId.startsWith('pvp_decline_')) {
                
                console.log('🔧 Handling legacy PvP challenge response...');
                
                if (!BattleManager) {
                    return await interaction.reply({
                        content: '❌ Legacy PvP system is not available.',
                        ephemeral: true
                    });
                }
                
                const [action, challengerId, opponentId] = customId.split('_').slice(1);
                
                if (interaction.user.id !== opponentId) {
                    return await interaction.reply({
                        content: 'This challenge is not for you!',
                        ephemeral: true
                    });
                }
                
                if (action === 'accept') {
                    await BattleManager.startBattle(challengerId, opponentId, interaction);
                } else {
                    await interaction.update({
                        content: '❌ PvP challenge declined.',
                        components: []
                    });
                }
            }
            
            // Legacy battle actions
            else if (customId.startsWith('battle_')) {
                console.log('⚔️ Handling legacy battle action...');
                
                if (!BattleManager) {
                    return await interaction.reply({
                        content: '❌ Legacy PvP system is not available.',
                        ephemeral: true
                    });
                }
                
                const parts = customId.split('_');
                const action = parts[1]; // attack, defend, special, forfeit
                const battleId = parts[2];
                const playerId = parts[3];
                
                if (interaction.user.id !== playerId) {
                    return await interaction.reply({
                        content: 'This battle action is not for you!',
                        ephemeral: true
                    });
                }
                
                await BattleManager.processBattleAction(interaction, action, battleId, playerId);
            }
            
            // Pull system buttons (from pull command)
            else if (customId === 'pull_again' || customId === 'pull_10x') {
                console.log('🎰 Handling pull button...');
                
                try {
                    const PullButtons = require('./src/commands/helpers/pull-buttons');
                    await PullButtons.handle(interaction, interaction.user.id);
                } catch (error) {
                    console.error('Error with pull buttons:', error);
                    await interaction.reply({
                        content: '❌ Pull system error. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            else {
                console.log('❓ Unknown button interaction:', customId);
                await interaction.reply({
                    content: '❌ Unknown button interaction.',
                    ephemeral: true
                });
            }
            
        } catch (error) {
            console.error('❌ Error handling button interaction:', error);
            
            // Handle specific Discord.js errors gracefully
            if (error.code === 'InteractionAlreadyReplied') {
                console.log('⚠️ Interaction already replied - this is normal for complex PvP flows');
                return;
            }
            
            if (error.code === 10062) {
                console.log('⚠️ Interaction expired - this is normal for old interactions');
                return;
            }
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred while processing this action.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
            }
        }
    }
    
    // Handle select menu interactions
    else if (interaction.isStringSelectMenu()) {
        console.log(`📋 Select menu interaction: ${interaction.customId}`);
        
        try {
            const customId = interaction.customId;
            
            // Enhanced PvP fruit selection from dropdown
            if (customId.startsWith('fruit_selection_')) {
                console.log('🍈 Handling fruit selection from dropdown...');
                
                if (!EnhancedTurnBasedPvP) {
                    return await interaction.reply({
                        content: '❌ Enhanced PvP system is not available.',
                        ephemeral: true
                    });
                }
                
                // Extract battle ID and user ID from custom ID
                // fruit_selection_battleId_userId
                const parts = customId.split('_');
                const battleId = parts.slice(2, -1).join('_');
                const userId = parts[parts.length - 1];
                
                // Get the selected fruit from the interaction
                const selectedValue = interaction.values[0];
                
                // Extract fruit ID from the selected value
                // select_fruit_battleId_userId_fruitId
                const valueParts = selectedValue.split('_');
                const fruitId = valueParts[valueParts.length - 1];
                
                await EnhancedTurnBasedPvP.handleFruitSelection(interaction, battleId, userId, fruitId);
            }
            else {
                console.log('❓ Unknown select menu interaction:', customId);
                await interaction.reply({
                    content: '❌ Unknown select menu interaction.',
                    ephemeral: true
                });
            }
            
        } catch (error) {
            console.error('❌ Error handling select menu interaction:', error);
            
            // Handle specific Discord.js errors
            if (error.code === 'InteractionAlreadyReplied') {
                console.log('⚠️ Select menu interaction already replied');
                return;
            }
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred while processing the selection.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
            }
        }
    }
    
    // Handle modal submit interactions (if you have any)
    else if (interaction.isModalSubmit()) {
        console.log(`📝 Modal submit interaction: ${interaction.customId}`);
        
        // Handle modal submissions here if needed
        await interaction.reply({
            content: '📝 Modal submissions not implemented yet.',
            ephemeral: true
        });
    }
    
    // Handle autocomplete interactions (if you have any)
    else if (interaction.isAutocomplete()) {
        console.log(`🔍 Autocomplete interaction: ${interaction.commandName}`);
        
        // Handle autocomplete here if needed
        await interaction.respond([]);
    }
});

// Handle message events (for prefix commands if needed)
client.on(Events.MessageCreate, async message => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Add any prefix command handling here if needed
    // Example: if (message.content.startsWith('!')) { ... }
});

// Handle guild member updates for level system
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    try {
        // Check if roles changed
        const oldRoles = oldMember.roles.cache.map(role => role.name);
        const newRoles = newMember.roles.cache.map(role => role.name);
        
        // Check if any level roles changed
        const levelRoles = ['Level-0', 'Level-5', 'Level-10', 'Level-15', 'Level-20', 'Level-25', 'Level-30', 'Level-35', 'Level-40', 'Level-45', 'Level-50'];
        const oldLevelRoles = oldRoles.filter(role => levelRoles.includes(role));
        const newLevelRoles = newRoles.filter(role => levelRoles.includes(role));
        
        if (JSON.stringify(oldLevelRoles) !== JSON.stringify(newLevelRoles)) {
            try {
                const LevelSystem = require('./src/systems/levels');
                await LevelSystem.updateUserLevel(
                    newMember.user.id, 
                    newMember.user.username, 
                    newMember.guild.id
                );
                console.log(`⭐ Level updated for ${newMember.user.username} due to role change`);
            } catch (error) {
                console.error('Error updating user level:', error);
            }
        }
        
    } catch (error) {
        console.error('Error in guildMemberUpdate event:', error);
    }
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
