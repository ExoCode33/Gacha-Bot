// src/commands/stats.js - Stats Command
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const EconomySystem = require('../systems/economy');
const LevelSystem = require('../systems/levels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('📊 View your pirate stats and progress!')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('View another user\'s stats')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const userId = targetUser.id;
            const username = targetUser.username;
            
            // Ensure user exists
            await DatabaseManager.ensureUser(userId, username, interaction.guild?.id);
            
            // Get user data
            const user = await DatabaseManager.getUser(userId);
            const fruits = await DatabaseManager.getUserDevilFruits(userId);
            const incomeInfo = await EconomySystem.getIncomeInfo(userId);
            
            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ User Not Found')
                    .setDescription('This user is not registered in the system.')
                    .setFooter({ text: 'They need to use a command first!' });
                
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            // Calculate fruit statistics
            const fruitMap = new Map();
            fruits.forEach(fruit => {
                if (fruitMap.has(fruit.fruit_id)) {
                    fruitMap.get(fruit.fruit_id).count++;
                } else {
                    fruitMap.set(fruit.fruit_id, { ...fruit, count: 1 });
                }
            });
            
            const uniqueFruits = fruitMap.size;
            const totalFruits = fruits.length;
            const duplicates = totalFruits - uniqueFruits;
            
            // Calculate rarity distribution
            const rarityCount = {};
            fruits.forEach(fruit => {
                rarityCount[fruit.rarity] = (rarityCount[fruit.rarity] || 0) + 1;
            });
            
            // Find highest multiplier fruit
            const highestFruit = fruits.reduce((max, fruit) => 
                fruit.cp_multiplier > (max?.cp_multiplier || 0) ? fruit : max, null);
            
            // Calculate level progress
            const nextLevel = LevelSystem.getNextLevel(user.level);
            const levelProgress = nextLevel ? 
                `${user.level} → ${nextLevel.level} (${nextLevel.baseCp} base CP)` : 
                `${user.level} (MAX)`;
            
            // Format income info
            const nextIncome = incomeInfo?.canCollect ? 
                'Available now!' : 
                `${incomeInfo?.nextCollection || 0} minutes`;
            
            const embed = new EmbedBuilder()
                .setColor(LevelSystem.getRoleColor(user.level))
                .setTitle(`${LevelSystem.getRoleEmoji(user.level)} ${targetUser.username}'s Pirate Stats`)
                .setDescription(`**${LevelSystem.getLevelTitle(user.level)}**`)
                .addFields([
                    { name: '⭐ Level', value: `${user.level}`, inline: true },
                    { name: '💎 Base CP', value: `${user.base_cp.toLocaleString()}`, inline: true },
                    { name: '🔥 Total CP', value: `${user.total_cp.toLocaleString()}`, inline: true },
                    { name: '💰 Berries', value: `${user.berries.toLocaleString()}`, inline: true },
                    { name: '📈 Hourly Income', value: `${incomeInfo?.hourlyIncome.toLocaleString() || 0}`, inline: true },
                    { name: '⏰ Next Income', value: nextIncome, inline: true },
                    { name: '🍈 Total Fruits', value: `${totalFruits}`, inline: true },
                    { name: '🆔 Unique Fruits', value: `${uniqueFruits}`, inline: true },
                    { name: '📊 Duplicates', value: `${duplicates}`, inline: true },
                    { name: '🎯 Level Progress', value: levelProgress, inline: false }
                ])
                .setFooter({ text: 'Keep collecting to increase your power!' })
                .setTimestamp();
            
            // Add highest fruit if exists
            if (highestFruit) {
                embed.addFields([
                    { name: '👑 Strongest Fruit', value: `${highestFruit.fruit_name} (${highestFruit.cp_multiplier}x)`, inline: false }
                ]);
            }
            
            // Add rarity distribution
            if (Object.keys(rarityCount).length > 0) {
                const rarityText = Object.entries(rarityCount)
                    .sort(([,a], [,b]) => b - a)
                    .map(([rarity, count]) => `${rarity}: ${count}`)
                    .join(', ');
                
                embed.addFields([
                    { name: '🎨 Rarity Distribution', value: rarityText, inline: false }
                ]);
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in stats command:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error')
                .setDescription('Something went wrong while loading the stats!')
                .setFooter({ text: 'Please try again later.' });
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
