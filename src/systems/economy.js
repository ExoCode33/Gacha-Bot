// src/systems/economy.js - Fixed Economy System with Environment Variables
const DatabaseManager = require('../database/manager');

class EconomySystem {
    constructor() {
        // Use environment variables with defaults
        this.pullCost = parseInt(process.env.DEFAULT_PULL_COST) || 1000;
        this.incomeRate = parseFloat(process.env.DEFAULT_INCOME_RATE) || 0.1;
        this.baseIncome = parseInt(process.env.DEFAULT_BASE_INCOME) || 50;
        this.manualIncomeMultiplier = parseFloat(process.env.MANUAL_INCOME_MULTIPLIER) || 6; // 6 hours worth
        this.manualIncomeCooldown = parseInt(process.env.MANUAL_INCOME_COOLDOWN) || 60; // 60 minutes
        
        console.log('💰 Economy System initialized with config:');
        console.log(`   - Pull Cost: ${this.pullCost} berries`);
        console.log(`   - Income Rate: ${this.incomeRate} berries per CP per hour`);
        console.log(`   - Base Income: ${this.baseIncome} berries per hour`);
        console.log(`   - Manual Income Multiplier: ${this.manualIncomeMultiplier}x`);
        console.log(`   - Manual Income Cooldown: ${this.manualIncomeCooldown} minutes`);
    }

    async initialize() {
        console.log('💰 Economy System ready');
    }

    // Calculate hourly income based on CP
    calculateHourlyIncome(totalCp) {
        const baseIncome = this.baseIncome;
        const cpIncome = totalCp * this.incomeRate;
        return Math.floor(baseIncome + cpIncome);
    }

    // Calculate manual income (larger amount with cooldown)
    calculateManualIncome(totalCp) {
        const hourlyIncome = this.calculateHourlyIncome(totalCp);
        return Math.floor(hourlyIncome * this.manualIncomeMultiplier);
    }

    // Add berries to user
    async addBerries(userId, amount, reason = 'Unknown') {
        try {
            const newBalance = await DatabaseManager.updateUserBerries(userId, amount, reason);
            console.log(`💰 Added ${amount} berries to ${userId} (${reason}). New balance: ${newBalance}`);
            return newBalance;
        } catch (error) {
            console.error('Error adding berries:', error);
            throw error;
        }
    }

    // Remove berries from user
    async removeBerries(userId, amount, reason = 'Unknown') {
        try {
            const currentBerries = await DatabaseManager.getUserBerries(userId);
            if (currentBerries < amount) {
                return false; // Not enough berries
            }
            
            const newBalance = await DatabaseManager.updateUserBerries(userId, -amount, reason);
            console.log(`💸 Removed ${amount} berries from ${userId} (${reason}). New balance: ${newBalance}`);
            return newBalance;
        } catch (error) {
            console.error('Error removing berries:', error);
            throw error;
        }
    }

    // Get user's berry balance
    async getUserBerries(userId) {
        try {
            return await DatabaseManager.getUserBerries(userId);
        } catch (error) {
            console.error('Error getting user berries:', error);
            return 0;
        }
    }

    // Purchase a devil fruit pull
    async purchasePull(userId, username) {
        try {
            // Check if user has enough berries
            const currentBerries = await this.getUserBerries(userId);
            if (currentBerries < this.pullCost) {
                return {
                    success: false,
                    message: `Not enough berries! You need ${this.pullCost.toLocaleString()} berries but only have ${currentBerries.toLocaleString()}.`,
                    currentBerries
                };
            }
            
            // Remove berries
            const newBalance = await this.removeBerries(userId, this.pullCost, 'Devil Fruit Pull');
            
            return {
                success: true,
                message: 'Pull purchased successfully!',
                newBalance,
                cost: this.pullCost
            };
            
        } catch (error) {
            console.error('Error purchasing pull:', error);
            return {
                success: false,
                message: 'An error occurred while purchasing the pull.',
                currentBerries: await this.getUserBerries(userId)
            };
        }
    }

    // Process manual income collection
    async processManualIncome(userId, username) {
        try {
            // Get user's current CP
            const user = await DatabaseManager.getUser(userId);
            if (!user) return { success: false, message: 'User not found' };
            
            const totalCp = Math.max(user.total_cp, user.base_cp);
            const manualIncome = this.calculateManualIncome(totalCp);
            
            // Check if user has used manual income recently
            const result = await DatabaseManager.query(`
                SELECT created_at 
                FROM income_history 
                WHERE user_id = $1 AND income_type = 'manual' 
                ORDER BY created_at DESC 
                LIMIT 1
            `, [userId]);
            
            if (result.rows.length > 0) {
                const lastManualIncome = new Date(result.rows[0].created_at);
                const now = new Date();
                const minutesElapsed = (now - lastManualIncome) / (1000 * 60);
                
                if (minutesElapsed < this.manualIncomeCooldown) {
                    return {
                        success: false,
                        message: `You must wait ${Math.ceil(this.manualIncomeCooldown - minutesElapsed)} more minutes before collecting manual income.`,
                        minutesElapsed,
                        nextCollection: Math.ceil(this.manualIncomeCooldown - minutesElapsed)
                    };
                }
            }
            
            if (manualIncome <= 0) {
                return {
                    success: false,
                    message: 'No income to collect.'
                };
            }
            
            // Add berries and record income
            const newBalance = await this.addBerries(userId, manualIncome, 'Manual Income Collection');
            await DatabaseManager.recordIncome(userId, manualIncome, totalCp, 'manual');
            
            console.log(`💰 ${username} collected ${manualIncome} berries (manual collection)`);
            
            return {
                success: true,
                amount: manualIncome,
                multiplier: this.manualIncomeMultiplier,
                hourlyRate: this.calculateHourlyIncome(totalCp),
                newBalance,
                totalCp,
                cooldownMinutes: this.manualIncomeCooldown
            };
            
        } catch (error) {
            console.error('Error processing manual income:', error);
            return {
                success: false,
                message: 'An error occurred while processing income.'
            };
        }
    }

    // Get user's income information
    async getIncomeInfo(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            if (!user) return null;
            
            const totalCp = Math.max(user.total_cp, user.base_cp);
            const hourlyIncome = this.calculateHourlyIncome(totalCp);
            const manualIncome = this.calculateManualIncome(totalCp);
            
            // Check last manual income
            const result = await DatabaseManager.query(`
                SELECT created_at 
                FROM income_history 
                WHERE user_id = $1 AND income_type = 'manual' 
                ORDER BY created_at DESC 
                LIMIT 1
            `, [userId]);
            
            let canCollectManual = true;
            let nextManualCollection = 0;
            
            if (result.rows.length > 0) {
                const lastManualIncome = new Date(result.rows[0].created_at);
                const now = new Date();
                const minutesElapsed = (now - lastManualIncome) / (1000 * 60);
                
                if (minutesElapsed < this.manualIncomeCooldown) {
                    canCollectManual = false;
                    nextManualCollection = Math.ceil(this.manualIncomeCooldown - minutesElapsed);
                }
            }
            
            return {
                totalCp,
                hourlyIncome,
                manualIncome,
                canCollectManual,
                nextManualCollection,
                cooldownMinutes: this.manualIncomeCooldown,
                multiplier: this.manualIncomeMultiplier,
                currentBerries: user.berries
            };
            
        } catch (error) {
            console.error('Error getting income info:', error);
            return null;
        }
    }

    // Get user's economic stats
    async getUserStats(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            if (!user) return null;
            
            return {
                berries: user.berries,
                totalEarned: user.total_earned,
                totalSpent: user.total_spent,
                netWorth: user.total_earned - user.total_spent,
                totalCp: user.total_cp,
                level: user.level,
                baseCp: user.base_cp,
                hourlyIncome: this.calculateHourlyIncome(Math.max(user.total_cp, user.base_cp)),
                manualIncome: this.calculateManualIncome(Math.max(user.total_cp, user.base_cp))
            };
            
        } catch (error) {
            console.error('Error getting user stats:', error);
            return null;
        }
    }

    // Get server economic stats
    async getServerStats() {
        try {
            const stats = await DatabaseManager.getServerStats();
            return {
                ...stats,
                pullCost: this.pullCost,
                incomeRate: this.incomeRate,
                baseIncome: this.baseIncome,
                manualIncomeMultiplier: this.manualIncomeMultiplier,
                manualIncomeCooldown: this.manualIncomeCooldown
            };
        } catch (error) {
            console.error('Error getting server stats:', error);
            return {
                totalUsers: 0,
                totalFruits: 0,
                totalBerries: 0,
                pullCost: this.pullCost,
                incomeRate: this.incomeRate,
                baseIncome: this.baseIncome,
                manualIncomeMultiplier: this.manualIncomeMultiplier,
                manualIncomeCooldown: this.manualIncomeCooldown
            };
        }
    }

    // Get leaderboards
    async getLeaderboard(type = 'berries', limit = 10) {
        try {
            return await DatabaseManager.getLeaderboard(type, limit);
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    }

    // Utility functions
    formatBerries(amount) {
        return amount.toLocaleString();
    }

    getEconomyConfig() {
        return {
            pullCost: this.pullCost,
            incomeRate: this.incomeRate,
            baseIncome: this.baseIncome,
            manualIncomeMultiplier: this.manualIncomeMultiplier,
            manualIncomeCooldown: this.manualIncomeCooldown
        };
    }

    // Calculate berries needed for specific number of pulls
    calculatePullCost(numPulls) {
        return this.pullCost * numPulls;
    }

    // Calculate how many pulls user can afford
    calculateAffordablePulls(berries) {
        return Math.floor(berries / this.pullCost);
    }

    // Update configuration from environment variables
    updateConfigFromEnv() {
        const oldConfig = this.getEconomyConfig();
        
        this.pullCost = parseInt(process.env.DEFAULT_PULL_COST) || this.pullCost;
        this.incomeRate = parseFloat(process.env.DEFAULT_INCOME_RATE) || this.incomeRate;
        this.baseIncome = parseInt(process.env.DEFAULT_BASE_INCOME) || this.baseIncome;
        this.manualIncomeMultiplier = parseFloat(process.env.MANUAL_INCOME_MULTIPLIER) || this.manualIncomeMultiplier;
        this.manualIncomeCooldown = parseInt(process.env.MANUAL_INCOME_COOLDOWN) || this.manualIncomeCooldown;
        
        const newConfig = this.getEconomyConfig();
        
        if (JSON.stringify(oldConfig) !== JSON.stringify(newConfig)) {
            console.log('💰 Economy configuration updated from environment variables:');
            console.log('   Old config:', oldConfig);
            console.log('   New config:', newConfig);
        }
    }
}

module.exports = new EconomySystem();
