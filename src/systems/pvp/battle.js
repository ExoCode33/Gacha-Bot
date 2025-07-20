const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

class BattleSystem {
    constructor(pvpSystem) {
        this.pvpSystem = pvpSystem;
        this.activeBattles = new Map();
    }

    async init() {
        console.log('⚔️ PvP Battle System initialized');
    }

    async startChallenge(interaction, challenger, defender) {
        const balanceCheck = this.validateBalance(challenger, defender);
        
        const embed = new EmbedBuilder()
            .setColor(balanceCheck.isBalanced ? 0x00FF00 : 0xFF8000)
            .setTitle('⚔️ PvP Challenge')
            .setDescription(`**${challenger.username}** challenges **${defender.username}** to battle!`)
            .addFields([
                {
                    name: '🏴‍☠️ Challenger',
                    value: [
                        `**${challenger.username}**`,
                        `Level: ${challenger.level}`,
                        `CP: ${challenger.balancedCP.toLocaleString()}`,
                        `HP: ${challenger.maxHealth}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🏴‍☠️ Defender',
                    value: [
                        `**${defender.username}**`,
                        `Level: ${defender.level}`,
                        `CP: ${defender.balancedCP.toLocaleString()}`,
                        `HP: ${defender.maxHealth}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚖️ Balance Check',
                    value: [
                        `**Balanced**: ${balanceCheck.isBalanced ? '✅ Yes' : '⚠️ Unbalanced'}`,
                        `**CP Ratio**: ${balanceCheck.cpRatio.toFixed(2)}x`,
                        `**Level Diff**: ${balanceCheck.levelDiff}`,
                        `**Recommendation**: ${balanceCheck.recommendation}`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Challenge issued! Waiting for acceptance...' });

        const acceptButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`accept_challenge_${challenger.userId}_${defender.userId}`)
                    .setLabel('⚔️ Accept Challenge')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`decline_challenge_${challenger.userId}_${defender.userId}`)
                    .setLabel('❌ Decline')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.reply({
            content: `<@${defender.userId}>, you have been challenged!`,
            embeds: [embed],
            components: [acceptButton]
        });
    }

    validateBalance(fighter1, fighter2) {
        const cpRatio = Math.max(fighter1.balancedCP / fighter2.balancedCP, fighter2.balancedCP / fighter1.balancedCP);
        const levelDiff = Math.abs(fighter1.level - fighter2.level);
        
        const isBalanced = cpRatio <= 2.0 && levelDiff <= 20;
        
        return {
            isBalanced,
            cpRatio,
            levelDiff,
            recommendation: isBalanced ? 'Fair fight!' : 'Consider finding a more balanced opponent'
        };
    }

    cleanup() {
        // Clean up old battles
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        for (const [battleId, battleData] of this.activeBattles) {
            if (now - battleData.created > maxAge) {
                this.activeBattles.delete(battleId);
            }
        }
    }
}

module.exports = BattleSystem;

// ============================================================================
// 4. INTERACTION HANDLER - src/systems/pvp/interaction-handler.js
// ============================================================================

class InteractionHandler {
    constructor(pvpSystem) {
        this.pvpSystem = pvpSystem;
    }

    async handle(interaction) {
        const customId = interaction.customId;

        try {
            // Handle leave queue
            if (customId.startsWith('leave_queue_')) {
                const userId = customId.replace('leave_queue_', '');
                
                if (interaction.user.id !== userId) {
                    return await interaction.reply({
                        content: '❌ You can only interact with your own queue!',
                        ephemeral: true
                    });
                }

                if (!this.pvpSystem.queue.isInQueue(userId)) {
                    return await interaction.reply({
                        content: '❌ You are not in the queue.',
                        ephemeral: true
                    });
                }

                this.pvpSystem.queue.removeFromQueue(userId);

                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setColor(0xFF8000)
                    .setTitle('🚪 Left Queue')
                    .setDescription('You have left the matchmaking queue.')
                    .setFooter({ text: 'You can rejoin anytime with /pvp queue' });

                await interaction.update({
                    embeds: [embed],
                    components: []
                });

                return true;
            }

            // Handle challenge acceptance/decline
            if (customId.startsWith('accept_challenge_') || customId.startsWith('decline_challenge_')) {
                const parts = customId.split('_');
                const challengerId = parts[2];
                const defenderId = parts[3];
                const action = parts[0]; // 'accept' or 'decline'

                if (interaction.user.id !== defenderId) {
                    return await interaction.reply({
                        content: '❌ Only the challenged player can respond!',
                        ephemeral: true
                    });
                }

                const { EmbedBuilder } = require('discord.js');
                let embed;

                if (action === 'accept') {
                    embed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('⚔️ Challenge Accepted!')
                        .setDescription('The battle will begin shortly...')
                        .setFooter({ text: 'Enhanced battle system coming soon!' });

                    // TODO: Start actual battle
                    setTimeout(async () => {
                        try {
                            const challenger = await this.pvpSystem.balance.createFighter(challengerId);
                            const defender = await this.pvpSystem.balance.createFighter(defenderId);
                            
                            if (challenger && defender) {
                                await this.pvpSystem.balance.simulateQuickBattle(interaction, challenger, defender);
                            }
                        } catch (error) {
                            console.error('Error starting challenge battle:', error);
                        }
                    }, 3000);
                } else {
                    embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Challenge Declined')
                        .setDescription('The challenge has been declined.')
                        .setFooter({ text: 'Maybe next time!' });
                }

                await interaction.update({
                    embeds: [embed],
                    components: []
                });

                return true;
            }

            return false; // Not a PvP interaction

        } catch (error) {
            console.error('Error handling PvP interaction:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred during the PvP interaction.',
                    ephemeral: true
                });
            }
            
            return true; // We handled it, even if there was an error
        }
    }
}

module.exports = InteractionHandler;({ embeds: [embed] });
    }

    calculateDamage(attacker, defender, turn) {
        const baseDamage = 80;
        const cpRatio = Math.min(attacker.balancedCP / defender.balancedCP, 1.5);
        const turnMultiplier = turn === 1 ? 0.6 : turn === 2 ? 0.8 : 1.0;
        
        const damage = Math.floor(baseDamage * cpRatio * turnMultiplier);
        return Math.max(10, damage);
    }
}

module.exports = BalanceSystem;
