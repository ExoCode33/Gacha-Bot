// src/commands/enhanced-pvp.js - FIXED PATHS
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Import PvP systems with correct paths
let PvPBalanceSystem = null;
let BattleManager = null;
let PvPQueueSystem = null;

try {
    PvPBalanceSystem = require('../systems/pvp/balance-system');
    console.log('✅ PvP Balance System loaded successfully');
} catch (error) {
    console.log('❌ PvP Balance System failed to load:', error.message);
}

try {
    BattleManager = require('../systems/pvp/battle-manager');
    console.log('✅ Battle Manager loaded successfully');
} catch (error) {
    console.log('❌ Battle Manager failed to load:', error.message);
}

try {
    PvPQueueSystem = require('../systems/pvp/pvp-queue-system');
    console.log('✅ PvP Queue System loaded successfully');
} catch (error) {
    console.log('❌ PvP Queue System failed to load:', error.message);
}

const DatabaseManager = require('../database/manager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp')
        .setDescription('Enhanced PvP system with turn-based combat')
        .addSubcommand(subcommand =>
            subcommand
                .setName('challenge')
                .setDescription('Challenge another player to PvP')
                .addUserOption(option =>
                    option.setName('opponent')
                        .setDescription('The player you want to challenge')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('Join the PvP matchmaking queue'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View your PvP statistics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('View the PvP leaderboard'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave-queue')
                .setDescription('Leave the PvP matchmaking queue')),

    async execute(interaction) {
        // Check if PvP systems are available
        if (!PvPBalanceSystem || !BattleManager || !PvPQueueSystem) {
            const embed = new EmbedBuilder()
                .setTitle('🚧 PvP System Unavailable')
                .setDescription('The enhanced PvP system is currently under maintenance. Please try again later.')
                .setColor('#FF6B6B')
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const userName = interaction.user.username;

        try {
            switch (subcommand) {
                case 'challenge':
                    await handleChallenge(interaction, userId, userName);
                    break;
                case 'queue':
                    await handleQueue(interaction, userId, userName);
                    break;
                case 'stats':
                    await handleStats(interaction, userId);
                    break;
                case 'leaderboard':
                    await handleLeaderboard(interaction);
                    break;
                case 'leave-queue':
                    await handleLeaveQueue(interaction, userId);
                    break;
                default:
                    await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
            }
        } catch (error) {
            console.error('Enhanced PvP command error:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('An error occurred while processing your PvP request. Please try again.')
                .setColor('#FF6B6B')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
};

async function handleChallenge(interaction, userId, userName) {
    const opponent = interaction.options.getUser('opponent');
    
    if (opponent.id === userId) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Invalid Challenge')
            .setDescription('You cannot challenge yourself to PvP!')
            .setColor('#FF6B6B');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (opponent.bot) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Invalid Challenge')
            .setDescription('You cannot challenge a bot to PvP!')
            .setColor('#FF6B6B');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if either player is already in a battle
    if (BattleManager.isInBattle(userId) || BattleManager.isInBattle(opponent.id)) {
        const embed = new EmbedBuilder()
            .setTitle('⚔️ Battle in Progress')
            .setDescription('One of the players is already in a battle!')
            .setColor('#FF6B6B');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Create challenge embed
    const embed = new EmbedBuilder()
        .setTitle('⚔️ PvP Challenge!')
        .setDescription(`${userName} has challenged ${opponent.username} to an enhanced PvP battle!`)
        .addFields([
            { name: '🗡️ Challenger', value: userName, inline: true },
            { name: '🛡️ Opponent', value: opponent.username, inline: true },
            { name: '⏰ Time Limit', value: '60 seconds to respond', inline: false }
        ])
        .setColor('#4ECDC4')
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`pvp_accept_${userId}_${opponent.id}`)
                .setLabel('Accept Challenge')
                .setStyle(ButtonStyle.Success)
                .setEmoji('⚔️'),
            new ButtonBuilder()
                .setCustomId(`pvp_decline_${userId}_${opponent.id}`)
                .setLabel('Decline Challenge')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌')
        );

    await interaction.reply({ embeds: [embed], components: [row] });

    // Set timeout for challenge
    setTimeout(async () => {
        try {
            const message = await interaction.fetchReply();
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pvp_expired')
                        .setLabel('Challenge Expired')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

            const expiredEmbed = EmbedBuilder.from(embed)
                .setTitle('⏰ Challenge Expired')
                .setColor('#95A5A6');

            await message.edit({ embeds: [expiredEmbed], components: [disabledRow] });
        } catch (error) {
            console.error('Error updating expired challenge:', error);
        }
    }, 60000);
}

async function handleQueue(interaction, userId, userName) {
    const result = PvPQueueSystem.joinQueue(userId, userName);
    
    const embed = new EmbedBuilder()
        .setTimestamp();

    if (result.success) {
        if (result.matched) {
            embed
                .setTitle('⚔️ Match Found!')
                .setDescription(`Battle starting between ${result.player1.name} and ${result.player2.name}!`)
                .setColor('#4ECDC4');
        } else {
            embed
                .setTitle('🔍 Joined Queue')
                .setDescription(`You've joined the PvP queue! Current position: **${result.position}**`)
                .addFields([
                    { name: '👥 Players in Queue', value: result.queueSize.toString(), inline: true },
                    { name: '⏱️ Estimated Wait', value: `${Math.max(1, result.position * 30)} seconds`, inline: true }
                ])
                .setColor('#F39C12');
        }
    } else {
        embed
            .setTitle('❌ Queue Error')
            .setDescription(result.message)
            .setColor('#FF6B6B');
    }

    await interaction.reply({ embeds: [embed] });
}

async function handleStats(interaction, userId) {
    try {
        const stats = await DatabaseManager.getUserPvPStats(userId);
        
        const embed = new EmbedBuilder()
            .setTitle(`⚔️ ${interaction.user.username}'s PvP Stats`)
            .addFields([
                { name: '🏆 Wins', value: stats.wins.toString(), inline: true },
                { name: '💀 Losses', value: stats.losses.toString(), inline: true },
                { name: '📊 Win Rate', value: `${stats.winRate}%`, inline: true },
                { name: '🔥 Current Streak', value: stats.currentStreak.toString(), inline: true },
                { name: '⭐ Best Streak', value: stats.bestStreak.toString(), inline: true },
                { name: '🏅 Ranking', value: stats.ranking.toString(), inline: true }
            ])
            .setColor('#4ECDC4')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error fetching PvP stats:', error);
        const embed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('Could not fetch your PvP statistics. Please try again.')
            .setColor('#FF6B6B');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

async function handleLeaderboard(interaction) {
    try {
        const leaderboard = await DatabaseManager.getPvPLeaderboard(10);
        
        if (leaderboard.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('🏆 PvP Leaderboard')
                .setDescription('No PvP data available yet. Start battling to appear on the leaderboard!')
                .setColor('#F39C12');
            return interaction.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setTitle('🏆 PvP Leaderboard')
            .setDescription('Top 10 PvP players')
            .setColor('#FFD700')
            .setTimestamp();

        leaderboard.forEach((player, index) => {
            const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
            embed.addFields([{
                name: `${medal} ${player.username}`,
                value: `Wins: ${player.wins} | Win Rate: ${player.winRate}% | Streak: ${player.currentStreak}`,
                inline: false
            }]);
        });

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error fetching PvP leaderboard:', error);
        const embed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('Could not fetch the PvP leaderboard. Please try again.')
            .setColor('#FF6B6B');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

async function handleLeaveQueue(interaction, userId) {
    const result = PvPQueueSystem.leaveQueue(userId);
    
    const embed = new EmbedBuilder()
        .setTimestamp();

    if (result.success) {
        embed
            .setTitle('✅ Left Queue')
            .setDescription('You have successfully left the PvP queue.')
            .setColor('#4ECDC4');
    } else {
        embed
            .setTitle('❌ Not in Queue')
            .setDescription('You are not currently in the PvP queue.')
            .setColor('#FF6B6B');
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}
