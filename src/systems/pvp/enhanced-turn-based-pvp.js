// src/systems/pvp/enhanced-turn-based-pvp.js - Fixed imports
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const DatabaseManager = require('../../database/manager');
const PvPBalanceSystem = require('./balance-system');
const NPCBossSystem = require('./npc-bosses');
const { getRarityEmoji, getRarityColor } = require('../../data/devil-fruits');

// Import helpers with correct paths
const FruitSelectionHelper = require('./pvp-helpers/fruit-selection-helper');
const BattleInterfaceHelper = require('./pvp-helpers/battle-interface-helper');
const PvPInteractionHandler = require('./pvp-helpers/interaction-handler');

// Import abilities safely
let balancedDevilFruitAbilities = {};
let statusEffects = {};

try {
    const abilitiesData = require('../../data/balanced-devil-fruit-abilities');
    balancedDevilFruitAbabilities = abilitiesData.balancedDevilFruitAbilities || {};
    statusEffects = abilitiesData.statusEffects || {};
    console.log('✅ Devil Fruit abilities loaded for PvP system');
} catch (error) {
    console.warn('⚠️ Could not load devil fruit abilities, using fallback system');
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
        
        // Initialize helpers - pass 'this' so they can access the main system
        this.fruitSelectionHelper = new FruitSelectionHelper(this);
        this.battleInterfaceHelper = new BattleInterfaceHelper(this);
        this.interactionHandler = new PvPInteractionHandler(this);
        
        console.log('⚔️ Enhanced Turn-Based PvP System initialized with modular helpers');
    }

    // Generate unique battle ID
    generateBattleId() {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 5);
        return `${timestamp}_${randomId}`;
    }

    // Start a new battle
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
                        currentPage: 'high',
                        selectionComplete: false,
                        lastUpdate: Date.now()
                    },
                    player2: {
                        selectedFruits: [],
                        currentPage: 'high', 
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
            const { getFruitByName } = require('../../data/devil-fruits');
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
            // Ensure we have a proper response first
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

    // Delegate to fruit selection helper
    async handleFruitSelection(interaction, battleId, userId, rarity) {
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
    }

    // Delegate to fruit selection helper
    async handlePageSwitch(interaction, battleId, userId) {
        const battleData = this.activeBattles.get(battleId);
        if (!battleData) {
            return await this.safeReply(interaction, '❌ Battle not found!', true);
        }

        await this.fruitSelectionHelper.handlePageSwitch(interaction, battleData, userId);
        await this.fruitSelectionHelper.updatePublicBattleScreen(interaction, battleData);
    }

    // Delegate to fruit selection helper
    async handleConfirmSelection(interaction, battleId, userId) {
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
    }

    // Delegate to fruit selection helper
    async handleClearSelection(interaction, battleId, userId) {
        const battleData = this.activeBattles.get(battleId);
        if (!battleData) {
            return await this.safeReply(interaction, '❌ Battle not found!', true);
        }

        await this.fruitSelectionHelper.handleClearSelection(interaction, battleData, userId);
        await this.fruitSelectionHelper.updatePublicBattleScreen(interaction, battleData);
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

    // Safe interaction helpers
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
    cleanupOldBattles() {
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

    // Handle interactions (delegate to interaction handler)
    async handleInteraction(interaction) {
        return await this.interactionHandler.handleInteraction(interaction);
    }

    // Initialize system
    async initialize(client) {
        this.client = client;
        console.log('⚔️ Enhanced Turn-Based PvP System initialized');
        return true;
    }

    // Check if system is initialized
    get isInitialized() {
        return true;
    }

    // Get system status
    getSystemStatus() {
        return {
            initialized: true,
            activeBattles: this.activeBattles.size,
            components: {
                fruitSelection: !!this.fruitSelectionHelper,
                battleInterface: !!this.battleInterfaceHelper,
                interactionHandler: !!this.interactionHandler
            }
        };
    }

    // Shutdown system
    async shutdown() {
        console.log('🛑 Shutting down Enhanced Turn-Based PvP System...');
        this.activeBattles.clear();
        console.log('✅ Enhanced Turn-Based PvP System shutdown complete');
    }

    // Cleanup method for periodic maintenance
    cleanup() {
        this.cleanupOldBattles();
    }

    // Create system info embed
    createSystemInfoEmbed() {
        const status = this.getSystemStatus();
        
        return new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('⚔️ Enhanced PvP System Status')
            .setDescription('Real-time turn-based Devil Fruit battles with fruit selection')
            .addFields([
                {
                    name: '🎮 System Status',
                    value: [
                        `**Status**: ${status.initialized ? '✅ Active' : '❌ Inactive'}`,
                        `**Active Battles**: ${status.activeBattles}`,
                        `**Fruit Selection**: ${status.components.fruitSelection ? '✅' : '❌'}`,
                        `**Battle Interface**: ${status.components.battleInterface ? '✅' : '❌'}`,
                        `**Interaction Handler**: ${status.components.interactionHandler ? '✅' : '❌'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🔥 Features',
                    value: [
                        `🎯 **Enhanced Matchmaking Queue**`,
                        `⚔️ **Real-time Turn-Based Combat**`,
                        `🍈 **High/Low Rarity Fruit Selection**`,
                        `🤖 **Balanced NPC Boss Battles**`,
                        `📱 **Live Interface Updates**`,
                        `🏆 **Berry Rewards for PvE**`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({ text: 'Enhanced PvP System v3.0' })
            .setTimestamp();
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

// Export as class for instantiation
module.exports = EnhancedTurnBasedPvP;
