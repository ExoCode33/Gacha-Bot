// src/database/manager.js - Database Manager v2.2 - Fixed exports
const { Pool } = require('pg');

class DatabaseManager {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        
        this.pool.on('error', (err) => {
            console.error('❌ Unexpected PostgreSQL error:', err);
        });
    }

    async query(text, params) {
        const start = Date.now();
        let client;
        
        try {
            client = await this.pool.connect();
            const result = await client.query(text, params);
            const duration = Date.now() - start;
            
            if (duration > 1000) {
                console.warn(`⚠️ Slow query detected (${duration}ms)`);
            }
            
            return result;
        } catch (error) {
            console.error('❌ Database query error:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    async initializeDatabase() {
        try {
            console.log('🗄️ Initializing database...');
            
            // Users table
            await this.query(`
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    username VARCHAR(255) NOT NULL,
                    guild_id TEXT,
                    level INTEGER DEFAULT 0,
                    base_cp INTEGER DEFAULT 100,
                    total_cp INTEGER DEFAULT 0,
                    berries BIGINT DEFAULT 0,
                    total_earned BIGINT DEFAULT 0,
                    total_spent BIGINT DEFAULT 0,
                    last_income TIMESTAMP DEFAULT NOW(),
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);
            
            // Devil Fruits collection table - Updated with fruitType
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
                )
            `);
            
            // Add new column if it doesn't exist (for migration)
            await this.query(`
                ALTER TABLE user_devil_fruits 
                ADD COLUMN IF NOT EXISTS fruit_fruit_type VARCHAR(50) DEFAULT 'Unknown'
            `);
            
            // User level tracking
            await this.query(`
                CREATE TABLE IF NOT EXISTS user_levels (
                    user_id TEXT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
                    current_level INTEGER DEFAULT 0,
                    role_name VARCHAR(50),
                    base_cp INTEGER DEFAULT 100,
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);
            
            // Income tracking
            await this.query(`
                CREATE TABLE IF NOT EXISTS income_history (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
                    amount BIGINT NOT NULL,
                    cp_at_time INTEGER NOT NULL,
                    income_type VARCHAR(50) DEFAULT 'automatic',
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            
            // Create indexes for performance
            await this.query(`CREATE INDEX IF NOT EXISTS idx_users_level ON users(level)`);
            await this.query(`CREATE INDEX IF NOT EXISTS idx_users_total_cp ON users(total_cp)`);
            await this.query(`CREATE INDEX IF NOT EXISTS idx_devil_fruits_user ON user_devil_fruits(user_id)`);
            await this.query(`CREATE INDEX IF NOT EXISTS idx_devil_fruits_fruit_id ON user_devil_fruits(fruit_id)`);
            await this.query(`CREATE INDEX IF NOT EXISTS idx_devil_fruits_element ON user_devil_fruits(fruit_element)`);
            await this.query(`CREATE INDEX IF NOT EXISTS idx_devil_fruits_fruit_type ON user_devil_fruits(fruit_fruit_type)`);
            await this.query(`CREATE INDEX IF NOT EXISTS idx_income_history_user ON income_history(user_id)`);
            
            console.log('✅ Database tables created successfully');
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    // User management
    async ensureUser(userId, username, guildId = null) {
        try {
            const result = await this.query(
                `INSERT INTO users (user_id, username, guild_id, level, base_cp, total_cp, berries, created_at, updated_at)
                 VALUES ($1, $2, $3, 0, 100, 100, 0, NOW(), NOW())
                 ON CONFLICT (user_id) 
                 DO UPDATE SET username = $2, guild_id = $3, updated_at = NOW()
                 RETURNING *`,
                [userId, username, guildId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error ensuring user:', error);
            throw error;
        }
    }

    async getUser(userId) {
        try {
            const result = await this.query(
                'SELECT * FROM users WHERE user_id = $1',
                [userId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    async getUserLevel(userId) {
        try {
            const user = await this.getUser(userId);
            return user ? user.level : 0;
        } catch (error) {
            console.error('Error getting user level:', error);
            return 0;
        }
    }

    async updateUserLevel(userId, level, roleName, baseCp) {
        try {
            // Update user level and base CP
            await this.query(
                `UPDATE users 
                 SET level = $2, base_cp = $3, updated_at = NOW()
                 WHERE user_id = $1`,
                [userId, level, baseCp]
            );
            
            // Update user_levels table
            await this.query(
                `INSERT INTO user_levels (user_id, current_level, role_name, base_cp, updated_at)
                 VALUES ($1, $2, $3, $4, NOW())
                 ON CONFLICT (user_id)
                 DO UPDATE SET current_level = $2, role_name = $3, base_cp = $4, updated_at = NOW()`,
                [userId, level, roleName, baseCp]
            );
            
            // Recalculate total CP
            await this.recalculateUserCP(userId);
            
        } catch (error) {
            console.error('Error updating user level:', error);
            throw error;
        }
    }

    async recalculateUserCP(userId) {
        try {
            // Get user's base CP
            const user = await this.getUser(userId);
            if (!user) return;
            
            const baseCp = user.base_cp;
            
            // Get all user's devil fruits with duplicates
            const fruits = await this.query(
                `SELECT fruit_id, base_cp, duplicate_count 
                 FROM user_devil_fruits 
                 WHERE user_id = $1`,
                [userId]
            );
            
            // Start with base CP
            let totalCp = baseCp;
            
            // Calculate CP for each fruit type
            const fruitGroups = {};
            fruits.rows.forEach(fruit => {
                if (!fruitGroups[fruit.fruit_id]) {
                    fruitGroups[fruit.fruit_id] = {
                        baseCp: fruit.base_cp,
                        count: 0
                    };
                }
                fruitGroups[fruit.fruit_id].count++;
            });
            
            // Calculate total CP with fruit multipliers and duplicate bonuses
            Object.values(fruitGroups).forEach(group => {
                // Convert stored integer back to decimal for calculation
                const multiplier = group.baseCp / 100;
                const duplicateBonus = 1 + ((group.count - 1) * 0.01); // 1% per duplicate
                const fruitCp = (baseCp * multiplier) * duplicateBonus;
                totalCp += fruitCp;
            });
            
            // Update user's total CP
            await this.query(
                `UPDATE users SET total_cp = $2, updated_at = NOW() WHERE user_id = $1`,
                [userId, Math.floor(totalCp)]
            );
            
            return Math.floor(totalCp);
            
        } catch (error) {
            console.error('Error recalculating user CP:', error);
            throw error;
        }
    }

    // Devil Fruit management - Updated for new structure
    async addDevilFruit(userId, fruitData) {
        try {
            // Check if user already has this fruit
            const existing = await this.query(
                `SELECT * FROM user_devil_fruits 
                 WHERE user_id = $1 AND fruit_id = $2`,
                [userId, fruitData.id]
            );
            
            let duplicateCount = 1;
            let isNewFruit = true;
            
            if (existing.rows.length > 0) {
                // It's a duplicate
                duplicateCount = existing.rows.length + 1;
                isNewFruit = false;
            }
            
            // Get user's base CP for calculation
            const user = await this.getUser(userId);
            const baseCp = user.base_cp;
            
            // Store multiplier as integer (multiply by 100)
            const multiplierAsInt = Math.floor((fruitData.multiplier || 1.0) * 100);
            const totalCp = baseCp * (fruitData.multiplier || 1.0);
            
            // Add the fruit with both element (legacy) and fruitType (new)
            const result = await this.query(
                `INSERT INTO user_devil_fruits (
                    user_id, fruit_id, fruit_name, fruit_type, fruit_rarity, 
                    fruit_element, fruit_fruit_type, fruit_power, fruit_description, base_cp, 
                    duplicate_count, total_cp, obtained_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
                 RETURNING *`,
                [userId, fruitData.id, fruitData.name, fruitData.type, fruitData.rarity,
                 fruitData.element || fruitData.fruitType || 'Unknown', 
                 fruitData.fruitType || 'Unknown', 
                 fruitData.power, fruitData.description || fruitData.power, 
                 multiplierAsInt, duplicateCount, totalCp]
            );
            
            // Recalculate user's total CP
            const newTotalCp = await this.recalculateUserCP(userId);
            
            return {
                fruit: result.rows[0],
                isNewFruit,
                duplicateCount,
                totalCp: newTotalCp
            };
            
        } catch (error) {
            console.error('Error adding devil fruit:', error);
            throw error;
        }
    }

    async getUserDevilFruits(userId) {
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
            return result.rows;
        } catch (error) {
            console.error('Error getting user devil fruits:', error);
            return [];
        }
    }

    async getUserFruitsByElement(userId, element) {
        try {
            const result = await this.query(
                `SELECT * FROM user_devil_fruits 
                 WHERE user_id = $1 AND (fruit_element = $2 OR fruit_fruit_type = $2)`,
                [userId, element]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting fruits by element:', error);
            return [];
        }
    }

    // Economy management
    async updateUserBerries(userId, amount, reason = 'Unknown') {
        try {
            const result = await this.query(
                `UPDATE users 
                 SET berries = berries + $2, 
                     total_earned = CASE WHEN $2 > 0 THEN total_earned + $2 ELSE total_earned END,
                     total_spent = CASE WHEN $2 < 0 THEN total_spent + ABS($2) ELSE total_spent END,
                     updated_at = NOW()
                 WHERE user_id = $1
                 RETURNING berries`,
                [userId, amount]
            );
            
            if (result.rows.length === 0) {
                throw new Error('User not found');
            }
            
            return result.rows[0].berries;
        } catch (error) {
            console.error('Error updating berries:', error);
            throw error;
        }
    }

    async getUserBerries(userId) {
        try {
            const result = await this.query(
                'SELECT berries FROM users WHERE user_id = $1',
                [userId]
            );
            return result.rows[0] ? result.rows[0].berries : 0;
        } catch (error) {
            console.error('Error getting berries:', error);
            return 0;
        }
    }

    // Income tracking
    async recordIncome(userId, amount, cpAtTime, incomeType = 'automatic') {
        try {
            await this.query(
                `INSERT INTO income_history (user_id, amount, cp_at_time, income_type, created_at)
                 VALUES ($1, $2, $3, $4, NOW())`,
                [userId, amount, cpAtTime, incomeType]
            );
            
            // Update last income time
            await this.query(
                `UPDATE users SET last_income = NOW() WHERE user_id = $1`,
                [userId]
            );
            
        } catch (error) {
            console.error('Error recording income:', error);
            throw error;
        }
    }

    // Statistics
    async getServerStats() {
        try {
            const userCount = await this.query('SELECT COUNT(*) as count FROM users');
            const fruitCount = await this.query('SELECT COUNT(*) as count FROM user_devil_fruits');
            const totalBerries = await this.query('SELECT SUM(berries) as total FROM users');
            
            return {
                totalUsers: parseInt(userCount.rows[0].count),
                totalFruits: parseInt(fruitCount.rows[0].count),
                totalBerries: parseInt(totalBerries.rows[0].total || 0)
            };
        } catch (error) {
            console.error('Error getting server stats:', error);
            return { totalUsers: 0, totalFruits: 0, totalBerries: 0 };
        }
    }

    async getLeaderboard(type = 'cp', limit = 10) {
        try {
            let query;
            
            switch (type) {
                case 'cp':
                    query = `
                        SELECT user_id, username, total_cp, level
                        FROM users 
                        ORDER BY total_cp DESC 
                        LIMIT $1
                    `;
                    break;
                case 'berries':
                    query = `
                        SELECT user_id, username, berries, total_earned
                        FROM users 
                        ORDER BY berries DESC 
                        LIMIT $1
                    `;
                    break;
                case 'fruits':
                    query = `
                        SELECT u.user_id, u.username, COUNT(DISTINCT df.fruit_id) as unique_fruits
                        FROM users u
                        LEFT JOIN user_devil_fruits df ON u.user_id = df.user_id
                        GROUP BY u.user_id, u.username
                        ORDER BY unique_fruits DESC 
                        LIMIT $1
                    `;
                    break;
                case 'level':
                    query = `
                        SELECT user_id, username, level, base_cp
                        FROM users 
                        ORDER BY level DESC, base_cp DESC 
                        LIMIT $1
                    `;
                    break;
                default:
                    throw new Error('Invalid leaderboard type');
            }
            
            const result = await this.query(query, [limit]);
            return result.rows;
            
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    }

    async close() {
        try {
            await this.pool.end();
            console.log('🔒 Database connection pool closed');
        } catch (error) {
            console.error('❌ Error closing database pool:', error);
        }
    }
}

// Export as singleton
module.exports = new DatabaseManager();
