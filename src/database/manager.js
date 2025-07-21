// src/database/manager.js - Compatible with existing One Piece structure
const { Pool } = require('pg');
require('dotenv').config();

class DatabaseManager {
    static pool = null;

    /**
     * Initialize database connection pool
     */
    static async initialize() {
        try {
            // Railway provides DATABASE_URL, use it if available
            const config = process.env.DATABASE_URL ? {
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            } : {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'devil_fruit_bot',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD
            };

            this.pool = new Pool({
                ...config,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            console.log('✅ PostgreSQL database connected successfully');
            
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
    static async query(text, params = []) {
        try {
            if (!this.pool) {
                await this.initialize();
            }

            const start = Date.now();
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            if (duration > 1000) {
                console.log(`Slow query executed in ${duration}ms:`, text.substring(0, 100));
            }
            
            return result.rows;
        } catch (error) {
            console.error('Database query error:', error);
            console.error('Query:', text);
            console.error('Params:', params);
            throw error;
        }
    }

    /**
     * Create all necessary tables (compatible with existing structure)
     */
    static async createTables() {
        try {
            // Users table (compatible with your existing structure)
            await this.query(`
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    username VARCHAR(255) NOT NULL,
                    guild_id TEXT,
                    level INTEGER DEFAULT 0,
                    base_cp INTEGER DEFAULT 100,
                    total_cp INTEGER DEFAULT 0,
                    berries BIGINT DEFAULT 0,
                    coins BIGINT DEFAULT 0,
                    gems INTEGER DEFAULT 0,
                    experience BIGINT DEFAULT 0,
                    daily_streak INTEGER DEFAULT 0,
                    last_daily TIMESTAMP,
                    last_income TIMESTAMP DEFAULT NOW(),
                    total_earned BIGINT DEFAULT 0,
                    total_spent BIGINT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `);

            // Your existing user_devil_fruits table structure
            await this.query(`
                CREATE TABLE IF NOT EXISTS user_devil_fruits (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
                    fruit_id VARCHAR(50) NOT NULL,
                    fruit_name VARCHAR(255) NOT NULL,
                    fruit_type VARCHAR(50) NOT NULL,
                    fruit_rarity VARCHAR(50) NOT NULL,
                    fruit_element VARCHAR(50) NOT NULL DEFAULT 'Unknown',
                    fruit_fruit_type VARCHAR(50) NOT NULL DEFAULT 'Unknown',
                    fruit_power TEXT NOT NULL,
                    fruit_description TEXT,
                    base_cp INTEGER NOT NULL,
                    duplicate_count INTEGER DEFAULT 1,
                    total_cp INTEGER NOT NULL,
                    obtained_at TIMESTAMP DEFAULT NOW()
                );
            `);

            // Add compatibility columns for PvP system
            await this.query(`
                ALTER TABLE user_devil_fruits 
                ADD COLUMN IF NOT EXISTS hp INTEGER DEFAULT 1000,
                ADD COLUMN IF NOT EXISTS mp INTEGER DEFAULT 500,
                ADD COLUMN IF NOT EXISTS attack INTEGER DEFAULT 100,
                ADD COLUMN IF NOT EXISTS defense INTEGER DEFAULT 80,
                ADD COLUMN IF NOT EXISTS speed INTEGER DEFAULT 90,
                ADD COLUMN IF NOT EXISTS power_level INTEGER DEFAULT 0,
                ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS avatar_url TEXT,
                ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
                ADD COLUMN IF NOT EXISTS experience BIGINT DEFAULT 0
            `);

            // PvP queue table
            await this.query(`
                CREATE TABLE IF NOT EXISTS pvp_queue (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    guild_id TEXT NOT NULL,
                    character_data JSONB NOT NULL,
                    queue_type VARCHAR(50) DEFAULT 'ranked',
                    is_npc BOOLEAN DEFAULT FALSE,
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    matched_at TIMESTAMP,
                    power_level INTEGER DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'battling', 'completed'))
                );
                CREATE INDEX IF NOT EXISTS idx_pvp_queue_guild_status ON pvp_queue(guild_id, status);
                CREATE INDEX IF NOT EXISTS idx_pvp_queue_user_guild ON pvp_queue(user_id, guild_id);
                CREATE INDEX IF NOT EXISTS idx_pvp_queue_power_level ON pvp_queue(power_level);
            `);

            // Guild settings table
            await this.query(`
                CREATE TABLE IF NOT EXISTS guild_settings (
                    guild_id TEXT PRIMARY KEY,
                    gacha_channel TEXT,
                    pvp_channel TEXT,
                    admin_channel TEXT,
                    welcome_channel TEXT,
                    daily_reward BOOLEAN DEFAULT TRUE,
                    gacha_cooldown INTEGER DEFAULT 300,
                    pvp_enabled BOOLEAN DEFAULT TRUE,
                    prefix VARCHAR(10) DEFAULT '!',
                    language VARCHAR(10) DEFAULT 'en',
                    timezone VARCHAR(50) DEFAULT 'UTC',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Battle history table
            await this.query(`
                CREATE TABLE IF NOT EXISTS battle_history (
                    id SERIAL PRIMARY KEY,
                    guild_id TEXT NOT NULL,
                    player1_id TEXT NOT NULL,
                    player2_id TEXT,
                    player1_character JSONB NOT NULL,
                    player2_character JSONB,
                    winner_id TEXT,
                    battle_type VARCHAR(20) DEFAULT 'pvp' CHECK (battle_type IN ('pvp', 'pve', 'npc', 'marine')),
                    battle_data JSONB DEFAULT '{}',
                    rewards JSONB DEFAULT '{}',
                    duration INTEGER DEFAULT 0,
                    location VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_battle_history_guild_id ON battle_history(guild_id);
                CREATE INDEX IF NOT EXISTS idx_battle_history_player1 ON battle_history(player1_id);
            `);

            console.log('✅ All database tables created/verified successfully');
        } catch (error) {
            console.error('❌ Error creating tables:', error);
        }
    }

    // ===================
    // USER METHODS (Compatible with your existing structure)
    // ===================

    /**
     * Ensure user exists (compatible with your existing method)
     */
    static async ensureUser(userId, username, guildId = null) {
        try {
            const result = await this.query(
                `INSERT INTO users (user_id, username, guild_id, level, base_cp, total_cp, berries, created_at, updated_at)
                 VALUES ($1, $2, $3, 0, 100, 100, 0, NOW(), NOW())
                 ON CONFLICT (user_id) 
                 DO UPDATE SET username = $2, guild_id = $3, updated_at = NOW()
                 RETURNING *`,
                [userId, username, guildId]
            );
            return result[0];
        } catch (error) {
            console.error('Error ensuring user:', error);
            throw error;
        }
    }

    /**
     * Get user (compatible with your existing method)
     */
    static async getUser(userId) {
        try {
            const result = await this.query(
                'SELECT * FROM users WHERE user_id = $1',
                [userId]
            );
            return result[0];
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
            const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

            await this.query(
                `UPDATE users SET ${setClause}, updated_at = NOW() WHERE user_id = $${fields.length + 1}`,
                [...values, userId]
            );

            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            return false;
        }
    }

    // ===================
    // DEVIL FRUIT METHODS (Using your existing table structure)
    // ===================

    /**
     * Get user's characters (using your user_devil_fruits table)
     */
    static async getUserCharacters(userId, options = {}) {
        try {
            let query = `SELECT * FROM user_devil_fruits WHERE user_id = $1`;
            const params = [userId];
            let paramCount = 1;

            if (options.rarity) {
                paramCount++;
                query += ` AND fruit_rarity = $${paramCount}`;
                params.push(options.rarity);
            }

            if (options.element) {
                paramCount++;
                query += ` AND (fruit_element = $${paramCount} OR fruit_fruit_type = $${paramCount})`;
                params.push(options.element);
            }

            if (options.is_favorite !== undefined) {
                paramCount++;
                query += ` AND is_favorite = $${paramCount}`;
                params.push(options.is_favorite);
            }

            query += ` ORDER BY obtained_at DESC`;

            if (options.limit) {
                paramCount++;
                query += ` LIMIT $${paramCount}`;
                params.push(options.limit);
            }

            const result = await this.query(query, params);
            
            // Convert to format expected by PvP system
            return result.map(fruit => ({
                id: fruit.id,
                user_id: fruit.user_id,
                name: fruit.fruit_name,
                rarity: fruit.fruit_rarity,
                element: fruit.fruit_element,
                fruit_type: fruit.fruit_type,
                level: fruit.level || 1,
                experience: fruit.experience || 0,
                hp: fruit.hp || 1000,
                mp: fruit.mp || 500,
                attack: fruit.attack || 100,
                defense: fruit.defense || 80,
                speed: fruit.speed || 90,
                power_level: fruit.power_level || fruit.total_cp || 100,
                avatar_url: fruit.avatar_url,
                is_favorite: fruit.is_favorite || false,
                is_active: fruit.is_active || false,
                obtained_at: fruit.obtained_at
            }));
        } catch (error) {
            console.error('Error getting user characters:', error);
            return [];
        }
    }

    /**
     * Get user's devil fruits (your existing method)
     */
    static async getUserDevilFruits(userId) {
        try {
            const result = await this.query(
                `SELECT *, 
                 (SELECT COUNT(*) FROM user_devil_fruits udf2 
                  WHERE udf2.user_id = $1 AND udf2.fruit_id = user_devil_fruits.fruit_id) as duplicate_count
                 FROM user_devil_fruits 
                 WHERE user_id = $1 
                 ORDER BY obtained_at DESC`,
                [userId]
            );
            return result;
        } catch (error) {
            console.error('Error getting user devil fruits:', error);
            return [];
        }
    }

    /**
     * Get character by ID
     */
    static async getCharacter(characterId) {
        try {
            const result = await this.query(
                `SELECT * FROM user_devil_fruits WHERE id = $1`,
                [characterId]
            );
            
            if (result.length === 0) return null;
            
            const fruit = result[0];
            return {
                id: fruit.id,
                user_id: fruit.user_id,
                name: fruit.fruit_name,
                rarity: fruit.fruit_rarity,
                element: fruit.fruit_element,
                fruit_type: fruit.fruit_type,
                level: fruit.level || 1,
                experience: fruit.experience || 0,
                hp: fruit.hp || 1000,
                mp: fruit.mp || 500,
                attack: fruit.attack || 100,
                defense: fruit.defense || 80,
                speed: fruit.speed || 90,
                power_level: fruit.power_level || fruit.total_cp || 100,
                avatar_url: fruit.avatar_url,
                is_favorite: fruit.is_favorite || false,
                is_active: fruit.is_active || false
            };
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
            const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

            await this.query(
                `UPDATE user_devil_fruits SET ${setClause} WHERE id = $${fields.length + 1}`,
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
                `UPDATE user_devil_fruits SET is_active = FALSE WHERE user_id = $1`,
                [userId]
            );

            // Set new active character
            await this.query(
                `UPDATE user_devil_fruits SET is_active = TRUE WHERE id = $1 AND user_id = $2`,
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
                `SELECT * FROM user_devil_fruits WHERE user_id = $1 AND is_active = TRUE`,
                [userId]
            );
            
            if (result.length === 0) return null;
            
            const fruit = result[0];
            return {
                id: fruit.id,
                user_id: fruit.user_id,
                name: fruit.fruit_name,
                rarity: fruit.fruit_rarity,
                element: fruit.fruit_element,
                fruit_type: fruit.fruit_type,
                level: fruit.level || 1,
                experience: fruit.experience || 0,
                hp: fruit.hp || 1000,
                mp: fruit.mp || 500,
                attack: fruit.attack || 100,
                defense: fruit.defense || 80,
                speed: fruit.speed || 90,
                power_level: fruit.power_level || fruit.total_cp || 100,
                avatar_url: fruit.avatar_url,
                is_favorite: fruit.is_favorite || false,
                is_active: fruit.is_active || false
            };
        } catch (error) {
            console.error('Error getting active character:', error);
            return null;
        }
    }

    /**
     * Add character to user (compatible with your existing addDevilFruit)
     */
    static async addCharacter(userId, characterData) {
        try {
            const result = await this.query(
                `INSERT INTO user_devil_fruits (
                    user_id, fruit_id, fruit_name, fruit_type, fruit_rarity, 
                    fruit_element, fruit_fruit_type, fruit_power, fruit_description, 
                    base_cp, total_cp, hp, mp, attack, defense, speed, power_level, 
                    level, experience, avatar_url, obtained_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW()) 
                RETURNING id`,
                [
                    userId,
                    characterData.id || `char_${Date.now()}`,
                    characterData.name,
                    characterData.fruit_type || characterData.rarity,
                    characterData.rarity,
                    characterData.element,
                    characterData.fruit_type || characterData.element,
                    characterData.power || 'Devil Fruit Power',
                    characterData.description || characterData.power,
                    100, // base_cp
                    characterData.power_level || 100, // total_cp
                    characterData.hp || 1000,
                    characterData.mp || 500,
                    characterData.attack || 100,
                    characterData.defense || 80,
                    characterData.speed || 90,
                    characterData.power_level || 100,
                    characterData.level || 1,
                    characterData.experience || 0,
                    characterData.avatar_url
                ]
            );

            return result[0]?.id;
        } catch (error) {
            console.error('Error adding character:', error);
            return null;
        }
    }

    // ===================
    // ECONOMY METHODS (Compatible with your existing structure)
    // ===================

    /**
     * Add coins to user (works with existing 'berries' column only)
     */
    static async addCoins(userId, amount) {
        try {
            await this.query(
                `UPDATE users SET berries = COALESCE(berries, 0) + $1 WHERE user_id = $2`,
                [amount, userId]
            );
            return true;
        } catch (error) {
            console.error('Error adding coins:', error);
            return false;
        }
    }

    /**
     * Remove coins from user (works with existing 'berries' column only)
     */
    static async removeCoins(userId, amount) {
        try {
            const result = await this.query(
                `UPDATE users SET berries = GREATEST(0, COALESCE(berries, 0) - $1)
                 WHERE user_id = $2 AND COALESCE(berries, 0) >= $1 
                 RETURNING berries`,
                [amount, userId]
            );
            return result.length > 0;
        } catch (error) {
            console.error('Error removing coins:', error);
            return false;
        }
    }

    /**
     * Update user berries (your existing method)
     */
    static async updateUserBerries(userId, amount, reason = 'Unknown') {
        try {
            const result = await this.query(
                `UPDATE users 
                 SET berries = COALESCE(berries, 0) + $2,
                     total_earned = CASE WHEN $2 > 0 THEN COALESCE(total_earned, 0) + $2 ELSE COALESCE(total_earned, 0) END,
                     total_spent = CASE WHEN $2 < 0 THEN COALESCE(total_spent, 0) + ABS($2) ELSE COALESCE(total_spent, 0) END,
                     updated_at = NOW()
                 WHERE user_id = $1
                 RETURNING berries`,
                [userId, amount]
            );
            
            if (result.length === 0) {
                throw new Error('User not found');
            }
            
            return result[0].berries;
        } catch (error) {
            console.error('Error updating berries:', error);
            throw error;
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
                `SELECT id FROM pvp_queue WHERE user_id = $1 AND guild_id = $2 AND status = 'waiting'`,
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
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'waiting') RETURNING id`,
                [
                    queueEntry.user_id,
                    queueEntry.guild_id,
                    JSON.stringify(queueEntry.character_data),
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
                queueId: result[0].id,
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
                 WHERE guild_id = $1 AND status = 'waiting' 
                 AND joined_at <= (SELECT joined_at FROM pvp_queue WHERE user_id = $2 AND guild_id = $1 AND status = 'waiting')`,
                [guildId, userId]
            );

            return parseInt(result[0]?.position) || 0;
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
                 WHERE guild_id = $1 AND queue_type = $2 AND status = 'waiting' 
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
                `SELECT * FROM pvp_queue WHERE user_id = $1 AND guild_id = $2 AND status = 'waiting'`,
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
                 WHERE guild_id = $1 AND user_id != $2 AND status = 'waiting'
                 AND power_level BETWEEN $3 AND $4
                 ORDER BY ABS(power_level - $5) ASC, joined_at ASC
                 LIMIT 1`,
                [guildId, userId, userPower - powerRange, userPower + powerRange, userPower]
            );

            if (opponents.length > 0) {
                const opponent = opponents[0];
                
                // Update both entries to 'matched'
                await this.query(
                    `UPDATE pvp_queue SET status = 'matched', matched_at = CURRENT_TIMESTAMP WHERE id = ANY($1)`,
                    [[user.id, opponent.id]]
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
                `DELETE FROM pvp_queue WHERE user_id = $1 AND guild_id = $2 AND status = 'waiting'`,
                [userId, guildId]
            );

            return result.rowCount > 0;
        } catch (error) {
            console.error('Error removing from queue:', error);
            return false;
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
                    COUNT(CASE WHEN is_npc = TRUE THEN 1 END) as npc_count,
                    COUNT(CASE WHEN is_npc = FALSE THEN 1 END) as player_count,
                    COALESCE(AVG(power_level), 0) as avg_power,
                    COALESCE(MIN(power_level), 0) as min_power,
                    COALESCE(MAX(power_level), 0) as max_power
                 FROM pvp_queue 
                 WHERE guild_id = $1 AND status = 'waiting'`,
                [guildId]
            );

            const result = stats[0] || {};
            return {
                total_waiting: parseInt(result.total_waiting) || 0,
                npc_count: parseInt(result.npc_count) || 0,
                player_count: parseInt(result.player_count) || 0,
                avg_power: Math.round(parseFloat(result.avg_power)) || 0,
                min_power: parseInt(result.min_power) || 0,
                max_power: parseInt(result.max_power) || 0
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
    // GUILD SETTINGS METHODS
    // ===================

    /**
     * Get guild settings
     */
    static async getGuildSettings(guildId) {
        try {
            let settings = await this.query(
                `SELECT * FROM guild_settings WHERE guild_id = $1`,
                [guildId]
            );

            if (settings.length === 0) {
                // Create default settings
                await this.query(
                    `INSERT INTO guild_settings (guild_id) VALUES ($1)`,
                    [guildId]
                );
                settings = await this.query(`SELECT * FROM guild_settings WHERE guild_id = $1`, [guildId]);
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
            const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

            await this.query(
                `UPDATE guild_settings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE guild_id = $${fields.length + 1}`,
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
                `SELECT ${settingName} FROM guild_settings WHERE guild_id = $1`,
                [guildId]
            );
            return result[0] ? result[0][settingName] : null;
        } catch (error) {
            console.error('Error getting guild setting:', error);
            return null;
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
                `INSERT INTO battle_history (guild_id, player1_id, player2_id, player1_character, player2_character, winner_id, battle_type, battle_data, rewards, duration, location) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
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
                    battleData.duration || 0,
                    battleData.location || 'Grand Line'
                ]
            );

            return result[0]?.id;
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
                 WHERE player1_id = $1 OR player2_id = $1 
                 ORDER BY created_at DESC 
                 LIMIT $2`,
                [userId, limit]
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
    // UTILITY METHODS
    // ===================

    /**
     * Get leaderboard (compatible with your existing method)
     */
    static async getLeaderboard(type = 'level', limit = 10, guildId = null) {
        try {
            let query = '';
            let params = [limit];

            switch (type) {
                case 'level':
                    query = `SELECT user_id as id, username, level, experience FROM users ORDER BY level DESC, experience DESC LIMIT $1`;
                    break;
                case 'berries':
                case 'coins':
                    query = `SELECT user_id as id, username, COALESCE(berries, 0) as berries FROM users ORDER BY COALESCE(berries, 0) DESC LIMIT $1`;
                    break;
                case 'cp':
                    query = `SELECT user_id as id, username, total_cp, level FROM users ORDER BY total_cp DESC LIMIT $1`;
                    break;
                case 'fruits':
                case 'characters':
                    query = `SELECT u.user_id as id, u.username, COUNT(df.id) as fruit_count 
                             FROM users u 
                             LEFT JOIN user_devil_fruits df ON u.user_id = df.user_id 
                             GROUP BY u.user_id, u.username 
                             ORDER BY fruit_count DESC 
                             LIMIT $1`;
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
     * Get server stats (your existing method)
     */
    static async getServerStats() {
        try {
            const userCount = await this.query('SELECT COUNT(*) as count FROM users');
            const fruitCount = await this.query('SELECT COUNT(*) as count FROM user_devil_fruits');
            const totalBerries = await this.query('SELECT SUM(COALESCE(berries, 0)) as total FROM users');
            
            return {
                totalUsers: parseInt(userCount[0].count),
                totalFruits: parseInt(fruitCount[0].count),
                totalBerries: parseInt(totalBerries[0].total || 0)
            };
        } catch (error) {
            console.error('Error getting server stats:', error);
            return { totalUsers: 0, totalFruits: 0, totalBerries: 0 };
        }
    }

    // ===================
    // COMPATIBILITY ALIASES
    // ===================

    /**
     * Aliases for backward compatibility with your existing code
     */
    static async addBerries(userId, amount) {
        return await this.addCoins(userId, amount);
    }

    static async removeBerries(userId, amount) {
        return await this.removeCoins(userId, amount);
    }

    static async getUserBerries(userId) {
        try {
            const result = await this.query(
                'SELECT COALESCE(berries, 0) as berries FROM users WHERE user_id = $1',
                [userId]
            );
            return result[0] ? result[0].berries : 0;
        } catch (error) {
            console.error('Error getting berries:', error);
            return 0;
        }
    }

    static async addDevilFruit(userId, fruitData) {
        return await this.addCharacter(userId, fruitData);
    }

    static async getDevilFruit(fruitId) {
        return await this.getCharacter(fruitId);
    }

    static async updateDevilFruit(fruitId, updateData) {
        return await this.updateCharacter(fruitId, updateData);
    }

    static async setActiveDevilFruit(userId, fruitId) {
        return await this.setActiveCharacter(userId, fruitId);
    }

    static async getActiveDevilFruit(userId) {
        return await this.getActiveCharacter(userId);
    }

    // ===================
    // DEBUG METHODS
    // ===================

    /**
     * Debug method to check database structure and content
     */
    static async debugUserData(userId) {
        try {
            console.log(`🔍 Debugging user data for: ${userId}`);
            
            // Check if user exists
            const user = await this.query('SELECT * FROM users WHERE user_id = $1', [userId]);
            console.log('👤 User data:', user[0] || 'User not found');
            
            // Check user's devil fruits
            const fruits = await this.query('SELECT * FROM user_devil_fruits WHERE user_id = $1', [userId]);
            console.log(`🍎 Devil fruits count: ${fruits.length}`);
            
            if (fruits.length > 0) {
                console.log('🍎 Sample fruit:', fruits[0]);
            }
            
            return {
                user: user[0] || null,
                fruitsCount: fruits.length,
                fruits: fruits
            };
        } catch (error) {
            console.error('Error debugging user data:', error);
            return null;
        }
    }

    /**
     * Close database connection
     */
    static async close() {
        try {
            if (this.pool) {
                await this.pool.end();
                console.log('✅ Database connection pool closed');
            }
        } catch (error) {
            console.error('❌ Error closing database connection:', error);
        }
    }
}

module.exports = DatabaseManager;
