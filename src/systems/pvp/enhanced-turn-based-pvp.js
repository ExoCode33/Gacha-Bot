// src/systems/pvp/enhanced-turn-based-pvp.js - FIXED VERSION
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const DatabaseManager = require('../../database/manager'); // FIXED: Correct path
const PvPBalanceSystem = require('./balance-system'); // FIXED: Correct file name
const { getRarityEmoji, getRarityColor } = require('../../data/devil-fruits'); // FIXED: Correct path

// Import abilities safely
let balancedDevilFruitAbilities = {};
try {
    balancedDevilFruitAbilities = require('../../data/balanced-devil-fruit-abilities'); // FIXED: Correct path
} catch (error) {
    console.log('Balanced abilities not found, using fallback');
    balancedDevilFruitAbilities = {};
}

class EnhancedTurnBasedPvP {
    constructor() {
        this.activeBattles = new Map();
        this.battleTimeouts = new Map();
        this.BATTLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
        this.TURN_TIMEOUT = 60 * 1000; // 1 minute per turn
        
        // Start cleanup interval
        this.startCleanupInterval();
    }

    startCleanupInterval() {
        setInterval(() => {
            try {
                this.cleanupExpiredBattles();
            } catch (error) {
                console.error('Error in PvP cleanup:', error);
            }
        }, 60000); // Check every minute
    }

    cleanupExpiredBattles() {
        const now = Date.now();
        for (const [battleId, battle] of this.activeBattles.entries()) {
            if (battle.lastActivity && (now - battle.lastActivity) > this.BATTLE_TIMEOUT) {
                this.endBattle(battleId, 'timeout');
            }
        }
    }

    async initiateBattle(interaction, targetUser) {
        try {
            const challenger = interaction.user;
            const target = targetUser;

            // Validation checks
            if (challenger.id === target.id) {
                return await interaction.reply({ 
                    content: '❌ You cannot challenge yourself to a battle!', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            // Check if users are already in battles
            const existingBattle = this.findUserBattle(challenger.id) || this.findUserBattle(target.id);
            if (existingBattle) {
                return await interaction.reply({ 
                    content: '❌ One of the users is already in a battle!', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            // Get user data from database
            const challengerData = await DatabaseManager.getUser(challenger.id);
            const targetData = await DatabaseManager.getUser(target.id);

            if (!challengerData || !targetData) {
                return await interaction.reply({ 
                    content: '❌ Both players must be registered in the game!', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            // Check if users have devil fruits
            if (!challengerData.devil_fruit || !targetData.devil_fruit) {
                return await interaction.reply({ 
                    content: '❌ Both players must have devil fruits to battle!', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            // Create battle invitation
            const battleId = `${challenger.id}_${target.id}_${Date.now()}`;
            const embed = new EmbedBuilder()
                .setTitle('⚔️ PvP Battle Challenge!')
                .setDescription(`${challenger.username} has challenged ${target.username} to a battle!`)
                .addFields(
                    { 
                        name: `${challenger.username}'s Devil Fruit`, 
                        value: `${challengerData.devil_fruit} ${getRarityEmoji(challengerData.devil_fruit_rarity)}`, 
                        inline: true 
                    },
                    { 
                        name: `${target.username}'s Devil Fruit`, 
                        value: `${targetData.devil_fruit} ${getRarityEmoji(targetData.devil_fruit_rarity)}`, 
                        inline: true 
                    }
                )
                .setColor(getRarityColor(challengerData.devil_fruit_rarity))
                .setTimestamp();

            const acceptButton = new ButtonBuilder()
                .setCustomId(`accept_battle_${battleId}`)
                .setLabel('Accept Battle')
                .setStyle(ButtonStyle.Success)
                .setEmoji('⚔️');

            const declineButton = new ButtonBuilder()
                .setCustomId(`decline_battle_${battleId}`)
                .setLabel('Decline')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌');

            const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);

            // Store battle invitation
            this.activeBattles.set(battleId, {
                type: 'invitation',
                challenger: challengerData,
                target: targetData,
                channelId: interaction.channel.id,
                createdAt: Date.now(),
                lastActivity: Date.now()
            });

            // Set timeout for invitation
            this.battleTimeouts.set(battleId, setTimeout(() => {
                this.endBattle(battleId, 'invitation_timeout');
            }, 60000)); // 1 minute to accept

            await interaction.reply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Error initiating battle:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while initiating the battle.', 
                flags: MessageFlags.Ephemeral 
            });
        }
    }

    async handleBattleResponse(interaction) {
        try {
            const [action, , battleId] = interaction.customId.split('_');
            const battle = this.activeBattles.get(battleId);

            if (!battle || battle.type !== 'invitation') {
                return await interaction.reply({ 
                    content: '❌ This battle invitation has expired.', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            // Only the target can respond
            if (interaction.user.id !== battle.target.user_id) {
                return await interaction.reply({ 
                    content: '❌ Only the challenged player can respond to this invitation.', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            if (action === 'decline') {
                await this.endBattle(battleId, 'declined');
                return await interaction.update({ 
                    content: `❌ ${battle.target.username} declined the battle challenge.`, 
                    embeds: [], 
                    components: [] 
                });
            }

            if (action === 'accept') {
                await this.startBattle(interaction, battleId);
            }

        } catch (error) {
            console.error('Error handling battle response:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while processing the battle response.', 
                flags: MessageFlags.Ephemeral 
            });
        }
    }

    async startBattle(interaction, battleId) {
        try {
            const battle = this.activeBattles.get(battleId);
            
            // Initialize battle state
            const fighter1 = {
                ...battle.challenger,
                hp: 100,
                maxHp: 100,
                energy: 100,
                maxEnergy: 100
            };

            const fighter2 = {
                ...battle.target,
                hp: 100,
                maxHp: 100,
                energy: 100,
                maxEnergy: 100
            };

            // Determine turn order (random)
            const turnOrder = Math.random() < 0.5 ? [fighter1, fighter2] : [fighter2, fighter1];

            // Update battle state
            this.activeBattles.set(battleId, {
                type: 'active',
                fighter1,
                fighter2,
                currentTurn: 0,
                turnOrder,
                currentPlayer: turnOrder[0],
                battleLog: [],
                channelId: battle.channelId,
                createdAt: Date.now(),
                lastActivity: Date.now()
            });

            // Clear invitation timeout
            if (this.battleTimeouts.has(battleId)) {
                clearTimeout(this.battleTimeouts.get(battleId));
                this.battleTimeouts.delete(battleId);
            }

            await this.displayBattleState(interaction, battleId, 'Battle Started!');

        } catch (error) {
            console.error('Error starting battle:', error);
            await interaction.update({ 
                content: '❌ An error occurred while starting the battle.', 
                embeds: [], 
                components: [] 
            });
        }
    }

    async displayBattleState(interaction, battleId, message = '') {
        try {
            const battle = this.activeBattles.get(battleId);
            if (!battle || battle.type !== 'active') return;

            const { fighter1, fighter2, currentPlayer, currentTurn, battleLog } = battle;

            // Create battle embed
            const embed = new EmbedBuilder()
                .setTitle('⚔️ PvP Battle in Progress')
                .setDescription(message || `Turn ${currentTurn + 1} - ${currentPlayer.username}'s turn`)
                .addFields(
                    {
                        name: `${fighter1.username} ${fighter1.user_id === currentPlayer.user_id ? '👈' : ''}`,
                        value: `❤️ HP: ${fighter1.hp}/${fighter1.maxHp}\n⚡ Energy: ${fighter1.energy}/${fighter1.maxEnergy}\n🍃 ${fighter1.devil_fruit}`,
                        inline: true
                    },
                    {
                        name: 'VS',
                        value: '⚔️',
                        inline: true
                    },
                    {
                        name: `${fighter2.username} ${fighter2.user_id === currentPlayer.user_id ? '👈' : ''}`,
                        value: `❤️ HP: ${fighter2.hp}/${fighter2.maxHp}\n⚡ Energy: ${fighter2.energy}/${fighter2.maxEnergy}\n🍃 ${fighter2.devil_fruit}`,
                        inline: true
                    }
                )
                .setColor(0x00ff00)
                .setTimestamp();

            // Add recent battle log
            if (battleLog.length > 0) {
                const recentLog = battleLog.slice(-3).map(entry => entry.message).join('\n');
                embed.addFields({ name: 'Recent Actions', value: recentLog || 'Battle just started!', inline: false });
            }

            // Create action buttons (only for current player)
            const components = [];
            if (currentPlayer) {
                const attackButton = new ButtonBuilder()
                    .setCustomId(`battle_attack_${battleId}`)
                    .setLabel('Attack')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚔️');

                const defendButton = new ButtonBuilder()
                    .setCustomId(`battle_defend_${battleId}`)
                    .setLabel('Defend')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🛡️');

                const specialButton = new ButtonBuilder()
                    .setCustomId(`battle_special_${battleId}`)
                    .setLabel('Special Ability')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('💫');

                const forfeitButton = new ButtonBuilder()
                    .setCustomId(`battle_forfeit_${battleId}`)
                    .setLabel('Forfeit')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🏳️');

                const row = new ActionRowBuilder().addComponents(attackButton, defendButton, specialButton, forfeitButton);
                components.push(row);
            }

            // Update or reply based on interaction type
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed], components });
            } else {
                await interaction.update({ embeds: [embed], components });
            }

            // Set turn timeout
            this.setTurnTimeout(battleId);

        } catch (error) {
            console.error('Error displaying battle state:', error);
        }
    }

    async handleBattleAction(interaction) {
        try {
            const [, action, battleId] = interaction.customId.split('_');
            const battle = this.activeBattles.get(battleId);

            if (!battle || battle.type !== 'active') {
                return await interaction.reply({ 
                    content: '❌ This battle is no longer active.', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            // Check if it's the player's turn
            if (interaction.user.id !== battle.currentPlayer.user_id) {
                return await interaction.reply({ 
                    content: '❌ It\'s not your turn!', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            // Process the action
            await this.processBattleAction(interaction, battleId, action);

        } catch (error) {
            console.error('Error handling battle action:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while processing your action.', 
                flags: MessageFlags.Ephemeral 
            });
        }
    }

    async processBattleAction(interaction, battleId, action) {
        try {
            const battle = this.activeBattles.get(battleId);
            const { fighter1, fighter2, currentPlayer, turnOrder } = battle;

            const attacker = currentPlayer;
            const defender = attacker.user_id === fighter1.user_id ? fighter2 : fighter1;

            let actionResult = '';
            let damage = 0;
            let energyCost = 0;

            switch (action) {
                case 'attack':
                    damage = Math.floor(Math.random() * 25) + 15; // 15-40 damage
                    energyCost = 20;
                    actionResult = `${attacker.username} attacks ${defender.username} for ${damage} damage!`;
                    break;

                case 'defend':
                    // Defending reduces incoming damage next turn and restores energy
                    attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + 30);
                    attacker.defending = true;
                    actionResult = `${attacker.username} takes a defensive stance and recovers 30 energy!`;
                    break;

                case 'special':
                    if (attacker.energy < 50) {
                        return await interaction.reply({ 
                            content: '❌ Not enough energy for special ability! (50 required)', 
                            flags: MessageFlags.Ephemeral 
                        });
                    }
                    damage = Math.floor(Math.random() * 35) + 25; // 25-60 damage
                    energyCost = 50;
                    actionResult = `${attacker.username} uses their Devil Fruit power on ${defender.username} for ${damage} damage!`;
                    break;

                case 'forfeit':
                    await this.endBattle(battleId, 'forfeit', defender);
                    return await interaction.update({ 
                        content: `🏳️ ${attacker.username} forfeited the battle! ${defender.username} wins!`, 
                        embeds: [], 
                        components: [] 
                    });
            }

            // Apply energy cost
            if (energyCost > 0) {
                if (attacker.energy < energyCost) {
                    return await interaction.reply({ 
                        content: `❌ Not enough energy! (${energyCost} required)`, 
                        flags: MessageFlags.Ephemeral 
                    });
                }
                attacker.energy -= energyCost;
            }

            // Apply damage (reduced if defender was defending)
            if (damage > 0) {
                if (defender.defending) {
                    damage = Math.floor(damage * 0.5);
                    actionResult += ` (Reduced by defense!)`;
                    defender.defending = false;
                }
                defender.hp = Math.max(0, defender.hp - damage);
            }

            // Add to battle log
            battle.battleLog.push({
                turn: battle.currentTurn,
                player: attacker.username,
                action,
                message: actionResult,
                timestamp: Date.now()
            });

            // Check for battle end
            if (defender.hp <= 0) {
                await this.endBattle(battleId, 'victory', attacker);
                const embed = new EmbedBuilder()
                    .setTitle('🏆 Battle Finished!')
                    .setDescription(`${attacker.username} wins the battle!`)
                    .addFields(
                        { name: 'Winner', value: attacker.username, inline: true },
                        { name: 'Final Action', value: actionResult, inline: false }
                    )
                    .setColor(0xffd700)
                    .setTimestamp();

                return await interaction.update({ embeds: [embed], components: [] });
            }

            // Switch turns
            const currentIndex = turnOrder.findIndex(f => f.user_id === currentPlayer.user_id);
            const nextIndex = (currentIndex + 1) % 2;
            battle.currentPlayer = turnOrder[nextIndex];
            battle.currentTurn++;
            battle.lastActivity = Date.now();

            // Energy regeneration
            turnOrder.forEach(fighter => {
                fighter.energy = Math.min(fighter.maxEnergy, fighter.energy + 10);
            });

            // Update battle display
            await this.displayBattleState(interaction, battleId, actionResult);

        } catch (error) {
            console.error('Error processing battle action:', error);
            throw error;
        }
    }

    setTurnTimeout(battleId) {
        // Clear existing timeout
        if (this.battleTimeouts.has(battleId)) {
            clearTimeout(this.battleTimeouts.get(battleId));
        }

        // Set new timeout
        const timeout = setTimeout(() => {
            const battle = this.activeBattles.get(battleId);
            if (battle && battle.type === 'active') {
                // Auto-forfeit for inactive player
                const { currentPlayer, fighter1, fighter2 } = battle;
                const winner = currentPlayer.user_id === fighter1.user_id ? fighter2 : fighter1;
                this.endBattle(battleId, 'timeout', winner);
            }
        }, this.TURN_TIMEOUT);

        this.battleTimeouts.set(battleId, timeout);
    }

    async endBattle(battleId, reason, winner = null) {
        try {
            const battle = this.activeBattles.get(battleId);
            if (!battle) return;

            // Clear timeout
            if (this.battleTimeouts.has(battleId)) {
                clearTimeout(this.battleTimeouts.get(battleId));
                this.battleTimeouts.delete(battleId);
            }

            // Update stats if battle was completed
            if (winner && battle.type === 'active') {
                const loser = battle.fighter1.user_id === winner.user_id ? battle.fighter2 : battle.fighter1;
                
                // Update winner stats
                await DatabaseManager.updateUserStats(winner.user_id, {
                    pvp_wins: (winner.pvp_wins || 0) + 1,
                    total_battles: (winner.total_battles || 0) + 1
                });

                // Update loser stats
                await DatabaseManager.updateUserStats(loser.user_id, {
                    pvp_losses: (loser.pvp_losses || 0) + 1,
                    total_battles: (loser.total_battles || 0) + 1
                });
            }

            // Remove battle from active battles
            this.activeBattles.delete(battleId);

        } catch (error) {
            console.error('Error ending battle:', error);
        }
    }

    findUserBattle(userId) {
        for (const [battleId, battle] of this.activeBattles.entries()) {
            if (battle.challenger?.user_id === userId || 
                battle.target?.user_id === userId ||
                battle.fighter1?.user_id === userId || 
                battle.fighter2?.user_id === userId) {
                return battleId;
            }
        }
        return null;
    }

    getBattleStats() {
        return {
            activeBattles: this.activeBattles.size,
            battles: Array.from(this.activeBattles.entries()).map(([id, battle]) => ({
                id,
                type: battle.type,
                players: battle.type === 'invitation' 
                    ? [battle.challenger.username, battle.target.username]
                    : [battle.fighter1.username, battle.fighter2.username],
                turn: battle.currentTurn || 0
            }))
        };
    }
}

module.exports = EnhancedTurnBasedPvP;
