// src/systems/enhanced-pvp-interactions.js - Interaction Handler for Enhanced PvP
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const NPCBossSystem = require('./npc-bosses');
const { getRarityEmoji, getFruitByName } = require('../data/devil-fruits');

class EnhancedPvPInteractions {
    constructor() {
        this.activeBattles = new Map();
        this.tempSelections = new Map();
    }

    // Handle fruit selection button click
    async handleFruitSelection(interaction, battleId) {
        const userId = interaction.user.id;
        
        // Get battle data from the enhanced-pvp command
        const enhancedPvPCommand = require('../commands/enhanced-pvp');
        const battleData = enhancedPvPCommand.activeBattles.get(battleId);
        
        if (!battleData) {
            return interaction.reply({
                content: '❌ Battle not found or has expired.',
                ephemeral: true
            });
        }

        // Check if user is part of this battle
        const isPlayer1 = battleData.type === 'pve' 
            ? battleData.player.userId === userId
            : battleData.player1.userId === userId;
        const isPlayer2 = battleData.type === 'pvp' && battleData.player2.userId === userId;

        if (!isPlayer1 && !isPlayer2) {
            return interaction.reply({
                content: '❌ You are not part of this battle.',
                ephemeral: true
            });
        }

        const playerData = isPlayer1 
            ? (battleData.type === 'pve' ? battleData.player : battleData.player1)
            : battleData.player2;
        
        if (playerData.selectedFruits.length > 0) {
            return interaction.reply({
                content: '❌ You have already selected your fruits.',
                ephemeral: true
            });
        }

        // Create fruit selection menu
        await this.createFruitSelectionMenu(interaction, battleData, playerData);
    }

    // Create fruit selection dropdown menu
    async createFruitSelectionMenu(interaction, battleData, playerData) {
        const userFruits = playerData.fruits;
        
        if (userFruits.length < 5) {
            return interaction.reply({
                content: '❌ You need at least 5 Devil Fruits to participate in battle.',
                ephemeral: true
            });
        }

        // Create chunks of 20 fruits for multiple select menus (Discord limit)
        const fruitChunks = [];
        for (let i = 0; i < userFruits.length; i += 20) {
            fruitChunks.push(userFruits.slice(i, i + 20));
        }

        const embed = new EmbedBuilder()
            .setColor(0x9932CC)
            .setTitle('🍈 Select Your 5 Devil Fruits')
            .setDescription(`Choose 5 fruits from your collection for battle!\n\n**Your Available Fruits:** ${userFruits.length}`)
            .addFields([
                {
                    name: '📝 Instructions',
                    value: [
                        '1. Use the dropdown(s) below to select fruits',
                        '2. You need to select exactly 5 fruits',
                        '3. Click "Confirm Selection" when ready',
                        '4. Bot will randomly ban 2 of your fruits'
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: `Selected: 0/5 • Battle ID: ${battleData.battleId}` });

        // Create select menus for each chunk
        const components = [];
        fruitChunks.forEach((chunk, index) => {
            const options = chunk.map(fruit => {
                const fruitData = getFruitByName(fruit.fruit_name);
                const emoji = getRarityEmoji(fruit.fruit_rarity);
                
                return {
                    label: fruit.fruit_name.substring(0, 100), // Discord limit
                    value: fruit.fruit_name,
                    description: `${fruit.fruit_rarity.charAt(0).toUpperCase() + fruit.fruit_rarity.slice(1)} • ${(fruit.base_cp / 100).toFixed(1)}x CP`,
                    emoji: emoji
                };
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`enhanced_fruit_menu_${battleData.battleId}_${playerData.userId}_${index}`)
                .setPlaceholder(`Select fruits (Menu ${index + 1}/${fruitChunks.length})`)
                .setMinValues(0)
                .setMaxValues(Math.min(5, options.length))
                .addOptions(options);

            components.push(new ActionRowBuilder().addComponents(selectMenu));
        });

        // Add confirm button
        const confirmButton = new ButtonBuilder()
            .setCustomId(`enhanced_confirm_fruits_${battleData.battleId}_${playerData.userId}`)
            .setLabel('Confirm Selection (0/5)')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true);

        const cancelButton = new ButtonBuilder()
            .setCustomId(`enhanced_cancel_battle_${battleData.battleId}_${playerData.userId}`)
            .setLabel('Cancel Battle')
            .setStyle(ButtonStyle.Danger);

        components.push(new ActionRowBuilder().addComponents(confirmButton, cancelButton));

        // Store temporary selection
        const selectionKey = `${battleData.battleId}_${playerData.userId}`;
        this.tempSelections.set(selectionKey, []);

        await interaction.reply({
            embeds: [embed],
            components: components,
            ephemeral: true
        });
    }

    // Handle fruit menu selection
    async handleFruitMenuSelection(interaction, battleId, userId, menuIndex) {
        const enhancedPvPCommand = require('../commands/enhanced-pvp');
        const battleData = enhancedPvPCommand.activeBattles.get(battleId);
        
        if (!battleData) {
            return interaction.reply({
                content: '❌ Battle not found.',
                ephemeral: true
            });
        }

        const selectionKey = `${battleId}_${userId}`;
        if (!this.tempSelections.has(selectionKey)) {
            this.tempSelections.set(selectionKey, []);
        }

        const selectedFruits = interaction.values;
        
        // Update temporary selection for this menu
        let currentSelection = this.tempSelections.get(selectionKey);
        
        // Remove any previously selected fruits from this menu
        const menuOptions = interaction.component.options.map(o => o.value);
        currentSelection = currentSelection.filter(f => !menuOptions.includes(f));
        
        // Add new selections
        currentSelection.push(...selectedFruits);
        
        // Limit to 5 fruits maximum
        if (currentSelection.length > 5) {
            currentSelection = currentSelection.slice(0, 5);
        }
        
        this.tempSelections.set(selectionKey, currentSelection);

        // Update the embed and buttons
        await this.updateSelectionMessage(interaction, battleData, userId);
    }

    // Update selection message with current progress
    async updateSelectionMessage(interaction, battleData, userId) {
        const selectionKey = `${battleData.battleId}_${userId}`;
        const selectedFruits = this.tempSelections.get(selectionKey) || [];
        const selectedCount = selectedFruits.length;

        const embed = new EmbedBuilder()
            .setColor(selectedCount === 5 ? 0x00FF00 : 0x9932CC)
            .setTitle('🍈 Select Your 5 Devil Fruits')
            .setDescription(`Choose 5 fruits from your collection for battle!\n\n**Selected Fruits (${selectedCount}/5):**\n${selectedFruits.map(f => `• ${f}`).join('\n') || 'None selected'}`)
            .setFooter({ text: `Selected: ${selectedCount}/5 • Battle ID: ${battleData.battleId}` });

        // Update confirm button
        const components = interaction.message.components.map(row => {
            const newRow = new ActionRowBuilder();
            
            row.components.forEach(component => {
                if (component.customId && component.customId.includes('enhanced_confirm_fruits')) {
                    const confirmButton = new ButtonBuilder()
                        .setCustomId(component.customId)
                        .setLabel(`Confirm Selection (${selectedCount}/5)`)
                        .setStyle(selectedCount === 5 ? ButtonStyle.Success : ButtonStyle.Secondary)
                        .setDisabled(selectedCount !== 5);
                    newRow.addComponents(confirmButton);
                } else if (component.customId && component.customId.includes('enhanced_cancel_battle')) {
                    newRow.addComponents(ButtonBuilder.from(component));
                } else {
                    // Keep select menus as they are
                    return row;
                }
            });
            
            return newRow.components.length > 0 ? newRow : row;
        });

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    // Confirm fruit selection
    async handleConfirmSelection(interaction, battleId, userId) {
        const enhancedPvPCommand = require('../commands/enhanced-pvp');
        const battleData = enhancedPvPCommand.activeBattles.get(battleId);
        
        if (!battleData) {
            return interaction.reply({
                content: '❌ Battle not found.',
                ephemeral: true
            });
        }

        const selectionKey = `${battleId}_${userId}`;
        const selectedFruits = this.tempSelections.get(selectionKey);
        
        if (!selectedFruits || selectedFruits.length !== 5) {
            return interaction.reply({
                content: '❌ You must select exactly 5 Devil Fruits.',
                ephemeral: true
            });
        }

        // Save selection to battle data
        const isPlayer1 = battleData.type === 'pve' 
            ? battleData.player.userId === userId
            : battleData.player1.userId === userId;
        
        if (isPlayer1) {
            const player = battleData.type === 'pve' ? battleData.player : battleData.player1;
            player.selectedFruits = selectedFruits;
        } else {
            battleData.player2.selectedFruits = selectedFruits;
        }

        await interaction.update({
            content: '✅ Fruits selected successfully! Waiting for battle to begin...',
            embeds: [],
            components: []
        });

        // Clean up temporary selection
        this.tempSelections.delete(selectionKey);

        // Check if all players have selected
        const allSelected = battleData.type === 'pve' 
            ? battleData.player.selectedFruits.length === 5
            : battleData.player1.selectedFruits.length === 5 && battleData.player2.selectedFruits.length === 5;

        if (allSelected) {
            await this.startBanPhase(battleData, interaction);
        }
    }

    // Start the ban phase
    async startBanPhase(battleData, interaction) {
        console.log('🚫 Starting ban phase for battle:', battleData.battleId);

        // Random bans for each side
        const player1 = battleData.type === 'pve' ? battleData.player : battleData.player1;
        const opponent = battleData.type === 'pve' ? battleData.npc : battleData.player2;

        player1.bannedFruits = this.randomBan(player1.selectedFruits, 2);
        player1.battleFruits = player1.selectedFruits.filter(f => 
            !player1.bannedFruits.includes(f));

        opponent.bannedFruits = this.randomBan(opponent.selectedFruits, 2);
        opponent.battleFruits = opponent.selectedFruits.filter(f => 
            !opponent.bannedFruits.includes(f));

        // Show ban results and start battle
        await this.showBanResults(battleData, interaction);
    }

    // Random ban fruits
    randomBan(fruits, banCount) {
        const shuffled = [...fruits];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, banCount);
    }

    // Show ban results and start battle
    async showBanResults(battleData, interaction) {
        const player1 = battleData.type === 'pve' ? battleData.player : battleData.player1;
        const opponent = battleData.type === 'pve' ? battleData.npc : battleData.player2;
        
        const embed = new EmbedBuilder()
            .setColor(0xFF4500)
            .setTitle('🚫 Ban Phase Complete!')
            .setDescription('The bot has randomly banned 2 fruits from each side')
            .addFields([
                {
                    name: `🔴 ${player1.username}'s Banned Fruits`,
                    value: player1.bannedFruits.map(f => `• ${f}`).join('\n'),
                    inline: true
                },
                {
                    name: `🔴 ${opponent.username || opponent.name}'s Banned Fruits`,
                    value: opponent.bannedFruits.map(f => `• ${f}`).join('\n'),
                    inline: true
                },
                {
                    name: '⚔️ Battle Lineup (3v3)',
                    value: `**${player1.username}**: ${player1.battleFruits.join(', ')}\n**${opponent.username || opponent.name}**: ${opponent.battleFruits.join(', ')}`,
                    inline: false
                }
            ])
            .setFooter({ text: 'Battle starting in 3 seconds...' });

        // Update the message or send new one
        try {
            await interaction.editReply({
                content: '🚫 Ban phase complete!',
                embeds: [embed],
                components: []
            });
        } catch {
            // If edit fails, send follow up
            await interaction.followUp({
                content: '🚫 Ban phase complete!',
                embeds: [embed]
            });
        }

        // Wait 3 seconds then start battle
        setTimeout(async () => {
            await this.startBattle(battleData, interaction);
        }, 3000);
    }

    // Start the actual 3v3 battle
    async startBattle(battleData, interaction) {
        console.log('⚔️ Starting 3v3 battle:', battleData.battleId);
        
        const player1 = battleData.type === 'pve' ? battleData.player : battleData.player1;
        const opponent = battleData.type === 'pve' ? battleData.npc : battleData.player2;
        
        // Dice roll for first turn
        const diceRoll = Math.random() < 0.5;
        const firstPlayer = diceRoll ? player1 : opponent;
        const secondPlayer = firstPlayer === player1 ? opponent : player1;

        // Initialize battle state
        battleData.phase = 'battle';
        battleData.turn = 1;
        battleData.currentPlayer = firstPlayer;
        battleData.battleLog = [];

        // Add dice roll to log
        battleData.battleLog.push({
            type: 'dice_roll',
            message: `🎲 ${firstPlayer.username || firstPlayer.name} wins the dice roll and goes first!`,
            turn: 0
        });

        // Send battle start message
        const embed = this.createBattleEmbed(battleData);
        const components = this.createBattleComponents(battleData);

        const content = `⚔️ **3v3 BATTLE START!** ${battleData.currentPlayer.username || battleData.currentPlayer.name}, choose your fruit!`;

        try {
            await interaction.editReply({
                content,
                embeds: [embed],
                components: components
            });
        } catch {
            await interaction.followUp({
                content,
                embeds: [embed],
                components: components
            });
        }

        // Handle NPC turn if NPC goes first
        if (battleData.currentPlayer.isNPC) {
            setTimeout(async () => {
                await this.handleNPCTurn(battleData, interaction);
            }, 2000);
        }

        // Set battle timeout (10 minutes)
        setTimeout(() => {
            if (require('../commands/enhanced-pvp').activeBattles.has(battleData.battleId)) {
                this.timeoutBattle(battleData.battleId, 'Battle timeout');
            }
        }, 600000);
    }

    // Create battle embed
    createBattleEmbed(battleData) {
        const player1 = battleData.type === 'pve' ? battleData.player : battleData.player1;
        const opponent = battleData.type === 'pve' ? battleData.npc : battleData.player2;
        
        const embed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('⚔️ 3v3 Devil Fruit Battle Arena')
            .setDescription(`**Turn ${battleData.turn}** - ${battleData.currentPlayer.username || battleData.currentPlayer.name}'s turn`)
            .addFields([
                {
                    name: `🔥 ${player1.username} (HP: ${player1.hp})`,
                    value: `**Fruits Remaining**: ${player1.battleFruits.length}/3\n${player1.battleFruits.map(f => `• ${f}`).join('\n') || '• No fruits left'}`,
                    inline: true
                },
                {
                    name: `🔥 ${opponent.username || opponent.name} (HP: ${opponent.hp})`,
                    value: `**Fruits Remaining**: ${opponent.battleFruits.length}/3\n${opponent.battleFruits.map(f => `• ${f}`).join('\n') || '• No fruits left'}`,
                    inline: true
                }
            ]);

        // Add recent battle log
        if (battleData.battleLog && battleData.battleLog.length > 0) {
            const recentLog = battleData.battleLog
                .slice(-3)
                .map(log => log.message)
                .join('\n');
            
            embed.addFields([
                {
                    name: '📜 Battle Log',
                    value: recentLog,
                    inline: false
                }
            ]);
        }

        embed.setFooter({ text: `Battle ID: ${battleData.battleId} • Turn ${battleData.turn}` })
             .setTimestamp();

        return embed;
    }

    // Create battle action components
    createBattleComponents(battleData) {
        if (battleData.currentPlayer.isNPC) {
            return []; // No components for NPC turns
        }

        const currentPlayer = battleData.currentPlayer;
        const availableFruits = currentPlayer.battleFruits;

        if (availableFruits.length === 0) {
            return []; // No fruits left
        }

        // Create fruit selection dropdown
        const options = availableFruits.map(fruitName => {
            const fruit = getFruitByName(fruitName);
            const emoji = getRarityEmoji(fruit?.rarity || 'common');
            
            return {
                label: fruitName.substring(0, 100),
                value: fruitName,
                description: `Use this Devil Fruit to attack`,
                emoji: emoji
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`enhanced_battle_fruit_${battleData.battleId}_${currentPlayer.userId}`)
            .setPlaceholder('Choose your Devil Fruit for this turn')
            .addOptions(options);

        return [new ActionRowBuilder().addComponents(selectMenu)];
    }

    // Handle NPC turn (simplified for now)
    async handleNPCTurn(battleData, interaction) {
        const npc = battleData.currentPlayer;
        
        if (npc.battleFruits.length === 0) {
            await this.endBattle(battleData, interaction);
            return;
        }

        // NPC AI selects fruit (simple random for now)
        const selectedFruit = npc.battleFruits[Math.floor(Math.random() * npc.battleFruits.length)];
        
        // Simulate NPC turn
        setTimeout(async () => {
            await this.executeBattleTurn(battleData, selectedFruit, interaction);
        }, 1000);
    }

    // Execute a battle turn
    async executeBattleTurn(battleData, selectedFruit, interaction) {
        const attacker = battleData.currentPlayer;
        const defender = attacker === (battleData.type === 'pve' ? battleData.player : battleData.player1) 
            ? (battleData.type === 'pve' ? battleData.npc : battleData.player2)
            : (battleData.type === 'pve' ? battleData.player : battleData.player1);
        
        // Simple damage calculation
        const baseDamage = 80 + Math.floor(Math.random() * 40); // 80-120 damage
        const actualDamage = Math.min(baseDamage, defender.hp);
        
        // Apply damage
        defender.hp = Math.max(0, defender.hp - actualDamage);
        
        // Remove used fruit
        attacker.battleFruits = attacker.battleFruits.filter(f => f !== selectedFruit);
        
        // Add to battle log
        battleData.battleLog.push({
            type: 'attack',
            attacker: attacker.username || attacker.name,
            defender: defender.username || defender.name,
            fruit: selectedFruit,
            damage: actualDamage,
            turn: battleData.turn,
            message: `${attacker.username || attacker.name} used ${selectedFruit} and dealt ${actualDamage} damage!`
        });

        // Check for battle end conditions
        const battleEnded = this.checkBattleEnd(battleData);
        
        if (battleEnded) {
            await this.endBattle(battleData, interaction);
            return;
        }

        // Switch turns
        battleData.currentPlayer = defender;
        battleData.turn++;

        // Update battle display
        const embed = this.createBattleEmbed(battleData);
        const components = this.createBattleComponents(battleData);

        const content = `⚔️ ${battleData.currentPlayer.username || battleData.currentPlayer.name}, choose your fruit!`;

        await interaction.editReply({
            content,
            embeds: [embed],
            components: components
        });

        // Handle NPC turn if current player is NPC
        if (battleData.currentPlayer.isNPC) {
            setTimeout(async () => {
                await this.handleNPCTurn(battleData, interaction);
            }, 2000);
        }
    }

    // Check if battle should end
    checkBattleEnd(battleData) {
        const player1 = battleData.type === 'pve' ? battleData.player : battleData.player1;
        const opponent = battleData.type === 'pve' ? battleData.npc : battleData.player2;
        
        // Check HP
        if (player1.hp <= 0 || opponent.hp <= 0) {
            return true;
        }
        
        // Check if no fruits left
        if (player1.battleFruits.length === 0 || opponent.battleFruits.length === 0) {
            return true;
        }
        
        // Check turn limit (15 turns max)
        if (battleData.turn > 15) {
            return true;
        }
        
        return false;
    }

    // End the battle
    async endBattle(battleData, interaction) {
        console.log('🏁 Ending 3v3 battle:', battleData.battleId);
        
        const player1 = battleData.type === 'pve' ? battleData.player : battleData.player1;
        const opponent = battleData.type === 'pve' ? battleData.npc : battleData.player2;
        
        // Determine winner
        let winner, loser;
        if (player1.hp <= 0) {
            winner = opponent;
            loser = player1;
        } else if (opponent.hp <= 0) {
            winner = player1;
            loser = opponent;
        } else if (player1.battleFruits.length === 0) {
            winner = opponent;
            loser = player1;
        } else if (opponent.battleFruits.length === 0) {
            winner = player1;
            loser = opponent;
        } else {
            // Timeout - winner by HP
            winner = player1.hp > opponent.hp ? player1 : opponent;
            loser = winner === player1 ? opponent : player1;
        }

        // Create victory embed
        const embed = this.createVictoryEmbed(battleData, winner, loser);
        
        // Award rewards for PvE victories
        if (battleData.type === 'pve' && winner && !winner.isNPC) {
            await this.awardVictoryRewards(winner, opponent);
        }

        // Update battle message
        const content = `🏆 **${winner.username || winner.name} WINS the 3v3 battle!**`;

        await interaction.editReply({
            content,
            embeds: [embed],
            components: []
        });

        // Clean up battle data
        const enhancedPvPCommand = require('../commands/enhanced-pvp');
        enhancedPvPCommand.activeBattles.delete(battleData.battleId);
        
        // Set cooldown
        const cooldownTime = Date.now();
        if (player1.userId) {
            enhancedPvPCommand.battleCooldowns.set(player1.userId, cooldownTime);
        }
        if (battleData.type === 'pvp' && opponent.userId) {
            enhancedPvPCommand.battleCooldowns.set(opponent.userId, cooldownTime);
        }
    }

    // Create victory embed
    createVictoryEmbed(battleData, winner, loser) {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🏆 3v3 BATTLE VICTORY!')
            .setDescription(`${winner.username || winner.name} emerges victorious!`)
            .addFields([
                {
                    name: '📊 Final Stats',
                    value: [
                        `**Winner**: ${winner.username || winner.name} (${winner.hp} HP, ${winner.battleFruits.length} fruits left)`,
                        `**Loser**: ${loser.username || loser.name} (${loser.hp} HP, ${loser.battleFruits.length} fruits left)`,
                        `**Total Turns**: ${battleData.turn - 1}`,
                        `**Battle Type**: ${battleData.type === 'pve' ? 'PvE vs ' + loser.title : 'PvP'}`
                    ].join('\n'),
                    inline: false
                }
            ]);

        // Add battle summary
        if (battleData.battleLog && battleData.battleLog.length > 0) {
            const summary = battleData.battleLog
                .filter(log => log.type === 'attack')
                .slice(-3)
                .map(log => `${log.message}`)
                .join('\n');
            
            embed.addFields([
                {
                    name: '📜 Battle Summary',
                    value: summary || 'No attacks recorded',
                    inline: false
                }
            ]);
        }

        // Add rewards info for PvE
        if (battleData.type === 'pve' && winner && !winner.isNPC) {
            const berryReward = this.calculateBerryReward(loser.difficulty);
            embed.addFields([
                {
                    name: '🎁 Victory Rewards',
                    value: `• ${berryReward.toLocaleString()} berries earned!`,
                    inline: true
                }
            ]);
        }

        embed.setFooter({ text: `Battle ID: ${battleData.battleId}` })
             .setTimestamp();

        return embed;
    }

    // Award victory rewards for PvE
    async awardVictoryRewards(winner, npcBoss) {
        try {
            const berryReward = this.calculateBerryReward(npcBoss.difficulty);
            
            // Award berries
            await DatabaseManager.updateUserBerries(winner.userId, berryReward, `PvE Victory vs ${npcBoss.name}`);
            
            console.log(`🎁 ${winner.username} earned ${berryReward} berries for defeating ${npcBoss.name}`);
