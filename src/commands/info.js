// src/commands/info.js - Updated Info Command with Types System
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getFruitById, RARITY_RATES, TYPE_COUNTERS, getAllTypes } = require('../data/devil-fruits');
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
                    { name: 'Fruit Types', value: 'types' },
                    { name: 'Type Counters', value: 'counters' },
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
                case 'types':
                    embed = await this.createTypesEmbed();
                    break;
                case 'counters':
                    embed = await this.createCountersEmbed();
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
                { name: '🍈 Devil Fruits', value: '150 unique fruits across 7 rarity tiers with different types and abilities', inline: true },
                { name: '⚡ Combat Power', value: 'Your level determines base CP, fruits provide multipliers that stack additively', inline: true },
                { name: '💰 Economy', value: `Auto income every 10min + manual collection (${config.pullCost.toLocaleString()} berries per pull)`, inline: true },
                { name: '🎮 Key Features', value: '• Professional animated gacha pulls\n• Duplicate system (+1% CP per dupe)\n• Type advantage system\n• Role-based leveling\n• Automatic + manual income', inline: false },
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
                { name: '🏷️ Fruit Types', value: 'Each fruit has a specific type that affects strategic gameplay and type advantages', inline: false },
                { name: '💡 Tips', value: '• Focus on higher rarity fruits for better CP\n• Duplicates are valuable for the CP bonus\n• Different types have strategic advantages\n• Use `/info types` to learn about all fruit types', inline: false }
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
                { name: '💡 Strategy Tips', value: '• Save berries for multiple pulls\n• Higher CP = more income = more pulls\n• Duplicates are still valuable!\n• Focus on collecting diverse types', inline: false }
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

    async createTypesEmbed() {
        const allTypes = getAllTypes();
        const typesByCategory = {
            'Logia Elements': allTypes.filter(type => ['Fire', 'Water', 'Ice', 'Lightning', 'Earth', 'Wind', 'Light', 'Darkness', 'Magma', 'Sand', 'Smoke', 'Snow', 'Gas', 'Swamp', 'Forest', 'Blood', 'Electricity', 'Air', 'Void', 'Pure Light'].includes(type)),
            'Paramecia Powers': allTypes.filter(type => ['Body Alteration', 'Production', 'Explosive', 'Weight Control', 'Defensive', 'Consumption', 'Binding', 'Time Manipulation', 'Spatial', 'Cleansing', 'Vibration', 'Gravity', 'Repulsion', 'Poison', 'Healing'].includes(type)),
            'Zoan Animals': allTypes.filter(type => ['Mammal', 'Carnivore', 'Herbivore', 'Flying', 'Aquatic', 'Insect', 'Amphibian', 'Burrowing', 'Companion', 'Evolution'].includes(type)),
            'Ancient Zoan': allTypes.filter(type => type.startsWith('Ancient')),
            'Mythical Beings': allTypes.filter(type => ['Mythical Dragon', 'Divine Wolf', 'Mythical Serpent', 'Mythical Bird', 'Mythical Spirit', 'Mythical Fox', 'Mythical Horse', 'Mythical Bat', 'Mythical Demon', 'Divine Angel'].includes(type)),
            'Divine Powers': allTypes.filter(type => ['Sun God', 'Thunder God', 'Storm God', 'Sun Goddess', 'Moon God', 'Divine Tiger', 'Death God', 'Divine Buddha', 'True Deity'].includes(type))
        };
        
        let description = 'Devil Fruits are categorized by their power types, which determine strategic advantages and weaknesses.\n\n';
        
        Object.entries(typesByCategory).forEach(([category, types]) => {
            if (types.length > 0) {
                description += `**${category}:**\n${types.slice(0, 5).join(', ')}${types.length > 5 ? '...' : ''}\n\n`;
            }
        });
        
        return new EmbedBuilder()
            .setColor(0x8000FF)
            .setTitle('🏷️ Fruit Types System')
            .setDescription(description)
            .addFields([
                { name: '⚔️ Type Advantages', value: 'Different types have strengths and weaknesses against other types', inline: false },
                { name: '🎯 Strategic Value', value: 'Type advantages will affect future combat features and special events', inline: false },
                { name: '💡 Examples', value: '• Fire beats Ice\n• Water beats Fire\n• Lightning beats Water\n• Earth beats Lightning', inline: false },
                { name: '🔮 Future Features', value: 'Type advantages will be important for:\n• PvP Combat\n• Boss Battles\n• Special Events\n• Team Compositions', inline: false },
                { name: '📊 Total Types', value: `${allTypes.length} different fruit types available`, inline: false }
            ])
            .setFooter({ text: 'Use /info counters to see type advantages!' });
    },

    async createCountersEmbed() {
        const exampleCounters = [
            { type: 'Fire', strong: ['Ice', 'Forest', 'Gas'], weak: ['Water', 'Magma', 'Sand'] },
            { type: 'Water', strong: ['Fire', 'Magma', 'Earth'], weak: ['Ice', 'Lightning', 'Forest'] },
            { type: 'Lightning', strong: ['Water', 'Wind', 'Air'], weak: ['Body Alteration', 'Earth', 'Defensive'] },
            { type: 'Body Alteration', strong: ['Lightning', 'Cutting', 'Piercing'], weak: ['Vibration', 'Explosive', 'Gravity'] },
            { type: 'Carnivore', strong: ['Herbivore', 'Insect', 'Small'], weak: ['Ancient Carnivore', 'Mythical', 'Divine'] },
            { type: 'Mythical Dragon', strong: ['Ancient', 'Modern', 'Mortal'], weak: ['Divine Dragon', 'True Deity', 'God Slayer'] }
        ];
        
        let counterText = '';
        exampleCounters.forEach(counter => {
            counterText += `**${counter.type}:**\n`;
            counterText += `Strong vs: ${counter.strong.join(', ')}\n`;
            counterText += `Weak vs: ${counter.weak.join(', ')}\n\n`;
        });
        
        return new EmbedBuilder()
            .setColor(0xFF1493)
            .setTitle('⚔️ Type Counter System')
            .setDescription('How different fruit types interact with each other in combat')
            .addFields([
                { name: '🎯 How It Works', value: 'Each fruit type has advantages and disadvantages against other types', inline: false },
                { name: '📊 Damage Modifiers', value: '• **Strong vs:** +50% damage bonus\n• **Normal vs:** No modifier\n• **Weak vs:** -30% damage reduction', inline: false },
                { name: '💡 Example Counters', value: counterText, inline: false },
                { name: '🔮 Strategic Planning', value: 'Understanding type matchups will be crucial for:\n• Choosing which fruits to prioritize\n• Building balanced teams\n• Preparing for specific opponents\n• Planning combat strategies', inline: false },
                { name: '📈 Advanced Strategy', value: 'Higher tier types (Mythical, Divine) generally beat lower tier types, but specific matchups can override this rule', inline: false }
            ])
            .setFooter({ text: 'Collect diverse types for maximum strategic advantage!' });
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
                { name: '🔧 Admin Commands', value: '`/admin-gacha add_berries` - Add berries to user\n`/admin-gacha remove_berries` - Remove berries from user\n`/admin-gacha set_berries` - Set exact berry amount\n`/admin-gacha user_info` - Get detailed user info\n`/admin-gacha server_stats` - View server statistics\n`/admin-gacha reset_income` - Reset income cooldown', inline: false },
                { name: '🎯 Collection Features', value: '• Filter by rarity\n• Sort by CP, rarity, name, or date\n• Pagination for large collections\n• Duplicate tracking with bonuses', inline: false },
                { name: '📊 Stats Features', value: '• View your own or others\' stats\n• CP breakdown and income info\n• Fruit collection summary\n• Level progression tracking', inline: false },
                { name: '🏅 Leaderboard Types', value: '• Combat Power (CP)\n• Berry wealth\n• Fruit collection size\n• Level rankings', inline: false },
                { name: '💰 Economy Info', value: `• Auto income every 10 minutes\n• Manual income: ${config.manualIncomeMultiplier}x hourly rate\n• Pull cost: ${config.pullCost.toLocaleString()} berries\n• Manual cooldown: ${config.manualIncomeCooldown} minutes`, inline: false },
                { name: '🏷️ Type System', value: `• ${getAllTypes().length}+ different fruit types\n• Type advantages in combat\n• Strategic team building\n• Future PvP features`, inline: false }
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
