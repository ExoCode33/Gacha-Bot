// src/commands/collection.js - Fixed collection command

const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../database/manager');
const { getRarityEmoji, calculateTotalCP, calculateBaseCPFromLevel } = require('../data/devil-fruits');

const FRUITS_PER_PAGE = 10;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collection')
    .setDescription('View your Devil Fruit collection')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('View another user\'s collection')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('rarity')
        .setDescription('Filter by rarity')
        .setRequired(false)
        .addChoices(
          { name: '🟫 Common', value: 'common' },
          { name: '🟩 Uncommon', value: 'uncommon' },
          { name: '🟦 Rare', value: 'rare' },
          { name: '🟪 Epic', value: 'epic' },
          { name: '🟨 Legendary', value: 'legendary' },
          { name: '🟧 Mythical', value: 'mythical' },
          { name: '🌈 Omnipotent', value: 'omnipotent' }
        )
    ),

  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const rarityFilter = interaction.options.getString('rarity');

      // Check if user exists in database
      const userData = await DatabaseManager.getUser(targetUser.id);
      if (!userData) {
        return interaction.reply({
          content: `${targetUser.username} hasn't started their pirate journey yet! Use \`/pull\` to get your first Devil Fruit.`,
          ephemeral: true
        });
      }

      // Get user's devil fruits
      const userFruits = await DatabaseManager.getUserDevilFruits(targetUser.id);
      
      // Filter by rarity if specified
      let filteredFruits = userFruits;
      if (rarityFilter) {
        filteredFruits = userFruits.filter(fruit => fruit.fruit_rarity === rarityFilter);
      }

      // Sort by rarity and name
      const rarityOrder = ['omnipotent', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
      filteredFruits.sort((a, b) => {
        const rarityDiff = rarityOrder.indexOf(a.fruit_rarity) - rarityOrder.indexOf(b.fruit_rarity);
        if (rarityDiff !== 0) return rarityDiff;
        return a.fruit_name.localeCompare(b.fruit_name);
      });

      // Calculate pagination
      const totalPages = Math.ceil(filteredFruits.length / FRUITS_PER_PAGE);
      const currentPage = 1;

      // Generate embed
      const embed = await generateCollectionEmbed(targetUser, userData, filteredFruits, currentPage, totalPages, rarityFilter);

      // Create navigation buttons if needed
      const components = [];
      if (totalPages > 1) {
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`collection_prev_${targetUser.id}_${currentPage}_${rarityFilter || 'all'}`)
              .setLabel('◀️ Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === 1),
            new ButtonBuilder()
              .setCustomId(`collection_page_${targetUser.id}_${currentPage}_${rarityFilter || 'all'}`)
              .setLabel(`${currentPage}/${totalPages}`)
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId(`collection_next_${targetUser.id}_${currentPage}_${rarityFilter || 'all'}`)
              .setLabel('Next ▶️')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === totalPages)
          );
        components.push(row);
      }

      await interaction.reply({
        embeds: [embed],
        components: components
      });

    } catch (error) {
      console.error('Error in collection command:', error);
      await interaction.reply({
        content: 'An error occurred while fetching your collection. Please try again.',
        ephemeral: true
      });
    }
  }
};

async function generateCollectionEmbed(user, userData, fruits, page, totalPages, rarityFilter) {
  const startIndex = (page - 1) * FRUITS_PER_PAGE;
  const endIndex = Math.min(startIndex + FRUITS_PER_PAGE, fruits.length);
  const pageFruits = fruits.slice(startIndex, endIndex);

  // Calculate user's total CP
  const userLevel = userData.level || 0;
  const baseCPFromLevel = calculateBaseCPFromLevel(userLevel);
  const totalCP = userData.total_cp || baseCPFromLevel;

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
  const rarityBreakdown = getRarityBreakdown(fruits);
  embed.addFields({
    name: '🎯 Rarity Breakdown',
    value: rarityBreakdown,
    inline: true
  });

  // Add fruits for current page
  if (pageFruits.length > 0) {
    const fruitsText = pageFruits.map((fruit, index) => {
      const emoji = getRarityEmoji(fruit.fruit_rarity);
      // Convert stored integer back to decimal for display
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
  } else {
    embed.addFields({
      name: '🍈 Your Devil Fruits',
      value: rarityFilter ? 
        `No ${rarityFilter} fruits found in your collection.` : 
        'Your collection is empty! Use `/pull` to get your first Devil Fruit.',
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
}

function getRarityBreakdown(fruits) {
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
}
