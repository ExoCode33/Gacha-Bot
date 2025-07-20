// src/events/interactionCreate.js - FIXED for Enhanced Turn-Based PvP
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

        // PRIORITY: Handle Enhanced Turn-Based PvP interactions FIRST
        if (interaction.isButton() || interaction.isStringSelectMenu()) {
            if (await handleEnhancedTurnBasedPvP(interaction)) {
                return; // Enhanced turn-based PvP interaction was handled
            }
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
            // Enhanced turn-based PvP select menus are handled above
            console.log(`Unhandled select menu interaction: ${interaction.customId}`);
            return;
        }
    }
};

// FIXED: Handle Enhanced Turn-Based PvP interactions with comprehensive pattern matching
async function handleEnhancedTurnBasedPvP(interaction) {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) {
        return false;
    }

    const customId = interaction.customId;
    
    try {
        // FIXED: Try multiple ways to import the enhanced PvP system
        let PvPInteractionHandler = null;
        
        // Method 1: Try from the command module
        try {
            const enhancedPvPCommand = require('../commands/enhanced-pvp');
            if (enhancedPvPCommand.PvPInteractionHandler) {
                PvPInteractionHandler = enhancedPvPCommand.PvPInteractionHandler;
                console.log('✅ Loaded PvP handler from enhanced-pvp command');
            }
        } catch (error) {
            console.log('⚠️ Could not load PvP handler from command');
        }
        
        // Method 2: Try direct import
        if (!PvPInteractionHandler) {
            try {
                const enhancedPvP = require('../systems/enhanced-turn-based-pvp');
                PvPInteractionHandler = enhancedPvP.PvPInteractionHandler;
                console.log('✅ Loaded PvP handler from direct import');
            } catch (error) {
                console.log('⚠️ Could not load PvP handler from direct import');
            }
        }

        if (!PvPInteractionHandler) {
            console.log('❌ Enhanced Turn-Based PvP system not available');
            return false;
        }
        
        // FIXED: Comprehensive check for enhanced turn-based PvP interactions
        const pvpPrefixes = [
            'fruit_selection_',         // Enhanced multi-rarity fruit selection
            'confirm_selection_',       // Confirm fruit selection
            'clear_selection_',         // Clear fruit selection
            'page_switch_',            // FIXED: Page switching between High/Low
            'use_skill_',              // Enhanced skill usage
            'start_battle_',           // Enhanced battle start
            'show_skills_',            // Enhanced skill display
            'surrender_',              // Enhanced surrender
            'view_log_',               // Enhanced battle log
            'battle_stats_'            // Enhanced battle stats
        ];

        // FIXED: Enhanced pattern matching for all PvP interactions
        const isPvPInteraction = pvpPrefixes.some(prefix => customId.startsWith(prefix)) ||
                                customId.includes('_divine') ||
                                customId.includes('_mythical') ||
                                customId.includes('_legendary') ||
                                customId.includes('_epic') ||
                                customId.includes('_rare') ||
                                customId.includes('_uncommon') ||
                                customId.includes('_common') ||
                                customId.includes('battle_') ||
                                customId.includes('_battle_');
        
        if (isPvPInteraction) {
            console.log(`🎮 Handling enhanced turn-based PvP interaction: ${customId}`);
            return await PvPInteractionHandler.handleInteraction(interaction);
        }

        return false; // Not a turn-based PvP interaction

    } catch (error) {
        console.error('Error handling enhanced turn-based PvP interaction:', error);
        
        // Check for specific Discord error codes
        if (error.code === 10062) {
            console.warn('⚠️ Enhanced PvP interaction expired - this is normal for old interactions');
            return true; // Mark as handled to prevent further processing
        }
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred while processing your enhanced battle interaction.',
                    ephemeral: true
                });
            }
        } catch (replyError) {
            console.error('Failed to send enhanced PvP error reply:', replyError);
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
