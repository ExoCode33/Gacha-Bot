// src/commands/pull.js - Final Pull Command with Professional Animation
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getRandomFruit, getRarityColor, getRarityEmoji } = require('../data/devil-fruits');
const DatabaseManager = require('../database/manager');
const EconomySystem = require('../systems/economy');

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
            
            // Use the professional animation system
            try {
                const { createUltimateCinematicExperience } = require('../animations/modified-gacha');
                await createUltimateCinematicExperience(interaction, fruit, purchaseResult.newBalance, true);
                
                // Set up button collector for the final result
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
                
            } catch (animationError) {
                console.error('Animation system error, falling back to simple reveal:', animationError);
                
                // Fallback to simple reveal if animation fails
                const result = await DatabaseManager.addDevilFruit(userId, fruit);
                const simpleEmbed = await this.createSimpleRevealEmbed(fruit, result, purchaseResult.newBalance);
                
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
                
                await interaction.reply({ embeds: [simpleEmbed], components: [actionRow] });
            }
            
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

    async createSimpleRevealEmbed(fruit, result, newBalance) {
        const rarityEmoji = getRarityEmoji(fruit.rarity);
        const rarityColor = getRarityColor(fruit.rarity);
        
        const duplicateText = result.duplicateCount > 1 ? 
            `${fruit.name} (${result.duplicateCount})` : 
            fruit.name;
        
        const cpBonus = result.duplicateCount > 1 ? 
            `+${((result.duplicateCount - 1) * 1).toFixed(0)}% CP Bonus from duplicates` : 
            '';
        
        const embed = new EmbedBuilder()
            .setColor(rarityColor)
            .setTitle(`${rarityEmoji} ${result.isNewFruit ? 'NEW' : 'DUPLICATE'} DEVIL FRUIT OBTAINED! ${rarityEmoji}`)
            .setDescription(`**${duplicateText}**\n*${fruit.type}*`)
            .addFields([
                { name: '🔮 Element', value: fruit.element || 'Unknown', inline: true },
                { name: '⭐ Rarity', value: fruit.rarity.toUpperCase(), inline: true },
                { name: '💎 CP Multiplier', value: `${fruit.multiplier}x`, inline: true },
                { name: '⚡ Power', value: fruit.power || 'Unknown ability', inline: false },
                { name: '💰 New Balance', value: `${newBalance.toLocaleString()} berries`, inline: true },
                { name: '🎯 Total Owned', value: `${result.duplicateCount}`, inline: true }
            ])
            .setFooter({ text: `${result.isNewFruit ? 'Added to collection!' : 'Duplicate found!'} ${cpBonus}` })
            .setTimestamp();
        
        if (fruit.description) {
            embed.addFields([
                { name: '📖 Description', value: fruit.description, inline: false }
            ]);
        }
        
        return embed;
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
                embed.addFields([{
                    name: `${getRarityEmoji(fruit.fruit_rarity)} ${name}`,
                    value: `${fruit.fruit_rarity.toUpperCase()} • ${fruit.base_cp}x CP${bonus}`,
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
