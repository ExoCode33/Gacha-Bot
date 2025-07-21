// src/commands/debug-queue.js - Debug Queue Command for NPC Boss Testing
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const DatabaseManager = require('../database/manager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug-queue')
        .setDescription('Add an NPC boss to the PvP queue for testing')
        .addStringOption(option =>
            option.setName('boss')
                .setDescription('Select which NPC boss to add to queue')
                .setRequired(true)
                .addChoices(
                    { name: 'Shadow Lord', value: 'shadow_lord' },
                    { name: 'Fire Drake', value: 'fire_drake' },
                    { name: 'Ice Queen', value: 'ice_queen' },
                    { name: 'Thunder King', value: 'thunder_king' },
                    { name: 'Earth Titan', value: 'earth_titan' },
                    { name: 'Wind Sage', value: 'wind_sage' },
                    { name: 'Dark Phantom', value: 'dark_phantom' },
                    { name: 'Light Guardian', value: 'light_guardian' }
                ))
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Level of the NPC boss (1-100)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const bossType = interaction.options.getString('boss');
            const level = interaction.options.getInteger('level') || 50;

            // Check if user has admin permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ You need administrator permissions to use this command!',
                    ephemeral: true
                });
            }

            // Get NPC boss data
            const npcBoss = await this.createNPCBoss(bossType, level);
            
            if (!npcBoss) {
                return interaction.reply({
                    content: '❌ Failed to create NPC boss!',
                    ephemeral: true
                });
            }

            // Add NPC boss to queue
            const queueResult = await this.addNPCToQueue(npcBoss, interaction.guild.id);

            if (!queueResult.success) {
                return interaction.reply({
                    content: `❌ Failed to add NPC boss to queue: ${queueResult.error}`,
                    ephemeral: true
                });
            }

            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('🤖 NPC Boss Added to Queue')
                .setDescription(`**${npcBoss.name}** has been added to the PvP queue for testing!`)
                .addFields(
                    { name: '👑 Boss', value: npcBoss.name, inline: true },
                    { name: '⭐ Level', value: level.toString(), inline: true },
                    { name: '🎯 Queue Position', value: queueResult.position.toString(), inline: true },
                    { name: '💪 Power Level', value: npcBoss.power.toLocaleString(), inline: true },
                    { name: '❤️ HP', value: npcBoss.hp.toLocaleString(), inline: true },
                    { name: '⚡ MP', value: npcBoss.mp.toLocaleString(), inline: true }
                )
                .setColor('#FF6B6B')
                .setThumbnail(npcBoss.avatar)
                .setFooter({ 
                    text: `Debug Mode • Queue ID: ${queueResult.queueId}`,
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Send notification to PvP channel if it exists
            const pvpChannelId = await DatabaseManager.getGuildSetting(interaction.guild.id, 'pvp_channel');
            if (pvpChannelId) {
                const pvpChannel = interaction.guild.channels.cache.get(pvpChannelId);
                if (pvpChannel) {
                    const notificationEmbed = new EmbedBuilder()
                        .setTitle('🚨 Debug: NPC Boss in Queue!')
                        .setDescription(`A wild **${npcBoss.name}** (Level ${level}) has entered the PvP queue!\n\nUse \`/queue join\` to battle this NPC boss!`)
                        .setColor('#FFA500')
                        .setThumbnail(npcBoss.avatar)
                        .setFooter({ text: 'Debug Mode - NPC Boss' });

                    await pvpChannel.send({ embeds: [notificationEmbed] });
                }
            }

        } catch (error) {
            console.error('Error in debug-queue command:', error);
            await interaction.reply({
                content: '❌ An error occurred while adding NPC boss to queue!',
                ephemeral: true
            });
        }
    },

    async createNPCBoss(bossType, level) {
        const bossTemplates = {
            shadow_lord: {
                name: 'Shadow Lord Malphas',
                element: 'Dark',
                avatar: 'https://i.imgur.com/shadow_lord.png',
                baseStats: { hp: 1500, mp: 800, attack: 120, defense: 100, speed: 85 }
            },
            fire_drake: {
                name: 'Inferno Drake Pyrion',
                element: 'Fire',
                avatar: 'https://i.imgur.com/fire_drake.png',
                baseStats: { hp: 1300, mp: 600, attack: 140, defense: 80, speed: 95 }
            },
            ice_queen: {
                name: 'Frost Queen Glaciera',
                element: 'Ice',
                avatar: 'https://i.imgur.com/ice_queen.png',
                baseStats: { hp: 1200, mp: 900, attack: 100, defense: 120, speed: 70 }
            },
            thunder_king: {
                name: 'Storm King Raijin',
                element: 'Lightning',
                avatar: 'https://i.imgur.com/thunder_king.png',
                baseStats: { hp: 1100, mp: 700, attack: 130, defense: 90, speed: 110 }
            },
            earth_titan: {
                name: 'Stone Titan Gaia',
                element: 'Earth',
                avatar: 'https://i.imgur.com/earth_titan.png',
                baseStats: { hp: 1800, mp: 500, attack: 110, defense: 150, speed: 50 }
            },
            wind_sage: {
                name: 'Tempest Sage Zephyr',
                element: 'Wind',
                avatar: 'https://i.imgur.com/wind_sage.png',
                baseStats: { hp: 1000, mp: 1000, attack: 90, defense: 70, speed: 130 }
            },
            dark_phantom: {
                name: 'Void Phantom Umbra',
                element: 'Dark',
                avatar: 'https://i.imgur.com/dark_phantom.png',
                baseStats: { hp: 900, mp: 800, attack: 150, defense: 60, speed: 120 }
            },
            light_guardian: {
                name: 'Divine Guardian Seraph',
                element: 'Light',
                avatar: 'https://i.imgur.com/light_guardian.png',
                baseStats: { hp: 1600, mp: 700, attack: 80, defense: 140, speed: 75 }
            }
        };

        const template = bossTemplates[bossType];
        if (!template) return null;

        // Scale stats based on level
        const levelMultiplier = 1 + (level - 1) * 0.1; // 10% increase per level

        const npcBoss = {
            id: `npc_${bossType}_${Date.now()}`,
            name: template.name,
            level: level,
            element: template.element,
            avatar: template.avatar,
            isNPC: true,
            hp: Math.floor(template.baseStats.hp * levelMultiplier),
            mp: Math.floor(template.baseStats.mp * levelMultiplier),
            attack: Math.floor(template.baseStats.attack * levelMultiplier),
            defense: Math.floor(template.baseStats.defense * levelMultiplier),
            speed: Math.floor(template.baseStats.speed * levelMultiplier),
            power: 0, // Will be calculated
            abilities: this.getNPCAbilities(bossType, level),
            ai_difficulty: this.getAIDifficulty(level)
        };

        // Calculate power level
        npcBoss.power = Math.floor(
            (npcBoss.hp * 0.3) + 
            (npcBoss.mp * 0.2) + 
            (npcBoss.attack * 2) + 
            (npcBoss.defense * 1.5) + 
            (npcBoss.speed * 1.2)
        );

        return npcBoss;
    },

    getNPCAbilities(bossType, level) {
        const abilityTemplates = {
            shadow_lord: [
                { name: 'Shadow Strike', damage: 150, cost: 30, type: 'dark' },
                { name: 'Dark Void', damage: 200, cost: 50, type: 'dark' },
                { name: 'Shadow Heal', heal: 300, cost: 40, type: 'dark' }
            ],
            fire_drake: [
                { name: 'Flame Breath', damage: 180, cost: 35, type: 'fire' },
                { name: 'Inferno Blast', damage: 220, cost: 55, type: 'fire' },
                { name: 'Fire Shield', shield: 250, cost: 45, type: 'fire' }
            ],
            ice_queen: [
                { name: 'Ice Shard', damage: 140, cost: 25, type: 'ice' },
                { name: 'Blizzard', damage: 190, cost: 60, type: 'ice' },
                { name: 'Frost Armor', defense: 50, cost: 40, type: 'ice' }
            ],
            thunder_king: [
                { name: 'Lightning Bolt', damage: 160, cost: 30, type: 'lightning' },
                { name: 'Thunder Storm', damage: 210, cost: 65, type: 'lightning' },
                { name: 'Electric Charge', speed: 30, cost: 35, type: 'lightning' }
            ],
            earth_titan: [
                { name: 'Rock Slam', damage: 170, cost: 40, type: 'earth' },
                { name: 'Earthquake', damage: 200, cost: 70, type: 'earth' },
                { name: 'Stone Skin', defense: 80, cost: 50, type: 'earth' }
            ],
            wind_sage: [
                { name: 'Wind Blade', damage: 130, cost: 20, type: 'wind' },
                { name: 'Tornado', damage: 180, cost: 55, type: 'wind' },
                { name: 'Haste Wind', speed: 50, cost: 30, type: 'wind' }
            ],
            dark_phantom: [
                { name: 'Void Strike', damage: 200, cost: 45, type: 'dark' },
                { name: 'Shadow Clone', evasion: 40, cost: 50, type: 'dark' },
                { name: 'Life Drain', damage: 120, heal: 120, cost: 40, type: 'dark' }
            ],
            light_guardian: [
                { name: 'Holy Light', damage: 110, cost: 25, type: 'light' },
                { name: 'Divine Judgment', damage: 250, cost: 80, type: 'light' },
                { name: 'Healing Grace', heal: 400, cost: 60, type: 'light' }
            ]
        };

        const abilities = abilityTemplates[bossType] || [];
        const levelBonus = Math.floor(level / 10);

        // Scale abilities based on level
        return abilities.map(ability => ({
            ...ability,
            damage: ability.damage ? ability.damage + (levelBonus * 10) : undefined,
            heal: ability.heal ? ability.heal + (levelBonus * 15) : undefined,
            cost: ability.cost + levelBonus
        }));
    },

    getAIDifficulty(level) {
        if (level <= 20) return 'easy';
        if (level <= 50) return 'medium';
        if (level <= 80) return 'hard';
        return 'nightmare';
    },

    async addNPCToQueue(npcBoss, guildId) {
        try {
            // Add to PvP queue database
            const queueEntry = {
                user_id: npcBoss.id,
                guild_id: guildId,
                character_data: JSON.stringify(npcBoss),
                queue_type: 'ranked',
                is_npc: true,
                joined_at: new Date(),
                power_level: npcBoss.power
            };

            const result = await DatabaseManager.addToQueue(queueEntry);
            
            if (result.success) {
                return {
                    success: true,
                    queueId: result.queueId,
                    position: result.position
                };
            } else {
                return {
                    success: false,
                    error: result.error
                };
            }
        } catch (error) {
            console.error('Error adding NPC to queue:', error);
            return {
                success: false,
                error: 'Database error'
            };
        }
    }
};
