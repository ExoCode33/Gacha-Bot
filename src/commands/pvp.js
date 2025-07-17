// src/commands/pvp.js - PvP Battle System

const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { DatabaseManager } = require('../database/manager');
const { 
  calculateTotalCP, 
  calculateBaseCPFromLevel, 
  calculatePvPDamage, 
  calculateHealthFromCP,
  getFruitAbility,
  getRarityEmoji
} = require('../data/devil-fruits');

// Active battles storage
const activeBattles = new Map();
const battleCooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pvp')
    .setDescription('PvP battle system')
    .addSubcommand(subcommand =>
      subcommand
        .setName('challenge')
        .setDescription('Challenge another user to battle')
        .addUserOption(option => 
          option.setName('opponent')
            .setDescription('User to challenge')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('accept')
        .setDescription('Accept a battle challenge')
        .addStringOption(option =>
          option.setName('battle_id')
            .setDescription('Battle ID to accept')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('compare')
        .setDescription('Compare stats with another user')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('User to compare with')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('balance')
        .setDescription('View PvP balance information')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'challenge':
          await handleChallenge(interaction);
          break;
        case 'accept':
          await handleAccept(interaction);
          break;
        case 'compare':
          await handleCompare(interaction);
          break;
        case 'balance':
          await handleBalance(interaction);
          break;
        default:
          await interaction.reply({
            content: 'Unknown PvP command.',
            ephemeral: true
          });
      }
    } catch (error) {
      console.error('Error in PvP command:', error);
      await interaction.reply({
        content: 'An error occurred during PvP command execution.',
        ephemeral: true
      });
    }
  }
};

async function handleChallenge(interaction) {
  const challenger = interaction.user;
  const opponent = interaction.options.getUser('opponent');

  // Validation checks
  if (challenger.id === opponent.id) {
    return interaction.reply({
      content: 'You cannot challenge yourself to battle!',
      ephemeral: true
    });
  }

  if (opponent.bot) {
    return interaction.reply({
      content: 'You cannot challenge bots to battle!',
      ephemeral: true
    });
  }

  // Check cooldown
  const cooldownKey = `${challenger.id}-${opponent.id}`;
  const lastChallenge = battleCooldowns.get(cooldownKey);
  if (lastChallenge && Date.now() - lastChallenge < 60000) { // 1 minute cooldown
    return interaction.reply({
      content: 'You must wait 1 minute before challenging this user again.',
      ephemeral: true
    });
  }

  // Check if users exist in database
  const challengerData = await DatabaseManager.getUser(challenger.id);
  const opponentData = await DatabaseManager.getUser(opponent.id);

  if (!challengerData) {
    return interaction.reply({
      content: 'You need to start your pirate journey first! Use `/pull` to get your first Devil Fruit.',
      ephemeral: true
    });
  }

  if (!opponentData) {
    return interaction.reply({
      content: `${opponent.username} hasn't started their pirate journey yet!`,
      ephemeral: true
    });
  }

  // Get battle stats
  const challengerStats = await getBattleStats(challenger.id);
  const opponentStats = await getBattleStats(opponent.id);

  // Validate battle balance
  const balanceCheck = validateBattleBalance(challengerStats, opponentStats);
  if (!balanceCheck.valid) {
    return interaction.reply({
      content: balanceCheck.message,
      ephemeral: true
    });
  }

  // Create battle ID
  const battleId = `${challenger.id}-${opponent.id}-${Date.now()}`;

  // Create challenge embed
  const embed = new EmbedBuilder()
    .setTitle('⚔️ PvP Battle Challenge!')
    .setDescription(`${challenger.username} challenges ${opponent.username} to battle!`)
    .setColor(0xFF6B6B)
    .addFields(
      {
        name: `${challenger.username}'s Stats`,
        value: formatBattleStats(challengerStats),
        inline: true
      },
      {
        name: `${opponent.username}'s Stats`,
        value: formatBattleStats(opponentStats),
        inline: true
      },
      {
        name: 'Battle Rules',
        value: [
          '• 3-turn battle system',
          '• Turn 1: 80% damage reduction',
          '• Turn 2-3: Normal damage',
          '• Dice roll determines first turn',
          '• Strategic ability usage matters!'
        ].join('\n'),
        inline: false
      }
    )
    .setTimestamp();

  // Create accept/decline buttons
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`pvp_accept_${battleId}`)
        .setLabel('Accept Challenge')
        .setStyle(ButtonStyle.Success)
        .setEmoji('⚔️'),
      new ButtonBuilder()
        .setCustomId(`pvp_decline_${battleId}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

  // Store battle data
  activeBattles.set(battleId, {
    challenger: challenger.id,
    opponent: opponent.id,
    challengerStats: challengerStats,
    opponentStats: opponentStats,
    status: 'pending',
    createdAt: Date.now()
  });

  // Set cooldown
  battleCooldowns.set(cooldownKey, Date.now());

  await interaction.reply({
    content: `${opponent}, you have been challenged to a PvP battle!`,
    embeds: [embed],
    components: [row]
  });

  // Clean up old battles (5 minutes)
  setTimeout(() => {
    activeBattles.delete(battleId);
  }, 5 * 60 * 1000);
}

async function getBattleStats(userId) {
  const userFruits = await DatabaseManager.getUserDevilFruits(userId);
  const userLevel = await DatabaseManager.getUserLevel(userId);
  const baseCPFromLevel = calculateBaseCPFromLevel(userLevel);
  const totalCP = calculateTotalCP(baseCPFromLevel, userFruits);

  // Get best fruit for battle
  const bestFruit = userFruits.reduce((best, fruit) => {
    const currentPower = (fruit.cpMultiplier || 1.0) + ((fruit.duplicates || 0) * 0.01);
    const bestPower = (best?.cpMultiplier || 0) + ((best?.duplicates || 0) * 0.01);
    return currentPower > bestPower ? fruit : best;
  }, null);

  const hp = calculateHealthFromCP(totalCP, bestFruit?.rarity || 'common');
  const ability = bestFruit ? getFruitAbility(bestFruit.name) : null;

  return {
    userId: userId,
    level: userLevel,
    totalCP: totalCP,
    baseCPFromLevel: baseCPFromLevel,
    hp: hp,
    maxHp: hp,
    bestFruit: bestFruit,
    ability: ability,
    fruits: userFruits
  };
}

function validateBattleBalance(stats1, stats2) {
  const cpRatio = Math.max(stats1.totalCP, stats2.totalCP) / Math.min(stats1.totalCP, stats2.totalCP);
  const levelDiff = Math.abs(stats1.level - stats2.level);

  if (cpRatio > 5.0) {
    return {
      valid: false,
      message: `Battle canceled: CP difference too extreme (${cpRatio.toFixed(1)}x). Maximum allowed difference is 5x.`
    };
  }

  if (levelDiff > 30) {
    return {
      valid: false,
      message: `Battle canceled: Level difference too extreme (${levelDiff} levels). Maximum allowed difference is 30 levels.`
    };
  }

  // Check for potential one-shot
  const maxDamage = Math.max(
    stats1.ability?.damage || 0,
    stats2.ability?.damage || 0
  );

  const minHp = Math.min(stats1.hp, stats2.hp);
  const turn1MaxDamage = maxDamage * 0.2; // 80% damage reduction

  if (turn1MaxDamage >= minHp) {
    return {
      valid: false,
      message: 'Battle canceled: One-shot potential detected on turn 1.'
    };
  }

  return { valid: true };
}

function formatBattleStats(stats) {
  const emoji = stats.bestFruit ? getRarityEmoji(stats.bestFruit.rarity) : '❓';
  const fruitName = stats.bestFruit ? stats.bestFruit.name : 'No fruit';
  const abilityName = stats.ability ? stats.ability.name : 'No ability';
  const abilityDamage = stats.ability ? stats.ability.damage : 0;

  return [
    `**Level:** ${stats.level}`,
    `**Total CP:** ${stats.totalCP.toLocaleString()}`,
    `**HP:** ${stats.hp.toLocaleString()}`,
    `**Best Fruit:** ${emoji} ${fruitName}`,
    `**Ability:** ${abilityName} (${abilityDamage} dmg)`
  ].join('\n');
}

async function handleCompare(interaction) {
  const user1 = interaction.user;
  const user2 = interaction.options.getUser('user');

  if (user1.id === user2.id) {
    return interaction.reply({
      content: 'You cannot compare stats with yourself!',
      ephemeral: true
    });
  }

  const stats1 = await getBattleStats(user1.id);
  const stats2 = await getBattleStats(user2.id);

  const embed = new EmbedBuilder()
    .setTitle('📊 PvP Stats Comparison')
    .setColor(0x3498DB)
    .addFields(
      {
        name: `${user1.username}'s Stats`,
        value: formatBattleStats(stats1),
        inline: true
      },
      {
        name: `${user2.username}'s Stats`,
        value: formatBattleStats(stats2),
        inline: true
      }
    );

  const balanceCheck = validateBattleBalance(stats1, stats2);
  embed.addFields({
    name: 'Battle Analysis',
    value: balanceCheck.valid ? 
      '✅ Balanced battle - Ready to fight!' : 
      `❌ ${balanceCheck.message}`,
    inline: false
  });

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}

async function handleBalance(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('⚖️ PvP Balance System')
    .setColor(0x2ECC71)
    .setDescription('Information about the PvP balance system')
    .addFields(
      {
        name: 'Level Scaling',
        value: [
          'Level-0: 100 CP',
          'Level-25: 200 CP',
          'Level-50: 300 CP',
          'Maximum: 3x difference'
        ].join('\n'),
        inline: true
      },
      {
        name: 'Rarity Scaling',
        value: [
          'Common: 1.0x - 1.2x',
          'Rare: 1.4x - 1.7x',
          'Legendary: 2.1x - 2.6x',
          'Omnipotent: 3.2x - 4.0x'
        ].join('\n'),
        inline: true
      },
      {
        name: 'Battle Rules',
        value: [
          '• 3-turn fights',
          '• Turn 1: 80% damage reduction',
          '• Dice roll for turn order',
          '• Max CP difference: 5x',
          '• Max level difference: 30',
          '• No one-shot potential'
        ].join('\n'),
        inline: false
      }
    );

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}

async function handleAccept(interaction) {
  // This would be implemented as a button interaction handler
  // For now, just show placeholder
  await interaction.reply({
    content: 'Battle acceptance system would be implemented here.',
    ephemeral: true
  });
}
