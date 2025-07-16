const { Pool } = require('pg');

class DatabaseManager {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    async initialize() {
        try {
            // Create users table
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    discord_id VARCHAR(255) UNIQUE NOT NULL,
                    username VARCHAR(255) NOT NULL,
                    berries INTEGER DEFAULT 0,
                    base_cp INTEGER DEFAULT 100,
                    total_cp INTEGER DEFAULT 100,
                    last_income TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Create user_devil_fruits table with fruitType instead of element
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS user_devil_fruits (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    fruit_name VARCHAR(255) NOT NULL,
                    fruit_type VARCHAR(100) NOT NULL,
                    rarity VARCHAR(50) NOT NULL,
                    base_cp INTEGER NOT NULL,
                    duplicates INTEGER DEFAULT 0,
                    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Create user_levels table
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS user_levels (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    level INTEGER NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Create income_history table
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS income_history (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    amount INTEGER NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Check if we need to migrate from element to fruitType
            try {
                const checkColumn = await this.pool.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'user_devil_fruits' AND column_name = 'element'
                `);

                if (checkColumn.rows.length > 0) {
                    // Migration: rename element to fruitType
                    await this.pool.query(`
                        ALTER TABLE user_devil_fruits 
                        RENAME COLUMN element TO fruit_type
                    `);
                    console.log('✅ Migrated element column to fruit_type');
                }
            } catch (error) {
                // Column doesn't exist or already migrated
                console.log('Migration check completed');
            }

            console.log('✅ Database initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    async getUser(discordId) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM users WHERE discord_id = $1',
                [discordId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    }

    async createUser(discordId, username) {
        try {
            const result = await this.pool.query(
                'INSERT INTO users (discord_id, username, berries, base_cp, total_cp) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [discordId, username, 1000, 100, 100]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async updateUserBerries(discordId, berries) {
        try {
            const result = await this.pool.query(
                'UPDATE users SET berries = $1 WHERE discord_id = $2 RETURNING *',
                [berries, discordId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error updating user berries:', error);
            throw error;
        }
    }

    async addDevilFruit(discordId, fruitName, fruitType, rarity, multiplier) {
        try {
            const user = await this.getUser(discordId);
            if (!user) throw new Error('User not found');

            // Check if user already has this fruit
            const existingFruit = await this.pool.query(
                'SELECT * FROM user_devil_fruits WHERE user_id = $1 AND fruit_name = $2',
                [user.id, fruitName]
            );

            if (existingFruit.rows.length > 0) {
                // Update duplicate count
                const result = await this.pool.query(
                    'UPDATE user_devil_fruits SET duplicates = duplicates + 1 WHERE user_id = $1 AND fruit_name = $2 RETURNING *',
                    [user.id, fruitName]
                );
                return { fruit: result.rows[0], isDuplicate: true };
            } else {
                // Add new fruit - store multiplier as integer (multiply by 100)
                const result = await this.pool.query(
                    'INSERT INTO user_devil_fruits (user_id, fruit_name, fruit_type, rarity, base_cp) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                    [user.id, fruitName, fruitType, rarity, Math.floor(multiplier * 100)]
                );
                return { fruit: result.rows[0], isDuplicate: false };
            }
        } catch (error) {
            console.error('Error adding devil fruit:', error);
            throw error;
        }
    }

    async getUserFruits(discordId) {
        try {
            const user = await this.getUser(discordId);
            if (!user) return [];

            const result = await this.pool.query(
                'SELECT * FROM user_devil_fruits WHERE user_id = $1 ORDER BY obtained_at DESC',
                [user.id]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting user fruits:', error);
            throw error;
        }
    }

    async recalculateUserCP(discordId) {
        try {
            const user = await this.getUser(discordId);
            if (!user) throw new Error('User not found');

            // Get all user's fruits
            const fruits = await this.pool.query(
                'SELECT base_cp, duplicates FROM user_devil_fruits WHERE user_id = $1',
                [user.id]
            );

            // Calculate total fruit CP
            let totalFruitCP = 0;
            for (const fruit of fruits.rows) {
                const fruitMultiplier = fruit.base_cp / 100; // Convert back to decimal
                const duplicateBonus = fruit.duplicates * 0.01; // 1% per duplicate
                const fruitCP = user.base_cp * fruitMultiplier * (1 + duplicateBonus);
                totalFruitCP += fruitCP;
            }

            // Total CP = Base CP + Fruit CP
            const totalCP = user.base_cp + totalFruitCP;

            // Update user's total CP
            await this.pool.query(
                'UPDATE users SET total_cp = $1 WHERE discord_id = $2',
                [Math.floor(totalCP), discordId]
            );

            return totalCP;
        } catch (error) {
            console.error('Error recalculating CP:', error);
            throw error;
        }
    }

    async updateUserLevel(discordId, level) {
        try {
            const user = await this.getUser(discordId);
            if (!user) throw new Error('User not found');

            // Update user level
            await this.pool.query(
                'INSERT INTO user_levels (user_id, level) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET level = $2, updated_at = CURRENT_TIMESTAMP',
                [user.id, level]
            );

            // Calculate new base CP based on level
            const baseCP = 100 + (level * 50); // Base 100 + 50 per level

            // Update user's base CP
            await this.pool.query(
                'UPDATE users SET base_cp = $1 WHERE discord_id = $2',
                [baseCP, discordId]
            );

            // Recalculate total CP
            await this.recalculateUserCP(discordId);

            return baseCP;
        } catch (error) {
            console.error('Error updating user level:', error);
            throw error;
        }
    }

    async addIncomeHistory(discordId, amount, type) {
        try {
            const user = await this.getUser(discordId);
            if (!user) throw new Error('User not found');

            await this.pool.query(
                'INSERT INTO income_history (user_id, amount, type) VALUES ($1, $2, $3)',
                [user.id, amount, type]
            );
        } catch (error) {
            console.error('Error adding income history:', error);
            throw error;
        }
    }

    async updateLastIncome(discordId) {
        try {
            await this.pool.query(
                'UPDATE users SET last_income = CURRENT_TIMESTAMP WHERE discord_id = $1',
                [discordId]
            );
        } catch (error) {
            console.error('Error updating last income:', error);
            throw error;
        }
    }

    async getUsersWithCP() {
        try {
            const result = await this.pool.query(
                'SELECT discord_id, username, base_cp, total_cp FROM users WHERE base_cp > 0'
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting users with CP:', error);
            throw error;
        }
    }

    async getLeaderboard(type, limit = 10) {
        try {
            let query;
            switch (type) {
                case 'cp':
                    query = 'SELECT discord_id, username, total_cp FROM users ORDER BY total_cp DESC LIMIT $1';
                    break;
                case 'berries':
                    query = 'SELECT discord_id, username, berries FROM users ORDER BY berries DESC LIMIT $1';
                    break;
                case 'collection':
                    query = `
                        SELECT u.discord_id, u.username, COUNT(udf.id) as fruit_count
                        FROM users u
                        LEFT JOIN user_devil_fruits udf ON u.id = udf.user_id
                        GROUP BY u.discord_id, u.username
                        ORDER BY fruit_count DESC
                        LIMIT $1
                    `;
                    break;
                default:
                    throw new Error('Invalid leaderboard type');
            }

            const result = await this.pool.query(query, [limit]);
            return result.rows;
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            throw error;
        }
    }

    async getServerStats() {
        try {
            const totalUsers = await this.pool.query('SELECT COUNT(*) FROM users');
            const totalFruits = await this.pool.query('SELECT COUNT(*) FROM user_devil_fruits');
            const totalBerries = await this.pool.query('SELECT SUM(berries) FROM users');
            const avgCP = await this.pool.query('SELECT AVG(total_cp) FROM users');

            // Get type distribution
            const typeDistribution = await this.pool.query(`
                SELECT fruit_type, COUNT(*) as count
                FROM user_devil_fruits
                GROUP BY fruit_type
                ORDER BY count DESC
            `);

            // Get rarity distribution
            const rarityDistribution = await this.pool.query(`
                SELECT rarity, COUNT(*) as count
                FROM user_devil_fruits
                GROUP BY rarity
                ORDER BY count DESC
            `);

            return {
                totalUsers: parseInt(totalUsers.rows[0].count),
                totalFruits: parseInt(totalFruits.rows[0].count),
                totalBerries: parseInt(totalBerries.rows[0].sum || 0),
                avgCP: Math.floor(parseFloat(avgCP.rows[0].avg || 0)),
                typeDistribution: typeDistribution.rows,
                rarityDistribution: rarityDistribution.rows
            };
        } catch (error) {
            console.error('Error getting server stats:', error);
            throw error;
        }
    }

    async getUserStats(discordId) {
        try {
            const user = await this.getUser(discordId);
            if (!user) return null;

            // Get fruit count
            const fruitCount = await this.pool.query(
                'SELECT COUNT(*) FROM user_devil_fruits WHERE user_id = $1',
                [user.id]
            );

            // Get total duplicates
            const duplicates = await this.pool.query(
                'SELECT SUM(duplicates) FROM user_devil_fruits WHERE user_id = $1',
                [user.id]
            );

            // Get income history
            const incomeHistory = await this.pool.query(
                'SELECT SUM(amount) as total, type FROM income_history WHERE user_id = $1 GROUP BY type',
                [user.id]
            );

            // Get highest CP fruit
            const highestFruit = await this.pool.query(
                'SELECT fruit_name, base_cp FROM user_devil_fruits WHERE user_id = $1 ORDER BY base_cp DESC LIMIT 1',
                [user.id]
            );

            return {
                ...user,
                fruitCount: parseInt(fruitCount.rows[0].count),
                totalDuplicates: parseInt(duplicates.rows[0].sum || 0),
                incomeHistory: incomeHistory.rows,
                highestFruit: highestFruit.rows[0] || null
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }

    async resetUserIncome(discordId) {
        try {
            await this.pool.query(
                'UPDATE users SET last_income = CURRENT_TIMESTAMP - INTERVAL \'2 hours\' WHERE discord_id = $1',
                [discordId]
            );
            return true;
        } catch (error) {
            console.error('Error resetting user income:', error);
            throw error;
        }
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = DatabaseManager;
