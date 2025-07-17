// src/commands/enhanced-pvp.js - Complete PvP Battle System

const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../database/manager');
const { balancedDevilFruitAbilities, statusEffects, PvPDamageCalculator } = require('../data/balanced-devil-fruit-abilities');
const { calculateBaseCPFromLevel } = require('../data/devil-fruits');

// Active battles storage
const activeBattles = new Map();
const battleQueue = new Map();
const battleCooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pvp')
    .setDescription('⚔️ Devil Fruit PvP Battle System')
    .addSubcommand(subcommand =>
      subcommand
        .setName('challenge')
        .setDescription('Challenge another pirate to battle')
        .addUserOption(option => 
          option.setName('opponent')
            .setDescription('The pirate you want to challenge')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('quick')
        .setDescription('Quick battle simulation against another user')
        .addUserOption(option => 
          option.setName('opponent')
            .setDescription('The pirate to simulate battle against')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('View your PvP battle stats')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('View another user\'s battle stats')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('queue')
        .setDescription('Join the battle queue for random matchmaking')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('balance')
        .setDescription('View PvP balance information and mechanics')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'challenge':
          await this.handleChallenge(interaction);
          break;
        case 'quick':
          await this.handleQuickBattle(interaction);
          break;
        case 'stats':
          await this.handleStats(interaction);
          break;
        case 'queue':
          await this.handleQueue(interaction);
          break;
        case 'balance':
          await this.handleBalance(interaction);
          break;
        default:
          await interaction.reply({
            content: 'Unknown PvP command.',
            ephemeral: true
          });
      }
    } catch (error) {
      console.error('Error in PvP command:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ PvP System Error')
        .setDescription('An error occurred during PvP command execution!')
        .setFooter({ text: 'Please try again later.' });
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      }
    }
  },

  async handleChallenge(interaction) {
    const challenger = interaction.user;
    const opponent = interaction.options.getUser('opponent');

    // Validation checks
    if (challenger.id === opponent.id) {
      return interaction.reply({
        content: '⚔️ You cannot challenge yourself to battle!',
        ephemeral: true
      });
    }

    if (opponent.bot) {
      return interaction.reply({
        content: '⚔️ You cannot challenge bots to battle!',
        ephemeral: true
      });
    }

    // Check cooldown
    const cooldownKey = `${challenger.id}-${opponent.id}`;
    const lastChallenge = battleCooldowns.get(cooldownKey);
    if (lastChallenge && Date.now() - lastChallenge < 300000) { // 5 minute cooldown
      const remaining = Math.ceil((300000 - (Date.now() - lastChallenge)) / 60000);
      return interaction.reply({
        content: `⏰ You must wait ${remaining} more minutes before challenging this user again.`,
        ephemeral: true
      });
    }

    // Create battle fighters
    const challengerFighter = await this.createBattleFighter(challenger.id);
    const opponentFighter = await this.createBattleFighter(opponent.id);

    if (!challengerFighter) {
      return interaction.reply({
        content: '❌ You need to start your pirate journey first! Use `/pull` to get your first Devil Fruit.',
        ephemeral: true
      });
    }

    if (!opponentFighter) {
      return interaction.reply({
        content: `❌ ${opponent.username} hasn't started their pirate journey yet!`,
        ephemeral: true
      });
    }

    // Balance check
    const balanceCheck = this.validateBattleBalance(challengerFighter, opponentFighter);
    if (!balanceCheck.isBalanced) {
      const embed = new EmbedBuilder()
        .setColor(0xFF8000)
        .setTitle('⚖️ Battle Balance Warning')
        .setDescription(balanceCheck.reason)
        .addFields([
          {
            name: '📊 Power Comparison',
            value: `**${challenger.username}**: ${challengerFighter.battleCP.toLocaleString()} CP\n**${opponent.username}**: ${opponentFighter.battleCP.toLocaleString()} CP\n**Ratio**: ${balanceCheck.ratio.toFixed(1)}x`,
            inline: true
          },
          {
            name: '⚠️ Recommendation',
            value: balanceCheck.recommendation,
            inline: true
          }
        ])
        .setFooter({ text: 'Challenge may proceed but results could be one-sided.' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Create battle challenge
    const battleId = `${challenger.id}-${opponent.id}-${Date.now()}`;
    const challengeEmbed = this.createChallengeEmbed(challengerFighter, opponentFighter);
    
    const buttons = new ActionRowBuilder()
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
          .setEmoji('❌'),
        new ButtonBuilder()
          .setCustomId(`pvp_preview_${battleId}`)
          .setLabel('Preview Battle')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('👁️')
      );

    // Store battle data
    activeBattles.set(battleId, {
      challengerId: challenger.id,
      opponentId: opponent.id,
      challengerFighter,
      opponentFighter,
      status: 'pending',
      createdAt: Date.now()
    });

    // Set cooldown
    battleCooldowns.set(cooldownKey, Date.now());

    await interaction.reply({
      content: `${opponent}, you have been challenged to a Devil Fruit battle by ${challenger}!`,
      embeds: [challengeEmbed],
      components: [buttons]
    });

    // Set up button collector
    const collector = interaction.createMessageComponentCollector({
      time: 300000 // 5 minutes
    });

    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.user.id !== opponent.id && !buttonInteraction.customId.includes('preview')) {
        return buttonInteraction.reply({
          content: '❌ Only the challenged user can accept or decline this battle!',
          ephemeral: true
        });
      }

      const battleData = activeBattles.get(battleId);
      if (!battleData) {
        return buttonInteraction.reply({
          content: '❌ This battle challenge has expired.',
          ephemeral: true
        });
      }

      if (buttonInteraction.customId.includes('accept')) {
        await this.startBattle(buttonInteraction, battleData);
        activeBattles.delete(battleId);
      } else if (buttonInteraction.customId.includes('decline')) {
        await buttonInteraction.update({
          content: `❌ ${opponent.username} declined the battle challenge.`,
          embeds: [],
          components: []
        });
        activeBattles.delete(battleId);
      } else if (buttonInteraction.customId.includes('preview')) {
        await this.showBattlePreview(buttonInteraction, battleData);
      }
    });

    collector.on('end', () => {
      activeBattles.delete(battleId);
    });

    // Clean up old battles (5 minutes)
    setTimeout(() => {
      activeBattles.delete(battleId);
    }, 5 * 60 * 1000);
  },

  async handleQuickBattle(interaction) {
    const user1 = interaction.user;
    const user2 = interaction.options.getUser('opponent');

    if (user1.id === user2.id) {
      return interaction.reply({
        content: '⚔️ You cannot battle against yourself!',
        ephemeral: true
      });
    }

    const fighter1 = await this.createBattleFighter(user1.id);
    const fighter2 = await this.createBattleFighter(user2.id);

    if (!fighter1 || !fighter2) {
      return interaction.reply({
        content: '❌ Both users need to have Devil Fruits to simulate a battle!',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    // Simulate the battle
    const battleResult = await this.simulateBattle(fighter1, fighter2);
    const resultEmbed = this.createBattleResultEmbed(battleResult);

    await interaction.editReply({
      embeds: [resultEmbed]
    });
  },

  async createBattleFighter(userId) {
    try {
      // Ensure user exists
      const user = await DatabaseManager.getUser(userId);
      if (!user) return null;

      // Get user's devil fruits
      const fruits = await DatabaseManager.getUserDevilFruits(userId);
      if (!fruits || fruits.length === 0) return null;

      // Find strongest fruit for battle ability
      const strongestFruit = fruits.reduce((max, fruit) => 
        fruit.base_cp > (max?.base_cp || 0) ? fruit : max, null);

      // Get ability for the strongest fruit
      const ability = balancedDevilFruitAbilities[strongestFruit.fruit_name] || {
        name: "Basic Attack",
        damage: 50,
        cooldown: 0,
        effect: null,
        accuracy: 85,
        type: "physical"
      };

      // Calculate balanced battle CP (reduced scaling for PvP)
      const baseCP = calculateBaseCPFromLevel(user.level);
      const totalCP = user.total_cp || baseCP;
      
      // Apply PvP balancing (reduce CP scaling)
      const battleCP = Math.floor(baseCP + (totalCP - baseCP) * 0.6); // 60% of fruit power for balance
      
      // Calculate health based on level and rarity
      const avgRarityMultiplier = this.getAverageRarityMultiplier(fruits);
      const health = PvPDamageCalculator.calculateHealth(user.level, avgRarityMultiplier);

      return {
        userId: user.user_id,
        username: user.username,
        level: user.level,
        battleCP: battleCP,
        originalCP: totalCP,
        maxHealth: health,
        currentHealth: health,
        ability: ability,
        strongestFruit: strongestFruit,
        fruits: fruits,
        statusEffects: [],
        abilityCooldown: 0,
        wins: 0,
        losses: 0
      };

    } catch (error) {
      console.error('Error creating battle fighter:', error);
      return null;
    }
  },

  getAverageRarityMultiplier(fruits) {
    if (!fruits || fruits.length === 0) return 1.0;

    const rarityMultipliers = {
      'common': 1.0,
      'uncommon': 1.2,
      'rare': 1.5,
      'epic': 2.0,
      'legendary': 2.5,
      'mythical': 3.0,
      'omnipotent': 3.5
    };

    let totalMultiplier = 0;
    fruits.forEach(fruit => {
      totalMultiplier += rarityMultipliers[fruit.fruit_rarity] || 1.0;
    });

    return totalMultiplier / fruits.length;
  },

  validateBattleBalance(fighter1, fighter2) {
    const cpRatio = Math.max(fighter1.battleCP / fighter2.battleCP, fighter2.battleCP / fighter1.battleCP);
    const levelDiff = Math.abs(fighter1.level - fighter2.level);
    const healthRatio = Math.max(fighter1.maxHealth / fighter2.maxHealth, fighter2.maxHealth / fighter1.maxHealth);

    let issues = [];
    
    if (cpRatio > 4.0) {
      issues.push(`Extreme CP difference: ${cpRatio.toFixed(1)}x`);
    }
    
    if (levelDiff > 25) {
      issues.push(`Large level gap: ${levelDiff} levels`);
    }
    
    if (healthRatio > 3.0) {
      issues.push(`Health imbalance: ${healthRatio.toFixed(1)}x`);
    }

    // Check for potential one-shot on turn 1 (even with 50% reduction)
    const maxDamage = Math.max(fighter1.ability.damage, fighter2.ability.damage);
    const minHealth = Math.min(fighter1.maxHealth, fighter2.maxHealth);
    const turn1Damage = maxDamage * 0.5 * Math.min(cpRatio, 2.0); // Max 2x from CP
    
    if (turn1Damage > minHealth * 0.8) {
      issues.push(`Potential turn 1 KO: ${Math.floor(turn1Damage)} vs ${minHealth} HP`);
    }

    const isBalanced = issues.length === 0 && cpRatio <= 2.5 && levelDiff <= 15;

    return {
      isBalanced,
      ratio: cpRatio,
      levelDiff,
      healthRatio,
      issues,
      reason: issues.length > 0 ? issues.join(', ') : 'Battle is well balanced',
      recommendation: isBalanced ? 
        'This should be a fair and exciting battle!' : 
        'Consider more evenly matched opponents for better balance.'
    };
  },

  async simulateBattle(fighter1, fighter2) {
    const battleLog = [];
    const originalFighter1 = { ...fighter1 };
    const originalFighter2 = { ...fighter2 };
    
    // Reset health and effects
    fighter1.currentHealth = fighter1.maxHealth;
    fighter2.currentHealth = fighter2.maxHealth;
    fighter1.statusEffects = [];
    fighter2.statusEffects = [];
    fighter1.abilityCooldown = 0;
    fighter2.abilityCooldown = 0;

    // Dice roll for turn order
    const firstAttacker = Math.random() < 0.5 ? fighter1 : fighter2;
    const secondAttacker = firstAttacker === fighter1 ? fighter2 : fighter1;

    battleLog.push({
      type: 'start',
      message: `⚔️ ${fighter1.username} (${fighter1.strongestFruit.fruit_name}) vs ${fighter2.username} (${fighter2.strongestFruit.fruit_name})`,
      turn: 0
    });

    battleLog.push({
      type: 'dice',
      message: `🎲 ${firstAttacker.username} wins the dice roll and attacks first!`,
      turn: 0
    });

    // Battle for up to 5 turns
    for (let turn = 1; turn <= 5; turn++) {
      if (fighter1.currentHealth <= 0 || fighter2.currentHealth <= 0) break;

      battleLog.push({
        type: 'turn_start',
        message: `🔥 Turn ${turn} ${turn === 1 ? '(50% Damage Reduction)' : ''}`,
        turn
      });

      // Process status effects at start of turn
      this.processStatusEffects(fighter1, battleLog, turn);
      this.processStatusEffects(fighter2, battleLog, turn);

      // First attacker's turn
      if (firstAttacker.currentHealth > 0 && secondAttacker.currentHealth > 0) {
        const attack1 = this.executeAttack(firstAttacker, secondAttacker, turn);
        battleLog.push({
          type: 'attack',
          attacker: firstAttacker.username,
          defender: secondAttacker.username,
          ability: attack1.abilityUsed,
          damage: attack1.damage,
          hit: attack1.hit,
          effect: attack1.effect,
          remainingHP: secondAttacker.currentHealth,
          turn
        });
      }

      // Second attacker's turn (if still alive)
      if (secondAttacker.currentHealth > 0 && firstAttacker.currentHealth > 0) {
        const attack2 = this.executeAttack(secondAttacker, firstAttacker, turn);
        battleLog.push({
          type: 'attack',
          attacker: secondAttacker.username,
          defender: firstAttacker.username,
          ability: attack2.abilityUsed,
          damage: attack2.damage,
          hit: attack2.hit,
          effect: attack2.effect,
          remainingHP: firstAttacker.currentHealth,
          turn
        });
      }

      // Reduce cooldowns
      if (firstAttacker.abilityCooldown > 0) firstAttacker.abilityCooldown--;
      if (secondAttacker.abilityCooldown > 0) secondAttacker.abilityCooldown--;
    }

    // Determine winner
    let winner = null;
    let loser = null;
    
    if (fighter1.currentHealth <= 0) {
      winner = originalFighter2;
      loser = originalFighter1;
    } else if (fighter2.currentHealth <= 0) {
      winner = originalFighter1;
      loser = originalFighter2;
    } else {
      // If both alive after 5 turns, winner is who has more HP percentage
      const fighter1Percent = fighter1.currentHealth / fighter1.maxHealth;
      const fighter2Percent = fighter2.currentHealth / fighter2.maxHealth;
      
      if (fighter1Percent > fighter2Percent) {
        winner = originalFighter1;
        loser = originalFighter2;
      } else {
        winner = originalFighter2;
        loser = originalFighter1;
      }
    }

    battleLog.push({
      type: 'result',
      winner: winner.username,
      winnerHP: winner === originalFighter1 ? fighter1.currentHealth : fighter2.currentHealth,
      loserHP: loser === originalFighter1 ? fighter1.currentHealth : fighter2.currentHealth,
      winnerMaxHP: winner.maxHealth,
      loserMaxHP: loser.maxHealth,
      turn: battleLog.filter(log => log.type === 'turn_start').length
    });

    return {
      winner,
      loser,
      battleLog,
      fighter1: originalFighter1,
      fighter2: originalFighter2,
      finalFighter1: fighter1,
      finalFighter2: fighter2
    };
  },

  executeAttack(attacker, defender, turn) {
    // Check if can use ability (not on cooldown and not disabled)
    const canUseAbility = attacker.abilityCooldown === 0 && 
                         !attacker.statusEffects.some(effect => 
                           statusEffects[effect]?.preventAbilities);

    let ability = attacker.ability;
    let abilityUsed = ability.name;
    
    if (!canUseAbility) {
      // Use basic attack
      ability = {
        name: "Basic Attack",
        damage: 40,
        cooldown: 0,
        effect: null,
        accuracy: 90,
        type: "physical"
      };
      abilityUsed = "Basic Attack";
    }

    // Calculate damage
    const damageResult = PvPDamageCalculator.calculateDamage(
      ability, 
      attacker.battleCP, 
      defender.battleCP, 
      turn, 
      defender.statusEffects
    );

    // Apply damage
    if (damageResult.hit) {
      defender.currentHealth = Math.max(0, defender.currentHealth - damageResult.damage);
      
      // Apply status effect if ability hit
      if (damageResult.effect && canUseAbility) {
        this.applyStatusEffect(defender, damageResult.effect);
        attacker.abilityCooldown = ability.cooldown;
      }
    }

    return {
      damage: damageResult.damage,
      hit: damageResult.hit,
      effect: damageResult.effect,
      abilityUsed: abilityUsed,
      critical: damageResult.critical
    };
  },

  processStatusEffects(fighter, battleLog, turn) {
    fighter.statusEffects = fighter.statusEffects.filter(effectName => {
      const effect = statusEffects[effectName];
      if (!effect) return false;

      // Apply damage over time effects
      if (effect.type === 'dot') {
        fighter.currentHealth = Math.max(0, fighter.currentHealth - effect.damage);
        battleLog.push({
          type: 'status_damage',
          target: fighter.username,
          effect: effectName,
          damage: effect.damage,
          remainingHP: fighter.currentHealth,
          turn
        });
      }

      // Reduce effect duration
      effect.duration--;
      return effect.duration > 0;
    });
  },

  applyStatusEffect(target, effectName) {
    if (statusEffects[effectName] && !target.statusEffects.includes(effectName)) {
      target.statusEffects.push(effectName);
    }
  },

  createChallengeEmbed(challenger, opponent) {
    return new EmbedBuilder()
      .setColor(0xFF6B6B)
      .setTitle('⚔️ Devil Fruit Battle Challenge!')
      .setDescription(`${challenger.username} challenges ${opponent.username} to a Devil Fruit battle!`)
      .addFields([
        {
          name: `🏴‍☠️ ${challenger.username}`,
          value: [
            `**Level**: ${challenger.level}`,
            `**Battle CP**: ${challenger.battleCP.toLocaleString()}`,
            `**Health**: ${challenger.maxHealth}`,
            `**Fruit**: ${challenger.strongestFruit.fruit_name}`,
            `**Ability**: ${challenger.ability.name}`
          ].join('\n'),
          inline: true
        },
        {
          name: `🏴‍☠️ ${opponent.username}`,
          value: [
            `**Level**: ${opponent.level}`,
            `**Battle CP**: ${opponent.battleCP.toLocaleString()}`,
            `**Health**: ${opponent.maxHealth}`,
            `**Fruit**: ${opponent.strongestFruit.fruit_name}`,
            `**Ability**: ${opponent.ability.name}`
          ].join('\n'),
          inline: true
        },
        {
          name: '⚔️ Battle Rules',
          value: [
            '• Turn-based combat system',
            '• Turn 1: 50% damage reduction',
            '• 5 turn maximum duration',
            '• Status effects and abilities',
            '• Winner takes glory!'
          ].join('\n'),
          inline: false
        }
      ])
      .setTimestamp();
  },

  createBattleResultEmbed(battleResult) {
    const { winner, loser, battleLog, finalFighter1, finalFighter2 } = battleResult;
    
    let description = '';
    let lastTurn = 0;
    
    battleLog.forEach(log => {
      switch(log.type) {
        case 'start':
          description += `${log.message}\n\n`;
          break;
        case 'dice':
          description += `${log.message}\n\n`;
          break;
        case 'turn_start':
          if (log.turn !== lastTurn) {
            description += `**${log.message}**\n`;
            lastTurn = log.turn;
          }
          break;
        case 'attack':
          if (log.hit) {
            description += `⚡ ${log.attacker} uses **${log.ability}**!\n`;
            description += `💥 Deals ${log.damage} damage to ${log.defender}! `;
            if (log.effect) {
              description += `(${log.effect}) `;
            }
            description += `\n❤️ ${log.defender}: ${log.remainingHP} HP\n\n`;
          } else {
            description += `💨 ${log.attacker}'s **${log.ability}** misses!\n\n`;
          }
          break;
        case 'status_damage':
          description += `🔥 ${log.target} takes ${log.damage} damage from ${log.effect}! (${log.remainingHP} HP)\n`;
          break;
        case 'result':
          const winnerPercent = Math.floor((log.winnerHP / log.winnerMaxHP) * 100);
          const loserPercent = Math.floor((log.loserHP / log.loserMaxHP) * 100);
          
          description += `\n🏆 **${log.winner} wins!**\n`;
          description += `**Final Health**: ${log.winnerHP}/${log.winnerMaxHP} (${winnerPercent}%) vs ${log.loserHP}/${log.loserMaxHP} (${loserPercent}%)\n`;
          description += `**Battle Duration**: ${log.turn} turns`;
          break;
      }
    });

    return new EmbedBuilder()
      .setColor(winner ? 0x00FF00 : 0xFF0000)
      .setTitle('⚔️ Devil Fruit Battle Results')
      .setDescription(description.substring(0, 4096)) // Discord limit
      .setFooter({ text: 'Battle simulation complete' })
      .setTimestamp();
  },

  async startBattle(interaction, battleData) {
    await interaction.deferUpdate();
    
    const battleResult = await this.simulateBattle(
      battleData.challengerFighter, 
      battleData.opponentFighter
    );
    
    const resultEmbed = this.createBattleResultEmbed(battleResult);
    
    await interaction.editReply({
      content: `⚔️ Battle between ${battleData.challengerFighter.username} and ${battleData.opponentFighter.username} is complete!`,
      embeds: [resultEmbed],
      components: []
    });
  },

  async showBattlePreview(interaction, battleData) {
    const previewEmbed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('👁️ Battle Preview')
      .setDescription('Quick simulation of the potential battle outcome')
      .addFields([
        {
          name: `${battleData.challengerFighter.username} vs ${battleData.opponentFighter.username}`,
          value: `**CP**: ${battleData.challengerFighter.battleCP.toLocaleString()} vs ${battleData.opponentFighter.battleCP.toLocaleString()}\n**HP**: ${battleData.challengerFighter.maxHealth} vs ${battleData.opponentFighter.maxHealth}`,
          inline: false
        }
      ]);
    
    // Run quick simulation
    const simulation = await this.simulateBattle(
      { ...battleData.challengerFighter },
      { ...battleData.opponentFighter }
    );
    
    previewEmbed.addFields([
      {
        name: '🔮 Simulation Result',
        value: `**Winner**: ${simulation.winner.username}\n**Estimated Battle Length**: ${simulation.battleLog.filter(log => log.type === 'turn_start').length} turns`,
        inline: true
      }
    ]);
    
    await interaction.reply({
      embeds: [previewEmbed],
      ephemeral: true
    });
  },

  async handleStats(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const fighter = await this.createBattleFighter(targetUser.id);
    
    if (!fighter) {
      return interaction.reply({
        content: '❌ This user hasn\'t started their pirate journey yet!',
        ephemeral: true
      });
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle(`⚔️ ${targetUser.username}'s Battle Stats`)
      .addFields([
        {
          name: '🏴‍☠️ Fighter Info',
          value: [
            `**Level**: ${fighter.level}`,
            `**Battle CP**: ${fighter.battleCP.toLocaleString()}`,
            `**Original CP**: ${fighter.originalCP.toLocaleString()}`,
            `**Health**: ${fighter.maxHealth} HP`
          ].join('\n'),
          inline: true
        },
        {
          name: '🍈 Primary Fruit',
          value: [
            `**Name**: ${fighter.strongestFruit.fruit_name}`,
            `**Type**: ${fighter.strongestFruit.fruit_type}`,
            `**Rarity**: ${fighter.strongestFruit.fruit_rarity}`,
            `**Element**: ${fighter.strongestFruit.fruit_element}`
          ].join('\n'),
          inline: true
        },
        {
          name: '⚡ Battle Ability',
          value: [
            `**Name**: ${fighter.ability.name}`,
            `**Damage**: ${fighter.ability.damage}`,
            `**Cooldown**: ${fighter.ability.cooldown} turns`,
            `**Accuracy**: ${fighter.ability.accuracy || 85}%`,
            `**Type**: ${fighter.ability.type}`
          ].join('\n'),
          inline: false
        },
        {
          name: '📊 Collection',
          value: [
            `**Total Fruits**: ${fighter.fruits.length}`,
            `**Unique Fruits**: ${new Set(fighter.fruits.map(f => f.fruit_id)).size}`,
            `**Battle Power**: ${Math.floor((fighter.battleCP / fighter.originalCP) * 100)}% of full power`
          ].join('\n'),
          inline: true
        }
      ])
      .setThumbnail(targetUser.displayAvatarURL())
      .setFooter({ text: 'PvP stats are balanced for fair combat' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  },

  async handleQueue(interaction) {
    await interaction.reply({
      content: '🚧 Battle queue system coming soon! Use `/pvp challenge` to battle specific users for now.',
      ephemeral: true
    });
  },

  async handleBalance(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('⚖️ PvP Balance System')
      .setDescription('How the Devil Fruit PvP system maintains fair and exciting battles')
      .addFields([
        {
          name: '🎯 Damage Scaling by Rarity',
          value: [
            '**Common**: 45-60 damage, 0-1 cooldown',
            '**Uncommon**: 60-80 damage, 1-2 cooldown', 
            '**Rare**: 80-120 damage, 2-3 cooldown',
            '**Epic**: 120-160 damage, 3-4 cooldown',
            '**Legendary**: 160-200 damage, 4-5 cooldown',
            '**Mythical**: 200-240 damage, 5-6 cooldown',
            '**Omnipotent**: 240-280 damage, 6-7 cooldown'
          ].join('\n'),
          inline: false
        },
        {
          name: '⚔️ Battle Mechanics',
          value: [
            '• **Turn 1**: 50% damage reduction (prevents early KOs)',
            '• **CP Scaling**: Limited to 2.5x advantage maximum',
            '• **Battle CP**: 60% of collection power (balanced)',
            '• **Health**: Scales with level + rarity bonus',
            '• **Abilities**: Cooldowns prevent spamming',
            '• **Status Effects**: Add tactical depth'
          ].join('\n'),
          inline: false
        },
        {
          name: '🛡️ Balance Protections',
          value: [
            '• **Anti One-Shot**: Turn 1 damage reduction',
            '• **CP Limits**: Maximum 4x power difference allowed',
            '• **Level Caps**: Maximum 25 level difference',
            '• **Accuracy System**: Powerful abilities can miss',
            '• **Effect Durations**: Prevent permanent disables'
          ].join('\n'),
          inline: true
        },
        {
          name: '🎲 Fair Play Features',
          value: [
            '• **Random Turn Order**: Dice roll determines first attack',
            '• **Battle Timeout**: 5 turn maximum duration',
            '• **Effect Counters**: Most effects have counters',
            '• **Rarity Balance**: Higher rarity = higher cooldowns',
            '• **Health Scaling**: Tankier builds are viable'
          ].join('\n'),
          inline: true
        }
      ])
      .setFooter({ text: 'Balance is continuously monitored and adjusted' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};

// Button interaction handler (add this to your main interaction handler)
/*
if (interaction.isButton() && interaction.customId.startsWith('pvp_')) {
  const command = interaction.client.commands.get('pvp');
  if (command) {
    // Handle button interactions here
    if (interaction.customId.includes('accept')) {
      // Handle accept logic
    } else if (interaction.customId.includes('decline')) {
      // Handle decline logic  
    } else if (interaction.customId.includes('preview')) {
      // Handle preview logic
    }
  }
}
*/
