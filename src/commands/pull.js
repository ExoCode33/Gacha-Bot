// src/commands/pull.js - Devil Fruit Pull Command
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getRandomFruit, getRarityColor, getRarityEmoji } = require('../data/devil-fruits');
const DatabaseManager = require('../database/manager');
const EconomySystem = require('../systems/economy');

// Animation data
const rainbowColors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫'];
const rainbowEmbedColors = [0xFF0000, 0xFF8000, 0xFFFF00, 0x00FF00, 0x0080FF, 0x8000FF, 0x654321];

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
                        { name: '💸 Pull Cost', value: '1,000 berries', inline: true },
                        { name: '📈 Earn More', value: 'Use `/income` to collect berries based on your CP!', inline: false }
                    ])
                    .setFooter({ text: 'Get more Devil Fruits to increase your CP and earn more berries!' });
                
                return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            // Generate random fruit
            const fruit = getRandomFruit();
            console.log(`🎯 ${username} is pulling: ${fruit.name} (${fruit.rarity})`);
            
            // Start animation
            await this.startPullAnimation(interaction, fruit, purchaseResult.newBalance);
            
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

    async startPullAnimation(interaction, targetFruit, newBalance) {
        const frameDelay = 1000; // 1 second per frame
        let frame = 0;
        const maxFrames = 18;
        
        try {
            // Phase 1: Scanning Animation (18 frames)
            for (frame = 0; frame < maxFrames; frame++) {
                const embed = this.createAnimationFrame(frame, targetFruit);
                
                if (frame === 0) {
                    await interaction.reply({ embeds: [embed] });
                } else {
                    await interaction.editReply({ embeds: [embed] });
                }
                
                await new Promise(resolve => setTimeout(resolve, frameDelay));
            }
            
            // Phase 2: Progression (6 frames)
            for (let progFrame = 0; progFrame < 6; progFrame++) {
                const embed = this.createProgressionFrame(frame + progFrame, targetFruit);
                await interaction.editReply({ embeds: [embed] });
                await new Promise(resolve => setTimeout(resolve, frameDelay));
            }
            
            // Phase 3: Transition (10 frames)
            for (let transFrame = 0; transFrame < 10; transFrame++) {
                const embed = this.createTransitionFrame(frame + 6 + transFrame, targetFruit);
                await interaction.editReply({ embeds: [embed] });
                await new Promise(resolve => setTimeout(resolve, frameDelay));
            }
            
            // Add fruit to database
            const result = await DatabaseManager.addDevilFruit(userId, targetFruit);
            
            // Final reveal
            const finalEmbed = await this.createFinalRevealEmbed(targetFruit, result, newBalance);
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pull_again')
                        .setLabel('🍈 Pull Again')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('view_collection')
                        .setLabel('📚 My Collection')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('view_stats')
                        .setLabel('📊 My Stats')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            await interaction.editReply({ embeds: [finalEmbed], components: [actionRow] });
            
            // Set up button collector
            const collector = interaction.channel.createMessageComponentCollector({ 
                filter: (i) => i.user.id === interaction.user.id,
                time: 300000 // 5 minutes
            });
            
            collector.on('collect', async (buttonInteraction) => {
                try {
                    if (buttonInteraction.customId === 'pull_again') {
                        await this.execute(buttonInteraction);
                    } else if (buttonInteraction.customId === 'view_collection') {
                        await this.showCollection(buttonInteraction);
                    } else if (buttonInteraction.customId === 'view_stats') {
                        await this.showStats(buttonInteraction);
                    }
                } catch (error) {
                    console.error('Button interaction error:', error);
                }
            });
            
            collector.on('end', () => {
                // Remove buttons after timeout
                interaction.editReply({ components: [] }).catch(() => {});
            });
            
        } catch (error) {
            console.error('Animation error:', error);
            
            // Fallback - still give the fruit
            const result = await DatabaseManager.addDevilFruit(interaction.user.id, targetFruit);
            const fallbackEmbed = await this.createFinalRevealEmbed(targetFruit, result, newBalance);
            
            await interaction.editReply({ embeds: [fallbackEmbed] });
        }
    },

    createAnimationFrame(frame, targetFruit) {
        const rainbowPattern = this.getSyncedRainbowPattern(frame);
        const embedColor = this.getEmbedColorSyncedToFirst(frame);
        
        const descriptions = [
            "The Grand Line's mysterious energies swirl through the depths...",
            "Ancient Devil Fruit essence stirs in the ocean's heart...",
            "Whispers of legendary power echo across the waves...",
            "The sea itself trembles with anticipation...",
            "Reality begins to bend around an emerging force...",
            "Destiny threads weave together in the cosmic tapestry...",
            "Tremendous energy cascades through dimensional barriers...",
            "The fruit's true nature fights to break through...",
            "Waves of power ripple across space and time...",
            "The ocean's blessing intensifies beyond mortal comprehension...",
            "Reality crystallizes around a world-changing force...",
            "The Devil Fruit's legend begins to take physical form...",
            "The legendary power reaches critical manifestation threshold...",
            "Cosmic forces align to birth a new chapter in history...",
            "The Grand Line itself acknowledges this moment of destiny...",
            "Your legend as a Devil Fruit user begins to unfold...",
            "The sea grants you a power beyond imagination...",
            "A force that will reshape your very existence emerges..."
        ];
        
        const status = this.getStatusForFrame(frame);
        const description = descriptions[Math.min(frame, descriptions.length - 1)];
        
        const content = [
            rainbowPattern,
            "",
            "🌊 **GRAND LINE EXPEDITION STATUS** 🌊",
            "",
            `⚡ **Energy Reading:** ${status.energy}`,
            `🔮 **Aura Analysis:** ${status.aura}`,
            `🍈 **Power Potential:** ${status.potential}`,
            "",
            `*${description}*`,
            "",
            rainbowPattern
        ].join('\n');
        
        return new EmbedBuilder()
            .setColor(embedColor)
            .setTitle("🏴‍☠️ Devil Fruit Hunt - Scanning Phase")
            .setDescription(content)
            .setFooter({ text: "🌊 Hunting in progress..." })
            .setTimestamp();
    },

    createProgressionFrame(frame, targetFruit) {
        const rainbowPattern = this.getSyncedRainbowPattern(frame);
        const embedColor = this.getEmbedColorSyncedToFirst(frame);
        
        const descriptions = [
            "The Devil Fruit's essence breaks through dimensional barriers...",
            "Reality warps as legendary power takes physical form...",
            "The ocean itself bows to the emerging force...",
            "Your destiny as a legend crystallizes before your eyes...",
            "The fruit's power signature becomes unmistakable...",
            "A legendary force prepares to change your fate forever..."
        ];
        
        const actualFrame = frame - 18;
        const description = descriptions[Math.min(actualFrame, descriptions.length - 1)];
        
        const content = [
            rainbowPattern,
            "",
            "⚡ **POWER CRYSTALLIZATION PROTOCOL** ⚡",
            "",
            "🌟 **Energy State:** OVERWHELMING",
            "👑 **Divine Aura:** OMNIPOTENT",
            "💎 **Reality Impact:** LEGEND-FORGING",
            "",
            `*${description}*`,
            "",
            rainbowPattern
        ].join('\n');
        
        return new EmbedBuilder()
            .setColor(embedColor)
            .setTitle("⚡ Devil Fruit Hunt - Crystallization Phase")
            .setDescription(content)
            .setFooter({ text: "⚡ Power crystallizing..." })
            .setTimestamp();
    },

    createTransitionFrame(frame, targetFruit) {
        const transitionFrame = frame - 24;
        const radius = Math.min(transitionFrame, 8);
        const barLength = 20;
        const rewardEmoji = getRarityEmoji(targetFruit.rarity);
        
        const positions = [];
        for (let i = 0; i < barLength; i++) {
            const distance = Math.abs(i - barLength / 2);
            if (distance <= radius) {
                positions.push(rewardEmoji);
            } else {
                positions.push('⬜');
            }
        }
        
        const progressBar = positions.join('');
        const intensity = Math.min(transitionFrame * 10, 100);
        
        const content = [
            `🌊 **DEVIL FRUIT MANIFESTATION** 🌊`,
            "",
            `${progressBar}`,
            "",
            `⚡ **Power Intensity:** ${intensity}%`,
            `🔮 **Manifestation Phase:** ${Math.min(transitionFrame + 1, 10)}/10`,
            `🍈 **Fruit Signature:** ${targetFruit.element?.toUpperCase() || 'UNKNOWN'}`,
            "",
            `*The legendary power takes its final form...*`
        ].join('\n');
        
        return new EmbedBuilder()
            .setColor(getRarityColor(targetFruit.rarity))
            .setTitle("🌟 Devil Fruit Hunt - Manifestation Phase")
            .setDescription(content)
            .setFooter({ text: "🌟 Final manifestation..." })
            .setTimestamp();
    },

    async createFinalRevealEmbed(targetFruit, result, newBalance) {
        const rarityEmoji = getRarityEmoji(targetFruit.rarity);
        const rarityColor = getRarityColor(targetFruit.rarity);
        
        const duplicateText = result.duplicateCount > 1 ? 
            `${targetFruit.name} (${result.duplicateCount})` : 
            targetFruit.name;
        
        const cpBonus = result.duplicateCount > 1 ? 
            `+${((result.duplicateCount - 1) * 1).toFixed(0)}% CP Bonus from duplicates` : 
            '';
        
        const embed = new EmbedBuilder()
            .setColor(rarityColor)
            .setTitle(`${rarityEmoji} ${result.isNewFruit ? 'NEW' : 'DUPLICATE'} DEVIL FRUIT OBTAINED! ${rarityEmoji}`)
            .setDescription(`**${duplicateText}**\n*${targetFruit.type}*`)
            .addFields([
                { name: '🔮 Element', value: targetFruit.element || 'Unknown', inline: true },
                { name: '⭐ Rarity', value: targetFruit.rarity.toUpperCase(), inline: true },
                { name: '💎 CP Multiplier', value: `${targetFruit.multiplier}x`, inline: true },
                { name: '⚡ Power', value: targetFruit.power || 'Unknown ability', inline: false },
                { name: '💰 New Balance', value: `${newBalance.toLocaleString()} berries`, inline: true },
                { name: '🎯 Total Owned', value: `${result.duplicateCount}`, inline: true }
            ])
            .setFooter({ text: `${result.isNewFruit ? 'Added to collection!' : 'Duplicate found!'} ${cpBonus}` })
            .setTimestamp();
        
        if (targetFruit.description) {
            embed.addFields([
                { name: '📖 Description', value: targetFruit.description, inline: false }
            ]);
        }
        
        return embed;
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
                .sort((a, b) => b.cp_multiplier - a.cp_multiplier)
                .slice(0, 10);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('📚 Your Devil Fruit Collection')
                .setDescription(`**Total Fruits:** ${fruits.length}\n**Unique Fruits:** ${fruitMap.size}`)
                .setFooter({ text: `Showing top 10 fruits by CP multiplier` });
            
            uniqueFruits.forEach(fruit => {
                const name = fruit.count > 1 ? `${fruit.fruit_name} (${fruit.count})` : fruit.fruit_name;
                const bonus = fruit.count > 1 ? `+${((fruit.count - 1) * 1).toFixed(0)}% CP` : '';
                embed.addFields([{
                    name: `${getRarityEmoji(fruit.rarity)} ${name}`,
                    value: `${fruit.rarity.toUpperCase()} • ${fruit.cp_multiplier}x CP ${bonus}`,
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
    },

    getSyncedRainbowPattern(frame) {
        const pattern = [];
        for (let i = 0; i < 7; i++) {
            const colorIndex = (frame + i) % rainbowColors.length;
            pattern.push(rainbowColors[colorIndex]);
        }
        return pattern.join('');
    },

    getEmbedColorSyncedToFirst(frame) {
        const colorIndex = frame % rainbowEmbedColors.length;
        return rainbowEmbedColors[colorIndex];
    },

    getStatusForFrame(frame) {
        const energyLevels = [
            'SCANNING', 'ANALYZING', 'DETECTING', 'PROBING', 'INVESTIGATING',
            'EXAMINING', 'EVALUATING', 'MEASURING', 'CALCULATING', 'PROCESSING',
            'SYNTHESIZING', 'MANIFESTING', 'CRYSTALLIZING', 'MATERIALIZING', 'FINALIZING',
            'COMPLETING', 'CONFIRMING', 'STABILIZING'
        ];
        
        const auraLevels = [
            'UNKNOWN', 'FAINT', 'WEAK', 'MODERATE', 'STRONG', 'POWERFUL',
            'INTENSE', 'OVERWHELMING', 'LEGENDARY', 'MYTHICAL', 'TRANSCENDENT',
            'DIVINE', 'COSMIC', 'INFINITE', 'ABSOLUTE', 'OMNIPOTENT',
            'REALITY-BENDING', 'EXISTENCE-SHAPING'
        ];
        
        const potentialLevels = [
            'MINIMAL', 'LOW', 'FAIR', 'DECENT', 'GOOD', 'HIGH',
            'EXCELLENT', 'EXCEPTIONAL', 'LEGENDARY', 'MYTHICAL', 'TRANSCENDENT',
            'DIVINE', 'COSMIC', 'INFINITE', 'ABSOLUTE', 'OMNIPOTENT',
            'REALITY-WARPING', 'EXISTENCE-DEFINING'
        ];
        
        return {
            energy: energyLevels[Math.min(frame, energyLevels.length - 1)],
            aura: auraLevels[Math.min(frame, auraLevels.length - 1)],
            potential: potentialLevels[Math.min(frame, potentialLevels.length - 1)]
        };
    }
};
