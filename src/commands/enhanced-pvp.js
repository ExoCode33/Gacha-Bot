// src/commands/enhanced-pvp.js - FIXED Enhanced PvP Command that loads properly
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DatabaseManager = require('../database/manager');
const PvPBalanceSystem = require('../systems/pvp-balance');

// Simple battle tracking for compatibility
const activeBattles = new Map();
const battleQueue = new Set();
const battleCooldowns = new Map();

// Enhanced turn-based system - FORCE LOAD
let EnhancedTurnBasedPvP = null;
let PvPInteractionHandler = null;

try {
    // Force require the enhanced system
    const enhancedPvPModule = require('../systems/enhanced-turn-based-pvp');
    EnhancedTurnBasedPvP = enhancedPvPModule;
    PvPInteractionHandler = enhancedPvPModule.PvPInteractionHandler;
    
    console.log('✅ Enhanced Turn-Based PvP system successfully loaded');
    console.log('✅ PvP Interaction Handler successfully loaded');
} catch (error) {
    console.error('❌ FAILED to load Enhanced Turn-Based PvP system:', error);
    console.log('❌ This should not happen - check enhanced-turn-based-pvp.js file');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp')
        .setDescription('⚔️ Enhanced Devil Fruit Turn-Based PvP Battle System')
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('🔥 Join enhanced turn-based battle queue with real-time combat!')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('challenge')
                .setDescription('⚔️ Challenge another player to enhanced turn-based PvP')
                .addUserOption(option => 
                    option.setName('opponent')
                        .setDescription('The pirate to challenge to turn-based combat')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('quick')
                .setDescription('⚡ Quick battle simulation (instant result, no turn-based combat)')
                .addUserOption(option => 
                    option.setName('opponent')
                        .setDescription('The pirate to simulate battle against')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 View your enhanced PvP battle stats')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('View another user\'s battle stats')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('🚪 Leave the battle queue')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('system')
                .setDescription('🔧 View enhanced turn-based PvP system information')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case
