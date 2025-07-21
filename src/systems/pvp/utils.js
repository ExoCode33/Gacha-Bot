// src/systems/pvp/utils.js - PvP Utility Functions
const { EmbedBuilder, MessageFlags } = require('discord.js');
const { getRarityEmoji, getRarityColor } = require('../../data/devil-fruits');

class PvPUtils {
    // Safe interaction reply/update helper
    static async safeReply(interaction, content, ephemeral = false) {
        try {
            if (interaction.replied || interaction.deferred) {
