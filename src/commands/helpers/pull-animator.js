// src/commands/helpers/pull-animator.js - Animation Controller
const { getRarityColor, getRarityEmoji } = require('../../data/devil-fruits');
const DatabaseManager = require('../../database/manager');
const EmbedBuilder = require('./embed-builder');

class PullAnimator {
    // Run full single pull animation
    static async runFullAnimation(interaction, fruit, newBalance) {
        // Phase 1: Rainbow hunt (3.6s)
        await this.runRainbowPhase(interaction, fruit);
        
        // Phase 2: Color spread (3.5s)
        await this.runColorSpread(interaction, fruit);
        
        // Phase 3: Save to database
        const result = await this.saveFruit(interaction.user.id, fruit);
        
        // Phase 4: Text reveal (4s)
        await this.runTextReveal(interaction, fruit, result, newBalance);
        
        // Phase 5: Final reveal
        await this.showFinalReveal(interaction, fruit, result, newBalance);
    }

    // Run 10x pull animation
    static async run10xAnimation(interaction, fruits, newBalance) {
        const results = [];
        
        // Animate each fruit individually
        for (let i = 0; i < 10; i++) {
            const fruit = fruits[i];
            const pullNumber = i + 1;
            
            console.log(`🎯 Pull ${pullNumber}/10: ${fruit.name} (${fruit.rarity})`);
            
            // Quick animation for each
            await this.runQuickAnimation(interaction, fruit, pullNumber);
            
            // Save fruit
            const result = await this.saveFruit(interaction.user.id, fruit);
            results.push(result);
            
            // Small delay between pulls
            if (i < 9) await new Promise(resolve => setTimeout(resolve, 800));
        }

        // Show completion summary
        await this.show10xSummary(interaction, fruits, results, newBalance);
    }

    // Rainbow hunt phase
    static async runRainbowPhase(interaction, fruit) {
        const frames = 4;
        const delay = 900;
        
        for (let frame = 0; frame < frames; frame++) {
            const embed = EmbedBuilder.createRainbowFrame(frame, fruit);
            
            if (frame === 0) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
            
            if (frame < frames - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Color spread phase
    static async runColorSpread(interaction, fruit) {
        const frames = 10;
        const delay = 350;
        const rewardColor = getRarityColor(fruit.rarity);
        const rewardEmoji = getRarityEmoji(fruit.rarity);
        
        for (let frame = 0; frame < frames; frame++) {
            const embed = EmbedBuilder.createColorSpreadFrame(frame, fruit, rewardColor, rewardEmoji);
            await interaction.editReply({ embeds: [embed] });
            
            if (frame < frames - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Text reveal phase
    static async runTextReveal(interaction, fruit, result, newBalance) {
        const frames = 8;
        const delay = 500;
        const rewardColor = getRarityColor(fruit.rarity);
        const rewardEmoji = getRarityEmoji(fruit.rarity);
        
        for (let frame = 0; frame < frames; frame++) {
            const embed = EmbedBuilder.createTextRevealFrame(frame, fruit, result, newBalance, rewardColor, rewardEmoji);
            await interaction.editReply({ embeds: [embed] });
            
            if (frame < frames - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Quick animation for 10x pulls
    static async runQuickAnimation(interaction, fruit, pullNumber) {
        const frames = 3;
        const delay = 400;
        
        // Quick rainbow
        for (let frame = 0; frame < frames; frame++) {
            const embed = EmbedBuilder.createQuickFrame(frame, fruit, pullNumber);
            
            if (pullNumber === 1 && frame === 0) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Quick reveal
        const revealEmbed = EmbedBuilder.createQuickReveal(fruit, pullNumber);
        await interaction.editReply({ embeds: [revealEmbed] });
    }

    // Show final reveal
    static async showFinalReveal(interaction, fruit, result, newBalance) {
        const embed = EmbedBuilder.createFinalReveal(fruit, result, newBalance);
        await interaction.editReply({ embeds: [embed] });
    }

    // Show 10x summary
    static async show10xSummary(interaction, fruits, results, newBalance) {
        const embed = EmbedBuilder.create10xSummary(fruits, results, newBalance);
        await interaction.editReply({ embeds: [embed] });
    }

    // Save fruit to database
    static async saveFruit(userId, fruit) {
        try {
            return await DatabaseManager.addDevilFruit(userId, fruit);
        } catch (error) {
            console.error('Error saving fruit:', error);
            return {
                duplicate_count: 1,
                total_cp: 250,
                fruit: {
                    fruit_name: fruit.name,
                    fruit_rarity: fruit.rarity,
                    base_cp: Math.floor(fruit.multiplier * 100)
                }
            };
        }
    }
}

module.exports = PullAnimator;
