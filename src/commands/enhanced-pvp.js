// src/commands/enhanced-pvp.js - UPDATED FOR TURN-BASED SYSTEM
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const PvPBalanceSystem = require('../systems/pvp-balance');
const EnhancedTurnBasedPvP = require('../systems/enhanced-turn-based-pvp');

// Simple battle tracking for compatibility
const activeBattles = new Map();
const battleQueue = new Set();
const battleCooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp')
        .setDescription('⚔️ Enhanced Devil Fruit PvP Battle System')
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('Join battle queue for turn-based matchmaking or fight NPC bosses')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('challenge')
                .setDescription('Challenge another player to a turn-based PvP battle')
                .addUserOption(option => 
                    option.setName('opponent')
                        .setDescription('The pirate to challenge')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('quick')
                .setDescription('Quick battle simulation (instant result)')
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
                case 'challenge':
                    await this.handleChallenge(interaction);
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
            console.error('Error in enhanced PvP command:', error);
            
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

        // Check if user already has an active battle
        const existingBattle = EnhancedTurnBasedPvP.getUserActiveBattle(userId);
        if (existingBattle) {
            return interaction.reply({
                content: '⚔️ You already have an active battle! Finish it first before joining a new one.',
                ephemeral: true
            });
        }

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

        // Check if already in queue
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
            
            // Set cooldowns
            battleCooldowns.set(userId, Date.now());
            battleCooldowns.set(opponent.userId, Date.now());
            
            // Start enhanced turn-based PvP battle
            await EnhancedTurnBasedPvP.startBattle(interaction, fighter, opponent);
        } else {
            // No player available, start balanced NPC battle
            // Set cooldown
            battleCooldowns.set(userId, Date.now());
            battleQueue.delete(userId);
            
            await EnhancedTurnBasedPvP.startBattle(interaction, fighter, null);
        }
    },

    async handleChallenge(interaction) {
        const challenger = interaction.user;
        const opponent = interaction.options.getUser('opponent');

        if (challenger.id === opponent.id) {
            return interaction.reply({
                content: '⚔️ You cannot challenge yourself!',
                ephemeral: true
            });
        }

        if (opponent.bot) {
            return interaction.reply({
                content: '⚔️ You cannot challenge a bot! Use `/pvp queue` to fight NPC bosses.',
                ephemeral: true
            });
        }

        // Check if either user has an active battle
        const challengerBattle = EnhancedTurnBasedPvP.getUserActiveBattle(challenger.id);
        const opponentBattle = EnhancedTurnBasedPvP.getUserActiveBattle(opponent.id);
        
        if (challengerBattle || opponentBattle) {
            return interaction.reply({
                content: '⚔️ One of you already has an active battle! Wait for it to finish.',
                ephemeral: true
            });
        }

        // Create fighters
        const challengerFighter = await PvPBalanceSystem.createPvPFighter(challenger.id);
        const opponentFighter = await PvPBalanceSystem.createPvPFighter(opponent.id);

        if (!challengerFighter || !opponentFighter) {
            return interaction.reply({
                content: '❌ Both players need at least 5 Devil Fruits to battle!',
                ephemeral: true
            });
        }

        // Check balance
        const balanceCheck = PvPBalanceSystem.validateFightBalance(challengerFighter, opponentFighter);
        
        const challengeEmbed = new EmbedBuilder()
            .setColor(balanceCheck.isBalanced ? 0x00FF00 : 0xFF8000)
            .setTitle('⚔️ PvP Challenge')
            .setDescription(`**${challenger.username}** challenges **${opponent.username}** to a turn-based Devil Fruit battle!`)
            .addFields([
                {
                    name: '🏴‍☠️ Challenger Stats',
                    value: [
                        `**${challenger.username}**`,
                        `Level: ${challengerFighter.level}`,
                        `Balanced CP: ${challengerFighter.balancedCP.toLocaleString()}`,
                        `Battle HP: ${challengerFighter.maxHealth}`,
                        `Fruits: ${challengerFighter.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🏴‍☠️ Opponent Stats',
                    value: [
                        `**${opponent.username}**`,
                        `Level: ${opponentFighter.level}`,
                        `Balanced CP: ${opponentFighter.balancedCP.toLocaleString()}`,
                        `Battle HP: ${opponentFighter.maxHealth}`,
                        `Fruits: ${opponentFighter.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚖️ Balance Analysis',
                    value: [
                        `**Balanced**: ${balanceCheck.isBalanced ? '✅ Yes' : '⚠️ Unbalanced'}`,
                        `**CP Ratio**: ${balanceCheck.cpRatio.toFixed(2)}x`,
                        `**Level Difference**: ${balanceCheck.levelDiff}`,
                        `**Recommendation**: ${balanceCheck.recommendation}`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ 
                text: `${opponent.username}, you have 60 seconds to respond!` 
            })
            .setTimestamp();

        // TODO: Implement challenge acceptance system
        // For now, just show the challenge information
        await interaction.reply({
            content: `${opponent}, you have been challenged to a PvP battle!`,
            embeds: [challengeEmbed]
        });

        // Note: In a full implementation, you would add buttons for accept/decline
        // and store the challenge in a temporary storage system
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

    async handleQuickBattle(interaction) {
        const user1 = interaction.user;
        const user2 = interaction.options.getUser('opponent');

        if (user1.id === user2.id) {
            return interaction.reply({
                content: '⚔️ You cannot battle against yourself!',
                ephemeral: true
            });
        }

        // Use balance system for quick battle (instant simulation)
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
            // Use the balance system's simulation for instant results
            const battleResult = await PvPBalanceSystem.simulateFight(fighter1, fighter2);
            const resultEmbed = PvPBalanceSystem.createFightEmbed(battleResult);

            resultEmbed.title = '⚔️ Quick Battle Simulation (Instant Result)';
            resultEmbed.fields.push({
                name: '🎮 Battle Type',
                value: 'Quick Simulation (No rewards)\nUse `/pvp queue` for turn-based battles!',
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
            .setTitle(`⚔️ ${targetUser.username}'s Enhanced PvP Stats`)
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
                        `**Health Scaling**: Level + rarity based`,
                        `**CP Scaling**: Balanced for fair PvP`,
                        `**Max Level Advantage**: 3x (reduced)`,
                        `**Max Rarity Advantage**: 4x (reduced)`,
                        `**Turn-Based Ready**: ✅ Yes`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🍈 Strongest Battle Fruit',
                    value: fighter.strongestFruit ? 
                        `**${fighter.strongestFruit.fruit_name}**\n${fighter.ability?.name || 'Unknown Ability'}\n${fighter.ability?.damage || 0} damage • ${fighter.ability?.cooldown || 0} cooldown` :
                        'No fruits available',
                    inline: false
                }
            ])
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({ text: 'Enhanced stats for turn-based battles' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },

    async handleLeave(interaction) {
        const userId = interaction.user.id;
        
        // Check if user has an active battle
        const activeBattle = EnhancedTurnBasedPvP.getUserActiveBattle(userId);
        if (activeBattle) {
            return interaction.reply({
                content: '⚔️ You have an active battle! Use the surrender button in the battle interface to leave.',
                ephemeral: true
            });
        }
        
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
            .setTitle('⚖️ Enhanced Turn-Based PvP System')
            .setDescription('Advanced Devil Fruit PvP with turn-based combat, skill selection, and real-time battle logs')
            .addFields([
                {
                    name: '🎯 Turn-Based Features',
                    value: [
                        '**Real-Time Battles**: Choose skills each turn',
                        '**HP Bars**: Live health visualization', 
                        '**Battle Log**: Expanding combat history',
                        '**Boss Reveals**: See your NPC opponent',
                        '**Skill Details**: View abilities and effects',
                        '**Professional Animations**: Smooth combat flow'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⚖️ Balance System',
                    value: [
                        `• **Max Level Advantage**: ${balanceReport.maxLevelAdvantage}`,
                        `• **Max Rarity Advantage**: ${balanceReport.maxRarityAdvantage}`,
                        `• **Turn 1 Damage Reduction**: ${balanceReport.turn1DamageReduction}`,
                        `• **Max Fight Duration**: 15 turns`,
                        `• **Balanced Matchmaking**: Auto-matching`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🎮 Battle Types',
                    value: [
                        '• **Queue Battles**: Turn-based vs players or bosses',
                        '• **Challenges**: Challenge specific players',
                        '• **Quick Battles**: Instant simulation results',
                        '• **NPC Bosses**: Fight One Piece characters',
                        '• **Berry Rewards**: Earn from PvE victories'
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Start turn-based battles with /pvp queue!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};

// Export battle data for interaction handlers
module.exports.activeBattles = activeBattles;
module.exports.battleQueue = battleQueue;
module.exports.battleCooldowns = battleCooldowns;
