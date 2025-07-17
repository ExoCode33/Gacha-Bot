// src/data/balanced-devil-fruit-abilities.js - Lore-Accurate & Balanced PvP System

const balancedDevilFruitAbilities = {
  // =====================================================
  // COMMON FRUITS (45-60 damage, 0-1 cooldown)
  // =====================================================
  "Gomu Gomu no Mi": {
    name: "Gomu Gomu no Pistol",
    damage: 55,
    cooldown: 0,
    effect: "stretch_range",
    description: "Stretches arm to punch from long range",
    accuracy: 85,
    type: "physical"
  },
  "Bara Bara no Mi": {
    name: "Bara Bara Festival",
    damage: 50,
    cooldown: 1,
    effect: "immune_slash",
    description: "Split body parts float and attack independently",
    accuracy: 80,
    type: "physical"
  },
  "Sube Sube no Mi": {
    name: "Slip Away",
    damage: 45,
    cooldown: 1,
    effect: "dodge_boost",
    description: "Slippery skin deflects attacks",
    accuracy: 90,
    type: "defensive"
  },
  "Bomu Bomu no Mi": {
    name: "Nose Fancy Cannon",
    damage: 60,
    cooldown: 1,
    effect: "splash_damage",
    description: "Explosive body parts deal area damage",
    accuracy: 75,
    type: "explosive"
  },
  "Kilo Kilo no Mi": {
    name: "10,000 Kilo Press",
    damage: 58,
    cooldown: 1,
    effect: "armor_break",
    description: "Increase weight to crush through defenses",
    accuracy: 70,
    type: "physical"
  },

  // =====================================================
  // UNCOMMON FRUITS (60-80 damage, 1-2 cooldown)
  // =====================================================
  "Doru Doru no Mi": {
    name: "Candle Wall",
    damage: 65,
    cooldown: 2,
    effect: "shield_medium",
    description: "Create hardened wax barriers",
    accuracy: 85,
    type: "defensive"
  },
  "Hana Hana no Mi": {
    name: "Dos Fleur",
    damage: 70,
    cooldown: 1,
    effect: "multi_hit",
    description: "Sprout additional arms for extra attacks",
    accuracy: 85,
    type: "technique"
  },
  "Supa Supa no Mi": {
    name: "Spiral Hollow",
    damage: 75,
    cooldown: 2,
    effect: "bleed_2_turns",
    description: "Turn body into spinning blades",
    accuracy: 80,
    type: "cutting"
  },
  "Toge Toge no Mi": {
    name: "Toge Toge Doping",
    damage: 68,
    cooldown: 2,
    effect: "spike_counter",
    description: "Grow spikes that damage attackers",
    accuracy: 75,
    type: "counter"
  },
  "Ori Ori no Mi": {
    name: "Iron Cage",
    damage: 62,
    cooldown: 2,
    effect: "bind_2_turns",
    description: "Create iron restraints around enemy",
    accuracy: 70,
    type: "control"
  },

  // =====================================================
  // RARE FRUITS (80-120 damage, 2-3 cooldown)
  // =====================================================
  "Mera Mera no Mi": {
    name: "Hiken (Fire Fist)",
    damage: 110,
    cooldown: 2,
    effect: "burn_3_turns",
    description: "Devastating fire punch that continues burning",
    accuracy: 85,
    type: "logia"
  },
  "Hie Hie no Mi": {
    name: "Ice Block: Pheasant Beak",
    damage: 105,
    cooldown: 3,
    effect: "freeze_2_turns",
    description: "Ice bird that freezes the target",
    accuracy: 80,
    type: "logia"
  },
  "Suna Suna no Mi": {
    name: "Desert Spada",
    damage: 100,
    cooldown: 2,
    effect: "drain_moisture",
    description: "Blade of sand that dehydrates enemy",
    accuracy: 85,
    type: "logia"
  },
  "Moku Moku no Mi": {
    name: "White Blow",
    damage: 85,
    cooldown: 2,
    effect: "blind_2_turns",
    description: "Dense smoke conceals and confuses",
    accuracy: 90,
    type: "logia"
  },
  "Goro Goro no Mi": {
    name: "El Thor",
    damage: 120,
    cooldown: 3,
    effect: "paralyze_1_turn",
    description: "Lightning pillar from the sky",
    accuracy: 95,
    type: "logia"
  },

  // =====================================================
  // EPIC FRUITS (120-160 damage, 3-4 cooldown)
  // =====================================================
  "Yami Yami no Mi": {
    name: "Black Hole",
    damage: 140,
    cooldown: 4,
    effect: "nullify_abilities",
    description: "Gravitational pull that disables powers",
    accuracy: 75,
    type: "logia"
  },
  "Gura Gura no Mi": {
    name: "Earthquake Punch",
    damage: 160,
    cooldown: 4,
    effect: "shockwave_all",
    description: "World-shaking tremor attack",
    accuracy: 80,
    type: "paramecia"
  },
  "Ope Ope no Mi": {
    name: "Room: Shambles",
    damage: 130,
    cooldown: 3,
    effect: "position_swap",
    description: "Surgical space manipulation",
    accuracy: 90,
    type: "paramecia"
  },
  "Pika Pika no Mi": {
    name: "Yasakani no Magatama",
    damage: 145,
    cooldown: 3,
    effect: "light_speed",
    description: "Light-speed projectile barrage",
    accuracy: 100,
    type: "logia"
  },
  "Magu Magu no Mi": {
    name: "Dai Funka",
    damage: 155,
    cooldown: 4,
    effect: "lava_field",
    description: "Massive magma eruption",
    accuracy: 85,
    type: "logia"
  },

  // =====================================================
  // LEGENDARY FRUITS (160-200 damage, 4-5 cooldown)
  // =====================================================
  "Nika Nika no Mi": {
    name: "Gear 5: Gigant",
    damage: 180,
    cooldown: 5,
    effect: "reality_rubber",
    description: "Rubber physics applied to everything",
    accuracy: 85,
    type: "mythical_zoan"
  },
  "Tori Tori no Mi, Model: Phoenix": {
    name: "Phoenix Brand",
    damage: 170,
    cooldown: 5,
    effect: "heal_over_time",
    description: "Blue flames that heal while burning enemies",
    accuracy: 90,
    type: "mythical_zoan"
  },
  "Uo Uo no Mi, Model: Seiryu": {
    name: "Bolo Breath",
    damage: 190,
    cooldown: 5,
    effect: "dragon_beam",
    description: "Concentrated heat beam breath",
    accuracy: 85,
    type: "mythical_zoan"
  },
  "Hito Hito no Mi, Model: Daibutsu": {
    name: "Buddha Shock",
    damage: 185,
    cooldown: 4,
    effect: "holy_damage",
    description: "Divine shockwave that purifies",
    accuracy: 90,
    type: "mythical_zoan"
  },
  "Yami Yami no Mi, Awakened": {
    name: "Infinite Darkness",
    damage: 195,
    cooldown: 5,
    effect: "void_creation",
    description: "Create areas of absolute nothingness",
    accuracy: 80,
    type: "special_logia"
  },

  // =====================================================
  // MYTHICAL FRUITS (200-240 damage, 5-6 cooldown)
  // =====================================================
  "Gomu Gomu no Mi, Awakened": {
    name: "Gear 5: Bajrang Gun",
    damage: 220,
    cooldown: 6,
    effect: "cartoon_physics",
    description: "Giant fist with toon force properties",
    accuracy: 85,
    type: "awakened_zoan"
  },
  "Gura Gura no Mi, Awakened": {
    name: "World Crack",
    damage: 230,
    cooldown: 6,
    effect: "reality_fracture",
    description: "Crack space itself with tremor power",
    accuracy: 80,
    type: "awakened_paramecia"
  },
  "Soru Soru no Mi": {
    name: "Soul Extraction",
    damage: 210,
    cooldown: 5,
    effect: "life_steal_major",
    description: "Extract and absorb enemy's soul energy",
    accuracy: 85,
    type: "paramecia"
  },
  "Toki Toki no Mi": {
    name: "Time Skip",
    damage: 200,
    cooldown: 6,
    effect: "time_manipulation",
    description: "Skip enemy's turn by sending them forward in time",
    accuracy: 90,
    type: "paramecia"
  },
  "Hobi Hobi no Mi": {
    name: "Toy Transformation",
    damage: 150,
    cooldown: 6,
    effect: "instant_win_condition",
    description: "Turn enemy into toy (instant victory if hits)",
    accuracy: 40,
    type: "paramecia"
  },

  // =====================================================
  // OMNIPOTENT FRUITS (240-280 damage, 6-7 cooldown)
  // =====================================================
  "Nika Nika no Mi, Perfect": {
    name: "Sun God's Judgment",
    damage: 260,
    cooldown: 7,
    effect: "divine_liberation",
    description: "Free everything from the constraints of physics",
    accuracy: 90,
    type: "god_tier"
  },
  "Im-sama's Power": {
    name: "World Erasure",
    damage: 270,
    cooldown: 7,
    effect: "existence_deletion",
    description: "Erase target from existence itself",
    accuracy: 85,
    type: "world_government"
  },
  "One Piece": {
    name: "Pirate King's Will",
    damage: 280,
    cooldown: 6,
    effect: "ultimate_freedom",
    description: "The power of absolute freedom",
    accuracy: 95,
    type: "legendary_treasure"
  }
};

// =====================================================
// STATUS EFFECTS SYSTEM
// =====================================================
const statusEffects = {
  // Damage over time
  "burn_3_turns": {
    type: "dot",
    damage: 15,
    duration: 3,
    description: "Fire damage over time",
    stackable: true
  },
  "bleed_2_turns": {
    type: "dot", 
    damage: 12,
    duration: 2,
    description: "Bleeding from cuts",
    stackable: true
  },
  "poison_severe": {
    type: "dot",
    damage: 20,
    duration: 3,
    description: "Severe poison damage",
    stackable: false
  },

  // Control effects
  "freeze_2_turns": {
    type: "disable",
    duration: 2,
    description: "Frozen solid, cannot act",
    preventAction: true
  },
  "bind_2_turns": {
    type: "disable", 
    duration: 2,
    description: "Bound by iron restraints",
    preventAction: true
  },
  "paralyze_1_turn": {
    type: "disable",
    duration: 1,
    description: "Paralyzed by electricity",
    preventAction: true
  },

  // Debuffs
  "blind_2_turns": {
    type: "debuff",
    duration: 2,
    description: "Accuracy reduced by 50%",
    accuracyPenalty: 50
  },
  "drain_moisture": {
    type: "debuff",
    duration: 3,
    description: "Dehydrated, damage reduced by 25%",
    damagePenalty: 25
  },

  // Defensive buffs
  "shield_medium": {
    type: "shield",
    duration: 2,
    description: "Blocks 50% of incoming damage",
    damageReduction: 50
  },
  "spike_counter": {
    type: "counter",
    duration: 2,
    description: "Reflects 25% damage back to attacker",
    reflectPercent: 25
  },

  // Special effects
  "nullify_abilities": {
    type: "special",
    duration: 1,
    description: "Cannot use devil fruit abilities",
    preventAbilities: true
  },
  "light_speed": {
    type: "special",
    duration: 1,
    description: "Cannot be dodged or blocked",
    undodgeable: true
  },
  "instant_win_condition": {
    type: "special",
    duration: 0,
    description: "If this hits, target is defeated instantly",
    instantWin: true
  }
};

// =====================================================
// DAMAGE CALCULATION SYSTEM
// =====================================================
class PvPDamageCalculator {
  static calculateDamage(ability, attackerCP, defenderCP, turn, defenderEffects = []) {
    let baseDamage = ability.damage;
    
    // CP scaling (limited to prevent one-shots)
    const cpRatio = Math.min(attackerCP / defenderCP, 2.5);
    const cpMultiplier = 0.8 + (cpRatio - 1) * 0.3; // Max 1.25x from CP
    
    // Turn 1 damage reduction (prevents early KOs)
    const turnMultiplier = turn === 1 ? 0.5 : 1.0; // 50% reduction turn 1
    
    // Accuracy check
    let accuracy = ability.accuracy || 85;
    defenderEffects.forEach(effect => {
      if (statusEffects[effect]?.accuracyPenalty) {
        accuracy -= statusEffects[effect].accuracyPenalty;
      }
    });
    
    const hitChance = Math.random() * 100;
    if (hitChance > accuracy) {
      return { damage: 0, hit: false, effect: ability.effect };
    }
    
    // Apply defender damage reduction
    let damageReduction = 1.0;
    defenderEffects.forEach(effect => {
      const statusEffect = statusEffects[effect];
      if (statusEffect?.damageReduction) {
        damageReduction *= (100 - statusEffect.damageReduction) / 100;
      }
      if (statusEffect?.damagePenalty) {
        damageReduction *= (100 - statusEffect.damagePenalty) / 100;
      }
    });
    
    // Calculate final damage
    const finalDamage = Math.floor(
      baseDamage * cpMultiplier * turnMultiplier * damageReduction
    );
    
    // Handle special effects
    if (ability.effect === "instant_win_condition" && hitChance <= ability.accuracy) {
      return { damage: 9999, hit: true, effect: ability.effect, special: "instant_win" };
    }
    
    return { 
      damage: Math.max(1, finalDamage), 
      hit: true, 
      effect: ability.effect,
      critical: hitChance <= 10 // 10% crit chance
    };
  }
  
  static calculateHealth(level, rarityMultiplier) {
    const baseHealth = 200 + (level * 15); // 200-950 HP range
    const rarityBonus = 1 + (rarityMultiplier - 1) * 0.5; // Limited rarity scaling
    return Math.floor(baseHealth * rarityBonus);
  }
}

// =====================================================
// BALANCE VALIDATION SYSTEM
// =====================================================
class BalanceValidator {
  static validateAbility(ability, rarity) {
    const issues = [];
    
    // Damage ranges by rarity
    const damageRanges = {
      common: { min: 45, max: 60 },
      uncommon: { min: 60, max: 80 },
      rare: { min: 80, max: 120 },
      epic: { min: 120, max: 160 },
      legendary: { min: 160, max: 200 },
      mythical: { min: 200, max: 240 },
      omnipotent: { min: 240, max: 280 }
    };
    
    const range = damageRanges[rarity];
    if (range && (ability.damage < range.min || ability.damage > range.max)) {
      issues.push(`Damage ${ability.damage} outside range ${range.min}-${range.max} for ${rarity}`);
    }
    
    // Cooldown scaling
    const cooldownRanges = {
      common: { min: 0, max: 1 },
      uncommon: { min: 1, max: 2 },
      rare: { min: 2, max: 3 },
      epic: { min: 3, max: 4 },
      legendary: { min: 4, max: 5 },
      mythical: { min: 5, max: 6 },
      omnipotent: { min: 6, max: 7 }
    };
    
    const coolRange = cooldownRanges[rarity];
    if (coolRange && (ability.cooldown < coolRange.min || ability.cooldown > coolRange.max)) {
      issues.push(`Cooldown ${ability.cooldown} outside range ${coolRange.min}-${coolRange.max} for ${rarity}`);
    }
    
    return {
      isBalanced: issues.length === 0,
      issues,
      powerScore: this.calculatePowerScore(ability),
      recommendation: this.getBalanceRecommendation(ability, rarity)
    };
  }
  
  static calculatePowerScore(ability) {
    let score = ability.damage;
    score += (ability.cooldown === 0) ? 20 : (7 - ability.cooldown) * 3;
    score += (ability.accuracy || 85) * 0.2;
    
    // Effect scoring
    const effectScores = {
      instant_win_condition: 100,
      reality_fracture: 50,
      void_creation: 45,
      heal_over_time: 40,
      nullify_abilities: 35,
      freeze_2_turns: 30,
      burn_3_turns: 25,
      shield_medium: 20,
      dodge_boost: 15,
      multi_hit: 10,
      stretch_range: 5
    };
    
    if (ability.effect && effectScores[ability.effect]) {
      score += effectScores[ability.effect];
    }
    
    return Math.floor(score);
  }
  
  static getBalanceRecommendation(ability, rarity) {
    const powerScore = this.calculatePowerScore(ability);
    const expectedRanges = {
      common: { min: 60, max: 90 },
      uncommon: { min: 90, max: 120 },
      rare: { min: 120, max: 180 },
      epic: { min: 180, max: 240 },
      legendary: { min: 240, max: 300 },
      mythical: { min: 300, max: 380 },
      omnipotent: { min: 380, max: 500 }
    };
    
    const range = expectedRanges[rarity];
    if (powerScore < range.min) {
      return `Underpowered for ${rarity} rarity. Consider increasing damage or adding stronger effects.`;
    } else if (powerScore > range.max) {
      return `Overpowered for ${rarity} rarity. Consider reducing damage or increasing cooldown.`;
    } else {
      return `Well balanced for ${rarity} rarity.`;
    }
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================
function getAbilityByFruitName(fruitName) {
  return balancedDevilFruitAbilities[fruitName] || null;
}

function getAbilitiesByRarity(rarity) {
  // This would need to be connected to your fruit rarity system
  return Object.entries(balancedDevilFruitAbilities).filter(([name, ability]) => {
    // You'd need to map fruit names to rarities in your existing system
    return true; // Placeholder
  });
}

function validateAllAbilities() {
  const results = {};
  const rarityMap = {}; // You'd populate this from your existing system
  
  for (const [fruitName, ability] of Object.entries(balancedDevilFruitAbilities)) {
    const rarity = rarityMap[fruitName] || 'common';
    results[fruitName] = BalanceValidator.validateAbility(ability, rarity);
  }
  
  return results;
}

module.exports = {
  balancedDevilFruitAbilities,
  statusEffects,
  PvPDamageCalculator,
  BalanceValidator,
  getAbilityByFruitName,
  getAbilitiesByRarity,
  validateAllAbilities
};
