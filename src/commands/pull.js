// src/commands/pull.js - Complete Fixed Pull Command
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
        .setDescription('Hunt for a Devil Fruit with cinematic animation!'),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            const pullCost = parseInt(process.env.DEFAULT_PULL_COST) || 100;

            // Check user's balance
            const userStats = await DatabaseManager.getUser(userId, guildId);
            if (!userStats || userStats.berries < pullCost) {
                const missingBerries = pullCost - (userStats?.berries || 0);
                return interaction.reply({
                    content: `💸 You don't have enough berries! You need **${missingBerries}** more berries to pull.\n💡 Use \`/income\` to collect berries or wait for passive income.`,
                    ephemeral: true
                });
            }

            // Deduct berries and get random fruit
            await DatabaseManager.updateUserBerries(userId, guildId, -pullCost);
            const newBalance = userStats.berries - pullCost;
            const targetFruit = getRandomFruit();

            console.log(`💸 Removed ${pullCost} berries from ${userId} (Devil Fruit Pull). New balance: ${newBalance}`);
            console.log(`🎯 ${interaction.user.username} is pulling: ${targetFruit.name} (${targetFruit.rarity})`);

            // Start the improved animation
            await this.startImprovedAnimation(interaction, targetFruit, newBalance);

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
            const frameDelay = 800; // 0.8 seconds per frame
            const animationFrames = 4; // 4 animation frames
            const outwardFrames = 10; // 10 frames for outward color spread
            const textRevealFrames = 6; // 6 frames for text reveal

            // Phase 1: Rainbow Hunt Animation
            let currentFrame = 0;
            const initialEmbed = this.createAnimationFrame(currentFrame, targetFruit, animationFrames);
            await interaction.reply({ embeds: [initialEmbed] });

            console.log(`🎯 Starting improved animation: ${targetFruit.name} (${targetFruit.rarity})`);

            // Rainbow hunt frames
            for (currentFrame = 1; currentFrame < animationFrames; currentFrame++) {
                await new Promise(resolve => setTimeout(resolve, frameDelay));
                const frameEmbed = this.createAnimationFrame(currentFrame, targetFruit, animationFrames);
                await interaction.editReply({ embeds: [frameEmbed] });
            }

            // Phase 2: Outward Color Spread (Frozen Rainbow)
            const rewardColor = getRarityColor(targetFruit.rarity);
            const rewardEmoji = getRarityEmoji(targetFruit.rarity);

            for (let outFrame = 0; outFrame < outwardFrames; outFrame++) {
                await new Promise(resolve => setTimeout(resolve, 400)); // Faster outward spread
                const outwardEmbed = this.createOutwardColorFrame(outFrame, rewardColor, rewardEmoji);
                await interaction.editReply({ embeds: [outwardEmbed] });
            }

            // Phase 3: Save to database (silent)
            const userStats = await DatabaseManager.getUser(interaction.user.id, interaction.guild.id);
            console.log(`💾 Saving fruit to database: ${targetFruit.name}`);
            
            try {
                await DatabaseManager.addDevilFruit(interaction.user.id, interaction.guild.id, targetFruit);
            } catch (dbError) {
                console.error('Error adding devil fruit:', dbError);
            }

            // Phase 4: Progressive Text Reveal
            for (let textFrame = 0; textFrame < textRevealFrames; textFrame++) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const textEmbed = this.createTextRevealFrame(textFrame, targetFruit, rewardColor, rewardEmoji, userStats, newBalance);
                await interaction.editReply({ embeds: [textEmbed] });
            }

            // Phase 5: Final reveal with buttons
            const finalEmbed = await this.createFinalRevealEmbed(targetFruit, userStats, newBalance);
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pull_again')
                        .setLabel('🍈 Pull Again')
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

            // Setup button collector
            const collector = interaction.createMessageComponentCollector({
                time: 300000 // 5 minutes
            });

            collector.on('collect', async (buttonInteraction) => {
                try {
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
                                .setLabel('🍈 Pull Again')
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
                    // Ignore errors when disabling buttons
                }
            });

        } catch (error) {
            console.error('Error in animation:', error);
            throw error;
        }
    },

    async handlePullAgain(buttonInteraction) {
        const userId = buttonInteraction.user.id;
        const guildId = buttonInteraction.guild.id;
        const pullCost = parseInt(process.env.DEFAULT_PULL_COST) || 100;

        // Check user's balance
        const userStats = await DatabaseManager.getUser(userId, guildId);
        if (!userStats || userStats.berries < pullCost) {
            const missingBerries = pullCost - (userStats?.berries || 0);
            return buttonInteraction.reply({
                content: `💸 You don't have enough berries! You need **${missingBerries}** more berries to pull.\n💡 Use \`/income\` to collect berries or wait for passive income.`,
                ephemeral: true
            });
        }

        // Deduct berries and get random fruit
        await DatabaseManager.updateUserBerries(userId, guildId, -pullCost);
        const newBalance = userStats.berries - pullCost;
        const targetFruit = getRandomFruit();

        // Start animation for button interaction
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
                    await DatabaseManager.addDevilFruit(userId, guildId, fruit);
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

    async startButtonAnimation(buttonInteraction, targetFruit, newBalance) {
        // Same animation as regular pull but for button interactions
        const frameDelay = 800;
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
        const userStats = await DatabaseManager.getUser(buttonInteraction.user.id, buttonInteraction.guild.id);
        await DatabaseManager.addDevilFruit(buttonInteraction.user.id, buttonInteraction.guild.id, targetFruit);

        // Phase 4: Progressive Text Reveal
        for (let textFrame = 0; textFrame < textRevealFrames; textFrame++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const textEmbed = this.createTextRevealFrame(textFrame, targetFruit, rewardColor, rewardEmoji, userStats, newBalance);
            await buttonInteraction.editReply({ embeds: [textEmbed] });
        }

        // Phase 5: Final reveal
        const finalEmbed = await this.createFinalRevealEmbed(targetFruit, userStats, newBalance);
        await buttonInteraction.editReply({ embeds: [finalEmbed] });
    },

    async showFullCollection(buttonInteraction) {
        const userId = buttonInteraction.user.id;
        const guildId = buttonInteraction.guild.id;

        try {
            const userData = await DatabaseManager.getUser(userId, guildId);
            const fruits = await DatabaseManager.getUserFruits(userId, guildId);

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
        // Import the stats command functionality
        const statsCommand = require('./stats');
        await statsCommand.execute(buttonInteraction);
    },

    createAnimationFrame(frame, targetFruit, totalFrames) {
        const rainbowPattern = this.getSyncedRainbowPattern(frame);
        const embedColor = this.getEmbedColorSyncedToFirst(frame);
        const description = HUNT_DESCRIPTIONS[frame] || HUNT_DESCRIPTIONS[HUNT_DESCRIPTIONS.length - 1];

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt')
            .setDescription(`${description}\n\n${rainbowPattern}`)
            .setColor(embedColor)
            .addFields(
                { name: '🍃 Fruit Name', value: '???', inline: true },
                { name: '🔮 Type', value: '???', inline: true },
                { name: '⭐ Rarity', value: '???', inline: true },
                { name: '💪 CP Multiplier', value: '???', inline: true },
                { name: '🌊 Category', value: '???', inline: true },
                { name: '📊 Status', value: '???', inline: true },
                { name: '⚡ Power', value: '???', inline: false },
                { name: '💰 Berries', value: '???', inline: true }
            )
            .setFooter({ text: '🌊 Searching the mysterious seas...' });
    },

    createOutwardColorFrame(outFrame, rewardColor, rewardEmoji) {
        const barLength = 20;
        const centerPosition = 9.5;
        const spread = outFrame; // 0 = center only, 1 = center + 1 each side, etc.
        
        const positions = [];
        for (let i = 0; i <= spread; i++) {
            const leftPos = Math.floor(centerPosition - i);
            const rightPos = Math.floor(centerPosition + i);
            if (leftPos >= 0) positions.push(leftPos);
            if (rightPos < barLength && rightPos !== leftPos) positions.push(rightPos);
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

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt')
            .setDescription(`🔮 Mysterious power manifesting...\n\n${pattern}`)
            .setColor(embedColor)
            .addFields(
                { name: '🍃 Fruit Name', value: '???', inline: true },
                { name: '🔮 Type', value: '???', inline: true },
                { name: '⭐ Rarity', value: '???', inline: true },
                { name: '💪 CP Multiplier', value: '???', inline: true },
                { name: '🌊 Category', value: '???', inline: true },
                { name: '📊 Status', value: '???', inline: true },
                { name: '⚡ Power', value: '???', inline: false },
                { name: '💰 Berries', value: '???', inline: true }
            )
            .setFooter({ text: '⚡ Power crystallizing...' });
    },

    createTextRevealFrame(textFrame, targetFruit, rewardColor, rewardEmoji, userStats, newBalance) {
        const barLength = 20;
        const rewardBar = Array(barLength).fill(rewardEmoji).join('');
        
        // Progressive text reveal
        const fields = [
            { name: '🍃 Fruit Name', value: textFrame >= 0 ? targetFruit.name : '???', inline: true },
            { name: '🔮 Type', value: textFrame >= 1 ? targetFruit.type : '???', inline: true },
            { name: '⭐ Rarity', value: textFrame >= 2 ? targetFruit.rarity.charAt(0).toUpperCase() + targetFruit.rarity.slice(1) : '???', inline: true },
            { name: '💪 CP Multiplier', value: textFrame >= 3 ? `${targetFruit.multiplier}x` : '???', inline: true },
            { name: '🌊 Category', value: textFrame >= 4 ? (targetFruit.category || 'Unknown') : '???', inline: true },
            { name: '📊 Status', value: textFrame >= 5 ? 'New Discovery!' : '???', inline: true },
            { name: '⚡ Power', value: textFrame >= 5 ? targetFruit.power : '???', inline: false },
            { name: '💰 Berries', value: textFrame >= 5 ? `${newBalance.toLocaleString()} berries` : '???', inline: true }
        ];

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt')
            .setDescription(`✨ **Devil Fruit Acquired!** ✨\n\n${rewardBar}`)
            .setColor(rewardColor)
            .addFields(fields)
            .setFooter({ text: '🎉 Added to your collection!' });
    },

    async createFinalRevealEmbed(targetFruit, userStats, newBalance) {
        const rarityEmoji = getRarityEmoji(targetFruit.rarity);
        const rarityColor = getRarityColor(targetFruit.rarity);
        const rewardBar = Array(20).fill(rarityEmoji).join('');
        
        // Get duplicate count
        const totalOwned = await DatabaseManager.getUserFruitCount(userStats.user_id, userStats.guild_id, targetFruit.id);
        const isNewDiscovery = totalOwned === 1;
        const duplicateText = isNewDiscovery ? '✨ New Discovery!' : `📚 Total Owned: ${totalOwned}`;
        
        // Calculate total CP
        const baseCp = targetFruit.baseCp || 300;
        const totalCp = Math.floor(baseCp * targetFruit.multiplier * (1 + (totalOwned - 1) * 0.01));

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt Complete!')
            .setDescription(`🎉 **Congratulations!** You've obtained a magnificent Devil Fruit!\n\n${rewardBar}`)
            .setColor(rarityColor)
            .addFields(
                { name: '🍃 Fruit Name', value: targetFruit.name, inline: true },
                { name: '🔮 Type', value: targetFruit.type, inline: true },
                { name: '⭐ Rarity', value: targetFruit.rarity.charAt(0).toUpperCase() + targetFruit.rarity.slice(1), inline: true },
                { name: '💪 CP Multiplier', value: `${targetFruit.multiplier}x`, inline: true },
                { name: '🌊 Category', value: targetFruit.category || 'Unknown', inline: true },
                { name: '📊 Status', value: duplicateText, inline: true },
                { name: '⚡ Power Description', value: targetFruit.power, inline: false },
                { name: '🎯 Total CP', value: `${totalCp.toLocaleString()} CP`, inline: true },
                { name: '💰 Remaining Berries', value: `${newBalance.toLocaleString()} berries`, inline: true }
            )
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
