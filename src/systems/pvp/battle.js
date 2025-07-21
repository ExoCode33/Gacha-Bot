// src/systems/pvp/battle.js - Complete Battle System (Fixed)
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

class BattleSystem {
    constructor(pvpSystem) {
        this.pvpSystem = pvpSystem;
        this.activeBattles = new Map();
        this.challengeTimeouts = new Map();
        this.challengeTimeout = 60000; // 1 minute to respond to challenges
    }

    async init() {
        console.log('⚔️ PvP Battle System initialized');
    }

    async startChallenge(interaction, challenger, defender) {
        const challengeId = `${challenger.userId}_${defender.userId}_${Date.now()}`;
        
        // Check if either player is already in a battle or has pending challenge
        if (this.isPlayerBusy(challenger.userId) || this.isPlayerBusy(defender.userId)) {
            return await interaction.reply({
                content: '❌ One of the players is already in a battle or has a pending challenge!',
                ephemeral: true
            });
        }

        const balanceCheck = this.validateBalance(challenger, defender);
        
        const embed = new EmbedBuilder()
            .setColor(balanceCheck.isBalanced ? 0x00FF00 : 0xFF8000)
            .setTitle('⚔️ PvP Challenge Issued!')
            .setDescription(`**${challenger.username}** challenges **${defender.username}** to battle!`)
            .addFields([
                {
                    name: '🏴‍☠️ Challenger',
                    value: [
                        `**${challenger.username}**`,
                        `Level: ${challenger.level}`,
                        `CP: ${challenger.balancedCP.toLocaleString()}`,
                        `HP: ${challenger.maxHealth}`,
                        `Fruits: ${challenger.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🏴‍☠️ Defender',
                    value: [
                        `**${defender.username}**`,
                        `Level: ${defender.level}`,
                        `CP: ${defender.balancedCP.toLocaleString()}`,
                        `HP: ${defender.maxHealth}`,
                        `Fruits: ${defender.fruits.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚖️ Balance Analysis',
                    value: [
                        `**Balanced**: ${balanceCheck.isBalanced ? '✅ Fair Fight' : '⚠️ Unbalanced'}`,
                        `**CP Ratio**: ${balanceCheck.cpRatio.toFixed(2)}:1`,
                        `**Level Difference**: ${balanceCheck.levelDiff}`,
                        `**Prediction**: ${balanceCheck.prediction}`,
                        `**Recommendation**: ${balanceCheck.recommendation}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⏰ Challenge Details',
                    value: [
                        `**Response Time**: 60 seconds`,
                        `**Battle Type**: Turn-based PvP`,
                        `**Max Turns**: 15`,
                        `**Rewards**: Honor and experience`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Challenge expires in 60 seconds!' })
            .setTimestamp();

        const challengeButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`accept_challenge_${challenger.userId}_${defender.userId}`)
                    .setLabel('⚔️ Accept Challenge')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`decline_challenge_${challenger.userId}_${defender.userId}`)
                    .setLabel('❌ Decline Challenge')
                    .setStyle(ButtonStyle.Danger)
            );

        // Store challenge data
        const challengeData = {
            id: challengeId,
            challenger,
            defender,
            created: Date.now(),
            channelId: interaction.channel.id,
            guildId: interaction.guild?.id
        };

        this.activeBattles.set(challengeId, challengeData);

        await interaction.reply({
            content: `<@${defender.userId}>, you have been challenged to a PvP battle!`,
            embeds: [embed],
            components: [challengeButtons]
        });

        // Set timeout for challenge expiration
        const timeoutId = setTimeout(async () => {
            if (this.activeBattles.has(challengeId)) {
                await this.expireChallenge(interaction, challengeId);
            }
        }, this.challengeTimeout);

        this.challengeTimeouts.set(challengeId, timeoutId);
    }

    async expireChallenge(interaction, challengeId) {
        const challengeData = this.activeBattles.get(challengeId);
        if (!challengeData) return;

        this.activeBattles.delete(challengeId);
        
        if (this.challengeTimeouts.has(challengeId)) {
            clearTimeout(this.challengeTimeouts.get(challengeId));
            this.challengeTimeouts.delete(challengeId);
        }

        const embed = new EmbedBuilder()
            .setColor(0x808080)
            .setTitle('⏰ Challenge Expired')
            .setDescription(`The challenge from **${challengeData.challenger.username}** has expired.`)
            .addFields([
                {
                    name: '📋 Challenge Details',
                    value: [
                        `**Challenger**: ${challengeData.challenger.username}`,
                        `**Defender**: ${challengeData.defender.username}`,
                        `**Expiration**: Challenge not accepted in time`,
                        `**Status**: Expired`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Challenges expire after 60 seconds of no response' });

        try {
            await interaction.editReply({
                embeds: [embed],
                components: [],
                content: ''
            });
        } catch (error) {
            console.error('Error updating expired challenge:', error);
        }
    }

    async handleChallengeResponse(interaction, challengerId, defenderId, action) {
        const challengeId = Array.from(this.activeBattles.keys())
            .find(id => {
                const data = this.activeBattles.get(id);
                return data.challenger.userId === challengerId && data.defender.userId === defenderId;
            });

        if (!challengeId) {
            return await interaction.reply({
                content: '❌ This challenge is no longer valid.',
                ephemeral: true
            });
        }

        const challengeData = this.activeBattles.get(challengeId);
        
        // Verify the responder is the defender
        if (interaction.user.id !== defenderId) {
            return await interaction.reply({
                content: '❌ Only the challenged player can respond to this challenge!',
                ephemeral: true
            });
        }

        // Clean up challenge
        this.activeBattles.delete(challengeId);
        if (this.challengeTimeouts.has(challengeId)) {
            clearTimeout(this.challengeTimeouts.get(challengeId));
            this.challengeTimeouts.delete(challengeId);
        }

        if (action === 'accept') {
            await this.startAcceptedBattle(interaction, challengeData);
        } else {
            await this.handleDeclinedChallenge(interaction, challengeData);
        }
    }

    async startAcceptedBattle(interaction, challengeData) {
        const { challenger, defender } = challengeData;

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('⚔️ Challenge Accepted!')
            .setDescription(`**${defender.username}** accepts **${challenger.username}**'s challenge!`)
            .addFields([
                {
                    name: '🏁 Battle Preparation',
                    value: [
                        `**Challenger**: ${challenger.username} (${challenger.balancedCP.toLocaleString()} CP)`,
                        `**Defender**: ${defender.username} (${defender.balancedCP.toLocaleString()} CP)`,
                        `**Battle Type**: Enhanced Turn-Based PvP`,
                        `**Status**: Initializing battle systems...`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Battle starting in 3 seconds...' })
            .setTimestamp();

        await interaction.update({
            embeds: [embed],
            components: [],
            content: ''
        });

        // Start the battle after a brief delay
        setTimeout(async () => {
            try {
                await this.runTurnBasedBattle(interaction, challenger, defender);
            } catch (error) {
                console.error('Error starting turn-based battle:', error);
                await interaction.editReply({
                    content: '❌ An error occurred while starting the battle.',
                    embeds: [],
                    components: []
                });
            }
        }, 3000);
    }

    async handleDeclinedChallenge(interaction, challengeData) {
        const { challenger, defender } = challengeData;

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Challenge Declined')
            .setDescription(`**${defender.username}** has declined the challenge from **${challenger.username}**.`)
            .addFields([
                {
                    name: '📋 Challenge Summary',
                    value: [
                        `**Challenger**: ${challenger.username}`,
                        `**Defender**: ${defender.username}`,
                        `**Response**: Declined`,
                        `**Status**: Challenge ended`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Maybe next time! Try /pvp queue for matchmaking.' });

        await interaction.update({
            embeds: [embed],
            components: [],
            content: ''
        });
    }

    async runTurnBasedBattle(interaction, fighter1, fighter2) {
        const battleId = `battle_${fighter1.userId}_${fighter2.userId}_${Date.now()}`;
        
        // Initialize battle state
        const battleState = {
            id: battleId,
            fighter1: { ...fighter1, hp: fighter1.maxHealth, effects: [] },
            fighter2: { ...fighter2, hp: fighter2.maxHealth, effects: [] },
            turn: 1,
            maxTurns: 15,
            currentPlayer: fighter1.userId,
            battleLog: [],
            created: Date.now(),
            phase: 'active'
        };

        battleState.battleLog.push(`⚔️ **Battle Start**: ${fighter1.username} vs ${fighter2.username}`);
        battleState.battleLog.push(`🏁 **Initial HP**: ${fighter1.username} (${fighter1.maxHealth}) vs ${fighter2.username} (${fighter2.maxHealth})`);

        // Store active battle
        this.activeBattles.set(battleId, battleState);

        // Run battle simulation
        await this.simulateEnhancedBattle(interaction, battleState);
    }

    async simulateEnhancedBattle(interaction, battleState) {
        const { fighter1, fighter2 } = battleState;
        
        // Battle loop
        while (battleState.turn <= battleState.maxTurns && 
               battleState.fighter1.hp > 0 && 
               battleState.fighter2.hp > 0) {
            
            // Fighter 1's turn
            if (battleState.fighter1.hp > 0) {
                const damage = this.calculateAdvancedDamage(fighter1, fighter2, battleState.turn);
                battleState.fighter2.hp = Math.max(0, battleState.fighter2.hp - damage);
                battleState.battleLog.push(`⚡ **Turn ${battleState.turn}**: ${fighter1.username} deals ${damage} damage!`);
                battleState.battleLog.push(`💔 ${fighter2.username}: ${battleState.fighter2.hp}/${fighter2.maxHealth} HP`);
            }

            if (battleState.fighter2.hp <= 0) break;

            // Fighter 2's turn
            if (battleState.fighter2.hp > 0) {
                const damage = this.calculateAdvancedDamage(fighter2, fighter1, battleState.turn);
                battleState.fighter1.hp = Math.max(0, battleState.fighter1.hp - damage);
                battleState.battleLog.push(`⚡ **Turn ${battleState.turn}**: ${fighter2.username} deals ${damage} damage!`);
                battleState.battleLog.push(`💔 ${fighter1.username}: ${battleState.fighter1.hp}/${fighter1.maxHealth} HP`);
            }

            battleState.turn++;
            if (battleState.fighter1.hp <= 0) break;
        }

        // Determine winner
        const winner = battleState.fighter1.hp > battleState.fighter2.hp ? fighter1 : fighter2;
        const loser = winner === fighter1 ? fighter2 : fighter1;
        const winnerHP = winner === fighter1 ? battleState.fighter1.hp : battleState.fighter2.hp;

        // Create final battle result
        await this.displayBattleResult(interaction, battleState, winner, loser, winnerHP);

        // Clean up
        this.activeBattles.delete(battleState.id);
    }

    async displayBattleResult(interaction, battleState, winner, loser, winnerHP) {
        const battleDuration = Math.floor((Date.now() - battleState.created) / 1000);
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🏆 PvP Battle Complete!')
            .setDescription(`**${winner.username}** emerges victorious!`)
            .addFields([
                {
                    name: '👑 Victory Details',
                    value: [
                        `**Winner**: ${winner.username}`,
                        `**Remaining HP**: ${winnerHP}/${winner.maxHealth}`,
                        `**Loser**: ${loser.username}`,
                        `**Final HP**: 0/${loser.maxHealth}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📊 Battle Statistics',
                    value: [
                        `**Total Turns**: ${battleState.turn - 1}`,
                        `**Battle Duration**: ${battleDuration}s`,
                        `**Battle Type**: Enhanced PvP`,
                        `**Max Possible Turns**: ${battleState.maxTurns}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚔️ Battle Summary',
                    value: battleState.battleLog.slice(-8).join('\n'),
                    inline: false
                },
                {
                    name: '🎯 Post-Battle Info',
                    value: [
                        `**Experience**: Both players gain battle experience`,
                        `**Honor**: ${winner.username} gains victory honor`,
                        `**Next Battle**: 5 minute cooldown applies`,
                        `**Ranking**: Battle affects PvP rankings`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Great battle! Use /pvp queue for more battles.' })
            .setTimestamp();

        await interaction.editReply({
            embeds: [embed],
            components: []
        });
    }

    calculateAdvancedDamage(attacker, defender, turn) {
        const baseDamage = 85;
        
        // CP ratio with cap
        const cpRatio = Math.min(attacker.balancedCP / defender.balancedCP, 1.8);
        
        // Turn scaling (early turns do less damage)
        let turnMultiplier = 1.0;
        if (turn === 1) turnMultiplier = 0.5;
        else if (turn === 2) turnMultiplier = 0.7;
        else if (turn === 3) turnMultiplier = 0.85;
        
        // Random factor for unpredictability
        const randomFactor = 0.85 + (Math.random() * 0.3); // 0.85 to 1.15
        
        // Level difference bonus/penalty
        const levelDiff = attacker.level - defender.level;
        const levelMultiplier = 1 + (levelDiff * 0.02); // ±2% per level difference
        
        const finalDamage = Math.floor(
            baseDamage * 
            cpRatio * 
            turnMultiplier * 
            randomFactor * 
            levelMultiplier
        );
        
        return Math.max(20, finalDamage); // Minimum 20 damage
    }

    validateBalance(fighter1, fighter2) {
        const cpRatio = Math.max(
            fighter1.balancedCP / fighter2.balancedCP, 
            fighter2.balancedCP / fighter1.balancedCP
        );
        const levelDiff = Math.abs(fighter1.level - fighter2.level);
        
        const isBalanced = cpRatio <= 2.0 && levelDiff <= 20;
        
        let prediction = 'Even match';
        if (cpRatio > 1.5) {
            const stronger = fighter1.balancedCP > fighter2.balancedCP ? fighter1.username : fighter2.username;
            prediction = `${stronger} has significant advantage`;
        } else if (cpRatio > 1.2) {
            const stronger = fighter1.balancedCP > fighter2.balancedCP ? fighter1.username : fighter2.username;
            prediction = `${stronger} has slight advantage`;
        }
        
        return {
            isBalanced,
            cpRatio,
            levelDiff,
            prediction,
            recommendation: isBalanced ? 
                'Fair fight - battle recommended!' : 
                'Consider finding a more balanced opponent for better experience'
        };
    }

    isPlayerBusy(userId) {
        // Check if player has pending challenge or active battle
        for (const battleData of this.activeBattles.values()) {
            if (battleData.challenger?.userId === userId || 
                battleData.defender?.userId === userId ||
                battleData.fighter1?.userId === userId ||
                battleData.fighter2?.userId === userId) {
                return true;
            }
        }
        return false;
    }

    getActiveBattle(userId) {
        for (const [battleId, battleData] of this.activeBattles) {
            if (battleData.fighter1?.userId === userId || 
                battleData.fighter2?.userId === userId ||
                battleData.challenger?.userId === userId ||
                battleData.defender?.userId === userId) {
                return { battleId, battleData };
            }
        }
        return null;
    }

    // Cleanup old battles and challenges
    cleanup() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        let cleanedCount = 0;
        for (const [battleId, battleData] of this.activeBattles) {
            if (now - battleData.created > maxAge) {
                // Clear any associated timeout
                if (this.challengeTimeouts.has(battleId)) {
                    clearTimeout(this.challengeTimeouts.get(battleId));
                    this.challengeTimeouts.delete(battleId);
                }
                
                this.activeBattles.delete(battleId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} old battles/challenges`);
        }
    }

    // Get battle statistics
    getBattleStats() {
        const activeBattleCount = Array.from(this.activeBattles.values())
            .filter(battle => battle.phase === 'active').length;
        const pendingChallengeCount = Array.from(this.activeBattles.values())
            .filter(battle => battle.challenger && battle.defender).length;
        
        return {
            activeBattles: activeBattleCount,
            pendingChallenges: pendingChallengeCount,
            totalEntries: this.activeBattles.size,
            challengeTimeout: this.challengeTimeout / 1000 // in seconds
        };
    }
}

module.exports = BattleSystem;
