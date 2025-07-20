const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const PvPSystem = require('../systems/pvp');

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
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ PvP System Error')
                .setDescription('An error occurred during PvP command execution!')
                .addFields([
                    {
                        name: '🔧 System Status',
                        value: [
                            `**Balance System**: ${PvPSystem.isLoaded('balance') ? '✅' : '❌'}`,
                            `**Battle System**: ${PvPSystem.isLoaded('battle') ? '✅' : '❌'}`,
                            `**Queue System**: ${PvPSystem.isLoaded('queue') ? '✅' : '❌'}`,
                            `**Error**: ${error.message || 'Unknown error'}`
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setFooter({ text: 'Please try again or contact support.' });
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            }
        }
    }
};
