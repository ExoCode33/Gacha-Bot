const DatabaseManager = require('../../database/manager');
const { calculateBaseCPFromLevel } = require('../../data/devil-fruits');

// Import abilities safely
let balancedDevilFruitAbilities = {};
try {
    const abilitiesData = require('../../data/balanced-devil-fruit-abilities');
    balancedDevilFruitAbilities = abilitiesData.balancedDevilFruitAbilities || {};
} catch (error) {
    console.warn('⚠️ Could not load abilities for PvP balance system');
    balancedDevilFruitAbilities = {};
}

class BalanceSystem {
    constructor() {
        this.balancedLevelScaling = {
            0: 100, 5: 120, 10: 140, 15: 160, 20: 180,
            25: 200, 30: 220, 35: 240, 40: 260, 45: 280, 50: 300
        };

        this.balancedRarityScaling = {
            common: { min: 1.0, max: 1.2 },
            uncommon: { min: 1.2, max: 1.4 },
            rare: { min: 1.4, max: 1.7 },
            epic: { min: 1.7, max: 2.1 },
            legendary: { min: 2.1, max: 2.6 },
            mythical: { min: 2.6, max: 3.2 },
            divine: { min: 3.2, max: 4.0 }
        };
    }

    async init() {
        console.log('⚖️ PvP Balance System initialized');
    }

    // Create balanced fighter
    async createFighter(userId) {
        try {
            const user = await DatabaseManager.getUser(userId);
            const fruits = await DatabaseManager.getUserDevilFruits(userId);
            
            if (!user || !fruits || fruits.length < 5) {
                return null;
            }

            const balancedCP = this.calculateBalancedCP(user.level, fruits);
            const health = this.calculateHealthFromCP(balancedCP);

            return {
                userId: user.user_id,
                username: user.username,
                level: user.level,
                originalCP: user.total_cp,
                balancedCP,
                maxHealth: health,
                hp: health,
                fruits: fruits,
                effects: []
            };
        } catch (error) {
            console.error('Error creating fighter:', error);
            return null;
        }
    }

    calculateBalancedCP(level, fruits) {
        const balancedBaseCP = this.balancedLevelScaling[level] || 100;
        let totalCP = balancedBaseCP;

        const fruitGroups = {};
        fruits.forEach(fruit => {
            const fruitName = fruit.fruit_name || fruit.name;
            if (!fruitGroups[fruitName]) {
                fruitGroups[fruitName] = { rarity: fruit.fruit_rarity || fruit.rarity, count: 0 };
            }
            fruitGroups[fruitName].count++;
        });

        Object.values(fruitGroups).forEach(group => {
            const rarityRange = this.balancedRarityScaling[group.rarity];
            if (rarityRange) {
                const avgMultiplier = (rarityRange.min + rarityRange.max) / 2;
                const duplicateBonus = 1 + ((group.count - 1) * 0.01);
                const fruitCP = (balancedBaseCP * avgMultiplier) * duplicateBonus;
                totalCP += fruitCP;
            }
        });

        return Math.floor(totalCP);
    }

    calculateHealthFromCP(cp) {
        const baseHP = 200;
        const cpMultiplier = 1 + (cp / 1000) * 0.2;
        return Math.floor(baseHP * cpMultiplier);
    }

    // Quick battle simulation
    async simulateQuickBattle(interaction, fighter1, fighter2) {
        await interaction.deferReply();

        const { EmbedBuilder } = require('discord.js');
        
        // Simple battle simulation
        let turn = 1;
        const maxTurns = 10;
        let p1HP = fighter1.maxHealth;
        let p2HP = fighter2.maxHealth;
        
        const battleLog = [];
        battleLog.push(`⚔️ ${fighter1.username} vs ${fighter2.username}`);

        while (turn <= maxTurns && p1HP > 0 && p2HP > 0) {
            // Fighter 1 attacks
            if (p1HP > 0) {
                const damage = this.calculateDamage(fighter1, fighter2, turn);
                p2HP = Math.max(0, p2HP - damage);
                battleLog.push(`⚡ ${fighter1.username} deals ${damage} damage! (${fighter2.username}: ${p2HP} HP)`);
            }

            // Fighter 2 attacks
            if (p2HP > 0) {
                const damage = this.calculateDamage(fighter2, fighter1, turn);
                p1HP = Math.max(0, p1HP - damage);
                battleLog.push(`⚡ ${fighter2.username} deals ${damage} damage! (${fighter1.username}: ${p1HP} HP)`);
            }

            turn++;
        }

        const winner = p1HP > p2HP ? fighter1 : fighter2;
        const loser = winner === fighter1 ? fighter2 : fighter1;

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('⚡ Quick Battle Results')
            .setDescription(`**${winner.username}** wins!`)
            .addFields([
                {
                    name: '🏆 Battle Summary',
                    value: battleLog.slice(-6).join('\n'),
                    inline: false
                },
                {
                    name: '📊 Final Stats',
                    value: `**${fighter1.username}**: ${p1HP}/${fighter1.maxHealth} HP\n**${fighter2.username}**: ${p2HP}/${fighter2.maxHealth} HP`,
                    inline: false
                }
            ])
            .setFooter({ text: 'Quick simulation - no rewards given' });

        await interaction.editReply({ embeds: [embed] });
    }

    calculateDamage(attacker, defender, turn) {
        const baseDamage = 80;
        const cpRatio = Math.min(attacker.balancedCP / defender.balancedCP, 1.5);
        const turnMultiplier = turn === 1 ? 0.6 : turn === 2 ? 0.8 : 1.0;
        
        const damage = Math.floor(baseDamage * cpRatio * turnMultiplier);
        return Math.max(10, damage);
    }
}

module.exports = BalanceSystem;
