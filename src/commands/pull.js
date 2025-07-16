// src/commands/pull.js - Pull Command with Professional Animation
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getRandomFruit, getRarityColor, getRarityEmoji } = require('../data/devil-fruits');
const DatabaseManager = require('../database/manager');
const EconomySystem = require('../systems/economy');

// Animation constants
const rainbowColors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫'];
const rainbowEmbedColors = [0xFF0000, 0xFF8000, 0xFFFF00, 0x00FF00, 0x0080FF, 0x8000FF, 0x654321];

// Hunt descriptions
const HUNT_DESCRIPTIONS = {
    mystery: [
        "The Grand Line's mysterious energies swirl through the depths...",
        "Ancient Devil Fruit essence stirs in the ocean's heart...",
        "Whispers of legendary power echo across the waves...",
        "The sea itself trembles with anticipation...",
        "Reality begins to bend around an emerging force...",
        "Destiny threads weave together in the cosmic tapestry..."
    ],
    rising: [
        "Tremendous energy cascades through dimensional barriers...",
        "The fruit's true nature fights to break through...",
        "Waves of power ripple across space and time...",
        "The ocean's blessing intensifies beyond mortal comprehension...",
        "Reality crystallizes around a world-changing force...",
        "The Devil Fruit's legend begins to take physical form..."
    ],
    manifestation: [
        "The legendary power reaches critical manifestation threshold...",
        "Cosmic forces align to birth a new chapter in history...",
        "The Grand Line itself acknowledges this moment of destiny...",
        "Your legend as a Devil Fruit user begins to unfold...",
        "The sea grants you a power beyond imagination...",
        "A force that will reshape your very existence emerges..."
    ]
};

const STATUS_INDICATORS = {
    scanning: [
        { energy: "FAINT", aura: "UNKNOWN", potential: "STIRRING" },
        { energy: "WEAK", aura: "MYSTERIOUS", potential: "BUILDING" },
        { energy: "MODEST", aura: "ENIGMATIC", potential: "RISING" },
        { energy: "GROWING", aura: "POWERFUL", potential: "SURGING" },
        { energy: "STRONG", aura: "LEGENDARY", potential: "CRITICAL" },
        { energy: "INTENSE", aura: "MYTHICAL", potential: "TRANSCENDENT" }
    ],
    crystallizing: [
        { energy: "OVERWHELMING", aura: "DIVINE", potential: "REALITY-BENDING" },
        { energy: "WORLD-SHAKING", aura: "OMNIPOTENT", potential: "UNIVERSE-ALTERING" },
        { energy: "TRANSCENDENT", aura: "ABSOLUTE", potential: "LEGEND-FORGING" }
    ]
};

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
            
            // Generate random fruit
            const fruit = getRandomFruit();
            console.log(`🎯 ${username} is pulling: ${fruit.name} (${fruit.rarity})`);
            
            // Start the professional animation
            await this.startProfessionalAnimation(interaction, fruit, purchaseResult.newBalance);
            
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

    async startProfessionalAnimation(interaction, targetFruit, newBalance) {
        const frameDelay = 1000; // 1 second per frame
        let frame = 0;
        let attempts = 0;
        const maxAttempts = 50;
        
        try {
            console.log(`🎯 Professional Animation Starting: ${targetFruit.name} (${targetFruit.rarity})`);
            
            const rewardColor = getRarityColor(targetFruit.rarity);
            const connectionStart = Date.now();
            
            // Phase 1: Main Animation (18 frames)
            for (frame = 0; frame < 18; frame++) {
                attempts++;
                if (attempts > maxAttempts) {
                    console.log(`🚨 Max attempts reached, skipping to reveal`);
                    break;
                }
                
                const embed = this.createAnimationFrame(frame, targetFruit);
                
                if (frame === 0) {
                    await interaction.reply({ embeds: [embed] });
                } else {
                    await interaction.editReply({ embeds: [embed] });
                }
                
                await new Promise(resolve => setTimeout(resolve, frameDelay));
            }
            
            // Phase 2: Progression (12 frames)
            if (attempts <= maxAttempts) {
                console.log(`🌊 Starting progression phase...`);
                
                for (let progFrame = 0; progFrame < 12; progFrame++) {
                    attempts++;
                    if (attempts > maxAttempts) break;
                    
                    const embed = this.createProgressionFrame(frame, targetFruit);
                    
                    await interaction.editReply({ embeds: [embed] });
                    
                    frame++;
                    await new Promise(resolve => setTimeout(resolve, frameDelay));
                }
            }
            
            // Phase 3: Transition (10 frames)
            if (attempts <= maxAttempts) {
                console.log(`🎆 Smooth transition: Rainbow to reward color...`);
                
                for (let transFrame = 0; transFrame < 10; transFrame++) {
                    attempts++;
                    if (attempts > maxAttempts) break;
                    
                    const embed = this.createTransitionFrame(frame, targetFruit, rewardColor);
                    
                    await interaction.editReply({ embeds: [embed] });
                    
                    frame++;
                    await new Promise(resolve => setTimeout(resolve, frameDelay));
                }
            }
            
            // Save fruit to database
            console.log(`💾 Saving fruit to database: ${targetFruit.name}`);
            const result = await DatabaseManager.addDevilFruit(interaction.user.id, targetFruit);
            
            // Calculate user stats for final reveal
            const userStats = {
                duplicateCount: result.duplicateCount,
                isNewFruit: result.isNewFruit,
                totalCp: result.totalCp,
                newBalance: newBalance
            };
            
            // Final reveal with enhanced embed
            console.log(`🎊 Final reveal: Devil Fruit information...`);
            
            const finalEmbed = await this.createFinalRevealEmbed(targetFruit, userStats, newBalance);
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
            
            await interaction.editReply({
                embeds: [finalEmbed],
                components: [actionRow]
            });
            
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
            
            const connectionTime = Date.now() - connectionStart;
            console.log(`📡 Connection quality: ${Math.round(connectionTime/attempts)}ms`);
            console.log(`🎊 Pull success: ${targetFruit.name} (${targetFruit.rarity}) for ${interaction.user.username}`);
            
        } catch (error) {
            console.error('🚨 Animation Error:', error);
            
            // Fallback - still give the fruit
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

    createProfessionalStatusDisplay(frame, phase = 'scanning') {
        let statusSet;
        
        if (phase === 'scanning' && frame < 18) {
            const index = Math.min(Math.floor(frame / 3), STATUS_INDICATORS.scanning.length - 1);
            statusSet = STATUS_INDICATORS.scanning[index];
        } else if (phase === 'crystallizing') {
            const index = Math.min(Math.floor(frame / 4), STATUS_INDICATORS.crystallizing.length - 1);
            statusSet = STATUS_INDICATORS.crystallizing[index];
        } else {
            statusSet = { energy: "CONFIRMED", aura: "ANALYZED", potential: "MANIFESTATION COMPLETE" };
        }
        
        return {
            energy: statusSet.energy,
            aura: statusSet.aura,
            potential: statusSet.potential
        };
    },

    getHuntDescription(frame) {
        let descriptions;
        
        if (frame < 6) {
            descriptions = HUNT_DESCRIPTIONS.mystery;
        } else if (frame < 12) {
            descriptions = HUNT_DESCRIPTIONS.rising;
        } else {
            descriptions = HUNT_DESCRIPTIONS.manifestation;
        }
        
        const index = Math.min(frame % descriptions.length, descriptions.length - 1);
        return descriptions[index];
    },

    createAnimationFrame(frame, targetFruit) {
        const rainbowPattern = this.getSyncedRainbowPattern(frame);
        const embedColor = this.getEmbedColorSyncedToFirst(frame);
        const status = this.createProfessionalStatusDisplay(frame, 'scanning');
        const description = this.getHuntDescription(frame);
        
        const content = [
            `${rainbowPattern}`,
            "",
            `🌊 **GRAND LINE EXPEDITION STATUS** 🌊`,
            "",
            `⚡ **Energy Reading:** ${status.energy}`,
            `🔮 **Aura Analysis:** ${status.aura}`,  
            `🍈 **Power Potential:** ${status.potential}`,
            "",
            `*${description}*`,
            "",
            `${rainbowPattern}`
        ].join('\n');
        
        return new EmbedBuilder()
            .setColor(embedColor)
            .setTitle("🏴‍☠️ Devil Fruit Hunt - Scanning Phase")
            .setDescription(content)
            .setFooter({ text: "🌊 Hunting in progress..." })
            .setTimestamp();
    },

    createProgressionFrame(frame, targetFruit) {
        const actualFrame = frame - 18;
        const rainbowPattern = this.getSyncedRainbowPattern(frame);
        const embedColor = this.getEmbedColorSyncedToFirst(frame);
        const status = this.createProfessionalStatusDisplay(actualFrame, 'crystallizing');
        
        const progressionTexts = [
            "The Devil Fruit's essence breaks through dimensional barriers...",
            "Reality warps as legendary power takes physical form...",
            "The ocean itself bows to the emerging force...",
            "Your destiny as a legend crystallizes before your eyes...",
            "The fruit's power signature becomes unmistakable...",
            "A legendary force prepares to change your fate forever..."
        ];
        
        const description = progressionTexts[Math.min(actualFrame, progressionTexts.length - 1)];
        
        const content = [
            `${rainbowPattern}`,
            "",
            `⚡ **POWER CRYSTALLIZATION PROTOCOL** ⚡`,
            "",
            `🌟 **Energy State:** ${status.energy}`,
            `👑 **Divine Aura:** ${status.aura}`,
            `💎 **Reality Impact:** ${status.potential}`,
            "",
            `*${description}*`,
            "",
            `${rainbowPattern}`
        ].join('\n');
        
        return new EmbedBuilder()
            .setColor(embedColor)
            .setTitle("⚡ Devil Fruit Hunt - Crystallization Phase")
            .setDescription(content)
            .setFooter({ text: "⚡ Power crystallizing..." })
            .setTimestamp();
    },

    createTransitionFrame(frame, targetFruit, rewardColor) {
        const transitionFrame = frame - 30;
        const radius = transitionFrame;
        const barLength = 20;
        const rewardEmoji = getRarityEmoji(targetFruit.rarity);
        
        const positions = [];
        for (let i = 0; i < barLength; i++) {
            const centerLeft = 9.5;
            const distanceFromCenter = Math.abs(i - centerLeft);
            
            if (distanceFromCenter <= radius) {
                positions.push(rewardEmoji);
            } else {
                const colorIndex = (i - frame + 7 * 100) % 7;
                positions.push(rainbowColors[colorIndex]);
            }
        }
        
        const transitionBar = positions.join(' ');
        
        const transitionTexts = [
            "The Devil Fruit's power materializes into reality...",
            "Your legend as a Devil Fruit user begins this moment...",
            "The Grand Line grants you a power beyond imagination...",
            "Destiny itself reshapes around your newfound strength...",
            "The legendary power takes its final form...",
            "Your pirate journey reaches a new milestone..."
        ];
        
        const description = transitionTexts[Math.min(transitionFrame, transitionTexts.length - 1)];
        
        let statusDisplay;
        if (transitionFrame < 9) {
            const mysteriousStatus = [
                { phase: "MATERIALIZATION", status: "IN PROGRESS", essence: "MANIFESTING" },
                { phase: "CONVERGENCE", status: "CRITICAL", essence: "STABILIZING" },
                { phase: "CRYSTALLIZATION", status: "ACTIVE", essence: "BINDING" },
                { phase: "REALITY ANCHOR", status: "ENGAGED", essence: "SOLIDIFYING" },
                { phase: "DIMENSIONAL LOCK", status: "SECURED", essence: "COMPLETING" },
                { phase: "LEGEND BIRTH", status: "IMMINENT", essence: "FINALIZING" },
                { phase: "DESTINY SEAL", status: "ACTIVATING", essence: "TRANSCENDING" },
                { phase: "POWER BIRTH", status: "ULTIMATE", essence: "ASCENDING" },
                { phase: "FINAL PHASE", status: "LEGENDARY", essence: "MYTHICAL" }
            ];
            
            const currentStatus = mysteriousStatus[Math.min(transitionFrame, mysteriousStatus.length - 1)];
            statusDisplay = [
                `🌟 **${currentStatus.phase}:** ${currentStatus.status}`,
                `👑 **Legend Status:** ${currentStatus.essence}`,
                `💎 **Power Class:** TRANSCENDENT`
            ].join('\n');
        } else {
            statusDisplay = [
                `🍈 **Devil Fruit:** ${targetFruit.name}`,
                `⭐ **Rarity Level:** ${targetFruit.rarity.toUpperCase()}`,
                `🌟 **Fruit Type:** ${targetFruit.type.toUpperCase()}`
            ].join('\n');
        }
        
        const content = [
            `${transitionBar}`,
            "",
            `💎 **LEGENDARY MANIFESTATION SEQUENCE** 💎`,
            "",
            statusDisplay,
            "",
            `*${description}*`,
            "",
            `${transitionBar}`
        ].join('\n');
        
        return new EmbedBuilder()
            .setColor(transitionFrame > 5 ? rewardColor : this.getEmbedColorSyncedToFirst(frame))
            .setTitle("💎 Devil Fruit Hunt - Manifestation Phase")
            .setDescription(content)
            .setFooter({ text: "💎 Manifestation in progress..." })
            .setTimestamp();
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
            `🔥 **CP Multiplier:** ${targetFruit.multiplier}x`,
            `🌟 **Element:** ${targetFruit.element || 'Unknown'}`,
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
                embed.addFields([{
                    name: `${getRarityEmoji(fruit.fruit_rarity)} ${name}`,
                    value: `${fruit.fruit_rarity.toUpperCase()} • ${fruit.base_cp}x CP${bonus}`,
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
