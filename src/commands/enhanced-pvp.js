// src/commands/enhanced-pvp.js - COMPLETE FILE
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const PvPBalanceSystem = require('../systems/pvp-balance');
const NPCBossSystem = require('../systems/npc-bosses');

// Simple battle tracking
const activeBattles = new Map();
const battleQueue = new Set();
const battleCooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp')
        .setDescription('⚔️ Devil Fruit PvP Battle System')
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

        // Add to queue
        battleQueue.add(userId);
        console.log(`⚔️ ${username} joined the battle queue (${battleQueue.size} players in queue)`);

        // Try to find a balanced match with another player
        const opponent = await this.findBalancedMatch(fighter);
        
        if (opponent) {
            // Remove both players from queue
            battleQueue.delete(userId);
            battleQueue.delete(opponent.userId);
            
            // Start PvP battle simulation
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
        // Remove from queue
        battleQueue.delete(fighter1.userId);
        battleQueue.delete(fighter2.userId);
        
        // Set cooldowns
        battleCooldowns.set(fighter1.userId, Date.now());
        battleCooldowns.set(fighter2.userId, Date.now());

        await interaction.deferReply();

        try {
            // Simulate the battle
            const battleResult = await PvPBalanceSystem.simulateFight(fighter1, fighter2);
            const resultEmbed = PvPBalanceSystem.createFightEmbed(battleResult);

            // Add PvP specific info
            resultEmbed.title = '⚔️ Balanced PvP Battle Result';
            resultEmbed.fields.push({
                name: '🎮 Battle Type',
                value: 'Player vs Player (Balanced Matchmaking)',
                inline: true
            });

            const content = `🎉 **PvP Battle Complete!** ${battleResult.winner.username} defeats ${battleResult.loser.username} in balanced combat!`;

            await interaction.editReply({
                content,
                embeds: [resultEmbed]
            });

            console.log(`⚔️ PvP Battle: ${battleResult.winner.username} vs ${battleResult.loser.username} - Winner: ${battleResult.winner.username}`);

        } catch (error) {
            console.error('Error in PvP battle:', error);
            await interaction.editReply({
                content: '❌ An error occurred during the PvP battle.',
            });
        }
    },

    async startPlayerVsNPC(interaction, playerFighter) {
        // Get balanced NPC boss
        const npcBoss = NPCBossSystem.getBalancedBossForPlayer(playerFighter.balancedCP);
        
        // Remove from queue
        battleQueue.delete(playerFighter.userId);
        
        // Set cooldown
        battleCooldowns.set(playerFighter.userId, Date.now());

        await interaction.deferReply();

        try {
            // Create NPC fighter object for the battle system
            const npcFighter = {
                userId: 'npc',
                username: 'Mysterious Opponent', // Don't reveal NPC name
                level: npcBoss.level,
                balancedCP: npcBoss.totalCP,
                maxHealth: PvPBalanceSystem.calculateHealthFromCP(npcBoss.totalCP, 'epic'),
                hp: PvPBalanceSystem.calculateHealthFromCP(npcBoss.totalCP, 'epic'),
                fruits: [],
                ability: {
                    name: 'Unknown Technique',
                    damage: 120,
                    cooldown: 2,
                    effect: null,
                    accuracy: 85
                },
                effects: [],
                abilityCooldown: 0
            };

            // Simulate the battle
            const battleResult = await PvPBalanceSystem.simulateFight(playerFighter, npcFighter);
            const resultEmbed = PvPBalanceSystem.createFightEmbed(battleResult);

            // Customize embed for PvE
            resultEmbed.title = '⚔️ PvE Battle Result';
            resultEmbed.fields.push({
                name: '🤖 Battle Type',
                value: `Player vs Mysterious Opponent (${npcBoss.difficulty} Difficulty)`,
                inline: true
            });

            // Award berries for victory
            if (battleResult.winner.userId === playerFighter.userId) {
                const berryReward = this.calculateBerryReward(npcBoss.difficulty);
                await DatabaseManager.updateUserBerries(playerFighter.userId, berryReward, `PvE Victory`);
                
                resultEmbed.fields.push({
                    name: '🎁 Victory Reward',
                    value: `${berryReward.toLocaleString()} berries earned!`,
                    inline: true
                });

                console.log(`🎁 ${playerFighter.username} earned ${berryReward} berries for PvE victory`);
            }

            const content = battleResult.winner.userId === playerFighter.userId 
                ? `🎉 **Victory!** You defeated a mysterious opponent and earned berries!`
                : `💀 **Defeat!** The mysterious opponent proved too strong this time. Try again!`;

            await interaction.editReply({
                content,
                embeds: [resultEmbed]
            });

            console.log(`⚔️ PvE Battle: ${playerFighter.username} vs ${npcBoss.name} (${npcBoss.difficulty}) - Winner: ${battleResult.winner.username}`);

        } catch (error) {
            console.error('Error in PvE battle:', error);
            await interaction.editReply({
                content: '❌ An error occurred during the PvE battle.',
            });
        }
    },

    calculateBerryReward(difficulty) {
        const rewards = {
            'Easy': 500,
            'Medium': 1000,
            'Hard': 2000,
            'Very Hard': 4000,
            'Legendary': 7000,
            'Mythical': 10000,
            'Divine': 15000
        };
        
        return rewards[difficulty] || 500;
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

        try {
            // Use the balance system's simulation
            const battleResult = await PvPBalanceSystem.simulateFight(fighter1, fighter2);
            const resultEmbed = PvPBalanceSystem.createFightEmbed(battleResult);

            resultEmbed.title = '⚔️ Quick Battle Simulation';
            resultEmbed.fields.push({
                name: '🎮 Battle Type',
                value: 'Quick Simulation (No rewards)',
                inline: true
            });

            await interaction.editReply({
                embeds: [resultEmbed]
            });
        } catch (error) {
            console.error('Error in quick battle:', error);
            await interaction.editReply({
                content: '❌ An error occurred during the battle simulation.',
            });
        }
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
                    name: '🎯 Battle Queue System',
                    value: [
                        '**Matchmaking**: Finds balanced opponents automatically',
                        '**PvE Fallback**: Fight mysterious opponents if no players available',
                        '**Rewards**: Earn berries for PvE victories',
                        '**Cooldown**: 5-minute cooldown between battles',
                        '**Balance**: Advanced CP balancing ensures fairness'
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
                    name: '🛡️ Balance Features',
                    value: [
                        '• **Automatic Balance Validation**: Prevents unfair matches',
                        '• **Smart Matchmaking**: Queue finds balanced opponents',
                        '• **Reduced Power Gaps**: Capped advantages for fairness',
                        '• **Health Scaling**: Based on level + average rarity',
                        '• **Mystery Opponents**: NPC battles don\'t reveal opponent identity',
                        `• **Balance Status**: ${balanceReport.recommendedBalance}`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Join balanced battles with /pvp queue!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};

// Export battle data for interaction handlers
module.exports.activeBattles = activeBattles;
module.exports.battleQueue = battleQueue;
module.exports.battleCooldowns = battleCooldowns;
