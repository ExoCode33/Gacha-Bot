// src/commands/helpers/pull-buttons.js - Button Handler
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getRandomFruit } = require('../../data/devil-fruits');
const DatabaseManager = require('../../database/manager');
const PullAnimator = require('./pull-animator');

class PullButtons {
    // Handle button interactions
    static async handle(buttonInteraction, originalUserId, pullCommand) {
        // Check if correct user
        if (buttonInteraction.user.id !== originalUserId) {
            return buttonInteraction.reply({
                content: '❌ You can only interact with your own pull results!',
                ephemeral: true
            });
        }

        try {
            if (buttonInteraction.customId === 'pull_again') {
                await this.handlePullAgain(buttonInteraction);
            } else if (buttonInteraction.customId === 'pull_10x') {
                await this.handlePull10x(buttonInteraction);
            }
        } catch (error) {
            console.error('Button error:', error);
            if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                await buttonInteraction.reply({ content: '❌ An error occurred.', ephemeral: true });
            }
        }
    }

    // Handle pull again
    static async handlePullAgain(buttonInteraction) {
        const pullCost = parseInt(process.env.DEFAULT_PULL_COST) || 1000;
        
        // Check balance
        const balanceCheck = await this.checkBalance(buttonInteraction.user.id, pullCost);
        if (!balanceCheck.success) {
            return buttonInteraction.reply({ content: balanceCheck.message, ephemeral: true });
        }

        // Deduct berries
        await DatabaseManager.updateUserBerries(buttonInteraction.user.id, -pullCost, 'Pull Again');
        const newBalance = balanceCheck.currentBalance - pullCost;

        // Get fruit and animate
        const fruit = getRandomFruit();
        console.log(`🎯 Pull again: ${fruit.name} (${fruit.rarity})`);

        await buttonInteraction.deferReply();
        await PullAnimator.runFullAnimation(buttonInteraction, fruit, newBalance);
        await this.setupButtons(buttonInteraction);
    }

    // Handle 10x pull
    static async handlePull10x(buttonInteraction) {
        const pullCost = parseInt(process.env.DEFAULT_PULL_COST) || 1000;
        const totalCost = pullCost * 10;
        
        // Check balance
        const balanceCheck = await this.checkBalance(buttonInteraction.user.id, totalCost);
        if (!balanceCheck.success) {
            return buttonInteraction.reply({ content: balanceCheck.message, ephemeral: true });
        }

        // Deduct berries
        await DatabaseManager.updateUserBerries(buttonInteraction.user.id, -totalCost, '10x Pull');
        const newBalance = balanceCheck.currentBalance - totalCost;

        // Get fruits and animate
        const fruits = Array.from({ length: 10 }, () => getRandomFruit());
        console.log(`🎯 10x pull again starting`);

        await buttonInteraction.deferReply();
        await PullAnimator.run10xAnimation(buttonInteraction, fruits, newBalance);
        await this.setupButtons(buttonInteraction);
    }

    // Check user balance
    static async checkBalance(userId, cost) {
        const userStats = await DatabaseManager.getUser(userId);
        
        if (!userStats || userStats.berries < cost) {
            const missing = cost - (userStats?.berries || 0);
            return {
                success: false,
                message: `💸 You need **${missing}** more berries!\n💡 Use \`/income\` to collect berries.`
            };
        }
        
        return { success: true, currentBalance: userStats.berries };
    }

    // Setup buttons after animation
    static async setupButtons(interaction) {
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

        // Setup collector for new buttons
        const collector = currentReply.createMessageComponentCollector({ time: 300000 });
        collector.on('collect', async (btnInteraction) => {
            await this.handle(btnInteraction, interaction.user.id);
        });
        collector.on('end', () => this.disable(interaction));
    }

    // Disable buttons
    static async disable(interaction) {
        try {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pull_again_disabled')
                        .setLabel('🍈 Pull Again')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('pull_10x_disabled')
                        .setLabel('🎰 Pull 10x')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true)
                );

            await interaction.editReply({ components: [disabledRow] });
        } catch (error) {
            console.log('Could not disable buttons - interaction may have been deleted');
        }
    }
}

module.exports = PullButtons;
