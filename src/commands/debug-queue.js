// src/commands/debug-queue.js - UPDATED to work with enhanced PvP system
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const DatabaseManager = require('../database/manager');
const { getRandomFruit, getRarityEmoji } = require('../data/devil-fruits');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug-queue')
        .setDescription('🤖 Debug PvP system and create test opponents')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Debug action to perform')
                .setRequired(false)
                .addChoices(
                    { name: '🤖 Create Test Bot', value: 'create-bot' },
                    { name: '📊 System Status', value: 'status' },
                    { name: '🧹 Clear Queue', value: 'clear-queue' },
                    { name: '🍈 Add Test Fruits', value: 'add-fruits' },
                    { name: '👥 Show User Data', value: 'user-data' }
                ))
        .addStringOption(option =>
            option.setName('bot-type')
                .setDescription('Type of bot to create and challenge')
                .setRequired(false)
                .addChoices(
                    { name: '🤖 Easy Bot', value: 'easy' },
                    { name: '⚔️ Medium Bot', value: 'medium' },
                    { name: '🔥 Hard Bot', value: 'hard' },
                    { name: '💀 Boss Bot', value: 'boss' }
                ))
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Bot level (1-50)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(50))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Target user for debug actions')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Check admin permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ You need administrator permissions to use this debug command!',
                    ephemeral: true
                });
            }

            const action = interaction.options.getString('action') || 'create-bot';
            const botType = interaction.options.getString('bot-type') || 'medium';
            const level = interaction.options.getInteger('level') || this.getDefaultLevel(botType);
            const targetUser = interaction.options.getUser('user') || interaction.user;

            switch (action) {
                case 'create-bot':
                    await this.createTestBot(interaction, botType, level);
                    break;
                case 'status':
                    await this.showSystemStatus(interaction);
                    break;
                case 'clear-queue':
                    await this.clearQueue(interaction);
                    break;
                case 'add-fruits':
                    await this.addTestFruits(interaction, targetUser);
                    break;
                case 'user-data':
                    await this.showUserData(interaction, targetUser);
                    break;
                default:
                    await this.createTestBot(interaction, botType, level);
            }

        } catch (error) {
            console.error('Error in debug-queue command:', error);
            await interaction.reply({
                content: `❌ Debug command failed: ${error.message}`,
                ephemeral: true
            });
        }
    },

    async createTestBot(interaction, botType, level) {
        // Check if Enhanced PvP system is available
        if (!interaction.client.pvpSystem) {
            return interaction.reply({
                content: '❌ Enhanced PvP system not available! Make sure it\'s properly loaded in index.js.',
                ephemeral: true
            });
        }

        // Create bot data
        const botData = await this.createBotData(botType, level, interaction.guild.id);
        
        // Create bot in database
        await this.createBotInDatabase(botData);

        // First, reply to acknowledge the command
        const initialEmbed = new EmbedBuilder()
            .setTitle('🤖 Creating Test Bot and Starting Battle...')
            .setDescription(`Creating **${botData.username}** and immediately challenging it to PvP!`)
            .addFields([
                { name: '🤖 Bot Type', value: this.getBotTypeDisplay(botType), inline: true },
                { name: '⭐ Level', value: level.toString(), inline: true },
                { name: '💎 Total CP', value: botData.totalCP.toLocaleString(), inline: true },
                { name: '🍈 Devil Fruits', value: botData.fruits.length.toString(), inline: true },
                { name: '🎯 Strategy', value: 'Direct challenge bypass (no queue needed)', inline: false }
            ])
            .setColor(this.getBotTypeColor(botType))
            .setFooter({ text: 'Starting enhanced turn-based battle in 3 seconds...' })
            .setTimestamp();

        await interaction.reply({ embeds: [initialEmbed] });

        // Create a mock user object for the bot
        const botUserObj = {
            id: botData.userId,
            username: botData.username,
            bot: true // Mark as bot so PvP system knows
        };

        // Wait a moment, then start the challenge
        setTimeout(async () => {
            try {
                console.log(`🎯 Starting direct PvP challenge: ${interaction.user.username} vs ${botData.username}`);
                console.log(`🤖 Bot details: ID=${botData.userId}, CP=${botData.totalCP}, Fruits=${botData.fruits.length}`);
                
                // Store bot data globally so the PvP system can auto-accept for bots
                if (!global.debugBots) {
                    global.debugBots = new Map();
                }
                global.debugBots.set(botData.userId, {
                    ...botData,
                    autoAccept: true,
                    isDebugBot: true
                });
                
                console.log(`🤖 Stored debug bot ${botData.userId} for auto-accept`);
                
                // Use the enhanced PvP system to initiate battle directly
                await interaction.client.pvpSystem.initiateBattle(interaction, botUserObj);
                
                console.log(`✅ Direct PvP challenge initiated successfully`);
            } catch (error) {
                console.error('Error starting direct challenge:', error);
                
                // Send error message as follow-up
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Challenge Failed')
                    .setDescription(`Failed to start battle against **${botData.username}**.`)
                    .addFields([
                        { name: '🔧 Error Details', value: error.message || 'Unknown error', inline: false },
                        { name: '💡 What Happened', value: 'The bot was created successfully but the PvP challenge failed to start.', inline: false },
                        { name: '🎮 Manual Alternative', value: `The bot is in the database. Try \`/pvp challenge\` and look for a user that matches the bot name.`, inline: false }
                    ])
                    .setColor('#FF0000')
                    .setTimestamp();

                await interaction.followUp({ embeds: [errorEmbed] });
            }
        }, 3000); // 3 second delay to avoid interaction conflicts
    },

    async showSystemStatus(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🔧 PvP System Debug Status')
            .setTimestamp();

        try {
            // Check PvP system availability
            const pvpAvailable = !!interaction.client.pvpSystem;
            const pvpStats = pvpAvailable ? interaction.client.pvpSystem.getBattleStats() : null;

            // Check queue system
            let queueStatus = null;
            try {
                const PvPQueueSystem = require('../systems/pvp/pvp-queue-system');
                queueStatus = PvPQueueSystem.getQueueStatus();
            } catch (error) {
                console.error('Queue system not available:', error);
            }

            // Check database
            let dbStatus = 'Unknown';
            let userCount = 0;
            try {
                if (DatabaseManager) {
                    const stats = await DatabaseManager.getServerStats();
                    userCount = stats.totalUsers;
                    dbStatus = 'Connected';
                }
            } catch (error) {
                dbStatus = 'Error';
            }

            embed.addFields([
                {
                    name: '🎮 PvP System',
                    value: [
                        `**Status**: ${pvpAvailable ? '✅ Available' : '❌ Not Available'}`,
                        `**Active Battles**: ${pvpStats ? pvpStats.activeBattles : 'N/A'}`,
                        `**System Type**: Enhanced Turn-Based`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '👥 Queue System',
                    value: [
                        `**Status**: ${queueStatus ? '✅ Available' : '❌ Not Available'}`,
                        `**Players in Queue**: ${queueStatus ? queueStatus.queueSize : 'N/A'}`,
                        `**Active Matches**: ${queueStatus ? queueStatus.activeMatches : 'N/A'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '💾 Database',
                    value: [
                        `**Status**: ${dbStatus}`,
                        `**Total Users**: ${userCount}`,
                        `**Connection**: ${DatabaseManager ? '✅ Loaded' : '❌ Not Loaded'}`
                    ].join('\n'),
                    inline: true
                }
            ]);

            if (queueStatus && queueStatus.queuedPlayers.length > 0) {
                const queueList = queueStatus.queuedPlayers
                    .slice(0, 5)
                    .map((player, index) => `${index + 1}. ${player.username}`)
                    .join('\n');

                embed.addFields([{
                    name: '📋 Current Queue',
                    value: queueList,
                    inline: false
                }]);
            }

        } catch (error) {
            embed.setDescription(`❌ Error gathering system status: ${error.message}`);
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async clearQueue(interaction) {
        try {
            const PvPQueueSystem = require('../systems/pvp/pvp-queue-system');
            
            // Get current queue status
            const beforeStatus = PvPQueueSystem.getQueueStatus();
            
            // Clear the queue by removing all players
            beforeStatus.queuedPlayers.forEach(player => {
                PvPQueueSystem.leaveQueue(player.userId);
            });

            const afterStatus = PvPQueueSystem.getQueueStatus();

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🧹 Queue Cleared')
                .setDescription('PvP queue has been cleared successfully!')
                .addFields([
                    { name: '📊 Before', value: `${beforeStatus.queueSize} players`, inline: true },
                    { name: '📊 After', value: `${afterStatus.queueSize} players`, inline: true },
                    { name: '🔧 Admin', value: interaction.user.username, inline: true }
                ])
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            console.log(`🧹 Admin ${interaction.user.username} cleared PvP queue`);

        } catch (error) {
            await interaction.reply({
                content: `❌ Failed to clear queue: ${error.message}`,
                ephemeral: true
            });
        }
    },

    async addTestFruits(interaction, targetUser) {
        try {
            if (!DatabaseManager) {
                return interaction.reply({
                    content: '❌ Database system not available!',
                    ephemeral: true
                });
            }

            // Ensure user exists
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);

            // Add test fruits using proper database method
            const testFruits = [
                { name: 'Gomu Gomu no Mi', rarity: 'legendary', type: 'Paramecia', multiplier: 6.5 },
                { name: 'Mera Mera no Mi', rarity: 'legendary', type: 'Logia', multiplier: 7.0 },
                { name: 'Hie Hie no Mi', rarity: 'legendary', type: 'Logia', multiplier: 6.8 },
                { name: 'Ope Ope no Mi', rarity: 'mythical', type: 'Paramecia', multiplier: 8.5 },
                { name: 'Gura Gura no Mi', rarity: 'omnipotent', type: 'Paramecia', multiplier: 11.0 }
            ];

            for (const fruit of testFruits) {
                await this.addSingleFruit(targetUser.id, fruit);
            }

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🍈 Test Fruits Added')
                .setDescription(`Added ${testFruits.length} test Devil Fruits to ${targetUser.username}`)
                .addFields([
                    {
                        name: '🎯 Added Fruits',
                        value: testFruits.map(f => `• ${f.name} (${f.rarity})`).join('\n'),
                        inline: false
                    },
                    { name: '👤 Target User', value: targetUser.username, inline: true },
                    { name: '🔧 Admin', value: interaction.user.username, inline: true }
                ])
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            console.log(`🍈 Admin ${interaction.user.username} added test fruits to ${targetUser.username}`);

        } catch (error) {
            await interaction.reply({
                content: `❌ Failed to add test fruits: ${error.message}`,
                ephemeral: true
            });
        }
    },

    async showUserData(interaction, targetUser) {
        try {
            if (!DatabaseManager) {
                return interaction.reply({
                    content: '❌ Database system not available!',
                    ephemeral: true
                });
            }

            // Get user data
            const userData = await DatabaseManager.getUser(targetUser.id);
            const userFruits = await DatabaseManager.getUserDevilFruits(targetUser.id);

            const embed = new EmbedBuilder()
                .setColor(0x9932CC)
                .setTitle(`🔍 User Debug Data - ${targetUser.username}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            if (!userData) {
                embed.setDescription('❌ User not found in database!');
            } else {
                embed.addFields([
                    {
                        name: '👤 Basic Info',
                        value: [
                            `**User ID**: ${targetUser.id}`,
                            `**Username**: ${targetUser.username}`,
                            `**Level**: ${userData.level || 0}`,
                            `**Registered**: ${userData.created_at ? new Date(userData.created_at).toLocaleDateString() : 'Unknown'}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '💎 Combat Stats',
                        value: [
                            `**Base CP**: ${userData.base_cp?.toLocaleString() || 0}`,
                            `**Total CP**: ${userData.total_cp?.toLocaleString() || 0}`,
                            `**Berries**: ${userData.berries?.toLocaleString() || 0}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🍈 Collection',
                        value: [
                            `**Total Fruits**: ${userFruits.length}`,
                            `**Unique Fruits**: ${new Set(userFruits.map(f => f.fruit_name)).size}`,
                            `**PvP Ready**: ${userFruits.length >= 5 ? '✅ Yes' : '❌ No'}`
                        ].join('\n'),
                        inline: true
                    }
                ]);

                if (userFruits.length > 0) {
                    const topFruits = userFruits
                        .slice(0, 5)
                        .map(f => `• ${f.fruit_name} (${f.fruit_rarity})`)
                        .join('\n');

                    embed.addFields([{
                        name: '🔝 Top Fruits',
                        value: topFruits,
                        inline: false
                    }]);
                }
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            await interaction.reply({
                content: `❌ Failed to get user data: ${error.message}`,
                ephemeral: true
            });
        }
    },

    // Helper methods from original debug-queue.js
    async createBotData(botType, level, guildId) {
        const botId = `debug_bot_${botType}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const botName = this.getBotName(botType);
        
        // Generate fruits based on bot type
        const fruits = this.generateBotFruits(botType, level);
        const totalCP = this.calculateTotalCP(level, fruits);

        return {
            userId: botId,
            username: botName,
            level: level,
            totalCP: totalCP,
            balancedCP: Math.floor(totalCP * 0.8),
            fruits: fruits,
            isDebugBot: true,
            botType: botType,
            guildId: guildId
        };
    },

    async createBotInDatabase(botData) {
        try {
            // Create user entry
            await DatabaseManager.ensureUser(botData.userId, botData.username, botData.guildId);
            
            // Update user stats
            await DatabaseManager.query(`
                UPDATE users 
                SET level = $1, base_cp = $2, total_cp = $3, berries = $4, updated_at = NOW()
                WHERE user_id = $5
            `, [botData.level, botData.balancedCP, botData.totalCP, 25000, botData.userId]);

            // Add fruits to database
            for (let i = 0; i < botData.fruits.length; i++) {
                const fruit = botData.fruits[i];
                await this.addSingleFruit(botData.userId, fruit, i);
            }

            console.log(`✅ Bot ${botData.username} created in database with ${botData.fruits.length} fruits`);
        } catch (error) {
            console.error('Error creating bot in database:', error);
            throw error;
        }
    },

    async addSingleFruit(userId, fruit, index = 0) {
        try {
            // Truncate strings to fit database constraints
            const fruitName = fruit.name.length > 45 ? fruit.name.substring(0, 45) : fruit.name;
            const fruitType = fruit.type.length > 45 ? fruit.type.substring(0, 45) : fruit.type;
            const fruitElement = (fruit.element || 'Unknown').length > 45 ? (fruit.element || 'Unknown').substring(0, 45) : (fruit.element || 'Unknown');
            const fruitPower = `${fruitName} Power`.length > 45 ? `${fruitName} Power`.substring(0, 45) : `${fruitName} Power`;
            const fruitDescription = `A ${fruit.rarity} Devil Fruit`.length > 100 ? 
                `A ${fruit.rarity} Devil Fruit`.substring(0, 100) : 
                `A ${fruit.rarity} Devil Fruit`;
            
            // Create shorter fruit ID
            const shortFruitId = `test_${index}_${Date.now().toString().slice(-6)}`;
            
            await DatabaseManager.query(`
                INSERT INTO user_devil_fruits (
                    user_id, fruit_id, fruit_name, fruit_type, fruit_rarity, 
                    fruit_element, fruit_fruit_type, fruit_power, fruit_description,
                    base_cp, total_cp, duplicate_count, obtained_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
            `, [
                userId,
                shortFruitId,
                fruitName,
                fruitType,
                fruit.rarity,
                fruitElement,
                fruitType,
                fruitPower,
                fruitDescription,
                fruit.cp || Math.floor((fruit.multiplier || 1.0) * 100),
                fruit.cp || Math.floor((fruit.multiplier || 1.0) * 100),
                1
            ]);
        } catch (error) {
            console.error('Error adding single fruit:', error);
            throw error;
        }
    },

    // Helper methods from original
    generateBotFruits(botType, level) {
        const fruitTemplates = {
            easy: [
                { name: 'Kilo Kilo no Mi', type: 'Paramecia', rarity: 'common', element: 'Weight' },
                { name: 'Bane Bane no Mi', type: 'Paramecia', rarity: 'uncommon', element: 'Spring' },
                { name: 'Supa Supa no Mi', type: 'Paramecia', rarity: 'rare', element: 'Blade' },
                { name: 'Ori Ori no Mi', type: 'Paramecia', rarity: 'rare', element: 'Bind' },
                { name: 'Noro Noro no Mi', type: 'Paramecia', rarity: 'uncommon', element: 'Slow' }
            ],
            medium: [
                { name: 'Bomu Bomu no Mi', type: 'Paramecia', rarity: 'rare', element: 'Explosion' },
                { name: 'Doru Doru no Mi', type: 'Paramecia', rarity: 'rare', element: 'Wax' },
                { name: 'Baku Baku no Mi', type: 'Paramecia', rarity: 'epic', element: 'Eat' },
                { name: 'Mane Mane no Mi', type: 'Paramecia', rarity: 'epic', element: 'Clone' },
                { name: 'Suna Suna no Mi', type: 'Logia', rarity: 'legendary', element: 'Sand' }
            ],
            hard: [
                { name: 'Mera Mera no Mi', type: 'Logia', rarity: 'legendary', element: 'Fire' },
                { name: 'Hie Hie no Mi', type: 'Logia', rarity: 'legendary', element: 'Ice' },
                { name: 'Goro Goro no Mi', type: 'Logia', rarity: 'legendary', element: 'Lightning' },
                { name: 'Ope Ope no Mi', type: 'Paramecia', rarity: 'mythical', element: 'Room' },
                { name: 'Hobi Hobi no Mi', type: 'Paramecia', rarity: 'mythical', element: 'Toy' }
            ],
            boss: [
                { name: 'Gomu Gomu no Mi', type: 'Mythical Zoan', rarity: 'omnipotent', element: 'Liberation' },
                { name: 'Gura Gura no Mi', type: 'Paramecia', rarity: 'omnipotent', element: 'Tremor' },
                { name: 'Yami Yami no Mi', type: 'Logia', rarity: 'omnipotent', element: 'Darkness' },
                { name: 'Pika Pika no Mi', type: 'Logia', rarity: 'mythical', element: 'Light' },
                { name: 'Magu Magu no Mi', type: 'Logia', rarity: 'mythical', element: 'Magma' }
            ]
        };

        const templates = fruitTemplates[botType] || fruitTemplates.medium;
        const fruits = [];

        templates.forEach(template => {
            const cp = this.calculateFruitCP(template.rarity, level);
            const multiplier = this.getRarityMultiplier(template.rarity);
            fruits.push({ ...template, cp, multiplier });
        });

        return fruits;
    },

    calculateTotalCP(level, fruits) {
        const baseCP = 100 + (level * 15);
        const fruitCP = fruits.reduce((sum, fruit) => sum + fruit.cp, 0);
        return baseCP + fruitCP;
    },

    calculateFruitCP(rarity, level) {
        const rarityMultipliers = {
            'common': 1.0,
            'uncommon': 1.5,
            'rare': 2.5,
            'epic': 4.0,
            'legendary': 6.0,
            'mythical': 8.0,
            'omnipotent': 10.0
        };

        const baseCP = 100;
        const multiplier = rarityMultipliers[rarity] || 1.0;
        const levelBonus = level * 8;

        return Math.floor((baseCP * multiplier) + levelBonus);
    },

    getRarityMultiplier(rarity) {
        const multipliers = {
            'common': 1.0,
            'uncommon': 1.5,
            'rare': 2.5,
            'epic': 4.0,
            'legendary': 6.0,
            'mythical': 8.0,
            'omnipotent': 10.0
        };
        return multipliers[rarity] || 1.0;
    },

    getDefaultLevel(botType) {
        const defaults = { easy: 15, medium: 25, hard: 35, boss: 45 };
        return defaults[botType] || 25;
    },

    getBotName(botType) {
        const names = {
            easy: 'Rookie Training Bot',
            medium: 'Veteran Sparring Bot', 
            hard: 'Elite Combat Bot',
            boss: 'Legendary Boss Bot'
        };
        return names[botType] || 'Test Bot';
    },

    getBotTypeDisplay(botType) {
        const displays = {
            easy: '🤖 Easy Bot (Beginner-friendly)',
            medium: '⚔️ Medium Bot (Balanced challenge)',
            hard: '🔥 Hard Bot (Strong opponent)',
            boss: '💀 Boss Bot (Legendary difficulty)'
        };
        return displays[botType] || '🤖 Test Bot';
    },

    getBotTypeColor(botType) {
        const colors = {
            easy: 0x00FF00,    // Green
            medium: 0xFFFF00,  // Yellow  
            hard: 0xFF8000,    // Orange
            boss: 0xFF0000     // Red
        };
        return colors[botType] || 0x808080;
    }
};
