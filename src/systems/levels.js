// src/systems/levels.js - Fixed Level System with User Initialization
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
        
        // Initialize all users when bot starts
        setTimeout(async () => {
            await this.initializeAllUsers();
        }, 5000); // Wait 5 seconds for bot to be fully ready
        
        console.log('⭐ Level System ready - will initialize all users');
    }

    async initializeAllUsers() {
        try {
            console.log('⭐ Initializing all users with Level-0...');
            
            let totalInitialized = 0;
            
            // Go through all guilds
            for (const [guildId, guild] of this.client.guilds.cache) {
                try {
                    console.log(`⭐ Processing guild: ${guild.name} (${guild.memberCount} members)`);
                    
                    // Fetch all members
                    const members = await guild.members.fetch();
                    
                    for (const [userId, member] of members) {
                        if (member.user.bot) continue; // Skip bots
                        
                        try {
                            // Ensure user exists with Level-0 as default
                            await DatabaseManager.ensureUser(userId, member.user.username, guildId);
                            
                            // Update their level based on roles
                            await this.updateUserLevel(userId, member.user.username, guildId);
                            
                            totalInitialized++;
                            
                            if (totalInitialized % 10 === 0) {
                                console.log(`⭐ Initialized ${totalInitialized} users...`);
                            }
                            
                        } catch (error) {
                            console.error(`❌ Error initializing user ${member.user.username}:`, error);
                        }
                    }
                    
                } catch (error) {
                    console.error(`❌ Error processing guild ${guild.name}:`, error);
                }
            }
            
            console.log(`✅ Initialized ${totalInitialized} users total`);
            
            // Now update all users to have minimum Level-0
            await this.ensureAllUsersHaveLevel();
            
        } catch (error) {
            console.error('❌ Error initializing all users:', error);
        }
    }

    async ensureAllUsersHaveLevel() {
        try {
            console.log('⭐ Ensuring all users have minimum Level-0...');
            
            // Update all users without a level or with 0 total_cp to have Level-0
            const result = await DatabaseManager.query(`
                UPDATE users 
                SET level = 0, base_cp = 100, total_cp = 100, updated_at = NOW()
                WHERE level = 0 AND total_cp = 0
            `);
            
            console.log(`✅ Updated ${result.rowCount} users to have Level-0 base CP`);
            
        } catch (error) {
            console.error('❌ Error ensuring users have levels:', error);
        }
    }

    async updateUserLevel(userId, username, guildId) {
        try {
            // Get user's current roles
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;
            
            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) return;
            
            // Find highest level role
            const userRoles = member.roles.cache.map(role => role.name);
            let highestLevel = 0;
            let highestBaseCp = 100;
            let roleName = 'Level-0';
            
            // Check for level roles
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
            
            // If no level role found, default to Level-0
            if (highestLevel === 0) {
                console.log(`⭐ User ${username} has no level role, defaulting to Level-0`);
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

    getLevelRoles() {
        return this.levelRoles;
    }

    getNextLevel(currentLevel) {
        const levels = Object.values(this.levelRoles).sort((a, b) => a.level - b.level);
        const nextLevel = levels.find(level => level.level > currentLevel);
        return nextLevel || null;
    }

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
