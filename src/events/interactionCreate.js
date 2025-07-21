// src/events/interactionCreate.js - Simplified to avoid conflicts with main index.js
const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // This event is now handled in the main index.js to avoid conflicts
        // This file exists for future extension but doesn't interfere with command loading
        
        // Only handle very specific cases here that aren't covered in main index.js
        // For now, we'll let the main index.js handle everything
        return;
    }
};
