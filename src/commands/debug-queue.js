const { SlashCommandBuilder } = require('discord.js');
const EnhancedPvPSystem = require('../systems/pvp/enhanced-pvp');

// Initialize PvP system (you might want to move this to a global instance)
const pvpSystem = new EnhancedPvPSystem();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug-queue')
        .setDescription('Challenge another player to an enhanced PvP battle (debug version)')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The player you want to challenge')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        
        // Validation
        if (targetUser.id === interaction.user.id) {
            return await interaction.reply({
                content: '❌ You cannot challenge yourself!',
                ephemeral: true
            });
        }

        await interaction.deferReply();
        
        try {
            const battleId = await pvpSystem.createPvPChallenge(interaction, targetUser, 'enhanced');
            console.log(`Created enhanced PvP challenge: ${battleId}`);
        } catch (error) {
            console.error('Error creating PvP challenge:', error);
            await interaction.followUp({
                content: '❌ An error occurred while creating the challenge. Please try again.',
                ephemeral: true
            });
        }
    },

    // Export the pvpSystem instance so other files can access it
    pvpSystem
};
