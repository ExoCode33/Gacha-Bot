// src/systems/pvp/index.js - FINAL FIX - Self-contained with embedded queue system
const EnhancedTurnBasedPvP = require('./enhanced-turn-based-pvp');
const PvPBalanceSystem = require('./balance-system');
const NPCBossSystem = require('./npc-bosses');

// Embedded Simple Queue System Class
class EmbeddedPvPQueueSystem {
    constructor(enhancedPvPSystem) {
        this.enhancedPvP = enhancedPvPSystem;
        this.queue = new Map();
        this.queueTimers = new Map();
        this.maxQueueSize = 20;
        this.cooldowns = new Map();
        console.log('🎯 Embedded PvP Queue System initialized');
    }

    async joinQueue(interaction, fighter) {
        const userId = fighter.userId;

        if (this.queue.size >= this.maxQueueSize) {
            return await interaction.reply({
                content: `❌ Queue is full! (${this.queue.size}/${this.maxQueueSize})`,
                ephemeral: true
            });
        }

        if (this.queue.has(userId)) {
            return await interaction.reply({
                content: '⚔️ You are already in the matchmaking queue!',
                ephemeral: true
            });
        }

        const queueData = { userId, username: fighter.username, fighter, joinTime: Date.now(), balancedCP: fighter.balancedCP };
        this.queue.set(userId, queueData);
        
        await interaction.deferReply();
        
        const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🎯 Searching for Opponent')
            .setDescription(`**${queueData.username}** is looking for a battle!`)
            .addFields([
                { name: '🏴‍☠️ Your Stats', value: `**Level**: ${fighter.level}\n**CP**: ${fighter.balancedCP.toLocaleString()}\n**Fruits**: ${fighter.fruits.length}`, inline: true },
                { name: '🎯 Queue Status', value: `**Players**: ${this.queue.size}/${this.maxQueueSize}\n**Searching**: 60 seconds\n**Fallback**: Boss battle`, inline: true }
            ]);

        const leaveButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`leave_queue_${userId}`).setLabel('🚪 Leave Queue').setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [embed], components: [leaveButton] });

        const timeoutId = setTimeout(async () => {
            if (this.queue.has(userId)) {
                this.removeFromQueue(userId);
                try {
                    await this.enhancedPvP.startBattle(interaction, fighter, null);
                } catch (error) {
                    console.error('Error starting boss battle:', error);
                }
            }
        }, 60000);

        this.queueTimers.set(userId, timeoutId);
    }

    async leaveQueue(interaction, userId) {
        if (!this.queue.has(userId)) {
            return await interaction.reply({ content: '❌ You are not in queue.', ephemeral: true });
        }
        this.removeFromQueue(userId);
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder().setColor(0xFF8000).setTitle('🚪 Left Queue').setDescription('You have left the matchmaking queue.');
        await interaction.update({ embeds: [embed], components: [] });
    }

    async handleLeaveQueueButton(interaction, userId) {
        if (interaction.user.id !== userId) {
            return await interaction.reply({ content: '❌ You can only interact with your own queue!', ephemeral: true });
        }
        await this.leaveQueue(interaction, userId);
    }

    removeFromQueue(userId) {
        if (this.queue.has(userId)) {
            this.queue.delete(userId);
            if (this.queueTimers.has(userId)) {
                clearTimeout(this.queueTimers.get(userId));
                this.queueTimers.delete(userId);
            }
        }
    }

    getQueueStats() {
        const players = Array.from(this.queue.values());
        const cpValues = players.map(p => p.balancedCP);
        return {
            size: this.queue.size,
            maxSize: this.maxQueueSize,
            averageCP: cpValues.length > 0 ? Math.floor(cpValues.reduce((a, b) => a + b, 0) / cpValues.length) : 0,
            minCP: cpValues.length > 0 ? Math.min(...cpValues) : 0,
            maxCP: cpValues.length > 0 ? Math.max(...cpValues) : 0,
            averageWaitTime: 60
        };
    }

    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [userId, queueData] of this.queue) {
            if (now - queueData.joinTime > 5 * 60 * 1000) {
                this.removeFromQueue(userId);
                cleaned++;
            }
        }
        if (cleaned > 0) console.log(`🧹 Cleaned ${cleaned} old queue entries`);
    }
}

// Main PvP system instance
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
        
        // Create embedded queue system
        queueSystem = new EmbeddedPvPQueueSystem(enhancedPvP);
        
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
        if (enhancedPvP) enhancedPvP.cleanup();
        if (queueSystem) queueSystem.cleanup();
    } catch (error) {
        console.error('Error during PvP cleanup:', error);
    }
}

// Main exports
module.exports = {
    initialize,
    shutdown,
    cleanup,
    
    get isInitialized() {
        return isInitialized && enhancedPvP;
    },
    
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
    
    get activeBattles() {
        return enhancedPvP ? enhancedPvP.activeBattles : new Map();
    },
    
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
            return { size: 0, maxSize: 20, averageCP: 0, minCP: 0, maxCP: 0, averageWaitTime: 0 };
        }
        return queueSystem.getQueueStats();
    },
    
    async handleInteraction(interaction) {
        if (!isInitialized || !enhancedPvP) {
            console.error('❌ PvP System not initialized - cannot handle interaction');
            return false;
        }
        
        try {
            if (interaction.customId && interaction.customId.startsWith('leave_queue_')) {
                const userId = interaction.customId.replace('leave_queue_', '');
                await queueSystem.handleLeaveQueueButton(interaction, userId);
                return true;
            }
            
            return await enhancedPvP.handleInteraction(interaction);
            
        } catch (error) {
            console.error('Error handling PvP interaction:', error);
            return false;
        }
    },
    
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
                .setDescription('System not initialized');
        }
        return enhancedPvP.createSystemInfoEmbed();
    },
    
    validateSystem() {
        const issues = [];
        if (!isInitialized) issues.push('System not initialized');
        if (!enhancedPvP) issues.push('Enhanced PvP missing');
        if (!queueSystem) issues.push('Queue system missing');
        if (!PvPBalanceSystem) issues.push('Balance system missing');
        if (!NPCBossSystem) issues.push('NPC boss system missing');
        
        return { isValid: issues.length === 0, issues };
    }
};

console.log('✅ PvP System Index loaded - Ready for initialization!');
