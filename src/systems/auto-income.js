// src/systems/auto-income.js - Automatic Income System v2.0
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
            
            // Get all users with total_cp > 0
            const result = await DatabaseManager.query(`
                SELECT user_id, username, total_cp, berries, last_income
                FROM users 
                WHERE total_cp > 0
            `);
            
            if (result.rows.length === 0) {
                console.log('⏰ No users with CP found for income generation');
                return;
            }
            
            let processed = 0;
            let totalGenerated = 0;
            
            for (const user of result.rows) {
                try {
                    const income = await this.processUserIncome(user);
                    if (income > 0) {
                        processed++;
                        totalGenerated += income;
                    }
                } catch (error) {
                    console.error(`Error processing income for user ${user.user_id}:`, error);
                }
            }
            
            console.log(`⏰ Processed ${processed} users, generated ${totalGenerated} berries total`);
            
        } catch (error) {
            console.error('Error processing all users income:', error);
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
            
            // Calculate 10-minute income
            const hourlyIncome = EconomySystem.calculateHourlyIncome(user.total_cp);
            const tenMinuteIncome = Math.floor(hourlyIncome / 6); // 10 minutes = 1/6 of an hour
            
            if (tenMinuteIncome <= 0) {
                return 0;
            }
            
            // Add berries
            await DatabaseManager.updateUserBerries(user.user_id, tenMinuteIncome, 'Auto Income');
            
            // Record income
            await DatabaseManager.recordIncome(user.user_id, tenMinuteIncome, user.total_cp, 'automatic');
            
            return tenMinuteIncome;
            
        } catch (error) {
            console.error(`Error processing user ${user.user_id} income:`, error);
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
}

module.exports = new AutoIncomeSystem();
