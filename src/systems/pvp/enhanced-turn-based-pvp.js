// src/systems/pvp/enhanced-turn-based-pvp.js - FIXED - Correct require paths
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const DatabaseManager = require('../../database/manager'); // FIXED: Correct path
const PvPBalanceSystem = require('./pvp-balance');
const NPCBossSystem = require('./npc-bosses');
const { getRarityEmoji, getRarityColor } = require('../../data/devil-fruits'); // FIXED: Correct path

// Import helpers
const FruitSelectionHelper = require('./pvp-helpers/fruit-selection-helper');
const BattleInterfaceHelper = require('./pvp-helpers/battle-interface-helper');
const PvPInteractionHandler = require('./pvp-helpers/interaction-handler');

// Import abilities safely
let balancedDevilFruitAbilities = {};
let statusEffects = {};

try {
    const abilitiesData = require('../../data/balanced-devil-fruit-abilities'); // FIXED: Correct path
    balancedDevilFruitAbilities = abilitiesData.balancedDevilFruitAbilities || {};
    statusEffects = abilitiesData.statusEffects || {};
    console.log('✅ Devil Fruit abilities loaded successfully');
} catch (error) {
    console.warn('⚠️ Could not load devil fruit abilities, using fallback system');
    // Create fallback abilities
    balancedDevilFruitAbilities = {
        "Gomu Gomu no Mi": { name: "Gomu Gomu Pistol", damage: 100, cooldown: 1, effect: null, accuracy: 85 }
    };
    statusEffects = {
        "burn_3_turns": { type: "dot", damage: 15, duration: 3, description: "Burning damage over time" }
    };
}

class EnhancedTurnBasedPvP {
    constructor() {
        this.activeBattles = new Map();
        this.playerSelections = new Map();
        this.battleQueue = new Set();
        this.battleCooldowns = new Map();
        
        // Initialize helpers
        this.fruitSelectionHelper = new FruitSelectionHelper(this);
        this.battleInterfaceHelper = new BattleInterfaceHelper(this);
        this.interactionHandler = new PvPInteractionHandler(this);
        
        console.log('⚔️ Enhanced Turn-Based PvP System initialized with 2-page selection');
    }

    // Initialize system
    async initialize(client) {
        this.client = client;
        console.log('⚔️ Enhanced Turn-Based PvP System ready');
    }

    // Shutdown system
    async shutdown() {
        this.activeBattles.clear();
        this.playerSelections.clear();
        this.battleQueue.clear();
        this.battleCooldowns.clear();
        console.log('⚔️ Enhanced Turn-Based PvP System shutdown complete');
    }

    // Generate battle ID
    generateBattleId() {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 5);
        return `${timestamp}_${randomId}`;
    }

    // Start a battle
    async startBattle(interaction, player1Fighter, player2Fighter = null) {
        const battleId = this.generateBattleId();
        
        try {
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
                currentPlayer: Math.random() < 0.5 ? 'player1' : 'player2',
                battleLog: [],
                turnTimeout: null,
                created: Date.now(),
                status: 'fruit_selection',
                publicMessageId: null,
                channelId: interaction.channel?.id,
                guildId: interaction.guild?.id,
                selectionData: {
                    player1: {
                        selectedFruits: [],
                        currentPage: 1,
                        selectionComplete: false,
                        lastUpdate: Date.now()
                    },
                    player2: {
                        selectedFruits: [],
                        currentPage: 1,
                        selectionComplete: isVsNPC,
                        lastUpdate: Date.now()
                    }
                }
            };

            this.activeBattles.set(battleId, battleData);
            console.log(`⚔️ Battle ${battleId} created successfully`);
            
            await this.startFruitSelection(interaction, battleData);
            
            return battleId;

        } catch (error) {
            console.error('Error starting enhanced battle:', error);
            if (this.activeBattles.has(battleId)) {
                this.activeBattles.delete(battleId);
            }
            throw error;
        }
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
            maxHealth: Math.floor(npcBoss.totalCP * 0.8),
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
        try {
            const { getFruitByName } = require('../../data/devil-fruits'); // FIXED: Correct path
            const fruit = getFruitByName(fruitName);
            return fruit?.rarity || 'common';
        } catch (error) {
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
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.deferReply();
            }

            const { player1, player2, isVsNPC } = battleData;
            
            const publicEmbed = this.fruitSelectionHelper.createPublicBattleScreen(battleData);
            
            await interaction.editReply({
                embeds: [publicEmbed]
            });
            
            const publicMessage = await interaction.fetchReply();
            battleData.publicMessageId = publicMessage.id;
            this.activeBattles.set(battleData.id, battleData);

            if (isVsNPC) {
                this.completeNPCSelection(battleData);
            }
            
            await this.fruitSelectionHelper.sendPrivateSelection(interaction, battleData, player1);
            await this.fruitSelectionHelper.updatePublicBattleScreen(interaction, battleData);

        } catch (error) {
            console.error('Error starting fruit selection:', error);
            throw error;
        }
    }

    // Complete NPC selection automatically
    completeNPCSelection(battleData) {
        const npcPlayer = battleData.player2;
        const selectedFruits = npcPlayer.selectedFruits.map(fruitName => ({
            fruit_name: fruitName,
            fruit_rarity: this.getFruitRarity(fruitName)
        }));
        
        battleData.selectionData.player2.selectedFruits = selectedFruits;
        battleData.selectionData.player2.selectionComplete = true;
        battleData.selectionData.player2.lastUpdate = Date.now();
        
        npcPlayer.selectedFruits = selectedFruits;
        this.activeBattles.set(battleData.id, battleData);
    }

    // Handle fruit selection from rarity dropdowns
    async handleFruitSelection(interaction, battleId, userId, rarity) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await this.safeReply(interaction, '❌ Battle not found!', true);
            }

            const result = await this.fruitSelectionHelper.handleFruitSelection(
                interaction, battleData, userId, rarity
            );

            if (result.success) {
                await this.fruitSelectionHelper.updatePublicBattleScreen(interaction, battleData);
            }

        } catch (error) {
            console.error('Error handling fruit selection:', error);
            await this.safeReply(interaction, '❌ Error during fruit selection', true);
        }
    }

    // Handle page switching
    async handlePageSwitch(interaction, battleId, userId) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await this.safeReply(interaction, '❌ Battle not found!', true);
            }

            await this.fruitSelectionHelper.handlePageSwitch(interaction, battleData, userId);
            await this.fruitSelectionHelper.updatePublicBattleScreen(interaction, battleData);

        } catch (error) {
            console.error('Error handling page switch:', error);
            await this.safeReply(interaction, '❌ Error switching pages', true);
        }
    }

    // Handle confirm selection
    async handleConfirmSelection(interaction, battleId, userId) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await this.safeReply(interaction, '❌ Battle not found!', true);
            }

            const result = await this.fruitSelectionHelper.handleConfirmSelection(
                interaction, battleData, userId
            );

            if (result.success && result.allSelected) {
                if (battleData.isVsNPC) {
                    await this.revealBossAndStartBattle(interaction, battleData);
                } else {
                    await this.startTurnBasedBattle(interaction, battleData);
                }
            } else if (result.success) {
                await this.safeUpdate(interaction, {
                    content: '✅ Fruits selected! Waiting for opponent...',
                    embeds: [],
                    components: []
                });
            }

            if (result.success) {
                await this.fruitSelectionHelper.updatePublicBattleScreen(interaction, battleData);
            }

        } catch (error) {
            console.error('Error confirming selection:', error);
            await this.safeReply(interaction, '❌ Error confirming selection', true);
        }
    }

    // Handle clear selection
    async handleClearSelection(interaction, battleId, userId) {
        try {
            const battleData = this.activeBattles.get(battleId);
            if (!battleData) {
                return await this.safeReply(interaction, '❌ Battle not found!', true);
            }

            await this.fruitSelectionHelper.handleClearSelection(interaction, battleData, userId);
            await this.fruitSelectionHelper.updatePublicBattleScreen(interaction, battleData);

        } catch (error) {
            console.error('Error clearing selection:', error);
            await this.safeReply(interaction, '❌ Error clearing selection', true);
        }
    }

    // Reveal boss and start battle
    async revealBossAndStartBattle(interaction, battleData) {
        try {
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
                .setFooter({ text: 'Click "Start Battle" to begin turn-based combat!' })
                .setTimestamp();

            const startButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`start_battle_${battleData.id}`)
                        .setLabel('⚔️ Start Turn-Based Battle!')
                        .setStyle(ButtonStyle.Success)
                );

            await this.safeUpdate(interaction, {
                embeds: [bossEmbed],
                components: [startButton]
            });

        } catch (error) {
            console.error('Error revealing boss:', error);
        }
    }

    // Start the actual turn-based battle
    async startTurnBasedBattle(interaction, battleData) {
        try {
            console.log(`⚔️ Starting turn-based battle interface for ${battleData.id}`);
            
            battleData.status = 'battle';
            
            // Initialize battle properly
            battleData.player1.hp = battleData.player1.maxHealth;
            battleData.player2.hp = battleData.player2.maxHealth;
            battleData.player1.effects = [];
            battleData.player2.effects = [];
            battleData.currentTurn = 1;
            
            battleData.battleLog = [];
            battleData.battleLog.push({
                type: 'battle_start',
                message: `⚔️ **BATTLE BEGINS!** ⚔️`,
                timestamp: Date.now(),
                turn: 0
            });

            // Determine first player
            const firstPlayer = Math.random() < 0.5 ? 'player1' : 'player2';
            battleData.currentPlayer = firstPlayer;
            
            const firstPlayerName = battleData[firstPlayer].username;
            battleData.battleLog.push({
                type: 'first_turn',
                message: `🎲 ${firstPlayerName} wins the dice roll and goes first!`,
                timestamp: Date.now(),
                turn: 0
            });
            
            this.activeBattles.set(battleData.id, battleData);

            // Show the battle interface
            await this.battleInterfaceHelper.showBattleInterface(interaction, battleData);

        } catch (error) {
            console.error('Error starting turn-based battle:', error);
        }
    }

    // Safe interaction reply helper
    async safeReply(interaction, content, ephemeral = false) {
        try {
            if (interaction.replied || interaction.deferred) {
                return await interaction.followUp({
                    content,
                    flags: ephemeral ? MessageFlags.Ephemeral : undefined
                });
            } else {
                return await interaction.reply({
                    content,
                    flags: ephemeral ? MessageFlags.Ephemeral : undefined
                });
            }
        } catch (error) {
            console.error('Error in safe reply:', error);
        }
    }

    // Safe interaction update helper
    async safeUpdate(interaction, payload) {
        try {
            if (interaction.deferred || interaction.replied) {
                return await interaction.editReply(payload);
            } else {
                return await interaction.update(payload);
            }
        } catch (error) {
            console.error('Error in safe update:', error);
            try {
                return await interaction.followUp(payload);
            } catch (followUpError) {
                console.error('Error in fallback followUp:', followUpError);
            }
        }
    }

    // Get active battle for user
    getUserActiveBattle(userId) {
        for (const [battleId, battleData] of this.activeBattles) {
            if (battleData.player1.userId === userId || battleData.player2.userId === userId) {
                return battleData;
            }
        }
        return null;
    }

    // Clean up old battles
    cleanup() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes
        let cleanedCount = 0;
        
        for (const [battleId, battleData] of this.activeBattles) {
            if (now - battleData.created > maxAge) {
                this.activeBattles.delete(battleId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleanup: Removed ${cleanedCount} old battles. Active: ${this.activeBattles.size}`);
        }
    }

    // Expose helpers for external access
    get helpers() {
        return {
            fruitSelection: this.fruitSelectionHelper,
            battleInterface: this.battleInterfaceHelper,
            interaction: this.interactionHandler
        };
    }
}

// Create and export the system
const enhancedTurnBasedPvP = new EnhancedTurnBasedPvP();

// Set up cleanup interval
setInterval(() => {
    enhancedTurnBasedPvP.cleanup();
}, 5 * 60 * 1000);

console.log('✅ Enhanced Turn-Based PvP Core System LOADED - Fixed require paths!');

// Export both the main system and the interaction handler
module.exports = enhancedTurnBasedPvP;
module.exports.PvPInteractionHandler = enhancedTurnBasedPvP.interactionHandler;
module.exports.activeBattles = enhancedTurnBasedPvP.activeBattles;
