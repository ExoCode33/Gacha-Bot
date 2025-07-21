// src/database/manager.js - Complete Database Manager Class for PostgreSQL
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
                    berries BIGINT DEFAULT 10000,
                    gems INTEGER DEFAULT 0,
                    experience BIGINT DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    daily_streak INTEGER DEFAULT 0,
                    last_daily TIMESTAMP,
                    pirate_crew VARCHAR(255),
                    bounty BIGINT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
                CREATE INDEX IF NOT EXISTS idx_users_berries ON users(berries);
                CREATE INDEX IF NOT EXISTS idx_users_bounty ON users(bounty);
            `);

            // Devil Fruits table (characters)
            await this.query(`
                CREATE TABLE IF NOT EXISTS devil_fruits (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    fruit_type VARCHAR(50) NOT NULL CHECK (fruit_type IN ('Paramecia', 'Zoan', 'Logia', 'Mythical Zoan', 'Ancient Zoan')),
                    rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
                    element VARCHAR(50),
                    level INTEGER DEFAULT 1,
                    experience BIGINT DEFAULT 0,
                    hp INTEGER NOT NULL,
                    mp INTEGER NOT NULL,
                    attack INTEGER NOT NULL,
                    defense INTEGER NOT NULL,
                    speed INTEGER NOT NULL,
                    power_level INTEGER DEFAULT 0,
                    avatar_url TEXT,
                    description TEXT,
                    abilities JSONB DEFAULT '[]',
                    is_favorite BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT FALSE,
                    awakened BOOLEAN DEFAULT FALSE,
                    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_devil_fruits_user_id ON devil_fruits(user_id);
                CREATE INDEX IF NOT EXISTS idx_devil_fruits_rarity ON devil_fruits(rarity);
                CREATE INDEX IF NOT EXISTS idx_devil_fruits_power_level ON devil_fruits(power_level);
                CREATE INDEX IF NOT EXISTS idx_devil_fruits_type ON devil_fruits(fruit_type);
                CREATE INDEX IF NOT EXISTS idx_devil_fruits_element ON devil_fruits(element);
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
                    gacha_cooldown INTEGER DEFAULT 300,
                    pvp_enabled BOOLEAN DEFAULT TRUE,
                    prefix VARCHAR(10) DEFAULT '!',
                    language VARCHAR(10) DEFAULT 'en',
                    timezone VARCHAR(50) DEFAULT 'UTC',
                    marine_role VARCHAR(255),
                    pirate_role VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // PvP queue table
            await this.query(`
                CREATE TABLE IF NOT EXISTS pvp_queue (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    guild_id VARCHAR(255) NOT NULL,
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
                CREATE INDEX IF NOT EXISTS idx_pvp_queue_joined_at ON pvp_queue(joined_at);
            `);

            // Battle history table
            await this.query(`
                CREATE TABLE IF NOT EXISTS battle_history (
                    id SERIAL PRIMARY KEY,
                    guild_id VARCHAR(255) NOT NULL,
                    player1_id VARCHAR(255) NOT NULL,
                    player2_id VARCHAR(255),
                    player1_character JSONB NOT NULL,
                    player2_character JSONB,
                    winner_id VARCHAR(255),
                    battle_type VARCHAR(20) DEFAULT 'pvp' CHECK (battle_type IN ('pvp', 'pve', 'npc', 'marine')),
                    battle_data JSONB DEFAULT '{}',
                    rewards JSONB DEFAULT '{}',
                    duration INTEGER DEFAULT 0,
                    location VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_battle_history_guild_id ON battle_history(guild_id);
                CREATE INDEX IF NOT EXISTS idx_battle_history_player1 ON battle_history(player1_id);
                CREATE INDEX IF NOT EXISTS idx_battle_history_player2 ON battle_history(player2_id);
                CREATE INDEX IF NOT EXISTS idx_battle_history_winner ON battle_history(winner_id);
                CREATE INDEX IF NOT EXISTS idx_battle_history_type ON battle_history(battle_type);
            `);

            // Inventory table
            await this.query(`
                CREATE TABLE IF NOT EXISTS inventory (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('treasure', 'weapon', 'medicine', 'material', 'scroll', 'map')),
                    item_name VARCHAR(255) NOT NULL,
                    item_data JSONB DEFAULT '{}',
                    quantity INTEGER DEFAULT 1,
                    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_inventory_user_item ON inventory(user_id, item_type);
                CREATE INDEX IF NOT EXISTS idx_inventory_item_name ON inventory(item_name);
            `);

            // Achievements table
            await this.query(`
                CREATE TABLE IF NOT EXISTS achievements (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    achievement_id VARCHAR(100) NOT NULL,
                    progress INTEGER DEFAULT 0,
                    completed BOOLEAN DEFAULT FALSE,
                    completed_at TIMESTAMP,
                    rewards_claimed BOOLEAN DEFAULT FALSE,
                    UNIQUE(user_id, achievement_id)
                );
                CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
                CREATE INDEX IF NOT EXISTS idx_achievements_completed ON achievements(completed);
            `);

            // Crew system table
            await this.query(`
                CREATE TABLE IF NOT EXISTS crews (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) UNIQUE NOT NULL,
                    captain_id VARCHAR(255) NOT NULL REFERENCES users(id),
                    description TEXT,
                    jolly_roger TEXT,
                    total_bounty BIGINT DEFAULT 0,
                    member_count INTEGER DEFAULT 1,
                    max_members INTEGER DEFAULT 10,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_crews_captain ON crews(captain_id);
                CREATE INDEX IF NOT EXISTS idx_crews_bounty ON crews(total_bounty);
            `);

            // Crew members table
            await this.query(`
                CREATE TABLE IF NOT EXISTS crew_members (
                    id SERIAL PRIMARY KEY,
                    crew_id INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
                    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    role VARCHAR(50) DEFAULT 'member',
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id)
                );
                CREATE INDEX IF NOT EXISTS idx_crew_members_crew ON crew_members(crew_id);
                CREATE INDEX IF NOT EXISTS idx_crew_members_user ON crew_members(user_id);
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
                `SELECT * FROM users WHERE id = $1`,
                [userId]
            );

            if (user.length === 0) {
                // Create new user
                await this.query(
                    `INSERT INTO users (id, username, discriminator, avatar) VALUES ($1, $2, $3, $4)`,
                    [userId, userData.username || 'Unknown', userData.discriminator || '0000', userData.avatar || null]
                );

                user = await this.query(`SELECT * FROM users WHERE id = $1`, [userId]);
            }

            return user[0];
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    /**
     * Ensure user exists (alias for getUser for compatibility)
     */
    static async ensureUser(userId, userData = {}) {
        return await this.getUser(userId, userData);
    }

    /**
     * Get user's characters (alias for getUserDevilFruits for compatibility)
     */
    static async getUserCharacters(userId, options = {}) {
        return await this.getUserDevilFruits(userId, options);
    }

    /**
     * Get character by ID (alias for getDevilFruit for compatibility)
     */
    static async getCharacter(characterId) {
        return await this.getDevilFruit(characterId);
    }

    /**
     * Update character (alias for updateDevilFruit for compatibility)
     */
    static async updateCharacter(characterId, updateData) {
        return await this.updateDevilFruit(characterId, updateData);
    }

    /**
     * Set active character (alias for setActiveDevilFruit for compatibility)
     */
    static async setActiveCharacter(userId, characterId) {
        return await this.setActiveDevilFruit(userId, characterId);
    }

    /**
     * Get user's active character (alias for getActiveDevilFruit for compatibility)
     */
    static async getActiveCharacter(userId) {
        return await this.getActiveDevilFruit(userId);
    }

    /**
     * Add coins to user (alias for addBerries for compatibility)
     */
    static async addCoins(userId, amount) {
        return await this.addBerries(userId, amount);
    }

    /**
     * Remove coins from user (alias for removeBerries for compatibility)
     */
    static async removeCoins(userId, amount) {
        return await this.removeBerries(userId, amount);
    }

    /**
     * Add character to user (alias for addDevilFruit for compatibility)
     */
    static async addCharacter(userId, characterData) {
        return await this.addDevilFruit(userId, characterData);
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
                `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fields.length + 1}`,
                [...values, userId]
            );

            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            return false;
        }
    }

    /**
     * Add berries to user
     */
    static async addBerries(userId, amount) {
        try {
            await this.query(
                `UPDATE users SET berries = berries + $1 WHERE id = $2`,
                [amount, userId]
            );
            return true;
        } catch (error) {
            console.error('Error adding berries:', error);
            return false;
        }
    }

    /**
     * Remove berries from user
     */
    static async removeBerries(userId, amount) {
        try {
            const result = await this.query(
                `UPDATE users SET berries = GREATEST(0, berries - $1) WHERE id = $2 AND berries >= $1 RETURNING berries`,
                [amount, userId]
            );
            return result.length > 0;
        } catch (error) {
            console.error('Error removing berries:', error);
            return false;
        }
    }

    // ===================
    // DEVIL FRUIT METHODS
    // ===================

    /**
     * Add devil fruit to user
     */
    static async addDevilFruit(userId, fruitData) {
        try {
            const result = await this.query(
                `INSERT INTO devil_fruits (user_id, name, fruit_type, rarity, element, level, experience, hp, mp, attack, defense, speed, power_level, avatar_url, description, abilities) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
                [
                    userId,
                    fruitData.name,
                    fruitData.fruit_type,
                    fruitData.rarity,
                    fruitData.element,
                    fruitData.level || 1,
                    fruitData.experience || 0,
                    fruitData.hp,
                    fruitData.mp,
                    fruitData.attack,
                    fruitData.defense,
                    fruitData.speed,
                    fruitData.power_level || 0,
                    fruitData.avatar_url || null,
                    fruitData.description || '',
                    JSON.stringify(fruitData.abilities || [])
                ]
            );

            return result[0]?.id;
        } catch (error) {
            console.error('Error adding devil fruit:', error);
            return null;
        }
    }

    /**
     * Get user's devil fruits
     */
    static async getUserDevilFruits(userId, options = {}) {
        try {
            let query = `SELECT * FROM devil_fruits WHERE user_id = $1`;
            const params = [userId];
            let paramCount = 1;

            if (options.rarity) {
                paramCount++;
                query += ` AND rarity = $${paramCount}`;
                params.push(options.rarity);
            }

            if (options.fruit_type) {
                paramCount++;
                query += ` AND fruit_type = $${paramCount}`;
                params.push(options.fruit_type);
            }

            if (options.element) {
                paramCount++;
                query += ` AND element = $${paramCount}`;
                params.push(options.element);
            }

            if (options.is_favorite !== undefined) {
                paramCount++;
                query += ` AND is_favorite = $${paramCount}`;
                params.push(options.is_favorite);
            }

            if (options.orderBy) {
                query += ` ORDER BY ${options.orderBy}`;
                if (options.order === 'DESC') query += ' DESC';
            }

            if (options.limit) {
                paramCount++;
                query += ` LIMIT $${paramCount}`;
                params.push(options.limit);
            }

            return await this.query(query, params);
        } catch (error) {
            console.error('Error getting user devil fruits:', error);
            return [];
        }
    }

    /**
     * Get devil fruit by ID
     */
    static async getDevilFruit(fruitId) {
        try {
            const result = await this.query(
                `SELECT * FROM devil_fruits WHERE id = $1`,
                [fruitId]
            );
            return result[0] || null;
        } catch (error) {
            console.error('Error getting devil fruit:', error);
            return null;
        }
    }

    /**
     * Update devil fruit
     */
    static async updateDevilFruit(fruitId, updateData) {
        try {
            const fields = Object.keys(updateData);
            const values = Object.values(updateData);
            const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

            await this.query(
                `UPDATE devil_fruits SET ${setClause} WHERE id = $${fields.length + 1}`,
                [...values, fruitId]
            );

            return true;
        } catch (error) {
            console.error('Error updating devil fruit:', error);
            return false;
        }
    }

    /**
     * Set active devil fruit
     */
    static async setActiveDevilFruit(userId, fruitId) {
        try {
            // Remove active status from all user's fruits
            await this.query(
                `UPDATE devil_fruits SET is_active = FALSE WHERE user_id = $1`,
                [userId]
            );

            // Set new active fruit
            await this.query(
                `UPDATE devil_fruits SET is_active = TRUE WHERE id = $1 AND user_id = $2`,
                [fruitId, userId]
            );

            return true;
        } catch (error) {
            console.error('Error setting active devil fruit:', error);
            return false;
        }
    }

    /**
     * Get user's active devil fruit
     */
    static async getActiveDevilFruit(userId) {
        try {
            const result = await this.query(
                `SELECT * FROM devil_fruits WHERE user_id = $1 AND is_active = TRUE`,
                [userId]
            );
            return result[0] || null;
        } catch (error) {
            console.error('Error getting active devil fruit:', error);
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
     * Clear old queue entries (cleanup)
     */
    static async clearOldQueueEntries(hoursOld = 24) {
        try {
            await this.query(
                `DELETE FROM pvp_queue WHERE joined_at < NOW() - INTERVAL '${hoursOld} hours'`
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
    // INVENTORY METHODS
    // ===================

    /**
     * Add item to inventory
     */
    static async addInventoryItem(userId, itemType, itemName, itemData = {}, quantity = 1) {
        try {
            // Check if item already exists
            const existing = await this.query(
                `SELECT * FROM inventory WHERE user_id = $1 AND item_type = $2 AND item_name = $3`,
                [userId, itemType, itemName]
            );

            if (existing.length > 0) {
                // Update quantity
                await this.query(
                    `UPDATE inventory SET quantity = quantity + $1 WHERE id = $2`,
                    [quantity, existing[0].id]
                );
                return existing[0].id;
            } else {
                // Insert new item
                const result = await this.query(
                    `INSERT INTO inventory (user_id, item_type, item_name, item_data, quantity) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [userId, itemType, itemName, JSON.stringify(itemData), quantity]
                );
                return result[0]?.id;
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
            let query = `SELECT * FROM inventory WHERE user_id = $1`;
            const params = [userId];

            if (itemType) {
                query += ` AND item_type = $2`;
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
                `SELECT * FROM inventory WHERE user_id = $1 AND item_type = $2 AND item_name = $3`,
                [userId, itemType, itemName]
            );

            if (item.length === 0 || item[0].quantity < quantity) {
                return false;
            }

            if (item[0].quantity === quantity) {
                // Remove item completely
                await this.query(
                    `DELETE FROM inventory WHERE id = $1`,
                    [item[0].id]
                );
            } else {
                // Reduce quantity
                await this.query(
                    `UPDATE inventory SET quantity = quantity - $1 WHERE id = $2`,
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
    // CREW METHODS
    // ===================

    /**
     * Create a new crew
     */
    static async createCrew(captainId, crewName, description = '') {
        try {
            // Check if user is already in a crew
            const existingMember = await this.query(
                `SELECT * FROM crew_members WHERE user_id = $1`,
                [captainId]
            );

            if (existingMember.length > 0) {
                return { success: false, error: 'Already in a crew' };
            }

            // Create crew
            const crewResult = await this.query(
                `INSERT INTO crews (name, captain_id, description) VALUES ($1, $2, $3) RETURNING id`,
                [crewName, captainId, description]
            );

            const crewId = crewResult[0].id;

            // Add captain as member
            await this.query(
                `INSERT INTO crew_members (crew_id, user_id, role) VALUES ($1, $2, 'captain')`,
                [crewId, captainId]
            );

            // Update user's pirate_crew
            await this.query(
                `UPDATE users SET pirate_crew = $1 WHERE id = $2`,
                [crewName, captainId]
            );

            return { success: true, crewId: crewId };
        } catch (error) {
            console.error('Error creating crew:', error);
            return { success: false, error: 'Database error' };
        }
    }

    /**
     * Join a crew
     */
    static async joinCrew(userId, crewId) {
        try {
            // Check if user is already in a crew
            const existingMember = await this.query(
                `SELECT * FROM crew_members WHERE user_id = $1`,
                [userId]
            );

            if (existingMember.length > 0) {
                return { success: false, error: 'Already in a crew' };
            }

            // Check crew exists and has space
            const crew = await this.query(
                `SELECT * FROM crews WHERE id = $1`,
                [crewId]
            );

            if (crew.length === 0) {
                return { success: false, error: 'Crew not found' };
            }

            if (crew[0].member_count >= crew[0].max_members) {
                return { success: false, error: 'Crew is full' };
            }

            // Add member
            await this.query(
                `INSERT INTO crew_members (crew_id, user_id, role) VALUES ($1, $2, 'member')`,
                [crewId, userId]
            );

            // Update crew member count
            await this.query(
                `UPDATE crews SET member_count = member_count + 1 WHERE id = $1`,
                [crewId]
            );

            // Update user's pirate_crew
            await this.query(
                `UPDATE users SET pirate_crew = $1 WHERE id = $2`,
                [crew[0].name, userId]
            );

            return { success: true };
        } catch (error) {
            console.error('Error joining crew:', error);
            return { success: false, error: 'Database error' };
        }
    }

    /**
     * Get crew information
     */
    static async getCrew(crewId) {
        try {
            const crew = await this.query(
                `SELECT c.*, u.username as captain_name 
                 FROM crews c 
                 JOIN users u ON c.captain_id = u.id 
                 WHERE c.id = $1`,
                [crewId]
            );

            if (crew.length === 0) {
                return null;
            }

            // Get crew members
            const members = await this.query(
                `SELECT cm.*, u.username, u.bounty, u.level 
                 FROM crew_members cm 
                 JOIN users u ON cm.user_id = u.id 
                 WHERE cm.crew_id = $1 
                 ORDER BY cm.role DESC, cm.joined_at ASC`,
                [crewId]
            );

            return {
                ...crew[0],
                members: members
            };
        } catch (error) {
            console.error('Error getting crew:', error);
            return null;
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
            let params = [limit];

            switch (type) {
                case 'level':
                    query = `SELECT id, username, level, experience FROM users ORDER BY level DESC, experience DESC LIMIT $1`;
                    break;
                case 'berries':
                    query = `SELECT id, username, berries FROM users ORDER BY berries DESC LIMIT $1`;
                    break;
                case 'bounty':
                    query = `SELECT id, username, bounty FROM users ORDER BY bounty DESC LIMIT $1`;
                    break;
                case 'fruits':
                    query = `SELECT u.id, u.username, COUNT(df.id) as fruit_count 
                             FROM users u 
                             LEFT JOIN devil_fruits df ON u.id = df.user_id 
                             GROUP BY u.id, u.username 
                             ORDER BY fruit_count DESC 
                             LIMIT $1`;
                    break;
                case 'crews':
                    query = `SELECT id, name, total_bounty, member_count 
                             FROM crews 
                             ORDER BY total_bounty DESC 
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
     * Update user bounty and crew total
     */
    static async updateBounty(userId, newBounty) {
        try {
            // Get old bounty
            const user = await this.query(`SELECT bounty, pirate_crew FROM users WHERE id = $1`, [userId]);
            if (user.length === 0) return false;

            const oldBounty = user[0].bounty || 0;
            const bountyDiff = newBounty - oldBounty;

            // Update user bounty
            await this.query(`UPDATE users SET bounty = $1 WHERE id = $2`, [newBounty, userId]);

            // Update crew total bounty if user is in a crew
            if (user[0].pirate_crew) {
                await this.query(
                    `UPDATE crews SET total_bounty = total_bounty + $1 WHERE name = $2`,
                    [bountyDiff, user[0].pirate_crew]
                );
            }

            return true;
        } catch (error) {
            console.error('Error updating bounty:', error);
            return false;
        }
    }

    /**
     * Get random devil fruit data for gacha
     */
    static async getRandomDevilFruit(rarity) {
        // This would typically pull from a devil_fruit_templates table
        // For now, returning sample data structure
        const rarityMultipliers = {
            'common': 1.0,
            'uncommon': 1.2,
            'rare': 1.5,
            'epic': 2.0,
            'legendary': 3.0,
            'mythic': 5.0
        };

        const fruitTypes = ['Paramecia', 'Zoan', 'Logia', 'Mythical Zoan', 'Ancient Zoan'];
        const elements = ['Fire', 'Water', 'Earth', 'Wind', 'Light', 'Dark', 'Lightning', 'Ice', 'Nature', 'Magma'];
        
        const baseStats = {
            hp: Math.floor((800 + Math.random() * 400) * rarityMultipliers[rarity]),
            mp: Math.floor((600 + Math.random() * 300) * rarityMultipliers[rarity]),
            attack: Math.floor((100 + Math.random() * 50) * rarityMultipliers[rarity]),
            defense: Math.floor((80 + Math.random() * 40) * rarityMultipliers[rarity]),
            speed: Math.floor((70 + Math.random() * 60) * rarityMultipliers[rarity])
        };

        return {
            name: `${elements[Math.floor(Math.random() * elements.length)]}-${elements[Math.floor(Math.random() * elements.length)]} Fruit`,
            fruit_type: fruitTypes[Math.floor(Math.random() * fruitTypes.length)],
            rarity: rarity,
            element: elements[Math.floor(Math.random() * elements.length)],
            ...baseStats,
            power_level: Math.floor((baseStats.hp * 0.3) + (baseStats.mp * 0.2) + (baseStats.attack * 2) + (baseStats.defense * 1.5) + (baseStats.speed * 1.2)),
            abilities: [
                { name: `${elements[Math.floor(Math.random() * elements.length)]} Strike`, damage: baseStats.attack * 1.5, cost: 30 },
                { name: `${elements[Math.floor(Math.random() * elements.length)]} Blast`, damage: baseStats.attack * 2, cost: 50 }
            ]
        };
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
