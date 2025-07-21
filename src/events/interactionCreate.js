// src/events/interactionCreate.js - Updated with Queue System Integration
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
            const customId = interaction.customId;

            // PRIORITY 1: Handle Queue System interactions
            if (await handleQueueSystemInteractions(interaction)) {
                return;
            }

            // PRIORITY 2: Handle Enhanced Turn-Based PvP interactions
            if (await handleEnhancedTurnBasedPvP(interaction)) {
                return;
            }

            // PRIORITY 3: Handle other interactions
            await handleOtherInteractions(interaction);
        }
    }
};

// Handle Queue System interactions
async function handleQueueSystemInteractions(interaction) {
    const customId = interaction.customId;

    try {
        // Get the queue system from the enhanced PvP command
        let queueSystem = null;
        try {
            const enhancedPvPCommand = require('../commands/enhanced-pvp');
            queueSystem = enhancedPvPCommand.PvPQueueSystem;
        } catch (error) {
            console.error('Queue system not available:', error);
            return false;
        }

        if (!queueSystem) return false;

        // Handle leave queue button
        if (customId.startsWith('leave_queue_')) {
            const userId = customId.replace('leave_queue_', '');
            
            if (interaction.user.id !== userId) {
                await interaction.reply({
                    content: '❌ You can only interact with your own queue!',
                    ephemeral: true
                });
                return true;
            }
            
            await queueSystem.leaveQueue(interaction, userId);
            return true;
        }

        // Handle fruit selection dropdowns
        if (customId.includes('fruit_selection_') && 
           (customId.includes('_divine') || customId.includes('_mythical') || 
            customId.includes('_legendary') || customId.includes('_epic') ||
            customId.includes('_rare') || customId.includes('_uncommon') || customId.includes('_common'))) {
            
            const parts = customId.split('_');
            const selectionIndex = parts.findIndex(part => part === 'selection');
            
            if (selectionIndex !== -1 && selectionIndex + 3 < parts.length) {
                const battleId = parts.slice(selectionIndex + 1, -2).join('_');
                const userId = parts[parts.length - 2];
                const rarity = parts[parts.length - 1];
                
                if (interaction.user.id !== userId) {
                    await interaction.reply({
                        content: '❌ You can only interact with your own selection!',
                        ephemeral: true
                    });
                    return true;
                }
                
                await queueSystem.handleFruitSelection(interaction, battleId, userId, rarity);
                return true;
            }
        }

        // Handle page switching
        if (customId.startsWith('page_switch_')) {
            const parts = customId.split('_');
            if (parts.length >= 4) {
                const battleId = parts.slice(2, -1).join('_');
                const userId = parts[parts.length - 1];
                
                if (interaction.user.id !== userId) {
                    await interaction.reply({
                        content: '❌ You can only interact with your own selection!',
                        ephemeral: true
                    });
                    return true;
                }
                
                await queueSystem.handlePageSwitch(interaction, battleId, userId);
                return true;
            }
        }

        // Handle confirm selection
        if (customId.startsWith('confirm_selection_')) {
            const parts = customId.split('_');
            if (parts.length >= 4) {
                const battleId = parts.slice(2, -1).join('_');
                const userId = parts[parts.length - 1];
                
                if (interaction.user.id !== userId) {
                    await interaction.reply({
                        content: '❌ You can only interact with your own selection!',
                        ephemeral: true
                    });
                    return true;
                }
                
                await queueSystem.handleConfirmSelection(interaction, battleId, userId);
                return true;
            }
        }

        // Handle clear selection
        if (customId.startsWith('clear_selection_')) {
            const parts = customId.split('_');
            if (parts.length >= 4) {
                const battleId = parts.slice(2, -1).join('_');
                const userId = parts[parts.length - 1];
                
                if (interaction.user.id !== userId) {
                    await interaction.reply({
                        content: '❌ You can only interact with your own selection!',
                        ephemeral: true
                    });
                    return true;
                }
                
                await queueSystem.handleClearSelection(interaction, battleId, userId);
                return true;
            }
        }

        return false;

    } catch (error) {
        console.error('Error handling queue system interaction:', error);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred during queue interaction.',
                    ephemeral: true
                });
            }
        } catch (replyError) {
            console.error('Failed to send queue error reply:', replyError);
        }
        
        return true;
    }
}

// Handle Enhanced Turn-Based PvP interactions
async function handleEnhancedTurnBasedPvP(interaction) {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) {
        return false;
    }

    const customId = interaction.customId;
    
    try {
        // Try to load the enhanced PvP system
        let enhancedPvPSystem = null;
        
        try {
            enhancedPvPSystem = require('../systems/enhanced-turn-based-pvp');
        } catch (error) {
            console.error('Could not load Enhanced PvP system:', error);
            return false;
        }

        if (!enhancedPvPSystem || !enhancedPvPSystem.interactionHandler) {
            return false;
        }
        
        // Enhanced pattern matching for all PvP interactions
        const pvpPrefixes = [
            'use_skill_',              // Skill usage in battle
            'start_battle_',           // Start battle button
            'show_skills_',            // Show skill details
            'surrender_',              // Surrender battle
            'view_log_',               // View battle log
            'battle_stats_'            // Battle statistics
        ];

        // Check if this is a PvP battle interaction (not queue-related)
        const isPvPBattleInteraction = pvpPrefixes.some(prefix => customId.startsWith(prefix)) ||
                                      customId.includes('battle_') ||
                                      customId.includes('_battle_');
        
        if (isPvPBattleInteraction) {
            console.log(`🎮 Handling enhanced turn-based PvP interaction: ${customId}`);
            return await enhancedPvPSystem.interactionHandler.handleInteraction(interaction);
        }

        return false;

    } catch (error) {
        console.error('Error handling enhanced turn-based PvP interaction:', error);
        
        if (error.code === 10062) {
            console.warn('⚠️ Enhanced PvP interaction expired');
            return true;
        }
        
        if (error.code === 'InteractionNotReplied' || error.message.includes('InteractionNotReplied')) {
            console.warn('⚠️ Interaction not replied - this can happen during complex battle flows');
            return true;
        }
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred while processing your battle interaction.',
                    ephemeral: true
                });
            }
        } catch (replyError) {
            console.error('Failed to send enhanced PvP error reply:', replyError);
        }
        
        return true;
    }
}

// Handle other interactions (pull buttons, collection, etc.)
async function handleOtherInteractions(interaction) {
    const customId = interaction.customId;

    try {
        // Handle pull command buttons
        if (customId === 'pull_again' || customId === 'pull_10x') {
            const PullButtons = require('../commands/helpers/pull-buttons');
            const originalMessage = interaction.message;
            
            let originalUserId = null;
            
            if (originalMessage.interaction && originalMessage.interaction.user) {
                originalUserId = originalMessage.interaction.user.id;
            } else {
                originalUserId = interaction.user.id;
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
        if (customId.startsWith('collection_')) {
            await handleCollectionButtons(interaction);
            return;
        }

        // Handle abilities command buttons
        if (customId.startsWith('abilities_')) {
            await handleAbilitiesButtons(interaction);
            return;
        }

        // Log unhandled interactions
        console.log(`Unhandled interaction: ${customId}`);

    } catch (error) {
        console.error('Error handling other interactions:', error);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred while processing your interaction.',
                    ephemeral: true
                });
            }
        } catch (replyError) {
            console.error('Failed to send error reply:', replyError);
        }
    }
}

// Handle collection pagination buttons
async function handleCollectionButtons(interaction) {
    try {
        const parts = interaction.customId.split('_');
        const action = parts[1];
        const userId = parts[2];
        const currentPage = parseInt(parts[3]);
        const rarityFilter = parts[4] === 'all' ? null : parts[4];
        
        if (interaction.user.id !== userId) {
            return interaction.reply({
                content: '❌ You can only interact with your own collection!',
                ephemeral: true
            });
        }
        
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
        const action = parts[1];
        
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
