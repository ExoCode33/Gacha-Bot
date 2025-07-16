// src/commands/income.js - Income Command
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const EconomySystem = require('../systems/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('income')
        .setDescription('💰 Collect your hourly berry income based on your CP!'),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const username = interaction.user.username;
            
            // Ensure user exists
            await DatabaseManager.ensureUser(userId, username, interaction.guild?.id);
            
            // Process income
            const result = await EconomySystem.processIncome(userId, username);
            
            if (!result.success) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF8000)
                    .setTitle('⏰ Income Collection')
                    .setDescription(result.message)
                    .setFooter({ text: 'Income is generated based on your total CP!' });
                
                if (result.nextIncome) {
                    embed.addFields([
                        { name: '⏰ Next Collection', value: `${result.nextIncome} minutes`, inline: true }
                    ]);
                }
                
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('💰 Income Collected!')
                .setDescription(`You've collected **${result.amount.toLocaleString()} berries**!`)
                .addFields([
                    { name: '💎 Total CP', value: `${result.totalCp.toLocaleString()}`, inline: true },
                    { name: '📈 Hourly Rate', value: `${result.hourlyRate.toLocaleString()} berries/hour`, inline: true },
                    { name: '⏰ Time Collected', value: `${result.hoursElapsed.toFixed(1)} hours`, inline: true },
                    { name: '💰 New Balance', value: `${result.newBalance.toLocaleString()} berries`, inline: false }
                ])
                .setFooter({ text: 'Collect more Devil Fruits to increase your CP and earn more berries!' })
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
