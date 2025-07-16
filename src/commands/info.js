// src/commands/info.js - Updated Info Command with Dynamic Variables
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getFruitById, RARITY_RATES, ELEMENT_COUNTERS } = require('../data/devil-fruits');
const DatabaseManager = require('../database/manager');
const EconomySystem = require('../systems/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('ℹ️ Get information about the game mechanics!')
        .addStringOption(option =>
            option.setName('topic')
                .setDescription('What would you like to know about?')
                .setRequired(false)
                .addChoices(
                    { name: 'Game Overview', value: 'overview' },
                    { name: 'Devil Fruits', value: 'fruits' },
                    { name: 'Rarity Rates', value: 'rates' },
                    { name: 'Level System', value: 'levels' },
                    { name: 'Economy', value: 'economy' },
                    { name: 'Elements', value: 'elements' },
                    { name: 'Commands', value: 'commands' }
                )
        ),

    async execute(interaction) {
        try {
            const topic = interaction.options.getString('topic') || 'overview';
            
            let embed;
            
            switch (topic) {
                case 'overview':
                    embed = await this.createOverviewEmbed();
                    break;
                case 'fruits':
                    embed = await this.createFruitsEmbed();
                    break;
                case 'rates':
                    embed = await this.createRatesEmbed();
                    break;
                case 'levels':
                    embed = await this.createLevelsEmbed();
                    break;
                case 'economy':
                    embed = await this.createEconomyEmbed();
                    break;
                case 'elements':
                    embed = await this.createElementsEmbed();
                    break;
                case 'commands':
                    embed = await this.createCommandsEmbed();
                    break;
                default:
                    embed = await this.createOverviewEmbed();
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in info command:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error')
                .setDescription('Something went wrong while loading the information!')
                .setFooter({ text: 'Please try again later.' });
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    async createOverviewEmbed() {
        const stats = await DatabaseManager.getServerStats();
        const config = EconomySystem.getEconomyConfig();
        
        return new EmbedBuilder()
            .setColor(0x0080FF)
            .setTitle('🏴‍☠️ One Piece Devil Fruit Gacha Bot')
            .setDescription('Welcome to the Grand Line! Collect Devil Fruits, build your power, and become the Pirate King!')
            .addFields([
                { name: '🎯 Objective', value: 'Collect Devil Fruits to increase your Combat Power (CP) and climb the leaderboards!', inline: false },
                { name: '🍈 Devil Fruits', value: '150 unique fruits across 7 rarity tiers with different elements and abilities', inline: true },
                { name: '⚡ Combat Power', value: 'Your level determines base CP, fruits provide multipliers that stack additively', inline: true },
                { name: '💰 Economy', value: `Auto income every 10min + manual collection (${config.pullCost.toLocaleString()} berries per pull)`, inline: true },
                { name: '🎮 Key Features', value: '• Animated gacha pulls\n• Duplicate system (+1% CP per dupe)\n• Element counter system\n• Role-based leveling\n• Automatic + manual income', inline: false },
                { name: '📊 Server Stats', value: `Users: ${stats.totalUsers}\nFruits Collected: ${stats.totalFruits}\nTotal Berries: ${stats.totalBerries.toLocaleString()}`, inline: true },
                { name: '🚀 Getting Started', value: `Use \`/pull\` to get your first Devil Fruit (${config.pullCost.toLocaleString()} berries)!\nUse \`/income\` to collect bonus berries every ${config.manualIncomeCooldown} minutes!`, inline: false }
            ])
            .setFooter({ text: 'Use /info with different topics to learn more!' })
            .setTimestamp();
    },

    async createFruitsEmbed() {
        return new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🍈 Devil Fruit System')
            .setDescription('Learn about the Devil Fruit mechanics and how they affect your power!')
            .addFields([
                { name: '🎯 How It Works', value: 'Each Devil Fruit has a CP multiplier that gets added to your base CP from your level', inline: false },
                { name: '🔄 Duplicates', value: 'Getting the same fruit multiple times gives +1% CP bonus per duplicate\nExample: Gomu Gomu no Mi (3) = +2% CP bonus', inline: false },
                { name: '⚡ CP Calculation', value: 'Total CP = Base CP + (Base CP × Sum of all fruit multipliers + duplicate bonuses)', inline: false },
                { name: '🎨 Rarity System', value: '🟫 Common (40%) - 1.0x to 1.5x\n🟩 Uncommon (30%) - 1.5x to 2.5x\n🟦 Rare (20%) - 2.5x to 4.0x\n🟪 Epic (7%) - 4.0x to 6.0x\n🟨 Legendary (2.5%) - 6.0x to 8.0x\n🟧 Mythical (0.4%) - 8.0x to 10.0x\n🌈 Omnipotent (0.1%) - 10.0x to 12.0x', inline: false },
                { name: '🔥 Elements', value: 'Each fruit has an element that affects combat and strategic gameplay', inline: false },
                { name: '💡 Tips', value: '• Focus on higher rarity fruits for better CP\n• Duplicates are valuable for the CP bonus\n• Different elements have strategic advantages', inline: false }
            ])
            .setFooter({ text: 'Use /collection to view your fruits!' });
    },

    async createRatesEmbed() {
        const config = EconomySystem.getEconomyConfig();
        const rateEntries = Object.entries(RARITY_RATES)
            .sort(([,a], [,b]) => b - a)
            .map(([rarity, rate]) => {
                const emoji = this.getRarityEmoji(rarity);
                const percentage = (rate * 100).toFixed(1);
                return `${emoji} **${rarity.toUpperCase()}**: ${percentage}%`;
            });
        
        return new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🎲 Pull Rates & Probabilities')
            .setDescription('Detailed breakdown of Devil Fruit pull rates')
            .addFields([
                { name: '📊 Rarity Distribution', value: rateEntries.join('\n'), inline: false },
                { name: '💰 Pull Cost', value: `${config.pullCost.toLocaleString()} berries per pull`, inline: true },
                { name: '🎯 Expected Pulls', value: '• Common: Every 2-3 pulls\n• Rare: Every 5 pulls\n• Epic: Every 14 pulls\n• Legendary: Every 40 pulls\n• Mythical: Every 250 pulls\n• Omnipotent: Every 1,000 pulls', inline: false },
                { name: '💡 Strategy Tips', value: '• Save berries for multiple pulls\n• Higher CP = more income = more pulls\n• Duplicates are still valuable!', inline: false }
            ])
            .setFooter({ text: 'RNG is RNG - good luck, pirate!' });
    },

    async createLevelsEmbed() {
        return new EmbedBuilder()
            .setColor(0xFF8000)
            .setTitle('⭐ Level System')
            .setDescription('How the role-based leveling system works')
            .addFields([
                { name: '🎭 Role-Based Levels', value: 'Your level is determined by your highest level role on the server', inline: false },
                { name: '📈 Level Roles', value: '🔰 Level-0: 100 base CP\n🌟 Level-5: 150 base CP\n⭐ Level-10: 200 base CP\n🎖️ Level-15: 250 base CP\n🏆 Level-20: 300 base CP\n👑 Level-25: 350 base CP\n💎 Level-30: 400 base CP\n🌈 Level-35: 450 base CP\n🔥 Level-40: 500 base CP\n⚡ Level-45: 550 base CP\n🌞 Level-50: 600 base CP', inline: false },
                { name: '💎 Base CP', value: 'Your base CP from your level is used as the foundation for all fruit multipliers', inline: false },
                { name: '🔄 Automatic Updates', value: 'When you get a new level role, your CP is automatically recalculated', inline: false },
                { name: '💡 Strategy', value: 'Higher level = higher base CP = more powerful fruits = more income!', inline: false }
            ])
            .setFooter({ text: 'Level up to increase your potential!' });
    },

    async createEconomyEmbed() {
        const config = EconomySystem.getEconomyConfig();
        
        return new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('💰 Economy System')
            .setDescription('How the berry economy and income system works')
            .addFields([
                { name: '🔄 Auto Income', value: `Earn berries automatically every 10 minutes based on your total CP`, inline: false },
                { name: '💵 Manual Income', value: `Use \`/income\` to collect ${config.manualIncomeMultiplier}x your hourly rate with ${config.manualIncomeCooldown} minute cooldown`, inline: false },
                { name: '📊 Income Formula', value: `Hourly Income = ${config.baseIncome} base + (Total CP × ${config.incomeRate})`, inline: false },
                { name: '🛒 Spending', value: `Use berries to pull Devil Fruits (${config.pullCost.toLocaleString()} berries per pull)`, inline: false },
                { name: '⚡ Auto Income Example', value: `1000 CP = ${config.baseIncome + (1000 * config.incomeRate)} berries/hour = ${Math.floor((config.baseIncome + (1000 * config.incomeRate))/6)} berries/10min`, inline: false },
                { name: '🔥 Manual Income Example', value: `1000 CP = ${Math.floor((config.baseIncome + (1000 * config.incomeRate)) * config.manualIncomeMultiplier)} berries per collection`, inline: false },
                { name: '💡 Tips', value: '• Higher CP = more berries per hour\n• Collect manual income regularly\n• Save berries for multiple pulls\n• Focus on getting more fruits to increase CP', inline: false }
            ])
            .setFooter({ text: 'Build your CP to become rich!' });
    },

    async createElementsEmbed() {
        const elements = Object.keys(ELEMENT_COUNTERS);
        const elementList = elements.slice(0, 15).join(', ');
        
        return new EmbedBuilder()
            .setColor(0x8000FF)
            .setTitle('🔥 Element System')
            .setDescription('Devil Fruits have elements that will affect future combat systems')
            .addFields([
                { name: '🌟 Available Elements', value: elementList + '\n...and many more!', inline: false },
                { name: '⚔️ Element Counters', value: 'Each element has strengths and weaknesses against other elements', inline: false },
                { name: '🎯 Strategic Value', value: 'Different elements will provide advantages in future combat features', inline: false },
                { name: '💡 Examples', value: '• Fire vs Ice: Fire wins\n• Water vs Fire: Water wins\n• Lightning vs Water: Lightning wins\n• Earth vs Lightning: Earth wins', inline: false },
                { name: '🔮 Future Features', value: 'Element advantages will be important for:\n• PvP Combat\n• Boss Battles\n• Special Events\n• Team Compositions', inline: false }
            ])
            .setFooter({ text: 'Collect diverse elements for future advantages!' });
    },

    async createCommandsEmbed() {
        const config = EconomySystem.getEconomyConfig();
        
        return new EmbedBuilder()
            .setColor(0xFF69B4)
            .setTitle('📋 Command List')
            .setDescription('All available commands and their functions')
            .addFields([
                { name: '🎮 Core Commands', value: `\`/pull\` - Pull a Devil Fruit (${config.pullCost.toLocaleString()} berries)\n\`/income\` - Collect ${config.manualIncomeMultiplier}x berry bonus (${config.manualIncomeCooldown}min cooldown)\n\`/collection\` - View your Devil Fruit collection\n\`/stats\` - View your pirate stats`, inline: false },
                { name: '🏆 Social Commands', value: '`/leaderboard` - View server leaderboards\n`/info` - Get game information', inline: false },
                { name: '🎯 Collection Features', value: '• Filter by rarity\n• Sort by CP, rarity, name, or date\n• Pagination for large collections\n• Duplicate tracking', inline: false },
                { name: '📊 Stats Features', value: '• View your own or others\' stats\n• CP breakdown and income info\n• Fruit collection summary\n• Level progression', inline: false },
                { name: '🏅 Leaderboard Types', value: '• Combat Power (CP)\n• Berry wealth\n• Fruit collection size\n• Level rankings', inline: false },
                { name: '💰 Economy Info', value: `• Auto income every 10 minutes\n• Manual income: ${config.manualIncomeMultiplier}x hourly rate\n• Pull cost: ${config.pullCost.toLocaleString()} berries\n• Manual cooldown: ${config.manualIncomeCooldown} minutes`, inline: false }
            ])
            .setFooter({ text: 'Start your adventure with /pull!' });
    },

    getRarityEmoji(rarity) {
        const emojis = {
            'common': '🟫',
            'uncommon': '🟩',
            'rare': '🟦',
            'epic': '🟪',
            'legendary': '🟨',
            'mythical': '🟧',
            'omnipotent': '🌈'
        };
        return emojis[rarity] || '🟫';
    }
};
