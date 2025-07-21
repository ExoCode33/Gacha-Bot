// test-bot.js - Minimal version to test what's causing the crash
const { Client, GatewayIntentBits, Events } = require('discord.js');
require('dotenv').config();

console.log('🔍 Starting minimal test bot...');
console.log('📝 Environment check:');
console.log('- BOT_TOKEN exists:', !!process.env.BOT_TOKEN);
console.log('- BOT_TOKEN length:', process.env.BOT_TOKEN ? process.env.BOT_TOKEN.length : 0);

// Test basic Discord.js import
try {
    console.log('✅ Discord.js imported successfully');
    console.log('📦 Discord.js version:', require('discord.js').version);
} catch (error) {
    console.error('❌ Discord.js import failed:', error);
    process.exit(1);
}

// Test environment variables
if (!process.env.BOT_TOKEN) {
    console.error('❌ BOT_TOKEN not found in environment variables');
    process.exit(1);
}

// Create basic client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

console.log('✅ Discord client created');

// Test file imports one by one
console.log('🔍 Testing file imports...');

// Test database manager
try {
    const DatabaseManager = require('./src/database/manager');
    console.log('✅ Database manager imported successfully');
} catch (error) {
    console.error('❌ Database manager import failed:', error);
}

// Test PvP system
try {
    const EnhancedTurnBasedPvP = require('./src/systems/pvp/enhanced-turn-based-pvp');
    console.log('✅ PvP system imported successfully');
    
    const pvpSystem = new EnhancedTurnBasedPvP();
    console.log('✅ PvP system instantiated successfully');
} catch (error) {
    console.error('❌ PvP system import/instantiation failed:', error);
    console.error('📍 Error details:', error.message);
    console.error('📍 Stack trace:', error.stack);
}

// Basic event handlers
client.once(Events.Ready, () => {
    console.log(`🤖 Test bot ready! Logged in as ${client.user.tag}`);
    console.log('✅ Bot started successfully - the issue is not with basic startup');
});

client.on('error', error => {
    console.error('❌ Discord client error:', error);
});

// Test slash command interaction
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    console.log(`📝 Test command received: ${interaction.commandName}`);
    
    try {
        await interaction.reply({
            content: `✅ Test bot is working! Command: ${interaction.commandName}`,
            ephemeral: true
        });
    } catch (error) {
        console.error('❌ Error responding to interaction:', error);
    }
});

// Error handling
process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('❌ Uncaught exception:', error);
});

process.on('SIGTERM', () => {
    console.log('🔄 Received SIGTERM - shutting down...');
    client.destroy();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Received SIGINT - shutting down...');
    client.destroy();
    process.exit(0);
});

// Login
console.log('🔐 Attempting to login...');
client.login(process.env.BOT_TOKEN)
    .then(() => {
        console.log('✅ Login successful');
    })
    .catch(error => {
        console.error('❌ Login failed:', error);
        process.exit(1);
    });
