// src/commands/admin.js - Consolidated Admin Command with All Functions
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const DatabaseManager = require('../database/manager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('🔧 Admin commands for server management')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-berries')
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
                .setName('remove-berries')
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
                .setName('set-berries')
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
                .setName('give-fruit')
                .setDescription('🍈 Give a specific Devil Fruit to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to give the fruit to')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('fruit')
                        .setDescription('Name of the Devil Fruit')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-level')
                .setDescription('⭐ Set a user\'s level')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to set level for')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('level')
                        .setDescription('Level to set (0-50)')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(50)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('server-stats')
                .setDescription('📊 View server statistics')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('user-info')
                .setDescription('🔍 View detailed user information')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to inspect')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('wipe-database')
                .setDescription('🗑️ Wipe the entire database (DANGEROUS)')
                .addStringOption(option =>
                    option.setName('confirmation')
                        .setDescription('Type "CONFIRM WIPE" to proceed')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reload-economy')
                .setDescription('🔄 Reload economy configuration from environment')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('force-update-cp')
                .setDescription('⚡ Force recalculate CP for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to recalculate CP for')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        try {
            // Check permissions (extra security)
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({ 
                    content: '❌ You need Administrator permissions to use admin commands!', 
                    ephemeral: true 
                });
            }

            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'add-berries':
                    await this.handleAddBerries(interaction);
                    break;
                case 'remove-berries':
                    await this.handleRemoveBerries(interaction);
                    break;
                case 'set-berries':
                    await this.handleSetBerries(interaction);
                    break;
                case 'give-fruit':
                    await this.handleGiveFruit(interaction);
                    break;
                case 'set-level':
                    await this.handleSetLevel(interaction);
                    break;
                case 'server-stats':
                    await this.handleServerStats(interaction);
                    break;
                case 'user-info':
                    await this.handleUserInfo(interaction);
                    break;
                case 'wipe-database':
                    await this.handleWipeDatabase(interaction);
                    break;
                case 'reload-economy':
                    await this.handleReloadEconomy(interaction);
                    break;
                case 'force-update-cp':
                    await this.handleForceUpdateCP(interaction);
                    break;
                default:
                    await interaction.reply({ content: '❌ Unknown admin command!', ephemeral: true });
            }
            
        } catch (error) {
            console.error('Error in admin command:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while executing the admin command!', 
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
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            const currentBerries = await DatabaseManager.getUserBerries(targetUser.id);
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
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            const currentBerries = await DatabaseManager.getUserBerries(targetUser.id);
            
            if (currentBerries < amount) {
                return await interaction.reply({ 
                    content: `❌ ${targetUser.username} only has ${currentBerries.toLocaleString()} berries!`, 
                    ephemeral: true 
                });
            }
            
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
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            const currentBerries = await DatabaseManager.getUserBerries(targetUser.id);
            const difference = amount - currentBerries;
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

    async handleGiveFruit(interaction) {
        const targetUser = interaction.options.getUser('user');
        const fruitName = interaction.options.getString('fruit');
        
        if (targetUser.bot) {
            return await interaction.reply({ content: '❌ Cannot give Devil Fruits to bots!', ephemeral: true });
        }
        
        try {
            // Load Devil Fruits data
            const { getFruitByName } = require('../data/devil-fruits');
            const fruit = getFruitByName(fruitName);
            
            if (!fruit) {
                return await interaction.reply({ content: '❌ Invalid Devil Fruit name!', ephemeral: true });
            }
            
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            const result = await DatabaseManager.addDevilFruit(targetUser.id, fruit);
            
            const embed = new EmbedBuilder()
                .setColor(0x8B4513)
                .setTitle('✅ Devil Fruit Given Successfully')
                .setDescription(`Gave **${fruit.name}** to ${targetUser.username}`)
                .addFields([
                    { name: '👤 User', value: targetUser.username, inline: true },
                    { name: '🍈 Devil Fruit', value: fruit.name, inline: true },
                    { name: '⭐ Rarity', value: fruit.rarity, inline: true },
                    { name: '📊 Status', value: result.isNewFruit ? 'New Fruit!' : `Duplicate (${result.duplicateCount})`, inline: true },
                    { name: '👑 Admin', value: interaction.user.username, inline: true }
                ])
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            console.log(`🔧 ADMIN: ${interaction.user.username} gave ${fruit.name} to ${targetUser.username}`);
            
        } catch (error) {
            console.error('Error giving Devil Fruit:', error);
            await interaction.reply({ content: '❌ Failed to give Devil Fruit!', ephemeral: true });
        }
    },

    async handleSetLevel(interaction) {
        const targetUser = interaction.options.getUser('user');
        const level = interaction.options.getInteger('level');
        
        if (targetUser.bot) {
            return await interaction.reply({ content: '❌ Cannot set level for bots!', ephemeral: true });
        }
        
        try {
            const { calculateBaseCPFromLevel } = require('../data/devil-fruits');
            const LevelSystem = require('../systems/levels');
            
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            const baseCp = calculateBaseCPFromLevel(level);
            
            await DatabaseManager.updateUserLevel(targetUser.id, level, `Level-${level}`, baseCp);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('✅ Level Set Successfully')
                .setDescription(`Set ${targetUser.username}'s level to **${level}**`)
                .addFields([
                    { name: '👤 User', value: targetUser.username, inline: true },
                    { name: '⭐ New Level', value: `${level}`, inline: true },
                    { name: '💎 Base CP', value: `${baseCp.toLocaleString()}`, inline: true },
                    { name: '👑 Admin', value: interaction.user.username, inline: true }
                ])
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            console.log(`🔧 ADMIN: ${interaction.user.username} set ${targetUser.username}'s level to ${level}`);
            
        } catch (error) {
            console.error('Error setting level:', error);
            await interaction.reply({ content: '❌ Failed to set level!', ephemeral: true });
        }
    },

    async handleServerStats(interaction) {
        try {
            const stats = await DatabaseManager.getServerStats();
            
            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('📊 Server Statistics')
                .setDescription('Comprehensive server data overview')
                .addFields([
                    { name: '👥 Total Users', value: `${stats.totalUsers.toLocaleString()}`, inline: true },
                    { name: '🍈 Total Fruits', value: `${stats.totalFruits.toLocaleString()}`, inline: true },
                    { name: '💰 Total Berries', value: `${stats.totalBerries.toLocaleString()}`, inline: true },
                    { name: '📈 Server Activity', value: `${stats.totalUsers > 0 ? 'Active' : 'Inactive'}`, inline: true },
                    { name: '👑 Admin', value: interaction.user.username, inline: true },
                    { name: '⏰ Generated', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                ])
                .setFooter({ text: 'Server statistics generated by admin command' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error getting server stats:', error);
            await interaction.reply({ content: '❌ Failed to get server statistics!', ephemeral: true });
        }
    },

    async handleUserInfo(interaction) {
        const targetUser = interaction.options.getUser('user');
        
        try {
            const userData = await DatabaseManager.getUser(targetUser.id);
            const userFruits = await DatabaseManager.getUserDevilFruits(targetUser.id);
            
            if (!userData) {
                return await interaction.reply({ content: '❌ User not found in database!', ephemeral: true });
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x9932CC)
                .setTitle(`🔍 User Information - ${targetUser.username}`)
                .setDescription('Detailed user data for administrative review')
                .addFields([
                    { name: '👤 Username', value: targetUser.username, inline: true },
                    { name: '🆔 User ID', value: targetUser.id, inline: true },
                    { name: '⭐ Level', value: `${userData.level || 0}`, inline: true },
                    { name: '💎 Base CP', value: `${userData.base_cp?.toLocaleString() || 0}`, inline: true },
                    { name: '🔥 Total CP', value: `${userData.total_cp?.toLocaleString() || 0}`, inline: true },
                    { name: '💰 Berries', value: `${userData.berries?.toLocaleString() || 0}`, inline: true },
                    { name: '🍈 Total Fruits', value: `${userFruits.length}`, inline: true },
                    { name: '📊 Account Status', value: 'Active', inline: true },
                    { name: '⏰ Created', value: userData.created_at ? `<t:${Math.floor(new Date(userData.created_at).getTime() / 1000)}:R>` : 'Unknown', inline: true }
                ])
                .setThumbnail(targetUser.displayAvatarURL())
                .setFooter({ text: `Admin inspection by ${interaction.user.username}` })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error getting user info:', error);
            await interaction.reply({ content: '❌ Failed to get user information!', ephemeral: true });
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
    },

    async handleReloadEconomy(interaction) {
        try {
            const EconomySystem = require('../systems/economy');
            EconomySystem.updateConfigFromEnv();
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔄 Economy Configuration Reloaded')
                .setDescription('Economy settings have been updated from environment variables')
                .addFields([
                    { name: '👑 Admin', value: interaction.user.username, inline: true },
                    { name: '⏰ Reloaded', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                ])
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            console.log(`🔧 ADMIN: ${interaction.user.username} reloaded economy configuration`);
            
        } catch (error) {
            console.error('Error reloading economy:', error);
            await interaction.reply({ content: '❌ Failed to reload economy configuration!', ephemeral: true });
        }
    },

    async handleForceUpdateCP(interaction) {
        const targetUser = interaction.options.getUser('user');
        
        if (targetUser.bot) {
            return await interaction.reply({ content: '❌ Cannot update CP for bots!', ephemeral: true });
        }
        
        try {
            await DatabaseManager.ensureUser(targetUser.id, targetUser.username, interaction.guild?.id);
            const oldCP = await DatabaseManager.getUser(targetUser.id);
            const newCP = await DatabaseManager.recalculateUserCP(targetUser.id);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF8000)
                .setTitle('⚡ CP Recalculated Successfully')
                .setDescription(`Force updated CP for ${targetUser.username}`)
                .addFields([
                    { name: '👤 User', value: targetUser.username, inline: true },
                    { name: '📊 Previous CP', value: `${oldCP.total_cp?.toLocaleString() || 0}`, inline: true },
                    { name: '🔥 New CP', value: `${newCP.toLocaleString()}`, inline: true },
                    { name: '📈 Difference', value: `${((newCP - (oldCP.total_cp || 0)) > 0 ? '+' : '')}${(newCP - (oldCP.total_cp || 0)).toLocaleString()}`, inline: true },
                    { name: '👑 Admin', value: interaction.user.username, inline: true }
                ])
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            console.log(`🔧 ADMIN: ${interaction.user.username} force updated CP for ${targetUser.username}`);
            
        } catch (error) {
            console.error('Error updating CP:', error);
            await interaction.reply({ content: '❌ Failed to update CP!', ephemeral: true });
        }
    },

    // Autocomplete handler for Devil Fruit names
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        
        if (focusedOption.name === 'fruit') {
            try {
                const { getAllFruits } = require('../data/devil-fruits');
                const allFruits = getAllFruits();
                
                const filtered = allFruits
                    .filter(fruit => fruit.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
                    .slice(0, 25) // Discord limit
                    .map(fruit => ({
                        name: fruit.name,
                        value: fruit.name
                    }));
                
                await interaction.respond(filtered);
            } catch (error) {
                console.error('Error in autocomplete:', error);
                await interaction.respond([]);
            }
        }
    }
};
