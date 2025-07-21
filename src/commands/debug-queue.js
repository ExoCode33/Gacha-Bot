// src/commands/debug-queue.js - Debug Queue Command for One Piece NPC Bosses
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const DatabaseManager = require('../database/manager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug-queue')
        .setDescription('Add a One Piece NPC boss to the PvP queue for testing')
        .addStringOption(option =>
            option.setName('boss')
                .setDescription('Select which One Piece boss to add to queue')
                .setRequired(true)
                .addChoices(
                    { name: '🏴‍☠️ Monkey D. Luffy (Gear 5)', value: 'luffy_gear5' },
                    { name: '⚔️ Roronoa Zoro (King of Hell)', value: 'zoro_koh' },
                    { name: '🔥 Portgas D. Ace (Flame Emperor)', value: 'ace_flame' },
                    { name: '🌋 Sakazuki (Akainu)', value: 'akainu' },
                    { name: '❄️ Kuzan (Aokiji)', value: 'aokiji' },
                    { name: '⚡ Borsalino (Kizaru)', value: 'kizaru' },
                    { name: '🐉 Kaido (Dragon Form)', value: 'kaido_dragon' },
                    { name: '👑 Charlotte Linlin (Big Mom)', value: 'big_mom' },
                    { name: '🗡️ Dracule Mihawk', value: 'mihawk' },
                    { name: '🌪️ Monkey D. Dragon', value: 'dragon' }
                ))
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Level of the NPC boss (1-100)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(100))
        .addStringOption(option =>
            option.setName('location')
                .setDescription('Battle location')
                .setRequired(false)
                .addChoices(
                    { name: '🏝️ Marineford', value: 'marineford' },
                    { name: '🌊 Grand Line', value: 'grand_line' },
                    { name: '🌸 Wano Country', value: 'wano' },
                    { name: '🍰 Whole Cake Island', value: 'whole_cake' },
                    { name: '🏜️ Alabasta', value: 'alabasta' },
                    { name: '🏞️ Skypiea', value: 'skypiea' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const bossType = interaction.options.getString('boss');
            const level = interaction.options.getInteger('level') || 75;
            const location = interaction.options.getString('location') || 'grand_line';

            // Check if user has admin permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ You need administrator permissions to use this command!',
                    ephemeral: true
                });
            }

            // Get NPC boss data
            const npcBoss = await this.createOnePieceBoss(bossType, level, location);
            
            if (!npcBoss) {
                return interaction.reply({
                    content: '❌ Failed to create One Piece boss!',
                    ephemeral: true
                });
            }

            // Add NPC boss to queue
            const queueResult = await DatabaseManager.addToQueue({
                user_id: npcBoss.id,
                guild_id: interaction.guild.id,
                character_data: npcBoss,
                queue_type: 'ranked',
                is_npc: true,
                joined_at: new Date(),
                power_level: npcBoss.power_level
            });

            if (!queueResult.success) {
                return interaction.reply({
                    content: `❌ Failed to add boss to queue: ${queueResult.error}`,
                    ephemeral: true
                });
            }

            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('🏴‍☠️ One Piece Boss Added to Queue!')
                .setDescription(`**${npcBoss.name}** has entered the battlefield at **${this.getLocationName(location)}**!\n\n*A legendary pirate has challenged all fighters to battle!*`)
                .addFields(
                    { name: '👑 Boss', value: npcBoss.name, inline: true },
                    { name: '🍎 Devil Fruit', value: npcBoss.fruit_type, inline: true },
                    { name: '⭐ Level', value: level.toString(), inline: true },
                    { name: '💪 Power Level', value: npcBoss.power_level.toLocaleString(), inline: true },
                    { name: '❤️ HP', value: npcBoss.hp.toLocaleString(), inline: true },
                    { name: '🌊 Haki', value: npcBoss.mp.toLocaleString(), inline: true },
                    { name: '⚔️ Attack', value: npcBoss.attack.toString(), inline: true },
                    { name: '🛡️ Defense', value: npcBoss.defense.toString(), inline: true },
                    { name: '💨 Speed', value: npcBoss.speed.toString(), inline: true },
                    { name: '🎯 Queue Position', value: `#${queueResult.position}`, inline: true },
                    { name: '🏝️ Location', value: this.getLocationName(location), inline: true },
                    { name: '💰 Bounty', value: `₿${npcBoss.bounty?.toLocaleString() || '???'}`, inline: true }
                )
                .setColor(this.getBossColor(bossType))
                .setThumbnail(npcBoss.avatar_url)
                .setFooter({ 
                    text: `Debug Mode • Queue ID: ${queueResult.queueId} • One Piece Boss Battle`,
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
                        .setTitle('🚨 LEGENDARY CHALLENGE!')
                        .setDescription(`🏴‍☠️ **${npcBoss.name}** (Level ${level}) has appeared at **${this.getLocationName(location)}**!\n\n*"${this.getBossQuote(bossType)}"*\n\n💥 Use \`/queue join\` to accept this legendary challenge!\n💰 Massive bounty rewards await the victor!`)
                        .setColor('#FF0000')
                        .setThumbnail(npcBoss.avatar_url)
                        .setImage(this.getLocationImage(location))
                        .setFooter({ text: `Debug Mode - ${npcBoss.fruit_type} User` });

                    await pvpChannel.send({ 
                        embeds: [notificationEmbed],
                        content: '@everyone 🔥 **LEGENDARY BOSS BATTLE ALERT!** 🔥'
                    });
                }
            }

        } catch (error) {
            console.error('Error in debug-queue command:', error);
            await interaction.reply({
                content: '❌ An error occurred while adding the One Piece boss to queue!',
                ephemeral: true
            });
        }
    },

    async createOnePieceBoss(bossType, level, location) {
        const bossTemplates = {
            luffy_gear5: {
                name: 'Monkey D. Luffy (Gear 5)',
                fruit_type: 'Mythical Zoan - Hito Hito no Mi, Model: Nika',
                element: 'Rubber/Liberation',
                avatar_url: 'https://i.imgur.com/luffy_gear5.png',
                bounty: 3000000000,
                baseStats: { hp: 2000, mp: 1200, attack: 180, defense: 140, speed: 160 },
                hakiTypes: ['Conqueror\'s', 'Armament', 'Observation']
            },
            zoro_koh: {
                name: 'Roronoa Zoro (King of Hell)',
                fruit_type: 'No Devil Fruit - Three Sword Style',
                element: 'Sword/Conqueror\'s Haki',
                avatar_url: 'https://i.imgur.com/zoro_koh.png',
                bounty: 1111000000,
                baseStats: { hp: 1800, mp: 1000, attack: 200, defense: 120, speed: 140 },
                hakiTypes: ['Conqueror\'s', 'Armament', 'Observation']
            },
            ace_flame: {
                name: 'Portgas D. Ace (Flame Emperor)',
                fruit_type: 'Logia - Mera Mera no Mi',
                element: 'Fire',
                avatar_url: 'https://i.imgur.com/ace_flame.png',
                bounty: 550000000,
                baseStats: { hp: 1600, mp: 1400, attack: 170, defense: 110, speed: 150 },
                hakiTypes: ['Armament', 'Observation']
            },
            akainu: {
                name: 'Sakazuki (Akainu)',
                fruit_type: 'Logia - Magu Magu no Mi',
                element: 'Magma',
                avatar_url: 'https://i.imgur.com/akainu.png',
                bounty: 5000000000,
                baseStats: { hp: 2200, mp: 1600, attack: 220, defense: 180, speed: 100 },
                hakiTypes: ['Armament', 'Observation']
            },
            aokiji: {
                name: 'Kuzan (Aokiji)',
                fruit_type: 'Logia - Hie Hie no Mi',
                element: 'Ice',
                avatar_url: 'https://i.imgur.com/aokiji.png',
                bounty: 3000000000,
                baseStats: { hp: 2000, mp: 1500, attack: 180, defense: 160, speed: 110 },
                hakiTypes: ['Armament', 'Observation']
            },
            kizaru: {
                name: 'Borsalino (Kizaru)',
                fruit_type: 'Logia - Pika Pika no Mi',
                element: 'Light',
                avatar_url: 'https://i.imgur.com/kizaru.png',
                bounty: 3000000000,
                baseStats: { hp: 1800, mp: 1400, attack: 190, defense: 130, speed: 250 },
                hakiTypes: ['Armament', 'Observation']
            },
            kaido_dragon: {
                name: 'Kaido of the Beasts (Dragon Form)',
                fruit_type: 'Mythical Zoan - Uo Uo no Mi, Model: Seiryu',
                element: 'Dragon/Lightning',
                avatar_url: 'https://i.imgur.com/kaido_dragon.png',
                bounty: 4611100000,
                baseStats: { hp: 3000, mp: 1800, attack: 250, defense: 200, speed: 120 },
                hakiTypes: ['Conqueror\'s', 'Armament', 'Observation']
            },
            big_mom: {
                name: 'Charlotte Linlin (Big Mom)',
                fruit_type: 'Paramecia - Soru Soru no Mi',
                element: 'Soul',
                avatar_url: 'https://i.imgur.com/big_mom.png',
                bounty: 4388000000,
                baseStats: { hp: 2800, mp: 2000, attack: 230, defense: 190, speed: 90 },
                hakiTypes: ['Conqueror\'s', 'Armament', 'Observation']
            },
            mihawk: {
                name: 'Dracule Mihawk (World\'s Strongest Swordsman)',
                fruit_type: 'No Devil Fruit - Supreme Grade Sword',
                element: 'Sword',
                avatar_url: 'https://i.imgur.com/mihawk.png',
                bounty: 3590000000,
                baseStats: { hp: 1900, mp: 1100, attack: 280, defense: 140, speed: 170 },
                hakiTypes: ['Armament', 'Observation']
            },
            dragon: {
                name: 'Monkey D. Dragon (Revolutionary Leader)',
                fruit_type: 'Unknown Devil Fruit (Wind/Storm)',
                element: 'Wind/Storm',
                avatar_url: 'https://i.imgur.com/dragon.png',
                bounty: 6000000000,
                baseStats: { hp: 2400, mp: 2200, attack: 200, defense: 160, speed: 180 },
                hakiTypes: ['Conqueror\'s', 'Armament', 'Observation']
            }
        };

        const template = bossTemplates[bossType];
        if (!template) return null;

        // Scale stats based on level
        const levelMultiplier = 1 + (level - 1) * 0.15; // 15% increase per level for bosses

        const npcBoss = {
            id: `op_boss_${bossType}_${Date.now()}`,
            name: template.name,
            level: level,
            fruit_type: template.fruit_type,
            element: template.element,
            avatar_url: template.avatar_url,
            bounty: Math.floor(template.bounty * levelMultiplier),
            isNPC: true,
            hp: Math.floor(template.baseStats.hp * levelMultiplier),
            mp: Math.floor(template.baseStats.mp * levelMultiplier),
            attack: Math.floor(template.baseStats.attack * levelMultiplier),
            defense: Math.floor(template.baseStats.defense * levelMultiplier),
            speed: Math.floor(template.baseStats.speed * levelMultiplier),
            power_level: 0, // Will be calculated
            abilities: this.getOnePieceAbilities(bossType, level),
            haki_types: template.hakiTypes,
            ai_difficulty: this.getAIDifficulty(level),
            location: location,
            rarity: level >= 90 ? 'mythic' : level >= 75 ? 'legendary' : level >= 50 ? 'epic' : 'rare'
        };

        // Calculate power level
        npcBoss.power_level = Math.floor(
            (npcBoss.hp * 0.4) + 
            (npcBoss.mp * 0.3) + 
            (npcBoss.attack * 3) + 
            (npcBoss.defense * 2) + 
            (npcBoss.speed * 1.5) +
            (template.hakiTypes.length * 200) // Bonus for Haki mastery
        );

        return npcBoss;
    },

    getOnePieceAbilities(bossType, level) {
        const abilityTemplates = {
            luffy_gear5: [
                { name: 'Gomu Gomu no Bajrang Gun', damage: 300, cost: 80, type: 'physical', description: 'Massive rubber fist attack' },
                { name: 'Liberation Wave', damage: 200, cost: 60, type: 'special', description: 'Reality-bending attack' },
                { name: 'Toon Force Heal', heal: 400, cost: 70, type: 'recovery', description: 'Cartoon-like recovery' }
            ],
            zoro_koh: [
                { name: 'King of Hell Three Sword Style', damage: 350, cost: 90, type: 'sword', description: 'Ultimate three-sword technique' },
                { name: 'Conqueror\'s Haki Coating', damage: 250, cost: 70, type: 'haki', description: 'Haki-infused attack' },
                { name: 'Ashura: Dead Man\'s Game', damage: 400, cost: 100, type: 'ultimate', description: 'Nine-sword demon form' }
            ],
            ace_flame: [
                { name: 'Entei (Flame Emperor)', damage: 280, cost: 85, type: 'fire', description: 'Miniature sun attack' },
                { name: 'Hiken (Fire Fist)', damage: 200, cost: 50, type: 'fire', description: 'Signature fire punch' },
                { name: 'Dai Enkai Entei', damage: 350, cost: 120, type: 'fire', description: 'Great Flame Commandment' }
            ],
            akainu: [
                { name: 'Dai Funka (Great Eruption)', damage: 320, cost: 100, type: 'magma', description: 'Massive magma fist' },
                { name: 'Ryusei Kazan (Meteor Volcano)', damage: 400, cost: 150, type: 'magma', description: 'Magma meteor shower' },
                { name: 'Meigo (Dark Dog)', damage: 250, cost: 70, type: 'magma', description: 'Molten dog attack' }
            ],
            kaido_dragon: [
                { name: 'Boro Breath', damage: 300, cost: 90, type: 'dragon', description: 'Devastating heat breath' },
                { name: 'Thunder Bagua', damage: 350, cost: 100, type: 'lightning', description: 'Lightning-fast club strike' },
                { name: 'Raimei Hakke', damage: 280, cost: 80, type: 'lightning', description: 'Thunder Eight Trigrams' }
            ],
            big_mom: [
                { name: 'Maser Saber', damage: 320, cost: 90, type: 'soul', description: 'Soul-powered laser sword' },
                { name: 'Ikoku Sovereignty', damage: 380, cost: 120, type: 'soul', description: 'Nation-destroying blast' },
                { name: 'Life or Death', damage: 200, cost: 60, type: 'soul', description: 'Soul extraction attack' }
            ],
            mihawk: [
                { name: 'Kokuto Slash', damage: 400, cost: 100, type: 'sword', description: 'Black blade ultimate cut' },
                { name: 'World\'s Strongest Slash', damage: 500, cost: 150, type: 'sword', description: 'Unparalleled sword technique' },
                { name: 'Yoru\'s Edge', damage: 250, cost: 60, type: 'sword', description: 'Supreme grade sword strike' }
            ],
            dragon: [
                { name: 'Revolutionary Storm', damage: 300, cost: 90, type: 'wind', description: 'World-changing tempest' },
                { name: 'Wind Blade Barrage', damage: 220, cost: 70, type: 'wind', description: 'Cutting wind attacks' },
                { name: 'Weather Control', heal: 300, cost: 80, type: 'wind', description: 'Environmental manipulation' }
            ]
        };

        const abilities = abilityTemplates[bossType] || [
            { name: 'Devil Fruit Mastery', damage: 200, cost: 50, type: 'special' },
            { name: 'Haki Blast', damage: 150, cost: 40, type: 'haki' }
        ];

        const levelBonus = Math.floor(level / 10);

        // Scale abilities based on level
        return abilities.map(ability => ({
            ...ability,
            damage: ability.damage ? ability.damage + (levelBonus * 20) : undefined,
            heal: ability.heal ? ability.heal + (levelBonus * 25) : undefined,
            cost: ability.cost + levelBonus * 2
        }));
    },

    getAIDifficulty(level) {
        if (level <= 25) return 'rookie';
        if (level <= 50) return 'veteran';
        if (level <= 75) return 'elite';
        if (level <= 90) return 'legendary';
        return 'yonko';
    },

    getBossColor(bossType) {
        const colors = {
            luffy_gear5: '#FFFFFF',      // White for Gear 5
            zoro_koh: '#006400',         // Dark Green for Zoro
            ace_flame: '#FF4500',        // Orange Red for Fire
            akainu: '#8B0000',           // Dark Red for Magma
            aokiji: '#87CEEB',           // Sky Blue for Ice
            kizaru: '#FFD700',           // Gold for Light
            kaido_dragon: '#4B0082',     // Indigo for Dragon
            big_mom: '#FF1493',          // Deep Pink for Big Mom
            mihawk: '#2F4F4F',           // Dark Slate Gray for Mihawk
            dragon: '#228B22'            // Forest Green for Dragon
        };
        return colors[bossType] || '#FF6B6B';
    },

    getBossQuote(bossType) {
        const quotes = {
            luffy_gear5: "I'm gonna be the Pirate King! Gear 5!",
            zoro_koh: "I'll become the world's strongest swordsman!",
            ace_flame: "I am the son of the Pirate King!",
            akainu: "Absolute Justice will prevail!",
            aokiji: "Lazy Justice... but justice nonetheless.",
            kizaru: "How scary... Speed of light attacks.",
            kaido_dragon: "I am the strongest creature in the world!",
            big_mom: "I am Big Mom! Wedding cake or death!",
            mihawk: "I am waiting for a swordsman stronger than Red Hair.",
            dragon: "The world must be changed!"
        };
        return quotes[bossType] || "Prepare for battle!";
    },

    getLocationName(location) {
        const locations = {
            marineford: '⚓ Marineford - Marine Headquarters',
            grand_line: '🌊 Grand Line - Pirate Paradise',
            wano: '🌸 Wano Country - Land of Samurai',
            whole_cake: '🍰 Whole Cake Island - Big Mom\'s Territory',
            alabasta: '🏜️ Alabasta Kingdom - Desert Nation',
            skypiea: '☁️ Skypiea - Sky Island'
        };
        return locations[location] || '🌊 Grand Line';
    },

    getLocationImage(location) {
        const images = {
            marineford: 'https://i.imgur.com/marineford.jpg',
            grand_line: 'https://i.imgur.com/grand_line.jpg',
            wano: 'https://i.imgur.com/wano.jpg',
            whole_cake: 'https://i.imgur.com/whole_cake.jpg',
            alabasta: 'https://i.imgur.com/alabasta.jpg',
            skypiea: 'https://i.imgur.com/skypiea.jpg'
        };
        return images[location] || 'https://i.imgur.com/one_piece_battle.jpg';
    }
};
