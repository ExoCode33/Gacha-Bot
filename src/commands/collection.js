// src/commands/collection.js - Collection Command
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../database/manager');
const { getRarityEmoji, getRarityColor } = require('../data/devil-fruits');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('collection')
        .setDescription('📚 View your Devil Fruit collection!')
        .addStringOption(option =>
            option.setName('filter')
                .setDescription('Filter by rarity')
                .setRequired(false)
                .addChoices(
                    { name: 'Common', value: 'common' },
                    { name: 'Uncommon', value: 'uncommon' },
                    { name: 'Rare', value: 'rare' },
                    { name: 'Epic', value: 'epic' },
                    { name: 'Legendary', value: 'legendary' },
                    { name: 'Mythical', value: 'mythical' },
                    { name: 'Omnipotent', value: 'omnipotent' }
                )
        )
        .addStringOption(option =>
            option.setName('sort')
                .setDescription('Sort by')
                .setRequired(false)
                .addChoices(
                    { name: 'CP Multiplier', value: 'cp' },
                    { name: 'Rarity', value: 'rarity' },
                    { name: 'Name', value: 'name' },
                    { name: 'Date Obtained', value: 'date' }
                )
        ),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const username = interaction.user.username;
            const filter = interaction.options.getString('filter');
            const sort = interaction.options.getString('sort') || 'cp';
            
            // Ensure user exists
            await DatabaseManager.ensureUser(userId, username, interaction.guild?.id);
            
            // Get user's devil fruits
            let fruits = await DatabaseManager.getUserDevilFruits(userId);
            
            if (fruits.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('📚 Empty Collection')
                    .setDescription('You haven\'t collected any Devil Fruits yet!\nUse `/pull` to start your collection.')
                    .setFooter({ text: 'Start your pirate journey today!' });
                
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            // Filter by rarity if specified
            if (filter) {
                fruits = fruits.filter(fruit => fruit.rarity === filter);
                
                if (fruits.length === 0) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFF8000)
                        .setTitle('📚 No Results')
                        .setDescription(`You don't have any **${filter}** Devil Fruits in your collection.`)
                        .setFooter({ text: 'Try a different filter or collect more fruits!' });
                    
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
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
            
            let uniqueFruits = Array.from(fruitMap.values());
            
            // Sort fruits
            switch (sort) {
                case 'cp':
                    uniqueFruits.sort((a, b) => b.cp_multiplier - a.cp_multiplier);
                    break;
                case 'rarity':
                    const rarityOrder = { 'omnipotent': 7, 'mythical': 6, 'legendary': 5, 'epic': 4, 'rare': 3, 'uncommon': 2, 'common': 1 };
                    uniqueFruits.sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0));
                    break;
                case 'name':
                    uniqueFruits.sort((a, b) => a.fruit_name.localeCompare(b.fruit_name));
                    break;
                case 'date':
                    uniqueFruits.sort((a, b) => new Date(b.obtained_at) - new Date(a.obtained_at));
                    break;
            }
            
            // Paginate results
            const itemsPerPage = 10;
            const totalPages = Math.ceil(uniqueFruits.length / itemsPerPage);
            let currentPage = 0;
            
            const generateEmbed = (page) => {
                const startIndex = page * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const pageFruits = uniqueFruits.slice(startIndex, endIndex);
                
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('📚 Your Devil Fruit Collection')
                    .setDescription(`**Total Fruits:** ${fruits.length} | **Unique Fruits:** ${fruitMap.size}${filter ? ` | **Filter:** ${filter}` : ''}`)
                    .setFooter({ text: `Page ${page + 1}/${totalPages} | Sorted by ${sort}` });
                
                pageFruits.forEach(fruit => {
                    const name = fruit.count > 1 ? `${fruit.fruit_name} (${fruit.count})` : fruit.fruit_name;
                    const bonus = fruit.count > 1 ? ` • +${((fruit.count - 1) * 1).toFixed(0)}% CP` : '';
                    const element = fruit.element ? ` • ${fruit.element}` : '';
                    
                    embed.addFields([{
                        name: `${getRarityEmoji(fruit.rarity)} ${name}`,
                        value: `${fruit.rarity.toUpperCase()} • ${fruit.cp_multiplier}x CP${bonus}${element}`,
                        inline: true
                    }]);
                });
                
                return embed;
            };
            
            const embed = generateEmbed(currentPage);
            
            if (totalPages <= 1) {
                await interaction.reply({ embeds: [embed] });
                return;
            }
            
            // Create navigation buttons
            const createButtons = (page) => {
                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('collection_first')
                            .setLabel('⏮️ First')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('collection_prev')
                            .setLabel('⬅️ Previous')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('collection_next')
                            .setLabel('➡️ Next')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === totalPages - 1),
                        new ButtonBuilder()
                            .setCustomId('collection_last')
                            .setLabel('⏭️ Last')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === totalPages - 1)
                    );
            };
            
            const response = await interaction.reply({ 
                embeds: [embed], 
                components: [createButtons(currentPage)] 
            });
            
            // Set up button collector
            const collector = response.createMessageComponentCollector({ 
                filter: (i) => i.user.id === interaction.user.id,
                time: 300000 // 5 minutes
            });
            
            collector.on('collect', async (buttonInteraction) => {
                try {
                    switch (buttonInteraction.customId) {
                        case 'collection_first':
                            currentPage = 0;
                            break;
                        case 'collection_prev':
                            currentPage = Math.max(0, currentPage - 1);
                            break;
                        case 'collection_next':
                            currentPage = Math.min(totalPages - 1, currentPage + 1);
                            break;
                        case 'collection_last':
                            currentPage = totalPages - 1;
                            break;
                    }
                    
                    const newEmbed = generateEmbed(currentPage);
                    await buttonInteraction.update({ 
                        embeds: [newEmbed], 
                        components: [createButtons(currentPage)] 
                    });
                    
                } catch (error) {
                    console.error('Collection button error:', error);
                }
            });
            
            collector.on('end', () => {
                // Remove buttons after timeout
                interaction.editReply({ components: [] }).catch(() => {});
            });
            
        } catch (error) {
            console.error('Error in collection command:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error')
                .setDescription('Something went wrong while loading your collection!')
                .setFooter({ text: 'Please try again later.' });
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
