// src/systems/pvp/pvp-helpers/damage-calculator.js
class PvPDamageCalculator {
    /**
     * Calculate damage with advanced formulas
     */
    static calculateDamage(attacker, defender, attackType = 'normal') {
        let baseDamage = attacker.attack || 20;
        let defense = defender.defense || 10;
        
        // Attack type multipliers
        const multipliers = {
            'normal': 1.0,
            'heavy': 1.5,
            'special': 2.0,
            'critical': 1.8,
            'weak': 0.7
        };
        
        const multiplier = multipliers[attackType] || 1.0;
        baseDamage *= multiplier;
        
        // Level difference bonus/penalty
        const levelDiff = (attacker.level || 1) - (defender.level || 1);
        const levelBonus = levelDiff * 0.02; // 2% per level difference
        baseDamage *= (1 + levelBonus);
        
        // Defense calculation - defense reduces damage but never below 1
        const defenseReduction = defense * 0.4;
        let finalDamage = baseDamage - defenseReduction;
        
        // Minimum damage is always 1
        finalDamage = Math.max(1, finalDamage);
        
        // Add randomness (±20% variation)
        const randomFactor = 0.8 + (Math.random() * 0.4);
        finalDamage *= randomFactor;
        
        // Round to integer
        return Math.floor(finalDamage);
    }
    
    /**
     * Calculate critical hit chance
     */
    static calculateCriticalChance(attacker, defender) {
        const baseChance = 0.1; // 10% base critical chance
        const speedDiff = (attacker.speed || 10) - (defender.speed || 10);
        const speedBonus = Math.max(0, speedDiff * 0.01); // 1% per speed point difference
        
        return Math.min(0.5, baseChance + speedBonus); // Max 50% crit chance
    }
    
    /**
     * Check if attack is a critical hit
     */
    static isCriticalHit(attacker, defender) {
        const critChance = this.calculateCriticalChance(attacker, defender);
        return Math.random() < critChance;
    }
    
    /**
     * Calculate damage with critical hit consideration
     */
    static calculateDamageWithCrit(attacker, defender, attackType = 'normal') {
        const isCrit = this.isCriticalHit(attacker, defender);
        const damage = this.calculateDamage(attacker, defender, attackType);
        
        if (isCrit) {
            return {
                damage: Math.floor(damage * 1.5),
                critical: true
            };
        }
        
        return {
            damage: damage,
            critical: false
        };
    }
    
    /**
     * Calculate healing amount
     */
    static calculateHealing(user, healType = 'normal') {
        const baseHeal = user.level * 5 + 10;
        
        const multipliers = {
            'normal': 1.0,
            'strong': 1.5,
            'weak': 0.7
        };
        
        const multiplier = multipliers[healType] || 1.0;
        return Math.floor(baseHeal * multiplier);
    }
    
    /**
     * Calculate devil fruit special damage
     */
    static calculateDevilFruitDamage(attacker, defender, devilFruit) {
        let baseDamage = this.calculateDamage(attacker, defender, 'special');
        
        // Devil fruit specific bonuses
        const fruitBonuses = {
            'Gomu Gomu no Mi': { multiplier: 1.2, type: 'physical' },
            'Mera Mera no Mi': { multiplier: 1.5, type: 'elemental' },
            'Hie Hie no Mi': { multiplier: 1.3, type: 'elemental' },
            'Pika Pika no Mi': { multiplier: 1.6, type: 'elemental' },
            'Yami Yami no Mi': { multiplier: 1.8, type: 'special' }
        };
        
        const bonus = fruitBonuses[devilFruit];
        if (bonus) {
            baseDamage *= bonus.multiplier;
            
            // Add special effects
            const effects = [];
            if (bonus.type === 'elemental') {
                effects.push('burn'); // Chance for damage over time
            }
            if (devilFruit === 'Hie Hie no Mi') {
                effects.push('freeze'); // Chance to skip turn
            }
            
            return {
                damage: Math.floor(baseDamage),
                effects: effects
            };
        }
        
        return {
            damage: Math.floor(baseDamage),
            effects: []
        };
    }
    
    /**
     * Calculate status effect damage
     */
    static calculateStatusDamage(target, effect) {
        const statusDamage = {
            'burn': Math.floor(target.maxHealth * 0.05), // 5% max HP per turn
            'poison': Math.floor(target.maxHealth * 0.03), // 3% max HP per turn
            'bleed': Math.floor(target.attack * 0.3) // 30% of attack stat
        };
        
        return statusDamage[effect] || 0;
    }
}

module.exports = PvPDamageCalculator;
