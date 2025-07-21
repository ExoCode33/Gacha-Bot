// src/systems/pvp/index.js - Fixed Main PvP System Entry Point
const EnhancedTurnBasedPvP = require('./enhanced-turn-based-pvp');
const PvPBalanceSystem = require('./balance-system');
const NPCBossSystem = require('./npc-bosses');

// Create the main PvP system instance
let enhancedPvP = null;
let queueSystem = null;
let isInitialized = false;

// Initialize all systems
async function initialize(client) {
    try {
        console.log('🔄 Initializing Enhanced PvP System...');
        
        // Create the enhanced PvP system
        enhancedPvP = new EnhancedTurnBasedPvP();
        await enhancedPvP.initialize(client);
        
        // Create queue system - import here to avoid circular dependencies
        const PvPQueueSystem = require('./pvp-queue-system');
        queueSystem = new PvPQueueSystem(enhancedPvP);
        
        isInitialized = true;
        console.log('✅ Enhanced PvP System fully initialized');
        return true;
        
    } catch (error) {
        console.error('❌ Failed to initialize Enhanced PvP System:', error);
        isInitialized = false;
        return false;
    }
}

// Shutdown all systems
async function shutdown() {
    try {
        console.log('🛑 Shutting down Enhanced PvP System...');
        
        if (enhancedPvP) {
            await enhancedPvP.shutdown();
        }
        
        if (queueSystem) {
            // Clear queue timers and data
            queueSystem.queue.clear();
            queueSystem.queueTimers.clear();
            queueSystem.cooldowns.clear();
        }
        
        isInitialized = false;
        console.log('✅ Enhanced PvP System shutdown complete');
        
    } catch (error) {
        console.error('❌ Error during PvP system shutdown:', error);
    }
}

// Cleanup function
function cleanup() {
    try {
        if (enhancedPvP) {
            enhancedPvP.cleanup();
        }
        
        if (queueSystem) {
            queueSystem.cleanup();
        }
    } catch (error) {
        console.error('Error during PvP cleanup:', error);
    }
}

// Main exports - using getter functions to ensure systems are initialized
module.exports = {
    // Initialization
    initialize,
    shutdown,
    cleanup,
    
    // System status
    get isInitialized() {
        return isInitialized && enhancedPvP && queueSystem;
    },
    
    // Main systems (with safety checks)
    get EnhancedTurnBasedPvP() {
        return enhancedPvP;
    },
    
    get PvPBalanceSystem() {
        return PvPBalanceSystem;
    },
    
    get NPCBossSystem() {
        return NPCBossSystem;
    },
    
    get queueSystem() {
        return queueSystem;
    },
    
    // For compatibility with existing commands
    get activeBattles() {
        return enhancedPvP ? enhancedPvP.activeBattles : new Map();
    },
    
    // Main system methods with safety checks
    async createFighter(userId) {
        if (!isInitialized || !PvPBalanceSystem) {
            console.error('❌ PvP System not initialized - cannot create fighter');
            return null;
        }
        return await PvPBalanceSystem.createPvPFighter(userId);
    },
    
    async startBattle(interaction, player1, player2 = null) {
        if (!isInitialized || !enhancedPvP) {
            throw new Error('Enhanced PvP System not initialized');
        }
        return await enhancedPvP.startBattle(interaction, player1, player2);
    },
    
    getUserActiveBattle(userId) {
        if (!isInitialized || !enhancedPvP) {
            return null;
        }
        return enhancedPvP.getUserActiveBattle(userId);
    },
    
    // Queue system methods
    async joinQueue(interaction, fighter) {
        if (!isInitialized || !queueSystem) {
            throw new Error('Queue System not initialized');
        }
        return await queueSystem.joinQueue(interaction, fighter);
    },
    
    async leaveQueue(interaction, userId) {
        if (!isInitialized || !queueSystem) {
            throw new Error('Queue System not initialized');
        }
        return await queueSystem.leaveQueue(interaction, userId);
    },
    
    getQueueStats() {
        if (!isInitialized || !queueSystem) {
            return {
                size: 0,
                maxSize: 20,
                averageCP: 0,
                minCP: 0,
                maxCP: 0,
                averageWaitTime: 0
            };
        }
        return queueSystem.getQueueStats();
    },
    
    // Handle interactions
    async handleInteraction(interaction) {
        if (!isInitialized || !enhancedPvP) {
            console.error('❌ PvP System not initialized - cannot handle interaction');
            return false;
        }
        
        try {
            // Check for queue leave button first
            if (interaction.customId && interaction.customId.startsWith('leave_queue_')) {
                const userId = interaction.customId.replace('leave_queue_', '');
                await queueSystem.handleLeaveQueueButton(interaction, userId);
                return true;
            }
            
            // Handle other PvP interactions
            return await enhancedPvP.handleInteraction(interaction);
            
        } catch (error) {
            console.error('Error handling PvP interaction:', error);
            return false;
        }
    },
    
    // System status and info
    getSystemStatus() {
        return {
            initialized: isInitialized,
            activeBattles: enhancedPvP ? enhancedPvP.activeBattles.size : 0,
            queueSize: queueSystem ? queueSystem.queue.size : 0,
            components: {
                enhancedPvP: !!enhancedPvP,
                balanceSystem: !!PvPBalanceSystem,
                npcBossSystem: !!NPCBossSystem,
                queueSystem: !!queueSystem
            }
        };
    },
    
    createSystemInfoEmbed() {
        if (!isInitialized || !enhancedPvP) {
            const { EmbedBuilder } = require('discord.js');
            return new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Enhanced PvP System')
                .setDescription('System not initialized')
                .addFields([
                    {
                        name: '🔧 Status',
                        value: 'Enhanced PvP System is currently unavailable',
                        inline: false
                    }
                ]);
        }
        return enhancedPvP.createSystemInfoEmbed();
    },
    
    // Validation helpers
    validateSystem() {
        const issues = [];
        
        if (!isInitialized) issues.push('System not initialized');
        if (!enhancedPvP) issues.push('Enhanced PvP missing');
        if (!queueSystem) issues.push('Queue system missing');
        if (!PvPBalanceSystem) issues.push('Balance system missing');
        if (!NPCBossSystem) issues.push('NPC boss system missing');
        
        return {
            isValid: issues.length === 0,
            issues
        };
    }
};

console.log('✅ PvP System Index loaded - Ready for initialization!');
