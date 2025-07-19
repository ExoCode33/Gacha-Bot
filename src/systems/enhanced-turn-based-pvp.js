// src/systems/enhanced-turn-based-pvp.js - Complete Turn-Based PvP System
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const PvPBalanceSystem = require('./pvp-balance');
const NPCBossSystem = require('./npc-bosses');
const { getRarityEmoji, getRarityColor } = require('../data/devil-fruits');

// Import abilities safely
let balancedDevilFruitAbilities = {};
let statusEffects = {};

try {
    const abilitiesData = require('../data/balanced-devil-fruit-abilities');
    balancedDevilFruitAbilities = abilitiesData.balancedDevilFruitAbilities || {};
    statusEffects = abilitiesData.statusEffects || {};
} catch (error) {
    console.warn('⚠️ Could not load devil fruit abilities, using fallback system');
}

class EnhancedTurnBasedPvP {
    constructor() {
        this.activeBattles = new Map(); // battleId -> battleData
        this.playerSelections = new Map(); // userId -> selectedFruits
        this.battleQueue = new Set();
        this.battleCooldowns = new Map();
        
        console.log('⚔️ Enhanced Turn-Based PvP System initialized');
    }

    // Start a battle (from queue or challenge)
    async startBattle(interaction, player1Fighter, player2Fighter = null) {
        const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
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

        // Start fruit selection phase
        await this.startFruitSelection(interaction, battleData);
        
        return battleId;
    }

    // Create NPC fighter
    async createNPCFighter(npcBoss) {
        const selectedFruits = NPCBossSystem.selectFruitsForNPC(npcBoss);
        
        return {
            userId: `npc_${npcBoss.name.toLowerCase().replace(/\s/g, '_')}`,
            username: npcBoss.name,
            title: npcBoss.title,
            level: npcBoss.level,
            balancedCP: npcBoss.totalCP,
            maxHealth: Math.floor(npcBoss.totalCP * 0.8), // Balanced health
            hp: Math.floor(npcBoss.totalCP * 0.8),
            fruits: selectedFruits.map(fruitName => ({
                fruit_name: fruitName,
                fruit_rarity: this.getFruitRarity(fruitName)
            })),
            selectedFruits: selectedFruits,
            effects: [],
            isNPC: true,
            npcData: npcBoss
        };
    }

    // Get fruit rarity (fallback method)
    getFruitRarity(fruitName) {
        // Try to get from devil fruits data
        try {
            const { getFruitByName } = require('../data/devil-fruits');
            const fruit = getFruitByName(fruitName);
            return fruit?.rarity || 'common';
        } catch (error) {
            // Fallback based on name patterns
            if (fruitName.includes('Mythical') || fruitName.includes('Phoenix') || fruitName.includes('Nika')) {
                return 'mythical';
            } else if (fruitName.includes('Legendary') || fruitName.includes('Gura') || fruitName.includes('Yami')) {
                return 'legendary';
            } else if (fruitName.includes('Logia') || fruitName.includes('Magu') || fruitName.includes('Pika')) {
                return 'epic';
            }
            return 'common';
        }
    }

    // Start fruit selection phase
    async startFruitSelection(interaction, battleData) {
        const { player1, player2, isVsNPC } = battleData;

        if (isVsNPC) {
            // Player vs NPC - only player needs to select fruits
            await this.showFruitSelectionForPlayer(interaction, battleData, player1);
        } else {
            // Player vs Player - both need to select fruits
            await this.showFruitSelectionForPlayer(interaction, battleData, player1);
            // Send selection to player2 as well (in a real implementation)
        }
    }

    // Show fruit selection interface
    async showFruitSelectionForPlayer(interaction, battleData, player) {
        const { isVsNPC, npcBoss } = battleData;
        
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
                }
            ])
            .setFooter({ text: 'Select your strongest fruits wisely!' })
            .setTimestamp();

        // Create fruit selection menu (limit to first 20 fruits)
        const availableFruits = player.fruits.slice(0, 20);
        const fruitOptions = availableFruits.map((fruit, index) => {
            const emoji = getRarityEmoji(fruit.fruit_rarity);
            const ability = balancedDevilFruitAbilities[fruit.fruit_name];
            const damage = ability ? ability.damage : 100;
            
            return {
                label: fruit.fruit_name.length > 25 ? fruit.fruit_name.slice(0, 22) + '...' : fruit.fruit_name,
                description: `${emoji} ${fruit.fruit_rarity} • ${damage} dmg`,
                value: `fruit_${index}_${fruit.fruit_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50)}`,
                emoji: emoji
            };
        });

        // Ensure we have at least 5 options
        if (fruitOptions.length < 5) {
            return interaction.reply({
                content: '❌ You need at least 5 Devil Fruits to participate in turn-based battles!',
                ephemeral: true
            });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`fruit_selection_${battleData.id}_${player.userId}`)
            .setPlaceholder('Select exactly 5 Devil Fruits for battle...')
            .setMinValues(5)
            .setMaxValues(5)
            .addOptions(fruitOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: [row]
            });
        } else {
            await interaction.reply({
                embeds: [embed],
                components: [row]
            });
        }
    }

    // Handle fruit selection
    async handleFruitSelection(interaction, battleId, userId) {
        const battleData = this.activeBattles.get(battleId);
        if (!battleData) {
            return interaction.reply({ content: '❌ Battle not found!', ephemeral: true });
        }

        const selectedValues = interaction.values;
        const selectedFruits = selectedValues.map(value => {
            const parts = value.split('_');
            const fruitIndex = parseInt(parts[1]);
            const player = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
            return player.fruits[fruitIndex];
        });

        // Store selected fruits
        const player = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        player.selectedFruits = selectedFruits;
        this.playerSelections.set(userId, selectedFruits);

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
    }

    // Reveal boss and start battle
    async revealBossAndStartBattle(interaction, battleData) {
        const { npcBoss, player1 } = battleData;
        
        const bossEmbed = new EmbedBuilder()
            .setColor(getRarityColor('mythical'))
            .setTitle(`${npcBoss.emoji} BOSS REVEALED!`)
            .setDescription(`**${npcBoss.title}**\n*${npcBoss.description}*`)
            .addFields([
                {
                    name: '🏴‍☠️ Your Battle Lineup',
                    value: player1.selectedFruits.map((fruit, i) => 
                        `${i + 1}. ${getRarityEmoji(fruit.fruit_rarity)} ${fruit.fruit_name}`
                    ).join('\n'),
                    inline: true
                },
                {
                    name: `${npcBoss.emoji} Boss Stats`,
                    value: [
                        `**Name**: ${npcBoss.name}`,
                        `**Level**: ${npcBoss.level}`,
                        `**CP**: ${npcBoss.totalCP.toLocaleString()}`,
                        `**Difficulty**: ${npcBoss.difficulty}`,
                        `**HP**: ${battleData.player2.maxHealth}`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Battle starting in 3 seconds...' })
            .setTimestamp();

        const startButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`start_battle_${battleData.id}`)
                    .setLabel('⚔️ Start Battle!')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.update({
            embeds: [bossEmbed],
            components: [startButton]
        });

        // Auto-start after 3 seconds
        setTimeout(async () => {
            try {
                await this.startTurnBasedBattle(interaction, battleData);
            } catch (error) {
                console.error('Error auto-starting battle:', error);
            }
        }, 3000);
    }

    // Start the actual turn-based battle
    async startTurnBasedBattle(interaction, battleData) {
        battleData.status = 'battle';
        battleData.battleLog.push({
            type: 'battle_start',
            message: `⚔️ **BATTLE BEGINS!** ⚔️`,
            timestamp: Date.now()
        });

        // Determine first player
        const firstPlayer = Math.random() < 0.5 ? 'player1' : 'player2';
        battleData.currentPlayer = firstPlayer;
        
        const firstPlayerName = battleData[firstPlayer].username;
        battleData.battleLog.push({
            type: 'first_turn',
            message: `🎲 ${firstPlayerName} wins the dice roll and goes first!`,
            timestamp: Date.now()
        });

        await this.showBattleInterface(interaction, battleData);
    }

    // Show main battle interface with HP bars and turn options
    async showBattleInterface(interaction, battleData) {
        const { player1, player2, currentTurn, currentPlayer, battleLog } = battleData;
        
        // Create HP bars
        const p1HPPercent = (player1.hp / player1.maxHealth) * 100;
        const p2HPPercent = (player2.hp / player2.maxHealth) * 100;
        
        const p1HPBar = this.createHPBar(p1HPPercent);
        const p2HPBar = this.createHPBar(p2HPPercent);

        // Get current player's available skills
        const currentPlayerData = battleData[currentPlayer];
        const isCurrentPlayerTurn = !battleData.isVsNPC || currentPlayer === 'player1';

        const embed = new EmbedBuilder()
            .setColor(currentPlayer === 'player1' ? 0x3498DB : 0xE74C3C)
            .setTitle(`⚔️ Turn ${currentTurn} - ${currentPlayerData.username}'s Turn`)
            .setDescription(this.getBattleDescription(battleData))
            .addFields([
                {
                    name: `🏴‍☠️ ${player1.username} ${player1.title ? `(${player1.title})` : ''}`,
                    value: [
                        `${p1HPBar}`,
                        `**HP**: ${player1.hp}/${player1.maxHealth} (${p1HPPercent.toFixed(1)}%)`,
                        `**CP**: ${player1.balancedCP.toLocaleString()}`,
                        `**Effects**: ${this.getEffectsString(player1.effects)}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: `${player2.isNPC ? player2.npcData.emoji : '🏴‍☠️'} ${player2.username} ${player2.title ? `(${player2.title})` : ''}`,
                    value: [
                        `${p2HPBar}`,
                        `**HP**: ${player2.hp}/${player2.maxHealth} (${p2HPPercent.toFixed(1)}%)`,
                        `**CP**: ${player2.balancedCP.toLocaleString()}`,
                        `**Effects**: ${this.getEffectsString(player2.effects)}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📜 Recent Battle Log',
                    value: this.getRecentBattleLog(battleLog),
                    inline: false
                }
            ])
            .setFooter({ 
                text: isCurrentPlayerTurn ? 'Select your attack!' : 'Waiting for opponent...' 
            })
            .setTimestamp();

        let components = [];

        if (isCurrentPlayerTurn) {
            // Show skill selection for human player
            components = await this.createSkillSelectionComponents(battleData, currentPlayerData);
        }

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    embeds: [embed],
                    components
                });
            } else {
                await interaction.reply({
                    embeds: [embed],
                    components
                });
            }
        } catch (error) {
            console.error('Error showing battle interface:', error);
        }

        // If it's NPC turn, process automatically
        if (battleData.isVsNPC && currentPlayer === 'player2') {
            setTimeout(() => {
                this.processNPCTurn(interaction, battleData);
            }, 2000); // 2 second delay for dramatic effect
        }
    }

    // Create HP bar visualization
    createHPBar(percentage) {
        const barLength = 20;
        const filledLength = Math.round((percentage / 100) * barLength);
        const emptyLength = barLength - filledLength;
        
        // Use green for high HP, yellow for medium, red for low
        let fillEmoji = '🟢';
        if (percentage < 30) fillEmoji = '🔴';
        else if (percentage < 60) fillEmoji = '🟡';
        
        return fillEmoji.repeat(filledLength) + '⚫'.repeat(emptyLength);
    }

    // Get battle description with dramatic flair
    getBattleDescription(battleData) {
        const { currentTurn, player1, player2 } = battleData;
        
        if (currentTurn === 1) {
            return `🔥 **The battle begins!** Two powerful fighters clash with their Devil Fruit abilities!`;
        } else if (currentTurn <= 3) {
            return `⚡ **Early combat!** Both fighters are testing each other's defenses!`;
        } else if (currentTurn <= 7) {
            return `💥 **Intense battle!** The fight is heating up with devastating attacks!`;
        } else {
            return `🌟 **Epic finale!** This legendary battle will be remembered forever!`;
        }
    }

    // Create skill selection components
    async createSkillSelectionComponents(battleData, playerData) {
        const components = [];
        
        // Create skill selection buttons (up to 5 fruits)
        const skillButtons = playerData.selectedFruits.slice(0, 5).map((fruit, index) => {
            const ability = balancedDevilFruitAbilities[fruit.fruit_name] || {
                name: 'Unknown Skill',
                damage: 100,
                cooldown: 0
            };
            const emoji = getRarityEmoji(fruit.fruit_rarity);
            const cooldownInfo = ability.cooldown > 0 ? ` (${ability.cooldown}cd)` : '';
            
            return new ButtonBuilder()
                .setCustomId(`use_skill_${battleData.id}_${playerData.userId}_${index}`)
                .setLabel(`${fruit.fruit_name.slice(0, 15)}${cooldownInfo}`)
                .setEmoji(emoji)
                .setStyle(ButtonStyle.Primary);
        });

        // Split into rows (max 5 buttons per row)
        for (let i = 0; i < skillButtons.length; i += 5) {
            const row = new ActionRowBuilder()
                .addComponents(skillButtons.slice(i, i + 5));
            components.push(row);
        }

        // Add battle options row
        const battleOptionsRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`show_skills_${battleData.id}_${playerData.userId}`)
                    .setLabel('📋 View Skills')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`surrender_${battleData.id}_${playerData.userId}`)
                    .setLabel('🏳️ Surrender')
                    .setStyle(ButtonStyle.Danger)
            );
        
        components.push(battleOptionsRow);
        
        return components;
    }

    // Handle skill usage
    async handleSkillUsage(interaction, battleId, userId, skillIndex) {
        const battleData = this.activeBattles.get(battleId);
        if (!battleData || battleData.status !== 'battle') {
            return interaction.reply({ content: '❌ Battle not found or not active!', ephemeral: true });
        }

        const currentPlayerData = battleData[battleData.currentPlayer];
        if (currentPlayerData.userId !== userId) {
            return interaction.reply({ content: '❌ It\'s not your turn!', ephemeral: true });
        }

        const selectedFruit = currentPlayerData.selectedFruits[skillIndex];
        const ability = balancedDevilFruitAbilities[selectedFruit.fruit_name] || {
            name: 'Basic Attack',
            damage: 100,
            cooldown: 0,
            effect: null,
            accuracy: 85
        };
        
        // Process the attack
        await this.processAttack(interaction, battleData, currentPlayerData, ability, selectedFruit);
    }

    // Process an attack
    async processAttack(interaction, battleData, attacker, ability, fruit) {
        const defender = battleData.currentPlayer === 'player1' ? battleData.player2 : battleData.player1;
        
        // Simple damage calculation (since PvPDamageCalculator might not be available)
        const baseDamage = ability.damage || 100;
        const accuracy = ability.accuracy || 85;
        const hit = Math.random() * 100 <= accuracy;
        
        let damage = 0;
        if (hit) {
            // Apply basic damage scaling
            const cpRatio = Math.min(attacker.balancedCP / defender.balancedCP, 1.5);
            const turnMultiplier = battleData.currentTurn === 1 ? 0.5 : 
                                 battleData.currentTurn === 2 ? 0.7 : 1.0;
            
            damage = Math.floor(baseDamage * cpRatio * turnMultiplier);
            damage = Math.max(5, damage); // Minimum 5 damage
            
            defender.hp = Math.max(0, defender.hp - damage);
        }

        // Create attack message
        let attackMessage = '';
        if (hit) {
            attackMessage = `⚡ **${attacker.username}** uses **${ability.name}**!\n` +
                          `💥 Deals **${damage}** damage to **${defender.username}**!`;
            
            // Apply status effects (basic implementation)
            if (ability.effect) {
                defender.effects.push({
                    name: ability.effect,
                    duration: 2,
                    description: `Affected by ${ability.effect}`
                });
                attackMessage += ` ✨ **${ability.effect} applied!**`;
            }
        } else {
            attackMessage = `⚡ **${attacker.username}** uses **${ability.name}** but misses!`;
        }

        // Add to battle log
        battleData.battleLog.push({
            type: 'attack',
            attacker: attacker.username,
            defender: defender.username,
            ability: ability.name,
            damage: damage,
            hit: hit,
            message: attackMessage,
            timestamp: Date.now(),
            turn: battleData.currentTurn
        });

        // Check for battle end
        if (defender.hp <= 0) {
            await this.endBattle(interaction, battleData, attacker, defender);
            return;
        }

        // Switch turns
        battleData.currentPlayer = battleData.currentPlayer === 'player1' ? 'player2' : 'player1';
        battleData.currentTurn++;

        // Check max turns
        if (battleData.currentTurn > 15) {
            await this.endBattleByTimeout(interaction, battleData);
            return;
        }

        // Process ongoing effects
        this.processOngoingEffects(battleData);

        // Show updated battle interface
        await this.showBattleInterface(interaction, battleData);
    }

    // Process NPC turn automatically
    async processNPCTurn(interaction, battleData) {
        const npcPlayer = battleData.player2;
        const availableFruits = npcPlayer.selectedFruits;
        
        // NPC AI selects a fruit
        const selectedFruitIndex = Math.floor(Math.random() * availableFruits.length);
        const selectedFruit = availableFruits[selectedFruitIndex];
        const ability = balancedDevilFruitAbilities[selectedFruit.fruit_name] || {
            name: 'Boss Attack',
            damage: 120,
            cooldown: 0,
            effect: null,
            accuracy: 85
        };

        await this.processAttack(interaction, battleData, npcPlayer, ability, selectedFruit);
    }

    // Process ongoing effects
    processOngoingEffects(battleData) {
        [battleData.player1, battleData.player2].forEach(player => {
            player.effects = player.effects.filter(effect => {
                // Apply DoT effects
                if (effect.name.includes('burn') || effect.name.includes('poison')) {
                    const dotDamage = effect.name.includes('burn') ? 20 : 15;
                    player.hp = Math.max(0, player.hp - dotDamage);
                    
                    battleData.battleLog.push({
                        type: 'effect',
                        player: player.username,
                        effect: effect.name,
                        damage: dotDamage,
                        message: `🔥 ${player.username} takes ${dotDamage} ${effect.name} damage!`,
                        timestamp: Date.now()
                    });
                }
                
                effect.duration--;
                return effect.duration > 0;
            });
        });
    }

    // End battle with winner
    async endBattle(interaction, battleData, winner, loser) {
        battleData.status = 'ended';
        
        const winnerEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🏆 BATTLE COMPLETE!')
            .setDescription(`**${winner.username}** emerges victorious!`)
            .addFields([
                {
                    name: '🎉 Victory!',
                    value: `**${winner.username}** defeats **${loser.username}**!\n\n` +
                           `**Final HP**: ${winner.hp}/${winner.maxHealth}\n` +
                           `**Turns**: ${battleData.currentTurn}\n` +
                           `**Battle Type**: ${battleData.isVsNPC ? 'PvE' : 'PvP'}`,
                    inline: false
                },
                {
                    name: '📜 Battle Summary',
                    value: this.getBattleSummary(battleData),
                    inline: false
                }
            ])
            .setFooter({ text: 'Great battle! Your legend grows...' })
            .setTimestamp();

        // Award berries for PvE victory
        if (battleData.isVsNPC && winner.userId === battleData.player1.userId) {
            const berryReward = this.calculateBerryReward(battleData.npcBoss.difficulty);
            try {
                await DatabaseManager.updateUserBerries(winner.userId, berryReward, 'PvE Victory');
                
                winnerEmbed.addFields([{
                    name: '💰 Rewards',
                    value: `+${berryReward.toLocaleString()} berries`,
                    inline: true
                }]);
            } catch (error) {
                console.error('Error awarding berries:', error);
            }
        }

        await interaction.editReply({
            embeds: [winnerEmbed],
            components: []
        });

        // Clean up
        this.activeBattles.delete(battleData.id);
    }

    // End battle by timeout
    async endBattleByTimeout(interaction, battleData) {
        const { player1, player2 } = battleData;
        const winner = player1.hp > player2.hp ? player1 : player2;
        const loser = winner === player1 ? player2 : player1;
        
        await this.endBattle(interaction, battleData, winner, loser);
    }

    // Calculate berry reward
    calculateBerryReward(difficulty) {
        const rewards = {
            'Easy': 500,
            'Medium': 1000,
            'Hard': 2000,
            'Very Hard': 4000,
            'Legendary': 7000,
            'Mythical': 10000,
            'Divine': 15000
        };
        
        return rewards[difficulty] || 500;
    }

    // Get effects string
    getEffectsString(effects) {
        if (!effects || effects.length === 0) return 'None';
        return effects.map(e => `${e.name} (${e.duration})`).join(', ');
    }

    // Get recent battle log
    getRecentBattleLog(battleLog) {
        const recent = battleLog.slice(-5); // Last 5 entries
        return recent.map(entry => entry.message).join('\n') || 'Battle starting...';
    }

    // Get battle summary
    getBattleSummary(battleData) {
        const totalAttacks = battleData.battleLog.filter(l => l.type === 'attack').length;
        const totalDamage = battleData.battleLog
            .filter(l => l.type === 'attack' && l.hit)
            .reduce((sum, l) => sum + l.damage, 0);
        
        return `**Total Attacks**: ${totalAttacks}\n` +
               `**Total Damage**: ${totalDamage.toLocaleString()}\n` +
               `**Battle Duration**: ${battleData.currentTurn} turns`;
    }

    // Get active battle for user
    getUserActiveBattle(userId) {
        for (const [battleId, battleData] of this.activeBattles) {
            if (battleData.player1.userId === userId || battleData.player2.userId === userId) {
                return { battleId, battleData };
            }
        }
        return null;
    }

    // Clean up old battles
    cleanupOldBattles() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        for (const [battleId, battleData] of this.activeBattles) {
            if (now - battleData.created > maxAge) {
                this.activeBattles.delete(battleId);
                console.log(`🧹 Cleaned up old battle: ${battleId}`);
            }
        }
    }
}

// Additional handler for interaction events
class PvPInteractionHandler {
    static async handleInteraction(interaction) {
        const customId = interaction.customId;
        const pvpSystem = module.exports;

        try {
            // Handle fruit selection
            if (customId.startsWith('fruit_selection_')) {
                const parts = customId.split('_');
                const battleId = parts[2];
                const userId = parts[3];
                
                await pvpSystem.handleFruitSelection(interaction, battleId, userId);
                return true;
            }

            // Handle skill usage
            if (customId.startsWith('use_skill_')) {
                const parts = customId.split('_');
                const battleId = parts[2];
                const userId = parts[3];
                const skillIndex = parseInt(parts[4]);
                
                await pvpSystem.handleSkillUsage(interaction, battleId, userId, skillIndex);
                return true;
            }

            // Handle battle start
            if (customId.startsWith('start_battle_')) {
                const battleId = customId.replace('start_battle_', '');
                const battleData = pvpSystem.activeBattles.get(battleId);
                
                if (battleData) {
                    await pvpSystem.startTurnBasedBattle(interaction, battleData);
                }
                return true;
            }

            // Handle skill info view
            if (customId.startsWith('show_skills_')) {
                const parts = customId.split('_');
                const battleId = parts[2];
                const userId = parts[3];
                
                await this.showSkillDetails(interaction, battleId, userId, pvpSystem);
                return true;
            }

            // Handle surrender
            if (customId.startsWith('surrender_')) {
                const parts = customId.split('_');
                const battleId = parts[1];
                const userId = parts[2];
                
                await this.handleSurrender(interaction, battleId, userId, pvpSystem);
                return true;
            }

            return false;

        } catch (error) {
            console.error('Error handling PvP interaction:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred during the battle.',
                    ephemeral: true
                });
            }
            return true;
        }
    }

    // Show detailed skill information
    static async showSkillDetails(interaction, battleId, userId, pvpSystem) {
        const battleData = pvpSystem.activeBattles.get(battleId);
        if (!battleData) return;

        const playerData = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        
        const skillsEmbed = new EmbedBuilder()
            .setColor(0x9932CC)
            .setTitle('📋 Your Devil Fruit Abilities')
            .setDescription('Detailed information about your selected fruits and their abilities')
            .setFooter({ text: 'Use these abilities strategically in battle!' });

        playerData.selectedFruits.forEach((fruit, index) => {
            const ability = balancedDevilFruitAbilities[fruit.fruit_name] || {
                name: 'Unknown Ability',
                damage: 100,
                cooldown: 0,
                effect: null,
                description: 'A mysterious devil fruit power',
                accuracy: 85
            };
            const emoji = getRarityEmoji(fruit.fruit_rarity);
            
            let effectText = '';
            if (ability.effect && statusEffects[ability.effect]) {
                const effect = statusEffects[ability.effect];
                effectText = `\n🌟 **Effect**: ${effect.description}`;
                if (effect.duration) effectText += ` (${effect.duration} turns)`;
                if (effect.damage) effectText += ` - ${effect.damage} dmg`;
            }

            skillsEmbed.addFields({
                name: `${index + 1}. ${emoji} ${fruit.fruit_name}`,
                value: [
                    `⚔️ **${ability.name}**`,
                    `💥 **Damage**: ${ability.damage}`,
                    `⏱️ **Cooldown**: ${ability.cooldown} turns`,
                    `🎯 **Accuracy**: ${ability.accuracy || 85}%`,
                    `📝 **Description**: ${ability.description}${effectText}`
                ].join('\n'),
                inline: false
            });
        });

        await interaction.reply({
            embeds: [skillsEmbed],
            ephemeral: true
        });
    }

    // Handle surrender
    static async handleSurrender(interaction, battleId, userId, pvpSystem) {
        const battleData = pvpSystem.activeBattles.get(battleId);
        if (!battleData) return;

        const surrenderingPlayer = battleData.player1.userId === userId ? battleData.player1 : battleData.player2;
        const winner = surrenderingPlayer === battleData.player1 ? battleData.player2 : battleData.player1;

        // Create surrender embed
        const surrenderEmbed = new EmbedBuilder()
            .setColor(0xFF4500)
            .setTitle('🏳️ Battle Ended - Surrender')
            .setDescription(`**${surrenderingPlayer.username}** has surrendered the battle!`)
            .addFields([
                {
                    name: '🏆 Winner',
                    value: `**${winner.username}** wins by surrender!`,
                    inline: true
                },
                {
                    name: '📊 Battle Stats',
                    value: [
                        `**Turns Played**: ${battleData.currentTurn}`,
                        `**Battle Type**: ${battleData.isVsNPC ? 'PvE' : 'PvP'}`,
                        `**${surrenderingPlayer.username} HP**: ${surrenderingPlayer.hp}/${surrenderingPlayer.maxHealth}`,
                        `**${winner.username} HP**: ${winner.hp}/${winner.maxHealth}`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Sometimes retreat is the wisest strategy.' })
            .setTimestamp();

        await interaction.update({
            embeds: [surrenderEmbed],
            components: []
        });

        // Clean up battle
        pvpSystem.activeBattles.delete(battleId);
    }
}

// Create and export the singleton instance
const enhancedTurnBasedPvP = new EnhancedTurnBasedPvP();

// Set up cleanup interval
setInterval(() => {
    enhancedTurnBasedPvP.cleanupOldBattles();
}, 5 * 60 * 1000); // Clean up every 5 minutes

module.exports = enhancedTurnBasedPvP;
module.exports.PvPInteractionHandler = PvPInteractionHandler;
