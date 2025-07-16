// src/systems/levels.js - Level System Based on Discord Roles
const DatabaseManager = require('../database/manager');

class LevelSystem {
    constructor() {
        this.levelRoles = {
            'Level-0': { level: 0, baseCp: 100 },
            'Level-5': { level: 5, baseCp: 150 },
            'Level-10': { level: 10, baseCp: 200 },
            'Level-15': { level: 15, baseCp: 250 },
            'Level-20': { level: 20, baseCp: 300 },
            'Level-25': { level: 25, baseCp: 350 },
            'Level-30': { level: 30, baseCp: 400 },
            'Level-35': { level: 35, baseCp: 450 },
            'Level-40': { level: 40, baseCp: 500 },
            'Level-45': { level: 45, baseCp: 550 },
            'Level-50': { level: 50, baseCp: 600 }
        };
        
        console.log('⭐ Level System initialized');
    }

    async initialize(client) {
        this.client = client;
        
        // Set up event listeners for role changes
        client.on('guildMemberUpdate', async (oldMember, newMember) => {
            await this.handleRoleChange(oldMember, newMember);
        });
        
        console.log('⭐ Level System ready - monitoring role changes');
    }

    async handleRoleChange(oldMember, newMember) {
        try {
            const oldRoles = oldMember.roles.cache.map(role => role.name);
            const newRoles = newMember.roles.cache.map(role => role.name);
            
            // Check if any level roles changed
            const oldLevelRoles = oldRoles.filter(role => this.levelRoles[role]);
            const newLevelRoles = newRoles.filter(role => this.levelRoles[role]);
            
            if (JSON.stringify(oldLevelRoles) !== JSON.stringify(newLevelRoles)) {
                await this.updateUserLevel(newMember.user.id, newMember.user.username, newMember.guild.id);
                console.log(`⭐ Level updated for ${newMember.user.username}`);
            }
            
        } catch (error) {
            console.error('Error handling role change:', error);
        }
    }

    async updateUserLevel(userId, username, guildId) {
        try {
            // Get user's current roles
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;
            
            const member = await guild.members.fetch(userId);
            if (!member) return;
            
            // Find highest level role
            const userRoles = member.roles.cache.map(role => role.name);
            let highestLevel = 0;
            let highestBaseCp = 100;
            let roleName = 'Level-0';
            
            for (const role of userRoles) {
                if (this.levelRoles[role]) {
                    const levelData = this.levelRoles[role];
                    if (levelData.level > highestLevel) {
                        highestLevel = levelData.level;
                        highestBaseCp = levelData.baseCp;
                        roleName = role;
                    }
                }
            }
            
            // Ensure user exists in database
            await DatabaseManager.ensureUser(userId, username, guildId);
            
            // Update user's level and base CP
            await DatabaseManager.updateUserLevel(userId, highestLevel, roleName, highestBaseCp);
            
            console.log(`⭐ ${username} updated to ${roleName} (Level ${highestLevel}, ${highestBaseCp} base CP)`);
            
        } catch (error) {
            console.error('Error updating user level:', error);
        }
    }

    async getUserLevel(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            if (!user) return { level: 0, baseCp: 100, roleName: 'Level-0' };
            
            return {
                level: user.level,
                baseCp: user.base_cp,
                roleName: user.role_name || 'Level-0'
            };
            
        } catch (error) {
            console.error('Error getting user level:', error);
            return { level: 0, baseCp: 100, roleName: 'Level-0' };
        }
    }

    async scanAndUpdateAllUsers(guildId) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;
            
            console.log(`⭐ Scanning all users in ${guild.name}...`);
            
            const members = await guild.members.fetch();
            let updated = 0;
            
            for (const [userId, member] of members) {
                if (member.user.bot) continue;
                
                await this.updateUserLevel(userId, member.user.username, guildId);
                updated++;
            }
            
            console.log(`⭐ Updated ${updated} users' levels`);
            
        } catch (error) {
            console.error('Error scanning users:', error);
        }
    }

    calculateTotalCP(baseCp, fruitMultipliers) {
        let totalCp = 0;
        
        // Group fruits by ID and calculate duplicates
        const fruitGroups = {};
        fruitMultipliers.forEach(multiplier => {
            if (!fruitGroups[multiplier.fruitId]) {
                fruitGroups[multiplier.fruitId] = {
                    multiplier: multiplier.multiplier,
                    count: 0
                };
            }
            fruitGroups[multiplier.fruitId].count++;
        });
        
        // Calculate total CP with duplicate bonuses
        Object.values(fruitGroups).forEach(group => {
            const duplicateBonus = 1 + ((group.count - 1) * 0.01); // 1% per duplicate
            const fruitCp = (baseCp * group.multiplier) * duplicateBonus;
            totalCp += fruitCp;
        });
        
        return Math.floor(totalCp);
    }

    getLevelRequirements() {
        return this.levelRoles;
    }

    getNextLevel(currentLevel) {
        const levels = Object.values(this.levelRoles).sort((a, b) => a.level - b.level);
        const nextLevel = levels.find(level => level.level > currentLevel);
        return nextLevel || null;
    }

    getLevelProgress(userId) {
        // This could be expanded to show progress towards next level
        // For now, it's role-based so progress is binary
        return {
            currentLevel: 0,
            nextLevel: 5,
            progress: 0,
            isRoleBased: true
        };
    }

    async getLevelLeaderboard(guildId, limit = 10) {
        try {
            const leaderboard = await DatabaseManager.getLeaderboard('cp', limit);
            return leaderboard;
        } catch (error) {
            console.error('Error getting level leaderboard:', error);
            return [];
        }
    }

    // Utility methods for level system
    getRoleColor(level) {
        const colors = {
            0: 0x808080,   // Gray
            5: 0x00FF00,   // Green
            10: 0x0080FF,  // Blue
            15: 0x8000FF,  // Purple
            20: 0xFFD700,  // Gold
            25: 0xFF4500,  // Orange Red
            30: 0xFF1493,  // Deep Pink
            35: 0x00FFFF,  // Cyan
            40: 0xFF69B4,  // Hot Pink
            45: 0x9370DB,  // Medium Purple
            50: 0xFF6347   // Tomato Red
        };
        return colors[level] || 0x808080;
    }

    getRoleEmoji(level) {
        const emojis = {
            0: '🔰',
            5: '🌟',
            10: '⭐',
            15: '🎖️',
            20: '🏆',
            25: '👑',
            30: '💎',
            35: '🌈',
            40: '🔥',
            45: '⚡',
            50: '🌞'
        };
        return emojis[level] || '🔰';
    }

    getLevelTitle(level) {
        const titles = {
            0: 'Rookie Pirate',
            5: 'Apprentice Sailor',
            10: 'Skilled Pirate',
            15: 'Veteran Buccaneer',
            20: 'Elite Captain',
            25: 'Legendary Pirate',
            30: 'Yonko Commander',
            35: 'Emperor Candidate',
            40: 'Yonko Level',
            45: 'World Government Threat',
            50: 'Pirate King Level'
        };
        return titles[level] || 'Unknown';
    }

    async getDetailedUserInfo(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            if (!user) return null;
            
            return {
                level: user.level,
                baseCp: user.base_cp,
                totalCp: user.total_cp,
                roleName: user.role_name || 'Level-0',
                title: this.getLevelTitle(user.level),
                emoji: this.getRoleEmoji(user.level),
                color: this.getRoleColor(user.level),
                berries: user.berries,
                nextLevel: this.getNextLevel(user.level)
            };
            
        } catch (error) {
            console.error('Error getting detailed user info:', error);
            return null;
        }
    }

    // Admin functions
    async forceUpdateUser(userId, level) {
        try {
            const levelData = Object.values(this.levelRoles).find(l => l.level === level);
            if (!levelData) {
                throw new Error(`Invalid level: ${level}`);
            }
            
            const user = await DatabaseManager.getUser(userId);
            if (!user) {
                throw new Error('User not found');
            }
            
            const roleName = Object.keys(this.levelRoles).find(key => this.levelRoles[key].level === level);
            
            await DatabaseManager.updateUserLevel(userId, level, roleName, levelData.baseCp);
            
            console.log(`⭐ Force updated user ${userId} to level ${level}`);
            
        } catch (error) {
            console.error('Error force updating user:', error);
            throw error;
        }
    }

    async resetUserLevel(userId) {
        try {
            await DatabaseManager.updateUserLevel(userId, 0, 'Level-0', 100);
            console.log(`⭐ Reset user ${userId} to level 0`);
        } catch (error) {
            console.error('Error resetting user level:', error);
            throw error;
        }
    }

    getSystemStats() {
        return {
            totalLevels: Object.keys(this.levelRoles).length,
            maxLevel: Math.max(...Object.values(this.levelRoles).map(l => l.level)),
            maxBaseCp: Math.max(...Object.values(this.levelRoles).map(l => l.baseCp)),
            levelRoles: this.levelRoles
        };
    }
}

module.exports = new LevelSystem();
