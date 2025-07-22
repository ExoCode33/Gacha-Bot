// deploy-commands.js - FIXED to match enhanced-pvp.js structure
const { REST, Routes } = require('discord.js');
require('dotenv').config();

// Your bot's client ID and token from Discord Developer Portal
const clientId = process.env.CLIENT_ID;
const token = process.env.DISCORD_TOKEN;

console.log('🔍 Environment check:');
console.log('- CLIENT_ID exists:', !!clientId);
console.log('- DISCORD_TOKEN exists:', !!token);

if (!clientId || !token) {
    console.error('❌ Missing CLIENT_ID or DISCORD_TOKEN in environment variables');
    process.exit(1);
}

// FIXED: Commands matching your enhanced-pvp.js file (NO CHALLENGE SUBCOMMAND)
const commands = [
    {
        name: 'pvp',
        description: '⚔️ Enhanced turn-based PvP battle system',
        options: [
            {
                name: 'queue',
                description: 'Join the PvP matchmaking queue for battles',
                type: 1 // SUB_COMMAND
            },
            {
                name: 'quick',
                description: 'Quick match - find any available opponent',
                type: 1 // SUB_COMMAND
            },
            {
                name: 'queue-status',
                description: 'Check current PvP queue status and active battles',
                type: 1 // SUB_COMMAND
            },
            {
                name: 'leave-queue',
                description: 'Leave the matchmaking queue',
                type: 1 // SUB_COMMAND
            },
            {
                name: 'stats',
                description: 'View your PvP battle statistics',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'user',
                        description: 'View another user\'s PvP stats',
                        type: 6, // USER
                        required: false
                    }
                ]
            },
            {
                name: 'system-info',
                description: 'View PvP system information and status',
                type: 1 // SUB_COMMAND
            }
        ]
    },
    {
        name: 'pull',
        description: '🎰 Hunt for Devil Fruits with animated gacha pulls',
        options: [
            {
                name: 'count',
                description: 'Number of pulls to make',
                type: 4, // INTEGER
                required: false,
                choices: [
                    { name: '1x Pull', value: 1 },
                    { name: '10x Pull', value: 10 }
                ]
            }
        ]
    },
    {
        name: 'collection',
        description: '🍈 View Devil Fruit collection and stats',
        options: [
            {
                name: 'user',
                description: 'View another user\'s collection',
                type: 6, // USER
                required: false
            },
            {
                name: 'rarity',
                description: 'Filter collection by rarity',
                type: 3, // STRING
                required: false,
                choices: [
                    { name: '🟫 Common', value: 'common' },
                    { name: '🟩 Uncommon', value: 'uncommon' },
                    { name: '🟦 Rare', value: 'rare' },
                    { name: '🟪 Epic', value: 'epic' },
                    { name: '🟨 Legendary', value: 'legendary' },
                    { name: '🟧 Mythical', value: 'mythical' },
                    { name: '🌈 Omnipotent', value: 'omnipotent' }
                ]
            }
        ]
    },
    {
        name: 'balance',
        description: '💰 Check your berries, level, and CP stats'
    },
    {
        name: 'stats',
        description: '📊 View detailed pirate statistics and progress',
        options: [
            {
                name: 'user',
                description: 'View another user\'s stats',
                type: 6, // USER
                required: false
            }
        ]
    },
    {
        name: 'income',
        description: '💰 Collect your manual berry income bonus (hourly cooldown)'
    },
    {
        name: 'leaderboard',
        description: '🏆 View server leaderboards and rankings',
        options: [
            {
                name: 'type',
                description: 'Which leaderboard to show',
                type: 3, // STRING
                required: false,
                choices: [
                    { name: '🔥 Combat Power (CP)', value: 'cp' },
                    { name: '💰 Berries', value: 'berries' },
                    { name: '🍈 Fruit Collection', value: 'fruits' },
                    { name: '⭐ Level', value: 'level' }
                ]
            }
        ]
    },
    {
        name: 'info',
        description: 'ℹ️ Get information about game mechanics and features',
        options: [
            {
                name: 'topic',
                description: 'What would you like to know about?',
                type: 3, // STRING
                required: false,
                choices: [
                    { name: 'Game Overview', value: 'overview' },
                    { name: 'Devil Fruits', value: 'fruits' },
                    { name: 'Rarity Rates', value: 'rates' },
                    { name: 'Level System', value: 'levels' },
                    { name: 'Economy', value: 'economy' },
                    { name: 'Elements', value: 'elements' },
                    { name: 'Commands', value: 'commands' }
                ]
            }
        ]
    },
    {
        name: 'help',
        description: '📖 Show all available commands and how to use them'
    },
    {
        name: 'debug-queue',
        description: '🤖 Debug PvP system and create test opponents',
        default_member_permissions: '8', // Administrator only
        options: [
            {
                name: 'action',
                description: 'Debug action to perform',
                type: 3,
                required: false,
                choices: [
                    { name: '🤖 Create Test Bot', value: 'create-bot' },
                    { name: '📊 System Status', value: 'status' },
                    { name: '🧹 Clear Queue', value: 'clear-queue' },
                    { name: '🍈 Add Test Fruits', value: 'add-fruits' },
                    { name: '👥 Show User Data', value: 'user-data' }
                ]
            },
            {
                name: 'bot-type',
                description: 'Type of bot to create',
                type: 3,
                required: false,
                choices: [
                    { name: '🤖 Easy Bot', value: 'easy' },
                    { name: '⚔️ Medium Bot', value: 'medium' },
                    { name: '🔥 Hard Bot', value: 'hard' },
                    { name: '💀 Boss Bot', value: 'boss' }
                ]
            },
            {
                name: 'user',
                description: 'Target user for debug actions',
                type: 6,
                required: false
            }
        ]
    }
];

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// Deploy commands
(async () => {
    try {
        console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);

        // For global commands (recommended for production):
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
        
        // Show the commands that were registered
        console.log('\n📋 Registered commands:');
        data.forEach(cmd => {
            console.log(`- /${cmd.name}${cmd.options ? ' (with subcommands/options)' : ''}`);
            if (cmd.options && cmd.options.some(opt => opt.type === 1)) {
                cmd.options.filter(opt => opt.type === 1).forEach(sub => {
                    console.log(`  └─ /${cmd.name} ${sub.name}`);
                });
            }
        });
        
        console.log('\n🎉 Command deployment complete!');
        console.log('✅ IMPORTANT: No /pvp challenge command - only queue commands available');
        console.log('🔧 Available PvP commands:');
        console.log('   - /pvp queue');
        console.log('   - /pvp queue-status'); 
        console.log('   - /pvp leave-queue');
        console.log('   - /pvp stats');
        console.log('   - /pvp system-info');
        console.log('🤖 Debug: /debug-queue action:Create Test Bot');
        
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
        
        if (error.code === 50001) {
            console.log('💡 This error usually means the CLIENT_ID is incorrect.');
        } else if (error.code === 40001) {
            console.log('💡 This error usually means the DISCORD_TOKEN is incorrect.');
        }
    }
})();
