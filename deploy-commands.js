// deploy-commands.js - Create this file in your project root
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

// Define your commands with proper subcommands - INCLUDING ALL EXISTING COMMANDS
const commands = [
    {
        name: 'pvp',
        description: 'PvP battle system',
        options: [
            {
                name: 'challenge',
                description: 'Challenge a specific user to battle',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'user',
                        description: 'The user to challenge',
                        type: 6, // USER type
                        required: true
                    }
                ]
            },
            {
                name: 'queue',
                description: 'Join or leave the PvP matchmaking queue',
                type: 1 // SUB_COMMAND
            },
            {
                name: 'quick',
                description: 'Quick match - find any available opponent',
                type: 1 // SUB_COMMAND
            },
            {
                name: 'queue-status',
                description: 'Check current PvP queue status',
                type: 1 // SUB_COMMAND
            }
        ]
    },
    {
        name: 'balance',
        description: 'Check your balance and devil fruit stats'
    },
    {
        name: 'inventory',
        description: 'View your inventory and items'
    },
    {
        name: 'daily',
        description: 'Claim your daily rewards'
    },
    {
        name: 'gacha',
        description: 'Use the gacha system to get devil fruits'
    },
    {
        name: 'pull',
        description: 'Pull from the gacha system (same as gacha)'
    },
    {
        name: 'income',
        description: 'Check your income sources and earnings'
    },
    {
        name: 'leaderboard',
        description: 'View server leaderboards and rankings',
        options: [
            {
                name: 'type',
                description: 'Which leaderboard to show',
                type: 3, // STRING
                required: false,
                choices: [
                    {
                        name: 'coins',
                        value: 'coins'
                    },
                    {
                        name: 'pvp',
                        value: 'pvp'
                    },
                    {
                        name: 'level',
                        value: 'level'
                    },
                    {
                        name: 'all',
                        value: 'all'
                    }
                ]
            }
        ]
    },
    {
        name: 'queue',
        description: 'Check PvP queue status (shortcut command)'
    },
    {
        name: 'help',
        description: 'Show available commands and how to use them'
    },
    // Add any other commands you have
    {
        name: 'profile',
        description: 'View your or another user\'s profile',
        options: [
            {
                name: 'user',
                description: 'User to view profile of',
                type: 6, // USER
                required: false
            }
        ]
    },
    {
        name: 'shop',
        description: 'View and purchase items from the shop'
    },
    {
        name: 'work',
        description: 'Work to earn coins'
    },
    {
        name: 'claim',
        description: 'Claim various rewards'
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
            console.log(`- /${cmd.name}${cmd.options ? ' (with subcommands)' : ''}`);
            if (cmd.options && cmd.options.some(opt => opt.type === 1)) {
                cmd.options.filter(opt => opt.type === 1).forEach(sub => {
                    console.log(`  └─ /${cmd.name} ${sub.name}`);
                });
            }
        });
        
        console.log('\n🎉 Command deployment complete!');
        console.log('💡 You can now use these commands in Discord.');
        
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
        
        if (error.code === 50001) {
            console.log('💡 This error usually means the CLIENT_ID is incorrect.');
            console.log('📝 Get your CLIENT_ID from Discord Developer Portal > General Information > Application ID');
        } else if (error.code === 40001) {
            console.log('💡 This error usually means the DISCORD_TOKEN is incorrect.');
            console.log('📝 Get your token from Discord Developer Portal > Bot > Token');
        }
    }
})();
