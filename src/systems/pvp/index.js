const DatabaseManager = require('../../database/manager');
const { getRarityEmoji, getRarityColor } = require('../../data/devil-fruits');

// Load subsystems
const BalanceSystem = require('./balance');
const QueueSystem = require('./queue');
const BattleSystem = require('./battle');
const NPCBosses = require('./npc-bosses');
const InteractionHandler = require('./interaction-handler');

class PvPSystem {
    constructor() {
        this.balance = new BalanceSystem();
        this.queue = new QueueSystem(this);
        this.battle = new BattleSystem(this);
        this.npcBosses = new NPCBosses();
        this.interactionHandler = new InteractionHandler(this);
        
        this.activeBattles = new Map();
        this.loadedSystems = new Set();
        
        this.init();
    }

    async init() {
        try {
            await this.balance.init();
            this.loadedSystems.add('balance');
            console.log('✅ PvP Balance System loaded');
        } catch (error) {
            console.error('❌ Failed to load Balance System:', error.message);
        }

        try {
            await this.queue.init();
            this.loadedSystems.add('queue');
            console.log('✅ PvP Queue System loaded');
        } catch (error) {
            console.error('❌ Failed to load Queue System:', error.message);
        }

        try {
            await this.battle.init();
            this.loadedSystems.add('battle');
            console.log('✅ PvP Battle System loaded');
        } catch (error) {
            console.error('❌ Failed to load Battle System:', error.message);
        }

        console.log('⚔️ PvP System initialized with', this.loadedSystems.size, 'subsystems');
    }

    isLoaded(systemName) {
        return this.loadedSystems.has(systemName);
    }

    // Main PvP functions
    async joinQueue(interaction) {
        if (!this.isLoaded('queue') || !this.isLoaded('balance')) {
            return interaction.reply({
                content: '❌ PvP system is not fully loaded. Please try again later.',
                ephemeral: true
            });
        }

        const fighter = await this.balance.createFighter(interaction.user.id);
        if (!fighter) {
            return interaction.reply({
                content: '❌ You need at least 5 Devil Fruits to participate in PvP battles!',
                ephemeral: true
            });
        }

        await this.queue.join(interaction, fighter);
    }

    async challenge(interaction, opponent) {
        if (!this.isLoaded('battle') || !this.isLoaded('balance')) {
            return interaction.reply({
                content: '❌ PvP challenge system is not available.',
                ephemeral: true
            });
        }

        if (opponent.bot) {
            return interaction.reply({
                content: '❌ You cannot challenge a bot!',
                ephemeral: true
            });
        }

        if (opponent.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot challenge yourself!',
                ephemeral: true
            });
        }

        const challenger = await this.balance.createFighter(interaction.user.id);
        const defender = await this.balance.createFighter(opponent.id);

        if (!challenger || !defender) {
            return interaction.reply({
                content: '❌ Both players need at least 5 Devil Fruits for PvP battles!',
                ephemeral: true
            });
        }

        await this.battle.startChallenge(interaction, challenger, defender);
    }

    async quickBattle(interaction, opponent) {
        if (!this.isLoaded('balance')) {
            return interaction.reply({
                content: '❌ Quick battle system is not available.',
                ephemeral: true
            });
        }

        const fighter1 = await this.balance.createFighter(interaction.user.id);
        const fighter2 = await this.balance.createFighter(opponent.id);

        if (!fighter1 || !fighter2) {
            return interaction.reply({
                content: '❌ Both users need at least 5 Devil Fruits to battle!',
                ephemeral: true
            });
        }

        await this.balance.simulateQuickBattle(interaction, fighter1, fighter2);
    }

    async showStats(interaction, user) {
        if (!this.isLoaded('balance')) {
            return interaction.reply({
                content: '❌ Stats system is not available.',
                ephemeral: true
            });
        }

        const fighter = await this.balance.createFighter(user.id);
        
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle(`⚔️ ${user.username}'s PvP Stats`)
            .setThumbnail(user.displayAvatarURL());

        if (!fighter) {
            embed.setDescription('❌ This user needs more Devil Fruits to participate in PvP!')
                .addFields([
                    {
                        name: '📋 Requirements',
                        value: '• Minimum 5 Devil Fruits\n• Use `/pull` to get more fruits',
                        inline: false
                    }
                ]);
        } else {
            embed.setDescription('🏴‍☠️ Ready for battle!')
                .addFields([
                    {
                        name: '⚔️ Battle Stats',
                        value: [
                            `**Level**: ${fighter.level}`,
                            `**Balanced CP**: ${fighter.balancedCP.toLocaleString()}`,
                            `**Battle HP**: ${fighter.maxHealth}`,
                            `**Total Fruits**: ${fighter.fruits.length}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🎯 PvP Status',
                        value: [
                            `**Battle Ready**: ✅ Yes`,
                            `**In Queue**: ${this.queue?.isInQueue(user.id) ? '🎯 Yes' : '❌ No'}`,
                            `**Active Battle**: ${this.getActiveBattle(user.id) ? '⚔️ Yes' : '❌ No'}`,
                            `**System Status**: ${this.loadedSystems.size}/3 loaded`
                        ].join('\n'),
                        inline: true
                    }
                ]);
        }

        await interaction.reply({ embeds: [embed] });
    }

    async showStatus(interaction) {
        const queueStats = this.queue?.getStats() || { size: 0, maxSize: 0 };
        const battleCount = this.activeBattles.size;

        const embed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('🎯 PvP System Status')
            .setDescription('Current status of the Devil Fruit PvP Battle System')
            .addFields([
                {
                    name: '🔧 System Components',
                    value: [
                        `**Balance System**: ${this.isLoaded('balance') ? '✅ Active' : '❌ Inactive'}`,
                        `**Queue System**: ${this.isLoaded('queue') ? '✅ Active' : '❌ Inactive'}`,
                        `**Battle System**: ${this.isLoaded('battle') ? '✅ Active' : '❌ Inactive'}`,
                        `**Interaction Handler**: ${this.interactionHandler ? '✅ Active' : '❌ Inactive'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📊 Current Activity',
                    value: [
                        `**Queue Size**: ${queueStats.size}/${queueStats.maxSize}`,
                        `**Active Battles**: ${battleCount}`,
                        `**Average Queue CP**: ${queueStats.averageCP?.toLocaleString() || 'N/A'}`,
                        `**System Mode**: Enhanced Turn-Based`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎮 Available Commands',
                    value: [
                        `\`/pvp queue\` - Join matchmaking`,
                        `\`/pvp challenge @user\` - Challenge player`,
                        `\`/pvp quick @user\` - Quick simulation`,
                        `\`/pvp stats\` - View your stats`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Use /pvp queue to start battling!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    // Utility functions
    getActiveBattle(userId) {
        for (const [battleId, battleData] of this.activeBattles) {
            if (battleData.player1?.userId === userId || battleData.player2?.userId === userId) {
                return battleData;
            }
        }
        return null;
    }

    // Handle interactions
    async handleInteraction(interaction) {
        if (this.interactionHandler) {
            return await this.interactionHandler.handle(interaction);
        }
        return false;
    }

    // Cleanup
    cleanup() {
        if (this.queue) this.queue.cleanup();
        if (this.battle) this.battle.cleanup();
        
        // Clean old battles
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        for (const [battleId, battleData] of this.activeBattles) {
            if (now - battleData.created > maxAge) {
                this.activeBattles.delete(battleId);
            }
        }
    }
}

// Create and export singleton instance
const pvpSystem = new PvPSystem();

// Set up cleanup interval
setInterval(() => {
    pvpSystem.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes

module.exports = pvpSystem;
