// src/systems/pvp/index.js - Main PvP System Entry Point
const EnhancedTurnBasedPvP = require('./enhanced-turn-based-pvp');
const PvPBalanceSystem = require('./balance-system');
const NPCBossSystem = require('./npc-bosses');
const PvPQueueSystem = require('./queue-system');

// Initialize the systems
const enhancedPvP = new EnhancedTurnBasedPvP();
const queueSystem = new PvPQueueSystem(enhancedPvP);

// Export everything the commands need
module.exports = {
    // Main systems
    EnhancedTurnBasedPvP: enhancedPvP,
    PvPBalanceSystem,
    NPCBossSystem,
    PvPQueueSystem: queueSystem,
    
    // For compatibility with existing commands
    PvPInteractionHandler: enhancedPvP.interactionHandler,
    activeBattles: enhancedPvP.activeBattles,
    
    // Quick access methods
    async startBattle(interaction, player1, player2 = null) {
        return await enhancedPvP.startBattle(interaction, player1, player2);
    },
    
    async createPvPFighter(userId) {
        return await PvPBalanceSystem.createPvPFighter(userId);
    },
    
    getUserActiveBattle(userId) {
        return enhancedPvP.getUserActiveBattle(userId);
    },
    
    // Queue system methods
    async joinQueue(interaction, fighter) {
        return await queueSystem.joinQueue(interaction, fighter);
    },
    
    async leaveQueue(interaction, userId) {
        return await queueSystem.leaveQueue(interaction, userId);
    },
    
    getQueueStats() {
        return queueSystem.getQueueStats();
    }
};

console.log('✅ PvP System Index loaded - All systems connected!');
