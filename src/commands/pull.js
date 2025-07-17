// src/commands/pull.js - Enhanced Pull Command
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getRandomFruit } = require('../data/devil-fruits');
const DatabaseManager = require('../database/manager');
const PullAnimator = require('./helpers/pull-animator');
const PullButtons = require('./helpers/pull-buttons');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pull')
        .setDescription('Hunt for Devil Fruits with cinematic animation!')
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Number of pulls to make')
                .setRequired(false)
                .addChoices(
                    { name: '1x Pull', value: 1 },
                    { name: '10x Pull', value: 10 }
                )
        ),

    async execute(interaction) {
        try {
            const pullCount = interaction.options.getInteger('count') || 1;
            const pullCost = parseInt(process.env.DEFAULT_PULL_COST) || 1000;
            const totalCost = pullCost * pullCount;

            // Check balance
            const balanceCheck = await this.checkBalance(interaction, totalCost);
            if (!balanceCheck.success) {
                return interaction.reply({ content: balanceCheck.message, ephemeral: true });
            }

            // Deduct berries
            await DatabaseManager.updateUserBerries(interaction.user.id, -totalCost, `${pullCount}x Pull`);
            const newBalance = balanceCheck.currentBalance - totalCost;

            console.log(`💸 Removed ${totalCost} berries. New balance: ${newBalance}`);

            // Run animation
            if (pullCount === 1) {
                await this.runSinglePull(interaction, newBalance);
            } else {
                await this.run10xPull(interaction, newBalance);
            }

        } catch (error) {
            console.error('Pull command error:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ An error occurred. Please try again.', ephemeral: true });
            }
        }
    },

    async checkBalance(interaction, totalCost) {
        await DatabaseManager.ensureUser(interaction.user.id, interaction.user.username, interaction.guild?.id);
        const userStats = await DatabaseManager.getUser(interaction.user.id);
        
        if (!userStats || userStats.berries < totalCost) {
            const missing = totalCost - (userStats?.berries || 0);
            return {
                success: false,
                message: `💸 You need **${missing}** more berries!\n💡 Use \`/income\` to collect berries.`
            };
        }
        
        return { success: true, currentBalance: userStats.berries };
    },

    async runSinglePull(interaction, newBalance) {
        const fruit = getRandomFruit();
        console.log(`🎯 Single pull: ${fruit.name} (${fruit.rarity})`);
        
        await PullAnimator.runFullAnimation(interaction, fruit, newBalance);
        await this.setupButtons(interaction);
    },

    async run10xPull(interaction, newBalance) {
        const fruits = Array.from({ length: 10 }, () => getRandomFruit());
        console.log(`🎯 10x pull starting`);
        
        await PullAnimator.run10xAnimation(interaction, fruits, newBalance);
        await this.setupButtons(interaction);
    },

    async setupButtons(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('pull_again')
                    .setLabel('🍈 Pull Again')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('pull_10x')
                    .setLabel('🎰 Pull 10x')
                    .setStyle(ButtonStyle.Success)
            );

        const currentReply = await interaction.fetchReply();
        const currentEmbed = currentReply.embeds[0];
        
        await interaction.editReply({
            embeds: [currentEmbed],
            components: [row]
        });

        // Setup collector
        const collector = currentReply.createMessageComponentCollector({ time: 300000 });
        collector.on('collect', async (buttonInteraction) => {
            await PullButtons.handle(buttonInteraction, interaction.user.id, this);
        });
        collector.on('end', () => PullButtons.disable(interaction));
    }
};
