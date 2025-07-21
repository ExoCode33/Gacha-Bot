// src/systems/pvp/pvp-queue-system.js
class PvPQueueSystem {
    constructor() {
        this.queue = new Map(); // userId -> { userId, username, joinTime }
        this.activeMatches = new Set(); // Set of userIds currently in matches
    }

    /**
     * Add a player to the PvP queue
     */
    joinQueue(userId, username) {
        // Check if player is already in queue
        if (this.queue.has(userId)) {
            return {
                success: false,
                message: 'You are already in the PvP queue!'
            };
        }

        // Check if player is in an active match
        if (this.activeMatches.has(userId)) {
            return {
                success: false,
                message: 'You are currently in an active PvP match!'
            };
        }

        // Add to queue
        this.queue.set(userId, {
            userId,
            username,
            joinTime: Date.now()
        });

        // Try to find a match
        const matchResult = this.findMatch(userId);
        if (matchResult) {
            return {
                success: true,
                matched: true,
                player1: matchResult.player1,
                player2: matchResult.player2
            };
        }

        return {
            success: true,
            matched: false,
            position: this.getQueuePosition(userId),
            queueSize: this.queue.size
        };
    }

    /**
     * Remove a player from the queue
     */
    leaveQueue(userId) {
        if (this.queue.has(userId)) {
            this.queue.delete(userId);
            return {
                success: true,
                message: 'Successfully left the PvP queue.'
            };
        }

        return {
            success: false,
            message: 'You are not in the PvP queue.'
        };
    }

    /**
     * Find a match for a player
     */
    findMatch(newPlayerId) {
        const queueArray = Array.from(this.queue.values());
        
        // Need at least 2 players for a match
        if (queueArray.length < 2) {
            return null;
        }

        // Find the oldest player in queue (excluding the new player)
        const opponent = queueArray.find(player => player.userId !== newPlayerId);
        
        if (opponent) {
            const newPlayer = this.queue.get(newPlayerId);
            
            // Remove both players from queue
            this.queue.delete(newPlayerId);
            this.queue.delete(opponent.userId);
            
            // Add to active matches
            this.activeMatches.add(newPlayerId);
            this.activeMatches.add(opponent.userId);
            
            console.log(`Match found: ${newPlayer.username} vs ${opponent.username}`);
            
            return {
                player1: newPlayer,
                player2: opponent
            };
        }

        return null;
    }

    /**
     * Get player's position in queue
     */
    getQueuePosition(userId) {
        const queueArray = Array.from(this.queue.values())
            .sort((a, b) => a.joinTime - b.joinTime);
        
        return queueArray.findIndex(player => player.userId === userId) + 1;
    }

    /**
     * Get queue status
     */
    getQueueStatus() {
        return {
            queueSize: this.queue.size,
            activeMatches: this.activeMatches.size,
            queuedPlayers: Array.from(this.queue.values())
        };
    }

    /**
     * Remove player from active matches (when match ends)
     */
    endMatch(userId) {
        this.activeMatches.delete(userId);
    }

    /**
     * Check if player is in an active match
     */
    isInActiveMatch(userId) {
        return this.activeMatches.has(userId);
    }

    /**
     * Clear expired queue entries (players who joined more than 10 minutes ago)
     */
    clearExpiredEntries() {
        const now = Date.now();
        const maxWaitTime = 10 * 60 * 1000; // 10 minutes

        for (const [userId, player] of this.queue.entries()) {
            if (now - player.joinTime > maxWaitTime) {
                this.queue.delete(userId);
                console.log(`Removed ${player.username} from PvP queue due to timeout`);
            }
        }
    }

    /**
     * Get all players in queue
     */
    getAllQueuedPlayers() {
        return Array.from(this.queue.values())
            .sort((a, b) => a.joinTime - b.joinTime);
    }
}

// Create and export a singleton instance
module.exports = new PvPQueueSystem();
