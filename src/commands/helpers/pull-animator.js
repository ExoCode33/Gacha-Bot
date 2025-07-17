// src/commands/helpers/pull-animator.js - Enhanced Animation Controller with Slower Timing
const { getRarityColor, getRarityEmoji } = require('../../data/devil-fruits');
const DatabaseManager = require('../../database/manager');
const EmbedBuilder = require('./embed-builder');

class PullAnimator {
    // Run full single pull animation with enhanced timing
    static async runFullAnimation(interaction, fruit, newBalance) {
        // Phase 1: Extended rainbow hunt (5.4s)
        await this.runRainbowPhase(interaction, fruit);
        
        // Small pause between phases
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Phase 2: Extended color spread (4.8s)
        await this.runColorSpread(interaction, fruit);
        
        // Small pause for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Phase 3: Save to database
        const result = await this.saveFruit(interaction.user.id, fruit);
        
        // Phase 4: Extended text reveal (5.6s)
        await this.runTextReveal(interaction, fruit, result, newBalance);
        
        // Final pause before reveal
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Phase 5: Final reveal
        await this.showFinalReveal(interaction, fruit, result, newBalance);
    }

    // Run 10x pull animation with slightly slower timing
    static async run10xAnimation(interaction, fruits, newBalance) {
        const results = [];
        
        // Animate each fruit individually
        for (let i = 0; i < 10; i++) {
            const fruit = fruits[i];
            const pullNumber = i + 1;
            
            console.log(`🎯 Pull ${pullNumber}/10: ${fruit.name} (${fruit.rarity})`);
            
            // Quick animation for each (slightly slower)
            await this.runQuickAnimation(interaction, fruit, pullNumber);
            
            // Save fruit
            const result = await this.saveFruit(interaction.user.id, fruit);
            results.push(result);
            
            // Slightly longer delay between pulls
            if (i < 9) await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Show completion summary
        await this.show10xSummary(interaction, fruits, results, newBalance);
    }

    // Extended rainbow hunt phase (6 frames, 900ms each = 5.4s)
    static async runRainbowPhase(interaction, fruit) {
        const frames = 6; // Increased from 4
        const delay = 900; // Same delay for dramatic buildup
        
        for (let frame = 0; frame < frames; frame++) {
            const embed = EmbedBuilder.createRainbowFrame(frame, fruit);
            
            // Check if interaction is already replied/deferred
            if (frame === 0 && !interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
            
            if (frame < frames - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Extended color spread phase (12 frames, 400ms each = 4.8s)
    static async runColorSpread(interaction, fruit) {
        const frames = 12; // Increased from 10
        const delay = 400; // Slightly increased from 350ms
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

    // Extended text reveal phase (8 frames, 700ms each = 5.6s)
    static async runTextReveal(interaction, fruit, result, newBalance) {
        const frames = 8; // Same number of frames
        const delay = 700; // Increased from 500ms for smoother reveals
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

    // Enhanced quick animation for 10x pulls (5 frames, 500ms each)
    static async runQuickAnimation(interaction, fruit, pullNumber) {
        const frames = 5; // Increased from 3
        const delay = 500; // Increased from 400ms
        
        // Quick rainbow with more frames
        for (let frame = 0; frame < frames; frame++) {
            const embed = EmbedBuilder.createQuickFrame(frame, fruit, pullNumber);
            
            // Check if interaction is already replied/deferred
            if (pullNumber === 1 && frame === 0 && !interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Pause before reveal
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Quick reveal
        const revealEmbed = EmbedBuilder.createQuickReveal(fruit, pullNumber);
        await interaction.editReply({ embeds: [revealEmbed] });
        
        // Show reveal for a bit longer
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Show final reveal with dramatic timing
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
            const result = await DatabaseManager.addDevilFruit(userId, fruit);
            console.log(`💾 Database result:`, result);
            return result;
        } catch (error) {
            console.error('Error saving fruit:', error);
            return {
                isNewFruit: true,
                duplicateCount: 1,
                totalCp: 250,
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
