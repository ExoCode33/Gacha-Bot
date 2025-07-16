// src/systems/economy.js - Economy System v2.0
const DatabaseManager = require('../database/manager');

class EconomySystem {
    constructor() {
        this.pullCost = 1000; // Cost to pull a devil fruit
        this.incomeRate = 0.1; // 0.1 berries per CP per hour
        this.baseIncome = 50; // Base income per hour for everyone
        
        console.log('💰 Economy System initialized');
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
                    message: `Not enough berries! You need ${this.pullCost} berries but only have ${currentBerries}.`,
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

    // Process automatic income
    async processIncome(userId, username) {
        try {
            // Get user's current CP
            const user = await DatabaseManager.getUser(userId);
            if (!user) return { success: false, message: 'User not found' };
            
            const totalCp = user.total_cp;
            const hourlyIncome = this.calculateHourlyIncome(totalCp);
            
            // Calculate time since last income
            const now = new Date();
            const lastIncome = new Date(user.last_income);
            const hoursElapsed = (now - lastIncome) / (1000 * 60 * 60); // Convert to hours
            
            // Must wait at least 1 hour
            if (hoursElapsed < 1) {
                return {
                    success: false,
                    message: `You must wait ${Math.ceil((1 - hoursElapsed) * 60)} more minutes before collecting income.`,
                    hoursElapsed,
                    nextIncome: Math.ceil((1 - hoursElapsed) * 60)
                };
            }
            
            // Calculate income (max 24 hours)
            const maxHours = 24;
            const cappedHours = Math.min(hoursElapsed, maxHours);
            const incomeAmount = Math.floor(hourlyIncome * cappedHours);
            
            if (incomeAmount <= 0) {
                return {
                    success: false,
                    message: 'No income to collect.',
                    hoursElapsed: cappedHours
                };
            }
            
            // Add berries and record income
            const newBalance = await this.addBerries(userId, incomeAmount, 'Automatic Income');
            await DatabaseManager.recordIncome(userId, incomeAmount, totalCp, 'manual');
            
            console.log(`💰 ${username} collected ${incomeAmount} berries (${cappedHours.toFixed(1)} hours)`);
            
            return {
                success: true,
                amount: incomeAmount,
                hoursElapsed: cappedHours,
                hourlyRate: hourlyIncome,
                newBalance,
                totalCp
            };
            
        } catch (error) {
            console.error('Error processing income:', error);
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
            
            const totalCp = user.total_cp;
            const hourlyIncome = this.calculateHourlyIncome(totalCp);
            
            // Calculate time since last income
            const now = new Date();
            const lastIncome = new Date(user.last_income);
            const hoursElapsed = (now - lastIncome) / (1000 * 60 * 60);
            
            // Calculate available income
            const maxHours = 24;
            const cappedHours = Math.min(hoursElapsed, maxHours);
            const availableIncome = Math.floor(hourlyIncome * cappedHours);
            
            return {
                totalCp,
                hourlyIncome,
                hoursElapsed,
                availableIncome,
                canCollect: hoursElapsed >= 1,
                nextCollection: hoursElapsed >= 1 ? 0 : Math.ceil((1 - hoursElapsed) * 60),
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
                hourlyIncome: this.calculateHourlyIncome(user.total_cp)
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
                baseIncome: this.baseIncome
            };
        } catch (error) {
            console.error('Error getting server stats:', error);
            return {
                totalUsers: 0,
                totalFruits: 0,
                totalBerries: 0,
                pullCost: this.pullCost,
                incomeRate: this.incomeRate,
                baseIncome: this.baseIncome
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

    // Admin functions
    async giveBerriesAdmin(userId, amount, reason = 'Admin Grant') {
        try {
            const newBalance = await this.addBerries(userId, amount, reason);
            return {
                success: true,
                message: `Successfully gave ${amount} berries.`,
                newBalance
            };
        } catch (error) {
            console.error('Error giving berries (admin):', error);
            return {
                success: false,
                message: 'Failed to give berries.'
            };
        }
    }

    async takeBerriesAdmin(userId, amount, reason = 'Admin Take') {
        try {
            const result = await this.removeBerries(userId, amount, reason);
            if (result === false) {
                return {
                    success: false,
                    message: 'User does not have enough berries.'
                };
            }
            
            return {
                success: true,
                message: `Successfully removed ${amount} berries.`,
                newBalance: result
            };
        } catch (error) {
            console.error('Error taking berries (admin):', error);
            return {
                success: false,
                message: 'Failed to remove berries.'
            };
        }
    }

    async resetUserEconomy(userId) {
        try {
            // Reset berries to 0
            await DatabaseManager.query(
                `UPDATE users 
                 SET berries = 0, total_earned = 0, total_spent = 0, last_income = NOW()
                 WHERE user_id = $1`,
                [userId]
            );
            
            return {
                success: true,
                message: 'User economy reset successfully.'
            };
            
        } catch (error) {
            console.error('Error resetting user economy:', error);
            return {
                success: false,
                message: 'Failed to reset user economy.'
            };
        }
    }

    // Utility functions
    formatBerries(amount) {
        return amount.toLocaleString();
    }

    calculateIncomeForNextHour(totalCp) {
        return this.calculateHourlyIncome(totalCp);
    }

    calculateIncomeForTimespan(totalCp, hours) {
        const hourlyRate = this.calculateHourlyIncome(totalCp);
        return Math.floor(hourlyRate * Math.min(hours, 24));
    }

    getEconomyConfig() {
        return {
            pullCost: this.pullCost,
            incomeRate: this.incomeRate,
            baseIncome: this.baseIncome,
            maxIncomeHours: 24
        };
    }

    // Update economy configuration (admin)
    updateConfig(config) {
        if (config.pullCost !== undefined) {
            this.pullCost = config.pullCost;
        }
        if (config.incomeRate !== undefined) {
            this.incomeRate = config.incomeRate;
        }
        if (config.baseIncome !== undefined) {
            this.baseIncome = config.baseIncome;
        }
        
        console.log('💰 Economy configuration updated:', this.getEconomyConfig());
    }

    // Calculate berries needed for specific number of pulls
    calculatePullCost(numPulls) {
        return this.pullCost * numPulls;
    }

    // Calculate how many pulls user can afford
    calculateAffordablePulls(berries) {
        return Math.floor(berries / this.pullCost);
    }

    // Get economic trends (for admin dashboard)
    async getEconomicTrends() {
        try {
            // Get income history for the last 24 hours
            const result = await DatabaseManager.query(`
                SELECT 
                    DATE_TRUNC('hour', created_at) as hour,
                    SUM(amount) as total_income,
                    COUNT(*) as income_events,
                    AVG(cp_at_time) as avg_cp
                FROM income_history 
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                GROUP BY hour
                ORDER BY hour
            `);
            
            return {
                hourlyIncome: result.rows,
                trends: {
                    totalIncome24h: result.rows.reduce((sum, row) => sum + parseInt(row.total_income), 0),
                    totalEvents24h: result.rows.reduce((sum, row) => sum + parseInt(row.income_events), 0),
                    avgCp24h: result.rows.length > 0 ? 
                        result.rows.reduce((sum, row) => sum + parseFloat(row.avg_cp), 0) / result.rows.length : 0
                }
            };
            
        } catch (error) {
            console.error('Error getting economic trends:', error);
            return {
                hourlyIncome: [],
                trends: {
                    totalIncome24h: 0,
                    totalEvents24h: 0,
                    avgCp24h: 0
                }
            };
        }
    }
}

module.exports = new EconomySystem();
