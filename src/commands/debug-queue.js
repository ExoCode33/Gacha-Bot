// src/commands/debug-queue.js - Debug command to make bot join PvP queue for testing
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const DatabaseManager = require('../database/manager');
const { getRandomFruit, getRarityEmoji } = require('../data/devil-fruits');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug-queue')
        .setDescription('🤖 Make the bot join the PvP queue for testing purposes')
        .addStringOption(option =>
            option.setName('bot-type')
                .setDescription('Type of bot to add to queue')
                .setRequired(false)
                .addChoices(
                    { name: '🤖 Basic Test Bot', value: 'basic' },
                    { name: '⚔️ Combat Bot (Strong)', value: 'combat' },
                    { name: '🏴‍☠️ Pirate Bot (Balanced)', value: 'pirate' },
                    { name: '🌟 Elite Bot (Very Strong)', value: 'elite' },
                    { name: '🔥 Boss Bot (Legendary)', value: 'boss' }
                ))
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Bot level (1-50)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(50))
        .addIntegerOption(option =>
            option.setName('cp')
                .setDescription('Bot CP override (1000-50000)')
                .setRequired(false)
                .setMinValue(1000)
                .setMaxValue(50000))
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

            const botType = interaction.options.getString('bot-type') || 'basic';
            const level = interaction.options.getInteger('level') || this.getDefaultLevel(botType);
            const cpOverride = interaction.options.getInteger('cp');

            // Check if Enhanced PvP system exists (from your main index.js)
            let pvpSystem;
            try {
                // Try to get the PvP system from the main client if available
                if (interaction.client.pvpSystem) {
                    pvpSystem = interaction.client.pvpSystem;
                } else {
                    // Fallback: try to load PvP queue system
                    const PvPQueueSystem = require('../systems/pvp/pvp-queue-system');
                    pvpSystem = { queue: PvPQueueSystem };
                }
            } catch (error) {
                return interaction.reply({
                    content: '❌ PvP System not found! Make sure the enhanced PvP system is properly loaded.',
                    ephemeral: true
                });
            }

            // Generate bot data
            const botData = await this.createTestBot(botType, level, cpOverride, interaction.guild.id);

            // Create bot user in database if needed
            await this.ensureBotUser(botData);

            // Add bot to PvP queue (try both enhanced system and fallback)
            let queueResult;
            if (pvpSystem.queue && pvpSystem.queue.joinQueue) {
                // Use PvP queue system
                queueResult = pvpSystem.queue.joinQueue(botData.userId, botData.username);
            } else if (pvpSystem.joinQueue) {
                // Direct PvP system method
                queueResult = pvpSystem.joinQueue(botData.userId, botData.username);
            } else {
                // Manual queue simulation
                queueResult = {
                    success: true,
                    matched: false,
                    position: 1,
                    queueSize: 1
                };
                console.log(`🤖 Bot ${botData.username} simulated queue join (no queue system available)`);
            }

            if (!queueResult.success) {
                return interaction.reply({
                    content: `❌ Failed to add bot to queue: ${queueResult.message}`,
                    ephemeral: true
                });
            }

            // If a match was found, manually start the enhanced PvP battle
            if (queueResult.matched && queueResult.player1 && queueResult.player2) {
                console.log(`🔥 Match found! Starting battle between ${queueResult.player1.username} vs ${queueResult.player2.username}`);
                
                // Determine which player is the human and which is the bot
                const humanPlayer = queueResult.player1.userId === botData.userId ? queueResult.player2 : queueResult.player1;
                const botPlayer = queueResult.player1.userId === botData.userId ? queueResult.player1 : queueResult.player2;
                
                console.log(`👤 Human player: ${humanPlayer.username} (${humanPlayer.userId})`);
                console.log(`🤖 Bot player: ${botPlayer.username} (${botPlayer.userId})`);
                
                // Try to start enhanced PvP battle if system is available
                try {
                    // Create a mock user object for the human player
                    const humanUserObj = {
                        id: humanPlayer.userId,
                        username: humanPlayer.username
                    };
                    
                    // Get the enhanced PvP system if available
                    if (interaction.client.pvpSystem && interaction.client.pvpSystem.initiateBattle) {
                        console.log(`🎮 Starting enhanced PvP battle via client.pvpSystem`);
                        
                        // Use a timeout to avoid interaction conflicts
                        setTimeout(async () => {
                            try {
                                await interaction.client.pvpSystem.initiateBattle(interaction, humanUserObj);
                                console.log(`✅ Enhanced PvP battle initiated successfully`);
                            } catch (error) {
                                console.error('Error starting enhanced battle:', error);
                                await interaction.followUp({
                                    content: `⚔️ Match found: **${humanPlayer.username}** vs **${botPlayer.username}**!\n\n❌ Auto-battle failed to start. Use \`/pvp challenge @${interaction.client.user.username}\` to challenge the bot manually.`,
                                    ephemeral: false
                                });
                            }
                        }, 2000);
                        
                    } else {
                        // Enhanced PvP not available, just announce the match
                        console.log(`⚠️ Enhanced PvP system not available, announcing match only`);
                        await interaction.followUp({
                            content: `⚔️ **MATCH FOUND!**\n\n🔥 **${humanPlayer.username}** vs **${botPlayer.username}**!\n\n💡 Use \`/pvp challenge @${interaction.client.user.username}\` to start the battle manually.`,
                            ephemeral: false
                        });
                    }
                } catch (error) {
                    console.error('Error handling match:', error);
                    await interaction.followUp({
                        content: `⚔️ Match found but failed to start automatically. Use \`/pvp challenge @${interaction.client.user.username}\` to battle the bot!`,
                        ephemeral: false
                    });
                }
            }

            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('🤖 Debug Bot Added to PvP Queue!')
                .setDescription(`**${botData.username}** has joined the PvP queue for testing!`)
                .addFields([
                    { name: '🤖 Bot Type', value: this.getBotTypeDisplay(botType), inline: true },
                    { name: '⭐ Level', value: level.toString(), inline: true },
                    { name: '💎 Total CP', value: botData.totalCP.toLocaleString(), inline: true },
                    { name: '❤️ HP', value: botData.maxHealth.toString(), inline: true },
                    { name: '⚔️ Attack', value: botData.attack.toString(), inline: true },
                    { name: '🛡️ Defense', value: botData.defense.toString(), inline: true },
                    { name: '💨 Speed', value: botData.speed.toString(), inline: true },
                    { name: '🍈 Devil Fruits', value: botData.fruits.length.toString(), inline: true },
                    { name: '🎯 Queue Status', value: queueResult.matched ? 'Match Found!' : `Position #${queueResult.position}`, inline: true }
                ])
                .setColor(this.getBotTypeColor(botType))
                .setFooter({ 
                    text: `Debug Mode • Bot ID: ${botData.userId} • Use /pvp challenge to test battles`,
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Add fruit breakdown
            if (botData.fruits.length > 0) {
                const fruitBreakdown = this.getFruitBreakdown(botData.fruits);
                embed.addFields([{
                    name: '🍈 Devil Fruit Collection',
                    value: fruitBreakdown,
                    inline: false
                }]);
            }

            await interaction.reply({ embeds: [embed] });

            // If match was found, announce it
            if (queueResult.matched) {
                const matchEmbed = new EmbedBuilder()
                    .setTitle('⚔️ INSTANT MATCH FOUND!')
                    .setDescription(`🔥 **${queueResult.player1.username}** vs **${queueResult.player2.username}**!\n\nA battle is about to begin!`)
                    .setColor('#FF0000')
                    .setTimestamp();

                await interaction.followUp({ embeds: [matchEmbed] });
            }

            console.log(`🤖 Debug bot ${botData.username} added to PvP queue (Type: ${botType}, Level: ${level}, CP: ${botData.totalCP})`);

        } catch (error) {
            console.error('Error in debug-queue command:', error);
            await interaction.reply({
                content: '❌ An error occurred while adding the bot to the queue!',
                ephemeral: true
            });
        }
    },

    // Create test bot with specified parameters
    async createTestBot(botType, level, cpOverride, guildId) {
        const botId = `debug_bot_${botType}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const botName = this.getBotName(botType);
        
        // Generate fruits for the bot (5-15 fruits depending on type)
        const fruitCount = this.getFruitCount(botType);
        const fruits = [];
        
        for (let i = 0; i < fruitCount; i++) {
            const fruit = getRandomFruit();
            fruits.push({
                fruit_name: fruit.name,
                fruit_type: fruit.type,
                fruit_rarity: fruit.rarity,
                fruit_element: fruit.element,
                base_cp: Math.floor(fruit.multiplier * 100), // Store as integer
                obtained_at: new Date()
            });
        }

        // Calculate stats based on bot type and level
        const baseStats = this.getBaseStats(botType, level);
        const totalCP = cpOverride || this.calculateTotalCP(baseStats, fruits);

        return {
            userId: botId,
            username: botName,
            level: level,
            totalCP: totalCP,
            balancedCP: Math.floor(totalCP * 0.8), // PvP balanced CP
            maxHealth: baseStats.health,
            attack: baseStats.attack,
            defense: baseStats.defense,
            speed: baseStats.speed,
            fruits: fruits,
            isDebugBot: true,
            botType: botType,
            guildId: guildId,
            createdAt: new Date()
        };
    },

    // Ensure bot exists in database for PvP compatibility
    async ensureBotUser(botData) {
        try {
            // Create user entry
            await DatabaseManager.ensureUser(botData.userId, botData.username, botData.guildId);
            
            // Update user stats (only fields that exist in your users table)
            await DatabaseManager.updateUser(botData.userId, {
                level: botData.level,
                total_cp: botData.totalCP,
                base_cp: botData.balancedCP,
                berries: 50000 // Give bot some berries
            });

            // Add some fruits to the bot's collection with enhanced stats
            for (const fruit of botData.fruits) {
                // Truncate strings to fit database constraints
                const fruitName = fruit.fruit_name.length > 45 ? fruit.fruit_name.substring(0, 45) : fruit.fruit_name;
                const fruitType = fruit.fruit_type.length > 45 ? fruit.fruit_type.substring(0, 45) : fruit.fruit_type;
                const fruitElement = fruit.fruit_element.length > 45 ? fruit.fruit_element.substring(0, 45) : fruit.fruit_element;
                const fruitPower = `${fruitType} Power`.length > 45 ? `${fruitType} Power`.substring(0, 45) : `${fruitType} Power`;
                const fruitDescription = `A ${fruit.fruit_rarity} Devil Fruit`.length > 100 ? 
                    `A ${fruit.fruit_rarity} Devil Fruit`.substring(0, 100) : 
                    `A ${fruit.fruit_rarity} Devil Fruit`;
                
                // Create shorter, unique fruit ID
                const shortFruitId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

                await DatabaseManager.query(`
                    INSERT INTO user_devil_fruits (
                        user_id, fruit_id, fruit_name, fruit_type, fruit_rarity, 
                        fruit_element, fruit_fruit_type, fruit_power, fruit_description,
                        base_cp, total_cp, hp, mp, attack, defense, speed, power_level,
                        level, experience, obtained_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                    ON CONFLICT DO NOTHING
                `, [
                    botData.userId,
                    shortFruitId, // Shortened ID
                    fruitName, // Truncated name
                    fruitType, // Truncated type
                    fruit.fruit_rarity,
                    fruitElement, // Truncated element
                    fruitType, // fruit_fruit_type column (truncated)
                    fruitPower, // Truncated power description
                    fruitDescription, // Truncated description
                    fruit.base_cp,
                    fruit.base_cp,
                    Math.floor(botData.maxHealth / botData.fruits.length) + 100, // hp per fruit
                    Math.floor(botData.maxHealth / botData.fruits.length) + 50,  // mp per fruit
                    Math.floor(botData.attack / botData.fruits.length) + 20,      // attack per fruit
                    Math.floor(botData.defense / botData.fruits.length) + 15,    // defense per fruit
                    Math.floor(botData.speed / botData.fruits.length) + 10,      // speed per fruit
                    fruit.base_cp, // power_level
                    1, // level
                    0, // experience
                    fruit.obtained_at
                ]);
            }

            console.log(`🤖 Bot user ${botData.username} ensured in database with ${botData.fruits.length} fruits`);
        } catch (error) {
            console.error('Error ensuring bot user:', error);
            // Continue anyway - the bot can still join queue without perfect database state
        }
    },

    // Get default level for bot type
    getDefaultLevel(botType) {
        const defaults = {
            'basic': 10,
            'combat': 25,
            'pirate': 35,
            'elite': 45,
            'boss': 50
        };
        return defaults[botType] || 10;
    },

    // Get base stats for bot type and level
    getBaseStats(botType, level) {
        const baseMultipliers = {
            'basic': { health: 1.0, attack: 1.0, defense: 1.0, speed: 1.0 },
            'combat': { health: 1.2, attack: 1.5, defense: 1.1, speed: 1.2 },
            'pirate': { health: 1.3, attack: 1.3, defense: 1.3, speed: 1.3 },
            'elite': { health: 1.5, attack: 1.6, defense: 1.4, speed: 1.5 },
            'boss': { health: 2.0, attack: 1.8, defense: 1.6, speed: 1.4 }
        };

        const multiplier = baseMultipliers[botType] || baseMultipliers['basic'];
        const levelBonus = 1 + (level * 0.1); // 10% increase per level

        return {
            health: Math.floor(100 * multiplier.health * levelBonus),
            attack: Math.floor(20 * multiplier.attack * levelBonus),
            defense: Math.floor(15 * multiplier.defense * levelBonus),
            speed: Math.floor(10 * multiplier.speed * levelBonus)
        };
    },

    // Calculate total CP from stats and fruits
    calculateTotalCP(baseStats, fruits) {
        const statCP = (baseStats.health * 0.5) + (baseStats.attack * 3) + (baseStats.defense * 2) + (baseStats.speed * 1.5);
        const fruitCP = fruits.reduce((sum, fruit) => sum + fruit.base_cp, 0);
        return Math.floor(statCP + fruitCP);
    },

    // Get fruit count based on bot type
    getFruitCount(botType) {
        const counts = {
            'basic': 5,
            'combat': 8,
            'pirate': 10,
            'elite': 12,
            'boss': 15
        };
        return counts[botType] || 5;
    },

    // Get bot name based on type
    getBotName(botType) {
        const names = {
            'basic': 'Debug Bot Alpha',
            'combat': 'Combat Test Bot',
            'pirate': 'Sparring Pirate Bot',
            'elite': 'Elite Training Bot',
            'boss': 'Legendary Boss Bot'
        };
        return names[botType] || 'Test Bot';
    },

    // Get bot type display name
    getBotTypeDisplay(botType) {
        const displays = {
            'basic': '🤖 Basic Test Bot',
            'combat': '⚔️ Combat Bot (Strong)',
            'pirate': '🏴‍☠️ Pirate Bot (Balanced)',
            'elite': '🌟 Elite Bot (Very Strong)',
            'boss': '🔥 Boss Bot (Legendary)'
        };
        return displays[botType] || '🤖 Unknown Bot';
    },

    // Get bot type color
    getBotTypeColor(botType) {
        const colors = {
            'basic': 0x808080,    // Gray
            'combat': 0xFF4500,   // Orange Red
            'pirate': 0x8B4513,   // Brown
            'elite': 0x9932CC,    // Purple
            'boss': 0xFF0000      // Red
        };
        return colors[botType] || 0x808080;
    },

    // Get fruit breakdown for display
    getFruitBreakdown(fruits) {
        const breakdown = {};
        fruits.forEach(fruit => {
            const rarity = fruit.fruit_rarity;
            breakdown[rarity] = (breakdown[rarity] || 0) + 1;
        });

        return Object.entries(breakdown)
            .map(([rarity, count]) => `${getRarityEmoji(rarity)} ${rarity}: ${count}`)
            .join('\n') || 'No fruits';
    }
};
