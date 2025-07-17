// src/commands/pull.js - Complete Pull Command with Mystery Layout
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getRandomFruit, getRarityColor, getRarityEmoji } = require('../data/devil-fruits');
const DatabaseManager = require('../database/manager');
const { calculateTotalCP } = require('../data/devil-fruits');

const HUNT_DESCRIPTIONS = [
    "🌊 Scanning the Grand Line's mysterious depths...",
    "⚡ Devil Fruit energy detected... analyzing power signature...",
    "🔥 Tremendous force breaking through dimensional barriers...",
    "💎 Legendary power crystallizing before your eyes..."
];

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
            const userId = interaction.user.id;
            const username = interaction.user.username;
            const guildId = interaction.guild?.id;
            const pullCount = interaction.options.getInteger('count') || 1;
            const pullCost = parseInt(process.env.DEFAULT_PULL_COST) || 100;
            const totalCost = pullCost * pullCount;

            // Ensure user exists in database
            await DatabaseManager.ensureUser(userId, username, guildId);

            // Check user's balance
            const userStats = await DatabaseManager.getUser(userId);
            if (!userStats || userStats.berries < totalCost) {
                const missingBerries = totalCost - (userStats?.berries || 0);
                const pullText = pullCount === 1 ? 'pull' : `${pullCount}x pull`;
                return interaction.reply({
                    content: `💸 You don't have enough berries for a ${pullText}! You need **${missingBerries}** more berries.\n💡 Use \`/income\` to collect berries or wait for passive income.`,
                    ephemeral: true
                });
            }

            // Deduct berries
            await DatabaseManager.updateUserBerries(userId, -totalCost, `${pullCount}x Devil Fruit Pull`);
            const newBalance = userStats.berries - totalCost;

            if (pullCount === 1) {
                // Single pull
                const targetFruit = getRandomFruit();
                console.log(`💸 Removed ${pullCost} berries from ${userId} (Single Pull). New balance: ${newBalance}`);
                console.log(`🎯 ${interaction.user.username} is pulling: ${targetFruit.name} (${targetFruit.rarity})`);
                
                await this.startImprovedAnimation(interaction, targetFruit, newBalance);
            } else {
                // 10x pull
                const fruits = [];
                for (let i = 0; i < pullCount; i++) {
                    fruits.push(getRandomFruit());
                }

                // Find highest rarity for animation
                const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical', 'omnipotent'];
                let bestFruit = fruits[0];
                for (const fruit of fruits) {
                    if (rarityOrder.indexOf(fruit.rarity) > rarityOrder.indexOf(bestFruit.rarity)) {
                        bestFruit = fruit;
                    }
                }

                console.log(`💸 Removed ${totalCost} berries from ${userId} (10x Pull). New balance: ${newBalance}`);
                console.log(`🎯 ${interaction.user.username} is doing 10x pull, best: ${bestFruit.name} (${bestFruit.rarity})`);

                await this.start10xAnimation(interaction, bestFruit, fruits, newBalance);
            }

        } catch (error) {
            console.error('Error in pull command:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred while processing your pull. Please try again.',
                    ephemeral: true
                });
            }
        }
    },

    async startImprovedAnimation(interaction, targetFruit, newBalance) {
        try {
            const frameDelay = 900; // 0.9 seconds per frame (1 second longer total)
            const animationFrames = 4; // 4 animation frames
            const outwardFrames = 10; // 10 frames for outward color spread
            const textRevealFrames = 6; // 6 frames for text reveal

            // Phase 1: Rainbow Hunt Animation (3.2 seconds)
            let currentFrame = 0;
            const initialEmbed = this.createAnimationFrame(currentFrame, targetFruit, animationFrames);
            await interaction.reply({ embeds: [initialEmbed] });

            console.log(`🎯 Starting improved animation: ${targetFruit.name} (${targetFruit.rarity})`);

            // Continue rainbow hunt frames
            for (currentFrame = 1; currentFrame < animationFrames; currentFrame++) {
                await new Promise(resolve => setTimeout(resolve, frameDelay));
                const frameEmbed = this.createAnimationFrame(currentFrame, targetFruit, animationFrames);
                await interaction.editReply({ embeds: [frameEmbed] });
            }

            // Phase 2: Outward Color Spread (4 seconds) - Rainbow FREEZES
            const rewardColor = getRarityColor(targetFruit.rarity);
            const rewardEmoji = getRarityEmoji(targetFruit.rarity);

            for (let outFrame = 0; outFrame < outwardFrames; outFrame++) {
                await new Promise(resolve => setTimeout(resolve, 400)); // 0.4s per frame
                const outwardEmbed = this.createOutwardColorFrame(outFrame, rewardColor, rewardEmoji);
                await interaction.editReply({ embeds: [outwardEmbed] });
            }

            // Phase 3: Save to database (silent, happens after outward reveal)
            console.log(`💾 Saving fruit to database: ${targetFruit.name}`);
            
            let result;
            try {
                result = await DatabaseManager.addDevilFruit(interaction.user.id, targetFruit);
            } catch (dbError) {
                console.error('Error adding devil fruit:', dbError);
                // Fallback result
                result = { 
                    duplicate_count: 1, 
                    total_cp: 250,
                    fruit: {
                        fruit_name: targetFruit.name,
                        fruit_rarity: targetFruit.rarity,
                        base_cp: Math.floor(targetFruit.multiplier * 100)
                    }
                };
            }

            // Phase 4: Progressive Text Reveal (4.5 seconds) - More frames for more fields
            for (let textFrame = 0; textFrame < 9; textFrame++) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const textEmbed = this.createTextRevealFrame(textFrame, targetFruit, rewardColor, rewardEmoji, result, newBalance);
                await interaction.editReply({ embeds: [textEmbed] });
            }

            // Phase 5: Final reveal with buttons
            const finalEmbed = await this.createFinalRevealEmbed(targetFruit, result, newBalance);
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pull_again')
                        .setLabel('🍈 Pull 1x')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('pull_10x')
                        .setLabel('🎰 Pull 10x')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('view_collection')
                        .setLabel('📚 Collection')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('view_stats')
                        .setLabel('📊 Stats')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({
                embeds: [finalEmbed],
                components: [actionRow]
            });

            // Setup button collector - Fix for Discord.js v14
            const response = await interaction.fetchReply();
            const collector = response.createMessageComponentCollector({
                time: 300000 // 5 minutes
            });

            collector.on('collect', async (buttonInteraction) => {
                try {
                    // Check if the user who clicked is the same as the one who initiated the pull
                    if (buttonInteraction.user.id !== interaction.user.id) {
                        return await buttonInteraction.reply({
                            content: '❌ You can only interact with your own pull results!',
                            ephemeral: true
                        });
                    }

                    if (buttonInteraction.customId === 'pull_again') {
                        await this.handlePullAgain(buttonInteraction);
                    } else if (buttonInteraction.customId === 'pull_10x') {
                        await this.handlePull10x(buttonInteraction);
                    } else if (buttonInteraction.customId === 'view_collection') {
                        await this.showFullCollection(buttonInteraction);
                    } else if (buttonInteraction.customId === 'view_stats') {
                        await this.showUserStats(buttonInteraction);
                    }
                } catch (error) {
                    console.error('Button interaction error:', error);
                    if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                        await buttonInteraction.reply({
                            content: '❌ An error occurred. Please try again.',
                            ephemeral: true
                        });
                    }
                }
            });

            collector.on('end', async () => {
                try {
                    const disabledRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('pull_again_disabled')
                                .setLabel('🍈 Pull 1x')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('pull_10x_disabled')
                                .setLabel('🎰 Pull 10x')
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('view_collection_disabled')
                                .setLabel('📚 Collection')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('view_stats_disabled')
                                .setLabel('📊 Stats')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true)
                        );

                    await interaction.editReply({ components: [disabledRow] });
                } catch (error) {
                    // Ignore errors when disabling buttons - interaction might have been deleted
                    console.log('Could not disable buttons - interaction may have been deleted');
                }
            });

        } catch (error) {
            console.error('Error in animation:', error);
            throw error;
        }
    },

    async handlePullAgain(buttonInteraction) {
        const userId = buttonInteraction.user.id;
        const username = buttonInteraction.user.username;
        const guildId = buttonInteraction.guild?.id;
        const pullCost = parseInt(process.env.DEFAULT_PULL_COST) || 100;

        // Ensure user exists in database
        await DatabaseManager.ensureUser(userId, username, guildId);

        // Check user's balance
        const userStats = await DatabaseManager.getUser(userId);
        if (!userStats || userStats.berries < pullCost) {
            const missingBerries = pullCost - (userStats?.berries || 0);
            return buttonInteraction.reply({
                content: `💸 You don't have enough berries! You need **${missingBerries}** more berries to pull.\n💡 Use \`/income\` to collect berries or wait for passive income.`,
                ephemeral: true
            });
        }

        // Deduct berries and get random fruit
        await DatabaseManager.updateUserBerries(userId, -pullCost, 'Pull Again');
        const newBalance = userStats.berries - pullCost;
        const targetFruit = getRandomFruit();

        console.log(`💸 Removed ${pullCost} berries from ${userId} (Pull Again). New balance: ${newBalance}`);
        console.log(`🎯 ${buttonInteraction.user.username} is pulling again: ${targetFruit.name} (${targetFruit.rarity})`);

        // Start full animation for button interaction
        await this.startButtonAnimation(buttonInteraction, targetFruit, newBalance);
    },

    async handlePull10x(buttonInteraction) {
        const userId = buttonInteraction.user.id;
        const guildId = buttonInteraction.guild.id;
        const pullCost = parseInt(process.env.DEFAULT_PULL_COST) || 100;
        const totalCost = pullCost * 10;

        // Check user's balance
        const userStats = await DatabaseManager.getUser(userId, guildId);
        if (!userStats || userStats.berries < totalCost) {
            const missingBerries = totalCost - (userStats?.berries || 0);
            return buttonInteraction.reply({
                content: `💸 You don't have enough berries for 10x pull! You need **${missingBerries}** more berries.\n💡 Use \`/income\` to collect berries or wait for passive income.`,
                ephemeral: true
            });
        }

        // Perform 10 pulls
        const fruits = [];
        for (let i = 0; i < 10; i++) {
            fruits.push(getRandomFruit());
        }

        // Find highest rarity
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical', 'omnipotent'];
        let bestFruit = fruits[0];
        for (const fruit of fruits) {
            if (rarityOrder.indexOf(fruit.rarity) > rarityOrder.indexOf(bestFruit.rarity)) {
                bestFruit = fruit;
            }
        }

        // Deduct berries
        await DatabaseManager.updateUserBerries(userId, guildId, -totalCost);
        const newBalance = userStats.berries - totalCost;

        // Show animation for best fruit
        await this.startButtonAnimation(buttonInteraction, bestFruit, newBalance);

        // After animation, save all fruits and show summary
        setTimeout(async () => {
            try {
                // Save all fruits to database
                for (const fruit of fruits) {
                    await DatabaseManager.addDevilFruit(userId, fruit);
                }

                // Create summary embed
                const summaryEmbed = await this.create10xSummaryEmbed(fruits, totalCost, newBalance);
                await buttonInteraction.followUp({
                    embeds: [summaryEmbed],
                    ephemeral: true
                });
            } catch (error) {
                console.error('Error in 10x pull summary:', error);
            }
        }, 11000); // After animation completes
    },

    async start10xAnimation(interaction, bestFruit, allFruits, newBalance) {
        try {
            const frameDelay = 900; // Match single pull timing
            const animationFrames = 4;
            const outwardFrames = 10;
            const textRevealFrames = 6;

            // Phase 1: Rainbow Hunt Animation for best fruit
            let currentFrame = 0;
            const initialEmbed = this.createAnimationFrame(currentFrame, bestFruit, animationFrames);
            await interaction.reply({ embeds: [initialEmbed] });

            console.log(`🎯 Starting 10x animation with best fruit: ${bestFruit.name} (${bestFruit.rarity})`);

            // Continue rainbow hunt frames
            for (currentFrame = 1; currentFrame < animationFrames; currentFrame++) {
                await new Promise(resolve => setTimeout(resolve, frameDelay));
                const frameEmbed = this.createAnimationFrame(currentFrame, bestFruit, animationFrames);
                await interaction.editReply({ embeds: [frameEmbed] });
            }

            // Phase 2: Outward Color Spread
            const rewardColor = getRarityColor(bestFruit.rarity);
            const rewardEmoji = getRarityEmoji(bestFruit.rarity);

            for (let outFrame = 0; outFrame < outwardFrames; outFrame++) {
                await new Promise(resolve => setTimeout(resolve, 400));
                const outwardEmbed = this.createOutwardColorFrame(outFrame, rewardColor, rewardEmoji);
                await interaction.editReply({ embeds: [outwardEmbed] });
            }

            // Phase 3: Save all fruits to database
            console.log(`💾 Saving ${allFruits.length} fruits to database`);
            
            const results = [];
            for (const fruit of allFruits) {
                try {
                    const result = await DatabaseManager.addDevilFruit(interaction.user.id, fruit);
                    results.push(result);
                } catch (dbError) {
                    console.error('Error adding fruit in 10x pull:', dbError);
                    results.push({ 
                        duplicate_count: 1, 
                        total_cp: 250,
                        fruit: { fruit_name: fruit.name, fruit_rarity: fruit.rarity }
                    });
                }
            }

            // Use the best fruit's result for animation
            const bestResult = results[0] || { duplicate_count: 1, total_cp: 250 };

            // Phase 4: Progressive Text Reveal for best fruit
            for (let textFrame = 0; textFrame < 9; textFrame++) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const textEmbed = this.createTextRevealFrame(textFrame, bestFruit, rewardColor, rewardEmoji, bestResult, newBalance);
                await interaction.editReply({ embeds: [textEmbed] });
            }

            // Phase 5: Final reveal with buttons
            const finalEmbed = await this.createFinalRevealEmbed(bestFruit, bestResult, newBalance);
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pull_again')
                        .setLabel('🍈 Pull 1x')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('pull_10x')
                        .setLabel('🎰 Pull 10x')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('view_collection')
                        .setLabel('📚 Collection')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('view_stats')
                        .setLabel('📊 Stats')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({
                embeds: [finalEmbed],
                components: [actionRow]
            });

            // Setup button collector for 10x pull
            const response = await interaction.fetchReply();
            const collector = response.createMessageComponentCollector({
                time: 300000 // 5 minutes
            });

            collector.on('collect', async (buttonInteraction) => {
                try {
                    if (buttonInteraction.user.id !== interaction.user.id) {
                        return await buttonInteraction.reply({
                            content: '❌ You can only interact with your own pull results!',
                            ephemeral: true
                        });
                    }

                    if (buttonInteraction.customId === 'pull_again') {
                        await this.handlePullAgain(buttonInteraction);
                    } else if (buttonInteraction.customId === 'pull_10x') {
                        await this.handlePull10x(buttonInteraction);
                    } else if (buttonInteraction.customId === 'view_collection') {
                        await this.showFullCollection(buttonInteraction);
                    } else if (buttonInteraction.customId === 'view_stats') {
                        await this.showUserStats(buttonInteraction);
                    }
                } catch (error) {
                    console.error('10x Button interaction error:', error);
                    if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                        await buttonInteraction.reply({
                            content: '❌ An error occurred. Please try again.',
                            ephemeral: true
                        });
                    }
                }
            });

            collector.on('end', async () => {
                try {
                    const disabledRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('pull_again_disabled')
                                .setLabel('🍈 Pull 1x')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('pull_10x_disabled')
                                .setLabel('🎰 Pull 10x')
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('view_collection_disabled')
                                .setLabel('📚 Collection')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('view_stats_disabled')
                                .setLabel('📊 Stats')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true)
                        );

                    await interaction.editReply({ components: [disabledRow] });
                } catch (error) {
                    console.log('Could not disable buttons after 10x pull - interaction may have been deleted');
                }
            });

            // Show 10x summary after 2 seconds
            setTimeout(async () => {
                try {
                    const summaryEmbed = await this.create10xSummaryEmbed(allFruits, allFruits.length * (parseInt(process.env.DEFAULT_PULL_COST) || 100), newBalance);
                    await interaction.followUp({
                        embeds: [summaryEmbed],
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error showing 10x summary:', error);
                }
            }, 2000);

        } catch (error) {
            console.error('Error in 10x animation:', error);
            throw error;
        }
    },
        // Same full animation as regular pull but for button interactions
        const frameDelay = 900; // Match main animation timing
        const animationFrames = 4;
        const outwardFrames = 10;
        const textRevealFrames = 6;

        // Defer the reply to avoid timeout
        await buttonInteraction.deferReply();

        // Phase 1: Rainbow Hunt Animation
        let currentFrame = 0;
        const initialEmbed = this.createAnimationFrame(currentFrame, targetFruit, animationFrames);
        await buttonInteraction.editReply({ embeds: [initialEmbed] });

        // Rainbow hunt frames
        for (currentFrame = 1; currentFrame < animationFrames; currentFrame++) {
            await new Promise(resolve => setTimeout(resolve, frameDelay));
            const frameEmbed = this.createAnimationFrame(currentFrame, targetFruit, animationFrames);
            await buttonInteraction.editReply({ embeds: [frameEmbed] });
        }

        // Phase 2: Outward Color Spread
        const rewardColor = getRarityColor(targetFruit.rarity);
        const rewardEmoji = getRarityEmoji(targetFruit.rarity);

        for (let outFrame = 0; outFrame < outwardFrames; outFrame++) {
            await new Promise(resolve => setTimeout(resolve, 400));
            const outwardEmbed = this.createOutwardColorFrame(outFrame, rewardColor, rewardEmoji);
            await buttonInteraction.editReply({ embeds: [outwardEmbed] });
        }

        // Phase 3: Save to database
        let result;
        try {
            result = await DatabaseManager.addDevilFruit(buttonInteraction.user.id, targetFruit);
        } catch (dbError) {
            console.error('Error adding devil fruit in button animation:', dbError);
            // Fallback result
            result = { 
                duplicate_count: 1, 
                total_cp: 250,
                fruit: {
                    fruit_name: targetFruit.name,
                    fruit_rarity: targetFruit.rarity,
                    base_cp: Math.floor(targetFruit.multiplier * 100)
                }
            };
        }

        // Phase 4: Progressive Text Reveal (4.5 seconds)
        for (let textFrame = 0; textFrame < 9; textFrame++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const textEmbed = this.createTextRevealFrame(textFrame, targetFruit, rewardColor, rewardEmoji, result, newBalance);
            await buttonInteraction.editReply({ embeds: [textEmbed] });
        }

        // Phase 5: Final reveal
        const finalEmbed = await this.createFinalRevealEmbed(targetFruit, result, newBalance);
        await buttonInteraction.editReply({ embeds: [finalEmbed] });
    },

    async showFullCollection(buttonInteraction) {
        const userId = buttonInteraction.user.id;
        const username = buttonInteraction.user.username;
        const guildId = buttonInteraction.guild?.id;

        try {
            // Ensure user exists in database
            await DatabaseManager.ensureUser(userId, username, guildId);

            const userData = await DatabaseManager.getUser(userId);
            const fruits = await DatabaseManager.getUserDevilFruits(userId);

            if (!fruits || fruits.length === 0) {
                return buttonInteraction.reply({
                    content: '📭 Your collection is empty! Use `/pull` to start collecting Devil Fruits.',
                    ephemeral: true
                });
            }

            const embed = await this.generateCollectionEmbed(buttonInteraction.user, userData, fruits, 1, Math.ceil(fruits.length / 10), 'all');
            
            const components = [];
            if (fruits.length > 10) {
                const navigationRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('collection_prev_1')
                            .setLabel('◀️ Previous')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('collection_next_1')
                            .setLabel('Next ▶️')
                            .setStyle(ButtonStyle.Secondary)
                    );
                components.push(navigationRow);
            }

            await buttonInteraction.reply({
                embeds: [embed],
                components: components,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error showing collection:', error);
            await buttonInteraction.reply({
                content: '❌ Error loading your collection. Please try again.',
                ephemeral: true
            });
        }
    },

    async showUserStats(buttonInteraction) {
        try {
            const userId = buttonInteraction.user.id;
            const username = buttonInteraction.user.username;
            const guildId = buttonInteraction.guild?.id;
            
            // Ensure user exists in database
            await DatabaseManager.ensureUser(userId, username, guildId);

            const userData = await DatabaseManager.getUser(userId);
            const fruits = await DatabaseManager.getUserDevilFruits(userId);

            if (!userData) {
                return buttonInteraction.reply({
                    content: '❌ User data not found. Please try again.',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor(0x0080FF)
                .setTitle('📊 Your Pirate Stats')
                .setThumbnail(buttonInteraction.user.displayAvatarURL())
                .addFields([
                    { name: '⭐ Level', value: `${userData.level || 1}`, inline: true },
                    { name: '💎 Base CP', value: `${userData.base_cp || 0}`, inline: true },
                    { name: '🔥 Total CP', value: `${userData.total_cp || 0}`, inline: true },
                    { name: '💰 Berries', value: `${(userData.berries || 0).toLocaleString()}`, inline: true },
                    { name: '🍈 Total Fruits', value: `${fruits ? fruits.length : 0}`, inline: true },
                    { name: '📚 Unique Fruits', value: `${fruits ? new Set(fruits.map(f => f.fruit_id)).size : 0}`, inline: true }
                ])
                .setFooter({ text: 'Keep collecting to increase your power!' })
                .setTimestamp();

            await buttonInteraction.reply({
                embeds: [embed],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error showing stats:', error);
            await buttonInteraction.reply({
                content: '❌ Error loading your stats. Please try again.',
                ephemeral: true
            });
        }
    },

    createAnimationFrame(frame, targetFruit, totalFrames) {
        const rainbowPattern = this.getSyncedRainbowPattern(frame);
        const embedColor = this.getEmbedColorSyncedToFirst(frame);
        const description = HUNT_DESCRIPTIONS[frame] || HUNT_DESCRIPTIONS[HUNT_DESCRIPTIONS.length - 1];
        
        // Show final layout but with ??? hiding the information
        const mysteriousInfo = `✨ **Devil Fruit Discovered!** ✨\n\n${rainbowPattern}\n\n` +
            `🍃 **Name:** ???\n` +
            `🔮 **Type:** ???\n` +
            `⭐ **Rarity:** ???\n` +
            `💪 **CP Multiplier:** ???\n` +
            `🌊 **Category:** ???\n` +
            `📊 **Status:** ???\n` +
            `⚡ **Power:** ???\n` +
            `🎯 **Total CP:** ???\n` +
            `💰 **Remaining Berries:** ???\n\n` +
            `${rainbowPattern}`;

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt')
            .setDescription(`${description}\n\n${mysteriousInfo}`)
            .setColor(embedColor)
            .setFooter({ text: '🌊 Searching the mysterious seas...' });
    },

    createOutwardColorFrame(outFrame, rewardColor, rewardEmoji) {
        const barLength = 20;
        
        // For a 20-length bar, center is between positions 9 and 10
        // So we start with both 9 and 10 as the center
        const positions = [];
        
        if (outFrame === 0) {
            // Frame 0: Both center positions
            positions.push(9, 10);
        } else {
            // Frame 1+: Center + expanding outward
            for (let i = 0; i <= outFrame; i++) {
                const leftPos = 9 - i;   // Expand left from position 9
                const rightPos = 10 + i; // Expand right from position 10
                
                if (leftPos >= 0) positions.push(leftPos);
                if (rightPos < barLength) positions.push(rightPos);
            }
        }

        const bar = Array(barLength).fill('⬛');
        
        // Fill positions with rarity emoji, keep rest as frozen rainbow
        for (let i = 0; i < barLength; i++) {
            if (positions.includes(i)) {
                bar[i] = rewardEmoji;
            } else {
                // Frozen rainbow pattern
                const rainbowColors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫'];
                bar[i] = rainbowColors[(i + 7 * 100) % 7]; // Frozen at frame 100
            }
        }

        const pattern = bar.join('');
        
        // Calculate embed color blend
        const blendRatio = Math.min(outFrame / 9, 1);
        const rainbowColor = 0x9932CC; // Purple from rainbow
        const embedColor = this.blendColors(rainbowColor, rewardColor, blendRatio);

        // Show final layout but still with ??? during color spread
        const mysteriousInfo = `✨ **Devil Fruit Discovered!** ✨\n\n${pattern}\n\n` +
            `🍃 **Name:** ???\n` +
            `🔮 **Type:** ???\n` +
            `⭐ **Rarity:** ???\n` +
            `💪 **CP Multiplier:** ???\n` +
            `🌊 **Category:** ???\n` +
            `📊 **Status:** ???\n` +
            `⚡ **Power:** ???\n` +
            `🎯 **Total CP:** ???\n` +
            `💰 **Remaining Berries:** ???\n\n` +
            `${pattern}`;

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt')
            .setDescription(`🔮 Mysterious power manifesting...\n\n${mysteriousInfo}`)
            .setColor(embedColor)
            .setFooter({ text: '⚡ Power crystallizing...' });
    },

    createTextRevealFrame(textFrame, targetFruit, rewardColor, rewardEmoji, result, newBalance) {
        const barLength = 20;
        const rewardBar = Array(barLength).fill(rewardEmoji).join('');
        
        // Get values for reveal - handle both database result and fallback
        const duplicateCount = result.duplicate_count || 1;
        const isNewDiscovery = duplicateCount === 1;
        const duplicateText = isNewDiscovery ? '✨ New Discovery!' : `📚 Total Owned: ${duplicateCount}`;
        const totalCp = result.total_cp || result.totalCp || 250;
        
        // Progressive text reveal with better formatting and spacing
        let description = `✨ **Devil Fruit Acquired!** ✨\n\n${rewardBar}\n\n`;
        
        // Reveal fields one by one with consistent formatting
        description += `🍃 **Name:** ${textFrame >= 0 ? targetFruit.name : '???'}\n`;
        description += `🔮 **Type:** ${textFrame >= 1 ? targetFruit.type : '???'}\n`;
        description += `⭐ **Rarity:** ${textFrame >= 2 ? targetFruit.rarity.charAt(0).toUpperCase() + targetFruit.rarity.slice(1) : '???'}\n`;
        description += `💪 **CP Multiplier:** ${textFrame >= 3 ? `${targetFruit.multiplier}x` : '???'}\n`;
        description += `🌊 **Category:** ${textFrame >= 4 ? (targetFruit.category || 'Unknown') : '???'}\n`;
        description += `📊 **Status:** ${textFrame >= 5 ? duplicateText : '???'}\n`;
        description += `⚡ **Power:** ${textFrame >= 6 ? targetFruit.power : '???'}\n`;
        description += `🎯 **Total CP:** ${textFrame >= 7 ? `${totalCp.toLocaleString()} CP` : '???'}\n`;
        description += `💰 **Remaining Berries:** ${textFrame >= 8 ? `${newBalance.toLocaleString()} berries` : '???'}\n\n`;
        
        description += `${rewardBar}`;

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt')
            .setDescription(description)
            .setColor(rewardColor)
            .setFooter({ text: '🎉 Added to your collection!' });
    },

    async createFinalRevealEmbed(targetFruit, result, newBalance) {
        const rarityEmoji = getRarityEmoji(targetFruit.rarity);
        const rarityColor = getRarityColor(targetFruit.rarity);
        const rewardBar = Array(20).fill(rarityEmoji).join('');
        
        // Get duplicate count from the database result - handle both formats
        const duplicateCount = result.duplicate_count || 1;
        const isNewDiscovery = duplicateCount === 1;
        const duplicateText = isNewDiscovery ? '✨ New Discovery!' : `📚 Total Owned: ${duplicateCount}`;
        
        // Use the total CP from database result - handle both formats
        const totalCp = result.total_cp || result.totalCp || 250;

        const description = `🎉 **Congratulations!** You've obtained a magnificent Devil Fruit!\n\n${rewardBar}\n\n` +
            `🍃 **Name:** ${targetFruit.name}\n` +
            `🔮 **Type:** ${targetFruit.type}\n` +
            `⭐ **Rarity:** ${targetFruit.rarity.charAt(0).toUpperCase() + targetFruit.rarity.slice(1)}\n` +
            `💪 **CP Multiplier:** ${targetFruit.multiplier}x\n` +
            `🌊 **Category:** ${targetFruit.category || 'Unknown'}\n` +
            `📊 **Status:** ${duplicateText}\n` +
            `⚡ **Power:** ${targetFruit.power}\n` +
            `🎯 **Total CP:** ${totalCp.toLocaleString()} CP\n` +
            `💰 **Remaining Berries:** ${newBalance.toLocaleString()} berries\n\n` +
            `${rewardBar}`;

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt Complete!')
            .setDescription(description)
            .setColor(rarityColor)
            .setFooter({ text: '🏴‍☠️ Your journey continues on the Grand Line!' })
            .setTimestamp();
    },

    async create10xSummaryEmbed(fruits, totalCost, newBalance) {
        // Count rarities
        const rarityCounts = {};
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical', 'omnipotent'];
        
        for (const rarity of rarityOrder) {
            rarityCounts[rarity] = 0;
        }
        
        for (const fruit of fruits) {
            rarityCounts[fruit.rarity]++;
        }

        // Create summary text
        let rarityText = '';
        for (const rarity of rarityOrder) {
            if (rarityCounts[rarity] > 0) {
                const emoji = getRarityEmoji(rarity);
                rarityText += `${emoji} **${rarity.charAt(0).toUpperCase() + rarity.slice(1)}**: ${rarityCounts[rarity]}\n`;
            }
        }

        // Create fruit list
        let fruitList = '';
        for (let i = 0; i < fruits.length; i++) {
            const fruit = fruits[i];
            const emoji = getRarityEmoji(fruit.rarity);
            fruitList += `${i + 1}. ${emoji} ${fruit.name}\n`;
        }

        return new EmbedBuilder()
            .setTitle('🎰 10x Pull Results!')
            .setDescription('Here\'s what you obtained from your 10x pull:')
            .setColor(0xFFD700)
            .addFields(
                { name: '📊 Rarity Breakdown', value: rarityText || 'None', inline: true },
                { name: '🍃 All Fruits Obtained', value: fruitList.slice(0, 1024) || 'None', inline: false },
                { name: '💸 Cost', value: `${totalCost.toLocaleString()} berries`, inline: true },
                { name: '💰 Remaining', value: `${newBalance.toLocaleString()} berries`, inline: true }
            )
            .setFooter({ text: '🎉 All fruits have been added to your collection!' })
            .setTimestamp();
    },

    async generateCollectionEmbed(user, userData, fruits, page, totalPages, rarityFilter) {
        const FRUITS_PER_PAGE = 10;
        const startIndex = (page - 1) * FRUITS_PER_PAGE;
        const endIndex = Math.min(startIndex + FRUITS_PER_PAGE, fruits.length);
        const pageFruits = fruits.slice(startIndex, endIndex);

        const embed = new EmbedBuilder()
            .setTitle(`🏴‍☠️ ${user.username}'s Devil Fruit Collection`)
            .setColor(0x9932CC)
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ 
                text: `Page ${page}/${totalPages} • Total: ${fruits.length} fruits • Rarity: ${rarityFilter}` 
            });

        if (pageFruits.length === 0) {
            embed.setDescription('📭 No fruits found for this filter.');
            return embed;
        }

        // Add fruits for current page
        if (pageFruits.length > 0) {
            const fruitsText = pageFruits.map((fruit, index) => {
                const emoji = getRarityEmoji(fruit.fruit_rarity);
                const totalCp = Math.floor(fruit.total_cp);
                const duplicateText = fruit.duplicate_count > 1 ? ` (x${fruit.duplicate_count})` : '';
                return `${startIndex + index + 1}. ${emoji} **${fruit.fruit_name}**${duplicateText}\n   ${fruit.fruit_type} • ${totalCp.toLocaleString()} CP`;
            }).join('\n\n');
            
            embed.setDescription(fruitsText);
        }

        // Add summary field
        const totalCp = fruits.reduce((sum, fruit) => sum + Math.floor(fruit.total_cp), 0);
        embed.addFields([
            { 
                name: '📊 Collection Stats', 
                value: `**Total CP:** ${totalCp.toLocaleString()}\n**Unique Fruits:** ${fruits.length}\n**Level:** ${userData.level}`, 
                inline: true 
            }
        ]);

        return embed;
    },

    getSyncedRainbowPattern(frame) {
        const rainbowColors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫'];
        const barLength = 20;
        const pattern = [];
        
        for (let i = 0; i < barLength; i++) {
            const colorIndex = (i - frame + 7 * 100) % 7;
            pattern.push(rainbowColors[colorIndex]);
        }
        
        return pattern.join('');
    },

    getEmbedColorSyncedToFirst(frame) {
        const rainbowHexColors = [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x8B00FF, 0x8B4513];
        return rainbowHexColors[(0 - frame + 7 * 100) % 7];
    },

    blendColors(color1, color2, ratio) {
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;
        
        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;
        
        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);
        
        return (r << 16) | (g << 8) | b;
    }
};
