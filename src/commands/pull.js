// src/commands/pull.js - Improved Pull Command with Shorter Animation
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getRandomFruit, getRarityColor, getRarityEmoji } = require('../data/devil-fruits');
const DatabaseManager = require('../database/manager');
const EconomySystem = require('../systems/economy');

// Animation constants
const rainbowColors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫'];
const rainbowEmbedColors = [0xFF0000, 0xFF8000, 0xFFFF00, 0x00FF00, 0x0080FF, 0x8000FF, 0x654321];

// Short, impactful descriptions
const HUNT_DESCRIPTIONS = [
    "🌊 Scanning the Grand Line's mysterious depths...",
    "⚡ Devil Fruit energy detected... analyzing power signature...",
    "🔥 Tremendous force breaking through dimensional barriers...",
    "💎 Legendary power crystallizing before your eyes...",
    "🌟 The sea grants you a magnificent Devil Fruit!"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pull')
        .setDescription('🍈 Hunt for a Devil Fruit with cinematic animation!'),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const username = interaction.user.username;
            
            // Ensure user exists
            await DatabaseManager.ensureUser(userId, username, interaction.guild?.id);
            
            // Check if user has enough berries
            const purchaseResult = await EconomySystem.purchasePull(userId, username);
            if (!purchaseResult.success) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Insufficient Berries')
                    .setDescription(purchaseResult.message)
                    .addFields([
                        { name: '💰 Current Berries', value: purchaseResult.currentBerries.toLocaleString(), inline: true },
                        { name: '💸 Pull Cost', value: `${EconomySystem.getEconomyConfig().pullCost.toLocaleString()} berries`, inline: true },
                        { name: '📈 Earn More', value: 'Use `/income` to collect berries based on your CP!', inline: false }
                    ])
                    .setFooter({ text: 'Get more Devil Fruits to increase your CP and earn more berries!' });
                
                return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            // Generate random fruit
            const fruit = getRandomFruit();
            console.log(`🎯 ${username} is pulling: ${fruit.name} (${fruit.rarity})`);
            
            // Start the improved shorter animation
            await this.startImprovedAnimation(interaction, fruit, purchaseResult.newBalance);
            
        } catch (error) {
            console.error('Error in pull command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error')
                .setDescription('Something went wrong with the Devil Fruit hunt! Please try again.')
                .setFooter({ text: 'If this persists, contact an admin.' });
            
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async startImprovedAnimation(interaction, targetFruit, newBalance) {
        const frameDelay = 800; // 0.8 seconds per frame (much faster!)
        const totalFrames = 5; // Only 5 frames total (4 seconds total)
        
        try {
            console.log(`🎯 Starting improved animation: ${targetFruit.name} (${targetFruit.rarity})`);
            
            const rewardColor = getRarityColor(targetFruit.rarity);
            
            // Animation frames (0-4, total 4 seconds)
            for (let frame = 0; frame < totalFrames; frame++) {
                const embed = this.createAnimationFrame(frame, targetFruit, totalFrames);
                
                if (frame === 0) {
                    await interaction.reply({ embeds: [embed] });
                } else {
                    await interaction.editReply({ embeds: [embed] });
                }
                
                // Don't wait after the last frame
                if (frame < totalFrames - 1) {
                    await new Promise(resolve => setTimeout(resolve, frameDelay));
                }
            }
            
            // Brief pause before final reveal
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Save fruit to database
            console.log(`💾 Saving fruit to database: ${targetFruit.name}`);
            const result = await DatabaseManager.addDevilFruit(interaction.user.id, targetFruit);
            
            // Calculate user stats for final reveal
            const userStats = {
                duplicateCount: result.duplicateCount,
                isNewFruit: result.isNewFruit,
                totalCp: result.totalCp,
                newBalance: newBalance
            };
            
            // Final reveal with enhanced embed
            console.log(`🎊 Final reveal: ${targetFruit.name}`);
            
            const finalEmbed = await this.createFinalRevealEmbed(targetFruit, userStats, newBalance);
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pull_again')
                        .setLabel('🍈 Pull Again')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('view_collection')
                        .setLabel('📚 My Collection')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('view_stats')
                        .setLabel('📊 My Stats')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            await interaction.editReply({
                embeds: [finalEmbed],
                components: [actionRow]
            });
            
            // Set up button collector
            const collector = interaction.channel.createMessageComponentCollector({ 
                filter: (i) => i.user.id === interaction.user.id,
                time: 300000 // 5 minutes
            });
            
            collector.on('collect', async (buttonInteraction) => {
                try {
                    if (buttonInteraction.customId === 'pull_again') {
                        await this.execute(buttonInteraction);
                    } else if (buttonInteraction.customId === 'view_collection') {
                        await this.showCollection(buttonInteraction);
                    } else if (buttonInteraction.customId === 'view_stats') {
                        await this.showStats(buttonInteraction);
                    }
                } catch (error) {
                    console.error('Button interaction error:', error);
                }
            });
            
            collector.on('end', () => {
                // Remove buttons after timeout
                interaction.editReply({ components: [] }).catch(() => {});
            });
            
            console.log(`🎊 Pull success: ${targetFruit.name} (${targetFruit.rarity}) for ${interaction.user.username}`);
            
        } catch (error) {
            console.error('🚨 Animation Error:', error);
            
            // Fallback - still give the fruit
            const result = await DatabaseManager.addDevilFruit(interaction.user.id, targetFruit);
            const fallbackEmbed = await this.createFinalRevealEmbed(targetFruit, result, newBalance);
            
            await interaction.editReply({ embeds: [fallbackEmbed] });
        }
    },

    getSyncedRainbowPattern(frame, barLength = 20) {
        const positions = [];
        for (let i = 0; i < barLength; i++) {
            const colorIndex = (i - frame + rainbowColors.length * 100) % rainbowColors.length;
            positions.push(rainbowColors[colorIndex]);
        }
        return positions.join(' ');
    },

    getEmbedColorSyncedToFirst(frame) {
        const firstSquareColorIndex = (0 - frame + rainbowColors.length * 100) % rainbowColors.length;
        return rainbowEmbedColors[firstSquareColorIndex];
    },

    createAnimationFrame(frame, targetFruit, totalFrames) {
        const rainbowPattern = this.getSyncedRainbowPattern(frame);
        const embedColor = this.getEmbedColorSyncedToFirst(frame);
        const description = HUNT_DESCRIPTIONS[frame] || HUNT_DESCRIPTIONS[HUNT_DESCRIPTIONS.length - 1];
        
        // For the last frame, start transitioning to the fruit's rarity color
        const finalFrameColor = frame === totalFrames - 1 ? getRarityColor(targetFruit.rarity) : embedColor;
        
        const content = [
            `${rainbowPattern}`,
            "",
            `🏴‍☠️ **DEVIL FRUIT HUNT** 🏴‍☠️`,
            "",
            `*${description}*`,
            "",
            `${rainbowPattern}`
        ].join('\n');
        
        return new EmbedBuilder()
            .setColor(finalFrameColor)
            .setTitle("🌊 Scanning the Grand Line...")
            .setDescription(content)
            .setFooter({ text: "🍈 Devil Fruit materializing..." })
            .setTimestamp();
    },

    async createFinalRevealEmbed(targetFruit, result, newBalance) {
        const rarityEmoji = getRarityEmoji(targetFruit.rarity);
        const rarityColor = getRarityColor(targetFruit.rarity);
        const rewardBar = Array(20).fill(rarityEmoji).join(' ');
        
        const rarityTitles = {
            common: "Common Discovery",
            uncommon: "Uncommon Treasure",
            rare: "Rare Artifact", 
            epic: "Epic Legend",
            legendary: "Legendary Relic",
            mythical: "Mythical Wonder",
            omnipotent: "Omnipotent Force"
        };
        
        const typeEmojis = {
            'Paramecia': '🔮',
            'Zoan': '🐺', 
            'Logia': '🌪️',
            'Ancient Zoan': '🦕',
            'Mythical Zoan': '🐉',
            'Special Paramecia': '✨'
        };
        
        const duplicateCount = result.duplicateCount || 1;
        const duplicateInfo = duplicateCount > 1 ? 
            `🔄 **Duplicate #${duplicateCount}** (+${((duplicateCount - 1) * 1).toFixed(0)}% CP Bonus!)` : 
            `✨ **New Discovery!** First time obtaining this fruit!`;
        
        const content = [
            `${rewardBar}`,
            "",
            `🎉 **${rarityTitles[targetFruit.rarity] || 'Mysterious Discovery'}**`,
            "",
            `🍈 **${targetFruit.name}**`,
            `${typeEmojis[targetFruit.type] || '🍈'} **Type:** ${targetFruit.type}`,
            `⭐ **Rarity:** ${targetFruit.rarity.charAt(0).toUpperCase() + targetFruit.rarity.slice(1)}`,
            `🔥 **CP Multiplier:** ${(targetFruit.multiplier || 1.0).toFixed(2)}x`,
            `🌟 **Category:** ${targetFruit.fruitType || 'Unknown'}`,
            "",
            duplicateInfo,
            "",
            `📖 **Power Description:**`,
            `*${targetFruit.power || 'A mysterious power awaits discovery...'}*`,
            "",
            `💰 **New Balance:** ${newBalance.toLocaleString()} berries`,
            `🎯 **Total Owned:** ${duplicateCount}`,
            "",
            `${rewardBar}`
        ].join('\n');
        
        return new EmbedBuilder()
            .setColor(rarityColor)
            .setTitle(result.isNewFruit ? "🏴‍☠️ New Devil Fruit Discovered!" : "🏴‍☠️ Devil Fruit Enhanced!")
            .setDescription(content)
            .setFooter({ 
                text: result.isNewFruit ? 
                    "🌊 Your legend grows stronger | Set sail with your new power!" :
                    "🌊 Duplicate mastery increases your power! | Set sail stronger than before!"
            })
            .setTimestamp();
    },

    async showCollection(interaction) {
        try {
            const userId = interaction.user.id;
            const fruits = await DatabaseManager.getUserDevilFruits(userId);
            
            if (fruits.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('📚 Empty Collection')
                    .setDescription('You haven\'t collected any Devil Fruits yet!\nUse `/pull` to start your collection.')
                    .setFooter({ text: 'Start your pirate journey today!' });
                
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            // Group fruits by ID and count duplicates
            const fruitMap = new Map();
            fruits.forEach(fruit => {
                if (fruitMap.has(fruit.fruit_id)) {
                    fruitMap.get(fruit.fruit_id).count++;
                } else {
                    fruitMap.set(fruit.fruit_id, { ...fruit, count: 1 });
                }
            });
            
            const uniqueFruits = Array.from(fruitMap.values())
                .sort((a, b) => b.base_cp - a.base_cp)
                .slice(0, 10);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('📚 Your Devil Fruit Collection')
                .setDescription(`**Total Fruits:** ${fruits.length}\n**Unique Fruits:** ${fruitMap.size}`)
                .setFooter({ text: `Showing top 10 fruits by CP multiplier` });
            
            uniqueFruits.forEach(fruit => {
                const name = fruit.count > 1 ? `${fruit.fruit_name} (${fruit.count})` : fruit.fruit_name;
                const bonus = fruit.count > 1 ? ` • +${((fruit.count - 1) * 1).toFixed(0)}% CP` : '';
                const fruitType = fruit.fruit_fruit_type || fruit.fruit_element || 'Unknown';
                // Convert stored integer back to decimal for display
                const multiplier = (fruit.base_cp / 100).toFixed(1);
                embed.addFields([{
                    name: `${getRarityEmoji(fruit.fruit_rarity)} ${name}`,
                    value: `${fruit.fruit_rarity.toUpperCase()} • ${multiplier}x CP${bonus}\n🔹 ${fruitType}`,
                    inline: true
                }]);
            });
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
            
        } catch (error) {
            console.error('Error showing collection:', error);
            await interaction.reply({ content: 'Error loading your collection.', ephemeral: true });
        }
    },

    async showStats(interaction) {
        try {
            const userId = interaction.user.id;
            const user = await DatabaseManager.getUser(userId);
            const fruits = await DatabaseManager.getUserDevilFruits(userId);
            
            if (!user) {
                return await interaction.reply({ content: 'User not found.', ephemeral: true });
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x0080FF)
                .setTitle('📊 Your Pirate Stats')
                .addFields([
                    { name: '⭐ Level', value: `${user.level}`, inline: true },
                    { name: '💎 Base CP', value: `${user.base_cp}`, inline: true },
                    { name: '🔥 Total CP', value: `${user.total_cp}`, inline: true },
                    { name: '💰 Berries', value: `${user.berries.toLocaleString()}`, inline: true },
                    { name: '🍈 Total Fruits', value: `${fruits.length}`, inline: true },
                    { name: '📈 Hourly Income', value: `${EconomySystem.calculateHourlyIncome(user.total_cp)} berries`, inline: true }
                ])
                .setFooter({ text: 'Keep collecting to increase your power!' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
            
        } catch (error) {
            console.error('Error showing stats:', error);
            await interaction.reply({ content: 'Error loading your stats.', ephemeral: true });
        }
    }
};
