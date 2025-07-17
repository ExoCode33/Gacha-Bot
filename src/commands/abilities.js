// src/commands/abilities.js - Devil Fruit Abilities Viewer
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { balancedDevilFruitAbilities, statusEffects } = require('../data/balanced-devil-fruit-abilities');
const { getRarityEmoji, getRarityColor } = require('../data/devil-fruits');

const ABILITIES_PER_PAGE = 8;

// Organize abilities by rarity based on damage ranges
const RARITY_DAMAGE_RANGES = {
    common: { min: 45, max: 60 },
    uncommon: { min: 60, max: 80 },
    rare: { min: 80, max: 120 },
    epic: { min: 120, max: 160 },
    legendary: { min: 160, max: 200 },
    mythical: { min: 200, max: 240 },
    omnipotent: { min: 240, max: 280 }
};

function getAbilityRarity(ability) {
    const damage = ability.damage;
    for (const [rarity, range] of Object.entries(RARITY_DAMAGE_RANGES)) {
        if (damage >= range.min && damage <= range.max) {
            return rarity;
        }
    }
    return 'common'; // fallback
}

function organizeAbilitiesByRarity() {
    const organized = {
        common: [],
        uncommon: [],
        rare: [],
        epic: [],
        legendary: [],
        mythical: [],
        omnipotent: []
    };

    Object.entries(balancedDevilFruitAbilities).forEach(([fruitName, ability]) => {
        const rarity = getAbilityRarity(ability);
        organized[rarity].push({
            fruitName,
            ability
        });
    });

    // Sort each rarity by damage
    Object.keys(organized).forEach(rarity => {
        organized[rarity].sort((a, b) => a.ability.damage - b.ability.damage);
    });

    return organized;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('abilities')
        .setDescription('🔮 View all Devil Fruit abilities organized by rarity')
        .addStringOption(option =>
            option.setName('rarity')
                .setDescription('Filter by specific rarity')
                .setRequired(false)
                .addChoices(
                    { name: '🟫 Common', value: 'common' },
                    { name: '🟩 Uncommon', value: 'uncommon' },
                    { name: '🟦 Rare', value: 'rare' },
                    { name: '🟪 Epic', value: 'epic' },
                    { name: '🟨 Legendary', value: 'legendary' },
                    { name: '🟧 Mythical', value: 'mythical' },
                    { name: '🌈 Omnipotent', value: 'omnipotent' }
                )
        )
        .addStringOption(option =>
            option.setName('search')
                .setDescription('Search for specific fruit ability')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('view')
                .setDescription('View type')
                .setRequired(false)
                .addChoices(
                    { name: '📋 List View', value: 'list' },
                    { name: '📊 Stats View', value: 'stats' },
                    { name: '🎯 Effects Guide', value: 'effects' }
                )
        ),

    async execute(interaction) {
        try {
            const rarityFilter = interaction.options.getString('rarity');
            const searchTerm = interaction.options.getString('search');
            const viewType = interaction.options.getString('view') || 'list';

            if (viewType === 'effects') {
                return await this.showEffectsGuide(interaction);
            }

            if (searchTerm) {
                return await this.searchAbilities(interaction, searchTerm);
            }

            const organizedAbilities = organizeAbilitiesByRarity();
            
            if (rarityFilter) {
                await this.showRarityAbilities(interaction, rarityFilter, organizedAbilities[rarityFilter], viewType);
            } else {
                await this.showAllRarities(interaction, organizedAbilities, viewType);
            }

        } catch (error) {
            console.error('Error in abilities command:', error);
            await interaction.reply({
                content: '❌ An error occurred while loading abilities.',
                ephemeral: true
            });
        }
    },

    async showAllRarities(interaction, organizedAbilities, viewType) {
        const embed = new EmbedBuilder()
            .setTitle('🔮 Devil Fruit Abilities - All Rarities')
            .setDescription('Overview of all Devil Fruit abilities organized by rarity')
            .setColor(0x9932CC)
            .setFooter({ text: 'Use /abilities rarity:<rarity> to see specific abilities' })
            .setTimestamp();

        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical', 'omnipotent'];

        rarityOrder.forEach(rarity => {
            const abilities = organizedAbilities[rarity];
            const emoji = getRarityEmoji(rarity);
            const count = abilities.length;
            
            if (count > 0) {
                const damageRange = RARITY_DAMAGE_RANGES[rarity];
                const cooldownRange = this.getCooldownRange(rarity);
                
                const examples = abilities.slice(0, 3).map(item => item.fruitName).join(', ');
                const moreText = count > 3 ? ` (+${count - 3} more)` : '';
                
                embed.addFields({
                    name: `${emoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)} (${count} abilities)`,
                    value: `**Damage:** ${damageRange.min}-${damageRange.max}\n**Cooldown:** ${cooldownRange}\n**Examples:** ${examples}${moreText}`,
                    inline: true
                });
            }
        });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('abilities_effects_guide')
                    .setLabel('🎯 Effects Guide')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('abilities_stats_overview')
                    .setLabel('📊 Stats Overview')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('abilities_search')
                    .setLabel('🔍 Search')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [buttons]
        });
    },

    async showRarityAbilities(interaction, rarity, abilities, viewType) {
        if (!abilities || abilities.length === 0) {
            return interaction.reply({
                content: `❌ No abilities found for ${rarity} rarity.`,
                ephemeral: true
            });
        }

        const totalPages = Math.ceil(abilities.length / ABILITIES_PER_PAGE);
        const currentPage = 1;

        const embed = await this.createRarityEmbed(rarity, abilities, currentPage, totalPages, viewType);
        const components = this.createNavigationButtons(rarity, currentPage, totalPages, viewType);

        await interaction.reply({
            embeds: [embed],
            components: components
        });
    },

    async createRarityEmbed(rarity, abilities, page, totalPages, viewType) {
        const emoji = getRarityEmoji(rarity);
        const color = getRarityColor(rarity);
        const damageRange = RARITY_DAMAGE_RANGES[rarity];
        
        const embed = new EmbedBuilder()
            .setTitle(`${emoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Devil Fruit Abilities`)
            .setDescription(`**Damage Range:** ${damageRange.min}-${damageRange.max} • **Total Abilities:** ${abilities.length}`)
            .setColor(color)
            .setFooter({ text: `Page ${page}/${totalPages} • ${viewType} view` })
            .setTimestamp();

        const startIndex = (page - 1) * ABILITIES_PER_PAGE;
        const endIndex = Math.min(startIndex + ABILITIES_PER_PAGE, abilities.length);
        const pageAbilities = abilities.slice(startIndex, endIndex);

        if (viewType === 'stats') {
            // Stats view - more compact, focus on numbers
            const statsText = pageAbilities.map((item, index) => {
                const ability = item.ability;
                return `**${startIndex + index + 1}. ${item.fruitName}**\n` +
                       `⚔️ ${ability.damage} dmg • ⏱️ ${ability.cooldown}cd • 🎯 ${ability.accuracy || 85}%` +
                       `${ability.effect ? ` • 🌟 ${ability.effect}` : ''}`;
            }).join('\n\n');

            embed.addFields({
                name: 'Ability Stats',
                value: statsText || 'No abilities found',
                inline: false
            });
        } else {
            // List view - detailed descriptions
            pageAbilities.forEach((item, index) => {
                const ability = item.ability;
                const effectText = ability.effect ? `\n🌟 **Effect:** ${ability.effect}` : '';
                const typeText = ability.type ? `\n🔷 **Type:** ${ability.type}` : '';
                
                embed.addFields({
                    name: `${startIndex + index + 1}. ${item.fruitName}`,
                    value: `⚔️ **${ability.name}**\n` +
                           `💥 **Damage:** ${ability.damage}\n` +
                           `⏱️ **Cooldown:** ${ability.cooldown} turns\n` +
                           `🎯 **Accuracy:** ${ability.accuracy || 85}%${effectText}${typeText}\n` +
                           `📝 ${ability.description}`,
                    inline: false
                });
            });
        }

        return embed;
    },

    createNavigationButtons(rarity, currentPage, totalPages, viewType) {
        const components = [];

        if (totalPages > 1) {
            const navigationRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`abilities_prev_${rarity}_${currentPage}_${viewType}`)
                        .setLabel('◀️ Previous')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === 1),
                    new ButtonBuilder()
                        .setCustomId(`abilities_page_${rarity}_${currentPage}_${viewType}`)
                        .setLabel(`${currentPage}/${totalPages}`)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(`abilities_next_${rarity}_${currentPage}_${viewType}`)
                        .setLabel('Next ▶️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === totalPages)
                );
            components.push(navigationRow);
        }

        // Action buttons
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`abilities_toggle_view_${rarity}_${currentPage}_${viewType}`)
                    .setLabel(viewType === 'list' ? '📊 Stats View' : '📋 List View')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('abilities_effects_guide')
                    .setLabel('🎯 Effects Guide')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('abilities_back_overview')
                    .setLabel('🔙 Back to Overview')
                    .setStyle(ButtonStyle.Primary)
            );
        components.push(actionRow);

        return components;
    },

    async searchAbilities(interaction, searchTerm) {
        const results = [];
        const searchLower = searchTerm.toLowerCase();

        Object.entries(balancedDevilFruitAbilities).forEach(([fruitName, ability]) => {
            if (fruitName.toLowerCase().includes(searchLower) || 
                ability.name.toLowerCase().includes(searchLower) ||
                ability.description.toLowerCase().includes(searchLower) ||
                (ability.effect && ability.effect.toLowerCase().includes(searchLower))) {
                
                results.push({
                    fruitName,
                    ability,
                    rarity: getAbilityRarity(ability)
                });
            }
        });

        if (results.length === 0) {
            return interaction.reply({
                content: `❌ No abilities found matching "${searchTerm}".`,
                ephemeral: true
            });
        }

        // Sort by rarity and damage
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical', 'omnipotent'];
        results.sort((a, b) => {
            const rarityDiff = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
            return rarityDiff !== 0 ? rarityDiff : b.ability.damage - a.ability.damage;
        });

        const embed = new EmbedBuilder()
            .setTitle(`🔍 Search Results for "${searchTerm}"`)
            .setDescription(`Found ${results.length} matching abilities`)
            .setColor(0x00FF00)
            .setTimestamp();

        results.slice(0, 10).forEach((result, index) => {
            const emoji = getRarityEmoji(result.rarity);
            const ability = result.ability;
            
            embed.addFields({
                name: `${index + 1}. ${emoji} ${result.fruitName}`,
                value: `⚔️ **${ability.name}** (${ability.damage} dmg)\n📝 ${ability.description}`,
                inline: false
            });
        });

        if (results.length > 10) {
            embed.setFooter({ text: `Showing top 10 results out of ${results.length} matches` });
        }

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    },

    async showEffectsGuide(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎯 Devil Fruit Ability Effects Guide')
            .setDescription('Complete guide to all status effects and their mechanics')
            .setColor(0xFF6B35)
            .setTimestamp();

        // Group effects by type
        const effectsByType = {
            'Damage Over Time': [],
            'Control Effects': [],
            'Debuffs': [],
            'Defensive': [],
            'Special': []
        };

        Object.entries(statusEffects).forEach(([effectName, effect]) => {
            let category = 'Special';
            if (effect.type === 'dot') category = 'Damage Over Time';
            else if (effect.type === 'disable') category = 'Control Effects';
            else if (effect.type === 'debuff') category = 'Debuffs';
            else if (effect.type === 'shield' || effect.type === 'counter') category = 'Defensive';

            effectsByType[category].push({
                name: effectName,
                effect
            });
        });

        Object.entries(effectsByType).forEach(([category, effects]) => {
            if (effects.length > 0) {
                const effectsText = effects.map(item => {
                    const effect = item.effect;
                    const durationText = effect.duration ? ` (${effect.duration} turns)` : '';
                    const damageText = effect.damage ? ` - ${effect.damage} dmg` : '';
                    return `**${item.name}**${durationText}${damageText}\n${effect.description}`;
                }).join('\n\n');

                embed.addFields({
                    name: `${this.getCategoryEmoji(category)} ${category}`,
                    value: effectsText.slice(0, 1024), // Discord field limit
                    inline: false
                });
            }
        });

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    },

    getCategoryEmoji(category) {
        const emojis = {
            'Damage Over Time': '🔥',
            'Control Effects': '🔒',
            'Debuffs': '⬇️',
            'Defensive': '🛡️',
            'Special': '✨'
        };
        return emojis[category] || '🎯';
    },

    getCooldownRange(rarity) {
        const ranges = {
            common: '0-1 turns',
            uncommon: '1-2 turns',
            rare: '2-3 turns',
            epic: '3-4 turns',
            legendary: '4-5 turns',
            mythical: '5-6 turns',
            omnipotent: '6-7 turns'
        };
        return ranges[rarity] || '0-1 turns';
    }
};

// Button interaction handler - add this to your main interaction handler
/*
if (interaction.isButton() && interaction.customId.startsWith('abilities_')) {
    const command = interaction.client.commands.get('abilities');
    if (command) {
        // Handle button interactions here
        const [, action, ...params] = interaction.customId.split('_');
        
        if (action === 'prev' || action === 'next') {
            const [rarity, currentPage, viewType] = params;
            const newPage = action === 'prev' ? parseInt(currentPage) - 1 : parseInt(currentPage) + 1;
            // Handle pagination...
        } else if (action === 'toggle') {
            // Handle view toggle...
        } else if (action === 'effects') {
            await command.showEffectsGuide(interaction);
        }
    }
}
*/
