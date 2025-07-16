// src/commands/admin.js - Admin Commands for Berry Management
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const DatabaseManager = require('../database/manager');
const EconomySystem = require('../systems/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('🔧 Admin commands for server management')
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
                        .setMaxValue(1000000)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for adding berries')
                        .setRequired(false)
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
                        .setMaxValue(1000000)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for removing berries')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set_berries')
                .setDescription('🎯 Set a user\'s berry balance to a specific amount')
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
                        .setMaxValue(1000000)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for setting berries')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('user_info')
                .setDescription('ℹ️ Get detailed user information')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to get info for')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('server_stats')
                .setDescription('📊 Get detailed server statistics')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset_income')
                .setDescription('🔄 Reset a user\'s income cooldown')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to reset income for')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        try {
            // Double-check permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Permission Denied')
                    .setDescription('You need **Administrator** permissions to use this command!')
                    .setFooter({ text: 'Contact a server administrator for help.' });
                
                return await interaction.reply({ embeds: [embed], ephemeral: true });
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
                case 'user_info':
                    await this.handleUserInfo(interaction);
                    break;
                case 'server_stats':
                    await this.handleServerStats(interaction);
                    break;
                case 'reset_income':
                    await this.handleResetIncome(interaction);
                    break;
                default:
                    await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
            }
            
        } catch (error) {
            console.error('Error in admin command:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Admin Command Error')
                .setDescription('An error occurred while executing the admin command!')
                .setFooter({ text: 'Check the console for details.' });
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },

    async handleAddBerries(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason') || 'Admin addition';
        
        if (targetUser.bot) {
            return await interaction.reply({ content: '❌ Cannot give berries to bots!', ephemeral: true });
        }
        
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            
            // Get current balance
            const currentBerries = await DatabaseManager.getUserBerries(targetUser.id);
            
            // Add berries
            const newBalance = await EconomySystem.addBerries(targetUser.id, amount, `Admin: ${reason}`);
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Berries Added Successfully')
                .setDescription(`Added **${amount.toLocaleString()}** berries to ${targetUser.username}`)
                .addFields([
                    { name: '👤 User', value: `${targetUser.username} (${targetUser.id})`, inline: true },
                    { name: '💰 Amount Added', value: `${amount.toLocaleString()} berries`, inline: true },
                    { name: '📊 Previous Balance', value: `${currentBerries.toLocaleString()} berries`, inline: true },
                    { name: '💎 New Balance', value: `${newBalance.toLocaleString()} berries`, inline: true },
                    { name: '📝 Reason', value: reason, inline: true },
                    { name: '👑 Admin', value: `${interaction.user.username}`, inline: true }
                ])
                .setFooter({ text: 'Admin action logged' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            // Log the action
            console.log(`🔧 ADMIN: ${interaction.user.username} added ${amount} berries to ${targetUser.username} (${reason})`);
            
        } catch (error) {
            console.error('Error adding berries:', error);
            await interaction.reply({ content: '❌ Failed to add berries!', ephemeral: true });
        }
    },

    async handleRemoveBerries(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason') || 'Admin removal';
        
        if (targetUser.bot) {
            return await interaction.reply({ content: '❌ Cannot remove berries from bots!', ephemeral: true });
        }
        
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            
            // Get current balance
            const currentBerries = await DatabaseManager.getUserBerries(targetUser.id);
            
            if (currentBerries < amount) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF8000)
                    .setTitle('⚠️ Insufficient Berries')
                    .setDescription(`${targetUser.username} only has **${currentBerries.toLocaleString()}** berries!\nCannot remove **${amount.toLocaleString()}** berries.`)
                    .setFooter({ text: 'Use /admin set_berries to set a specific amount instead.' });
                
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            // Remove berries
            const newBalance = await EconomySystem.removeBerries(targetUser.id, amount, `Admin: ${reason}`);
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setColor(0xFF4500)
                .setTitle('✅ Berries Removed Successfully')
                .setDescription(`Removed **${amount.toLocaleString()}** berries from ${targetUser.username}`)
                .addFields([
                    { name: '👤 User', value: `${targetUser.username} (${targetUser.id})`, inline: true },
                    { name: '💸 Amount Removed', value: `${amount.toLocaleString()} berries`, inline: true },
                    { name: '📊 Previous Balance', value: `${currentBerries.toLocaleString()} berries`, inline: true },
                    { name: '💎 New Balance', value: `${newBalance.toLocaleString()} berries`, inline: true },
                    { name: '📝 Reason', value: reason, inline: true },
                    { name: '👑 Admin', value: `${interaction.user.username}`, inline: true }
                ])
                .setFooter({ text: 'Admin action logged' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            // Log the action
            console.log(`🔧 ADMIN: ${interaction.user.username} removed ${amount} berries from ${targetUser.username} (${reason})`);
            
        } catch (error) {
            console.error('Error removing berries:', error);
            await interaction.reply({ content: '❌ Failed to remove berries!', ephemeral: true });
        }
    },

    async handleSetBerries(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason') || 'Admin set';
        
        if (targetUser.bot) {
            return await interaction.reply({ content: '❌ Cannot set berries for bots!', ephemeral: true });
        }
        
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            
            // Get current balance
            const currentBerries = await DatabaseManager.getUserBerries(targetUser.id);
            const difference = amount - currentBerries;
            
            // Set berries by calculating the difference
            let newBalance;
            if (difference > 0) {
                newBalance = await EconomySystem.addBerries(targetUser.id, difference, `Admin Set: ${reason}`);
            } else if (difference < 0) {
                newBalance = await EconomySystem.removeBerries(targetUser.id, Math.abs(difference), `Admin Set: ${reason}`);
            } else {
                newBalance = currentBerries; // No change needed
            }
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setColor(0x0080FF)
                .setTitle('✅ Berry Balance Set Successfully')
                .setDescription(`Set ${targetUser.username}'s berry balance to **${amount.toLocaleString()}**`)
                .addFields([
                    { name: '👤 User', value: `${targetUser.username} (${targetUser.id})`, inline: true },
                    { name: '🎯 Set Amount', value: `${amount.toLocaleString()} berries`, inline: true },
                    { name: '📊 Previous Balance', value: `${currentBerries.toLocaleString()} berries`, inline: true },
                    { name: '💎 New Balance', value: `${newBalance.toLocaleString()} berries`, inline: true },
                    { name: '📈 Difference', value: `${difference > 0 ? '+' : ''}${difference.toLocaleString()} berries`, inline: true },
                    { name: '📝 Reason', value: reason, inline: true },
                    { name: '👑 Admin', value: `${interaction.user.username}`, inline: true }
                ])
                .setFooter({ text: 'Admin action logged' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            // Log the action
            console.log(`🔧 ADMIN: ${interaction.user.username} set ${targetUser.username}'s berries to ${amount} (${reason})`);
            
        } catch (error) {
            console.error('Error setting berries:', error);
            await interaction.reply({ content: '❌ Failed to set berries!', ephemeral: true });
        }
    },

    async handleUserInfo(interaction) {
        const targetUser = interaction.options.getUser('user');
        
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            
            // Get user data
            const user = await DatabaseManager.getUser(targetUser.id);
            const fruits = await DatabaseManager.getUserDevilFruits(targetUser.id);
            const incomeInfo = await EconomySystem.getIncomeInfo(targetUser.id);
            
            if (!user) {
                return await interaction.reply({ content: '❌ User not found!', ephemeral: true });
            }
            
            // Calculate statistics
            const uniqueFruits = new Set(fruits.map(f => f.fruit_id)).size;
            const totalFruits = fruits.length;
            const duplicates = totalFruits - uniqueFruits;
            
            // Get income history
            const incomeHistory = await DatabaseManager.query(`
                SELECT SUM(amount) as total_auto, COUNT(*) as auto_count
                FROM income_history 
                WHERE user_id = $1 AND income_type = 'automatic'
            `, [targetUser.id]);
            
            const manualHistory = await DatabaseManager.query(`
                SELECT SUM(amount) as total_manual, COUNT(*) as manual_count
                FROM income_history 
                WHERE user_id = $1 AND income_type = 'manual'
            `, [targetUser.id]);
            
            const embed = new EmbedBuilder()
                .setColor(0x0080FF)
                .setTitle(`🔍 Admin User Info - ${targetUser.username}`)
                .addFields([
                    { name: '👤 User Info', value: `**ID:** ${targetUser.id}\n**Username:** ${targetUser.username}\n**Bot:** ${targetUser.bot ? 'Yes' : 'No'}`, inline: true },
                    { name: '⭐ Level & CP', value: `**Level:** ${user.level}\n**Base CP:** ${user.base_cp.toLocaleString()}\n**Total CP:** ${user.total_cp.toLocaleString()}`, inline: true },
                    { name: '💰 Economy', value: `**Berries:** ${user.berries.toLocaleString()}\n**Total Earned:** ${user.total_earned.toLocaleString()}\n**Total Spent:** ${user.total_spent.toLocaleString()}`, inline: true },
                    { name: '🍈 Devil Fruits', value: `**Total Fruits:** ${totalFruits}\n**Unique Fruits:** ${uniqueFruits}\n**Duplicates:** ${duplicates}`, inline: true },
                    { name: '📈 Income Info', value: `**Hourly Rate:** ${incomeInfo?.hourlyIncome.toLocaleString() || 0}\n**Manual Available:** ${incomeInfo?.canCollectManual ? 'Yes' : 'No'}\n**Next Collection:** ${incomeInfo?.nextManualCollection || 0}m`, inline: true },
                    { name: '📊 Income History', value: `**Auto Income:** ${incomeHistory.rows[0]?.total_auto?.toLocaleString() || 0} (${incomeHistory.rows[0]?.auto_count || 0}x)\n**Manual Income:** ${manualHistory.rows[0]?.total_manual?.toLocaleString() || 0} (${manualHistory.rows[0]?.manual_count || 0}x)`, inline: true },
                    { name: '📅 Timestamps', value: `**Created:** <t:${Math.floor(new Date(user.created_at).getTime() / 1000)}:R>\n**Updated:** <t:${Math.floor(new Date(user.updated_at).getTime() / 1000)}:R>\n**Last Income:** <t:${Math.floor(new Date(user.last_income).getTime() / 1000)}:R>`, inline: false }
                ])
                .setFooter({ text: `Admin query by ${interaction.user.username}` })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
            
        } catch (error) {
            console.error('Error getting user info:', error);
            await interaction.reply({ content: '❌ Failed to get user info!', ephemeral: true });
        }
    },

    async handleServerStats(interaction) {
        try {
            const stats = await EconomySystem.getServerStats();
            
            // Get additional stats
            const topUsers = await DatabaseManager.getLeaderboard('cp', 3);
            const richestUsers = await DatabaseManager.getLeaderboard('berries', 3);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('📊 Server Statistics')
                .addFields([
                    { name: '👥 Users', value: `**Total Users:** ${stats.totalUsers}\n**Active Users:** ${stats.totalUsers}`, inline: true },
                    { name: '🍈 Devil Fruits', value: `**Total Collected:** ${stats.totalFruits}\n**Average per User:** ${(stats.totalFruits / Math.max(stats.totalUsers, 1)).toFixed(1)}`, inline: true },
                    { name: '💰 Economy', value: `**Total Berries:** ${stats.totalBerries.toLocaleString()}\n**Pull Cost:** ${stats.pullCost.toLocaleString()}\n**Base Income:** ${stats.baseIncome}/hour`, inline: true },
                    { name: '⚙️ Settings', value: `**Income Rate:** ${stats.incomeRate} per CP\n**Manual Multiplier:** ${stats.manualIncomeMultiplier}x\n**Manual Cooldown:** ${stats.manualIncomeCooldown}m`, inline: true },
                    { name: '🏆 Top CP Users', value: topUsers.map((u, i) => `${i + 1}. ${u.username}: ${u.total_cp.toLocaleString()}`).join('\n') || 'None', inline: true },
                    { name: '💎 Richest Users', value: richestUsers.map((u, i) => `${i + 1}. ${u.username}: ${u.berries.toLocaleString()}`).join('\n') || 'None', inline: true }
                ])
                .setFooter({ text: `Admin query by ${interaction.user.username}` })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
            
        } catch (error) {
            console.error('Error getting server stats:', error);
            await interaction.reply({ content: '❌ Failed to get server stats!', ephemeral: true });
        }
    },

    async handleResetIncome(interaction) {
        const targetUser = interaction.options.getUser('user');
        
        if (targetUser.bot) {
            return await interaction.reply({ content: '❌ Cannot reset income for bots!', ephemeral: true });
        }
        
        try {
            // Ensure user exists
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            
            // Reset last income time to allow immediate collection
            await DatabaseManager.query(`
                UPDATE users 
                SET last_income = NOW() - INTERVAL '2 hours'
                WHERE user_id = $1
            `, [targetUser.id]);
            
            // Delete recent manual income records to reset cooldown
            await DatabaseManager.query(`
                DELETE FROM income_history 
                WHERE user_id = $1 AND income_type = 'manual' 
                AND created_at > NOW() - INTERVAL '2 hours'
            `, [targetUser.id]);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Income Reset Successfully')
                .setDescription(`Reset income cooldown for ${targetUser.username}`)
                .addFields([
                    { name: '👤 User', value: `${targetUser.username} (${targetUser.id})`, inline: true },
                    { name: '🔄 Reset Type', value: 'Manual income cooldown', inline: true },
                    { name: '✅ Status', value: 'Can now collect income immediately', inline: true },
                    { name: '👑 Admin', value: `${interaction.user.username}`, inline: true }
                ])
                .setFooter({ text: 'Admin action logged' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            // Log the action
            console.log(`🔧 ADMIN: ${interaction.user.username} reset income cooldown for ${targetUser.username}`);
            
        } catch (error) {
            console.error('Error resetting income:', error);
            await interaction.reply({ content: '❌ Failed to reset income!', ephemeral: true });
        }
    }
};
