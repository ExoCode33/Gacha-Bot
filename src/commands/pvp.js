// src/commands/pvp.js - PvP Battle Command
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../database/manager');
const PvPBalanceSystem = require('../systems/pvp-balance');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp')
        .setDescription('⚔️ Challenge another pirate to a Devil Fruit battle!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('challenge')
                .setDescription('Challenge another user to a PvP fight')
                .addUserOption(option =>
                    option.setName('opponent')
                        .setDescription('The pirate you want to challenge')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('compare')
                .setDescription('Compare your stats with another user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to compare with')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('balance')
                .setDescription('View PvP balance information')
        ),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'challenge':
                    await this.handleChallenge(interaction);
                    break;
                case 'compare':
                    await this.handleCompare(interaction);
                    break;
                case 'balance':
                    await this.handleBalance(interaction);
                    break;
                default:
                    await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
            }
            
        } catch (error) {
            console.error('Error in PvP command:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ PvP Error')
                .setDescription('Something went wrong with the PvP system!')
                .setFooter({ text: 'Please try again later.' });
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },

    async handleChallenge(interaction) {
        const challenger = interaction.user;
        const opponent = interaction.options.getUser('opponent');
        
        // Validation checks
        if (challenger.id === opponent.id) {
            return await interaction.reply({ 
                content: '❌ You cannot challenge yourself to a fight!', 
                ephemeral: true 
            });
        }
        
        if (opponent.bot) {
            return await interaction.reply({ 
                content: '❌ You cannot challenge bots to fights!', 
                ephemeral: true 
            });
        }
        
        // Ensure both users exist
        await DatabaseManager.ensureUser(challenger.id, challenger.username, interaction.guild?.id);
        await DatabaseManager.ensureUser(opponent.id, opponent.username, interaction.guild?.id);
        
        // Create fighters
        const fighter1 = await PvPBalanceSystem.createPvPFighter(challenger.id);
        const fighter2 = await PvPBalanceSystem.createPvPFighter(opponent.id);
        
        if (!fighter1) {
            return await interaction.reply({ 
                content: '❌ You need at least one Devil Fruit to participate in PvP!', 
                ephemeral: true 
            });
        }
        
        if (!fighter2) {
            return await interaction.reply({ 
                content: '❌ Your opponent needs at least one Devil Fruit to participate in PvP!', 
                ephemeral: true 
            });
        }
        
        // Check fight balance
        const balanceCheck = PvPBalanceSystem.validateFightBalance(fighter1, fighter2);
        
        // Create challenge embed
        const challengeEmbed = new EmbedBuilder()
            .setColor(0xFF8000)
            .setTitle('⚔️ PvP Challenge!')
            .setDescription(`${challenger.username} challenges ${opponent.username} to a Devil Fruit battle!`)
            .addFields([
                { 
                    name: `🏴‍☠️ ${fighter1.username}`, 
                    value: `**Level:** ${fighter1.level}\n**CP:** ${fighter1.balancedCP.toLocaleString()}\n**HP:** ${fighter1.maxHealth}\n**Ability:** ${fighter1.ability.name}\n**Fruit:** ${fighter1.strongestFruit}`, 
                    inline: true 
                },
                { 
                    name: '⚔️', 
                    value: '**VS**', 
                    inline: true 
                },
                { 
                    name: `🏴‍☠️ ${fighter2.username}`, 
                    value: `**Level:** ${fighter2.level}\n**CP:** ${fighter2.balancedCP.toLocaleString()}\n**HP:** ${fighter2.maxHealth}\n**Ability:** ${fighter2.ability.name}\n**Fruit:** ${fighter2.strongestFruit}`, 
                    inline: true 
                },
                {
                    name: '⚖️ Balance Check',
                    value: balanceCheck.isBalanced ? 
                        '✅ Fight is balanced!' : 
                        `⚠️ ${balanceCheck.issues.join(', ')}`,
                    inline: false
                }
            ])
            .setFooter({ text: `${opponent.username}, click Accept to fight or Decline to refuse` })
            .setTimestamp();
        
        // Add balance warning if needed
        if (!balanceCheck.isBalanced) {
            challengeEmbed.setColor(0xFF4500);
        }
        
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`pvp_accept_${challenger.id}_${opponent.id}`)
                    .setLabel('⚔️ Accept Challenge')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`pvp_decline_${challenger.id}_${opponent.id}`)
                    .setLabel('❌ Decline')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`pvp_simulate_${challenger.id}_${opponent.id}`)
                    .setLabel('🎲 Auto-Simulate')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        const response = await interaction.reply({ 
            embeds: [challengeEmbed], 
            components: [actionRow] 
        });
        
        // Set up button collector
        const collector = response.createMessageComponentCollector({ 
            time: 300000 // 5 minutes
        });
        
        collector.on('collect', async (buttonInteraction) => {
            try {
                const [action, challengerId, opponentId] = buttonInteraction.customId.split('_').slice(1);
                
                // Only the challenged user can accept/decline
                if (action === 'accept' || action === 'decline') {
                    if (buttonInteraction.user.id !== opponentId) {
                        return await buttonInteraction.reply({ 
                            content: '❌ Only the challenged user can accept or decline!', 
                            ephemeral: true 
                        });
                    }
                }
                
                // Anyone can simulate
                if (action === 'simulate') {
                    await this.simulateFight(buttonInteraction, challengerId, opponentId);
                } else if (action === 'accept') {
                    await this.simulateFight(buttonInteraction, challengerId, opponentId);
                } else if (action === 'decline') {
                    const declineEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Challenge Declined')
                        .setDescription(`${opponent.username} declined the challenge.`)
                        .setTimestamp();
                    
                    await buttonInteraction.update({ 
                        embeds: [declineEmbed], 
                        components: [] 
                    });
                }
                
            } catch (error) {
                console.error('PvP button interaction error:', error);
                await buttonInteraction.reply({ 
                    content: '❌ An error occurred during the fight!', 
                    ephemeral: true 
                });
            }
        });
        
        collector.on('end', () => {
            // Remove buttons after timeout
            interaction.editReply({ components: [] }).catch(() => {});
        });
    },

    async simulateFight(interaction, challengerId, opponentId) {
        await interaction.deferUpdate();
        
        // Create fresh fighters
        const fighter1 = await PvPBalanceSystem.createPvPFighter(challengerId);
        const fighter2 = await PvPBalanceSystem.createPvPFighter(opponentId);
        
        if (!fighter1 || !fighter2) {
            return await interaction.editReply({ 
                content: '❌ Error creating fighters!', 
                components: [] 
            });
        }
        
        // Simulate the fight
        const fightResult = await PvPBalanceSystem.simulateFight(fighter1, fighter2);
        
        // Create result embed
        const resultEmbed = PvPBalanceSystem.createFightEmbed(fightResult);
        
        // Add rematch button
        const rematchRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`pvp_rematch_${challengerId}_${opponentId}`)
                    .setLabel('🔄 Rematch')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`pvp_stats_${challengerId}_${opponentId}`)
                    .setLabel('📊 Detailed Stats')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        await interaction.editReply({ 
            embeds: [resultEmbed], 
            components: [rematchRow] 
        });
        
        // Set up rematch collector
        const rematchCollector = interaction.message.createMessageComponentCollector({ 
            time: 300000 
        });
        
        rematchCollector.on('collect', async (rematchInteraction) => {
            const [action] = rematchInteraction.customId.split('_').slice(1);
            
            if (action === 'rematch') {
                await this.simulateFight(rematchInteraction, challengerId, opponentId);
            } else if (action === 'stats') {
                await this.showDetailedStats(rematchInteraction, challengerId, opponentId);
            }
        });
    },

    async showDetailedStats(interaction, userId1, userId2) {
        const comparison = await PvPBalanceSystem.getPvPComparison(userId1, userId2);
        
        if (!comparison) {
            return await interaction.reply({ 
                content: '❌ Error getting comparison stats!', 
                ephemeral: true 
            });
        }
        
        const winProb1 = PvPBalanceSystem.calculateWinProbability(
            comparison.fighter1.balancedCP, 
            comparison.fighter2.balancedCP
        );
        
        const statsEmbed = new EmbedBuilder()
            .setColor(0x0080FF)
            .setTitle('📊 Detailed PvP Stats Comparison')
            .addFields([
                { 
                    name: `🏴‍☠️ ${comparison.fighter1.username}`, 
                    value: `**Level:** ${comparison.fighter1.level}\n**Balanced CP:** ${comparison.fighter1.balancedCP.toLocaleString()}\n**Health:** ${comparison.fighter1.health}\n**Ability:** ${comparison.fighter1.ability}\n**Strongest Fruit:** ${comparison.fighter1.fruit}\n**Win Probability:** ${(winProb1 * 100).toFixed(1)}%`, 
                    inline: true 
                },
                { 
                    name: '⚔️', 
                    value: '**VS**', 
                    inline: true 
                },
                { 
                    name: `🏴‍☠️ ${comparison.fighter2.username}`, 
                    value: `**Level:** ${comparison.fighter2.level}\n**Balanced CP:** ${comparison.fighter2.balancedCP.toLocaleString()}\n**Health:** ${comparison.fighter2.health}\n**Ability:** ${comparison.fighter2.ability}\n**Strongest Fruit:** ${comparison.fighter2.fruit}\n**Win Probability:** ${((1-winProb1) * 100).toFixed(1)}%`, 
                    inline: true 
                },
                {
                    name: '⚖️ Balance Analysis',
                    value: `**Balance Ratio:** ${comparison.balanceRatio.toFixed(2)}\n**System:** Balanced PvP scaling\n**Turn 1 DR:** 80%\n**Max Turns:** 3`,
                    inline: false
                }
            ])
            .setFooter({ text: 'Stats use balanced PvP scaling, not regular CP values' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [statsEmbed], ephemeral: true });
    },

    async handleCompare(interaction) {
        const user1 = interaction.user;
        const user2 = interaction.options.getUser('user');
        
        if (user1.id === user2.id) {
            return await interaction.reply({ 
                content: '❌ You cannot compare with yourself!', 
                ephemeral: true 
            });
        }
        
        await this.showDetailedStats(interaction, user1.id, user2.id);
    },

    async handleBalance(interaction) {
        const balanceReport = PvPBalanceSystem.getBalanceReport();
        
        const balanceEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('⚖️ PvP Balance System Information')
            .setDescription('How the balanced PvP system works to ensure fair fights')
            .addFields([
                {
                    name: '🎯 Balance Adjustments',
                    value: `**Level Advantage:** ${balanceReport.maxLevelAdvantage}\n**Rarity Advantage:** ${balanceReport.maxRarityAdvantage}\n**CP Impact:** ${balanceReport.cpImpactReduction}`,
                    inline: false
                },
                {
                    name: '⚔️ Fight Mechanics',
                    value: `**Turn 1 Damage Reduction:** ${balanceReport.turn1DamageReduction}\n**Max Fight Duration:** ${balanceReport.maxFightDuration}\n**First Turn:** Decided by dice roll`,
                    inline: false
                },
                {
                    name: '🛡️ Anti-Powercreep Features',
                    value: '• Damage reduction caps CP advantages\n• Turn 1 positioning phase prevents one-shots\n• Cooldown system adds strategy\n• Health scaling prevents instant kills',
                    inline: false
                },
                {
                    name: '📊 System Status',
                    value: `**Balance Rating:** ${balanceReport.recommendedBalance}\n**Max Power Difference:** ~12x → ~4x\n**Fight Outcome:** Skill > Stats`,
                    inline: false
                }
            ])
            .setFooter({ text: 'Balanced PvP ensures strategy matters more than just raw power!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [balanceEmbed] });
    }
};
