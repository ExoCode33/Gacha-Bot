// src/systems/enhanced-pvp-interactions.js - Enhanced PvP Interactions Handler
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const { getRarityEmoji, getFruitByName } = require('../data/devil-fruits');

// Import abilities safely
let balancedDevilFruitAbilities = {};
let statusEffects = {};

try {
    const abilitiesData = require('../data/balanced-devil-fruit-abilities');
    balancedDevilFruitAbilities = abilitiesData.balancedDevilFruitAbilities || {};
    statusEffects = abilitiesData.statusEffects || {};
} catch (error) {
    console.warn('⚠️ Could not load devil fruit abilities in enhanced-pvp-interactions');
}

class EnhancedPvPInteractions {
    constructor() {
        this.activeBattles = new Map();
        this.tempSelections = new Map();
        this.challengeRequests = new Map(); // Store challenge requests
        this.challengeTimeouts = new Map(); // Store challenge timeouts
        
        console.log('🎮 Enhanced PvP Interactions system initialized');
    }

    // Handle challenge response (accept/decline/preview)
    async handleChallengeResponse(interaction, battleId, action) {
        try {
            const challengeData = this.challengeRequests.get(battleId);
            
            if (!challengeData) {
                return interaction.reply({
                    content: '❌ Challenge request not found or has expired.',
                    ephemeral: true
                });
            }

            const { challenger, opponent, challengerFighter, opponentFighter } = challengeData;

            // Verify the user can respond to this challenge
            if (interaction.user.id !== opponent.id && action !== 'preview') {
                return interaction.reply({
                    content: '❌ Only the challenged player can respond to this challenge.',
                    ephemeral: true
                });
            }

            switch (action) {
                case 'accept':
                    await this.acceptChallenge(interaction, battleId, challengeData);
                    break;
                    
                case 'decline':
                    await this.declineChallenge(interaction, battleId, challengeData);
                    break;
                    
                case 'preview':
                    await this.previewChallenge(interaction, challengeData);
                    break;
                    
                default:
                    await interaction.reply({
                        content: '❌ Unknown challenge action.',
                        ephemeral: true
                    });
            }
        } catch (error) {
            console.error('Error handling challenge response:', error);
            await interaction.reply({
                content: '❌ An error occurred while processing the challenge response.',
                ephemeral: true
            });
        }
    }

    // Accept challenge
    async acceptChallenge(interaction, battleId, challengeData) {
        const { challenger, opponent, challengerFighter, opponentFighter } = challengeData;

        // Clear the challenge timeout
        if (this.challengeTimeouts.has(battleId)) {
            clearTimeout(this.challengeTimeouts.get(battleId));
            this.challengeTimeouts.delete(battleId);
        }

        // Remove from challenge requests
        this.challengeRequests.delete(battleId);

        const acceptEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('⚔️ Challenge Accepted!')
            .setDescription(`**${opponent.username}** has accepted **${challenger.username}**'s challenge!`)
            .addFields([
                {
                    name: '🎮 Battle Type',
                    value: 'Turn-based PvP Battle',
                    inline: true
                },
                {
                    name: '⚡ Next Step',
                    value: 'Preparing battle arena...',
                    inline: true
                }
            ])
            .setFooter({ text: 'Battle starting soon!' })
            .setTimestamp();

        await interaction.update({
            embeds: [acceptEmbed],
            components: []
        });

        // Try to start enhanced turn-based battle
        try {
            const EnhancedTurnBasedPvP = require('./enhanced-turn-based-pvp');
            
            // Start the actual turn-based battle
            setTimeout(async () => {
                await EnhancedTurnBasedPvP.startBattle(interaction, challengerFighter, opponentFighter);
            }, 2000);
            
        } catch (error) {
            console.error('Enhanced turn-based system not available, using fallback');
            
            // Fallback to quick battle simulation
            setTimeout(async () => {
                await this.fallbackBattle(interaction, challengerFighter, opponentFighter);
            }, 2000);
        }
    }

    // Decline challenge
    async declineChallenge(interaction, battleId, challengeData) {
        const { challenger, opponent } = challengeData;

        // Clear the challenge timeout
        if (this.challengeTimeouts.has(battleId)) {
            clearTimeout(this.challengeTimeouts.get(battleId));
            this.challengeTimeouts.delete(battleId);
        }

        // Remove from challenge requests
        this.challengeRequests.delete(battleId);

        const declineEmbed = new EmbedBuilder()
            .setColor(0xFF4500)
            .setTitle('🏳️ Challenge Declined')
            .setDescription(`**${opponent.username}** has declined **${challenger.username}**'s challenge.`)
            .addFields([
                {
                    name: '💭 Message',
                    value: `${opponent.username} is not ready for battle right now.`,
                    inline: false
                }
            ])
            .setFooter({ text: 'Challenge another time!' })
            .setTimestamp();

        await interaction.update({
            embeds: [declineEmbed],
            components: []
        });
    }

    // Preview challenge details
    async previewChallenge(interaction, challengeData) {
        const { challenger, opponent, challengerFighter, opponentFighter } = challengeData;

        // Calculate balance check
        let balanceCheck = { isBalanced: true, issues: [], recommendation: 'Fight is balanced' };
        try {
            const PvPBalanceSystem = require('./pvp-balance');
            balanceCheck = PvPBalanceSystem.validateFightBalance(challengerFighter, opponentFighter);
        } catch (error) {
            console.warn('Could not load balance system for preview');
        }

        const previewEmbed = new EmbedBuilder()
            .setColor(balanceCheck.isBalanced ? 0x00FF00 : 0xFF8000)
            .setTitle('👁️ Challenge Preview')
            .setDescription('Detailed analysis of the proposed battle')
            .addFields([
                {
                    name: `🏴‍☠️ ${challenger.username} (Challenger)`,
                    value: [
                        `**Level**: ${challengerFighter.level}`,
                        `**Balanced CP**: ${challengerFighter.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${challengerFighter.maxHealth}`,
                        `**Total Fruits**: ${challengerFighter.fruits.length}`,
                        `**Strongest Fruit**: ${challengerFighter.strongestFruit?.fruit_name || 'Unknown'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: `🏴‍☠️ ${opponent.username} (Challenged)`,
                    value: [
                        `**Level**: ${opponentFighter.level}`,
                        `**Balanced CP**: ${opponentFighter.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${opponentFighter.maxHealth}`,
                        `**Total Fruits**: ${opponentFighter.fruits.length}`,
                        `**Strongest Fruit**: ${opponentFighter.strongestFruit?.fruit_name || 'Unknown'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚖️ Balance Analysis',
                    value: [
                        `**Status**: ${balanceCheck.isBalanced ? '✅ Balanced' : '⚠️ Unbalanced'}`,
                        `**CP Ratio**: ${balanceCheck.cpRatio?.toFixed(2) || 'N/A'}x`,
                        `**Level Difference**: ${balanceCheck.levelDiff || 'N/A'}`,
                        `**Recommendation**: ${balanceCheck.recommendation}`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'This preview is visible only to you' })
            .setTimestamp();

        await interaction.reply({
            embeds: [previewEmbed],
            ephemeral: true
        });
    }

    // Fallback battle system
    async fallbackBattle(interaction, fighter1, fighter2) {
        try {
            const PvPBalanceSystem = require('./pvp-balance');
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⚔️ PvP Battle Simulation')
                .setDescription('Enhanced turn-based system unavailable - using quick battle simulation')
                .addFields([
                    {
                        name: '⚠️ Notice',
                        value: 'This is a quick simulation. For full turn-based battles, ensure the enhanced system is properly loaded.',
                        inline: false
                    }
                ]);

            await interaction.followUp({
                embeds: [embed]
            });

            // Simulate the battle
            const battleResult = await PvPBalanceSystem.simulateFight(fighter1, fighter2);
            const resultEmbed = PvPBalanceSystem.createFightEmbed(battleResult);

            resultEmbed.title = '⚔️ PvP Battle Result (Simulation)';
            resultEmbed.fields.push({
                name: '🎮 Battle Type',
                value: 'Quick Simulation (Fallback Mode)',
                inline: true
            });

            await interaction.followUp({
                embeds: [resultEmbed]
            });

        } catch (error) {
            console.error('Error in fallback battle:', error);
            await interaction.followUp({
                content: '❌ An error occurred during the battle simulation.',
            });
        }
    }

    // Create challenge with timeout
    async createChallenge(challenger, opponent, challengerFighter, opponentFighter) {
        const battleId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const challengeData = {
            battleId,
            challenger,
            opponent,
            challengerFighter,
            opponentFighter,
            created: Date.now()
        };

        // Store the challenge
        this.challengeRequests.set(battleId, challengeData);

        // Set up timeout (60 seconds)
        const timeout = setTimeout(() => {
            this.expireChallenge(battleId);
        }, 60000);
        
        this.challengeTimeouts.set(battleId, timeout);

        return battleId;
    }

    // Expire challenge
    async expireChallenge(battleId) {
        const challengeData = this.challengeRequests.get(battleId);
        
        if (challengeData) {
            console.log(`⏰ Challenge ${battleId} expired`);
            this.challengeRequests.delete(battleId);
        }
        
        if (this.challengeTimeouts.has(battleId)) {
            this.challengeTimeouts.delete(battleId);
        }
    }

    // Create challenge embed with buttons
    createChallengeEmbed(challenger, opponent, challengerFighter, opponentFighter, battleId) {
        let balanceCheck = { isBalanced: true, cpRatio: 1, levelDiff: 0, recommendation: 'Fight appears balanced' };
        
        try {
            const PvPBalanceSystem = require('./pvp-balance');
            balanceCheck = PvPBalanceSystem.validateFightBalance(challengerFighter, opponentFighter);
        } catch (error) {
            console.warn('Could not load balance system for challenge embed');
        }

        const embed = new EmbedBuilder()
            .setColor(balanceCheck.isBalanced ? 0x00FF00 : 0xFF8000)
            .setTitle('⚔️ PvP Challenge!')
            .setDescription(`**${challenger.username}** challenges **${opponent.username}** to an epic Devil Fruit battle!`)
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
                    name: '⚖️ Quick Balance Check',
                    value: [
                        `**Balanced**: ${balanceCheck.isBalanced ? '✅ Yes' : '⚠️ Unbalanced'}`,
                        `**CP Ratio**: ${balanceCheck.cpRatio?.toFixed(2) || 'N/A'}x`,
                        `**Level Difference**: ${balanceCheck.levelDiff || 'N/A'}`,
                        `**Recommendation**: ${balanceCheck.recommendation}`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ 
                text: `${opponent.username}, you have 60 seconds to respond!` 
            })
            .setTimestamp();

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`pvp_accept_${battleId}`)
                    .setLabel('⚔️ Accept Challenge')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`pvp_decline_${battleId}`)
                    .setLabel('🏳️ Decline')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`pvp_preview_${battleId}`)
                    .setLabel('👁️ Preview')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embed, buttons };
    }

    // Handle fruit selection (placeholder for future enhancement)
    async handleFruitSelection(interaction, battleId) {
        return interaction.reply({
            content: '🔧 Fruit selection is handled by the enhanced turn-based system. Please use `/pvp queue` for turn-based battles.',
            ephemeral: true
        });
    }

    // Handle fruit menu selection (placeholder)
    async handleFruitMenuSelection(interaction, battleId, userId, menuIndex) {
        return interaction.reply({
            content: '🔧 Fruit menu selection is handled by the enhanced turn-based system.',
            ephemeral: true
        });
    }

    // Handle confirm selection (placeholder)
    async handleConfirmSelection(interaction, battleId, userId) {
        return interaction.reply({
            content: '🔧 Selection confirmation is handled by the enhanced turn-based system.',
            ephemeral: true
        });
    }

    // Handle battle fruit selection (placeholder)
    async handleBattleFruitSelection(interaction, battleId, userId) {
        return interaction.reply({
            content: '🔧 Battle fruit selection is handled by the enhanced turn-based system.',
            ephemeral: true
        });
    }

    // Handle cancel battle
    async handleCancelBattle(interaction, battleId, userId) {
        // Try to cancel from enhanced system first
        try {
            const EnhancedTurnBasedPvP = require('./enhanced-turn-based-pvp');
            const activeBattle = EnhancedTurnBasedPvP.activeBattles.get(battleId);
            
            if (activeBattle) {
                EnhancedTurnBasedPvP.activeBattles.delete(battleId);
                
                return interaction.reply({
                    content: '✅ Battle cancelled successfully.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.warn('Enhanced system not available for battle cancellation');
        }

        // Cancel challenge if it exists
        if (this.challengeRequests.has(battleId)) {
            this.challengeRequests.delete(battleId);
            
            if (this.challengeTimeouts.has(battleId)) {
                clearTimeout(this.challengeTimeouts.get(battleId));
                this.challengeTimeouts.delete(battleId);
            }
            
            return interaction.reply({
                content: '✅ Challenge cancelled.',
                ephemeral: true
            });
        }

        return interaction.reply({
            content: '❌ No active battle or challenge found to cancel.',
            ephemeral: true
        });
    }

    // Placeholder method for any other interactions
    async handleGenericInteraction(interaction) {
        return interaction.reply({
            content: '🔧 This PvP feature is handled by the enhanced turn-based system. Please try `/pvp queue` for battles!',
            ephemeral: true
        });
    }

    // Clean up expired challenges
    cleanupExpiredChallenges() {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        for (const [battleId, challengeData] of this.challengeRequests) {
            if (now - challengeData.created > maxAge) {
                this.expireChallenge(battleId);
                console.log(`🧹 Cleaned up expired challenge: ${battleId}`);
            }
        }
    }

    // Get challenge statistics
    getChallengeStats() {
        return {
            activeChallenges: this.challengeRequests.size,
            activeTimeouts: this.challengeTimeouts.size,
            tempSelections: this.tempSelections.size
        };
    }
}

// Create singleton instance
const enhancedPvPInteractions = new EnhancedPvPInteractions();

// Set up cleanup interval
setInterval(() => {
    enhancedPvPInteractions.cleanupExpiredChallenges();
}, 2 * 60 * 1000); // Clean up every 2 minutes

module.exports = enhancedPvPInteractions;
