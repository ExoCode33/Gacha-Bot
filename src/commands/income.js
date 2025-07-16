// src/commands/income.js - Fixed Income Command for Manual Collection
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const EconomySystem = require('../systems/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('income')
        .setDescription('💰 Collect a large berry bonus based on your CP! (1 hour cooldown)'),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const username = interaction.user.username;
            
            // Ensure user exists
            await DatabaseManager.ensureUser(userId, username, interaction.guild?.id);
            
            // Process manual income
            const result = await EconomySystem.processManualIncome(userId, username);
            
            if (!result.success) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF8000)
                    .setTitle('⏰ Income Collection')
                    .setDescription(result.message)
                    .setFooter({ text: 'Manual income gives you a large bonus with a cooldown!' });
                
                if (result.nextCollection) {
                    embed.addFields([
                        { name: '⏰ Next Collection Available', value: `${result.nextCollection} minutes`, inline: true }
                    ]);
                }
                
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            // Success - show collection details
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('💰 Large Income Bonus Collected!')
                .setDescription(`You've collected **${result.amount.toLocaleString()} berries**!`)
                .addFields([
                    { name: '💎 Total CP', value: `${result.totalCp.toLocaleString()}`, inline: true },
                    { name: '📈 Hourly Rate', value: `${result.hourlyRate.toLocaleString()} berries/hour`, inline: true },
                    { name: '🔥 Bonus Multiplier', value: `${result.multiplier}x hourly rate`, inline: true },
                    { name: '💰 New Balance', value: `${result.newBalance.toLocaleString()} berries`, inline: true },
                    { name: '⏰ Next Collection', value: `${result.cooldownMinutes} minutes`, inline: true },
                    { name: '🎯 Collection Type', value: 'Manual Bonus', inline: true }
                ])
                .setFooter({ text: 'Auto income continues every 10 minutes + you can collect this bonus!' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in income command:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error')
                .setDescription('Something went wrong while collecting your income!')
                .setFooter({ text: 'Please try again later.' });
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
