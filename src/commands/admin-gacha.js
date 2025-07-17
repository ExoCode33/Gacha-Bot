// src/commands/admin-gacha.js - Single Admin Command with Essential Options Only
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const DatabaseManager = require('../database/manager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin-gacha')
        .setDescription('🔧 Admin commands for gacha server management')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add_berries')
                .setDescription('💰 Add berries to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to give berries to')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of berries to add')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10000000)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove_berries')
                .setDescription('💸 Remove berries from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove berries from')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of berries to remove')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10000000)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set_berries')
                .setDescription('🎯 Set a user\'s berry balance')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to set berries for')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount to set berries to')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(10000000)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('wipe_database')
                .setDescription('🗑️ Wipe the entire database (DANGEROUS)')
                .addStringOption(option =>
                    option.setName('confirmation')
                        .setDescription('Type "CONFIRM WIPE" to proceed')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        try {
            // Check permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({ 
                    content: '❌ You need Administrator permissions to use this command!', 
                    ephemeral: true 
                });
            }

            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'add_berries':
                    await this.handleAddBerries(interaction);
                    break;
                case 'remove_berries':
                    await this.handleRemoveBerries(interaction);
                    break;
                case 'set_berries':
                    await this.handleSetBerries(interaction);
                    break;
                case 'wipe_database':
                    await this.handleWipeDatabase(interaction);
                    break;
                default:
                    await interaction.reply({ content: '❌ Unknown command!', ephemeral: true });
            }
            
        } catch (error) {
            console.error('Error in admin-gacha command:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while executing the command!', 
                ephemeral: true 
            });
        }
    },

    async handleAddBerries(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        
        if (targetUser.bot) {
            return await interaction.reply({ content: '❌ Cannot give berries to bots!', ephemeral: true });
        }
        
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            
            // Get current balance
            const currentBerries = await DatabaseManager.getUserBerries(targetUser.id);
            
            // Add berries
            const newBalance = await DatabaseManager.updateUserBerries(targetUser.id, amount, 'Admin Addition');
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Berries Added Successfully')
                .setDescription(`Added **${amount.toLocaleString()}** berries to ${targetUser.username}`)
                .addFields([
                    { name: '👤 User', value: targetUser.username, inline: true },
                    { name: '💰 Amount Added', value: `${amount.toLocaleString()}`, inline: true },
                    { name: '📊 Previous Balance', value: `${currentBerries.toLocaleString()}`, inline: true },
                    { name: '💎 New Balance', value: `${newBalance.toLocaleString()}`, inline: true },
                    { name: '👑 Admin', value: interaction.user.username, inline: true }
                ])
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            console.log(`🔧 ADMIN: ${interaction.user.username} added ${amount} berries to ${targetUser.username}`);
            
        } catch (error) {
            console.error('Error adding berries:', error);
            await interaction.reply({ content: '❌ Failed to add berries!', ephemeral: true });
        }
    },

    async handleRemoveBerries(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        
        if (targetUser.bot) {
            return await interaction.reply({ content: '❌ Cannot remove berries from bots!', ephemeral: true });
        }
        
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            
            // Get current balance
            const currentBerries = await DatabaseManager.getUserBerries(targetUser.id);
            
            if (currentBerries < amount) {
                return await interaction.reply({ 
                    content: `❌ ${targetUser.username} only has ${currentBerries.toLocaleString()} berries!`, 
                    ephemeral: true 
                });
            }
            
            // Remove berries
            const newBalance = await DatabaseManager.updateUserBerries(targetUser.id, -amount, 'Admin Removal');
            
            const embed = new EmbedBuilder()
                .setColor(0xFF4500)
                .setTitle('✅ Berries Removed Successfully')
                .setDescription(`Removed **${amount.toLocaleString()}** berries from ${targetUser.username}`)
                .addFields([
                    { name: '👤 User', value: targetUser.username, inline: true },
                    { name: '💸 Amount Removed', value: `${amount.toLocaleString()}`, inline: true },
                    { name: '📊 Previous Balance', value: `${currentBerries.toLocaleString()}`, inline: true },
                    { name: '💎 New Balance', value: `${newBalance.toLocaleString()}`, inline: true },
                    { name: '👑 Admin', value: interaction.user.username, inline: true }
                ])
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            console.log(`🔧 ADMIN: ${interaction.user.username} removed ${amount} berries from ${targetUser.username}`);
            
        } catch (error) {
            console.error('Error removing berries:', error);
            await interaction.reply({ content: '❌ Failed to remove berries!', ephemeral: true });
        }
    },

    async handleSetBerries(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        
        if (targetUser.bot) {
            return await interaction.reply({ content: '❌ Cannot set berries for bots!', ephemeral: true });
        }
        
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            
            // Get current balance
            const currentBerries = await DatabaseManager.getUserBerries(targetUser.id);
            const difference = amount - currentBerries;
            
            // Set berries
            const newBalance = await DatabaseManager.updateUserBerries(targetUser.id, difference, 'Admin Set Balance');
            
            const embed = new EmbedBuilder()
                .setColor(0x0080FF)
                .setTitle('✅ Berry Balance Set Successfully')
                .setDescription(`Set ${targetUser.username}'s berry balance to **${amount.toLocaleString()}**`)
                .addFields([
                    { name: '👤 User', value: targetUser.username, inline: true },
                    { name: '🎯 Set Amount', value: `${amount.toLocaleString()}`, inline: true },
                    { name: '📊 Previous Balance', value: `${currentBerries.toLocaleString()}`, inline: true },
                    { name: '💎 New Balance', value: `${newBalance.toLocaleString()}`, inline: true },
                    { name: '📈 Difference', value: `${difference > 0 ? '+' : ''}${difference.toLocaleString()}`, inline: true },
                    { name: '👑 Admin', value: interaction.user.username, inline: true }
                ])
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            console.log(`🔧 ADMIN: ${interaction.user.username} set ${targetUser.username}'s berries to ${amount}`);
            
        } catch (error) {
            console.error('Error setting berries:', error);
            await interaction.reply({ content: '❌ Failed to set berries!', ephemeral: true });
        }
    },

    async handleWipeDatabase(interaction) {
        const confirmation = interaction.options.getString('confirmation');
        
        if (confirmation !== 'CONFIRM WIPE') {
            return await interaction.reply({ 
                content: '❌ You must type "CONFIRM WIPE" exactly to proceed with database wipe!', 
                ephemeral: true 
            });
        }
        
        try {
            // Wipe all user data
            await DatabaseManager.query('DELETE FROM income_history');
            await DatabaseManager.query('DELETE FROM user_levels');
            await DatabaseManager.query('DELETE FROM user_devil_fruits');
            await DatabaseManager.query('DELETE FROM users');
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🗑️ Database Wiped Successfully')
                .setDescription('**ALL USER DATA HAS BEEN PERMANENTLY DELETED**')
                .addFields([
                    { name: '🔥 Wiped Tables', value: '• Users\n• Devil Fruits\n• Income History\n• User Levels', inline: true },
                    { name: '👑 Admin', value: interaction.user.username, inline: true },
                    { name: '⚠️ WARNING', value: 'This action cannot be undone!', inline: true }
                ])
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            console.log(`🚨 ADMIN: ${interaction.user.username} WIPED THE ENTIRE DATABASE`);
            
        } catch (error) {
            console.error('Error wiping database:', error);
            await interaction.reply({ content: '❌ Failed to wipe database!', ephemeral: true });
        }
    }
};
