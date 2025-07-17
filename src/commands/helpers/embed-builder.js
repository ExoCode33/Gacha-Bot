// src/commands/helpers/embed-builder.js - Embed Creator
const { EmbedBuilder } = require('discord.js');
const { getRarityColor, getRarityEmoji } = require('../../data/devil-fruits');

const HUNT_DESCRIPTIONS = [
    "🌊 Scanning the Grand Line's mysterious depths...",
    "⚡ Devil Fruit energy detected... analyzing power signature...",
    "🔥 Tremendous force breaking through dimensional barriers...",
    "💎 Legendary power crystallizing before your eyes..."
];

class EmbedCreator {
    // Fixed rainbow pattern - prevents one side from going faster
    static getRainbowPattern(frame, length = 20) {
        const colors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫'];
        const pattern = [];
        
        for (let i = 0; i < length; i++) {
            const colorIndex = (i + frame) % colors.length;
            pattern.push(colors[colorIndex]);
        }
        
        return pattern.join(' ');
    }

    static getRainbowColor(frame) {
        const colors = [0xFF0000, 0xFF8000, 0xFFFF00, 0x00FF00, 0x0080FF, 0x8000FF, 0x8B4513];
        return colors[frame % colors.length];
    }

    // Rainbow hunt frame
    static createRainbowFrame(frame, fruit) {
        const pattern = this.getRainbowPattern(frame);
        const color = this.getRainbowColor(frame);
        const description = HUNT_DESCRIPTIONS[frame] || HUNT_DESCRIPTIONS[3];
        
        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt')
            .setDescription(`${description}\n\n✨ **Devil Fruit Hunt in Progress** ✨\n\n${pattern}\n\n📊 **Status:** Scanning...\n🍃 **Name:** ???\n🔮 **Type:** ???\n⭐ **Rarity:** ???\n💪 **CP Multiplier:** ???\n⚡ **Power:** ???\n\n${pattern}`)
            .setColor(color)
            .setFooter({ text: '🌊 Searching the mysterious seas...' });
    }

    // Color spread frame
    static createColorSpreadFrame(frame, fruit, rewardColor, rewardEmoji) {
        const barLength = 20;
        const center = 10;
        const spreadRadius = Math.floor(frame * 1.2);
        
        const bar = Array(barLength).fill('⬛');
        const rainbowColors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫'];
        
        for (let i = 0; i < barLength; i++) {
            const distanceFromCenter = Math.abs(i - center);
            
            if (distanceFromCenter <= spreadRadius) {
                bar[i] = rewardEmoji;
            } else {
                bar[i] = rainbowColors[(i * 2) % rainbowColors.length];
            }
        }

        const pattern = bar.join(' ');
        
        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt')
            .setDescription(`🔮 Mysterious power manifesting...\n\n✨ **Devil Fruit Manifestation** ✨\n\n${pattern}\n\n📊 **Status:** Crystallizing...\n🍃 **Name:** ???\n🔮 **Type:** ???\n⭐ **Rarity:** ???\n💪 **CP Multiplier:** ???\n⚡ **Power:** ???\n\n${pattern}`)
            .setColor(rewardColor)
            .setFooter({ text: '⚡ Power crystallizing...' });
    }

    // Text reveal frame
    static createTextRevealFrame(frame, fruit, result, newBalance, rewardColor, rewardEmoji) {
        const pattern = Array(20).fill(rewardEmoji).join(' ');
        const duplicateCount = result.duplicate_count || 1;
        const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `📚 Total Owned: ${duplicateCount}`;
        const totalCp = result.total_cp || 250;
        
        // Get ability details - show progression: ??? -> detailed info -> Analysis complete
        let abilityText = '???';
        if (frame === 6) {
            // Frame 6: Show basic ability name
            const basicAbility = this.getBasicAbilityText(fruit);
            abilityText = basicAbility.name;
        } else if (frame === 7) {
            // Frame 7: Show full detailed ability with effects
            abilityText = this.getDetailedAbilityText(fruit);
        } else if (frame >= 8) {
            // Frame 8+: Analysis complete
            abilityText = 'Analysis complete';
        }
        
        let description = `✨ **Devil Fruit Acquired!** ✨\n\n${pattern}\n\n`;
        description += `📊 **Status:** ${frame >= 0 ? duplicateText : '???'}\n`;
        description += `🍃 **Name:** ${frame >= 1 ? fruit.name : '???'}\n`;
        description += `🔮 **Type:** ${frame >= 2 ? fruit.type : '???'}\n`;
        description += `⭐ **Rarity:** ${frame >= 3 ? fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1) : '???'}\n`;
        description += `💪 **CP Multiplier:** ${frame >= 4 ? `${fruit.multiplier}x` : '???'}\n`;
        description += `⚡ **Power:** ${frame >= 5 ? fruit.power : '???'}\n`;
        description += `🎯 **Abilities:** ${abilityText}\n\n`;
        description += `🔥 **Total CP:** ${frame >= 7 ? `${totalCp.toLocaleString()} CP` : '???'}\n`;
        description += `💰 **Remaining Berries:** ${newBalance.toLocaleString()} berries\n\n${pattern}`;

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt')
            .setDescription(description)
            .setColor(rewardColor)
            .setFooter({ text: '🎉 Added to your collection!' });
    }

    // Final reveal
    static createFinalReveal(fruit, result, newBalance) {
        const emoji = getRarityEmoji(fruit.rarity);
        const color = getRarityColor(fruit.rarity);
        const pattern = Array(20).fill(emoji).join(' ');
        const duplicateCount = result.duplicate_count || 1;
        const duplicateText = duplicateCount === 1 ? '✨ New Discovery!' : `📚 Total Owned: ${duplicateCount}`;
        const totalCp = result.total_cp || 250;

        const description = `🎉 **Congratulations!** You've obtained a magnificent Devil Fruit!\n\n${pattern}\n\n` +
            `📊 **Status:** ${duplicateText}\n` +
            `🍃 **Name:** ${fruit.name}\n` +
            `🔮 **Type:** ${fruit.type}\n` +
            `⭐ **Rarity:** ${fruit.rarity.charAt(0).toUpperCase() + fruit.rarity.slice(1)}\n` +
            `💪 **CP Multiplier:** ${fruit.multiplier}x\n` +
            `⚡ **Power:** ${fruit.power}\n\n` +
            `🔥 **Total CP:** ${totalCp.toLocaleString()} CP\n` +
            `💰 **Remaining Berries:** ${newBalance.toLocaleString()} berries\n\n` +
            `${pattern}`;

        return new EmbedBuilder()
            .setTitle('🏴‍☠️ Devil Fruit Hunt Complete!')
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: '🏴‍☠️ Your journey continues on the Grand Line!' })
            .setTimestamp();
    }

    // Quick animation frame for 10x
    static createQuickFrame(frame, fruit, pullNumber) {
        const pattern = this.getRainbowPattern(frame, 15);
        const color = this.getRainbowColor(frame);
        
        return new EmbedBuilder()
            .setTitle('🎰 10x Devil Fruit Hunt')
            .setDescription(`**Pull ${pullNumber}/10**\n\n🌊 Scanning the Grand Line...\n\n${pattern}\n\n📊 **Status:** Analyzing...\n🍃 **Fruit:** ???\n⭐ **Rarity:** ???\n\n${pattern}`)
            .setColor(color)
            .setFooter({ text: `Pull ${pullNumber} of 10` });
    }

    // Quick reveal for 10x
    static createQuickReveal(fruit, pullNumber) {
        const emoji = getRarityEmoji(fruit.rarity);
        const color = getRarityColor(fruit.rarity);
        const pattern = Array(15).fill(emoji).join(' ');
        
        return new EmbedBuilder()
            .setTitle('🎰 10x Devil Fruit Hunt')
            .setDescription(`**Pull ${pullNumber}/10** - ${emoji} **${fruit.rarity.toUpperCase()}**\n\n${pattern}\n\n🍃 **${fruit.name}**\n🔮 ${fruit.type}\n💪 ${fruit.multiplier}x CP\n\n${pattern}`)
            .setColor(color)
            .setFooter({ text: `Pull ${pullNumber} of 10 - Added to collection!` });
    }

    // 10x summary
    static create10xSummary(fruits, results, balance) {
        const rarityCounts = {};
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical', 'omnipotent'];
        
        rarityOrder.forEach(rarity => { rarityCounts[rarity] = 0; });
        fruits.forEach(fruit => { rarityCounts[fruit.rarity]++; });

        let rarityText = '';
        rarityOrder.forEach(rarity => {
            if (rarityCounts[rarity] > 0) {
                const emoji = getRarityEmoji(rarity);
                rarityText += `${emoji} **${rarity.charAt(0).toUpperCase() + rarity.slice(1)}**: ${rarityCounts[rarity]}\n`;
            }
        });

        // Get highest rarity
        let highestRarity = 'common';
        [...rarityOrder].reverse().forEach(rarity => {
            if (rarityCounts[rarity] > 0 && highestRarity === 'common') {
                highestRarity = rarity;
            }
        });

        const highestEmoji = getRarityEmoji(highestRarity);
        const highestColor = getRarityColor(highestRarity);

        return new EmbedBuilder()
            .setTitle('🎰 10x Devil Fruit Hunt Complete!')
            .setDescription(`🎉 **10x Pull Complete!** 🎉\n\n**Highest Rarity:** ${highestEmoji} ${highestRarity.charAt(0).toUpperCase() + highestRarity.slice(1)}\n\n**Results:**\n${rarityText}\n💰 **Remaining Berries:** ${balance.toLocaleString()}\n\nAll fruits have been added to your collection!`)
            .setColor(highestColor)
            .setFooter({ text: '🏴‍☠️ Continue your adventure on the Grand Line!' })
            .setTimestamp();
    }

    // Get basic ability name for frame 6
    static getBasicAbilityText(fruit) {
        try {
            const { balancedDevilFruitAbilities } = require('../../data/balanced-devil-fruit-abilities');
            let ability = balancedDevilFruitAbilities[fruit.name];
            
            if (!ability) {
                const rarityAbilities = {
                    'common': { name: 'Basic Attack' },
                    'uncommon': { name: 'Enhanced Strike' },
                    'rare': { name: 'Powerful Blow' },
                    'epic': { name: 'Devastating Strike' },
                    'legendary': { name: 'Legendary Technique' },
                    'mythical': { name: 'Mythical Power' },
                    'omnipotent': { name: 'Divine Technique' }
                };
                ability = rarityAbilities[fruit.rarity] || rarityAbilities['common'];
            }
            
            return { name: ability.name };
        } catch (error) {
            return { name: 'Devil Fruit Power' };
        }
    }

    // Get detailed ability text for frame 7
    static getDetailedAbilityText(fruit) {
        try {
            const { balancedDevilFruitAbilities, statusEffects } = require('../../data/balanced-devil-fruit-abilities');
            let ability = balancedDevilFruitAbilities[fruit.name];
            
            if (!ability) {
                const rarityAbilities = {
                    'common': { damage: 55, cooldown: 1, name: 'Basic Attack', effect: null },
                    'uncommon': { damage: 70, cooldown: 2, name: 'Enhanced Strike', effect: 'dodge_boost' },
                    'rare': { damage: 100, cooldown: 3, name: 'Powerful Blow', effect: 'burn_3_turns' },
                    'epic': { damage: 140, cooldown: 4, name: 'Devastating Strike', effect: 'freeze_2_turns' },
                    'legendary': { damage: 180, cooldown: 5, name: 'Legendary Technique', effect: 'shield_medium' },
                    'mythical': { damage: 220, cooldown: 6, name: 'Mythical Power', effect: 'nullify_abilities' },
                    'omnipotent': { damage: 260, cooldown: 7, name: 'Divine Technique', effect: 'reality_fracture' }
                };
                ability = rarityAbilities[fruit.rarity] || rarityAbilities['common'];
            }
            
            let text = `${ability.name} (${ability.damage} dmg, ${ability.cooldown}cd)`;
            
            if (ability.effect && statusEffects && statusEffects[ability.effect]) {
                const effect = statusEffects[ability.effect];
                let effectDesc = effect.description;
                
                if (effect.duration) effectDesc += ` (${effect.duration} turns)`;
                if (effect.damage) effectDesc += ` - ${effect.damage} dmg`;
                if (effect.damageReduction) effectDesc += ` - ${effect.damageReduction}% damage reduction`;
                
                text += `\n   • ${effectDesc}`;
            }
            
            return text;
        } catch (error) {
            return 'Powerful Devil Fruit ability';
        }
    }
}

module.exports = EmbedCreator;
