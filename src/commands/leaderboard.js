// src/commands/leaderboard.js - Leaderboard Command
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const LevelSystem = require('../systems/levels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('🏆 View the server leaderboards!')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Leaderboard type')
                .setRequired(false)
                .addChoices(
                    { name: 'Combat Power (CP)', value: 'cp' },
                    { name: 'Berries', value: 'berries' },
                    { name: 'Fruit Collection', value: 'fruits' },
                    { name: 'Level', value: 'level' }
                )
        ),

    async execute(interaction) {
        try {
            const type = interaction.options.getString('type') || 'cp';
            const limit = 10;
            
            let leaderboard;
            let title;
            let description;
            let emoji;
            
            switch (type) {
                case 'cp':
                    leaderboard = await DatabaseManager.getLeaderboard('cp', limit);
                    title = '🔥 Combat Power Leaderboard';
                    description = 'Top pirates by total Combat Power';
                    emoji = '🔥';
                    break;
                case 'berries':
                    leaderboard = await DatabaseManager.getLeaderboard('berries', limit);
                    title = '💰 Berry Leaderboard';
                    description = 'Richest pirates on the server';
                    emoji = '💰';
                    break;
                case 'fruits':
                    leaderboard = await DatabaseManager.getLeaderboard('fruits', limit);
                    title = '🍈 Fruit Collection Leaderboard';
                    description = 'Pirates with the most unique Devil Fruits';
                    emoji = '🍈';
                    break;
                case 'level':
                    leaderboard = await DatabaseManager.getLeaderboard('level', limit);
                    title = '⭐ Level Leaderboard';
                    description = 'Highest level pirates';
                    emoji = '⭐';
                    break;
            }
            
            if (!leaderboard || leaderboard.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF8000)
                    .setTitle('🏆 Empty Leaderboard')
                    .setDescription('No data available for this leaderboard yet!')
                    .setFooter({ text: 'Be the first to make your mark!' });
                
                return await interaction.reply({ embeds: [embed] });
            }
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(title)
                .setDescription(description)
                .setFooter({ text: `Showing top ${leaderboard.length} pirates` })
                .setTimestamp();
            
            // Add leaderboard entries
            leaderboard.forEach((user, index) => {
                const position = index + 1;
                const positionEmoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
                
                let value;
                switch (type) {
                    case 'cp':
                        value = `${user.total_cp.toLocaleString()} CP`;
                        break;
                    case 'berries':
                        value = `${user.berries.toLocaleString()} berries`;
                        break;
                    case 'fruits':
                        value = `${user.unique_fruits} unique fruits`;
                        break;
                    case 'level':
                        value = `Level ${user.level}`;
                        break;
                }
                
                const levelEmoji = LevelSystem.getRoleEmoji(user.level || 0);
                
                embed.addFields([
                    {
                        name: `${positionEmoji} ${user.username}`,
                        value: `${levelEmoji} ${value}`,
                        inline: true
                    }
                ]);
            });
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in leaderboard command:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error')
                .setDescription('Something went wrong while loading the leaderboard!')
                .setFooter({ text: 'Please try again later.' });
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
