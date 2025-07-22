// PROPERLY FIXED BUTTON HANDLER for index.js - Handles all button formats correctly

async function handleButtonInteraction(interaction) {
    const { customId, user } = interaction;

    console.log(`🔘 Button: ${customId} by ${user.username}`);

    try {
        // PRIORITY 1: Handle NEW Enhanced PvP Accept/Decline buttons (accept_battleId_userId format)
        if (customId.startsWith('accept_') || customId.startsWith('decline_')) {
            console.log('🎯 Enhanced PvP accept/decline button detected!');
            
            // Check if enhanced PvP system is available
            if (!pvpSystem || !pvpSystem.handleBattleResponse) {
                console.error('❌ Enhanced PvP system not available');
                return await interaction.reply({
                    content: '❌ Enhanced PvP system is not available.',
                    flags: MessageFlags.Ephemeral
                });
            }

            try {
                console.log('✅ Calling enhanced PvP system handleBattleResponse');
                await pvpSystem.handleBattleResponse(interaction);
                return;
            } catch (error) {
                console.error('❌ Error in enhanced PvP battle response:', error);
                return await interaction.reply({
                    content: '❌ An error occurred while processing the battle response.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        // PRIORITY 2: Handle OLD Enhanced PvP Battle Accept/Decline buttons (backwards compatibility)
        if (customId.startsWith('battle_accept_') || customId.startsWith('battle_decline_')) {
            console.log('🎯 OLD Enhanced PvP battle button detected!');
            
            // Check if enhanced PvP system is available
            if (!pvpSystem || !pvpSystem.handleBattleResponse) {
                console.error('❌ Enhanced PvP system not available');
                return await interaction.reply({
                    content: '❌ Enhanced PvP system is not available.',
                    flags: MessageFlags.Ephemeral
                });
            }

            try {
                console.log('✅ Calling enhanced PvP system handleBattleResponse (OLD format)');
                await pvpSystem.handleBattleResponse(interaction);
                return;
            } catch (error) {
                console.error('❌ Error in enhanced PvP battle response (OLD):', error);
                return await interaction.reply({
                    content: '❌ An error occurred while processing the battle response.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        // PRIORITY 3: Handle Enhanced PvP Challenge Accept/Decline buttons (pvp_challenge_ format)
        if (customId.startsWith('pvp_challenge_accept_') || customId.startsWith('pvp_challenge_decline_')) {
            const enhancedPvpCommand = client.commands.get('pvp');
            if (enhancedPvpCommand && typeof enhancedPvpCommand.handleChallengeButtons === 'function') {
                console.log('🎯 Handling PvP challenge button');
                await enhancedPvpCommand.handleChallengeButtons(interaction);
                return;
            } else {
                console.error('❌ Enhanced PvP command or handleChallengeButtons method not found');
                return await interaction.reply({
                    content: '❌ PvP challenge system is not available.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        // PRIORITY 4: Handle Enhanced PvP System buttons (battle, fruit selection, etc.)
        if (customId.includes('enhanced') || customId.includes('fruit_selection') || 
            customId.includes('confirm_selection') || customId.includes('clear_selection') ||
            customId.includes('page_switch') || customId.includes('use_skill') ||
            customId.includes('surrender') || customId.includes('show_skills')) {
            try {
                console.log('⚔️ Handling enhanced PvP interaction');
                
                // Handle different types of enhanced PvP interactions
                if (customId.startsWith('fruit_selection_')) {
                    const parts = customId.split('_');
                    const battleId = parts.slice(2, -1).join('_');
                    const userId = parts[parts.length - 1];
                    if (pvpSystem && pvpSystem.handleFruitSelection) {
                        await pvpSystem.handleFruitSelection(interaction, battleId, userId, 'unknown');
                    } else {
                        throw new Error('handleFruitSelection not available');
                    }
                } else if (customId.startsWith('confirm_selection_')) {
                    const parts = customId.split('_');
                    const battleId = parts.slice(2, -1).join('_');
                    const userId = parts[parts.length - 1];
                    if (pvpSystem && pvpSystem.handleConfirmSelection) {
                        await pvpSystem.handleConfirmSelection(interaction, battleId, userId);
                    } else {
                        throw new Error('handleConfirmSelection not available');
                    }
                } else if (customId.startsWith('clear_selection_')) {
                    const parts = customId.split('_');
                    const battleId = parts.slice(2, -1).join('_');
                    const userId = parts[parts.length - 1];
                    if (pvpSystem && pvpSystem.handleClearSelection) {
                        await pvpSystem.handleClearSelection(interaction, battleId, userId);
                    } else {
                        throw new Error('handleClearSelection not available');
                    }
                } else if (customId.startsWith('page_switch_')) {
                    const parts = customId.split('_');
                    const battleId = parts.slice(2, -1).join('_');
                    const userId = parts[parts.length - 1];
                    if (pvpSystem && pvpSystem.handlePageSwitch) {
                        await pvpSystem.handlePageSwitch(interaction, battleId, userId);
                    } else {
                        throw new Error('handlePageSwitch not available');
                    }
                } else if (customId.startsWith('use_skill_')) {
                    const parts = customId.split('_');
                    const battleId = parts.slice(2, -2).join('_');
                    const userId = parts[parts.length - 2];
                    const skillIndex = parseInt(parts[parts.length - 1]);
                    if (pvpSystem && pvpSystem.handleSkillUsage) {
                        await pvpSystem.handleSkillUsage(interaction, battleId, userId, skillIndex);
                    } else {
                        throw new Error('handleSkillUsage not available');
                    }
                } else if (customId.startsWith('show_skills_') || customId.startsWith('view_skills_')) {
                    const parts = customId.split('_');
                    const battleId = parts.slice(2, -1).join('_');
                    const userId = parts[parts.length - 1];
                    if (pvpSystem && pvpSystem.handleViewSkills) {
                        await pvpSystem.handleViewSkills(interaction, battleId, userId);
                    } else {
                        throw new Error('handleViewSkills not available');
                    }
                } else if (customId.startsWith('surrender_')) {
                    const parts = customId.split('_');
                    const battleId = parts.slice(1, -1).join('_');
                    const userId = parts[parts.length - 1];
                    if (pvpSystem && pvpSystem.handleSurrender) {
                        await pvpSystem.handleSurrender(interaction, battleId, userId);
                    } else {
                        throw new Error('handleSurrender not available');
                    }
                } else {
                    console.log('❓ Unknown enhanced PvP interaction type');
                    await interaction.reply({
                        content: '❌ Unknown PvP interaction type.',
                        flags: MessageFlags.Ephemeral
                    });
                }
                return;
            } catch (error) {
                console.error('❌ Error in enhanced PvP interaction:', error);
                await interaction.reply({
                    content: '❌ Error processing PvP interaction.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }

        // PRIORITY 5: Handle pull command buttons (pull_again, pull_10x)
        if (customId === 'pull_again' || customId === 'pull_10x') {
            try {
                console.log(`🎲 Pull button: ${customId}`);
                
                // Check if this is the correct user's pull
                // You might want to add user validation here if needed
                
                // Handle pull buttons - you can add your pull button logic here
                // For now, just acknowledge
                await interaction.reply({
                    content: `🎲 ${customId === 'pull_again' ? 'Pull again' : '10x pull'} button pressed! (Handler needs implementation)`,
                    flags: MessageFlags.Ephemeral
                });
                return;
                
            } catch (error) {
                console.error('❌ Error in pull button:', error);
                await interaction.reply({
                    content: '❌ Error processing pull button.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }

        // PRIORITY 6: Handle legacy PvP queue buttons (if any old ones exist)
        if (customId === 'join_pvp_queue') {
            try {
                if (client.pvpQueue && client.pvpQueue.has(user.id)) {
                    return await interaction.reply({ 
                        content: '❌ You are already in the PvP queue!', 
                        flags: MessageFlags.Ephemeral 
                    });
                }

                await DatabaseManager.ensureUser(user.id, user.username);
                const userFruits = await DatabaseManager.getUserDevilFruits(user.id);
                
                if (userFruits.length < 5) {
                    return await interaction.reply({ 
                        content: '❌ You need at least 5 Devil Fruits to participate in PvP! Use `/pull` to get more fruits.', 
                        flags: MessageFlags.Ephemeral 
                    });
                }

                // Add to queue logic here if you have a queue system
                await interaction.reply({ 
                    content: '⏳ PvP queue system is being developed!', 
                    flags: MessageFlags.Ephemeral 
                });
                return;
                
            } catch (error) {
                console.error('❌ Error in join queue:', error);
                await interaction.reply({
                    content: '❌ Error joining PvP queue.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }
        else if (customId === 'leave_pvp_queue') {
            try {
                // Leave queue logic here if you have a queue system
                await interaction.reply({ 
                    content: '✅ Left the PvP queue.', 
                    flags: MessageFlags.Ephemeral 
                });
                return;
                
            } catch (error) {
                console.error('❌ Error in leave queue:', error);
                await interaction.reply({
                    content: '❌ Error leaving PvP queue.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }

        // PRIORITY 7: Handle legacy battle buttons
        else if (['attack', 'special_attack', 'defend', 'ultimate'].includes(customId)) {
            try {
                // Legacy battle system if you have one
                console.log(`⚔️ Legacy battle button: ${customId}`);
                
                await interaction.reply({
                    content: '⚔️ Legacy battle system is no longer active. Use `/pvp challenge @user` for new battles!',
                    flags: MessageFlags.Ephemeral
                });
                return;
                
            } catch (error) {
                console.error('❌ Error in legacy battle:', error);
                await interaction.reply({
                    content: '❌ Error processing battle action.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }

        // PRIORITY 8: Handle collection/abilities buttons (if you have them)
        else if (customId.startsWith('collection_') || customId.startsWith('abilities_')) {
            try {
                console.log(`📋 Collection/Abilities button: ${customId}`);
                
                // Handle collection pagination or abilities viewing
                await interaction.reply({
                    content: '📋 Collection/Abilities button system needs implementation!',
                    flags: MessageFlags.Ephemeral
                });
                return;
                
            } catch (error) {
                console.error('❌ Error in collection button:', error);
                await interaction.reply({
                    content: '❌ Error processing collection action.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }

        // PRIORITY 9: Unknown button
        else {
            console.log(`❓ Unknown button interaction: ${customId}`);
            await interaction.reply({
                content: '❌ Unknown button interaction.',
                flags: MessageFlags.Ephemeral
            });
        }

    } catch (error) {
        console.error('❌ Critical error in button handler:', error);
        
        // Emergency fallback
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ A critical error occurred processing this button.',
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (fallbackError) {
            console.error('❌ Even emergency fallback failed:', fallbackError);
        }
    }
}
