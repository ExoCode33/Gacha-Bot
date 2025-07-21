// src/systems/pvp/utils.js - PvP Utility Functions
const { EmbedBuilder, MessageFlags } = require('discord.js');
const { getRarityEmoji, getRarityColor } = require('../../data/devil-fruits');

class PvPUtils {
    // Safe interaction reply/update helper
    static async safeReply(interaction, content, ephemeral = false) {
        try {
            if (interaction.replied || interaction.deferred) {
                return await interaction.followUp({
                    content,
                    flags: ephemeral ? MessageFlags.Ephemeral : undefined
                });
            } else {
                return await interaction.reply({
                    content,
                    flags: ephemeral ? MessageFlags.Ephemeral : undefined
                });
            }
        } catch (error) {
            console.error('Error in safe reply:', error);
            return null;
        }
    }

    // Safe interaction update helper
    static async safeUpdate(interaction, payload) {
        try {
            if (interaction.deferred || interaction.replied) {
                return await interaction.editReply(payload);
            } else {
                return await interaction.update(payload);
            }
        } catch (error) {
            console.error('Error in safe update:', error);
            // Fallback to followUp if update fails
            try {
                return await interaction.followUp(payload);
            } catch (followUpError) {
                console.error('Error in fallback followUp:', followUpError);
                return null;
            }
        }
    }

    // Create HP bar visualization
    static createHPBar(percentage, length = 20) {
        const filledLength = Math.round((percentage / 100) * length);
        const emptyLength = length - filledLength;
        
        let fillEmoji = '🟢';
        if (percentage < 30) fillEmoji = '🔴';
        else if (percentage < 60) fillEmoji = '🟡';
        
        return fillEmoji.repeat(filledLength) + '⚫'.repeat(emptyLength);
    }

    // Create progress bar
    static createProgressBar(current, max, length = 20, fillChar = '█', emptyChar = '░') {
        const percentage = Math.min(100, (current / max) * 100);
        const filledLength = Math.round((percentage / 100) * length);
        const emptyLength = length - filledLength;
        
        return fillChar.repeat(filledLength) + emptyChar.repeat(emptyLength);
    }

    // Format time duration
    static formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Format countdown timer
    static formatCountdown(milliseconds) {
        const totalSeconds = Math.ceil(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Get effects string for display
    static getEffectsString(effects) {
        if (!effects || effects.length === 0) return 'None';
        return effects.map(e => `${e.name} (${e.duration})`).join(', ');
    }

    // Get recent battle log entries
    static getRecentBattleLog(battleLog, count = 5) {
        if (!battleLog || battleLog.length === 0) return 'Battle starting...';
        
        const recent = battleLog.slice(-count);
        return recent.map(entry => entry.message).join('\n');
    }

    // Create rarity breakdown for display
    static getRarityBreakdown(fruits) {
        if (!fruits || fruits.length === 0) {
            return 'No fruits selected';
        }
        
        const breakdown = {
            divine: 0, mythical: 0, legendary: 0, epic: 0,
            rare: 0, uncommon: 0, common: 0
        };
        
        fruits.forEach(fruit => {
            const rarity = fruit.fruit_rarity || fruit.rarity || 'common';
            if (breakdown.hasOwnProperty(rarity)) {
                breakdown[rarity]++;
            }
        });
        
        const parts = [];
        Object.entries(breakdown).forEach(([rarity, count]) => {
            if (count > 0) {
                const emoji = getRarityEmoji(rarity);
                parts.push(`${emoji}${count}`);
            }
        });
        
        return parts.join(' ') || 'No fruits';
    }

    // Organize fruits by rarity
    static organizeFruitsByRarity(fruits) {
        const organized = {
            divine: [], mythical: [], legendary: [], epic: [],
            rare: [], uncommon: [], common: []
        };

        // Group fruits by name to handle duplicates
        const fruitGroups = new Map();
        fruits.forEach(fruit => {
            const fruitName = fruit.fruit_name || fruit.name;
            if (fruitGroups.has(fruitName)) {
                fruitGroups.get(fruitName).count++;
            } else {
                fruitGroups.set(fruitName, { ...fruit, count: 1 });
            }
        });

        // Organize by rarity
        Array.from(fruitGroups.values()).forEach(fruit => {
            const rarity = fruit.fruit_rarity || fruit.rarity || 'common';
            if (organized.hasOwnProperty(rarity)) {
                organized[rarity].push(fruit);
            }
        });

        // Sort each rarity alphabetically
        Object.keys(organized).forEach(rarity => {
            organized[rarity].sort((a, b) => {
                const nameA = a.fruit_name || a.name || '';
                const nameB = b.fruit_name || b.name || '';
                return nameA.localeCompare(nameB);
            });
        });

        return organized;
    }

    // Filter fruits by page (high/low rarity)
    static filterFruitsByPage(organizedFruits, page) {
        if (page === 'high') {
            return {
                divine: organizedFruits.divine || [],
                mythical: organizedFruits.mythical || [],
                legendary: organizedFruits.legendary || [],
                epic: organizedFruits.epic || []
            };
        } else {
            return {
                rare: organizedFruits.rare || [],
                uncommon: organizedFruits.uncommon || [],
                common: organizedFruits.common || []
            };
        }
    }

    // Create status message for battle phases
    static getBattlePhaseMessage(status, isVsNPC = false) {
        const messages = {
            created: 'Battle created, preparing fighters...',
            fruit_selection: 'Selecting Devil Fruits for battle...',
            battle: 'Turn-based combat in progress!',
            ended: 'Battle completed!'
        };

        return messages[status] || 'Unknown battle phase';
    }

    // Create turn description
    static getTurnDescription(currentTurn, maxTurns) {
        const progress = (currentTurn / maxTurns) * 100;
        
        if (currentTurn === 1) {
            return '🔥 **Battle begins!** First blood will be drawn!';
        } else if (progress < 30) {
            return '⚡ **Early combat!** Fighters are testing defenses!';
        } else if (progress < 70) {
            return '💥 **Intense battle!** Both fighters unleash their power!';
        } else if (progress < 90) {
            return '🌟 **Epic climax!** The battle reaches its peak!';
        } else {
            return '🔥 **Final moments!** One fighter must fall!';
        }
    }

    // Calculate CP balance ratio
    static calculateCPBalance(cp1, cp2) {
        const ratio = Math.max(cp1 / cp2, cp2 / cp1);
        let balance = 'Balanced';
        
        if (ratio > 2.0) balance = 'Very Unbalanced';
        else if (ratio > 1.5) balance = 'Unbalanced';
        else if (ratio > 1.2) balance = 'Slightly Unbalanced';
        
        return {
            ratio: ratio.toFixed(2),
            balance,
            isBalanced: ratio <= 1.5
        };
    }

    // Validate fruit selection
    static validateFruitSelection(selectedFruits, requiredCount = 5) {
        const validation = {
            isValid: false,
            errors: [],
            count: selectedFruits ? selectedFruits.length : 0
        };

        if (!selectedFruits || !Array.isArray(selectedFruits)) {
            validation.errors.push('No fruits provided');
            return validation;
        }

        if (selectedFruits.length !== requiredCount) {
            validation.errors.push(`Must select exactly ${requiredCount} fruits (currently ${selectedFruits.length})`);
            return validation;
        }

        // Check for duplicates
        const fruitNames = selectedFruits.map(f => f.fruit_name || f.name);
        const uniqueNames = new Set(fruitNames);
        if (uniqueNames.size !== fruitNames.length) {
            validation.errors.push('Duplicate fruits are not allowed');
            return validation;
        }

        validation.isValid = true;
        return validation;
    }

    // Generate battle embed description
    static generateBattleDescription(battleData) {
        const { player1, player2, currentTurn, maxTurns, isVsNPC } = battleData;
        
        let description = this.getTurnDescription(currentTurn, maxTurns);
        description += `\n\n**Turn ${currentTurn}/${maxTurns}**`;
        
        if (isVsNPC) {
            description += ` • **PvE Battle**`;
        } else {
            description += ` • **PvP Battle**`;
        }
        
        return description;
    }

    // Create error embed
    static createErrorEmbed(title, message, details = null) {
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`❌ ${title}`)
            .setDescription(message)
            .setTimestamp();

        if (details) {
            embed.addFields([{
                name: '🔍 Details',
                value: details,
                inline: false
            }]);
        }

        return embed;
    }

    // Create success embed
    static createSuccessEmbed(title, message, details = null) {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`✅ ${title}`)
            .setDescription(message)
            .setTimestamp();

        if (details) {
            embed.addFields([{
                name: '📊 Details',
                value: details,
                inline: false
            }]);
        }

        return embed;
    }

    // Create warning embed
    static createWarningEmbed(title, message, details = null) {
        const embed = new EmbedBuilder()
            .setColor(0xFF8000)
            .setTitle(`⚠️ ${title}`)
            .setDescription(message)
            .setTimestamp();

        if (details) {
            embed.addFields([{
                name: '💡 Information',
                value: details,
                inline: false
            }]);
        }

        return embed;
    }

    // Format number with commas
    static formatNumber(number) {
        return number.toLocaleString();
    }

    // Truncate text to fit Discord limits
    static truncateText(text, maxLength = 1024) {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength - 3) + '...';
    }

    // Get random element from array
    static getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Clamp number between min and max
    static clamp(number, min, max) {
        return Math.min(Math.max(number, min), max);
    }

    // Check if interaction is expired
    static isInteractionExpired(error) {
        return error.code === 10062 || error.message.includes('Unknown interaction');
    }

    // Get battle difficulty color
    static getDifficultyColor(difficulty) {
        const colors = {
            'Easy': 0x00FF00,
            'Medium': 0xFFFF00,
            'Hard': 0xFF8000,
            'Very Hard': 0xFF4500,
            'Legendary': 0x8B008B,
            'Mythical': 0xFF1493,
            'Divine': 0xFFD700
        };
        return colors[difficulty] || 0x808080;
    }

    // Create loading embed
    static createLoadingEmbed(title, message) {
        return new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle(`⏳ ${title}`)
            .setDescription(message)
            .setTimestamp();
    }

    // Parse battle ID from custom ID
    static parseBattleId(customId) {
        const parts = customId.split('_');
        const battleIndex = parts.findIndex(part => part === 'battle' || 
                                                   part.startsWith('battle'));
        
        if (battleIndex === -1) return null;
        
        // Extract battle ID (usually timestamp_random format)
        const battleIdParts = [];
        for (let i = battleIndex + 1; i < parts.length - 1; i++) {
            battleIdParts.push(parts[i]);
        }
        
        return battleIdParts.join('_');
    }

    // Validate user permissions
    static validateUserPermissions(interaction, battleData, userId) {
        if (!battleData) {
            return { valid: false, error: 'Battle not found' };
        }

        if (battleData.player1.userId !== userId && battleData.player2.userId !== userId) {
            return { valid: false, error: 'You are not part of this battle' };
        }

        return { valid: true };
    }

    // Get opponent data
    static getOpponent(battleData, userId) {
        if (battleData.player1.userId === userId) {
            return { player: battleData.player2, key: 'player2' };
        } else if (battleData.player2.userId === userId) {
            return { player: battleData.player1, key: 'player1' };
        }
        return null;
    }

    // Check if it's user's turn
    static isUserTurn(battleData, userId) {
        const currentPlayerData = battleData[battleData.currentPlayer];
        return currentPlayerData && currentPlayerData.userId === userId;
    }

    // Create emoji array from rarity
    static createRarityArray(rarities) {
        return rarities.map(rarity => getRarityEmoji(rarity));
    }

    // Format timestamp for display
    static formatTimestamp(timestamp) {
        return `<t:${Math.floor(timestamp / 1000)}:R>`;
    }

    // Calculate time remaining
    static getTimeRemaining(startTime, duration) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        return remaining;
    }

    // Log battle event
    static logBattleEvent(battleId, event, details = {}) {
        console.log(`⚔️ [${battleId}] ${event}:`, details);
    }

    // Deep clone object (for battle state)
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}

module.exports = PvPUtils;
