// src/data/balanced-devil-fruit-abilities.js - 149 Canonical Devil Fruits with Balanced PvP Abilities

const balancedDevilFruitAbilities = {
  // =====================================================
  // COMMON FRUITS (30-60 damage, 0-1 cooldown)
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
  "Doru Doru no Mi": {
    name: "Candle Wall",
    damage: 52,
    cooldown: 1,
    effect: "shield_small",
    description: "Create hardened wax barriers",
    accuracy: 85,
    type: "defensive"
  },
  "Bane Bane no Mi": {
    name: "Spring Hopper",
    damage: 48,
    cooldown: 0,
    effect: "mobility_boost",
    description: "Spring legs provide extra mobility",
    accuracy: 90,
    type: "physical"
  },
  "Supa Supa no Mi": {
    name: "Spiral Hollow",
    damage: 55,
    cooldown: 1,
    effect: "bleed_2_turns",
    description: "Turn body into spinning blades",
    accuracy: 80,
    type: "cutting"
  },
  "Toge Toge no Mi": {
    name: "Toge Toge Doping",
    damage: 50,
    cooldown: 1,
    effect: "spike_counter",
    description: "Grow spikes that damage attackers",
    accuracy: 75,
    type: "counter"
  },
  "Ori Ori no Mi": {
    name: "Iron Cage",
    damage: 45,
    cooldown: 1,
    effect: "bind_1_turn",
    description: "Create iron restraints around enemy",
    accuracy: 70,
    type: "control"
  },
  "Baku Baku no Mi": {
    name: "Munch Munch Chomp",
    damage: 52,
    cooldown: 1,
    effect: "devour_small",
    description: "Eat and transform into eaten objects",
    accuracy: 75,
    type: "transformation"
  },
  "Mane Mane no Mi": {
    name: "Clone Strike",
    damage: 48,
    cooldown: 0,
    effect: "copy_appearance",
    description: "Copy enemy's appearance to confuse",
    accuracy: 85,
    type: "illusion"
  },
  "Hana Hana no Mi": {
    name: "Dos Fleur",
    damage: 50,
    cooldown: 0,
    effect: "multi_hit",
    description: "Sprout additional arms for extra attacks",
    accuracy: 85,
    type: "technique"
  },
  "Shari Shari no Mi": {
    name: "Wheel Spin Attack",
    damage: 46,
    cooldown: 0,
    effect: "spin_damage",
    description: "Transform limbs into spinning wheels",
    accuracy: 80,
    type: "physical"
  },
  "Beri Beri no Mi": {
    name: "Berry Scatter",
    damage: 42,
    cooldown: 1,
    effect: "split_dodge",
    description: "Split into berries to avoid damage",
    accuracy: 85,
    type: "evasion"
  },
  "Sabi Sabi no Mi": {
    name: "Rust Touch",
    damage: 40,
    cooldown: 1,
    effect: "rust_weapons",
    description: "Rust and corrode metal objects",
    accuracy: 90,
    type: "corrosion"
  },
  "Shabon Shabon no Mi": {
    name: "Soap Bubble Trap",
    damage: 44,
    cooldown: 1,
    effect: "slippery_field",
    description: "Create slippery soap bubbles",
    accuracy: 75,
    type: "utility"
  },
  "Awa Awa no Mi": {
    name: "Bubble Master",
    damage: 46,
    cooldown: 1,
    effect: "clean_debuff",
    description: "Wash away enemy's strength with bubbles",
    accuracy: 80,
    type: "debuff"
  },
  "Goe Goe no Mi": {
    name: "Sound Blast",
    damage: 54,
    cooldown: 1,
    effect: "sonic_stun",
    description: "Powerful voice creates sonic attacks",
    accuracy: 85,
    type: "sonic"
  },
  "Hiso Hiso no Mi": {
    name: "Animal Command",
    damage: 38,
    cooldown: 0,
    effect: "animal_ally",
    description: "Communicate with and command animals",
    accuracy: 90,
    type: "summoning"
  },
  "Kama Kama no Mi": {
    name: "Sickle Wind",
    damage: 56,
    cooldown: 1,
    effect: "wind_slice",
    description: "Create cutting wind with fingernails",
    accuracy: 80,
    type: "cutting"
  },
  "Kachi Kachi no Mi": {
    name: "Heat Explosion",
    damage: 58,
    cooldown: 1,
    effect: "heat_buildup",
    description: "Body becomes burning hot on impact",
    accuracy: 75,
    type: "fire"
  },
  "Nemu Nemu no Mi": {
    name: "Sleep Spore",
    damage: 35,
    cooldown: 1,
    effect: "sleep_1_turn",
    description: "Release spores that induce sleep",
    accuracy: 85,
    type: "status"
  },
  "Mini Mini no Mi": {
    name: "Tiny Strike",
    damage: 42,
    cooldown: 0,
    effect: "size_reduction",
    description: "Shrink to become harder to hit",
    accuracy: 95,
    type: "evasion"
  },

  // =====================================================
  // UNCOMMON FRUITS (60-80 damage, 1-2 cooldown)
  // =====================================================
  "Horo Horo no Mi": {
    name: "Negative Hollow",
    damage: 65,
    cooldown: 2,
    effect: "negative_debuff",
    description: "Ghosts drain enemy's fighting spirit",
    accuracy: 85,
    type: "psychological"
  },
  "Suke Suke no Mi": {
    name: "Invisible Strike",
    damage: 70,
    cooldown: 2,
    effect: "invisibility",
    description: "Attack while completely invisible",
    accuracy: 95,
    type: "stealth"
  },
  "Nikyu Nikyu no Mi": {
    name: "Paw Impact",
    damage: 78,
    cooldown: 2,
    effect: "repel_damage",
    description: "Repel anything including damage itself",
    accuracy: 85,
    type: "defensive"
  },
  "Mero Mero no Mi": {
    name: "Love Love Beam",
    damage: 68,
    cooldown: 2,
    effect: "petrify_1_turn",
    description: "Turn lustful enemies to stone",
    accuracy: 80,
    type: "petrification"
  },
  "Doa Doa no Mi": {
    name: "Door Surprise",
    damage: 62,
    cooldown: 1,
    effect: "teleport_strike",
    description: "Create doors anywhere for surprise attacks",
    accuracy: 90,
    type: "spatial"
  },
  "Kage Kage no Mi": {
    name: "Shadow Revolution",
    damage: 72,
    cooldown: 2,
    effect: "shadow_steal",
    description: "Manipulate and steal shadows",
    accuracy: 85,
    type: "shadow"
  },
  "Horu Horu no Mi": {
    name: "Hormone Manipulation",
    damage: 64,
    cooldown: 2,
    effect: "stat_change",
    description: "Control hormones to alter abilities",
    accuracy: 90,
    type: "transformation"
  },
  "Choki Choki no Mi": {
    name: "Scissor Slice",
    damage: 74,
    cooldown: 2,
    effect: "cut_anything",
    description: "Cut through any material like paper",
    accuracy: 85,
    type: "cutting"
  },
  "Yomi Yomi no Mi": {
    name: "Soul Parade",
    damage: 66,
    cooldown: 2,
    effect: "soul_chill",
    description: "Soul power chills enemies to the bone",
    accuracy: 80,
    type: "soul"
  },
  "Kuma Kuma no Mi": {
    name: "Bear Claw Swipe",
    damage: 76,
    cooldown: 1,
    effect: "claw_bleed",
    description: "Powerful bear claws cause bleeding",
    accuracy: 85,
    type: "zoan_physical"
  },
  "Ushi Ushi no Mi, Model: Bison": {
    name: "Bison Charge",
    damage: 78,
    cooldown: 2,
    effect: "charge_stun",
    description: "Massive charging attack",
    accuracy: 80,
    type: "zoan_physical"
  },
  "Hito Hito no Mi": {
    name: "Human Intelligence",
    damage: 60,
    cooldown: 1,
    effect: "strategy_boost",
    description: "Enhanced intelligence improves combat",
    accuracy: 95,
    type: "zoan_mental"
  },
  "Tori Tori no Mi, Model: Falcon": {
    name: "Falcon Dive",
    damage: 72,
    cooldown: 2,
    effect: "aerial_advantage",
    description: "High-speed diving attack from above",
    accuracy: 90,
    type: "zoan_aerial"
  },
  "Mogu Mogu no Mi": {
    name: "Underground Ambush",
    damage: 68,
    cooldown: 2,
    effect: "underground_strike",
    description: "Attack from underground tunnels",
    accuracy: 85,
    type: "zoan_utility"
  },
  "Inu Inu no Mi, Model: Dachshund": {
    name: "Launcher Attack",
    damage: 64,
    cooldown: 1,
    effect: "ranged_strike",
    description: "Transform into bazooka for ranged attack",
    accuracy: 90,
    type: "zoan_special"
  },
  "Inu Inu no Mi, Model: Jackal": {
    name: "Desert Fang",
    damage: 70,
    cooldown: 2,
    effect: "sand_blind",
    description: "Jackal fangs with sand manipulation",
    accuracy: 85,
    type: "zoan_elemental"
  },
  "Tori Tori no Mi, Model: Eagle": {
    name: "Eagle Talon Grip",
    damage: 74,
    cooldown: 2,
    effect: "talon_grab",
    description: "Powerful eagle talons grip and crush",
    accuracy: 85,
    type: "zoan_aerial"
  },
  "Saru Saru no Mi": {
    name: "Monkey Agility",
    damage: 66,
    cooldown: 1,
    effect: "agility_boost",
    description: "Enhanced agility and acrobatics",
    accuracy: 95,
    type: "zoan_agility"
  },
  "Uma Uma no Mi": {
    name: "Galloping Kick",
    damage: 76,
    cooldown: 2,
    effect: "speed_strike",
    description: "High-speed horse kick",
    accuracy: 85,
    type: "zoan_physical"
  },
  "Neko Neko no Mi, Model: Leopard": {
    name: "Leopard Pounce",
    damage: 78,
    cooldown: 2,
    effect: "stealth_pounce",
    description: "Stealthy leopard attack",
    accuracy: 90,
    type: "zoan_stealth"
  },
  "Zou Zou no Mi": {
    name: "Elephant Stomp",
    damage: 80,
    cooldown: 2,
    effect: "ground_shake",
    description: "Massive elephant stomp creates shockwaves",
    accuracy: 75,
    type: "zoan_physical"
  },
  "Inu Inu no Mi, Model: Wolf": {
    name: "Wolf Pack Strike",
    damage: 72,
    cooldown: 2,
    effect: "pack_bonus",
    description: "Wolf instincts enhance combat",
    accuracy: 85,
    type: "zoan_pack"
  },
  "Neko Neko no Mi, Model: Saber Tiger": {
    name: "Saber Fang",
    damage: 76,
    cooldown: 2,
    effect: "piercing_fang",
    description: "Saber-tooth fangs pierce armor",
    accuracy: 85,
    type: "zoan_physical"
  },
  "Batto Batto no Mi, Model: Vampire": {
    name: "Vampire Drain",
    damage: 68,
    cooldown: 2,
    effect: "life_steal",
    description: "Drain enemy's life force",
    accuracy: 80,
    type: "zoan_drain"
  },
  "Kumo Kumo no Mi, Model: Rosamygale Grauvogeli": {
    name: "Ancient Web",
    damage: 74,
    cooldown: 2,
    effect: "web_trap",
    description: "Ancient spider web traps enemies",
    accuracy: 85,
    type: "ancient_zoan"
  },
  "Ryu Ryu no Mi, Model: Spinosaurus": {
    name: "Spino Sail Slash",
    damage: 78,
    cooldown: 2,
    effect: "sail_slice",
    description: "Back sail creates powerful wind slashes",
    accuracy: 80,
    type: "ancient_zoan"
  },
  "Ryu Ryu no Mi, Model: Pteranodon": {
    name: "Aerial Crash",
    damage: 76,
    cooldown: 2,
    effect: "dive_bomb",
    description: "High-speed pteranodon dive attack",
    accuracy: 85,
    type: "ancient_zoan"
  },
  "Ryu Ryu no Mi, Model: Brachiosaurus": {
    name: "Long Neck Slam",
    damage: 80,
    cooldown: 2,
    effect: "neck_whip",
    description: "Massive neck creates devastating attacks",
    accuracy: 75,
    type: "ancient_zoan"
  },
  "Ryu Ryu no Mi, Model: Allosaurus": {
    name: "Apex Predator Bite",
    damage: 78,
    cooldown: 2,
    effect: "predator_instinct",
    description: "Ancient predator's devastating bite",
    accuracy: 85,
    type: "ancient_zoan"
  },
  "Ryu Ryu no Mi, Model: Triceratops": {
    name: "Horn Drill",
    damage: 82,
    cooldown: 2,
    effect: "horn_pierce",
    description: "Triple horn drilling attack",
    accuracy: 80,
    type: "ancient_zoan"
  },
  "Zou Zou no Mi, Model: Mammoth": {
    name: "Mammoth Tusk Strike",
    damage: 84,
    cooldown: 2,
    effect: "tusk_charge",
    description: "Massive mammoth tusk charge",
    accuracy: 75,
    type: "ancient_zoan"
  },
  "Ryu Ryu no Mi, Model: Pachycephalosaurus": {
    name: "Skull Bash",
    damage: 80,
    cooldown: 2,
    effect: "head_trauma",
    description: "Thick skull creates powerful headbutt",
    accuracy: 85,
    type: "ancient_zoan"
  },
  "Neko Neko no Mi, Model: Smilodon": {
    name: "Saber Tooth Rampage",
    damage: 78,
    cooldown: 2,
    effect: "ancient_fury",
    description: "Ancient saber-tooth cat's fury",
    accuracy: 85,
    type: "ancient_zoan"
  },
  "Inu Inu no Mi, Model: Kyubi no Kitsune": {
    name: "Nine-Tail Illusion",
    damage: 75,
    cooldown: 2,
    effect: "illusion_strike",
    description: "Nine tails create confusing illusions",
    accuracy: 90,
    type: "mythical_zoan"
  },
  "Sara Sara no Mi, Model: Axolotl": {
    name: "Regeneration Burst",
    damage: 65,
    cooldown: 2,
    effect: "regenerate_hp",
    description: "Axolotl regeneration heals wounds",
    accuracy: 85,
    type: "zoan_special"
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
    effect: "smoke_blind",
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
  "Numa Numa no Mi": {
    name: "Swamp Prison",
    damage: 90,
    cooldown: 3,
    effect: "swamp_trap",
    description: "Trap enemies in bottomless swamp",
    accuracy: 80,
    type: "logia"
  },
  "Gasu Gasu no Mi": {
    name: "Gastille",
    damage: 95,
    cooldown: 2,
    effect: "poison_gas",
    description: "Poisonous gas cloud attack",
    accuracy: 85,
    type: "logia"
  },
  "Yuki Yuki no Mi": {
    name: "Snow Storm",
    damage: 88,
    cooldown: 2,
    effect: "snow_blind",
    description: "Blinding snowstorm reduces visibility",
    accuracy: 80,
    type: "logia"
  },
  "Beta Beta no Mi": {
    name: "Sticky Trap",
    damage: 82,
    cooldown: 3,
    effect: "sticky_bind",
    description: "Mochi-like stickiness traps enemies",
    accuracy: 85,
    type: "special_paramecia"
  },
  "Noro Noro no Mi": {
    name: "Slow Photon",
    damage: 75,
    cooldown: 3,
    effect: "slow_3_turns",
    description: "Photons slow enemy movement drastically",
    accuracy: 90,
    type: "paramecia"
  },
  "Doku Doku no Mi": {
    name: "Venom Demon",
    damage: 100,
    cooldown: 3,
    effect: "poison_severe",
    description: "Deadly venom causes severe poisoning",
    accuracy: 85,
    type: "paramecia"
  },
  "Hobi Hobi no Mi": {
    name: "Toy Transformation",
    damage: 60,
    cooldown: 4,
    effect: "toy_transform",
    description: "Turn enemy into harmless toy",
    accuracy: 40,
    type: "paramecia"
  },
  "Bari Bari no Mi": {
    name: "Barrier Crash",
    damage: 95,
    cooldown: 3,
    effect: "barrier_reflect",
    description: "Unbreakable barriers reflect attacks",
    accuracy: 85,
    type: "paramecia"
  },
  "Nui Nui no Mi": {
    name: "Stitch Bind",
    damage: 85,
    cooldown: 2,
    effect: "stitch_disable",
    description: "Stitch enemies to surfaces",
    accuracy: 80,
    type: "paramecia"
  },
  "Gura Gura no Mi": {
    name: "Earthquake Punch",
    damage: 115,
    cooldown: 3,
    effect: "quake_shockwave",
    description: "World-shaking tremor attack",
    accuracy: 80,
    type: "paramecia"
  },
  "Yami Yami no Mi": {
    name: "Black Hole",
    damage: 110,
    cooldown: 3,
    effect: "darkness_pull",
    description: "Gravitational pull disables powers",
    accuracy: 75,
    type: "logia"
  },
  "Kira Kira no Mi": {
    name: "Diamond Jozu",
    damage: 105,
    cooldown: 3,
    effect: "diamond_armor",
    description: "Diamond body provides ultimate defense",
    accuracy: 80,
    type: "paramecia"
  },
  "Sabi Sabi no Mi": {
    name: "Rust Everything",
    damage: 80,
    cooldown: 2,
    effect: "rust_corrosion",
    description: "Rust corrodes weapons and armor",
    accuracy: 90,
    type: "paramecia"
  },
  "Ito Ito no Mi": {
    name: "Overheat",
    damage: 108,
    cooldown: 3,
    effect: "string_control",
    description: "Razor-sharp strings slice through anything",
    accuracy: 85,
    type: "paramecia"
  },
  "Zushi Zushi no Mi": {
    name: "Gravity Blade",
    damage: 112,
    cooldown: 3,
    effect: "gravity_crush",
    description: "Gravity pulls enemies down helplessly",
    accuracy: 85,
    type: "paramecia"
  },

  // =====================================================
  // EPIC FRUITS (120-160 damage, 3-4 cooldown)
  // =====================================================
  "Pika Pika no Mi": {
    name: "Yasakani no Magatama",
    damage: 145,
    cooldown: 3,
    effect: "light_speed_barrage",
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
  "Ope Ope no Mi": {
    name: "Room: Shambles",
    damage: 130,
    cooldown: 3,
    effect: "spatial_surgery",
    description: "Surgical space manipulation",
    accuracy: 90,
    type: "paramecia"
  },
  "Nikyu Nikyu no Mi, Awakened": {
    name: "Ursus Shock",
    damage: 140,
    cooldown: 4,
    effect: "paw_shockwave",
    description: "Compressed air creates devastating explosion",
    accuracy: 85,
    type: "paramecia"
  },
  "Mochi Mochi no Mi": {
    name: "Zan Giri Mochi",
    damage: 135,
    cooldown: 3,
    effect: "mochi_trap",
    description: "Special paramecia mochi binding",
    accuracy: 85,
    type: "special_paramecia"
  },
  "Memo Memo no Mi": {
    name: "Memory Wipe",
    damage: 120,
    cooldown: 4,
    effect: "memory_loss",
    description: "Extract and manipulate memories",
    accuracy: 80,
    type: "paramecia"
  },
  "Bisu Bisu no Mi": {
    name: "Biscuit Soldier",
    damage: 138,
    cooldown: 3,
    effect: "biscuit_armor",
    description: "Create infinite biscuit soldiers",
    accuracy: 85,
    type: "paramecia"
  },
  "Pero Pero no Mi": {
    name: "Candy Wall",
    damage: 125,
    cooldown: 3,
    effect: "candy_bind",
    description: "Syrup candy traps and hardens",
    accuracy: 80,
    type: "paramecia"
  },
  "Soru Soru no Mi": {
    name: "Soul Extraction",
    damage: 150,
    cooldown: 4,
    effect: "soul_steal",
    description: "Extract and manipulate souls",
    accuracy: 85,
    type: "paramecia"
  },
  "Mira Mira no Mi": {
    name: "Mirror World",
    damage: 132,
    cooldown: 3,
    effect: "mirror_dimension",
    description: "Attack from mirror dimension",
    accuracy: 90,
    type: "paramecia"
  },
  "Hoya Hoya no Mi": {
    name: "Genie Lamp",
    damage: 128,
    cooldown: 4,
    effect: "wish_fulfillment",
    description: "Grant twisted wishes with a price",
    accuracy: 85,
    type: "paramecia"
  },
  "Netsu Netsu no Mi": {
    name: "Heat Wave",
    damage: 142,
    cooldown: 3,
    effect: "heat_aura",
    description: "Extreme heat melts everything",
    accuracy: 85,
    type: "paramecia"
  },
  "Kuku Kuku no Mi": {
    name: "Cook Cook Feast",
    damage: 122,
    cooldown: 3,
    effect: "cooking_boost",
    description: "Food-based attacks provide buffs",
    accuracy: 90,
    type: "paramecia"
  },
  "Gocha Gocha no Mi": {
    name: "Mech Assembly",
    damage: 148,
    cooldown: 4,
    effect: "machine_fusion",
    description: "Fuse with machines for enhanced power",
    accuracy: 80,
    type: "paramecia"
  },
  "Oshi Oshi no Mi": {
    name: "Push Everything",
    damage: 136,
    cooldown: 3,
    effect: "force_push",
    description: "Push anything with tremendous force",
    accuracy: 85,
    type: "paramecia"
  },

  // =====================================================
  // LEGENDARY FRUITS (160-200 damage, 4-5 cooldown)
  // =====================================================
  "Hito Hito no Mi, Model: Nika": {
    name: "Gear 5: Liberation",
    damage: 180,
    cooldown: 5,
    effect: "reality_rubber",
    description: "Sun God's power liberates everything",
    accuracy: 85,
    type: "mythical_zoan"
  },
  "Tori Tori no Mi, Model: Phoenix": {
    name: "Phoenix Brand",
    damage: 170,
    cooldown: 5,
    effect: "regeneration_flames",
    description: "Blue flames heal while burning enemies",
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
    name: "Buddha Impact",
    damage: 185,
    cooldown: 4,
    effect: "shockwave_purify",
    description: "Divine shockwave that purifies",
    accuracy: 90,
    type: "mythical_zoan"
  },
  "Hebi Hebi no Mi, Model: Yamata-no-Orochi": {
    name: "Eight-Headed Strike",
    damage: 175,
    cooldown: 5,
    effect: "multi_head_attack",
    description: "Eight serpent heads attack simultaneously",
    accuracy: 85,
    type: "mythical_zoan"
  },
  "Inu Inu no Mi, Model: Okuchi no Makami": {
    name: "Wolf God Howl",
    damage: 165,
    cooldown: 4,
    effect: "divine_howl",
    description: "Sacred wolf's howl freezes enemies",
    accuracy: 90,
    type: "mythical_zoan"
  },
  "Toki Toki no Mi": {
    name: "Time Skip",
    damage: 160,
    cooldown: 6,
    effect: "time_leap",
    description: "Send yourself or others through time",
    accuracy: 95,
    type: "paramecia"
  },
  "Yami Yami no Mi, Awakened": {
    name: "Liberation",
    damage: 195,
    cooldown: 5,
    effect: "darkness_liberation",
    description: "Free everything from the constraints of light",
    accuracy: 80,
    type: "special_logia"
  },
  "Gura Gura no Mi, Awakened": {
    name: "World Ender",
    damage: 200,
    cooldown: 6,
    effect: "reality_crack",
    description: "Crack the very fabric of reality",
    accuracy: 80,
    type: "awakened_paramecia"
  },
  "Ope Ope no Mi, Ultimate": {
    name: "Perennial Youth Surgery",
    damage: 180,
    cooldown: 7,
    effect: "immortality_grant",
    description: "Grant eternal youth at the cost of user's life",
    accuracy: 100,
    type: "ultimate_paramecia"
  },

  // =====================================================
  // MYTHICAL FRUITS (200-240 damage, 5-6 cooldown)
  // =====================================================
  "Hito Hito no Mi, Model: Nika, Awakened": {
    name: "Bajrang Gun",
    damage: 220,
    cooldown: 6,
    effect: "cartoon_physics",
    description: "Giant fist with toon force properties",
    accuracy: 85,
    type: "awakened_mythical_zoan"
  },
  "Yami Yami no Mi + Gura Gura no Mi": {
    name: "Kurouzu",
    damage: 230,
    cooldown: 6,
    effect: "dual_fruit_mastery",
    description: "Darkness and quakes combined",
    accuracy: 80,
    type: "dual_fruit"
  },
  "Soru Soru no Mi, Awakened": {
    name: "Soul King",
    damage: 210,
    cooldown: 5,
    effect: "mass_soul_control",
    description: "Control souls on a massive scale",
    accuracy: 85,
    type: "awakened_paramecia"
  },
  "Magu Magu no Mi, Awakened": {
    name: "Volcanic Apocalypse",
    damage: 225,
    cooldown: 6,
    effect: "magma_field_permanent",
    description: "Turn entire battlefield into magma",
    accuracy: 85,
    type: "awakened_logia"
  },
  "Pika Pika no Mi, Awakened": {
    name: "Light Speed Dimension",
    damage: 215,
    cooldown: 5,
    effect: "light_dimension",
    description: "Attack at the speed of light from all angles",
    accuracy: 100,
    type: "awakened_logia"
  },
  "Goro Goro no Mi, Awakened": {
    name: "Raigo",
    damage: 235,
    cooldown: 6,
    effect: "divine_judgment",
    description: "Godly lightning that judges all",
    accuracy: 95,
    type: "awakened_logia"
  },
  "Hobi Hobi no Mi, Awakened": {
    name: "Toy World",
    damage: 200,
    cooldown: 6,
    effect: "reality_toys",
    description: "Turn entire reality into a toy world",
    accuracy: 60,
    type: "awakened_paramecia"
  },

  // =====================================================
  // OMNIPOTENT FRUITS (240-300 damage, 6-7 cooldown)
  // =====================================================
  "Hito Hito no Mi, Model: Nika, Perfect": {
    name: "Sun God's Dawn",
    damage: 280,
    cooldown: 7,
    effect: "divine_liberation",
    description: "Liberate everything from all constraints",
    accuracy: 90,
    type: "perfect_mythical_zoan"
  },
  "Im-sama's Power": {
    name: "World Erasure",
    damage: 290,
    cooldown: 7,
    effect: "existence_deletion",
    description: "Erase islands and people from existence",
    accuracy: 85,
    type: "world_sovereign"
  },
  "Joy Boy's Will": {
    name: "Liberation Drum",
    damage: 270,
    cooldown: 6,
    effect: "ultimate_freedom",
    description: "Drums of liberation free all from oppression",
    accuracy: 95,
    type: "ancient_will"
  },
  "One Piece": {
    name: "Pirate King's Dream",
    damage: 300,
    cooldown: 7,
    effect: "dream_realization",
    description: "The ultimate treasure that makes dreams reality",
    accuracy: 100,
    type: "legendary_treasure"
  },
  "Void Century Weapon": {
    name: "Ancient Destruction",
    damage: 260,
    cooldown: 6,
    effect: "civilization_ender",
    description: "Power that ended the Void Century",
    accuracy: 90,
    type: "ancient_weapon"
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
  "poison_gas": {
    type: "dot",
    damage: 18,
    duration: 2,
    description: "Poisonous gas affecting lungs",
    stackable: true
  },

  // Control effects
  "freeze_2_turns": {
    type: "disable",
    duration: 2,
    description: "Frozen solid, cannot act",
    preventAction: true
  },
  "bind_1_turn": {
    type: "disable", 
    duration: 1,
    description: "Bound and cannot move",
    preventAction: true
  },
  "paralyze_1_turn": {
    type: "disable",
    duration: 1,
    description: "Paralyzed by electricity",
    preventAction: true
  },
  "petrify_1_turn": {
    type: "disable",
    duration: 1,
    description: "Turned to stone by love",
    preventAction: true
  },
  "sleep_1_turn": {
    type: "disable",
    duration: 1,
    description: "Sleeping deeply",
    preventAction: true
  },
  "toy_transform": {
    type: "disable",
    duration: 2,
    description: "Transformed into a harmless toy",
    preventAction: true
  },

  // Debuffs
  "smoke_blind": {
    type: "debuff",
    duration: 2,
    description: "Blinded by smoke, accuracy reduced by 40%",
    accuracyPenalty: 40
  },
  "snow_blind": {
    type: "debuff",
    duration: 2,
    description: "Blinded by snow, accuracy reduced by 35%",
    accuracyPenalty: 35
  },
  "drain_moisture": {
    type: "debuff",
    duration: 3,
    description: "Dehydrated, damage reduced by 25%",
    damagePenalty: 25
  },
  "slow_3_turns": {
    type: "debuff",
    duration: 3,
    description: "Movement slowed, cannot dodge",
    preventDodge: true
  },
  "negative_debuff": {
    type: "debuff",
    duration: 2,
    description: "Negative thoughts reduce fighting spirit",
    damagePenalty: 30
  },

  // Defensive effects
  "shield_small": {
    type: "shield",
    duration: 2,
    description: "Blocks 30% of incoming damage",
    damageReduction: 30
  },
  "barrier_reflect": {
    type: "shield",
    duration: 2,
    description: "Reflects 25% damage back to attacker",
    reflectPercent: 25,
    damageReduction: 50
  },
  "diamond_armor": {
    type: "shield",
    duration: 3,
    description: "Diamond hardness blocks 60% damage",
    damageReduction: 60
  },
  "spike_counter": {
    type: "counter",
    duration: 2,
    description: "Spikes damage attackers for 15 damage",
    counterDamage: 15
  },

  // Special effects
  "darkness_pull": {
    type: "special",
    duration: 1,
    description: "Pulled into darkness, cannot use devil fruit abilities",
    preventAbilities: true
  },
  "light_speed_barrage": {
    type: "special",
    duration: 0,
    description: "Light speed attack cannot be dodged",
    undodgeable: true
  },
  "reality_rubber": {
    type: "special",
    duration: 2,
    description: "Rubber physics applied to battlefield",
    specialMechanic: "bounce_attacks"
  },
  "cartoon_physics": {
    type: "special",
    duration: 2,
    description: "Toon force bends reality",
    specialMechanic: "ignore_logic"
  },
  "time_leap": {
    type: "special",
    duration: 0,
    description: "Skip enemy's next turn",
    skipTurn: true
  },
  "soul_steal": {
    type: "special",
    duration: 0,
    description: "Steal portion of enemy's life force",
    lifeDrain: 50
  },
  "spatial_surgery": {
    type: "special",
    duration: 0,
    description: "Rearrange enemy's body parts",
    bodyManipulation: true
  },
  "divine_liberation": {
    type: "ultimate",
    duration: 0,
    description: "Free everything from all constraints",
    removeAllEffects: true,
    maximumDamage: true
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
    
    // Turn-based damage reduction (prevents early KOs)
    let turnMultiplier = 1.0;
    if (turn === 1) turnMultiplier = 0.5; // 50% reduction turn 1
    else if (turn === 2) turnMultiplier = 0.7; // 30% reduction turn 2
    else if (turn === 3) turnMultiplier = 0.85; // 15% reduction turn 3
    // Turn 4+ = full damage
    
    // Accuracy check
    let accuracy = ability.accuracy || 85;
    defenderEffects.forEach(effect => {
      if (statusEffects[effect]?.accuracyPenalty) {
        accuracy -= statusEffects[effect].accuracyPenalty;
      }
    });
    
    // Special undodgeable effects
    const undodgeable = defenderEffects.some(effect => 
      statusEffects[effect]?.undodgeable || ability.effect === "light_speed_barrage"
    );
    
    const hitChance = Math.random() * 100;
    if (!undodgeable && hitChance > accuracy) {
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
    let finalDamage = Math.floor(
      baseDamage * cpMultiplier * turnMultiplier * damageReduction
    );
    
    // Handle special ultimate effects
    if (ability.effect === "divine_liberation" || ability.effect === "dream_realization") {
      finalDamage = Math.floor(finalDamage * 1.5); // 50% bonus for ultimate attacks
    }
    
    // Minimum damage
    finalDamage = Math.max(5, finalDamage);
    
    return { 
      damage: finalDamage, 
      hit: true, 
      effect: ability.effect,
      critical: hitChance <= 10, // 10% crit chance
      turnMultiplier: turnMultiplier
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
      common: { min: 30, max: 60 },
      uncommon: { min: 60, max: 80 },
      rare: { min: 80, max: 120 },
      epic: { min: 120, max: 160 },
      legendary: { min: 160, max: 200 },
      mythical: { min: 200, max: 240 },
      omnipotent: { min: 240, max: 300 }
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
      divine_liberation: 100,
      dream_realization: 100,
      reality_crack: 80,
      existence_deletion: 90,
      cartoon_physics: 70,
      soul_steal: 60,
      time_leap: 55,
      toy_transform: 65,
      freeze_2_turns: 30,
      burn_3_turns: 25,
      barrier_reflect: 35,
      diamond_armor: 40,
      light_speed_barrage: 45,
      dragon_beam: 35,
      reality_rubber: 50
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
  // This connects to your fruit rarity system
  return Object.entries(balancedDevilFruitAbilities).filter(([name, ability]) => {
    // Map based on damage ranges
    if (rarity === 'common' && ability.damage >= 30 && ability.damage <= 60) return true;
    if (rarity === 'uncommon' && ability.damage >= 60 && ability.damage <= 80) return true;
    if (rarity === 'rare' && ability.damage >= 80 && ability.damage <= 120) return true;
    if (rarity === 'epic' && ability.damage >= 120 && ability.damage <= 160) return true;
    if (rarity === 'legendary' && ability.damage >= 160 && ability.damage <= 200) return true;
    if (rarity === 'mythical' && ability.damage >= 200 && ability.damage <= 240) return true;
    if (rarity === 'omnipotent' && ability.damage >= 240 && ability.damage <= 300) return true;
    return false;
  });
}

function validateAllAbilities() {
  const results = {};
  
  // Map fruit names to rarities based on damage
  for (const [fruitName, ability] of Object.entries(balancedDevilFruitAbilities)) {
    let rarity = 'common';
    if (ability.damage >= 240) rarity = 'omnipotent';
    else if (ability.damage >= 200) rarity = 'mythical';
    else if (ability.damage >= 160) rarity = 'legendary';
    else if (ability.damage >= 120) rarity = 'epic';
    else if (ability.damage >= 80) rarity = 'rare';
    else if (ability.damage >= 60) rarity = 'uncommon';
    
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
