// Key fixes for enhanced-turn-based-pvp.js - Add these methods to prevent timeouts

// FIXED: Show fruit selection interface with better error handling
async showFruitSelectionForPlayer(interaction, battleData, player) {
    const { isVsNPC, npcBoss } = battleData;
    
    try {
        // Sort fruits by rarity (highest first) then by name
        const rarityOrder = ['divine', 'omnipotent', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
        const sortedFruits = [...player.fruits].sort((a, b) => {
            const rarityDiff = rarityOrder.indexOf(a.fruit_rarity) - rarityOrder.indexOf(b.fruit_rarity);
            if (rarityDiff !== 0) return rarityDiff;
            return a.fruit_name.localeCompare(b.fruit_name);
        });

        // Ensure we have fruits to select
        if (sortedFruits.length < 5) {
            if (interaction.deferred) {
                return await interaction.editReply({
                    content: '❌ You need at least 5 Devil Fruits to participate in turn-based battles!',
                });
            } else {
                return await interaction.reply({
                    content: '❌ You need at least 5 Devil Fruits to participate in turn-based battles!',
                    ephemeral: true
                });
            }
        }

        // Create detailed fruit selection display
        const fruitListText = sortedFruits.slice(0, 15).map((fruit, index) => {
            const emoji = getRarityEmoji(fruit.fruit_rarity);
            const ability = balancedDevilFruitAbilities[fruit.fruit_name];
            const damage = ability ? ability.damage : 100;
            const cooldown = ability ? ability.cooldown : 0;
            const effect = ability && ability.effect ? ` • ${ability.effect}` : '';
            
            return `${emoji} **${fruit.fruit_name}**\n   ⚔️ ${ability?.name || 'Unknown'} - ${damage} dmg, ${cooldown}cd${effect}`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('⚔️ PvP Battle - Fruit Selection')
            .setDescription(
                isVsNPC 
                    ? `You're about to face a mysterious opponent!\n\n**Select 5 Devil Fruits for battle:**`
                    : `**PvP Battle Starting!**\n\nBoth players select 5 Devil Fruits for battle.`
            )
            .addFields([
                {
                    name: '🏴‍☠️ Your Stats',
                    value: [
                        `**Name**: ${player.username}`,
                        `**Level**: ${player.level}`,
                        `**Balanced CP**: ${player.balancedCP.toLocaleString()}`,
                        `**Battle HP**: ${player.maxHealth}`,
                        `**Available Fruits**: ${player.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚡ Battle Info',
                    value: [
                        `**Battle Type**: ${isVsNPC ? 'PvE (vs Mysterious Boss)' : 'PvP (Player vs Player)'}`,
                        `**Turn Based**: Yes`,
                        `**Max Turns**: 15`,
                        `**Skill Selection**: Real-time`,
                        `**Battle Log**: Live updates`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🍈 Your Devil Fruits (Sorted by Rarity)',
                    value: fruitListText + (sortedFruits.length > 15 ? `\n\n...and ${sortedFruits.length - 15} more fruits` : ''),
                    inline: false
                }
            ])
            .setFooter({ text: `Select your strongest 5 fruits from ${sortedFruits.length} available!` })
            .setTimestamp();

        // Create multiple selection menus if needed (Discord limit: 25 options per menu)
        const components = [];
        const maxOptionsPerMenu = 25;
        const totalMenus = Math.ceil(sortedFruits.length / maxOptionsPerMenu);

        for (let menuIndex = 0; menuIndex < totalMenus && menuIndex < 4; menuIndex++) { // Max 4 menus (100 fruits)
            const startIndex = menuIndex * maxOptionsPerMenu;
            const endIndex = Math.min(startIndex + maxOptionsPerMenu, sortedFruits.length);
            const menuFruits = sortedFruits.slice(startIndex, endIndex);

            const fruitOptions = menuFruits.map((fruit, localIndex) => {
                const globalIndex = startIndex + localIndex;
                const emoji = getRarityEmoji(fruit.fruit_rarity);
                const ability = balancedDevilFruitAbilities[fruit.fruit_name];
                const damage = ability ? ability.damage : 100;
                const cooldown = ability ? ability.cooldown : 0;
                
                return {
                    label: fruit.fruit_name.length > 25 ? fruit.fruit_name.slice(0, 22) + '...' : fruit.fruit_name,
                    description: `${fruit.fruit_rarity} • ${damage}dmg ${cooldown}cd • ${ability?.name || 'Unknown'}`,
                    value: `fruit_${globalIndex}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}`,
                    emoji: emoji
                };
            });

            if (fruitOptions.length > 0) {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`fruit_selection_${battleData.id}_${player.userId}_menu${menuIndex}`)
                    .setPlaceholder(`Select fruits from this group (${startIndex + 1}-${endIndex})...`)
                    .setMinValues(0)
                    .setMaxValues(Math.min(5, fruitOptions.length))
                    .addOptions(fruitOptions);

                const row = new ActionRowBuilder().addComponents(selectMenu);
                components.push(row);
            }
        }

        // Add confirm button
        if (components.length > 0) {
            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirm_fruit_selection_${battleData.id}_${player.userId}`)
                        .setLabel('✅ Confirm Selection (Select exactly 5 fruits)')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true) // Will be enabled when 5 fruits selected
                );
            components.push(confirmRow);
        }

        // FIXED: Better interaction handling based on current state
        if (interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: components
            });
        } else if (interaction.replied) {
            // If already replied, we need to edit
            await interaction.editReply({
                embeds: [embed],
                components: components
            });
        } else {
            await interaction.reply({
                embeds: [embed],
                components: components
            });
        }

    } catch (error) {
        console.error('Error in showFruitSelectionForPlayer:', error);
        
        // Try to send an error message
        try {
            const errorMessage = {
                content: '❌ An error occurred while setting up fruit selection. Please try again.',
                embeds: [],
                components: []
            };

            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else if (!interaction.replied) {
                await interaction.reply({ ...errorMessage, ephemeral: true });
            } else {
                await interaction.followUp({ ...errorMessage, ephemeral: true });
            }
        } catch (sendError) {
            console.error('Failed to send error message:', sendError);
        }
    }
}

// FIXED: Handle fruit selection with better error handling
async handleFruitSelection(interaction, battleId, userId, menuIndex = 0) {
    try {
        const battleData = this.activeBattles.get(battleId);
        if (!battleData) {
            return await interaction.reply({ 
                content: '❌ Battle not found! It may have expired.', 
                ephemeral: true 
            });
        }

        const player = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        if (!player) {
            return await interaction.reply({ 
                content: '❌ Player not found in this battle!', 
                ephemeral: true 
            });
        }

        // Initialize player selection if not exists
        if (!player.tempSelectedFruits) {
            player.tempSelectedFruits = [];
        }

        // Get selected fruits from this menu
        const selectedValues = interaction.values || [];
        const selectedFruits = selectedValues.map(value => {
            const parts = value.split('_');
            const fruitIndex = parseInt(parts[1]);
            return player.fruits[fruitIndex];
        }).filter(fruit => fruit); // Remove any undefined fruits

        // Add to temporary selection (remove duplicates)
        selectedFruits.forEach(fruit => {
            const exists = player.tempSelectedFruits.find(f => f.fruit_name === fruit.fruit_name);
            if (!exists) {
                player.tempSelectedFruits.push(fruit);
            }
        });

        // Remove fruits that were deselected
        const selectedFruitNames = selectedFruits.map(f => f.fruit_name);
        player.tempSelectedFruits = player.tempSelectedFruits.filter(fruit => {
            const stillSelected = selectedFruitNames.includes(fruit.fruit_name) || 
                                 selectedValues.length === 0; // Keep all if nothing selected in this menu
            return stillSelected;
        });

        // Create updated embed showing current selection
        const embed = this.createSelectionProgressEmbed(battleData, player);
        
        // Update components to show current selection and enable/disable confirm
        const components = await this.createUpdatedSelectionComponents(battleData, player);

        await interaction.update({
            embeds: [embed],
            components: components
        });

    } catch (error) {
        console.error('Error updating fruit selection:', error);
        
        // Fallback error handling
        try {
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ An error occurred while updating your selection. Please try again.',
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: '❌ An error occurred while updating your selection. Please try again.',
                    ephemeral: true
                });
            }
        } catch (followUpError) {
            console.error('Failed to send fallback error message:', followUpError);
        }
    }
}

// FIXED: Handle confirm fruit selection with better error handling
async handleConfirmFruitSelection(interaction, battleId, userId) {
    try {
        const battleData = this.activeBattles.get(battleId);
        if (!battleData) {
            return await interaction.reply({ 
                content: '❌ Battle not found! It may have expired.', 
                ephemeral: true 
            });
        }

        const player = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        if (!player || !player.tempSelectedFruits || player.tempSelectedFruits.length !== 5) {
            return await interaction.reply({ 
                content: `❌ You must select exactly 5 fruits! Currently selected: ${player.tempSelectedFruits?.length || 0}`,
                ephemeral: true 
            });
        }

        // Confirm the selection
        player.selectedFruits = [...player.tempSelectedFruits];
        this.playerSelections.set(userId, player.selectedFruits);

        // Check if all players have selected
        const allSelected = battleData.isVsNPC || 
            (battleData.player1.selectedFruits && battleData.player2.selectedFruits);

        if (allSelected) {
            // Reveal boss if vs NPC and start battle
            if (battleData.isVsNPC) {
                await this.revealBossAndStartBattle(interaction, battleData);
            } else {
                await this.startTurnBasedBattle(interaction, battleData);
            }
        } else {
            await interaction.update({
                content: '✅ Fruits selected! Waiting for opponent...',
                embeds: [],
                components: []
            });
        }

    } catch (error) {
        console.error('Error confirming fruit selection:', error);
        
        try {
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ An error occurred while confirming your selection. Please try again.',
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: '❌ An error occurred while confirming your selection. Please try again.',
                    ephemeral: true
                });
            }
        } catch (followUpError) {
            console.error('Failed to send confirmation error message:', followUpError);
        }
    }
}

// FIXED: Start battle method with timeout handling
async startBattle(interaction, player1Fighter, player2Fighter = null) {
    const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        // If no player2, get balanced NPC boss
        let isVsNPC = false;
        let npcBoss = null;
        
        if (!player2Fighter) {
            npcBoss = NPCBossSystem.getBalancedBossForPlayer(player1Fighter.balancedCP);
            player2Fighter = await this.createNPCFighter(npcBoss);
            isVsNPC = true;
        }

        const battleData = {
            id: battleId,
            player1: player1Fighter,
            player2: player2Fighter,
            isVsNPC,
            npcBoss,
            currentTurn: 1,
            currentPlayer: Math.random() < 0.5 ? 'player1' : 'player2', // Random first turn
            battleLog: [],
            turnTimeout: null,
            created: Date.now(),
            status: 'fruit_selection'
        };

        this.activeBattles.set(battleId, battleData);

        // Start fruit selection phase with timeout protection
        await this.startFruitSelection(interaction, battleData);
        
        return battleId;

    } catch (error) {
        console.error('Error starting battle:', error);
        
        // Clean up on error
        if (this.activeBattles.has(battleId)) {
            this.activeBattles.delete(battleId);
        }
        
        throw error; // Re-throw to be handled by caller
    }
}

// FIXED: Add timeout protection to interaction handling
static async handleInteraction(interaction) {
    const customId = interaction.customId;
    const pvpSystem = module.exports;

    // Add timeout check
    const interactionAge = Date.now() - interaction.createdTimestamp;
    if (interactionAge > 2000) { // If interaction is older than 2 seconds
        console.warn(`⚠️ Interaction ${customId} is ${interactionAge}ms old, may timeout`);
    }

    try {
        // Handle fruit selection (multi-menu support)
        if (customId.startsWith('fruit_selection_')) {
            const parts = customId.split('_');
            const battleId = parts[2];
            const userId = parts[3];
            const menuIndex = parts[4] ? parseInt(parts[4].replace('menu', '')) : 0;
            
            await pvpSystem.handleFruitSelection(interaction, battleId, userId, menuIndex);
            return true;
        }

        // Handle confirm fruit selection
        if (customId.startsWith('confirm_fruit_selection_')) {
            const parts = customId.split('_');
            const battleId = parts[3];
            const userId = parts[4];
            
            await pvpSystem.handleConfirmFruitSelection(interaction, battleId, userId);
            return true;
        }

        // Handle clear fruit selection
        if (customId.startsWith('clear_fruit_selection_')) {
            const parts = customId.split('_');
            const battleId = parts[3];
            const userId = parts[4];
            
            await this.handleClearFruitSelection(interaction, battleId, userId, pvpSystem);
            return true;
        }

        // Other handlers...
        return false;

    } catch (error) {
        console.error('Error handling PvP interaction:', error);
        
        // Better error handling for expired interactions
        if (error.code === 10062) { // Unknown interaction
            console.warn('⚠️ Interaction expired or unknown, likely due to timeout');
            return true; // Don't try to respond to expired interactions
        }
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred during the battle interaction.',
                    ephemeral: true
                });
            }
        } catch (replyError) {
            console.error('Failed to send error reply:', replyError);
        }
        
        return true;
    }
}
