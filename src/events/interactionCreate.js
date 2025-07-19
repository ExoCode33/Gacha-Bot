// src/events/interactionCreate.js - Updated Interaction Event with Enhanced PvP Support
const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}:`, error);
                
                const errorMessage = { 
                    content: 'There was an error while executing this command!', 
                    ephemeral: true 
                };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
            return;
        }

        // Handle Enhanced PvP interactions
        if (await handleEnhancedPvPInteractions(interaction)) {
            return; // Enhanced PvP interaction was handled
        }

        // Handle other button interactions
        if (interaction.isButton()) {
            // Handle pull command buttons
            if (interaction.customId === 'pull_again' || interaction.customId === 'pull_10x') {
                const PullButtons = require('../commands/helpers/pull-buttons');
                const originalMessage = interaction.message;
                
                // Find the original user from the interaction or message
                let originalUserId = null;
                
                // Try to find user ID from message content or embeds
                if (originalMessage.interaction && originalMessage.interaction.user) {
                    originalUserId = originalMessage.interaction.user.id;
                } else if (originalMessage.embeds && originalMessage.embeds[0]) {
                    // Try to extract from embed if needed
                    originalUserId = interaction.user.id; // Fallback to current user
                }
                
                if (originalUserId) {
                    await PullButtons.handle(interaction, originalUserId);
                } else {
                    await interaction.reply({
                        content: '❌ Could not determine the original user for this pull.',
                        ephemeral: true
                    });
                }
                return;
            }

            // Handle collection pagination buttons
            if (interaction.customId.startsWith('collection_')) {
                await handleCollectionButtons(interaction);
                return;
            }

            // Handle abilities command buttons
            if (interaction.customId.startsWith('abilities_')) {
                await handleAbilitiesButtons(interaction);
                return;
            }

            // Add other button handlers here as needed
            console.log(`Unhandled button interaction: ${interaction.customId}`);
            return;
        }

        // Handle select menu interactions
        if (interaction.isStringSelectMenu()) {
            // Enhanced PvP select menus are handled above
            console.log(`Unhandled select menu interaction: ${interaction.customId}`);
            return;
        }
    }
};

// Handle Enhanced PvP interactions
async function handleEnhancedPvPInteractions(interaction) {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) {
        return false;
    }

    const customId = interaction.customId;
    const EnhancedPvPInteractions = require('../systems/enhanced-pvp-interactions');

    try {
        // Handle PvP challenge responses
        if (customId.startsWith('pvp_accept_') || customId.startsWith('pvp_decline_') || customId.startsWith('pvp_preview_')) {
            const parts = customId.split('_');
            const action = parts[1]; // accept, decline, preview
            const battleId = parts.slice(2).join('_'); // Rejoin in case battleId has underscores
            
            await EnhancedPvPInteractions.handleChallengeResponse(interaction, battleId, action);
            return true;
        }

        // Handle fruit selection button (enhanced version)
        if (customId.startsWith('enhanced_fruit_select_')) {
            const battleId = customId.replace('enhanced_fruit_select_', '');
            await EnhancedPvPInteractions.handleFruitSelection(interaction, battleId);
            return true;
        }

        // Handle fruit selection button (original version for backward compatibility)
        if (customId.startsWith('fruit_select_')) {
            const battleId = customId.replace('fruit_select_', '');
            await EnhancedPvPInteractions.handleFruitSelection(interaction, battleId);
            return true;
        }

        // Handle fruit selection menus
        if (customId.startsWith('enhanced_fruit_menu_')) {
            const parts = customId.split('_');
            const battleId = parts[3];
            const userId = parts[4];
            const menuIndex = parseInt(parts[5]);
            
            await EnhancedPvPInteractions.handleFruitMenuSelection(interaction, battleId, userId, menuIndex);
            return true;
        }

        // Handle confirm selection buttons
        if (customId.startsWith('enhanced_confirm_fruits_')) {
            const parts = customId.split('_');
            const battleId = parts[3];
            const userId = parts[4];
            
            await EnhancedPvPInteractions.handleConfirmSelection(interaction, battleId, userId);
            return true;
        }

        // Handle battle fruit selection
        if (customId.startsWith('enhanced_battle_fruit_')) {
            const parts = customId.split('_');
            const battleId = parts[3];
            const userId = parts[4];
            
            await EnhancedPvPInteractions.handleBattleFruitSelection(interaction, battleId, userId);
            return true;
        }

        // Handle cancel battle
        if (customId.startsWith('enhanced_cancel_battle_')) {
            const parts = customId.split('_');
            const battleId = parts[3];
            const userId = parts[4];
            
            await EnhancedPvPInteractions.handleCancelBattle(interaction, battleId, userId);
            return true;
        }

        return false; // Not an enhanced PvP interaction

    } catch (error) {
        console.error('Error handling enhanced PvP interaction:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An error occurred while processing your battle interaction.',
                ephemeral: true
            });
        }
        
        return true; // We attempted to handle it
    }
}

// Handle collection pagination buttons
async function handleCollectionButtons(interaction) {
    try {
        const parts = interaction.customId.split('_');
        const action = parts[1]; // prev, next, etc.
        const userId = parts[2];
        const currentPage = parseInt(parts[3]);
        const rarityFilter = parts[4] === 'all' ? null : parts[4];
        
        // Verify user can interact
        if (interaction.user.id !== userId) {
            return interaction.reply({
                content: '❌ You can only interact with your own collection!',
                ephemeral: true
            });
        }
        
        // Get collection command and handle pagination
        const collectionCommand = interaction.client.commands.get('collection');
        if (collectionCommand && collectionCommand.handlePagination) {
            await collectionCommand.handlePagination(interaction, action, userId, currentPage, rarityFilter);
        } else {
            await interaction.reply({
                content: '❌ Collection pagination is not available.',
                ephemeral: true
            });
        }
        
    } catch (error) {
        console.error('Error handling collection buttons:', error);
        await interaction.reply({
            content: '❌ An error occurred while handling the collection interaction.',
            ephemeral: true
        });
    }
}

// Handle abilities command buttons
async function handleAbilitiesButtons(interaction) {
    try {
        const parts = interaction.customId.split('_');
        const action = parts[1]; // prev, next, toggle, etc.
        
        // Get abilities command and handle interaction
        const abilitiesCommand = interaction.client.commands.get('abilities');
        if (abilitiesCommand && abilitiesCommand.handleButtonInteraction) {
            await abilitiesCommand.handleButtonInteraction(interaction, action, parts);
        } else {
            await interaction.reply({
                content: '❌ Abilities interaction is not available.',
                ephemeral: true
            });
        }
        
    } catch (error) {
        console.error('Error handling abilities buttons:', error);
        await interaction.reply({
            content: '❌ An error occurred while handling the abilities interaction.',
            ephemeral: true
        });
    }
}
