// src/systems/pvp/battle-manager.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../../database/manager');

class BattleManager {
    constructor() {
        this.activeBattles = new Map(); // battleId -> battle data
        this.playerBattles = new Map(); // userId -> battleId
    }

    /**
     * Start a new PvP battle from queue
     */
    async startBattleFromQueue(player1Id, player2Id, interaction) {
        const battleId = `${player1Id}_${player2Id}_${Date.now()}`;
        
        try {
            // Get player data
            const player1Data = await this.getPlayerBattleData(player1Id);
            const player2Data = await this.getPlayerBattleData(player2Id);
            
            if (!player1Data || !player2Data) {
                throw new Error('Could not load player data');
            }

            // Create battle data
            const battle = {
                id: battleId,
                player1: player1Data,
                player2: player2Data,
                currentTurn: player1Id,
                turnCount: 0,
                maxTurns: 20,
                startTime: Date.now(),
                status: 'active',
                lastActivity: Date.now()
            };

            // Store battle
            this.activeBattles.set(battleId, battle);
            this.playerBattles.set(player1Id, battleId);
            this.playerBattles.set(player2Id, battleId);

            // Create battle embed
            const embed = await this.createBattleEmbed(battle);
            const actionRow = this.createBattleButtons(battleId, player1Id);

            // Send battle as a follow-up message
            await interaction.followUp({
                embeds: [embed],
                components: [actionRow]
            });

            // Set battle timeout
            this.setBattleTimeout(battleId);

            return battleId;
        } catch (error) {
            console.error('Error starting battle from queue:', error);
            throw error;
        }
    }

    /**
     * Start a new PvP battle (for direct challenges)
     */
    async startBattle(player1Id, player2Id, interaction) {
        const battleId = `${player1Id}_${player2Id}_${Date.now()}`;
        
        try {
            // Get player data
            const player1Data = await this.getPlayerBattleData(player1Id);
            const player2Data = await this.getPlayerBattleData(player2Id);
            
            if (!player1Data || !player2Data) {
                throw new Error('Could not load player data');
            }

            // Create battle data
            const battle = {
                id: battleId,
                player1: player1Data,
                player2: player2Data,
                currentTurn: player1Id,
                turnCount: 0,
                maxTurns: 20,
                startTime: Date.now(),
                status: 'active',
                lastActivity: Date.now()
            };

            // Store battle
            this.activeBattles.set(battleId, battle);
            this.playerBattles.set(player1Id, battleId);
            this.playerBattles.set(player2Id, battleId);

            // Create battle embed
            const embed = await this.createBattleEmbed(battle);
            const actionRow = this.createBattleButtons(battleId, player1Id);

            // Check if this is a button interaction (has update method) or slash command (has reply method)
            if (interaction.update && typeof interaction.update === 'function') {
                await interaction.update({
                    embeds: [embed],
                    components: [actionRow]
                });
            } else {
                await interaction.followUp({
                    embeds: [embed],
                    components: [actionRow]
                });
            }

            // Set battle timeout
            this.setBattleTimeout(battleId);

            return battleId;
        } catch (error) {
            console.error('Error starting battle:', error);
            throw error;
        }
    }

    /**
     * Get player data for battle
     */
    async getPlayerBattleData(userId) {
        try {
            const userData = await DatabaseManager.getUser(userId);
            if (!userData) {
                return null;
            }

            return {
                userId: userId,
                username: userData.username || 'Unknown',
                health: userData.health || 100,
                maxHealth: userData.health || 100,
                attack: userData.attack || 20,
                defense: userData.defense || 15,
                speed: userData.speed || 10,
                level: userData.level || 1,
                devilFruit: userData.devil_fruit || null
            };
        } catch (error) {
            console.error('Error getting player battle data:', error);
            return null;
        }
    }

    /**
     * Create battle embed
     */
    async createBattleEmbed(battle) {
        const { player1, player2, currentTurn, turnCount, maxTurns } = battle;
        
        const currentPlayer = currentTurn === player1.userId ? player1 : player2;
        const waitingPlayer = currentTurn === player1.userId ? player2 : player1;

        const embed = new EmbedBuilder()
            .setTitle('⚔️ PvP Battle in Progress!')
            .setDescription(`Turn ${turnCount + 1}/${maxTurns} - ${currentPlayer.username}'s turn`)
            .addFields([
                {
                    name: `🗡️ ${player1.username} (Level ${player1.level})`,
                    value: `❤️ ${player1.health}/${player1.maxHealth} HP\n⚔️ ${player1.attack} ATK | 🛡️ ${player1.defense} DEF`,
                    inline: true
                },
                {
                    name: '⚔️ VS ⚔️',
                    value: '\u200B',
                    inline: true
                },
                {
                    name: `🛡️ ${player2.username} (Level ${player2.level})`,
                    value: `❤️ ${player2.health}/${player2.maxHealth} HP\n⚔️ ${player2.attack} ATK | 🛡️ ${player2.defense} DEF`,
                    inline: true
                }
            ])
            .setColor('#4ECDC4')
            .setTimestamp();

        // Add devil fruit info if available
        if (player1.devilFruit) {
            embed.addFields([{ name: `${player1.username}'s Devil Fruit`, value: player1.devilFruit, inline: true }]);
        }
        if (player2.devilFruit) {
            embed.addFields([{ name: `${player2.username}'s Devil Fruit`, value: player2.devilFruit, inline: true }]);
        }

        return embed;
    }

    /**
     * Create battle action buttons
     */
    createBattleButtons(battleId, currentPlayerId) {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`battle_attack_${battleId}_${currentPlayerId}`)
                    .setLabel('Attack')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚔️'),
                new ButtonBuilder()
                    .setCustomId(`battle_defend_${battleId}_${currentPlayerId}`)
                    .setLabel('Defend')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🛡️'),
                new ButtonBuilder()
                    .setCustomId(`battle_special_${battleId}_${currentPlayerId}`)
                    .setLabel('Special')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✨'),
                new ButtonBuilder()
                    .setCustomId(`battle_forfeit_${battleId}_${currentPlayerId}`)
                    .setLabel('Forfeit')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏳️')
            );
    }

    /**
     * Process battle action
     */
    async processBattleAction(interaction, action, battleId, playerId) {
        const battle = this.activeBattles.get(battleId);
        
        if (!battle) {
            await interaction.reply({
                content: 'This battle no longer exists!',
                ephemeral: true
            });
            return;
        }

        if (battle.currentTurn !== playerId) {
            await interaction.reply({
                content: 'It\'s not your turn!',
                ephemeral: true
            });
            return;
        }

        const attacker = battle.currentTurn === battle.player1.userId ? battle.player1 : battle.player2;
        const defender = battle.currentTurn === battle.player1.userId ? battle.player2 : battle.player1;

        let actionResult = '';
        let damage = 0;

        switch (action) {
            case 'attack':
                damage = this.calculateDamage(attacker, defender, 'normal');
                defender.health = Math.max(0, defender.health - damage);
                actionResult = `${attacker.username} attacks ${defender.username} for ${damage} damage!`;
                break;
                
            case 'defend':
                attacker.defense += 5; // Temporary defense boost
                actionResult = `${attacker.username} takes a defensive stance! (+5 Defense)`;
                break;
                
            case 'special':
                if (attacker.devilFruit) {
                    damage = this.calculateDamage(attacker, defender, 'special');
                    defender.health = Math.max(0, defender.health - damage);
                    actionResult = `${attacker.username} uses their Devil Fruit power for ${damage} damage!`;
                } else {
                    damage = this.calculateDamage(attacker, defender, 'heavy');
                    defender.health = Math.max(0, defender.health - damage);
                    actionResult = `${attacker.username} performs a heavy attack for ${damage} damage!`;
                }
                break;
                
            case 'forfeit':
                await this.endBattle(battleId, defender.userId, 'forfeit');
                await interaction.update({
                    content: `${attacker.username} has forfeited the battle! ${defender.username} wins!`,
                    embeds: [],
                    components: []
                });
                return;
        }

        // Check if battle is over
        if (defender.health <= 0) {
            await this.endBattle(battleId, attacker.userId, 'victory');
            
            const winEmbed = new EmbedBuilder()
                .setTitle('🏆 Battle Complete!')
                .setDescription(`${attacker.username} defeats ${defender.username}!`)
                .addFields([
                    { name: '🎉 Winner', value: attacker.username, inline: true },
                    { name: '💀 Final Action', value: actionResult, inline: false }
                ])
                .setColor('#FFD700')
                .setTimestamp();

            await interaction.update({
                embeds: [winEmbed],
                components: []
            });
            return;
        }

        // Switch turns
        battle.currentTurn = battle.currentTurn === battle.player1.userId ? battle.player2.userId : battle.player1.userId;
        battle.turnCount++;
        battle.lastActivity = Date.now();

        // Check for max turns
        if (battle.turnCount >= battle.maxTurns) {
            const winner = battle.player1.health > battle.player2.health ? battle.player1 : battle.player2;
            await this.endBattle(battleId, winner.userId, 'timeout');
            
            const timeoutEmbed = new EmbedBuilder()
                .setTitle('⏰ Battle Timeout!')
                .setDescription(`Maximum turns reached! ${winner.username} wins with more health remaining.`)
                .setColor('#95A5A6')
                .setTimestamp();

            await interaction.update({
                embeds: [timeoutEmbed],
                components: []
            });
            return;
        }

        // Continue battle
        const updatedEmbed = await this.createBattleEmbed(battle);
        const newActionRow = this.createBattleButtons(battleId, battle.currentTurn);
        
        // Add action result to embed
        updatedEmbed.addFields([{ name: '⚡ Last Action', value: actionResult, inline: false }]);

        await interaction.update({
            embeds: [updatedEmbed],
            components: [newActionRow]
        });
    }

    /**
     * Calculate damage
     */
    calculateDamage(attacker, defender, attackType) {
        let baseDamage = attacker.attack;
        
        switch (attackType) {
            case 'normal':
                baseDamage *= 1.0;
                break;
            case 'heavy':
                baseDamage *= 1.5;
                break;
            case 'special':
                baseDamage *= 2.0;
                break;
        }
        
        const defense = defender.defense || 0;
        const damage = Math.max(1, Math.floor(baseDamage - (defense * 0.3)));
        
        // Add randomness (±15%)
        const randomFactor = 0.85 + (Math.random() * 0.3);
        
        return Math.floor(damage * randomFactor);
    }

    /**
     * End battle and update stats
     */
    async endBattle(battleId, winnerId, reason) {
        const battle = this.activeBattles.get(battleId);
        if (!battle) return;

        const loserId = winnerId === battle.player1.userId ? battle.player2.userId : battle.player1.userId;

        try {
            // Update PvP stats
            await DatabaseManager.updatePvPStats(winnerId, true);
            await DatabaseManager.updatePvPStats(loserId, false);
            
            // Award rewards
            const winReward = 100;
            const lossReward = 25;
            
            await DatabaseManager.addMoney(winnerId, winReward);
            await DatabaseManager.addMoney(loserId, lossReward);
            
            console.log(`PvP battle ended: ${winnerId} defeats ${loserId} (${reason})`);
        } catch (error) {
            console.error('Error updating battle results:', error);
        }

        // Clean up
        this.activeBattles.delete(battleId);
        this.playerBattles.delete(battle.player1.userId);
        this.playerBattles.delete(battle.player2.userId);
    }

    /**
     * Set battle timeout
     */
    setBattleTimeout(battleId) {
        setTimeout(() => {
            const battle = this.activeBattles.get(battleId);
            if (battle && battle.status === 'active') {
                console.log(`Battle ${battleId} timed out due to inactivity`);
                this.endBattle(battleId, null, 'timeout');
            }
        }, 10 * 60 * 1000); // 10 minutes
    }

    /**
     * Check if player is in battle
     */
    isInBattle(userId) {
        return this.playerBattles.has(userId);
    }

    /**
     * Get battle by player ID
     */
    getBattleByPlayer(userId) {
        const battleId = this.playerBattles.get(userId);
        return battleId ? this.activeBattles.get(battleId) : null;
    }
}

module.exports = new BattleManager();
