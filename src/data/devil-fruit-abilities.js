// src/data/devil-fruit-abilities.js - Lore-Accurate Devil Fruit Abilities for PvP
const DEVIL_FRUIT_ABILITIES = {
    // COMMON FRUITS (40%) - Basic utility abilities
    'fruit_001': { // Bomu Bomu no Mi
        name: "Bomb Punch",
        damage: 85,
        cooldown: 0,
        effect: null,
        description: "Transform body part into explosive for basic damage",
        animation: "explosion"
    },
    'fruit_002': { // Bara Bara no Mi
        name: "Split Dodge",
        damage: 70,
        cooldown: 1,
        effect: "dodge_next",
        description: "Split apart to avoid the next incoming attack",
        animation: "split"
    },
    'fruit_003': { // Sube Sube no Mi
        name: "Slip Strike",
        damage: 75,
        cooldown: 0,
        effect: "reduce_accuracy",
        description: "Make opponent slip, reducing their next attack accuracy",
        animation: "slip"
    },
    'fruit_004': { // Kilo Kilo no Mi
        name: "Weight Press",
        damage: 90,
        cooldown: 1,
        effect: "slow_next",
        description: "Increase weight to slam down, slowing opponent",
        animation: "slam"
    },
    'fruit_005': { // Doru Doru no Mi
        name: "Wax Wall",
        damage: 60,
        cooldown: 1,
        effect: "shield_small",
        description: "Create wax barrier to reduce next damage by 30%",
        animation: "wall"
    },
    'fruit_006': { // Baku Baku no Mi
        name: "Munch Munch",
        damage: 80,
        cooldown: 0,
        effect: null,
        description: "Bite with powerful jaws for straightforward damage",
        animation: "bite"
    },
    'fruit_007': { // Ori Ori no Mi
        name: "Iron Bind",
        damage: 70,
        cooldown: 1,
        effect: "bind_one_turn",
        description: "Create iron shackles, opponent loses next turn",
        animation: "chains"
    },
    'fruit_008': { // Bane Bane no Mi
        name: "Spring Bounce",
        damage: 85,
        cooldown: 0,
        effect: "counter_ready",
        description: "Ready to bounce back 50% of next received damage",
        animation: "bounce"
    },
    'fruit_009': { // Noro Noro no Mi
        name: "Slow Beam",
        damage: 50,
        cooldown: 1,
        effect: "slow_two_turns",
        description: "Emit photons that slow opponent for 2 turns",
        animation: "beam"
    },
    'fruit_010': { // Doa Doa no Mi
        name: "Door Escape",
        damage: 60,
        cooldown: 1,
        effect: "dodge_partial",
        description: "Open door in air to partially avoid damage (50% reduction)",
        animation: "door"
    },

    // UNCOMMON FRUITS (30%) - Enhanced abilities with minor effects
    'fruit_051': { // Gomu Gomu no Mi
        name: "Gomu Gomu Pistol",
        damage: 110,
        cooldown: 0,
        effect: "knockback",
        description: "Stretch arm for powerful punch with knockback effect",
        animation: "stretch_punch"
    },
    'fruit_052': { // Hana Hana no Mi
        name: "Clutch",
        damage: 95,
        cooldown: 1,
        effect: "grapple",
        description: "Sprout arms to grapple and immobilize opponent",
        animation: "arms_sprout"
    },
    'fruit_053': { // Bari Bari no Mi
        name: "Barrier Crash",
        damage: 100,
        cooldown: 1,
        effect: "shield_medium",
        description: "Create barrier that blocks 50% damage next turn",
        animation: "barrier"
    },
    'fruit_054': { // Nagi Nagi no Mi
        name: "Silent Strike",
        damage: 105,
        cooldown: 1,
        effect: "stealth",
        description: "Attack silently, cannot be countered",
        animation: "silent"
    },
    'fruit_055': { // Hobi Hobi no Mi
        name: "Toy Transform",
        damage: 80,
        cooldown: 2,
        effect: "disable_ability",
        description: "Turn opponent into toy, disabling their next ability use",
        animation: "transform"
    },
    'fruit_056': { // Sui Sui no Mi
        name: "Swim Strike",
        damage: 110,
        cooldown: 1,
        effect: "phase_attack",
        description: "Swim through matter to bypass defenses",
        animation: "swim"
    },
    'fruit_057': { // Zou Zou no Mi
        name: "Trunk Slam",
        damage: 120,
        cooldown: 1,
        effect: "stun_short",
        description: "Powerful elephant trunk attack that briefly stuns",
        animation: "trunk"
    },
    'fruit_058': { // Inu Inu no Mi, Model: Wolf
        name: "Pack Hunter",
        damage: 115,
        cooldown: 0,
        effect: "damage_boost_low_hp",
        description: "Deal extra damage when below 50% HP",
        animation: "howl"
    },

    // RARE FRUITS (20%) - Strong abilities with unique mechanics
    'fruit_076': { // Moku Moku no Mi
        name: "White Out",
        damage: 90,
        cooldown: 2,
        effect: "blind_field",
        description: "Create smoke field, reducing all accuracy for 2 turns",
        animation: "smoke_cloud"
    },
    'fruit_077': { // Mera Mera no Mi
        name: "Fire Fist",
        damage: 140,
        cooldown: 1,
        effect: "burn_damage",
        description: "Fiery punch that causes burn damage over time",
        animation: "fire_fist"
    },
    'fruit_078': { // Suna Suna no Mi
        name: "Desert Spada",
        damage: 135,
        cooldown: 1,
        effect: "dehydrate",
        description: "Sand blade that reduces opponent's healing by 50%",
        animation: "sand_blade"
    },
    'fruit_079': { // Goro Goro no Mi
        name: "El Thor",
        damage: 150,
        cooldown: 2,
        effect: "chain_lightning",
        description: "Lightning that has 30% chance to hit again",
        animation: "lightning"
    },
    'fruit_080': { // Hie Hie no Mi
        name: "Ice Time",
        damage: 125,
        cooldown: 1,
        effect: "freeze",
        description: "Freeze opponent, reducing their damage by 40% next turn",
        animation: "ice_crystals"
    },
    'fruit_081': { // Yami Yami no Mi
        name: "Black Hole",
        damage: 100,
        cooldown: 2,
        effect: "ability_drain",
        description: "Absorb opponent's power, disabling abilities for 1 turn",
        animation: "darkness"
    },
    'fruit_082': { // Pika Pika no Mi
        name: "Light Speed Kick",
        damage: 160,
        cooldown: 2,
        effect: "unavoidable",
        description: "Move at light speed for undodgeable attack",
        animation: "light_beam"
    },
    'fruit_083': { // Magu Magu no Mi
        name: "Meteor Volcano",
        damage: 145,
        cooldown: 2,
        effect: "area_damage",
        description: "Magma fists rain down, dealing damage over 2 turns",
        animation: "magma_rain"
    },
    'fruit_090': { // Ope Ope no Mi
        name: "Room - Shambles",
        damage: 120,
        cooldown: 2,
        effect: "position_swap",
        description: "Create room to manipulate positioning and deal damage",
        animation: "surgical_room"
    },
    'fruit_091': { // Gura Gura no Mi
        name: "Seaquake",
        damage: 155,
        cooldown: 2,
        effect: "earthquake",
        description: "Create tremors that affect both fighters' next turn",
        animation: "quake"
    },

    // EPIC FRUITS (7%) - Powerful battlefield-changing abilities
    'fruit_101': { // Hito Hito no Mi, Model: Daibutsu
        name: "Buddha's Palm",
        damage: 170,
        cooldown: 2,
        effect: "massive_knockback",
        description: "Giant golden palm strike with overwhelming force",
        animation: "golden_palm"
    },
    'fruit_102': { // Zushi Zushi no Mi
        name: "Gravity Crush",
        damage: 160,
        cooldown: 2,
        effect: "gravity_field",
        description: "Manipulate gravity to crush and slow opponent",
        animation: "gravity_waves"
    },
    'fruit_103': { // Nikyu Nikyu no Mi
        name: "Paw Cannon",
        damage: 150,
        cooldown: 2,
        effect: "repel_damage",
        description: "Repel air at light speed, ignoring some defenses",
        animation: "paw_shockwave"
    },
    'fruit_104': { // Doku Doku no Mi
        name: "Venom Demon",
        damage: 140,
        cooldown: 3,
        effect: "poison_severe",
        description: "Unleash deadly poison that damages over 3 turns",
        animation: "poison_cloud"
    },
    'fruit_105': { // Horm Horm no Mi
        name: "Emporio Tension",
        damage: 120,
        cooldown: 2,
        effect: "stat_manipulation",
        description: "Inject hormones to boost damage for 2 turns",
        animation: "hormone_boost"
    },
    'fruit_107': { // Toki Toki no Mi
        name: "Time Skip",
        damage: 100,
        cooldown: 3,
        effect: "time_manipulation",
        description: "Skip through time to avoid all damage next turn",
        animation: "time_portal"
    },

    // LEGENDARY FRUITS (2.5%) - Devastating signature moves
    'fruit_116': { // Uo Uo no Mi, Model: Seiryu
        name: "Divine Thunder",
        damage: 200,
        cooldown: 3,
        effect: "dragon_rage",
        description: "Eastern dragon's divine lightning attack",
        animation: "dragon_lightning"
    },
    'fruit_117': { // Inu Inu no Mi, Model: Okuchi no Makami
        name: "Wolf God's Bite",
        damage: 190,
        cooldown: 2,
        effect: "spirit_drain",
        description: "Mystical wolf bite that drains opponent's energy",
        animation: "spirit_wolf"
    },
    'fruit_118': { // Hebi Hebi no Mi, Model: Yamata-no-Orochi
        name: "Eight-Headed Strike",
        damage: 185,
        cooldown: 3,
        effect: "multi_strike",
        description: "All eight heads attack simultaneously",
        animation: "eight_serpents"
    },
    'fruit_119': { // Tori Tori no Mi, Model: Phoenix
        name: "Phoenix Regeneration",
        damage: 140,
        cooldown: 3,
        effect: "full_heal",
        description: "Blue flames of regeneration restore health",
        animation: "phoenix_flames"
    },
    'fruit_124': { // Shi Shi no Mi
        name: "Death Touch",
        damage: 180,
        cooldown: 3,
        effect: "life_drain",
        description: "Touch of death that heals user while damaging foe",
        animation: "death_aura"
    },
    'fruit_125': { // Jikan Jikan no Mi
        name: "Temporal Prison",
        damage: 160,
        cooldown: 3,
        effect: "time_lock",
        description: "Trap opponent in time loop, stunning for 1 turn",
        animation: "time_prison"
    },

    // MYTHICAL FRUITS (0.4%) - Reality-warping powers
    'fruit_131': { // Hito Hito no Mi, Model: Nika
        name: "Gear 5: Toon Force",
        damage: 210,
        cooldown: 3,
        effect: "reality_bend",
        description: "Bend reality like rubber, ignoring physics",
        animation: "cartoon_physics"
    },
    'fruit_132': { // Hito Hito no Mi, Model: Raijin
        name: "Thunder God's Wrath",
        damage: 220,
        cooldown: 3,
        effect: "divine_storm",
        description: "Summon divine thunderstorm across battlefield",
        animation: "divine_lightning"
    },
    'fruit_133': { // Hito Hito no Mi, Model: Susanoo
        name: "Storm God's Blade",
        damage: 215,
        cooldown: 3,
        effect: "divine_slash",
        description: "Legendary sword technique that cuts through anything",
        animation: "god_sword"
    },
    'fruit_134': { // Kami Kami no Mi, Model: Amaterasu
        name: "Sun Goddess Flames",
        damage: 225,
        cooldown: 3,
        effect: "eternal_burn",
        description: "Divine flames that cannot be extinguished",
        animation: "sun_goddess"
    },
    'fruit_138': { // Shinigami Shinigami no Mi
        name: "Soul Reaper",
        damage: 200,
        cooldown: 3,
        effect: "soul_damage",
        description: "Attack the soul directly, bypassing defenses",
        animation: "soul_reap"
    },

    // OMNIPOTENT FRUITS (0.1%) - Godlike abilities
    'fruit_146': { // Kami Kami no Mi
        name: "Divine Judgment",
        damage: 240,
        cooldown: 3,
        effect: "execute_condition",
        description: "Divine power that deals massive damage to weakened foes",
        animation: "divine_light"
    },
    'fruit_147': { // Sekai Sekai no Mi
        name: "World Reshape",
        damage: 200,
        cooldown: 3,
        effect: "battlefield_control",
        description: "Reshape the battlefield to your advantage",
        animation: "world_shift"
    },
    'fruit_148': { // Uchuu Uchuu no Mi
        name: "Cosmic Annihilation",
        damage: 250,
        cooldown: 3,
        effect: "cosmic_power",
        description: "Channel the power of the universe itself",
        animation: "cosmic_blast"
    },
    'fruit_149': { // Sonzai Sonzai no Mi
        name: "Existence Denial",
        damage: 220,
        cooldown: 3,
        effect: "negate_existence",
        description: "Temporarily deny opponent's existence",
        animation: "reality_crack"
    },
    'fruit_150': { // Subete Subete no Mi
        name: "All Creation",
        damage: 230,
        cooldown: 3,
        effect: "omnipotent_strike",
        description: "Command over all creation and destruction",
        animation: "creation_destruction"
    }
};

// Ability Effects System
const ABILITY_EFFECTS = {
    // Defensive Effects
    dodge_next: { duration: 1, description: "Dodge the next attack completely" },
    shield_small: { duration: 1, description: "Reduce next damage by 30%" },
    shield_medium: { duration: 1, description: "Reduce next damage by 50%" },
    shield_large: { duration: 1, description: "Reduce next damage by 70%" },
    
    // Offensive Effects
    burn_damage: { duration: 2, description: "Deal 20 damage per turn" },
    poison_severe: { duration: 3, description: "Deal 30 damage per turn" },
    freeze: { duration: 1, description: "Reduce opponent damage by 40%" },
    
    // Control Effects
    bind_one_turn: { duration: 1, description: "Opponent loses next turn" },
    slow_next: { duration: 1, description: "Opponent moves slower next turn" },
    slow_two_turns: { duration: 2, description: "Opponent moves slower for 2 turns" },
    stun_short: { duration: 1, description: "Brief stunning effect" },
    
    // Special Effects
    unavoidable: { duration: 0, description: "Attack cannot be dodged" },
    phase_attack: { duration: 0, description: "Bypass defensive abilities" },
    life_drain: { duration: 0, description: "Heal for 50% of damage dealt" },
    soul_damage: { duration: 0, description: "Ignore physical defenses" },
    
    // Mythical/Omnipotent Effects
    reality_bend: { duration: 1, description: "Ignore physics and conventional rules" },
    time_lock: { duration: 1, description: "Trap in temporal prison" },
    execute_condition: { duration: 0, description: "Deal double damage to enemies below 30% HP" },
    omnipotent_strike: { duration: 0, description: "Perfect attack that adapts to overcome defenses" }
};

// Balanced Damage Calculation for PvP
function calculatePvPDamage(attackerAbility, attackerCP, defenderCP, turn, defenderEffects = []) {
    let baseDamage = attackerAbility.damage;
    
    // CP difference mitigation (reduce power creep)
    const cpRatio = Math.min(attackerCP / defenderCP, 2.0); // Cap at 2x advantage
    const balancedRatio = 1 + ((cpRatio - 1) * 0.3); // Reduce CP impact to 30%
    
    // Turn 1 damage reduction (80% DR)
    const turnMultiplier = turn === 1 ? 0.2 : 1.0;
    
    // Apply defender effects
    let effectMultiplier = 1.0;
    defenderEffects.forEach(effect => {
        switch(effect) {
            case 'shield_small': effectMultiplier *= 0.7; break;
            case 'shield_medium': effectMultiplier *= 0.5; break;
            case 'shield_large': effectMultiplier *= 0.3; break;
            case 'freeze': effectMultiplier *= 0.6; break;
        }
    });
    
    // Check for special attack effects
    if (attackerAbility.effect === 'unavoidable' || attackerAbility.effect === 'phase_attack') {
        effectMultiplier = 1.0; // Bypass defensive effects
    }
    
    const finalDamage = Math.floor(baseDamage * balancedRatio * turnMultiplier * effectMultiplier);
    
    // Minimum damage (can't reduce below 10% of base)
    return Math.max(finalDamage, Math.floor(baseDamage * 0.1));
}

// Health calculation based on level and rarity
function calculatePvPHealth(level, rarityMultiplier) {
    const baseHP = 1000;
    const levelMultiplier = 1 + (level * 0.02); // +2% per level (40% at max)
    const rarityHP = 1 + Math.sqrt(rarityMultiplier - 1) * 0.5; // Sqrt scaling for HP
    
    return Math.floor(baseHP * levelMultiplier * rarityHP);
}

// Get ability by fruit ID
function getAbilityByFruitId(fruitId) {
    return DEVIL_FRUIT_ABILITIES[fruitId] || {
        name: "Basic Strike",
        damage: 80,
        cooldown: 0,
        effect: null,
        description: "A basic attack with no special effects",
        animation: "punch"
    };
}

// Validate ability balance
function validateAbilityBalance() {
    const abilities = Object.values(DEVIL_FRUIT_ABILITIES);
    const issues = [];
    
    abilities.forEach((ability, index) => {
        // Check for overpowered turn 1 damage (with 80% DR)
        const turn1Damage = ability.damage * 0.2;
        if (turn1Damage > 60) {
            issues.push(`${ability.name}: Turn 1 damage too high (${turn1Damage})`);
        }
        
        // Check for reasonable damage ranges
        if (ability.damage > 250) {
            issues.push(`${ability.name}: Base damage too high (${ability.damage})`);
        }
        
        // Check cooldown balance
        if (ability.damage > 200 && ability.cooldown < 2) {
            issues.push(`${ability.name}: High damage ability needs longer cooldown`);
        }
    });
    
    return {
        isBalanced: issues.length === 0,
        issues,
        totalAbilities: abilities.length
    };
}

module.exports = {
    DEVIL_FRUIT_ABILITIES,
    ABILITY_EFFECTS,
    calculatePvPDamage,
    calculatePvPHealth,
    getAbilityByFruitId,
    validateAbilityBalance
};
