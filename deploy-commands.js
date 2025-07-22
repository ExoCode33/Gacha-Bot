// deploy-commands.js - Fixed command deployment with proper PvP subcommands
const { REST, Routes } = require('discord.js');
require('dotenv').config();

// Your bot's client ID and token from Discord Developer Portal
const clientId = process.env.CLIENT_ID; // Your bot's Application ID from Discord Developer Portal
const token = process.env.DISCORD_TOKEN; // Your bot token

console.log('🔍 Environment check:');
console.log('- CLIENT_ID exists:', !!clientId);
console.log('- DISCORD_TOKEN exists:', !!token);

if (!clientId || !token) {
    console.error('❌ Missing CLIENT_ID or DISCORD_TOKEN in environment variables');
    console.log('Make sure your .env file has:');
    console.log('CLIENT_ID=your_application_id_here');
    console.log('DISCORD_TOKEN=your_bot_token_here');
    process.exit(1);
}

// Define your commands with FIXED PvP subcommands
const commands = [
    {
        name: 'pvp',
        description: '⚔️ Enhanced turn-based PvP battle system',
        options: [
            {
                name: 'challenge',
                description: 'Challenge a specific user to turn-based battle',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'opponent',
                        description: 'The user to challenge',
                        type: 6, // USER type
                        required: true
                    }
                ]
            },
            {
                name: 'queue',
                description: 'Join the PvP matchmaking queue for instant battles',
                type: 1 // SUB_COMMAND
            },
            {
                name: 'quick',
                description: 'Quick match - join queue for fast battles',
                type: 1 // SUB_COMMAND
            },
            {
                name: 'queue-status',
                description: 'Check current PvP queue status and active battles',
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
    // Admin commands (if you have them)
    {
        name: 'admin',
        description: '🔧 Administrator commands for server management',
        default_member_permissions: '8', // Administrator permission
        options: [
            {
                name: 'add-berries',
                description: 'Add berries to a user',
                type: 1,
                options: [
                    {
                        name: 'user',
                        description: 'The user to give berries to',
                        type: 6,
                        required: true
                    },
                    {
                        name: 'amount',
                        description: 'Amount of berries to add',
                        type: 4,
                        required: true,
                        min_value: 1,
                        max_value: 10000000
                    }
                ]
            },
            {
                name: 'server-stats',
                description: 'View server statistics',
                type: 1
            },
            {
                name: 'user-info',
                description: 'View detailed user information',
                type: 1,
                options: [
                    {
                        name: 'user',
                        description: 'The user to inspect',
                        type: 6,
                        required: true
                    }
                ]
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
        console.log('💡 You can now use these commands in Discord.');
        console.log('🔧 Make sure to restart your bot to use the new commands.');
        
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
        
        if (error.code === 50001) {
            console.log('💡 This error usually means the CLIENT_ID is incorrect.');
            console.log('📝 Get your CLIENT_ID from Discord Developer Portal > General Information > Application ID');
        } else if (error.code === 40001) {
            console.log('💡 This error usually means the DISCORD_TOKEN is incorrect.');
            console.log('📝 Get your token from Discord Developer Portal > Bot > Token');
        } else if (error.status === 400) {
            console.log('💡 Bad Request - Check your command structure and option types.');
            console.log('📝 Common issues: Invalid option types, missing required fields, or malformed command structure.');
        }
    }
})();
