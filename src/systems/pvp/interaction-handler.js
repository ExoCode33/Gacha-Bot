// src/systems/pvp/interaction-handler.js - Complete Interaction Handler
class InteractionHandler {
    constructor(pvpSystem) {
        this.pvpSystem = pvpSystem;
    }

    async handle(interaction) {
        const customId = interaction.customId;

        try {
            // Handle leave queue buttons
            if (customId.startsWith('leave_queue_')) {
                const userId = customId.replace('leave_queue_', '');
                
                if (interaction.user.id !== userId) {
                    return await interaction.reply({
                        content: '❌ You can only interact with your own queue!',
                        ephemeral: true
                    });
                }

                if (!this.pvpSystem.queue || !this.pvpSystem.queue.isInQueue(userId)) {
                    return await interaction.reply({
                        content: '❌ You are not in the queue.',
                        ephemeral: true
                    });
                }

                await this.pvpSystem.queue.handleLeaveQueueButton(interaction, userId);
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

                if (this.pvpSystem.battle) {
                    await this.pvpSystem.battle.handleChallengeResponse(
                        interaction, 
                        challengerId, 
                        defenderId, 
                        action
                    );
                } else {
                    // Fallback if battle system not loaded
                    const { EmbedBuilder } = require('discord.js');
                    const embed = new EmbedBuilder()
                        .setColor(action === 'accept' ? 0x00FF00 : 0xFF0000)
                        .setTitle(action === 'accept' ? '⚔️ Challenge Accepted!' : '❌ Challenge Declined')
                        .setDescription(action === 'accept' ? 
                            'Battle system is loading...' : 
                            'The challenge has been declined.')
                        .setFooter({ text: action === 'accept' ? 
                            'Enhanced battle system coming soon!' : 
                            'Maybe next time!' });

                    await interaction.update({
                        embeds: [embed],
                        components: []
                    });
                }

                return true;
            }

            // Handle PvP battle interactions (for future turn-based battles)
            if (customId.startsWith('pvp_battle_')) {
                // Future: Handle turn-based battle interactions
                await interaction.reply({
                    content: '⚔️ Enhanced battle interactions coming soon!',
                    ephemeral: true
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

    // Helper method to validate interactions
    validateInteraction(interaction, expectedUserId) {
        return interaction.user.id === expectedUserId;
    }

    // Helper method to check if user can interact with a specific battle
    canInteractWithBattle(interaction, battleData) {
        const userId = interaction.user.id;
        return (
            battleData.challenger?.userId === userId ||
            battleData.defender?.userId === userId ||
            battleData.fighter1?.userId === userId ||
            battleData.fighter2?.userId === userId
        );
    }
}

module.exports = InteractionHandler;
