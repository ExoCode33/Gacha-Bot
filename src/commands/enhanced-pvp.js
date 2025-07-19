// src/commands/enhanced-pvp.js - Enhanced PvP Command with Integrated Balance System

const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const NPCBossSystem = require('../systems/npc-bosses');
const PvPBalanceSystem = require('../systems/pvp-balance');
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

        // Check if both users have enough fruits using balance system
        const challengerFighter = await PvPBalanceSystem.createPvPFighter(challenger.id);
        const opponentFighter = await PvPBalanceSystem.createPvPFighter(opponent.id);

        if (!challengerFighter) {
            return interaction.reply({
                content: `❌ You need at least 5 Devil Fruits to participate in PvP battles!\nUse \`/pull\` to get more fruits.`,
                ephemeral: true
            });
        }

        if (!opponentFighter) {
            return interaction.reply({
                content: `❌ ${opponent.username} needs at least 5 Devil Fruits to participate in battles!\nThey need to use \`/pull\` to get more fruits.`,
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

        // Balance validation using existing balance system
        const balanceCheck = PvPBalanceSystem.validateFightBalance(challengerFighter, opponentFighter);
        if (!balanceCheck.isBalanced) {
            const embed = new EmbedBuilder()
                .setColor(0xFF8000)
                .setTitle('⚖️ Battle Balance Warning')
                .setDescription(`⚠️ **Unbalanced Match Detected**\n${balanceCheck.issues.join('\n')}`)
                .addFields([
                    {
                        name: '📊 Power Comparison',
                        value: `**${challenger.username}**: ${challengerFighter.balancedCP.toLocaleString()} CP (${challengerFighter.maxHealth} HP)\n**${opponent.username}**: ${opponentFighter.balancedCP.toLocaleString()} CP (${opponentFighter.maxHealth} HP)\n**Balance Ratio**: ${balanceCheck.cpRatio.toFixed(1)}x`,
                        inline: true
                    },
                    {
                        name: '⚠️ Recommendation',
                        value: balanceCheck.recommendation,
                        inline: true
                    }
                ])
                .setFooter({ text: 'Challenge may proceed but could be one-sided.' });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Create battle challenge
        const battleId = `challenge_${challenger.id}_${opponent.id}_${Date.now()}`;
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
                    .setLabel('Battle Preview')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👁️')
            );

        // Store battle data with balanced fighters
        activeBattles.set(battleId, {
            type: 'challenge',
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
            content: `${opponent}, you have been challenged to a **3v3 Devil Fruit battle** by ${challenger}!`,
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

        // Create PvP fighter using balance system
        const fighter = await PvPBalanceSystem.createPvPFighter(userId);
        
        if (!fighter) {
            const userFruits = await DatabaseManager.getUserDevilFruits(userId);
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

        if (Array.from(activeBattles.values()).some(battle => 
            battle.challengerId === userId || battle.opponentId === userId || 
            (battle.player && battle.player.userId === userId))) {
            return interaction.reply({
                content: '⚔️ You are already in an active battle!',
                ephemeral: true
            });
        }

        // Add to queue
        battleQueue.add(userId);
        console.log(`⚔️ ${username} joined the battle queue (${battleQueue.size} players in queue)`);

        // Try to find a match
        const opponent = await this.findBalancedMatch(fighter);
        
        if (opponent) {
            // Remove both players from queue
            battleQueue.delete(userId);
            battleQueue.delete(opponent.userId);
            
            // Start PvP battle
            await this.startPlayerVsPlayer(interaction, fighter, opponent);
        } else {
            // No player available, start balanced NPC battle
            await this.startPlayerVsNPC(interaction, fighter);
        }
    },

    async findBalancedMatch(playerFighter) {
        // Look for another player in queue with balanced CP
        for (const queuedUserId of battleQueue) {
            if (queuedUserId !== playerFighter.userId) {
                const opponentFighter = await PvPBalanceSystem.createPvPFighter(queuedUserId);
                
                if (opponentFighter) {
                    // Check if match is balanced
                    const balanceCheck = PvPBalanceSystem.validateFightBalance(playerFighter, opponentFighter);
                    if (balanceCheck.isBalanced) {
                        return opponentFighter;
                    }
                }
            }
        }
        return null;
    },

    async startPlayerVsPlayer(interaction, fighter1, fighter2) {
        const battleId = `pvp_${fighter1.userId}_${fighter2.userId}_${Date.now()}`;
        
        // Create battle data using balanced fighters
        const battleData = {
            battleId,
            type: 'pvp',
            player1: {
                ...fighter1,
                selectedFruits: [],
                battleFruits: [],
                hp: fighter1.maxHealth // Use balanced health from balance system
            },
            player2: {
                ...fighter2,
                selectedFruits: [],
                battleFruits: [],
                hp: fighter2.maxHealth // Use balanced health from balance system
            },
            phase: 'selection',
            createdAt: Date.now()
        };

        activeBattles.set(battleId, battleData);

        // Start fruit selection phase
        await this.startFruitSelection(interaction, battleData);
    },

    async startPlayerVsNPC(interaction, playerFighter) {
        // Get balanced NPC boss using existing balance system
        const npcBoss = NPCBossSystem.getBalancedBossForPlayer(playerFighter.balancedCP);
        
        const battleId = `pve_${playerFighter.userId}_${Date.now()}`;
        
        // Create battle data
        const battleData = {
            battleId,
            type: 'pve',
            player: {
                ...playerFighter,
                selectedFruits: [],
                battleFruits: [],
                hp: playerFighter.maxHealth
            },
            npc: {
                ...npcBoss,
                selectedFruits: NPCBossSystem.selectFruitsForNPC(npcBoss),
                battleFruits: [],
                hp: PvPBalanceSystem.calculateHealthFromCP(npcBoss.totalCP, 'epic') // Use balance system for NPC health
            },
            phase: 'selection',
            createdAt: Date.now()
        };

        activeBattles.set(battleId, battleData);

        // Remove from queue
        battleQueue.delete(playerFighter.userId);
        
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
                        ? `**${player1.username}** vs **${player2.username}**\n*Balanced Match: ${player1.balancedCP.toLocaleString()} vs ${player2.balancedCP.toLocaleString()} CP*`
                        : `**${player.username}** vs **${npc.name}** (${npc.difficulty})\n*Balanced Match: ${player.balancedCP.toLocaleString()} vs ${npc.totalCP.toLocaleString()} CP*`,
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
                        '• **Balanced PvP System Active**',
                        '• You have 3 minutes to select'
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Battle ID: ' + battleId + ' • Using Advanced Balance System' })
            .setTimestamp();

        // Create selection button
        const selectButton = new ButtonBuilder()
            .setCustomId(`enhanced_fruit_select_${battleId}`)
            .setLabel('Select Your 5 Devil Fruits')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🍈');

        const row = new ActionRowBuilder().addComponents(selectButton);

        const content = type === 'pvp' 
            ? `${player1.username} and <@${player2.userId}>, your **balanced 3v3 battle** is starting!`
            : `${player.username}, your balanced battle against **${npc.title}** is starting!`;

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

    async handleQuickBattle(interaction) {
        const user1 = interaction.user;
        const user2 = interaction.options.getUser('opponent');

        if (user1.id === user2.id) {
            return interaction.reply({
                content: '⚔️ You cannot battle against yourself!',
                ephemeral: true
            });
        }

        // Use balance system for quick battle
        const fighter1 = await PvPBalanceSystem.createPvPFighter(user1.id);
        const fighter2 = await PvPBalanceSystem.createPvPFighter(user2.id);

        if (!fighter1 || !fighter2) {
            return interaction.reply({
                content: '❌ Both users need at least 5 Devil Fruits to simulate a battle!',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        // Use the existing balance system's simulation
        const battleResult = await PvPBalanceSystem.simulateFight(fighter1, fighter2);
        const resultEmbed = PvPBalanceSystem.createFightEmbed(battleResult);

        await interaction.editReply({
            embeds: [resultEmbed]
        });
    },

    async handleStats(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        // Use balance system for stats
        const fighter = await PvPBalanceSystem.createPvPFighter(targetUser.id);
        
        if (!fighter) {
            return interaction.reply({
                content: '❌ This user hasn\'t started their pirate journey yet or needs more Devil Fruits!',
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle(`⚔️ ${targetUser.username}'s Balanced PvP Stats`)
            .addFields([
                {
                    name: '🏴‍☠️ Fighter Info',
                    value: [
                        `**Level**: ${fighter.level}`,
                        `**Balanced CP**: ${fighter.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${fighter.maxHealth}`,
                        `**Original CP**: ${fighter.originalCP?.toLocaleString() || 'N/A'}`,
                        `**Total Fruits**: ${fighter.fruits?.length || 0}`,
                        `**Battle Ready**: ${(fighter.fruits?.length || 0) >= 5 ? '✅ Yes' : '❌ Need more fruits'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚖️ Balance Info',
                    value: [
                        `**Balance Ratio**: ${fighter.originalCP ? (fighter.balancedCP / fighter.originalCP * 100).toFixed(1) + '%' : 'N/A'}`,
                        `**Health Scaling**: Based on level + rarity`,
                        `**CP Scaling**: Balanced for fair PvP`,
                        `**Max Level Advantage**: 3x (reduced from 6x)`,
                        `**Max Rarity Advantage**: 4x (reduced from 12x)`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🍈 Primary Battle Fruit',
                    value: fighter.strongestFruit ? 
                        `**${fighter.strongestFruit.fruit_name}**\n${fighter.ability?.name || 'Unknown Ability'}\n${fighter.ability?.damage || 0} damage • ${fighter.ability?.cooldown || 0} cooldown` :
                        'No fruits available',
                    inline: false
                }
            ])
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({ text: 'Stats calculated using Advanced Balance System' })
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
        const balanceReport = PvPBalanceSystem.getBalanceReport();
        
        const embed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('⚖️ Advanced PvP Balance System')
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
                    name: '⚖️ Balance Scaling',
                    value: [
                        `• **Max Level Advantage**: ${balanceReport.maxLevelAdvantage}`,
                        `• **Max Rarity Advantage**: ${balanceReport.maxRarityAdvantage}`,
                        `• **Turn 1 Damage Reduction**: ${balanceReport.turn1DamageReduction}`,
                        `• **Max Fight Duration**: ${balanceReport.maxFightDuration}`,
                        `• **CP Impact Reduction**: ${balanceReport.cpImpactReduction}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🤖 NPC Boss System',
                    value: [
                        '• **25+ Authentic One Piece Bosses**',
                        '• **Balanced Matchmaking**: Based on your balanced CP',
                        '• **Smart AI**: Tactical fruit selection',
                        '• **Rewards**: Berries for PvE victories (500-10,000)',
                        '• **Difficulty Tiers**: Easy to Divine'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🛡️ Balance Features',
                    value: [
                        '• **Automatic Balance Validation**: Prevents unfair matches',
                        '• **Smart Matchmaking**: Queue finds balanced opponents',
                        '• **Reduced Power Gaps**: Capped advantages for fairness',
                        '• **Health Scaling**: Based on level + average rarity',
                        `• **Balance Status**: ${balanceReport.recommendedBalance}`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Join balanced battles with /pvp queue!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },

    createChallengeEmbed(challenger, opponent) {
        return new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('⚔️ Balanced 3v3 Devil Fruit Battle Challenge!')
            .setDescription(`${challenger.username} challenges ${opponent.username} to a balanced 3v3 Devil Fruit battle!`)
            .addFields([
                {
                    name: `🏴‍☠️ ${challenger.username}`,
                    value: [
                        `**Level**: ${challenger.level}`,
                        `**Balanced CP**: ${challenger.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${challenger.maxHealth}`,
                        `**Fruits Available**: ${challenger.fruits?.length || 0}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: `🏴‍☠️ ${opponent.username}`,
                    value: [
                        `**Level**: ${opponent.level}`,
                        `**Balanced CP**: ${opponent.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${opponent.maxHealth}`,
                        `**Fruits Available**: ${opponent.fruits?.length || 0}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚔️ Balanced Battle Rules',
                    value: [
                        '• Each player selects 5 Devil Fruits',
                        '• Bot randomly bans 2 from each side',
                        '• 3v3 battle with remaining fruits',
                        '• Turn-based: one fruit per turn',
                        '• Dice roll determines turn order',
                        '• **Advanced Balance System ensures fairness**',
                        '• Victory by HP depletion or no fruits left'
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Powered by Advanced PvP Balance System' })
            .setTimestamp();
    },

    timeoutBattle(battleId, reason) {
        console.log(`⏰ Battle timeout: ${battleId} - ${reason}`);
        activeBattles.delete(battleId);
    }
};

// Export battle data for interaction handlers
module.exports.activeBattles = activeBattles;
module.exports.battleQueue = battleQueue;
module.exports.battleCooldowns = battleCooldowns;
