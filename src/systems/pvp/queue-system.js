// src/systems/pvp/queue-system.js - Fixed Queue System
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const DatabaseManager = require('../../database/manager');

class PvPQueueSystem {
    constructor(enhancedPvPSystem) {
        this.enhancedPvP = enhancedPvPSystem;
        this.queue = new Map(); // userId -> queueData
        this.queueTimers = new Map(); // userId -> timeoutId
        this.maxQueueSize = 20;
        this.matchmakingTime = 2 * 60 * 1000; // 2 minutes
        this.cooldowns = new Map(); // userId -> lastBattleTime
        this.battleCooldown = 5 * 60 * 1000; // 5 minutes between battles
        
        console.log('🎯 Enhanced Matchmaking Queue System initialized');
    }

    // Join the matchmaking queue
    async joinQueue(interaction, fighter) {
        const userId = fighter.userId;
        const username = fighter.username;

        try {
            // Check if queue is full
            if (this.queue.size >= this.maxQueueSize) {
                return await interaction.reply({
                    content: `❌ Queue is full! (${this.queue.size}/${this.maxQueueSize})\nTry again in a few minutes.`,
                    ephemeral: true
                });
            }

            // Check if already in queue
            if (this.queue.has(userId)) {
                return await interaction.reply({
                    content: '⚔️ You are already in the matchmaking queue!',
                    ephemeral: true
                });
            }

            // Check for active battle
            const activeBattle = this.enhancedPvP.getUserActiveBattle(userId);
            if (activeBattle) {
                return await interaction.reply({
                    content: '
