// src/events/interactionCreate.js - Fixed Interaction Handler for PvP
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

        // Handle button and select menu interactions
        if (interaction.isButton() || interaction.isStringSelectMenu()) {
            // PRIORITY 1: Handle PvP System interactions
            try {
                // Import PvP system safely
                let PvPSystem;
                try {
                    PvPSystem = require('../systems/pvp');
                } catch (error) {
                    console.error('PvP System not available for interaction handling:', error.message);
                    PvPSystem = null;
                }

                if (PvPSystem && await PvPSystem.handleInteraction(interaction)) {
                    return; // PvP interaction was handled successfully
                }
            } catch (error) {
                console.error('Error in PvP interaction handling:', error);
                // Continue to other handlers if PvP fails
                
                // Try to respond to the interaction if it hasn't been handled
                if (!interaction.replied && !interaction.deferred) {
                    try {
                        await interaction.reply({
                            content: '❌ An error occurred with the PvP interaction. Please try again.',
                            ephemeral: true
                        });
                    } catch (replyError) {
                        console.error('Failed to reply to failed PvP interaction:', replyError);
                    }
                }
                return;
            }

            // PRIORITY 2: Handle pull command buttons
            if (interaction.customId === 'pull_again' || interaction.customId === 'pull_10x') {
                try {
                    const PullButtons = require('../commands/helpers/pull-buttons');
                    const originalMessage = interaction.message;
                    
                    // Find the original user from the interaction or message
                    let originalUserId = null;
                    
                    if (originalMessage.interaction && originalMessage.interaction.user) {
                        originalUserId = originalMessage.interaction.user.id;
                    } else {
                        originalUserId = interaction.user.id; // Fallback
                    }
                    
                    if (originalUserId) {
                        await PullButtons.handle(interaction, originalUserId);
                    } else {
                        await interaction.reply({
                            content: '❌ Could not determine the original user for this pull.',
                            ephemeral: true
                        });
                    }
                } catch (error) {
                    console.error('Error handling pull buttons:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ An error occurred with the pull interaction.',
                            ephemeral: true
                        });
                    }
                }
                return;
            }

            // PRIORITY 3: Handle collection pagination buttons
            if (interaction.customId.startsWith('collection_')) {
                try {
                    await handleCollectionButtons(interaction);
                } catch (error) {
                    console.error('Error handling collection buttons:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ An error occurred with the collection interaction.',
                            ephemeral: true
                        });
                    }
                }
                return;
            }

            // PRIORITY 4: Handle abilities command buttons
            if (interaction.customId.startsWith('abilities_')) {
                try {
                    await handleAbilitiesButtons(interaction);
                } catch (error) {
                    console.error('Error handling abilities buttons:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ An error occurred with the abilities interaction.',
                            ephemeral: true
                        });
                    }
                }
                return;
            }

            // If no handler matched, log it for debugging
            console.log(`Unhandled interaction: ${interaction.customId}`);
            
            // Respond to prevent "The application did not respond" error
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({
                        content: '❌ This interaction is not currently supported.',
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Failed to reply to unhandled interaction:', error);
                }
            }
            return;
        }

        // Handle other interaction types
        if (interaction.isStringSelectMenu()) {
            console.log(`Unhandled select menu: ${interaction.customId}`);
            
            // Respond to prevent timeout
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({
                        content: '❌ This select menu is not currently supported.',
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Failed to reply to unhandled select menu:', error);
                }
            }
            return;
        }
    }
};

// Helper function for collection buttons
async function handleCollectionButtons(interaction) {
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
}

// Helper function for abilities buttons
async function handleAbilitiesButtons(interaction) {
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
}
