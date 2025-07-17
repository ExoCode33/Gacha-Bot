// src/data/devil-fruit-abilities.js - Complete Devil Fruit abilities database

const devilFruitAbilities = {
  // COMMON FRUITS (85-100 damage, 0-1 cooldown)
  "Gomu Gomu no Mi": {
    name: "Rubber Pistol",
    damage: 90,
    cooldown: 0,
    effect: null,
    description: "A basic stretching punch that extends range"
  },
  "Bomb-Bomb Fruit": {
    name: "Bomb Punch",
    damage: 85,
    cooldown: 1,
    effect: null,
    description: "Explosive punch that creates small blast"
  },
  "Kilo Kilo no Mi": {
    name: "Weight Drop",
    damage: 95,
    cooldown: 0,
    effect: null,
    description: "Increase weight to crush opponents"
  },
  "Wax-Wax Fruit": {
    name: "Wax Wall",
    damage: 70,
    cooldown: 1,
    effect: "shield_1_turn",
    description: "Create protective wax barrier"
  },
  "Slip-Slip Fruit": {
    name: "Slip Surface",
    damage: 80,
    cooldown: 1,
    effect: "reduce_accuracy",
    description: "Make ground slippery, reducing accuracy"
  },

  // UNCOMMON FRUITS (100-120 damage, 1-2 cooldown)
  "Bara Bara no Mi": {
    name: "Split Apart",
    damage: 100,
    cooldown: 2,
    effect: "dodge_next",
    description: "Split body to avoid next attack"
  },
  "Sube Sube no Mi": {
    name: "Smooth Slide",
    damage: 110,
    cooldown: 1,
    effect: "counter_chance",
    description: "Slide around attacks with counter chance"
  },
  "Bomu Bomu no Mi": {
    name: "Bomb Barrage",
    damage: 115,
    cooldown: 2,
    effect: "multi_hit",
    description: "Multiple explosive attacks"
  },
  "Kuro Kuro no Mi": {
    name: "Black Hole Suction",
    damage: 105,
    cooldown: 1,
    effect: "pull_enemy",
    description: "Pull enemy closer with dark energy"
  },
  "Noro Noro no Mi": {
    name: "Slow Beam",
    damage: 90,
    cooldown: 2,
    effect: "slow_2_turns",
    description: "Slow down opponent for 2 turns"
  },

  // RARE FRUITS (120-150 damage, 2-3 cooldown)
  "Mera Mera no Mi": {
    name: "Fire Fist",
    damage: 140,
    cooldown: 2,
    effect: "burn_3_turns",
    description: "Blazing punch that burns over time"
  },
  "Hie Hie no Mi": {
    name: "Ice Age",
    damage: 130,
    cooldown: 3,
    effect: "freeze_2_turns",
    description: "Freeze opponent, skipping their turns"
  },
  "Suna Suna no Mi": {
    name: "Desert Spada",
    damage: 135,
    cooldown: 2,
    effect: "armor_break",
    description: "Sand blade that breaks through defenses"
  },
  "Moku Moku no Mi": {
    name: "Smoke Screen",
    damage: 110,
    cooldown: 2,
    effect: "blind_2_turns",
    description: "Create concealing smoke cloud"
  },
  "Goro Goro no Mi": {
    name: "El Thor",
    damage: 150,
    cooldown: 3,
    effect: "chain_lightning",
    description: "Lightning bolt that can chain to other enemies"
  },

  // EPIC FRUITS (150-180 damage, 3-4 cooldown)
  "Yami Yami no Mi": {
    name: "Black Hole",
    damage: 160,
    cooldown: 3,
    effect: "disable_abilities",
    description: "Nullify opponent's devil fruit powers"
  },
  "Gura Gura no Mi": {
    name: "Quake Punch",
    damage: 175,
    cooldown: 4,
    effect: "earthquake_aoe",
    description: "Devastating earthquake attack"
  },
  "Ope Ope no Mi": {
    name: "Room",
    damage: 150,
    cooldown: 3,
    effect: "position_control",
    description: "Create surgical space to manipulate battle"
  },
  "Nikyu Nikyu no Mi": {
    name: "Paw Repel",
    damage: 155,
    cooldown: 3,
    effect: "reflect_damage",
    description: "Repel attacks back at opponent"
  },
  "Doku Doku no Mi": {
    name: "Venom Demon",
    damage: 145,
    cooldown: 4,
    effect: "poison_strong",
    description: "Deadly poison that deals damage over time"
  },

  // LEGENDARY FRUITS (180-220 damage, 4-5 cooldown)
  "Tori Tori no Mi, Model: Phoenix": {
    name: "Phoenix Regeneration",
    damage: 180,
    cooldown: 5,
    effect: "heal_full",
    description: "Regenerate to full health with blue flames"
  },
  "Hito Hito no Mi, Model: Daibutsu": {
    name: "Buddha Shockwave",
    damage: 200,
    cooldown: 4,
    effect: "massive_knockback",
    description: "Golden shockwave that devastates enemies"
  },
  "Ryu Ryu no Mi, Model: Ancient Dragon": {
    name: "Dragon Blast",
    damage: 210,
    cooldown: 5,
    effect: "breath_attack",
    description: "Ancient dragon's devastating breath"
  },
  "Pika Pika no Mi": {
    name: "Light Speed Kick",
    damage: 190,
    cooldown: 4,
    effect: "unavoidable",
    description: "Light-speed attack that cannot be dodged"
  },
  "Magu Magu no Mi": {
    name: "Magma Fist",
    damage: 205,
    cooldown: 5,
    effect: "lava_field",
    description: "Magma attack that creates burning field"
  },

  // MYTHICAL FRUITS (220-240 damage, 5-6 cooldown)
  "Gomu Gomu no Mi, Awakened": {
    name: "Gear 5: Toon Force",
    damage: 225,
    cooldown: 6,
    effect: "reality_bend",
    description: "Bend reality like rubber, ignore physics"
  },
  "Yami Yami no Mi, Awakened": {
    name: "Infinite Darkness",
    damage: 235,
    cooldown: 6,
    effect: "void_creation",
    description: "Create void that absorbs everything"
  },
  "Gura Gura no Mi, Awakened": {
    name: "World Quake",
    damage: 240,
    cooldown: 6,
    effect: "reality_crack",
    description: "Crack reality itself with tremor power"
  },
  "Time-Time Fruit": {
    name: "Time Stop",
    damage: 220,
    cooldown: 5,
    effect: "stop_time",
    description: "Stop time for devastating combo"
  },
  "Soul-Soul Fruit": {
    name: "Soul Extraction",
    damage: 200,
    cooldown: 6,
    effect: "life_drain",
    description: "Extract opponent's soul for massive damage"
  },

  // OMNIPOTENT FRUITS (240-260 damage, 6-7 cooldown)
  "God-God Fruit": {
    name: "Divine Judgment",
    damage: 250,
    cooldown: 7,
    effect: "execute_low_hp",
    description: "Instantly defeat enemies below 30% HP"
  },
  "Reality-Reality Fruit": {
    name: "Cosmic Rewrite",
    damage: 245,
    cooldown: 6,
    effect: "rewrite_battle",
    description: "Rewrite the rules of combat itself"
  },
  "Creation-Creation Fruit": {
    name: "Universal Genesis",
    damage: 240,
    cooldown: 7,
    effect: "create_universe",
    description: "Create new battlefield with own rules"
  },
  "Void-Void Fruit": {
    name: "Absolute Annihilation",
    damage: 260,
    cooldown: 7,
    effect: "true_damage",
    description: "Damage that ignores all defenses"
  },
  "Omnipotence Fruit": {
    name: "All-Encompassing Power",
    damage: 255,
    cooldown: 6,
    effect: "omnipotent_strike",
    description: "The ultimate power that transcends all limits"
  },

  // Additional abilities for variety
  "Hana Hana no Mi": {
    name: "Flower Clone",
    damage: 100,
    cooldown: 2,
    effect: "create_decoy",
    description: "Create flower clone to confuse enemy"
  },
  "Chop-Chop Fruit": {
    name: "Blade Storm",
    damage: 125,
    cooldown: 2,
    effect: "multi_slash",
    description: "Multiple slashing attacks"
  },
  "String-String Fruit": {
    name: "Parasite",
    damage: 140,
    cooldown: 3,
    effect: "control_enemy",
    description: "Control opponent's movements"
  },
  "Gravity-Gravity Fruit": {
    name: "Gravity Well",
    damage: 165,
    cooldown: 4,
    effect: "area_pull",
    description: "Create gravitational field"
  },
  "Barrier-Barrier Fruit": {
    name: "Absolute Defense",
    damage: 80,
    cooldown: 3,
    effect: "perfect_shield",
    description: "Unbreakable barrier protection"
  },
  "Mirror-Mirror Fruit": {
    name: "Mirror World",
    damage: 130,
    cooldown: 3,
    effect: "teleport_escape",
    description: "Escape to mirror dimension"
  },
  "Biscuit-Biscuit Fruit": {
    name: "Biscuit Soldiers",
    damage: 145,
    cooldown: 4,
    effect: "summon_army",
    description: "Create army of biscuit soldiers"
  },
  "Mochi-Mochi Fruit": {
    name: "Mochi Trident",
    damage: 155,
    cooldown: 3,
    effect: "shape_weapon",
    description: "Shape mochi into deadly weapons"
  },
  "Castle-Castle Fruit": {
    name: "Fortress Mode",
    damage: 120,
    cooldown: 4,
    effect: "defensive_stance",
    description: "Transform into impenetrable fortress"
  },
  "Jacket-Jacket Fruit": {
    name: "Perfect Fusion",
    damage: 110,
    cooldown: 2,
    effect: "stat_boost",
    description: "Fuse with ally for combined power"
  }
};

// Status effects descriptions
const statusEffects = {
  "shield_1_turn": "Blocks next attack",
  "dodge_next": "Avoids next attack completely",
  "counter_chance": "30% chance to counter attack",
  "multi_hit": "Attacks multiple times",
  "pull_enemy": "Pulls enemy closer",
  "slow_2_turns": "Reduces enemy speed for 2 turns",
  "burn_3_turns": "Deals fire damage over 3 turns",
  "freeze_2_turns": "Freezes enemy for 2 turns",
  "armor_break": "Ignores enemy defense",
  "blind_2_turns": "Reduces enemy accuracy for 2 turns",
  "chain_lightning": "Can hit multiple enemies",
  "disable_abilities": "Prevents enemy from using abilities",
  "earthquake_aoe": "Damages all enemies in area",
  "position_control": "Can manipulate battlefield",
  "reflect_damage": "Reflects 50% of damage back",
  "poison_strong": "Strong poison damage over time",
  "heal_full": "Restores to full health",
  "massive_knockback": "Pushes enemies away",
  "breath_attack": "Wide-area breath attack",
  "unavoidable": "Cannot be dodged or blocked",
  "lava_field": "Creates damaging lava field",
  "reality_bend": "Ignores normal physics",
  "void_creation": "Creates area of nothingness",
  "reality_crack": "Damages reality itself",
  "stop_time": "Stops time for extra turns",
  "life_drain": "Absorbs enemy's life force",
  "execute_low_hp": "Instant kill if HP < 30%",
  "rewrite_battle": "Changes battle conditions",
  "create_universe": "Creates new battlefield",
  "true_damage": "Ignores all defenses",
  "omnipotent_strike": "Transcends all limitations"
};

// Utility functions
function getAbilityByName(abilityName) {
  return Object.values(devilFruitAbilities).find(ability => 
    ability.name.toLowerCase() === abilityName.toLowerCase()
  );
}

function getAbilitiesByDamageRange(minDamage, maxDamage) {
  return Object.entries(devilFruitAbilities).filter(([fruitName, ability]) => 
    ability.damage >= minDamage && ability.damage <= maxDamage
  );
}

function getAbilitiesByEffect(effect) {
  return Object.entries(devilFruitAbilities).filter(([fruitName, ability]) => 
    ability.effect === effect
  );
}

function getRandomAbility() {
  const abilities = Object.entries(devilFruitAbilities);
  const randomIndex = Math.floor(Math.random() * abilities.length);
  return abilities[randomIndex];
}

module.exports = {
  devilFruitAbilities,
  statusEffects,
  getAbilityByName,
  getAbilitiesByDamageRange,
  getAbilitiesByEffect,
  getRandomAbility
};
