// Enhanced Turn-Based PvP System
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class EnhancedTurnBasedPvP {
    constructor() {
        this.pendingChallenges = new Map(); // battleId -> challenge data
        this.acceptedPlayers = new Map(); // battleId -> Set of userId
        this.activeBattles = new Map(); // battleId -> battle data
        this.battleTimeout = 60000; // 60 seconds
        this.turnTimeout = 30000; // 30 seconds per turn
    }

    async createPvPChallenge(interaction, targetUser, battleType = 'enhanced') {
        const challenger = interaction.user;
        const target = targetUser;
        
        // Generate unique battle ID
        const battleId = `pvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Get player data (you'll need to implement getUserData function)
        const challengerData = await this.getUserData(challenger.id);
        const targetData = await this.getUserData(target.id);
        
        // Store challenge data
        const challengeData = {
            battleId,
            challenger: {
                user: challenger,
                data: challengerData,
                accepted: false
            },
            target: {
                user: target,
                data: targetData,
                accepted: false
            },
            battleType,
            timestamp: Date.now(),
            channel: interaction.channel
        };
        
        this.pendingChallenges.set(battleId, challengeData);
        this.acceptedPlayers.set(battleId, new Set());
        
        // Create individual messages for each player
        await this.sendChallengerMessage(interaction, challengeData);
        await this.sendTargetMessage(interaction, challengeData);
        
        // Auto-accept for debug bot
        if (this.isDebugBot(target)) {
            setTimeout(() => {
                this.autoAcceptDebugBot(battleId, target.id);
            }, 1000);
        }
        
        // Set timeout for challenge expiration
        setTimeout(() => {
            this.expireChallenge(battleId);
        }, this.battleTimeout);
        
        return battleId;
    }

    async sendChallengerMessage(interaction, challengeData) {
        const { challenger, target, battleId } = challengeData;
        
        const embed = new EmbedBuilder()
            .setColor('#FF6B35')
            .setTitle('⚔️ Enhanced Turn-Based PvP Battle Challenge!')
            .setDescription(`${challenger.user.username} has challenged ${target.user.displayName}!`)
            .addFields([
                {
                    name: '🔥 Challenger',
                    value: `**${challenger.user.username}**\nLevel: ${challenger.data.level}\nTotal CP: ${challenger.data.totalCP.toLocaleString()}\nFruits: ${challenger.data.fruits}`,
                    inline: true
                },
                {
                    name: '🎯 Target',
                    value: `**${target.user.displayName}**\nLevel: ${target.data.level}\nTotal CP: ${target.data.totalCP.toLocaleString()}\nFruits: ${target.data.fruits}`,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: '\u200B',
                    inline: true
                },
                {
                    name: '⚔️ Battle System',
                    value: '🎯 Enhanced Turn-Based Combat\n🍎 Choose 5 fruits for battle\n⚡ Turn-based skill combat\n🧠 Strategic depth and timing',
                    inline: false
                },
                {
                    name: '⏰ Time Limit',
                    value: '🚨 60 seconds to accept!',
                    inline: false
                }
            ])
            .setFooter({ text: `Battle ID: ${battleId} • Both players must accept! • ${new Date().toLocaleTimeString()}` })
            .setTimestamp();

        const challengerButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`pvp_accept_${battleId}_${challenger.user.id}`)
                    .setLabel(`${challenger.user.username} Accept`)
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId(`pvp_decline_${battleId}_${challenger.user.id}`)
                    .setLabel(`${challenger.user.username} Decline`)
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        await interaction.followUp({
            embeds: [embed],
            components: [challengerButton],
            ephemeral: false
        });
    }

    async sendTargetMessage(interaction, challengeData) {
        const { challenger, target, battleId } = challengeData;
        
        const embed = new EmbedBuilder()
            .setColor('#4ECDC4')
            .setTitle('⚔️ You\'ve Been Challenged!')
            .setDescription(`${target.user.displayName}, you've been challenged to an enhanced PvP battle!`)
            .addFields([
                {
                    name: '🔥 Challenger',
                    value: `**${challenger.user.username}**\nLevel: ${challenger.data.level}\nTotal CP: ${challenger.data.totalCP.toLocaleString()}\nFruits: ${challenger.data.fruits}`,
                    inline: true
                },
                {
                    name: '🎯 You',
                    value: `**${target.user.displayName}**\nLevel: ${target.data.level}\nTotal CP: ${target.data.totalCP.toLocaleString()}\nFruits: ${target.data.fruits}`,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: '\u200B',
                    inline: true
                },
                {
                    name: '⚔️ Battle System',
                    value: '🎯 Enhanced Turn-Based Combat\n🍎 Choose 5 fruits for battle\n⚡ Turn-based skill combat\n🧠 Strategic depth and timing',
                    inline: false
                }
            ])
            .setFooter({ text: `Battle ID: ${battleId} • Both players must accept!` })
            .setTimestamp();

        const targetButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`pvp_accept_${battleId}_${target.user.id}`)
                    .setLabel(`${target.user.displayName} Accept`)
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId(`pvp_decline_${battleId}_${target.user.id}`)
                    .setLabel(`${target.user.displayName} Decline`)
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        await interaction.followUp({
            content: `<@${target.user.id}>`,
            embeds: [embed],
            components: [targetButton],
            ephemeral: false
        });
    }

    async handleButtonInteraction(interaction) {
        const [action, type, battleId, userId] = interaction.customId.split('_');
        
        if (action !== 'pvp' || !['accept', 'decline'].includes(type)) return;
        
        const challengeData = this.pendingChallenges.get(battleId);
        if (!challengeData) {
            return await interaction.reply({
                content: '❌ This challenge has expired or no longer exists.',
                ephemeral: true
            });
        }

        // Check if user is part of this challenge
        const isChallenger = challengeData.challenger.user.id === userId;
        const isTarget = challengeData.target.user.id === userId;
        
        if (!isChallenger && !isTarget) {
            return await interaction.reply({
                content: '❌ You are not part of this challenge.',
                ephemeral: true
            });
        }

        if (type === 'decline') {
            await this.declineChallenge(interaction, battleId, userId);
        } else if (type === 'accept') {
            await this.acceptChallenge(interaction, battleId, userId);
        }
    }

    async acceptChallenge(interaction, battleId, userId) {
        const challengeData = this.pendingChallenges.get(battleId);
        const acceptedSet = this.acceptedPlayers.get(battleId);
        
        if (acceptedSet.has(userId)) {
            return await interaction.reply({
                content: '✅ You have already accepted this challenge!',
                ephemeral: true
            });
        }

        acceptedSet.add(userId);
        
        // Update challenge data
        if (challengeData.challenger.user.id === userId) {
            challengeData.challenger.accepted = true;
        } else if (challengeData.target.user.id === userId) {
            challengeData.target.accepted = true;
        }

        await interaction.reply({
            content: '✅ Challenge accepted! Waiting for the other player...',
            ephemeral: true
        });

        // Check if both players accepted
        if (acceptedSet.size === 2) {
            await this.startBattle(challengeData);
        }
    }

    async declineChallenge(interaction, battleId, userId) {
        const challengeData = this.pendingChallenges.get(battleId);
        
        await interaction.reply({
            content: '❌ Challenge declined.',
            ephemeral: true
        });

        // Send decline notification to channel
        const declineEmbed = new EmbedBuilder()
            .setColor('#FF4757')
            .setTitle('❌ Challenge Declined')
            .setDescription(`The PvP challenge has been declined by ${interaction.user.displayName}.`)
            .setTimestamp();

        await challengeData.channel.send({ embeds: [declineEmbed] });
        
        // Clean up
        this.pendingChallenges.delete(battleId);
        this.acceptedPlayers.delete(battleId);
    }

    async autoAcceptDebugBot(battleId, debugBotId) {
        const challengeData = this.pendingChallenges.get(battleId);
        if (!challengeData) return;

        const acceptedSet = this.acceptedPlayers.get(battleId);
        if (acceptedSet.has(debugBotId)) return;

        acceptedSet.add(debugBotId);
        
        // Update challenge data
        if (challengeData.target.user.id === debugBotId) {
            challengeData.target.accepted = true;
        }

        // Send auto-accept message
        const autoAcceptEmbed = new EmbedBuilder()
            .setColor('#00D2D3')
            .setTitle('🤖 Debug Bot Auto-Accept')
            .setDescription(`Debug bot has automatically accepted the challenge!`)
            .setTimestamp();

        await challengeData.channel.send({ embeds: [autoAcceptEmbed] });

        // Check if both players accepted
        if (acceptedSet.size === 2) {
            await this.startBattle(challengeData);
        }
    }

    async startBattle(challengeData) {
        const { battleId, challenger, target, channel } = challengeData;
        
        // Send battle start confirmation
        const startEmbed = new EmbedBuilder()
            .setColor('#FFD93D')
            .setTitle('🔥 Battle Starting!')
            .setDescription(`Both players have accepted! The enhanced PvP battle is about to begin!`)
            .addFields([
                {
                    name: '⚔️ Combatants',
                    value: `${challenger.user.username} vs ${target.user.displayName}`,
                    inline: false
                },
                {
                    name: '🎯 Battle Type',
                    value: 'Enhanced Turn-Based Combat',
                    inline: true
                },
                {
                    name: '🍎 Fruit Selection',
                    value: 'Choose your 5 battle fruits!',
                    inline: true
                }
            ])
            .setTimestamp();

        await channel.send({ embeds: [startEmbed] });
        
        // Clean up challenge data
        this.pendingChallenges.delete(battleId);
        this.acceptedPlayers.delete(battleId);
        
        // Initialize the actual battle system
        await this.initializeBattle(challenger, target, channel, battleId);
    }

    async expireChallenge(battleId) {
        const challengeData = this.pendingChallenges.get(battleId);
        if (!challengeData) return;

        const acceptedSet = this.acceptedPlayers.get(battleId);
        if (acceptedSet && acceptedSet.size < 2) {
            const expireEmbed = new EmbedBuilder()
                .setColor('#95A5A6')
                .setTitle('⏰ Challenge Expired')
                .setDescription('The PvP challenge has expired due to timeout.')
                .setTimestamp();

            await challengeData.channel.send({ embeds: [expireEmbed] });
            
            // Clean up
            this.pendingChallenges.delete(battleId);
            this.acceptedPlayers.delete(battleId);
        }
    }

    async initializeBattle(challenger, target, channel, battleId) {
        // Initialize battle data
        const battleData = {
            battleId,
            players: [
                {
                    user: challenger.user,
                    data: challenger.data,
                    selectedFruits: [],
                    currentHP: 100,
                    maxHP: 100,
                    turnReady: false
                },
                {
                    user: target.user,
                    data: target.data,
                    selectedFruits: [],
                    currentHP: 100,
                    maxHP: 100,
                    turnReady: false
                }
            ],
            currentTurn: 0,
            turnNumber: 1,
            battlePhase: 'fruit_selection', // fruit_selection, combat, finished
            channel: channel,
            timestamp: Date.now()
        };

        this.activeBattles.set(battleId, battleData);

        // Start fruit selection phase
        await this.startFruitSelection(battleData);
    }

    async startFruitSelection(battleData) {
        const { battleId, players, channel } = battleData;

        const selectionEmbed = new EmbedBuilder()
            .setColor('#F39C12')
            .setTitle('🍎 Fruit Selection Phase')
            .setDescription('Each player must select 5 fruits for battle!')
            .addFields([
                {
                    name: '📋 Instructions',
                    value: '• Click the button below to select your fruits\n• Choose 5 fruits from your inventory\n• Both players must complete selection\n• Battle will begin once both are ready',
                    inline: false
                },
                {
                    name: '⏰ Time Limit',
                    value: '60 seconds to select fruits',
                    inline: true
                }
            ])
            .setTimestamp();

        const selectionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`fruit_select_${battleId}_${players[0].user.id}`)
                    .setLabel(`${players[0].user.username} Select Fruits`)
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🍎'),
                new ButtonBuilder()
                    .setCustomId(`fruit_select_${battleId}_${players[1].user.id}`)
                    .setLabel(`${players[1].user.displayName} Select Fruits`)
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🍊')
            );

        await channel.send({
            embeds: [selectionEmbed],
            components: [selectionButtons]
        });

        // Set timeout for fruit selection
        setTimeout(() => {
            this.timeoutFruitSelection(battleId);
        }, 60000);
    }

    async timeoutFruitSelection(battleId) {
        const battleData = this.activeBattles.get(battleId);
        if (!battleData || battleData.battlePhase !== 'fruit_selection') return;

        // Auto-select fruits for players who didn't select
        battleData.players.forEach(player => {
            if (player.selectedFruits.length === 0) {
                player.selectedFruits = this.autoSelectFruits(player.data);
            }
        });

        // Start combat phase
        await this.startCombatPhase(battleData);
    }

    autoSelectFruits(playerData) {
        // Auto-select 5 random fruits (placeholder logic)
        const fruits = ['Apple', 'Banana', 'Orange', 'Grape', 'Strawberry'];
        return fruits.slice(0, 5).map(name => ({
            name,
            damage: Math.floor(Math.random() * 20) + 10,
            accuracy: Math.floor(Math.random() * 30) + 70
        }));
    }

    async startCombatPhase(battleData) {
        battleData.battlePhase = 'combat';
        battleData.currentTurn = 0; // Player 1 starts

        const combatEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('⚔️ Combat Phase Begin!')
            .setDescription('The battle has started! Take turns attacking each other.')
            .addFields([
                {
                    name: `🔥 ${battleData.players[0].user.username}`,
                    value: `HP: ${battleData.players[0].currentHP}/${battleData.players[0].maxHP}`,
                    inline: true
                },
                {
                    name: `🎯 ${battleData.players[1].user.displayName}`,
                    value: `HP: ${battleData.players[1].currentHP}/${battleData.players[1].maxHP}`,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: '\u200B',
                    inline: true
                },
                {
                    name: '🎲 Turn Information',
                    value: `Turn ${battleData.turnNumber}\n${battleData.players[battleData.currentTurn].user.username}'s turn!`,
                    inline: false
                }
            ])
            .setTimestamp();

        await battleData.channel.send({ embeds: [combatEmbed] });
        
        // Start the first turn
        await this.processTurn(battleData);
    }

    async processTurn(battleData) {
        const currentPlayer = battleData.players[battleData.currentTurn];
        const opponent = battleData.players[1 - battleData.currentTurn];

        const turnEmbed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle(`🎯 ${currentPlayer.user.username}'s Turn`)
            .setDescription('Choose your attack!')
            .addFields([
                {
                    name: '🍎 Your Fruits',
                    value: currentPlayer.selectedFruits.map((fruit, index) => 
                        `${index + 1}. ${fruit.name} (${fruit.damage} dmg, ${fruit.accuracy}% acc)`
                    ).join('\n') || 'Auto-selected fruits',
                    inline: false
                }
            ])
            .setTimestamp();

        const attackButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`attack_${battleData.battleId}_${currentPlayer.user.id}_0`)
                    .setLabel('🍎 Fruit 1')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`attack_${battleData.battleId}_${currentPlayer.user.id}_1`)
                    .setLabel('🍊 Fruit 2')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`attack_${battleData.battleId}_${currentPlayer.user.id}_2`)
                    .setLabel('🍇 Fruit 3')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`attack_${battleData.battleId}_${currentPlayer.user.id}_3`)
                    .setLabel('🥝 Fruit 4')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`attack_${battleData.battleId}_${currentPlayer.user.id}_4`)
                    .setLabel('🍓 Fruit 5')
                    .setStyle(ButtonStyle.Success)
            );

        await battleData.channel.send({
            content: `<@${currentPlayer.user.id}>`,
            embeds: [turnEmbed],
            components: [attackButtons]
        });

        // Set turn timeout
        setTimeout(() => {
            this.timeoutTurn(battleData.battleId, currentPlayer.user.id);
        }, this.turnTimeout);
    }

    async timeoutTurn(battleId, playerId) {
        const battleData = this.activeBattles.get(battleId);
        if (!battleData || battleData.battlePhase !== 'combat') return;

        const currentPlayer = battleData.players[battleData.currentTurn];
        if (currentPlayer.user.id !== playerId) return;

        // Auto-attack with random fruit
        const randomFruitIndex = Math.floor(Math.random() * 5);
        await this.executeAttack(battleData, playerId, randomFruitIndex, true);
    }

    async executeAttack(battleData, attackerId, fruitIndex, isTimeout = false) {
        const attacker = battleData.players.find(p => p.user.id === attackerId);
        const defender = battleData.players.find(p => p.user.id !== attackerId);
        
        if (!attacker || !defender) return;

        const selectedFruit = attacker.selectedFruits[fruitIndex] || {
            name: 'Random Fruit',
            damage: Math.floor(Math.random() * 15) + 5,
            accuracy: 75
        };

        // Calculate hit
        const hitChance = Math.random() * 100;
        const isHit = hitChance <= selectedFruit.accuracy;
        const damage = isHit ? selectedFruit.damage : 0;

        // Apply damage
        if (isHit) {
            defender.currentHP = Math.max(0, defender.currentHP - damage);
        }

        // Create result embed
        const resultEmbed = new EmbedBuilder()
            .setColor(isHit ? '#E74C3C' : '#95A5A6')
            .setTitle(`${isHit ? '💥 Hit!' : '💨 Miss!'}`)
            .setDescription(`${attacker.user.username} ${isTimeout ? '(auto)' : ''} used ${selectedFruit.name}!`)
            .addFields([
                {
                    name: '📊 Attack Result',
                    value: isHit ? `${damage} damage dealt!` : 'Attack missed!',
                    inline: true
                },
                {
                    name: '❤️ HP Status',
                    value: `${defender.user.displayName}: ${defender.currentHP}/${defender.maxHP} HP`,
                    inline: true
                }
            ])
            .setTimestamp();

        await battleData.channel.send({ embeds: [resultEmbed] });

        // Check for battle end
        if (defender.currentHP <= 0) {
            await this.endBattle(battleData, attacker, defender);
            return;
        }

        // Switch turns
        battleData.currentTurn = 1 - battleData.currentTurn;
        battleData.turnNumber++;

        // Continue battle
        setTimeout(() => {
            this.processTurn(battleData);
        }, 2000);
    }

    async endBattle(battleData, winner, loser) {
        battleData.battlePhase = 'finished';

        const victoryEmbed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle('🏆 Victory!')
            .setDescription(`${winner.user.username} has won the battle!`)
            .addFields([
                {
                    name: '🥇 Winner',
                    value: `${winner.user.username}\nRemaining HP: ${winner.currentHP}/${winner.maxHP}`,
                    inline: true
                },
                {
                    name: '🥈 Defeated',
                    value: `${loser.user.displayName}\nFinal HP: ${loser.currentHP}/${loser.maxHP}`,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: '\u200B',
                    inline: true
                },
                {
                    name: '📊 Battle Stats',
                    value: `Total Turns: ${battleData.turnNumber}\nBattle Duration: ${Math.round((Date.now() - battleData.timestamp) / 1000)}s`,
                    inline: false
                }
            ])
            .setTimestamp();

        await battleData.channel.send({ embeds: [victoryEmbed] });

        // Clean up
        this.activeBattles.delete(battleData.battleId);
    }

    isDebugBot(user) {
        return user.username.toLowerCase().includes('debug') || 
               user.username.toLowerCase().includes('bot') ||
               user.bot === true;
    }

    async getUserData(userId) {
        // Replace this with your actual database/user data retrieval system
        try {
            // Example: const userData = await database.getUser(userId);
            return {
                level: Math.floor(Math.random() * 50) + 1,
                totalCP: Math.floor(Math.random() * 10000) + 1000,
                fruits: Math.floor(Math.random() * 100) + 10,
                wins: Math.floor(Math.random() * 20),
                losses: Math.floor(Math.random() * 15)
            };
        } catch (error) {
            console.error(`Error fetching user data for ${userId}:`, error);
            return {
                level: 1,
                totalCP: 1000,
                fruits: 10,
                wins: 0,
                losses: 0
            };
        }
    }
}

module.exports = EnhancedTurnBasedPvP;
