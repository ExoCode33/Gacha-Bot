// src/systems/npc-bosses.js - One Piece NPC Boss System
const { getRarityEmoji } = require('../data/devil-fruits');

class NPCBossSystem {
    constructor() {
        this.bosses = {
            // =====================================================
            // TIER 1 BOSSES - Entry Level (1000-2000 CP)
            // =====================================================
            "Captain Morgan": {
                name: "Captain Morgan",
                title: "Axe-Hand Morgan",
                level: 10,
                totalCP: 1200,
                difficulty: "Easy",
                emoji: "⚔️",
                description: "Former Marine Captain with an axe for a hand",
                fruits: [
                    "Supa Supa no Mi", "Ori Ori no Mi", "Bane Bane no Mi", 
                    "Toge Toge no Mi", "Shari Shari no Mi", "Kilo Kilo no Mi",
                    "Bomu Bomu no Mi"
                ]
            },
            "Don Krieg": {
                name: "Don Krieg",
                title: "Foul Play Krieg",
                level: 15,
                totalCP: 1500,
                difficulty: "Easy",
                emoji: "💣",
                description: "Pirate Admiral of the Krieg Pirates with explosive weapons",
                fruits: [
                    "Bomu Bomu no Mi", "Baku Baku no Mi", "Ori Ori no Mi",
                    "Supa Supa no Mi", "Toge Toge no Mi", "Kilo Kilo no Mi",
                    "Doru Doru no Mi"
                ]
            },
            "Arlong": {
                name: "Arlong",
                title: "Saw-Tooth Arlong",
                level: 18,
                totalCP: 1800,
                difficulty: "Easy",
                emoji: "🦈",
                description: "Fishman pirate captain with incredible jaw strength",
                fruits: [
                    "Mizu Mizu no Mi", "Gasu Gasu no Mi", "Supa Supa no Mi",
                    "Toge Toge no Mi", "Bane Bane no Mi", "Kilo Kilo no Mi",
                    "Ori Ori no Mi"
                ]
            },

            // =====================================================
            // TIER 2 BOSSES - Intermediate (2000-4000 CP)
            // =====================================================
            "Smoker": {
                name: "Smoker",
                title: "White Hunter",
                level: 25,
                totalCP: 2800,
                difficulty: "Medium",
                emoji: "💨",
                description: "Marine Vice Admiral with Smoke Logia powers",
                fruits: [
                    "Moku Moku no Mi", "Suna Suna no Mi", "Hie Hie no Mi",
                    "Ori Ori no Mi", "Bari Bari no Mi", "Noro Noro no Mi",
                    "Doku Doku no Mi"
                ]
            },
            "Crocodile": {
                name: "Crocodile",
                title: "Desert King",
                level: 30,
                totalCP: 3500,
                difficulty: "Medium",
                emoji: "🏜️",
                description: "Former Warlord with Sand Logia powers",
                fruits: [
                    "Suna Suna no Mi", "Doku Doku no Mi", "Horo Horo no Mi",
                    "Kage Kage no Mi", "Mera Mera no Mi", "Hie Hie no Mi",
                    "Zushi Zushi no Mi"
                ]
            },
            "Enel": {
                name: "Enel",
                title: "God of Skypiea",
                level: 35,
                totalCP: 4000,
                difficulty: "Medium",
                emoji: "⚡",
                description: "Self-proclaimed god with Lightning Logia powers",
                fruits: [
                    "Goro Goro no Mi", "Pika Pika no Mi", "Mera Mera no Mi",
                    "Hie Hie no Mi", "Magu Magu no Mi", "Yami Yami no Mi",
                    "Ope Ope no Mi"
                ]
            },
            "Rob Lucci": {
                name: "Rob Lucci",
                title: "CP9's Strongest",
                level: 32,
                totalCP: 3800,
                difficulty: "Medium",
                emoji: "🐆",
                description: "Elite CP9 agent with Leopard Zoan powers",
                fruits: [
                    "Neko Neko no Mi, Model: Leopard", "Inu Inu no Mi, Model: Wolf",
                    "Zou Zou no Mi", "Tori Tori no Mi, Model: Falcon",
                    "Ushi Ushi no Mi, Model: Giraffe", "Uma Uma no Mi",
                    "Ryu Ryu no Mi, Model: Allosaurus"
                ]
            },

            // =====================================================
            // TIER 3 BOSSES - Advanced (4000-6000 CP)
            // =====================================================
            "Doflamingo": {
                name: "Donquixote Doflamingo",
                title: "Heavenly Demon",
                level: 40,
                totalCP: 5200,
                difficulty: "Hard",
                emoji: "🧵",
                description: "Former Warlord and King of Dressrosa with String powers",
                fruits: [
                    "Ito Ito no Mi", "Hobi Hobi no Mi", "Ope Ope no Mi",
                    "Mera Mera no Mi", "Hie Hie no Mi", "Pika Pika no Mi",
                    "Magu Magu no Mi"
                ]
            },
            "Gecko Moria": {
                name: "Gecko Moria",
                title: "Shadow Master",
                level: 38,
                totalCP: 4800,
                difficulty: "Hard",
                emoji: "🌚",
                description: "Former Warlord with Shadow manipulation powers",
                fruits: [
                    "Kage Kage no Mi", "Horo Horo no Mi", "Yomi Yomi no Mi",
                    "Suke Suke no Mi", "Horu Horu no Mi", "Doku Doku no Mi",
                    "Yami Yami no Mi"
                ]
            },
            "Magellan": {
                name: "Magellan",
                title: "Chief Warden of Impel Down",
                level: 42,
                totalCP: 5500,
                difficulty: "Hard",
                emoji: "☠️",
                description: "Impel Down's Chief Warden with deadly Poison powers",
                fruits: [
                    "Doku Doku no Mi", "Gasu Gasu no Mi", "Magu Magu no Mi",
                    "Hie Hie no Mi", "Yami Yami no Mi", "Ope Ope no Mi",
                    "Zushi Zushi no Mi"
                ]
            },

            // =====================================================
            // TIER 4 BOSSES - Expert (6000-8000 CP)
            // =====================================================
            "Katakuri": {
                name: "Charlotte Katakuri",
                title: "Sweet Commander",
                level: 45,
                totalCP: 7200,
                difficulty: "Very Hard",
                emoji: "🍡",
                description: "Big Mom's strongest son with advanced Haki and Mochi powers",
                fruits: [
                    "Mochi Mochi no Mi", "Ope Ope no Mi", "Pika Pika no Mi",
                    "Magu Magu no Mi", "Goro Goro no Mi", "Yami Yami no Mi",
                    "Gura Gura no Mi"
                ]
            },
            "King": {
                name: "King",
                title: "The Conflagration",
                level: 44,
                totalCP: 7000,
                difficulty: "Very Hard",
                emoji: "🔥",
                description: "Kaido's right-hand man with Pteranodon Ancient Zoan",
                fruits: [
                    "Ryu Ryu no Mi, Model: Pteranodon", "Mera Mera no Mi",
                    "Magu Magu no Mi", "Pika Pika no Mi", "Goro Goro no Mi",
                    "Uo Uo no Mi, Model: Seiryu", "Tori Tori no Mi, Model: Phoenix"
                ]
            },
            "Marco": {
                name: "Marco",
                title: "The Phoenix",
                level: 46,
                totalCP: 7500,
                difficulty: "Very Hard",
                emoji: "🔥",
                description: "Whitebeard's first division commander with Phoenix powers",
                fruits: [
                    "Tori Tori no Mi, Model: Phoenix", "Mera Mera no Mi",
                    "Hie Hie no Mi", "Pika Pika no Mi", "Ope Ope no Mi",
                    "Gura Gura no Mi", "Yami Yami no Mi"
                ]
            },

            // =====================================================
            // TIER 5 BOSSES - Legendary (8000-12000 CP)
            // =====================================================
            "Akainu": {
                name: "Sakazuki",
                title: "Fleet Admiral Akainu",
                level: 50,
                totalCP: 10000,
                difficulty: "Legendary",
                emoji: "🌋",
                description: "Fleet Admiral with devastating Magma Logia powers",
                fruits: [
                    "Magu Magu no Mi", "Gura Gura no Mi", "Pika Pika no Mi",
                    "Goro Goro no Mi", "Yami Yami no Mi", "Ope Ope no Mi",
                    "Hito Hito no Mi, Model: Daibutsu"
                ]
            },
            "Aokiji": {
                name: "Kuzan",
                title: "Former Admiral Aokiji",
                level: 49,
                totalCP: 9500,
                difficulty: "Legendary",
                emoji: "❄️",
                description: "Former Marine Admiral with devastating Ice Logia powers",
                fruits: [
                    "Hie Hie no Mi", "Magu Magu no Mi", "Pika Pika no Mi",
                    "Goro Goro no Mi", "Gura Gura no Mi", "Yami Yami no Mi",
                    "Ope Ope no Mi"
                ]
            },
            "Kizaru": {
                name: "Borsalino",
                title: "Admiral Kizaru",
                level: 49,
                totalCP: 9800,
                difficulty: "Legendary",
                emoji: "☀️",
                description: "Marine Admiral with Light Logia powers",
                fruits: [
                    "Pika Pika no Mi", "Magu Magu no Mi", "Hie Hie no Mi",
                    "Goro Goro no Mi", "Gura Gura no Mi", "Yami Yami no Mi",
                    "Ope Ope no Mi"
                ]
            },
            "Big Mom": {
                name: "Charlotte Linlin",
                title: "Big Mom",
                level: 50,
                totalCP: 11500,
                difficulty: "Legendary",
                emoji: "👩",
                description: "Yonko with Soul manipulation powers",
                fruits: [
                    "Soru Soru no Mi", "Gura Gura no Mi", "Yami Yami no Mi",
                    "Ope Ope no Mi", "Magu Magu no Mi", "Pika Pika no Mi",
                    "Hito Hito no Mi, Model: Nika"
                ]
            },

            // =====================================================
            // TIER 6 BOSSES - Mythical (12000+ CP)
            // =====================================================
            "Kaido": {
                name: "Kaido",
                title: "King of the Beasts",
                level: 50,
                totalCP: 12000,
                difficulty: "Mythical",
                emoji: "🐉",
                description: "Yonko known as the strongest creature with Azure Dragon powers",
                fruits: [
                    "Uo Uo no Mi, Model: Seiryu", "Gura Gura no Mi",
                    "Yami Yami no Mi", "Hito Hito no Mi, Model: Nika",
                    "Magu Magu no Mi", "Pika Pika no Mi", "Ope Ope no Mi"
                ]
            },
            "Whitebeard": {
                name: "Edward Newgate",
                title: "Whitebeard - World's Strongest Man",
                level: 50,
                totalCP: 13000,
                difficulty: "Mythical",
                emoji: "💥",
                description: "Former Yonko with world-destroying Tremor powers",
                fruits: [
                    "Gura Gura no Mi", "Yami Yami no Mi", "Magu Magu no Mi",
                    "Pika Pika no Mi", "Hie Hie no Mi", "Ope Ope no Mi",
                    "Hito Hito no Mi, Model: Nika"
                ]
            },
            "Blackbeard": {
                name: "Marshall D. Teach",
                title: "Blackbeard",
                level: 50,
                totalCP: 12500,
                difficulty: "Mythical",
                emoji: "🌑",
                description: "Yonko with dual Devil Fruit powers - unprecedented in history",
                fruits: [
                    "Yami Yami no Mi", "Gura Gura no Mi", "Ope Ope no Mi",
                    "Magu Magu no Mi", "Pika Pika no Mi", "Hie Hie no Mi",
                    "Hito Hito no Mi, Model: Nika"
                ]
            },
            "Gold Roger": {
                name: "Gol D. Roger",
                title: "Pirate King",
                level: 50,
                totalCP: 14000,
                difficulty: "Mythical",
                emoji: "👑",
                description: "The legendary Pirate King who conquered the Grand Line",
                fruits: [
                    "Hito Hito no Mi, Model: Nika", "Gura Gura no Mi",
                    "Yami Yami no Mi", "Ope Ope no Mi", "Toki Toki no Mi",
                    "Soru Soru no Mi", "Uo Uo no Mi, Model: Seiryu"
                ]
            },

            // =====================================================
            // SECRET BOSS - World Government
            // =====================================================
            "Im": {
                name: "Im",
                title: "Sovereign of the World",
                level: 50,
                totalCP: 15000,
                difficulty: "Divine",
                emoji: "👁️",
                description: "The secret ruler of the World Government with unknown powers",
                fruits: [
                    "Hito Hito no Mi, Model: Nika", "Yami Yami no Mi",
                    "Gura Gura no Mi", "Ope Ope no Mi", "Toki Toki no Mi",
                    "Soru Soru no Mi", "Uo Uo no Mi, Model: Seiryu"
                ]
            }
        };

        console.log('🤖 NPC Boss System initialized with', Object.keys(this.bosses).length, 'bosses');
    }

    getRandomBoss() {
        const bossNames = Object.keys(this.bosses);
        const randomName = bossNames[Math.floor(Math.random() * bossNames.length)];
        const boss = this.bosses[randomName];
        
        return {
            ...boss,
            isNPC: true,
            userId: `npc_${randomName.toLowerCase().replace(/\s/g, '_')}`,
            username: boss.name
        };
    }

    getBossByName(name) {
        return this.bosses[name] ? { ...this.bosses[name], isNPC: true } : null;
    }

    getBossesByDifficulty(difficulty) {
        return Object.values(this.bosses)
            .filter(boss => boss.difficulty === difficulty)
            .map(boss => ({ ...boss, isNPC: true }));
    }

    getBossesInCPRange(minCP, maxCP) {
        return Object.values(this.bosses)
            .filter(boss => boss.totalCP >= minCP && boss.totalCP <= maxCP)
            .map(boss => ({ ...boss, isNPC: true }));
    }

    getBalancedBossForPlayer(playerCP) {
        // Use the same balance calculation as PvPBalanceSystem
        // Find a boss within reasonable CP range (0.8x to 1.3x player balanced CP)
        const minCP = Math.floor(playerCP * 0.8);
        const maxCP = Math.floor(playerCP * 1.3);
        
        const suitableBosses = this.getBossesInCPRange(minCP, maxCP);
        
        if (suitableBosses.length === 0) {
            // If no suitable boss found, return a boss closest to player CP
            const allBosses = Object.values(this.bosses);
            const closestBoss = allBosses.reduce((closest, boss) => {
                const currentDiff = Math.abs(boss.totalCP - playerCP);
                const closestDiff = Math.abs(closest.totalCP - playerCP);
                return currentDiff < closestDiff ? boss : closest;
            });
            return { ...closestBoss, isNPC: true };
        }
        
        // Return random suitable boss
        const randomBoss = suitableBosses[Math.floor(Math.random() * suitableBosses.length)];
        return randomBoss;
    }

    getAllBosses() {
        return Object.entries(this.bosses).map(([name, boss]) => ({
            name,
            ...boss,
            isNPC: true
        }));
    }

    getBossStats() {
        const difficulties = {};
        const cpRanges = {};
        
        Object.values(this.bosses).forEach(boss => {
            difficulties[boss.difficulty] = (difficulties[boss.difficulty] || 0) + 1;
            
            const cpRange = Math.floor(boss.totalCP / 2000) * 2000;
            const rangeKey = `${cpRange}-${cpRange + 1999}`;
            cpRanges[rangeKey] = (cpRanges[rangeKey] || 0) + 1;
        });
        
        return {
            totalBosses: Object.keys(this.bosses).length,
            difficulties,
            cpRanges,
            minCP: Math.min(...Object.values(this.bosses).map(b => b.totalCP)),
            maxCP: Math.max(...Object.values(this.bosses).map(b => b.totalCP))
        };
    }

    // NPC AI for fruit selection
    selectFruitsForNPC(boss) {
        // NPC selects their 5 best fruits based on rarity and power
        const fruits = [...boss.fruits];
        
        // Shuffle and select 5 fruits
        for (let i = fruits.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fruits[i], fruits[j]] = [fruits[j], fruits[i]];
        }
        
        return fruits.slice(0, 5);
    }

    // Enhanced NPC AI that works with PvP balance system
    selectBattleFruit(npcData, availableFruits, turn, enemyFruits, balancedCP) {
        // Enhanced AI: considers CP scaling, turn number, and tactical advantages
        const powerRatings = {
            'divine': 8,
            'omnipotent': 7,
            'mythical': 6,
            'legendary': 5,
            'epic': 4,
            'rare': 3,
            'uncommon': 2,
            'common': 1
        };

        // Score each available fruit
        const scoredFruits = availableFruits.map(fruitName => {
            const { getFruitByName } = require('../data/devil-fruits');
            const fruit = getFruitByName(fruitName);
            
            let score = powerRatings[fruit?.rarity || 'common'];
            
            // Bonus for Logia types (harder to hit)
            if (fruit?.type === 'Logia') score += 2;
            
            // Bonus for Mythical Zoan
            if (fruit?.type === 'Mythical Zoan') score += 1.5;
            
            // Consider turn number (use stronger fruits later)
            if (turn >= 3 && score >= 5) score += 1;
            
            // Consider balanced CP ratio for tactical decisions
            const cpRatio = balancedCP / (enemyFruits.length * 1000); // Rough estimate
            if (cpRatio < 1 && score >= 4) score += 0.5; // Use stronger fruits when behind
            
            // Random factor for unpredictability
            score += Math.random() * 1.5;
            
            return { fruitName, score };
        });

        // Sort by score and pick the highest
        scoredFruits.sort((a, b) => b.score - a.score);
        return scoredFruits[0].fruitName;
    }

    createBossEmbed(boss) {
        const { getRarityColor } = require('../data/devil-fruits');
        
        const difficultyColors = {
            'Easy': 0x00FF00,
            'Medium': 0xFFFF00,
            'Hard': 0xFF8000,
            'Very Hard': 0xFF4500,
            'Legendary': 0x8B008B,
            'Mythical': 0xFF1493,
            'Divine': 0xFFD700
        };

        const embed = {
            color: difficultyColors[boss.difficulty] || 0x8B4513,
            title: `${boss.emoji} ${boss.title}`,
            description: boss.description,
            fields: [
                {
                    name: '⚔️ Boss Stats',
                    value: [
                        `**Name**: ${boss.name}`,
                        `**Level**: ${boss.level}`,
                        `**Total CP**: ${boss.totalCP.toLocaleString()}`,
                        `**Difficulty**: ${boss.difficulty}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🍈 Available Devil Fruits',
                    value: boss.fruits.slice(0, 4).join('\n') + 
                           (boss.fruits.length > 4 ? `\n...and ${boss.fruits.length - 4} more` : ''),
                    inline: true
                }
            ],
            footer: { text: `One Piece NPC Boss • ${boss.fruits.length} Devil Fruits available` },
            timestamp: new Date().toISOString()
        };

        return embed;
    }
}

module.exports = new NPCBossSystem();
