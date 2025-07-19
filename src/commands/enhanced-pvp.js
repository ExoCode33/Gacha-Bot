// src/commands/enhanced-pvp.js - Enhanced PvP Command with 3v3 System

const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const NPCBossSystem = require('../systems/npc-bosses');
const { balancedDevilFruitAbilities, statusEffects, PvPDamageCalculator } = require('../data/balanced-devil-fruit-abilities');
const { calculateBaseCPFromLevel, getRarityEmoji, getRarityColor } = require('../data/devil-fruits');

// Active battles and matchmaking queues
const activeBattles = new Map();
const battleQueue = new Set();
const battleCooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp')
        .setDescription('⚔️ Devil Fruit PvP Battle System')
        .addSubcommand(subcommand =>
            subcommand
                .setName('challenge')
                .setDescription('Challenge another pirate to 3v3 Devil Fruit battle')
                .addUserOption(option => 
                    option.setName('opponent')
                        .setDescription('The pirate you want to challenge')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('Join battle queue for matchmaking or fight NPC bosses')
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
                .setName('leave')
                .setDescription('Leave the battle queue')
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
                case 'queue':
                    await this.handleQueue(interaction);
                    break;
                case 'quick':
                    await this.handleQuickBattle(interaction);
                    break;
                case 'stats':
                    await this.handleStats(interaction);
                    break;
                case 'leave':
                    await this.handleLeave(interaction);
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
                content: '⚔️ You cannot challenge bots to battle! Use `/pvp queue` to fight NPC bosses.',
                ephemeral: true
            });
        }

        // Check if both users have enough fruits
        const challengerFruits = await DatabaseManager.getUserDevilFruits(challenger.id);
        const opponentFruits = await DatabaseManager.getUserDevilFruits(opponent.id);

        if (!challengerFruits || challengerFruits.length < 5) {
            return interaction.reply({
                content: `❌ You need at least 5 Devil Fruits to participate in PvP battles!\nYou currently have ${challengerFruits?.length || 0} fruits.`,
                ephemeral: true
            });
        }

        if (!opponentFruits || opponentFruits.length < 5) {
            return interaction.reply({
                content: `❌ ${opponent.username} needs at least 5 Devil Fruits to participate in battles!\nThey currently have ${opponentFruits?.length || 0} fruits.`,
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

        if (!challengerFighter || !opponentFighter) {
            return interaction.reply({
                content: '❌ Error creating battle fighters. Please try again.',
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
            type: 'pvp',
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
            content: `${opponent}, you have been challenged to a 3v3 Devil Fruit battle by ${challenger}!`,
            embeds: [challengeEmbed],
            components: [buttons]
        });

        // Auto-cleanup after 5 minutes
        setTimeout(() => {
            activeBattles.delete(battleId);
        }, 300000);
    },

    async handleQueue(interaction) {
        const userId = interaction.user.id;
        const username = interaction.user.username;

        // Check if user has enough Devil Fruits
        await DatabaseManager.ensureUser(userId, username, interaction.guild?.id);
        const userFruits = await DatabaseManager.getUserDevilFruits(userId);
        
        if (!userFruits || userFruits.length < 5) {
            return interaction.reply({
                content: `❌ You need at least 5 Devil Fruits to participate in PvP battles!\nYou currently have ${userFruits?.length || 0} fruits. Use \`/pull\` to get more fruits.`,
                ephemeral: true
            });
        }

        // Check cooldown
        const lastBattle = battleCooldowns.get(userId);
        if (lastBattle && Date.now() - lastBattle < 300000) { // 5 minute cooldown
            const remaining = Math.ceil((300000 - (Date.now() - lastBattle)) / 60000);
            return interaction.reply({
                content: `⏰ You must wait ${remaining} more minutes before joining another battle.`,
                ephemeral: true
            });
        }

        // Check if already in queue or battle
        if (battleQueue.has(userId)) {
            return interaction.reply({
                content: '⚔️ You are already in the battle queue! Use `/pvp leave` to leave the queue.',
                ephemeral: true
            });
        }

        if (activeBattles.has(userId)) {
            return interaction.reply({
                content: '⚔️ You are already in an active battle!',
                ephemeral: true
            });
        }

        // Add to queue
        battleQueue.add(userId);
        console.log(`⚔️ ${username} joined the battle queue (${battleQueue.size} players in queue)`);

        // Try to find a match
        const opponent = await this.findMatch(userId);
        
        if (opponent) {
            // Remove both players from queue
            battleQueue.delete(userId);
            battleQueue.delete(opponent.userId);
            
            // Start PvP battle
            await this.startPlayerVsPlayer(interaction, userId, opponent);
        } else {
            // No player available, start NPC battle
            await this.startPlayerVsNPC(interaction, userId);
        }
    },

    async findMatch(userId) {
        // Look for another player in queue (excluding the current user)
        for (const queuedUserId of battleQueue) {
            if (queuedUserId !== userId) {
                // Get user data for balance check
                const user = await DatabaseManager.getUser(queuedUserId);
                const userFruits = await DatabaseManager.getUserDevilFruits(queuedUserId);
                
                if (user && userFruits && userFruits.length >= 5) {
                    return {
                        userId: queuedUserId,
                        username: user.username,
                        level: user.level,
                        totalCP: user.total_cp,
                        fruits: userFruits
                    };
                }
            }
        }
        return null;
    },

    async startPlayerVsPlayer(interaction, player1Id, player2) {
        const player1 = await DatabaseManager.getUser(player1Id);
        const player1Fruits = await DatabaseManager.getUserDevilFruits(player1Id);
        const player2Fruits = await DatabaseManager.getUserDevilFruits(player2.userId);

        const battleId = `pvp_${player1Id}_${player2.userId}_${Date.now()}`;
        
        // Create battle data
        const battleData = {
            battleId,
            type: 'pvp',
            player1: {
                userId: player1Id,
                username: player1.username,
                level: player1.level,
                totalCP: player1.total_cp,
                fruits: player1Fruits,
                selectedFruits: [],
                battleFruits: [],
                hp: this.calculateHP(player1.total_cp)
            },
            player2: {
                userId: player2.userId,
                username: player2.username,
                level: player2.level,
                totalCP: player2.totalCP,
                fruits: player2Fruits,
                selectedFruits: [],
                battleFruits: [],
                hp: this.calculateHP(player2.totalCP)
            },
            phase: 'selection',
            createdAt: Date.now()
        };

        activeBattles.set(battleId, battleData);

        // Start fruit selection phase
        await this.startFruitSelection(interaction, battleData);
    },

    async startPlayerVsNPC(interaction, userId) {
        const user = await DatabaseManager.getUser(userId);
        const userFruits = await DatabaseManager.getUserDevilFruits(userId);
        
        // Get balanced NPC boss
        const npcBoss = NPCBossSystem.getBalancedBossForPlayer(user.total_cp);
        
        const battleId = `pve_${userId}_${Date.now()}`;
        
        // Create battle data
        const battleData = {
            battleId,
            type: 'pve',
            player: {
                userId: userId,
                username: user.username,
                level: user.level,
                totalCP: user.total_cp,
                fruits: userFruits,
                selectedFruits: [],
                battleFruits: [],
                hp: this.calculateHP(user.total_cp)
            },
            npc: {
                ...npcBoss,
                selectedFruits: NPCBossSystem.selectFruitsForNPC(npcBoss),
                battleFruits: [],
                hp: this.calculateHP(npcBoss.totalCP)
            },
            phase: 'selection',
            createdAt: Date.now()
        };

        activeBattles.set(battleId, battleData);

        // Remove from queue
        battleQueue.delete(userId);
        
        // Start fruit selection phase
        await this.startFruitSelection(interaction, battleData);
    },

    async startFruitSelection(interaction, battleData) {
        const { battleId, type, player, player1, player2, npc } = battleData;
        
        // Create selection embed
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🍈 3v3 Devil Fruit Selection Phase')
            .setDescription('Each fighter must select 5 Devil Fruits for battle!')
            .addFields([
                {
                    name: '⚔️ Battle Info',
                    value: type === 'pvp' 
                        ? `**${player1.username}** vs **${player2.username}**`
                        : `**${player.username}** vs **${npc.name}** (${npc.difficulty})`,
                    inline: false
                },
                {
                    name: '📋 Selection Rules',
                    value: [
                        '• Each fighter selects 5 Devil Fruits',
                        '• Bot will randomly ban 2 fruits from each side',
                        '• Battle will be 3v3 with remaining fruits',
                        '• Turn order decided by dice roll',
                        '• Each fruit can only be used once',
                        '• You have 3 minutes to select'
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Battle ID: ' + battleId })
            .setTimestamp();

        // Create selection button
        const selectButton = new ButtonBuilder()
            .setCustomId(`fruit_select_${battleId}`)
            .setLabel('Select Your 5 Devil Fruits')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🍈');

        const row = new ActionRowBuilder().addComponents(selectButton);

        const content = type === 'pvp' 
            ? `${player1.username} and <@${player2.userId}>, your 3v3 battle is starting!`
            : `${player.username}, your battle against ${npc.title} is starting!`;

        await interaction.reply({
            content,
            embeds: [embed],
            components: [row]
        });

        // Set selection timeout (3 minutes)
        setTimeout(() => {
            if (activeBattles.has(battleId)) {
                this.timeoutBattle(battleId, 'Selection timeout');
            }
        }, 180000);
    },

    // Calculate HP based on total CP
    calculateHP(totalCP) {
        const baseHP = 300;
        const cpBonus = Math.floor(totalCP * 0.05); // 5% of CP as bonus HP
        return baseHP + cpBonus;
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
                        `**Battle HP**: ${fighter.maxHealth}`,
                        `**Total Fruits**: ${fighter.fruits.length}`,
                        `**Battle Ready**: ${fighter.fruits.length >= 5 ? '✅ Yes' : '❌ Need more fruits'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🍈 Strongest Fruits',
                    value: fighter.fruits
                        .sort((a, b) => b.base_cp - a.base_cp)
                        .slice(0, 5)
                        .map(f => `• ${f.fruit_name} (${(f.base_cp/100).toFixed(1)}x)`)
                        .join('\n') || 'No fruits',
                    inline: true
                },
                {
                    name: '📊 Battle Requirements',
                    value: [
                        `**Minimum Fruits**: 5 (You have ${fighter.fruits.length})`,
                        `**Battle Format**: 3v3 Devil Fruit Battle`,
                        `**Selection Phase**: Choose 5, bot bans 2`,
                        `**Turn-Based**: One fruit per turn`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({ text: 'Use /pvp queue to enter battle!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },

    async handleLeave(interaction) {
        const userId = interaction.user.id;
        
        if (!battleQueue.has(userId)) {
            return interaction.reply({
                content: '❌ You are not in the battle queue.',
                ephemeral: true
            });
        }

        battleQueue.delete(userId);
        
        const embed = new EmbedBuilder()
            .setColor(0xFF8000)
            .setTitle('🚪 Left Battle Queue')
            .setDescription('You have successfully left the battle queue.')
            .addFields([
                {
                    name: '📊 Queue Status',
                    value: `**Players in Queue**: ${battleQueue.size}\n**Your Status**: Not in queue`,
                    inline: true
                }
            ])
            .setFooter({ text: 'You can rejoin anytime with /pvp queue' });

        await interaction.reply({ embeds: [embed] });
    },

    async handleBalance(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('⚖️ 3v3 PvP Balance System')
            .setDescription('How the enhanced Devil Fruit PvP system maintains fair and exciting battles')
            .addFields([
                {
                    name: '🎯 3v3 Battle Format',
                    value: [
                        '**Selection**: Each player chooses 5 Devil Fruits',
                        '**Bans**: Bot randomly bans 2 from each side',
                        '**Battle**: 3v3 with remaining fruits',
                        '**Usage**: Each fruit can only be used once',
                        '**Turns**: Dice roll determines turn order'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⚔️ Battle Mechanics',
                    value: [
                        '• **HP System**: 300 base + 5% of total CP',
                        '• **Damage**: Based on fruit abilities + CP scaling',
                        '• **Status Effects**: Poison, freeze, shields, etc.',
                        '• **Turn Limit**: 15 turns maximum',
                        '• **Victory**: HP depletion or no fruits left'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🤖 NPC Boss System',
                    value: [
                        '• **25+ Authentic One Piece Bosses**',
                        '• **Balanced Matchmaking**: Based on your CP',
                        '• **Smart AI**: Tactical fruit selection',
                        '• **Rewards**: Berries for PvE victories',
                        '• **Difficulty Tiers**: Easy to Divine'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🛡️ Balance Features',
                    value: [
                        '• **CP-Based HP**: Stronger players have more health',
                        '• **Random Bans**: Prevents overpowered strategies',
                        '• **Turn Order**: Dice roll for fairness',
                        '• **Cooldowns**: 5-minute battle cooldown',
                        '• **Timeouts**: Auto-end inactive battles'
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Join the battle with /pvp queue!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },

    // Helper methods from original system
    async createBattleFighter(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            if (!user) return null;

            const fruits = await DatabaseManager.getUserDevilFruits(userId);
            if (!fruits || fruits.length === 0) return null;

            // Find strongest fruit for battle ability
            const strongestFruit = fruits.reduce((max, fruit) => 
                fruit.base_cp > (max?.base_cp || 0) ? fruit : max, null);

            // Get ability for the strongest fruit
            const ability = balancedDevilFruitAbilities[strongestFruit.fruit_name] || {
                name: "Basic Attack",
                damage: 50 + (user.level * 2),
                cooldown: 1,
                effect: null,
                accuracy: 85,
                type: "physical"
            };

            // Calculate balanced battle CP
            const baseCP = calculateBaseCPFromLevel(user.level);
            const totalCP = user.total_cp || baseCP;
            
            // Apply PvP balancing (70% of fruit power for balance)
            const battleCP = Math.floor(baseCP + (totalCP - baseCP) * 0.7);
            
            // Calculate health
            const health = this.calculateHP(totalCP);

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
                abilityCooldown: 0
            };

        } catch (error) {
            console.error('Error creating battle fighter:', error);
            return null;
        }
    },

    validateBattleBalance(fighter1, fighter2) {
        const cpRatio = Math.max(fighter1.battleCP / fighter2.battleCP, fighter2.battleCP / fighter1.battleCP);
        const levelDiff = Math.abs(fighter1.level - fighter2.level);
        const healthRatio = Math.max(fighter1.maxHealth / fighter2.maxHealth, fighter2.maxHealth / fighter1.maxHealth);

        let issues = [];
        
        if (cpRatio > 3.0) {
            issues.push(`Extreme CP difference: ${cpRatio.toFixed(1)}x`);
        }
        
        if (levelDiff > 25) {
            issues.push(`Large level gap: ${levelDiff} levels`);
        }
        
        if (healthRatio > 2.5) {
            issues.push(`Health imbalance: ${healthRatio.toFixed(1)}x`);
        }

        const isBalanced = issues.length === 0 && cpRatio <= 2.0 && levelDiff <= 15;

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

    createChallengeEmbed(challenger, opponent) {
        return new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('⚔️ 3v3 Devil Fruit Battle Challenge!')
            .setDescription(`${challenger.username} challenges ${opponent.username} to a 3v3 Devil Fruit battle!`)
            .addFields([
                {
                    name: `🏴‍☠️ ${challenger.username}`,
                    value: [
                        `**Level**: ${challenger.level}`,
                        `**Battle CP**: ${challenger.battleCP.toLocaleString()}`,
                        `**Battle HP**: ${challenger.maxHealth}`,
                        `**Fruits Available**: ${challenger.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: `🏴‍☠️ ${opponent.username}`,
                    value: [
                        `**Level**: ${opponent.level}`,
                        `**Battle CP**: ${opponent.battleCP.toLocaleString()}`,
                        `**Battle HP**: ${opponent.maxHealth}`,
                        `**Fruits Available**: ${opponent.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚔️ Battle Rules',
                    value: [
                        '• Each player selects 5 Devil Fruits',
                        '• Bot randomly bans 2 from each side',
                        '• 3v3 battle with remaining fruits',
                        '• Turn-based: one fruit per turn',
                        '• Dice roll determines turn order',
                        '• Victory by HP depletion or no fruits left'
                    ].join('\n'),
                    inline: false
                }
            ])
            .setTimestamp();
    },

    // Quick battle simulation (simplified for now)
    async simulateBattle(fighter1, fighter2) {
        // Simplified simulation - can be enhanced later
        const healthRatio = fighter1.maxHealth / fighter2.maxHealth;
        const cpRatio = fighter1.battleCP / fighter2.battleCP;
        const combinedRatio = (healthRatio + cpRatio) / 2;
        
        const winner = combinedRatio > 1 ? fighter1 : fighter2;
        const loser = winner === fighter1 ? fighter2 : fighter1;
        
        return {
            winner,
            loser,
            turns: Math.floor(Math.random() * 10) + 5,
            summary: `${winner.username} wins after ${Math.floor(Math.random() * 10) + 5} turns!`
        };
    },

    createBattleResultEmbed(battleResult) {
        const { winner, loser, turns, summary } = battleResult;
        
        return new EmbedBuilder()
            .setColor(0x00
