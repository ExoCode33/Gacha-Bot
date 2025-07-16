// index.js - One Piece Devil Fruit Gacha Bot v3.0
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('node:fs');
const path = require('node:path');

// Load environment variables
require('dotenv').config();

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Initialize commands collection
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
        console.log(`⚠️ Command at ${filePath} is missing "data" or "execute" property.`);
    }
}

// Load events
const eventsPath = path.join(__dirname, 'src', 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`✅ Loaded event: ${event.name}`);
}

// Bot ready event
client.once('ready', async () => {
    console.log(`🏴‍☠️ ${client.user.tag} is ready to sail the Grand Line!`);
    console.log(`📊 Serving ${client.guilds.cache.size} server(s)`);
    console.log(`👥 Connected to ${client.users.cache.size} user(s)`);
    
    try {
        // Initialize database
        const DatabaseManager = require('./src/database/manager');
        await DatabaseManager.initializeDatabase();
        console.log('🗄️ Database initialized successfully!');
        
        // Initialize economy system
        const EconomySystem = require('./src/systems/economy');
        await EconomySystem.initialize();
        console.log('💰 Economy system initialized!');
        
        // Initialize level system
        const LevelSystem = require('./src/systems/levels');
        await LevelSystem.initialize(client);
        console.log('⭐ Level system initialized!');
        
        // Initialize automatic income
        const AutoIncomeSystem = require('./src/systems/auto-income');
        await AutoIncomeSystem.initialize(client);
        console.log('⏰ Automatic income system started!');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        process.exit(1);
    }
    
    // Register slash commands
    try {
        console.log('🔄 Registering slash commands...');
        
        const commands = [];
        for (const command of client.commands.values()) {
            commands.push(command.data.toJSON());
        }
        
        const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
        
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        
        console.log('✅ Successfully registered slash commands!');
        console.log(`📝 Commands: ${commands.map(cmd => `/${cmd.name}`).join(', ')}`);
        
    } catch (error) {
        console.error('❌ Failed to register slash commands:', error);
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
    console.log('===============================\n');
});

// Error handling
client.on('error', console.error);

process.on('unhandledRejection', (error) => {
    console.error('🚨 Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught exception:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT. Graceful shutdown...');
    
    try {
        const AutoIncomeSystem = require('./src/systems/auto-income');
        AutoIncomeSystem.stop();
        
        const DatabaseManager = require('./src/database/manager');
        await DatabaseManager.close();
        
        client.destroy();
        console.log('✅ Graceful shutdown complete');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Failed to login to Discord:', error);
    process.exit(1);
});
