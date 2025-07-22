// src/commands/debug-queue.js - FIXED to directly challenge instead of queue
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const DatabaseManager = require('../database/manager');
const { getRandomFruit, getRarityEmoji } = require('../data/devil-fruits');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug-queue')
        .setDescription('🤖 Create a test bot and immediately challenge it to PvP')
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

            const botType = interaction.options.getString('bot-type') || 'medium';
            const level = interaction.options.getInteger('level') || this.getDefaultLevel(botType);

            // Check if Enhanced PvP system is available
            if (!interaction.client.pvpSystem) {
                return interaction.reply({
                    content: '❌ Enhanced PvP system not available! Make sure it\'s properly loaded in index.js.',
                    ephemeral: true
                });
            }

            // Create bot data
            const botData = await this.createTestBot(botType, level, interaction.guild.id);
            
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
                    
                    // Auto-accept for the bot after a short delay
                    setTimeout(async () => {
                        try {
                            console.log(`🤖 Auto-accepting challenge for bot ${botData.username}`);
                            
                            // Find the active battle for this bot
                            const activeBattles = interaction.client.pvpSystem.activeBattles;
                            let botBattleId = null;
                            
                            for (const [battleId, battle] of activeBattles.entries()) {
                                if (battle.type === 'invitation' && 
                                    (battle.challenger?.user_id === botData.userId || battle.target?.user_id === botData.userId)) {
                                    botBattleId = battleId;
                                    break;
                                }
                            }
                            
                            if (botBattleId) {
                                console.log(`🤖 Found battle ${botBattleId} for bot auto-accept`);
                                
                                // Simulate bot accepting the challenge
                                const mockBotInteraction = {
                                    customId: `accept_${botBattleId}_${botData.userId}`,
                                    user: { id: botData.userId, username: botData.username },
                                    replied: false,
                                    deferred: false,
                                    update: async (data) => {
                                        console.log(`🤖 Bot ${botData.username} auto-accepted challenge`);
                                        return true;
                                    },
                                    reply: async (data) => {
                                        console.log(`🤖 Bot ${botData.username} auto-replied`);
                                        return true;
                                    },
                                    followUp: async (data) => {
                                        console.log(`🤖 Bot ${botData.username} auto-followed-up`);
                                        return true;
                                    },
                                    editReply: async (data) => {
                                        console.log(`🤖 Bot ${botData.username} auto-edited-reply`);
                                        return true;
                                    }
                                };
                                
                                // Auto-accept for the bot
                                await interaction.client.pvpSystem.handleBattleResponse(mockBotInteraction);
                            } else {
                                console.log(`⚠️ Could not find battle for bot auto-accept`);
                            }
                        } catch (autoAcceptError) {
                            console.error('Error in bot auto-accept:', autoAcceptError);
                        }
                    }, 2000); // Auto-accept after 2 seconds
                    
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

        } catch (error) {
            console.error('Error in debug-queue command:', error);
            await interaction.reply({
                content: `❌ Error creating test bot: ${error.message}`,
                ephemeral: true
            });
        }
    },

    // Create test bot data
    async createTestBot(botType, level, guildId) {
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

    // Create bot in database
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

            // Add fruits to database with proper truncation
            for (let i = 0; i < botData.fruits.length; i++) {
                const fruit = botData.fruits[i];
                
                // Truncate strings to fit database constraints
                const fruitName = fruit.name.length > 45 ? fruit.name.substring(0, 45) : fruit.name;
                const fruitType = fruit.type.length > 45 ? fruit.type.substring(0, 45) : fruit.type;
                const fruitElement = fruit.element.length > 45 ? fruit.element.substring(0, 45) : fruit.element;
                const fruitPower = `${fruitName} Power`.length > 45 ? `${fruitName} Power`.substring(0, 45) : `${fruitName} Power`;
                const fruitDescription = `A ${fruit.rarity} Devil Fruit`.length > 100 ? 
                    `A ${fruit.rarity} Devil Fruit`.substring(0, 100) : 
                    `A ${fruit.rarity} Devil Fruit`;
                
                // Create shorter fruit ID
                const shortFruitId = `bot_${i}_${Date.now().toString().slice(-6)}`;
                
                await DatabaseManager.query(`
                    INSERT INTO user_devil_fruits (
                        user_id, fruit_id, fruit_name, fruit_type, fruit_rarity, 
                        fruit_element, fruit_fruit_type, fruit_power, fruit_description,
                        base_cp, total_cp, duplicate_count, obtained_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
                `, [
                    botData.userId,
                    shortFruitId,
                    fruitName,
                    fruitType,
                    fruit.rarity,
                    fruitElement,
                    fruitType,
                    fruitPower,
                    fruitDescription,
                    fruit.cp,
                    fruit.cp,
                    1
                ]);
            }

            console.log(`✅ Bot ${botData.username} created in database with ${botData.fruits.length} fruits`);
        } catch (error) {
            console.error('Error creating bot in database:', error);
            throw error;
        }
    },

    // Generate fruits for different bot types
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
            fruits.push({ ...template, cp });
        });

        return fruits;
    },

    // Calculate total CP
    calculateTotalCP(level, fruits) {
        const baseCP = 100 + (level * 15);
        const fruitCP = fruits.reduce((sum, fruit) => sum + fruit.cp, 0);
        return baseCP + fruitCP;
    },

    // Calculate fruit CP
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

    // Get default levels
    getDefaultLevel(botType) {
        const defaults = { easy: 15, medium: 25, hard: 35, boss: 45 };
        return defaults[botType] || 25;
    },

    // Get bot names
    getBotName(botType) {
        const names = {
            easy: 'Rookie Training Bot',
            medium: 'Veteran Sparring Bot', 
            hard: 'Elite Combat Bot',
            boss: 'Legendary Boss Bot'
        };
        return names[botType] || 'Test Bot';
    },

    // Get bot type displays
    getBotTypeDisplay(botType) {
        const displays = {
            easy: '🤖 Easy Bot (Beginner-friendly)',
            medium: '⚔️ Medium Bot (Balanced challenge)',
            hard: '🔥 Hard Bot (Strong opponent)',
            boss: '💀 Boss Bot (Legendary difficulty)'
        };
        return displays[botType] || '🤖 Test Bot';
    },

    // Get bot type colors
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
