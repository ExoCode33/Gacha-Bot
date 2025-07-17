// src/commands/pull.js - Complete Fixed Pull Command
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getRandomFruit, getRarityColor, getRarityEmoji } = require('../data/devil-fruits');
const DatabaseManager = require('../database/manager');
const EconomySystem = require('../systems/economy');

// Animation constants
const rainbowColors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫'];
const rainbowEmbedColors = [0xFF0000, 0xFF8000, 0xFFFF00, 0x00FF00, 0x0080FF, 0x8000FF, 0x654321];

// Short, impactful descriptions
const HUNT_DESCRIPTIONS = [
    "🌊 Scanning the Grand Line's mysterious depths...",
    "⚡ Devil Fruit energy detected... analyzing power signature...",
    "🔥 Tremendous force breaking through dimensional barriers...",
    "💎 Legendary power crystallizing before your eyes...",
    "🌟 The sea grants you a magnificent Devil Fruit!"
];

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
    },

    async generateCollectionEmbed(user, userData, fruits, page, totalPages, rarityFilter) {
        const FRUITS_PER_PAGE = 10;
        const startIndex = (page - 1) * FRUITS_PER_PAGE;
        const endIndex = Math.min(startIndex + FRUITS_PER_PAGE, fruits.length);
        const pageFruits = fruits.slice(startIndex, endIndex);

        // Calculate user's total CP
        const userLevel = userData.level || 0;
        const totalCP = userData.total_cp || userData.base_cp;

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Devil Fruit Collection`)
            .setThumbnail(user.displayAvatarURL())
            .setColor(0x8B4513)
            .setTimestamp();

        // Add user stats
        embed.addFields({
            name: '📊 Collection Stats',
            value: [
                `**Total Fruits:** ${fruits.length}`,
                `**Total CP:** ${totalCP.toLocaleString()}`,
                `**Level:** ${userLevel}`,
                `**Berries:** ${userData.berries?.toLocaleString() || 0}`
            ].join('\n'),
            inline: true
        });

        // Add rarity breakdown
        const rarityBreakdown = this.getRarityBreakdown(fruits);
        embed.addFields({
            name: '🎯 Rarity Breakdown',
            value: rarityBreakdown,
            inline: true
        });

        // Add fruits for current page
        if (pageFruits.length > 0) {
            const fruitsText = pageFruits.map((fruit) => {
                const emoji = getRarityEmoji(fruit.fruit_rarity);
                const cpMultiplier = (fruit.base_cp / 100).toFixed(2);
                const duplicates = fruit.duplicate_count || 1;
                const duplicateText = duplicates > 1 ? ` (+${duplicates - 1})` : '';
                
                return `${emoji} **${fruit.fruit_name}**${duplicateText}\n` +
                       `   *${fruit.fruit_type}* • ${cpMultiplier}x CP`;
            }).join('\n\n');

            embed.addFields({
                name: rarityFilter ? 
                    `${getRarityEmoji(rarityFilter)} ${rarityFilter.charAt(0).toUpperCase() + rarityFilter.slice(1)} Fruits` : 
                    '🍈 Your Devil Fruits',
                value: fruitsText || 'No fruits found.',
                inline: false
            });
        }

        // Add page info if multiple pages
        if (totalPages > 1) {
            embed.setFooter({
                text: `Page ${page}/${totalPages} • ${fruits.length} total fruits`
            });
        }

        return embed;
    },

    getRarityBreakdown(fruits) {
        const rarityCount = {
            common: 0,
            uncommon: 0,
            rare: 0,
            epic: 0,
            legendary: 0,
            mythical: 0,
            omnipotent: 0
        };

        fruits.forEach(fruit => {
            if (rarityCount.hasOwnProperty(fruit.fruit_rarity)) {
                rarityCount[fruit.fruit_rarity]++;
            }
        });

        return Object.entries(rarityCount)
            .filter(([rarity, count]) => count > 0)
            .map(([rarity, count]) => `${getRarityEmoji(rarity)} ${count}`)
            .join('\n') || 'No fruits yet';
            
            // Generate random fruit
            const fruit = getRandomFruit();
            console.log(`🎯 ${username} is pulling: ${fruit.name} (${fruit.rarity})`);
            
            // Start the improved shorter animation
            await this.startImprovedAnimation(interaction, fruit, purchaseResult.newBalance);
            
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

    async startButtonAnimation(buttonInteraction, targetFruit, newBalance) {
        // Same animation as regular pull but for button interactions
        const frameDelay = 800;
        const animationFrames = 4;
        const outwardFrames = 10;
        const textRevealFrames = 6;
        
        try {
            console.log(`🎯 Starting button animation: ${targetFruit.name} (${targetFruit.rarity})`);
            
            const rewardColor = getRarityColor(targetFruit.rarity);
            const rewardEmoji = getRarityEmoji(targetFruit.rarity);
            
            // Phase 1: Animation frames
            for (let frame = 0; frame < animationFrames; frame++) {
                const embed = this.createFixedSizeAnimationFrame(frame);
                await buttonInteraction.editReply({ embeds: [embed] });
                await new Promise(resolve => setTimeout(resolve, frameDelay));
            }
            
            // Phase 2: Outward color spread
            for (let outFrame = 0; outFrame < outwardFrames; outFrame++) {
                const embed = this.createOutwardColorFrame(outFrame, rewardColor, rewardEmoji);
                await buttonInteraction.editReply({ embeds: [embed] });
                await new Promise(resolve => setTimeout(resolve, 400));
            }
            
            // Save to database
            const result = await DatabaseManager.addDevilFruit(buttonInteraction.user.id, targetFruit);
            const userStats = {
                duplicateCount: result.duplicateCount,
                isNewFruit: result.isNewFruit,
                totalCp: result.totalCp,
                newBalance: newBalance
            };
            
            // Phase 3: Progressive text reveal
            for (let textFrame = 0; textFrame < textRevealFrames; textFrame++) {
                const embed = this.createProgressiveTextReveal(textFrame, targetFruit, userStats, newBalance, rewardColor, rewardEmoji);
                await buttonInteraction.editReply({ embeds: [embed] });
                
                if (textFrame < textRevealFrames - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 400));
            
            // Final reveal with buttons
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
            
            await buttonInteraction.editReply({
                embeds: [finalEmbed],
                components: [actionRow]
            });
            
        } catch (error) {
            console.error('🚨 Button Animation Error:', error);
            const result = await DatabaseManager.addDevilFruit(buttonInteraction.user.id, targetFruit);
            const fallbackEmbed = await this.createFinalRevealEmbed(targetFruit, result, newBalance);
            await buttonInteraction.editReply({ embeds: [fallbackEmbed] });
        }
    },

    async handle10xPull(buttonInteraction) {
        try {
            await buttonInteraction.deferReply();
            
            const userId = buttonInteraction.user.id;
            const username = buttonInteraction.user.username;
            const pullCost = EconomySystem.getEconomyConfig().pullCost * 10;
            
            // Check if user has enough berries for 10 pulls
            const currentBerries = await DatabaseManager.getUserBerries(userId);
            if (currentBerries < pullCost) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Insufficient Berries for 10x Pull')
                    .setDescription(`You need ${pullCost.toLocaleString()} berries but only have ${currentBerries.toLocaleString()}.`)
                    .setFooter({ text: 'Use /income to earn more berries!' });
                
                return await buttonInteraction.editReply({ embeds: [errorEmbed] });
            }
            
            // Deduct berries
            const newBalance = await DatabaseManager.updateUserBerries(userId, -pullCost, '10x Devil Fruit Pull');
            
            // Generate 10 fruits
            const pulledFruits = [];
            for (let i = 0; i < 10; i++) {
                pulledFruits.push(getRandomFruit());
            }
            
            // Find highest rarity for animation
            const rarityOrder = ['omnipotent', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
            const bestFruit = pulledFruits.reduce((best, fruit) => {
                const bestIndex = rarityOrder.indexOf(best.rarity);
                const fruitIndex = rarityOrder.indexOf(fruit.rarity);
                return fruitIndex < bestIndex ? fruit : best;
            });
            
            // Animate the best fruit
            await this.startButtonAnimation(buttonInteraction, bestFruit, newBalance);
            
            // Wait a moment then show summary
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Save all fruits to database
            const results = [];
            for (const fruit of pulledFruits) {
                const result = await DatabaseManager.addDevilFruit(userId, fruit);
                results.push({ fruit, result });
            }
            
            // Create 10x summary embed
            const summaryEmbed = await this.create10xSummaryEmbed(results, newBalance, pullCost);
            
            await buttonInteraction.followUp({ embeds: [summaryEmbed] });
            
        } catch (error) {
            console.error('Error in 10x pull:', error);
            await buttonInteraction.editReply({ content: 'Error processing 10x pull. Please try again.' });
        }
    },

    async create10xSummaryEmbed(results, newBalance, totalCost) {
        const rarityCount = {};
        const rarityEmojis = {
            common: '🟫', uncommon: '🟩', rare: '🟦', epic: '🟪',
            legendary: '🟨', mythical: '🟧', omnipotent: '🌈'
        };
        
        // Count rarities and show fruits
        const fruitList = results.map((item, index) => {
            const { fruit, result } = item;
            const rarity = fruit.rarity;
            rarityCount[rarity] = (rarityCount[rarity] || 0) + 1;
            
            const emoji = rarityEmojis[rarity];
            const duplicateText = result.duplicateCount > 1 ? ` (${result.duplicateCount})` : '';
            const newText = result.isNewFruit ? ' ✨' : '';
            
            return `${emoji} **${fruit.name}**${duplicateText}${newText}`;
        });
        
        // Create rarity summary
        const raritySummary = Object.entries(rarityCount)
            .sort(([,a], [,b]) => b - a)
            .map(([rarity, count]) => `${rarityEmojis[rarity]} ${rarity}: ${count}`)
            .join('\n');
        
        return new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🎰 10x Devil Fruit Pull Results!')
            .setDescription(`**Total Cost:** ${totalCost.toLocaleString()} berries\n**New Balance:** ${newBalance.toLocaleString()} berries`)
            .addFields([
                { name: '📊 Rarity Summary', value: raritySummary, inline: true },
                { name: '🍈 All Fruits Obtained', value: fruitList.join('\n'), inline: false }
            ])
            .setFooter({ text: '✨ = New discovery | (Number) = Duplicate count' })
            .setTimestamp();
    },

    async showFullCollection(buttonInteraction) {
        try {
            await buttonInteraction.deferReply({ ephemeral: true });
            
            const userId = buttonInteraction.user.id;
            const targetUser = buttonInteraction.user;
            
            // Use the same logic as /collection command
            const userData = await DatabaseManager.getUser(userId);
            if (!userData) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('📚 Empty Collection')
                    .setDescription('You haven\'t started your pirate journey yet!')
                    .setFooter({ text: 'Use /pull to get your first Devil Fruit.' });
                
                return await buttonInteraction.editReply({ embeds: [embed] });
            }

            const userFruits = await DatabaseManager.getUserDevilFruits(userId);
            
            if (userFruits.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('📚 Empty Collection')
                    .setDescription('Your collection is empty! Use `/pull` to get your first Devil Fruit.')
                    .setFooter({ text: 'Start your pirate journey today!' });
                
                return await buttonInteraction.editReply({ embeds: [embed] });
            }

            // Sort fruits by rarity and name
            const rarityOrder = ['omnipotent', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
            userFruits.sort((a, b) => {
                const rarityDiff = rarityOrder.indexOf(a.fruit_rarity) - rarityOrder.indexOf(b.fruit_rarity);
                if (rarityDiff !== 0) return rarityDiff;
                return a.fruit_name.localeCompare(b.fruit_name);
            });

            // Create collection embed with pagination
            const embed = await this.generateCollectionEmbed(targetUser, userData, userFruits, 1, Math.ceil(userFruits.length / 10), null);
            
            // Create pagination buttons if needed
            const components = [];
            if (userFruits.length > 10) {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`collection_prev_${userId}_1_all`)
                            .setLabel('◀️ Previous')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(`collection_page_${userId}_1_all`)
                            .setLabel(`1/${Math.ceil(userFruits.length / 10)}`)
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(`collection_next_${userId}_1_all`)
                            .setLabel('Next ▶️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(userFruits.length <= 10)
                    );
                components.push(row);
            }

            await buttonInteraction.editReply({
                embeds: [embed],
                components: components
            });

        } catch (error) {
            console.error('Error showing full collection:', error);
            await buttonInteraction.editReply({ content: 'Error loading your collection.' });
        }

    async startImprovedAnimation(interaction, targetFruit, newBalance) {
        const frameDelay = 800; // 0.8 seconds per frame
        const animationFrames = 4; // 4 animation frames
        const outwardFrames = 10; // 10 frames for outward color spread (center to edges)
        const textRevealFrames = 6; // 6 frames for text revelation
        
        try {
            console.log(`🎯 Starting improved animation: ${targetFruit.name} (${targetFruit.rarity})`);
            
            const rewardColor = getRarityColor(targetFruit.rarity);
            const rewardEmoji = getRarityEmoji(targetFruit.rarity);
            
            // Phase 1: Animation frames (0-3, total 3.2 seconds)
            for (let frame = 0; frame < animationFrames; frame++) {
                const embed = this.createFixedSizeAnimationFrame(frame);
                
                if (frame === 0) {
                    await interaction.reply({ embeds: [embed] });
                } else {
                    await interaction.editReply({ embeds: [embed] });
                }
                
                await new Promise(resolve => setTimeout(resolve, frameDelay));
            }
            
            // Phase 2: Outward color spread (10 frames, 4 seconds)
            for (let outFrame = 0; outFrame < outwardFrames; outFrame++) {
                const embed = this.createOutwardColorFrame(outFrame, rewardColor, rewardEmoji);
                
                await interaction.editReply({ embeds: [embed] });
                await new Promise(resolve => setTimeout(resolve, 400)); // Faster for smooth spread
            }
            
            // NOW save to database AFTER the visual reveal is complete
            console.log(`💾 Saving fruit to database: ${targetFruit.name}`);
            const result = await DatabaseManager.addDevilFruit(interaction.user.id, targetFruit);
            
            // Calculate user stats
            const userStats = {
                duplicateCount: result.duplicateCount,
                isNewFruit: result.isNewFruit,
                totalCp: result.totalCp,
                newBalance: newBalance
            };
            
            // Phase 3: Progressive text reveal (6 frames, 3 seconds)
            for (let textFrame = 0; textFrame < textRevealFrames; textFrame++) {
                const embed = this.createProgressiveTextReveal(textFrame, targetFruit, userStats, newBalance, rewardColor, rewardEmoji);
                
                await interaction.editReply({ embeds: [embed] });
                
                if (textFrame < textRevealFrames - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            // Brief pause before final reveal with buttons
            await new Promise(resolve => setTimeout(resolve, 400));
            
            // Final reveal with buttons
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
            
            // Set up button collector
            const collector = interaction.channel.createMessageComponentCollector({ 
                filter: (i) => i.user.id === interaction.user.id,
                time: 300000
            });
            
            collector.on('collect', async (buttonInteraction) => {
                try {
                    if (buttonInteraction.customId === 'pull_again') {
                        // For "Pull Again", create a new pull with full animation
                        await buttonInteraction.deferReply();
                        
                        // Check if user has enough berries
                        const purchaseResult = await EconomySystem.purchasePull(buttonInteraction.user.id, buttonInteraction.user.username);
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
                            
                            return await buttonInteraction.editReply({ embeds: [errorEmbed] });
                        }
                        
                        // Generate new fruit and start NEW animation with proper interaction
                        const newFruit = getRandomFruit();
                        await this.startButtonAnimation(buttonInteraction, newFruit, purchaseResult.newBalance);
                        
                    } else if (buttonInteraction.customId === 'pull_10x') {
                        // 10x Pull with best rarity animation
                        await this.handle10xPull(buttonInteraction);
                        
                    } else if (buttonInteraction.customId === 'view_collection') {
                        // Show full collection using the collection command logic
                        await this.showFullCollection(buttonInteraction);
                        
                    } else if (buttonInteraction.customId === 'view_stats') {
                        await this.showStats(buttonInteraction);
                    }
                } catch (error) {
                    console.error('Button interaction error:', error);
                }
            });
            
            collector.on('end', () => {
                interaction.editReply({ components: [] }).catch(() => {});
            });
            
            console.log(`🎊 Pull success: ${targetFruit.name} (${targetFruit.rarity}) for ${interaction.user.username}`);
            
        } catch (error) {
            console.error('🚨 Animation Error:', error);
            
            // Fallback
            const result = await DatabaseManager.addDevilFruit(interaction.user.id, targetFruit);
            const fallbackEmbed = await this.createFinalRevealEmbed(targetFruit, result, newBalance);
            await interaction.editReply({ embeds: [fallbackEmbed] });
        }
    },

    getSyncedRainbowPattern(frame, barLength = 20) {
        const positions = [];
        for (let i = 0; i < barLength; i++) {
            const colorIndex = (i - frame + rainbowColors.length * 100) % rainbowColors.length;
            positions.push(rainbowColors[colorIndex]);
        }
        return positions.join(' ');
    },

    getEmbedColorSyncedToFirst(frame) {
        const firstSquareColorIndex = (0 - frame + rainbowColors.length * 100) % rainbowColors.length;
        return rainbowEmbedColors[firstSquareColorIndex];
    },

    createFixedSizeAnimationFrame(frame) {
        const rainbowPattern = this.getSyncedRainbowPattern(frame);
        const embedColor = this.getEmbedColorSyncedToFirst(frame);
        const description = HUNT_DESCRIPTIONS[frame] || HUNT_DESCRIPTIONS[HUNT_DESCRIPTIONS.length - 1];
        
        // Fixed size content that matches final reveal size
        const content = [
            `${rainbowPattern}`,
            "",
            `🏴‍☠️ **DEVIL FRUIT HUNT** 🏴‍☠️`,
            "",
            `*${description}*`,
            "",
            `🍈 **Fruit:** ???`,
            `⭐ **Type:** ???`,
            `🎯 **Rarity:** ???`,
            `🔥 **CP Multiplier:** ???`,
            `🌟 **Category:** ???`,
            "",
            `🔄 **Status:** ???`,
            "",
            `📖 **Power Description:**`,
            `*Scanning...*`,
            "",
            `💰 **Balance:** ???`,
            `🎯 **Total Owned:** ???`,
            "",
            `${rainbowPattern}`
        ].join('\n');
        
        return new EmbedBuilder()
            .setColor(embedColor)
            .setTitle("🌊 Scanning the Grand Line...")
            .setDescription(content)
            .setFooter({ text: "🍈 Devil Fruit materializing..." })
            .setTimestamp();
    },

    createOutwardColorFrame(outFrame, rewardColor, rewardEmoji) {
        const barLength = 20;
        const centerPosition = 9.5;
        const spread = outFrame; // 0 = center only, 1 = center + 1 each side, etc.
        
        const positions = [];
        for (let i = 0; i < barLength; i++) {
            const distanceFromCenter = Math.abs(i - centerPosition);
            
            if (distanceFromCenter <= spread) {
                positions.push(rewardEmoji);
            } else {
                // FROZEN rainbow - use fixed frame 0 so it doesn't move
                const colorIndex = (i + 7 * 100) % 7; // No frame progression
                positions.push(rainbowColors[colorIndex]);
            }
        }
        
        const transitionBar = positions.join(' ');
        
        // Same fixed size content, no fruit info yet
        const content = [
            `${transitionBar}`,
            "",
            `💎 **LEGENDARY MANIFESTATION** 💎`,
            "",
            `🍈 **Fruit:** ???`,
            `⭐ **Type:** ???`,
            `🎯 **Rarity:** ???`,
            `🔥 **CP Multiplier:** ???`,
            `🌟 **Category:** ???`,
            "",
            `🔄 **Status:** ???`,
            "",
            `📖 **Power Description:**`,
            `*Power crystallizing...*`,
            "",
            `💰 **Balance:** ???`,
            `🎯 **Total Owned:** ???`,
            "",
            `${transitionBar}`
        ].join('\n');
        
        // Gradually blend colors
        const progress = Math.min(outFrame / (10 - 1), 1);
        const currentRainbowColor = this.getEmbedColorSyncedToFirst(0); // Use frame 0 for frozen color
        const blendedColor = this.blendColors(currentRainbowColor, rewardColor, progress);
        
        return new EmbedBuilder()
            .setColor(blendedColor)
            .setTitle("💎 Devil Fruit Hunt - Power Crystallizing")
            .setDescription(content)
            .setFooter({ text: "💎 Manifestation in progress..." })
            .setTimestamp();
    },

    createProgressiveTextReveal(textFrame, targetFruit, userStats, newBalance, rewardColor, rewardEmoji) {
        const rewardBar = Array(20).fill(rewardEmoji).join(' ');
        
        const rarityTitles = {
            common: "Common Discovery",
            uncommon: "Uncommon Treasure", 
            rare: "Rare Artifact",
            epic: "Epic Legend",
            legendary: "Legendary Relic",
            mythical: "Mythical Wonder",
            omnipotent: "Omnipotent Force"
        };
        
        const typeEmojis = {
            'Paramecia': '🔮',
            'Zoan': '🐺',
            'Logia': '🌪️',
            'Ancient Zoan': '🦕',
            'Mythical Zoan': '🐉',
            'Special Paramecia': '✨'
        };
        
        // Progressive reveal based on frame
        let fruitName = textFrame >= 0 ? targetFruit.name : "???";
        let fruitType = textFrame >= 1 ? targetFruit.type : "???";
        let fruitRarity = textFrame >= 2 ? targetFruit.rarity.charAt(0).toUpperCase() + targetFruit.rarity.slice(1) : "???";
        let cpMultiplier = textFrame >= 3 ? `${(targetFruit.multiplier || 1.0).toFixed(2)}x` : "???";
        let category = textFrame >= 4 ? (targetFruit.fruitType || 'Unknown') : "???";
        
        const duplicateCount = userStats.duplicateCount || 1;
        let status = textFrame >= 5 ? 
            (duplicateCount > 1 ? 
                `🔄 **Duplicate #${duplicateCount}** (+${((duplicateCount - 1) * 1).toFixed(0)}% CP Bonus!)` : 
                `✨ **New Discovery!** First time obtaining this fruit!`) : "???";
        
        let powerDesc = textFrame >= 5 ? 
            (targetFruit.power || 'A mysterious power awaits discovery...') : "???";
        
        let balance = textFrame >= 5 ? newBalance.toLocaleString() : "???";
        let totalOwned = textFrame >= 5 ? duplicateCount.toString() : "???";
        
        const content = [
            `${rewardBar}`,
            "",
            `🎉 **${rarityTitles[targetFruit.rarity] || 'Mysterious Discovery'}**`,
            "",
            `🍈 **Fruit:** ${fruitName}`,
            `${typeEmojis[targetFruit.type] || '⭐'} **Type:** ${fruitType}`,
            `🎯 **Rarity:** ${fruitRarity}`,
            `🔥 **CP Multiplier:** ${cpMultiplier}`,
            `🌟 **Category:** ${category}`,
            "",
            `${status}`,
            "",
            `📖 **Power Description:**`,
            `*${powerDesc}*`,
            "",
            `💰 **Balance:** ${balance} berries`,
            `🎯 **Total Owned:** ${totalOwned}`,
            "",
            `${rewardBar}`
        ].join('\n');
        
        return new EmbedBuilder()
            .setColor(rewardColor)
            .setTitle(userStats.isNewFruit ? "🏴‍☠️ New Devil Fruit Discovered!" : "🏴‍☠️ Devil Fruit Enhanced!")
            .setDescription(content)
            .setFooter({ text: "🌊 Information materializing..." })
            .setTimestamp();
    },

    // Helper function to blend two colors
    blendColors(color1, color2, ratio) {
        const r1 = (color1 >> 16) & 255;
        const g1 = (color1 >> 8) & 255;
        const b1 = color1 & 255;
        
        const r2 = (color2 >> 16) & 255;
        const g2 = (color2 >> 8) & 255;
        const b2 = color2 & 255;
        
        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);
        
        return (r << 16) | (g << 8) | b;
    },

    async createFinalRevealEmbed(targetFruit, result, newBalance) {
        const rarityEmoji = getRarityEmoji(targetFruit.rarity);
        const rarityColor = getRarityColor(targetFruit.rarity);
        const rewardBar = Array(20).fill(rarityEmoji).join(' ');
        
        const rarityTitles = {
            common: "Common Discovery",
            uncommon: "Uncommon Treasure",
            rare: "Rare Artifact", 
            epic: "Epic Legend",
            legendary: "Legendary Relic",
            mythical: "Mythical Wonder",
            omnipotent: "Omnipotent Force"
        };
        
        const typeEmojis = {
            'Paramecia': '🔮',
            'Zoan': '🐺', 
            'Logia': '🌪️',
            'Ancient Zoan': '🦕',
            'Mythical Zoan': '🐉',
            'Special Paramecia': '✨'
        };
        
        const duplicateCount = result.duplicateCount || 1;
        const duplicateInfo = duplicateCount > 1 ? 
            `🔄 **Duplicate #${duplicateCount}** (+${((duplicateCount - 1) * 1).toFixed(0)}% CP Bonus!)` : 
            `✨ **New Discovery!** First time obtaining this fruit!`;
        
        const content = [
            `${rewardBar}`,
            "",
            `🎉 **${rarityTitles[targetFruit.rarity] || 'Mysterious Discovery'}**`,
            "",
            `🍈 **${targetFruit.name}**`,
            `${typeEmojis[targetFruit.type] || '🍈'} **Type:** ${targetFruit.type}`,
            `⭐ **Rarity:** ${targetFruit.rarity.charAt(0).toUpperCase() + targetFruit.rarity.slice(1)}`,
            `🔥 **CP Multiplier:** ${(targetFruit.multiplier || 1.0).toFixed(2)}x`,
            `🌟 **Category:** ${targetFruit.fruitType || 'Unknown'}`,
            "",
            duplicateInfo,
            "",
            `📖 **Power Description:**`,
            `*${targetFruit.power || 'A mysterious power awaits discovery...'}*`,
            "",
            `💰 **New Balance:** ${newBalance.toLocaleString()} berries`,
            `🎯 **Total Owned:** ${duplicateCount}`,
            "",
            `${rewardBar}`
        ].join('\n');
        
        return new EmbedBuilder()
            .setColor(rarityColor)
            .setTitle(result.isNewFruit ? "🏴‍☠️ New Devil Fruit Discovered!" : "🏴‍☠️ Devil Fruit Enhanced!")
            .setDescription(content)
            .setFooter({ 
                text: result.isNewFruit ? 
                    "🌊 Your legend grows stronger | Set sail with your new power!" :
                    "🌊 Duplicate mastery increases your power! | Set sail stronger than before!"
            })
            .setTimestamp();
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
                const fruitType = fruit.fruit_fruit_type || fruit.fruit_element || 'Unknown';
                // Convert stored integer back to decimal for display
                const multiplier = (fruit.base_cp / 100).toFixed(1);
                embed.addFields([{
                    name: `${getRarityEmoji(fruit.fruit_rarity)} ${name}`,
                    value: `${fruit.fruit_rarity.toUpperCase()} • ${multiplier}x CP${bonus}\n🔹 ${fruitType}`,
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
