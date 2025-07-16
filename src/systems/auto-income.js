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
            
            // Get all users with base_cp > 0 (everyone should have at least 100 base CP)
            const result = await DatabaseManager.query(`
                SELECT user_id, username, total_cp, base_cp, berries, last_income
                FROM users 
                WHERE base_cp > 0
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
            
            for (const user of result.rows) {
                try {
                    const income = await this.processUserIncome(user);
                    if (income > 0) {
                        processed++;
                        totalGenerated += income;
                    } else {
                        skipped++;
                    }
                } catch (error) {
                    console.error(`❌ Error processing income for user ${user.user_id}:`, error);
                }
            }
            
            console.log(`⏰ Processed ${processed} users, skipped ${skipped}, generated ${totalGenerated} berries total`);
            
        } catch (error) {
            console.error('❌ Error processing all users income:', error);
        }
    }

    async processUserIncome(user) {
        try {
            const now = new Date();
            const lastIncome = new Date(user.last_income);
            const minutesElapsed = (now - lastIncome) / (1000 * 60);
            
            // Only process if at least 10 minutes have passed
            if (minutesElapsed < 10) {
                return 0;
            }
            
            // Calculate income based on total CP (minimum base CP)
            const effectiveCP = Math.max(user.total_cp, user.base_cp);
            const hourlyIncome = EconomySystem.calculateHourlyIncome(effectiveCP);
            const tenMinuteIncome = Math.floor(hourlyIncome / 6); // 10 minutes = 1/6 of an hour
            
            if (tenMinuteIncome <= 0) {
                return 0;
            }
            
            // Add berries
            await DatabaseManager.updateUserBerries(user.user_id, tenMinuteIncome, 'Auto Income');
            
            // Record income
            await DatabaseManager.recordIncome(user.user_id, tenMinuteIncome, effectiveCP, 'automatic');
            
            // Debug log for first few users
            if (processed < 5) {
                console.log(`⏰ ${user.username}: ${tenMinuteIncome} berries (CP: ${effectiveCP}, Minutes: ${minutesElapsed.toFixed(1)})`);
            }
            
            return tenMinuteIncome;
            
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
            const effectiveCP = Math.max(user.total_cp, user.base_cp);
            const hourlyIncome = EconomySystem.calculateHourlyIncome(effectiveCP);
            const tenMinuteIncome = Math.floor(hourlyIncome / 6);
            
            console.log(`🔍 Debug info for ${user.username}:`);
            console.log(`   - Base CP: ${user.base_cp}`);
            console.log(`   - Total CP: ${user.total_cp}`);
            console.log(`   - Effective CP: ${effectiveCP}`);
            console.log(`   - Hourly Income: ${hourlyIncome}`);
            console.log(`   - 10min Income: ${tenMinuteIncome}`);
            console.log(`   - Minutes since last: ${minutesElapsed.toFixed(1)}`);
            console.log(`   - Berries: ${user.berries}`);
            
        } catch (error) {
            console.error(`❌ Error debugging user income:`, error);
        }
    }
}

module.exports = new AutoIncomeSystem();
