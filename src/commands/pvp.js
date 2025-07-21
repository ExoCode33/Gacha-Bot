// src/commands/pvp.js - Fixed Complete PvP Command
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pvp')
        .setDescription('⚔️ Devil Fruit PvP Battle System')
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('🎯 Join matchmaking queue for balanced battles')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('challenge')
                .setDescription('⚔️ Challenge another player to PvP')
                .addUserOption(option => 
                    option.setName('opponent')
                        .setDescription('The pirate to challenge')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('quick')
                .setDescription('⚡ Quick battle simulation (instant result)')
                .addUserOption(option => 
                    option.setName('opponent')
                        .setDescription('The pirate to battle')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 View PvP battle stats')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('View another user\'s stats')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('📋 Check PvP system status and queue info')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            // Import PvP system with error handling
            let PvPSystem;
            try {
                PvPSystem = require('../systems/pvp');
                if (!PvPSystem) {
                    throw new Error('PvP System not loaded');
                }
            } catch (error) {
                console.error('Failed to load PvP System:', error);
                return await this.handleSystemError(interaction, 'PvP System is not available');
            }

            // Execute subcommand
            switch (subcommand) {
                case 'queue':
                    await PvPSystem.joinQueue(interaction);
                    break;
                
                case 'challenge':
                    const opponent = interaction.options.getUser('opponent');
                    await PvPSystem.challenge(interaction, opponent);
                    break;
                
                case 'quick':
                    const target = interaction.options.getUser('opponent');
                    await PvPSystem.quickBattle(interaction, target);
                    break;
                
                case 'stats':
                    const user = interaction.options.getUser('user') || interaction.user;
                    await PvPSystem.showStats(interaction, user);
                    break;
                
                case 'status':
                    await PvPSystem.showStatus(interaction);
                    break;
                
                default:
                    await interaction.reply({
                        content: '❌ Unknown PvP command.',
                        ephemeral: true
                    });
            }

        } catch (error) {
            console.error('Error in PvP command:', error);
            await this.handleCommandError(interaction, error);
        }
    },

    async handleSystemError(interaction, message) {
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ PvP System Error')
            .setDescription(message)
            .addFields([
                {
                    name: '🔧 System Status',
                    value: [
                        '**PvP System**: ❌ Not Available',
                        '**Reason**: System initialization failed',
                        '**Action Required**: Contact administrator',
                        '**Alternative**: Try again later'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '💡 Alternatives',
                    value: [
                        '• Use `/pull` to collect more Devil Fruits',
                        '• Use `/collection` to view your fruits',
                        '• Use `/stats` to check your CP',
                        '• Try `/pvp status` to check system status'
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'The PvP system will be restored as soon as possible.' })
            .setTimestamp();

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            await interaction.followUp({ embeds: [embed], ephemeral: true });
        }
    },

    async handleCommandError(interaction, error) {
        console.error('PvP Command Error Details:', {
            command: interaction.commandName,
            subcommand: interaction.options.getSubcommand(),
            user: interaction.user.username,
            error: error.message,
            stack: error.stack
        });

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ PvP Command Error')
            .setDescription('An error occurred while executing the PvP command!')
            .addFields([
                {
                    name: '🐛 Error Details',
                    value: [
                        `**Command**: /pvp ${interaction.options.getSubcommand()}`,
                        `**User**: ${interaction.user.username}`,
                        `**Error**: ${error.message || 'Unknown error'}`,
                        `**Time**: ${new Date().toISOString()}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🔄 What to try next',
                    value: [
                        '• Wait a moment and try again',
                        '• Check `/pvp status` for system info',
                        '• Use `/pull` to ensure you have 5+ fruits',
                        '• Contact support if the issue persists'
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ text: 'Error logged for investigation.' })
            .setTimestamp();

        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            }
        } catch (replyError) {
            console.error('Failed to send error response:', replyError);
        }
    }
};
