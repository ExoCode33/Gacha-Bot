// index.js - One Piece Devil Fruit Gacha Bot v3.0 (Memory Optimized)
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('node:fs');
const path = require('node:path');

// Load environment variables
require('dotenv').config();

// Memory optimization settings
process.env.NODE_OPTIONS = '--max-old-space-size=512'; // Limit memory to 512MB

// Create Discord client with optimized settings
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    // Optimize cache settings
    makeCache: () => new Collection(),
    allowedMentions: { parse: ['users', 'roles'], repliedUser: false },
});

// Initialize commands collection
client.commands = new Collection();

// Enhanced error handling
process.on('unhandledRejection', (error) => {
    console.error('🚨 Unhandled promise rejection:', error);
    // Don't exit on unhandled rejections, just log them
});

process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught exception:', error);
    // Only exit on truly critical errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        console.log('🔄 Network error, continuing...');
        return;
    }
    process.exit(1);
});

// Load commands
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`📁 Loading ${commandFiles.length} commands...`);

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Loaded command: ${command.data.name}`);
        } else {
            console.log(`⚠️ Command at ${filePath} is missing "data" or "execute" property.`);
        }
    } catch (error) {
        console.error(`❌ Error loading command ${file}:`, error.message);
    }
}

// Load events
const eventsPath = path.join(__dirname, 'src', 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

console.log(`📁 Loading ${eventFiles.length} events...`);

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
        console.error(`❌ Error loading event ${file}:`, error.message);
    }
}

// Bot ready event
client.once('ready', async () => {
    console.log(`🏴‍☠️ ${client.user.tag} is ready to sail the Grand Line!`);
    console.log(`📊 Serving ${client.guilds.cache.size} server(s)`);
    console.log(`👥 Connected to ${client.users.cache.size} user(s)`);
    
    try {
        // Initialize database with timeout
        console.log('🗄️ Initializing database...');
        const DatabaseManager = require('./src/database/manager');
        await Promise.race([
            DatabaseManager.initializeDatabase(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database init timeout')), 30000))
        ]);
        console.log('✅ Database initialized successfully!');
        
        // Initialize economy system
        console.log('💰 Initializing economy system...');
        const EconomySystem = require('./src/systems/economy');
        await EconomySystem.initialize();
        console.log('✅ Economy system initialized!');
        
        // Initialize level system
        console.log('⭐ Initializing level system...');
        const LevelSystem = require('./src/systems/levels');
        await LevelSystem.initialize(client);
        console.log('✅ Level system initialized!');
        
        // Initialize automatic income with delay
        setTimeout(async () => {
            try {
                console.log('⏰ Initializing automatic income...');
                const AutoIncomeSystem = require('./src/systems/auto-income');
                await AutoIncomeSystem.initialize(client);
                console.log('✅ Automatic income system started!');
            } catch (error) {
                console.error('❌ Auto income initialization failed:', error.message);
            }
        }, 5000); // 5 second delay
        
    } catch (error) {
        console.error('❌ Initialization failed:', error.message);
        console.log('🔄 Bot will continue without some features...');
    }
    
    // Register slash commands with retry logic
    await registerSlashCommands(client);

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

    console.log('\n🎉 SYSTEM STARTUP COMPLETE! 🎉');
    console.log('===============================');
    console.log('🏴‍☠️ One Piece Devil Fruit Gacha Bot v3.0');
    console.log('💰 Economy System: ACTIVE');
    console.log('⏰ Auto Income: Every 10 minutes');
    console.log('🍈 Devil Fruits: 150 available');
    console.log('⚡ Element System: 50+ elements');
    console.log('📊 Level System: Role-based CP');
    console.log('🔄 Duplicates: +1% CP per duplicate');
    console.log('🎮 Commands: pull, income, collection, stats, leaderboard, info');
    console.log('⚔️ Enhanced Turn-Based PvP: ACTIVE');
    console.log('===============================\n');

    // Memory monitoring
    setInterval(() => {
        const used = process.memoryUsage();
        const memoryMB = Math.round(used.heapUsed / 1024 / 1024);
        if (memoryMB > 400) { // Warning at 400MB
            console.log(`⚠️ High memory usage: ${memoryMB}MB`);
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
                console.log('🧹 Forced garbage collection');
            }
        }
    }, 60000); // Check every minute
});

// Register slash commands with retry
async function registerSlashCommands(client, retries = 3) {
    try {
        console.log('🔄 Registering slash commands...');
        
        const commands = [];
        for (const command of client.commands.values()) {
            if (command.data && typeof command.data.toJSON === 'function') {
                commands.push(command.data.toJSON());
            }
        }
        
        const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
        const clientId = client.user.id;
        
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );
        
        console.log(`✅ Successfully registered ${commands.length} slash commands!`);
        console.log(`📝 Commands: ${commands.map(cmd => `/${cmd.name}`).join(', ')}`);
        
    } catch (error) {
        console.error('❌ Failed to register slash commands:', error.message);
        
        if (retries > 0) {
            console.log(`🔄 Retrying command registration... (${retries} attempts left)`);
            setTimeout(() => registerSlashCommands(client, retries - 1), 5000);
        } else {
            console.log('💡 Commands may not work until manually registered!');
        }
    }
}

// Enhanced error handling for Discord client
client.on('error', (error) => {
    console.error('🚨 Discord client error:', error.message);
});

client.on('warn', (warning) => {
    console.warn('⚠️ Discord client warning:', warning);
});

client.on('disconnect', () => {
    console.log('📡 Discord client disconnected');
});

client.on('reconnecting', () => {
    console.log('🔄 Discord client reconnecting...');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT. Graceful shutdown...');
    
    try {
        // Stop auto income
        const AutoIncomeSystem = require('./src/systems/auto-income');
        AutoIncomeSystem.stop();
        
        // Close database
        const DatabaseManager = require('./src/database/manager');
        await DatabaseManager.close();
        
        // Destroy client
        client.destroy();
        console.log('✅ Graceful shutdown complete');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
    
    try {
        // Quick cleanup
        if (client) {
            client.destroy();
        }
        console.log('✅ Emergency shutdown complete');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error during emergency shutdown:', error.message);
        process.exit(1);
    }
});

// Login to Discord with retry logic
async function loginWithRetry(retries = 3) {
    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error('❌ Failed to login to Discord:', error.message);
        
        if (retries > 0) {
            console.log(`🔄 Retrying login... (${retries} attempts left)`);
            setTimeout(() => loginWithRetry(retries - 1), 5000);
        } else {
            console.error('💀 Login failed permanently. Check your token!');
            process.exit(1);
        }
    }
}

// Start the bot
loginWithRetry();
