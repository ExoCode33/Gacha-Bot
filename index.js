// index.js - COMPLETE VERSION WITH DEBUG LOGGING
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

// Initialize PvP System (optional)
try {
    const PvPQueueSystem = require('./src/systems/pvp/pvp-queue-system');
    console.log('✅ PvP Queue System loaded');
} catch (error) {
    console.log('⚠️ PvP Queue System not available:', error.message);
}

try {
    const BattleManager = require('./src/systems/pvp/battle-manager');
    console.log('✅ PvP Battle Manager loaded');
} catch (error) {
    console.log('⚠️ PvP Battle Manager not available:', error.message);
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

// Interaction handler
client.on(Events.InteractionCreate, async interaction => {
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
    } else if (interaction.isButton()) {
        // Handle button interactions for PvP challenges
        const customId = interaction.customId;
        
        if (customId.startsWith('pvp_accept_') || customId.startsWith('pvp_decline_')) {
            try {
                const [action, challengerId, opponentId] = customId.split('_').slice(1);
                
                if (interaction.user.id !== opponentId) {
                    await interaction.reply({
                        content: 'This challenge is not for you!',
                        ephemeral: true
                    });
                    return;
                }
                
                if (action === 'accept') {
                    // Handle PvP challenge acceptance
                    try {
                        const BattleManager = require('./src/systems/pvp/battle-manager');
                        await BattleManager.startBattle(challengerId, opponentId, interaction);
                    } catch (error) {
                        console.log('PvP Battle Manager not available for challenge handling');
                        await interaction.reply({
                            content: 'PvP system is currently unavailable.',
                            ephemeral: true
                        });
                    }
                } else {
                    await interaction.update({
                        content: '❌ PvP challenge declined.',
                        components: []
                    });
                }
            } catch (error) {
                console.error('Error handling PvP button interaction:', error);
                await interaction.reply({
                    content: 'Error processing challenge response.',
                    ephemeral: true
                });
            }
        }
    }
});

// Error handling
client.on('error', error => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

// Login to Discord
console.log('🔐 Attempting to login to Discord...');
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Failed to login to Discord:', error);
    process.exit(1);
});
