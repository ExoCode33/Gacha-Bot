// src/systems/auto-income.js - Fixed Auto Income System
const DatabaseManager = require('../database/manager');
const EconomySystem = require('./economy');

class AutoIncomeSystem {
    constructor() {
        this.interval = null;
        this.isRunning = false;
        this.intervalTime = 10 * 60 * 1000; // 10 minutes
        this.processedUsers = new Set();
        
        console.log('⏰ Auto Income System initialized');
    }

    async initialize(client) {
        this.client = client;
        await this.startAutoIncome();
        console.log('⏰ Auto Income System started - generating income every 10 minutes');
    }

    async startAutoIncome() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        // Run immediately after 30 seconds
        setTimeout(() => {
            this.processAllUsers();
        }, 30000);
        
        // Then run every 10 minutes
        this.interval = setInterval(() => {
            this.processAllUsers();
        }, this.intervalTime);
        
        console.log('⏰ Auto income generation started');
    }

    async processAllUsers() {
        try {
            console.log('⏰ Processing automatic income for all users...');
            
            // Get all users with more relaxed criteria
            const result = await DatabaseManager.query(`
                SELECT user_id, username, total_cp, base_cp, berries, last_income
                FROM users 
                WHERE total_cp > 0 OR base_cp > 0
                ORDER BY user_id
            `);
            
            if (result.rows.length === 0) {
                console.log('⏰ No users found for income generation');
                return;
            }
            
            console.log(`⏰ Found ${result.rows.length} users for income processing`);
            
            let processed = 0;
            let totalGenerated = 0;
            let skipped = 0;
            let errors = 0;
            
            for (const user of result.rows) {
                try {
                    const income = await this.processUserIncome(user, processed);
                    if (income > 0) {
                        processed++;
                        totalGenerated += income;
                    } else {
                        skipped++;
                    }
                } catch (error) {
                    console.error(`❌ Error processing income for user ${user.user_id}:`, error);
                    errors++;
                }
            }
            
            console.log(`⏰ Income processing complete:`);
            console.log(`   - Processed: ${processed} users`);
            console.log(`   - Skipped: ${skipped} users (too soon)`);
            console.log(`   - Errors: ${errors} users`);
            console.log(`   - Total generated: ${totalGenerated} berries`);
            
        } catch (error) {
            console.error('❌ Error processing all users income:', error);
        }
    }

    async processUserIncome(user, processedCount) {
        try {
            const now = new Date();
            const lastIncome = new Date(user.last_income);
            const minutesElapsed = (now - lastIncome) / (1000 * 60);
            
            // Only process if at least 9 minutes have passed (small buffer)
            if (minutesElapsed < 9) {
                if (processedCount < 5) {
                    console.log(`⏰ ${user.username}: Skipped (${minutesElapsed.toFixed(1)} min < 9 min threshold)`);
                }
                return 0;
            }
            
            // Calculate income based on total CP (with fallback to base CP)
            const effectiveCP = Math.max(user.total_cp || 0, user.base_cp || 100);
            const hourlyIncome = EconomySystem.calculateHourlyIncome(effectiveCP);
            
            // Calculate 10-minute income, but account for actual time elapsed
            const timeBasedIncome = Math.floor((hourlyIncome / 60) * Math.min(minutesElapsed, 60));
            
            if (timeBasedIncome <= 0) {
                if (processedCount < 5) {
                    console.log(`⏰ ${user.username}: No income calculated (CP: ${effectiveCP}, Hourly: ${hourlyIncome})`);
                }
                return 0;
            }
            
            // Add berries
            await DatabaseManager.updateUserBerries(user.user_id, timeBasedIncome, 'Auto Income');
            
            // Record income
            await DatabaseManager.recordIncome(user.user_id, timeBasedIncome, effectiveCP, 'automatic');
            
            // Debug log for first few users
            if (processedCount < 5) {
                console.log(`⏰ ${user.username}: +${timeBasedIncome} berries (CP: ${effectiveCP}, Minutes: ${minutesElapsed.toFixed(1)}, Hourly: ${hourlyIncome})`);
            }
            
            return timeBasedIncome;
            
        } catch (error) {
            console.error(`❌ Error processing user ${user.user_id} income:`, error);
            return 0;
        }
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
        console.log('⏰ Auto income system stopped');
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            intervalMinutes: this.intervalTime / 1000 / 60,
            processedUsers: this.processedUsers.size
        };
    }

    async forceProcess() {
        console.log('⏰ Manual income processing triggered');
        await this.processAllUsers();
    }

    async debugUserIncome(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            if (!user) {
                console.log(`❌ User ${userId} not found`);
                return;
            }
            
            const now = new Date();
            const lastIncome = new Date(user.last_income);
            const minutesElapsed = (now - lastIncome) / (1000 * 60);
            const effectiveCP = Math.max(user.total_cp || 0, user.base_cp || 100);
            const hourlyIncome = EconomySystem.calculateHourlyIncome(effectiveCP);
            const timeBasedIncome = Math.floor((hourlyIncome / 60) * Math.min(minutesElapsed, 60));
            
            console.log(`🔍 Debug info for ${user.username}:`);
            console.log(`   - Base CP: ${user.base_cp}`);
            console.log(`   - Total CP: ${user.total_cp}`);
            console.log(`   - Effective CP: ${effectiveCP}`);
            console.log(`   - Hourly Income: ${hourlyIncome}`);
            console.log(`   - Time-based Income: ${timeBasedIncome}`);
            console.log(`   - Minutes since last: ${minutesElapsed.toFixed(1)}`);
            console.log(`   - Berries: ${user.berries}`);
            console.log(`   - Last income: ${user.last_income}`);
            
        } catch (error) {
            console.error(`❌ Error debugging user income:`, error);
        }
    }

    // Force update a user's last_income to allow immediate collection
    async resetUserIncome(userId) {
        try {
            await DatabaseManager.query(`
                UPDATE users 
                SET last_income = NOW() - INTERVAL '11 minutes'
                WHERE user_id = $1
            `, [userId]);
            
            console.log(`⏰ Reset income timer for user ${userId}`);
            
        } catch (error) {
            console.error(`❌ Error resetting user income:`, error);
        }
    }

    // Get income statistics
    async getIncomeStats() {
        try {
            const stats = await DatabaseManager.query(`
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN last_income > NOW() - INTERVAL '10 minutes' THEN 1 END) as recent_income,
                    AVG(total_cp) as avg_cp,
                    SUM(berries) as total_berries
                FROM users
            `);
            
            const recentIncome = await DatabaseManager.query(`
                SELECT 
                    COUNT(*) as auto_income_count,
                    COALESCE(SUM(amount), 0) as total_auto_income
                FROM income_history 
                WHERE income_type = 'automatic' 
                AND created_at > NOW() - INTERVAL '1 hour'
            `);
            
            return {
                totalUsers: parseInt(stats.rows[0].total_users || 0),
                recentIncome: parseInt(stats.rows[0].recent_income || 0),
                avgCP: parseFloat(stats.rows[0].avg_cp || 0),
                totalBerries: parseInt(stats.rows[0].total_berries || 0),
                lastHourAutoIncome: parseInt(recentIncome.rows[0].total_auto_income || 0),
                lastHourIncomeCount: parseInt(recentIncome.rows[0].auto_income_count || 0)
            };
            
        } catch (error) {
            console.error('❌ Error getting income stats:', error);
            return {
                totalUsers: 0,
                recentIncome: 0,
                avgCP: 0,
                totalBerries: 0,
                lastHourAutoIncome: 0,
                lastHourIncomeCount: 0
            };
        }
    }
}

module.exports = new AutoIncomeSystem();
