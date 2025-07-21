// src/database/manager.js - Complete Database Manager Class
const mysql = require('mysql2/promise');
const config = require('../config/config.json');

class DatabaseManager {
    static connection = null;

    /**
     * Initialize database connection
     */
    static async initialize() {
        try {
            this.connection = await mysql.createConnection({
                host: config.database.host,
                user: config.database.user,
                password: config.database.password,
                database: config.database.database,
                charset: 'utf8mb4'
            });

            console.log('✅ Database connected successfully');
            
            // Create tables if they don't exist
            await this.createTables();
            
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            process.exit(1);
        }
    }

    /**
     * Execute a database query
     */
    static async query(sql, params = []) {
        try {
            if (!this.connection) {
                await this.initialize();
            }

            const [results] = await this.connection.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    /**
     * Create all necessary tables
     */
    static async createTables() {
        try {
            // Users table
            await this.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(255) PRIMARY KEY,
                    username VARCHAR(255) NOT NULL,
                    discriminator VARCHAR(10),
                    avatar VARCHAR(255),
                    coins BIGINT DEFAULT 1000,
                    gems INT DEFAULT 0,
                    experience BIGINT DEFAULT 0,
                    level INT DEFAULT 1,
                    daily_streak INT DEFAULT 0,
                    last_daily TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_level (level),
                    INDEX idx_coins (coins)
                )
            `);

            // Characters table
            await this.query(`
                CREATE TABLE IF NOT EXISTS characters (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic') NOT NULL,
                    element VARCHAR(50),
                    level INT DEFAULT 1,
                    experience BIGINT DEFAULT 0,
                    hp INT NOT NULL,
                    mp INT NOT NULL,
                    attack INT NOT NULL,
                    defense INT NOT NULL,
                    speed INT NOT NULL,
                    power_level INT DEFAULT 0,
                    avatar_url TEXT,
                    is_favorite BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT FALSE,
                    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_user_id (user_id),
                    INDEX idx_rarity (rarity),
                    INDEX idx_power_level (power_level),
                    INDEX idx_element (element)
                )
            `);

            // Guild settings table
            await this.query(`
                CREATE TABLE IF NOT EXISTS guild_settings (
                    guild_id VARCHAR(255) PRIMARY KEY,
                    gacha_channel VARCHAR(255),
                    pvp_channel VARCHAR(255),
                    admin_channel VARCHAR(255),
                    welcome_channel VARCHAR(255),
                    daily_reward BOOLEAN DEFAULT TRUE,
                    gacha_cooldown INT DEFAULT 300,
                    pvp_enabled BOOLEAN DEFAULT TRUE,
                    prefix VARCHAR(10) DEFAULT '!',
                    language VARCHAR(10) DEFAULT 'en',
                    timezone VARCHAR(50) DEFAULT 'UTC',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);

            // PvP queue table
            await this.query(`
                CREATE TABLE IF NOT EXISTS pvp_queue (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    guild_id VARCHAR(255) NOT NULL,
                    character_data TEXT NOT NULL,
                    queue_type VARCHAR(50) DEFAULT 'ranked',
                    is_npc BOOLEAN DEFAULT FALSE,
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    matched_at TIMESTAMP NULL,
                    power_level INT DEFAULT 0,
                    status ENUM('waiting', 'matched', 'battling', 'completed') DEFAULT 'waiting',
                    INDEX idx_guild_status (guild_id, status),
                    INDEX idx_user_guild (user_id, guild_id),
                    INDEX idx_power_level (power_level),
                    INDEX idx_joined_at (joined_at)
                )
            `);

            // Battle history table
            await this.query(`
                CREATE TABLE IF NOT EXISTS battle_history (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    guild_id VARCHAR(255) NOT NULL,
                    player1_id VARCHAR(255) NOT NULL,
                    player2_id VARCHAR(255),
                    player1_character TEXT NOT NULL,
                    player2_character TEXT,
                    winner_id VARCHAR(255),
                    battle_type ENUM('pvp', 'pve', 'npc') DEFAULT 'pvp',
                    battle_data TEXT,
                    rewards TEXT,
                    duration INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_guild_id (guild_id),
                    INDEX idx_player1 (player1_id),
                    INDEX idx_player2 (player2_id),
                    INDEX idx_winner (winner_id),
                    INDEX idx_battle_type (battle_type)
                )
            `);

            // Inventory table
            await this.query(`
                CREATE TABLE IF NOT EXISTS inventory (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    item_type ENUM('potion', 'equipment', 'material', 'token', 'booster') NOT NULL,
                    item_name VARCHAR(255) NOT NULL,
                    item_data TEXT,
                    quantity INT DEFAULT 1,
                    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_user_item (user_id, item_type),
                    INDEX idx_item_name (item_name)
                )
            `);

            // Achievements table
            await this.query(`
                CREATE TABLE IF NOT EXISTS achievements (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    achievement_id VARCHAR(100) NOT NULL,
                    progress INT DEFAULT 0,
                    completed BOOLEAN DEFAULT FALSE,
                    completed_at TIMESTAMP NULL,
                    rewards_claimed BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
                    INDEX idx_user_id (user_id),
                    INDEX idx_completed (completed)
                )
            `);

            console.log('✅ All database tables created/verified successfully');
        } catch (error) {
            console.error('❌ Error creating tables:', error);
        }
    }

    // ===================
    // USER METHODS
    // ===================

    /**
     * Get or create user
     */
    static async getUser(userId, userData = {}) {
        try {
            let user = await this.query(
                `SELECT * FROM users WHERE id = ?`,
                [userId]
            );

            if (user.length === 0) {
                // Create new user
                await this.query(
                    `INSERT INTO users (id, username, discriminator, avatar) VALUES (?, ?, ?, ?)`,
                    [userId, userData.username || 'Unknown', userData.discriminator || '0000', userData.avatar || null]
                );

                user = await this.query(`SELECT * FROM users WHERE id = ?`, [userId]);
            }

            return user[0];
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    /**
     * Update user data
     */
    static async updateUser(userId, updateData) {
        try {
            const fields = Object.keys(updateData);
            const values = Object.values(updateData);
            const setClause = fields.map(field => `${field} = ?`).join(', ');

            await this.query(
                `UPDATE users SET ${setClause} WHERE id = ?`,
                [...values, userId]
            );

            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            return false;
        }
    }

    /**
     * Add coins to user
     */
    static async addCoins(userId, amount) {
        try {
            await this.query(
                `UPDATE users SET coins = coins + ? WHERE id = ?`,
                [amount, userId]
            );
            return true;
        } catch (error) {
            console.error('Error adding coins:', error);
            return false;
        }
    }

    /**
     * Remove coins from user
     */
    static async removeCoins(userId, amount) {
        try {
            const result = await this.query(
                `UPDATE users SET coins = GREATEST(0, coins - ?) WHERE id = ? AND coins >= ?`,
                [amount, userId, amount]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error removing coins:', error);
            return false;
        }
    }

    // ===================
    // CHARACTER METHODS
    // ===================

    /**
     * Add character to user
     */
    static async addCharacter(userId, characterData) {
        try {
            const result = await this.query(
                `INSERT INTO characters (user_id, name, rarity, element, level, experience, hp, mp, attack, defense, speed, power_level, avatar_url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    characterData.name,
                    characterData.rarity,
                    characterData.element,
                    characterData.level || 1,
                    characterData.experience || 0,
                    characterData.hp,
                    characterData.mp,
                    characterData.attack,
                    characterData.defense,
                    characterData.speed,
                    characterData.power_level || 0,
                    characterData.avatar_url || null
                ]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error adding character:', error);
            return null;
        }
    }

    /**
     * Get user's characters
     */
    static async getUserCharacters(userId, options = {}) {
        try {
            let query = `SELECT * FROM characters WHERE user_id = ?`;
            const params = [userId];

            if (options.rarity) {
                query += ` AND rarity = ?`;
                params.push(options.rarity);
            }

            if (options.element) {
                query += ` AND element = ?`;
                params.push(options.element);
            }

            if (options.is_favorite !== undefined) {
                query += ` AND is_favorite = ?`;
                params.push(options.is_favorite);
            }

            if (options.orderBy) {
                query += ` ORDER BY ${options.orderBy}`;
                if (options.order === 'DESC') query += ' DESC';
            }

            if (options.limit) {
                query += ` LIMIT ${options.limit}`;
            }

            return await this.query(query, params);
        } catch (error) {
            console.error('Error getting user characters:', error);
            return [];
        }
    }

    /**
     * Get character by ID
     */
    static async getCharacter(characterId) {
        try {
            const result = await this.query(
                `SELECT * FROM characters WHERE id = ?`,
                [characterId]
            );
            return result[0] || null;
        } catch (error) {
            console.error('Error getting character:', error);
            return null;
        }
    }

    /**
     * Update character
     */
    static async updateCharacter(characterId, updateData) {
        try {
            const fields = Object.keys(updateData);
            const values = Object.values(updateData);
            const setClause = fields.map(field => `${field} = ?`).join(', ');

            await this.query(
                `UPDATE characters SET ${setClause} WHERE id = ?`,
                [...values, characterId]
            );

            return true;
        } catch (error) {
            console.error('Error updating character:', error);
            return false;
        }
    }

    /**
     * Set active character
     */
    static async setActiveCharacter(userId, characterId) {
        try {
            // Remove active status from all user's characters
            await this.query(
                `UPDATE characters SET is_active = FALSE WHERE user_id = ?`,
                [userId]
            );

            // Set new active character
            await this.query(
                `UPDATE characters SET is_active = TRUE WHERE id = ? AND user_id = ?`,
                [characterId, userId]
            );

            return true;
        } catch (error) {
            console.error('Error setting active character:', error);
            return false;
        }
    }

    /**
     * Get user's active character
     */
    static async getActiveCharacter(userId) {
        try {
            const result = await this.query(
                `SELECT * FROM characters WHERE user_id = ? AND is_active = TRUE`,
                [userId]
            );
            return result[0] || null;
        } catch (error) {
            console.error('Error getting active character:', error);
            return null;
        }
    }

    // ===================
    // GUILD SETTINGS METHODS
    // ===================

    /**
     * Get guild settings
     */
    static async getGuildSettings(guildId) {
        try {
            let settings = await this.query(
                `SELECT * FROM guild_settings WHERE guild_id = ?`,
                [guildId]
            );

            if (settings.length === 0) {
                // Create default settings
                await this.query(
                    `INSERT INTO guild_settings (guild_id) VALUES (?)`,
                    [guildId]
                );
                settings = await this.query(`SELECT * FROM guild_settings WHERE guild_id = ?`, [guildId]);
            }

            return settings[0];
        } catch (error) {
            console.error('Error getting guild settings:', error);
            return null;
        }
    }

    /**
     * Update guild settings
     */
    static async updateGuildSettings(guildId, settings) {
        try {
            const fields = Object.keys(settings);
            const values = Object.values(settings);
            const setClause = fields.map(field => `${field} = ?`).join(', ');

            await this.query(
                `UPDATE guild_settings SET ${setClause} WHERE guild_id = ?`,
                [...values, guildId]
            );

            return true;
        } catch (error) {
            console.error('Error updating guild settings:', error);
            return false;
        }
    }

    /**
     * Get specific guild setting
     */
    static async getGuildSetting(guildId, settingName) {
        try {
            const result = await this.query(
                `SELECT ${settingName} FROM guild_settings WHERE guild_id = ?`,
                [guildId]
            );
            return result[0] ? result[0][settingName] : null;
        } catch (error) {
            console.error('Error getting guild setting:', error);
            return null;
        }
    }

    // ===================
    // PVP QUEUE METHODS
    // ===================

    /**
     * Add a player or NPC to the PvP queue
     */
    static async addToQueue(queueEntry) {
        try {
            // Check if user is already in queue
            const existingEntry = await this.query(
                `SELECT id FROM pvp_queue WHERE user_id = ? AND guild_id = ? AND status = 'waiting'`,
                [queueEntry.user_id, queueEntry.guild_id]
            );

            if (existingEntry.length > 0 && !queueEntry.is_npc) {
                return {
                    success: false,
                    error: 'Already in queue'
                };
            }

            // Insert into queue
            const result = await this.query(
                `INSERT INTO pvp_queue (user_id, guild_id, character_data, queue_type, is_npc, joined_at, power_level, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting')`,
                [
                    queueEntry.user_id,
                    queueEntry.guild_id,
                    queueEntry.character_data,
                    queueEntry.queue_type || 'ranked',
                    queueEntry.is_npc || false,
                    queueEntry.joined_at || new Date(),
                    queueEntry.power_level,
                ]
            );

            // Get queue position
            const position = await this.getQueuePosition(queueEntry.user_id, queueEntry.guild_id);

            return {
                success: true,
                queueId: result.insertId,
                position: position
            };

        } catch (error) {
            console.error('Error adding to queue:', error);
            return {
                success: false,
                error: 'Database error'
            };
        }
    }

    /**
     * Get queue position for a user
     */
    static async getQueuePosition(userId, guildId) {
        try {
            const result = await this.query(
                `SELECT COUNT(*) as position FROM pvp_queue 
                 WHERE guild_id = ? AND status = 'waiting' 
                 AND joined_at <= (SELECT joined_at FROM pvp_queue WHERE user_id = ? AND guild_id = ? AND status = 'waiting')`,
                [guildId, userId, guildId]
            );

            return result[0]?.position || 0;
        } catch (error) {
            console.error('Error getting queue position:', error);
            return 0;
        }
    }

    /**
     * Get current queue for a guild
     */
    static async getQueue(guildId, queueType = 'ranked') {
        try {
            const result = await this.query(
                `SELECT * FROM pvp_queue 
                 WHERE guild_id = ? AND queue_type = ? AND status = 'waiting' 
                 ORDER BY joined_at ASC`,
                [guildId, queueType]
            );

            return result.map(entry => ({
                ...entry,
                character_data: JSON.parse(entry.character_data),
                joined_at: new Date(entry.joined_at)
            }));
        } catch (error) {
            console.error('Error getting queue:', error);
            return [];
        }
    }

    /**
     * Find a match for a player in queue
     */
    static async findMatch(userId, guildId) {
        try {
            // Get the user's queue entry
            const userEntry = await this.query(
                `SELECT * FROM pvp_queue WHERE user_id = ? AND guild_id = ? AND status = 'waiting'`,
                [userId, guildId]
            );

            if (userEntry.length === 0) {
                return null;
            }

            const user = userEntry[0];
            const userPower = user.power_level;
            const powerRange = userPower * 0.3; // 30% power range

            // Find suitable opponent (including NPCs)
            const opponents = await this.query(
                `SELECT * FROM pvp_queue 
                 WHERE guild_id = ? AND user_id != ? AND status = 'waiting'
                 AND power_level BETWEEN ? AND ?
                 ORDER BY ABS(power_level - ?) ASC, joined_at ASC
                 LIMIT 1`,
                [guildId, userId, userPower - powerRange, userPower + powerRange, userPower]
            );

            if (opponents.length > 0) {
                const opponent = opponents[0];
                
                // Update both entries to 'matched'
                await this.query(
                    `UPDATE pvp_queue SET status = 'matched', matched_at = NOW() WHERE id IN (?, ?)`,
                    [user.id, opponent.id]
                );

                return {
                    player1: {
                        ...user,
                        character_data: JSON.parse(user.character_data)
                    },
                    player2: {
                        ...opponent,
                        character_data: JSON.parse(opponent.character_data)
                    }
                };
            }

            return null;
        } catch (error) {
            console.error('Error finding match:', error);
            return null;
        }
    }

    /**
     * Remove user from queue
     */
    static async removeFromQueue(userId, guildId) {
        try {
            const result = await this.query(
                `DELETE FROM pvp_queue WHERE user_id = ? AND guild_id = ? AND status = 'waiting'`,
                [userId, guildId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error removing from queue:', error);
            return false;
        }
    }

    /**
     * Clear old queue entries (cleanup)
     */
    static async clearOldQueueEntries(hoursOld = 24) {
        try {
            await this.query(
                `DELETE FROM pvp_queue WHERE joined_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
                [hoursOld]
            );
        } catch (error) {
            console.error('Error clearing old queue entries:', error);
        }
    }

    /**
     * Get queue statistics
     */
    static async getQueueStats(guildId) {
        try {
            const stats = await this.query(
                `SELECT 
                    COUNT(*) as total_waiting,
                    COUNT(CASE WHEN is_npc = 1 THEN 1 END) as npc_count,
                    COUNT(CASE WHEN is_npc = 0 THEN 1 END) as player_count,
                    AVG(power_level) as avg_power,
                    MIN(power_level) as min_power,
                    MAX(power_level) as max_power
                 FROM pvp_queue 
                 WHERE guild_id = ? AND status = 'waiting'`,
                [guildId]
            );

            return stats[0] || {
                total_waiting: 0,
                npc_count: 0,
                player_count: 0,
                avg_power: 0,
                min_power: 0,
                max_power: 0
            };
        } catch (error) {
            console.error('Error getting queue stats:', error);
            return {
                total_waiting: 0,
                npc_count: 0,
                player_count: 0,
                avg_power: 0,
                min_power: 0,
                max_power: 0
            };
        }
    }

    // ===================
    // BATTLE METHODS
    // ===================

    /**
     * Save battle result
     */
    static async saveBattleResult(battleData) {
        try {
            const result = await this.query(
                `INSERT INTO battle_history (guild_id, player1_id, player2_id, player1_character, player2_character, winner_id, battle_type, battle_data, rewards, duration) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    battleData.guild_id,
                    battleData.player1_id,
                    battleData.player2_id || null,
                    JSON.stringify(battleData.player1_character),
                    battleData.player2_character ? JSON.stringify(battleData.player2_character) : null,
                    battleData.winner_id || null,
                    battleData.battle_type || 'pvp',
                    JSON.stringify(battleData.battle_data || {}),
                    JSON.stringify(battleData.rewards || {}),
                    battleData.duration || 0
                ]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error saving battle result:', error);
            return null;
        }
    }

    /**
     * Get user's battle history
     */
    static async getBattleHistory(userId, limit = 10) {
        try {
            const result = await this.query(
                `SELECT * FROM battle_history 
                 WHERE player1_id = ? OR player2_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT ?`,
                [userId, userId, limit]
            );

            return result.map(battle => ({
                ...battle,
                player1_character: JSON.parse(battle.player1_character),
                player2_character: battle.player2_character ? JSON.parse(battle.player2_character) : null,
                battle_data: JSON.parse(battle.battle_data || '{}'),
                rewards: JSON.parse(battle.rewards || '{}')
            }));
        } catch (error) {
            console.error('Error getting battle history:', error);
            return [];
        }
    }

    // ===================
    // INVENTORY METHODS
    // ===================

    /**
     * Add item to inventory
     */
    static async addInventoryItem(userId, itemType, itemName, itemData = {}, quantity = 1) {
        try {
            // Check if item already exists
            const existing = await this.query(
                `SELECT * FROM inventory WHERE user_id = ? AND item_type = ? AND item_name = ?`,
                [userId, itemType, itemName]
            );

            if (existing.length > 0) {
                // Update quantity
                await this.query(
                    `UPDATE inventory SET quantity = quantity + ? WHERE id = ?`,
                    [quantity, existing[0].id]
                );
                return existing[0].id;
            } else {
                // Insert new item
                const result = await this.query(
                    `INSERT INTO inventory (user_id, item_type, item_name, item_data, quantity) VALUES (?, ?, ?, ?, ?)`,
                    [userId, itemType, itemName, JSON.stringify(itemData), quantity]
                );
                return result.insertId;
            }
        } catch (error) {
            console.error('Error adding inventory item:', error);
            return null;
        }
    }

    /**
     * Get user inventory
     */
    static async getInventory(userId, itemType = null) {
        try {
            let query = `SELECT * FROM inventory WHERE user_id = ?`;
            const params = [userId];

            if (itemType) {
                query += ` AND item_type = ?`;
                params.push(itemType);
            }

            query += ` ORDER BY item_type, item_name`;

            const result = await this.query(query, params);
            
            return result.map(item => ({
                ...item,
                item_data: JSON.parse(item.item_data || '{}')
            }));
        } catch (error) {
            console.error('Error getting inventory:', error);
            return [];
        }
    }

    /**
     * Remove item from inventory
     */
    static async removeInventoryItem(userId, itemType, itemName, quantity = 1) {
        try {
            const item = await this.query(
                `SELECT * FROM inventory WHERE user_id = ? AND item_type = ? AND item_name = ?`,
                [userId, itemType, itemName]
            );

            if (item.length === 0 || item[0].quantity < quantity) {
                return false;
            }

            if (item[0].quantity === quantity) {
                // Remove item completely
                await this.query(
                    `DELETE FROM inventory WHERE id = ?`,
                    [item[0].id]
                );
            } else {
                // Reduce quantity
                await this.query(
                    `UPDATE inventory SET quantity = quantity - ? WHERE id = ?`,
                    [quantity, item[0].id]
                );
            }

            return true;
        } catch (error) {
            console.error('Error removing inventory item:', error);
            return false;
        }
    }

    // ===================
    // UTILITY METHODS
    // ===================

    /**
     * Get leaderboard
     */
    static async getLeaderboard(type = 'level', limit = 10, guildId = null) {
        try {
            let query = '';
            let params = [];

            switch (type) {
                case 'level':
                    query = `SELECT id, username, level, experience FROM users ORDER BY level DESC, experience DESC LIMIT ?`;
                    params = [limit];
                    break;
                case 'coins':
                    query = `SELECT id, username, coins FROM users ORDER BY coins DESC LIMIT ?`;
                    params = [limit];
                    break;
                case 'characters':
                    query = `SELECT u.id, u.username, COUNT(c.id) as character_count 
                             FROM users u 
                             LEFT JOIN characters c ON u.id = c.user_id 
                             GROUP BY u.id, u.username 
                             ORDER BY character_count DESC 
                             LIMIT ?`;
                    params = [limit];
                    break;
                default:
                    return [];
            }

            return await this.query(query, params);
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    }

    /**
     * Close database connection
     */
    static async close() {
        try {
            if (this.connection) {
                await this.connection.end();
                console.log('✅ Database connection closed');
            }
        } catch (error) {
            console.error('❌ Error closing database connection:', error);
        }
    }
}

module.exports = DatabaseManager;
