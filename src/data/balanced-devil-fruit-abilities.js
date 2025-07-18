// src/data/balanced-devil-fruit-abilities.js - 128 Devil Fruits with Balanced PvP Abilities

const balancedDevilFruitAbilities = {
  // =====================================================
  // COMMON FRUITS (45-60 damage, 0-1 cooldown)
  // =====================================================
  "Mushi Mushi no Mi, Model: Suzumebachi": {
    name: "Hornet Sting",
    damage: 60,
    cooldown: 1,
    effect: "poison_light",
    description: "Venomous hornet sting that inflicts light poison",
    accuracy: 85,
    type: "physical"
  },
  "Sara Sara no Mi, Model: Axolotl": {
    name: "Regeneration",
    damage: 59,
    cooldown: 1,
    effect: "heal_self",
    description: "Axolotl regeneration heals minor wounds",
    accuracy: 90,
    type: "healing"
  },
  "Batto Batto no Mi, Model: Vampire": {
    name: "Vampire Bite",
    damage: 58,
    cooldown: 1,
    effect: "life_drain",
    description: "Vampire fangs drain enemy's life force",
    accuracy: 80,
    type: "drain"
  },
  "Tama Tama no Mi": {
    name: "Egg Shell Shield",
    damage: 57,
    cooldown: 0,
    effect: "shell_armor",
    description: "Hard egg shell provides temporary protection",
    accuracy: 85,
    type: "defensive"
  },
  "Mogu Mogu no Mi": {
    name: "Underground Strike",
    damage: 56,
    cooldown: 1,
    effect: "underground_dodge",
    description: "Attack from underground tunnels",
    accuracy: 80,
    type: "stealth"
  },
  "Inu Inu no Mi, Model: Tanuki": {
    name: "Tanuki Trickery",
    damage: 55,
    cooldown: 1,
    effect: "illusion_minor",
    description: "Tanuki shapeshifting creates minor illusions",
    accuracy: 85,
    type: "illusion"
  },
  "Inu Inu no Mi, Model: Dachshund": {
    name: "Launcher Attack",
    damage: 54,
    cooldown: 0,
    effect: "ranged_strike",
    description: "Transform into bazooka for ranged attack",
    accuracy: 90,
    type: "ranged"
  },
  "Neko Neko no Mi, Model: Saber Tiger": {
    name: "Saber Fang",
    damage: 53,
    cooldown: 1,
    effect: "bleed_light",
    description: "Saber-tooth fangs cause bleeding",
    accuracy: 85,
    type: "physical"
  },
  "Inu Inu no Mi, Model: Jackal": {
    name: "Desert Fang",
    damage: 52,
    cooldown: 1,
    effect: "sand_blind",
    description: "Jackal fangs with sand manipulation",
    accuracy: 80,
    type: "elemental"
  },
  "Uma Uma no Mi": {
    name: "Galloping Kick",
    damage: 51,
    cooldown: 0,
    effect: "speed_boost",
    description: "High-speed horse kick",
    accuracy: 85,
    type: "physical"
  },
  "Ushi Ushi no Mi, Model: Giraffe": {
    name: "Long Neck Slam",
    damage: 50,
    cooldown: 1,
    effect: "reach_advantage",
    description: "Extended neck provides reach advantage",
    accuracy: 80,
    type: "physical"
  },
  "Neko Neko no Mi, Model: Leopard": {
    name: "Leopard Pounce",
    damage: 49,
    cooldown: 1,
    effect: "stealth_attack",
    description: "Stealthy leopard attack",
    accuracy: 90,
    type: "stealth"
  },
  "Inu Inu no Mi, Model: Wolf": {
    name: "Wolf Pack Strike",
    damage: 48,
    cooldown: 1,
    effect: "pack_instinct",
    description: "Wolf instincts enhance combat",
    accuracy: 85,
    type: "instinct"
  },
  "Zou Zou no Mi": {
    name: "Elephant Stomp",
    damage: 47,
    cooldown: 1,
    effect: "ground_shake",
    description: "Massive elephant stomp creates tremors",
    accuracy: 75,
    type: "physical"
  },
  "Tori Tori no Mi, Model: Falcon": {
    name: "Falcon Dive",
    damage: 46,
    cooldown: 0,
    effect: "aerial_advantage",
    description: "High-speed diving attack from above",
    accuracy: 90,
    type: "aerial"
  },
  "Hito Hito no Mi": {
    name: "Human Intelligence",
    damage: 45,
    cooldown: 0,
    effect: "strategy_boost",
    description: "Enhanced intelligence improves tactics",
    accuracy: 95,
    type: "mental"
  },
  "Ushi Ushi no Mi, Model: Bison": {
    name: "Bison Charge",
    damage: 46,
    cooldown: 1,
    effect: "charge_stun",
    description: "Massive charging attack",
    accuracy: 80,
    type: "physical"
  },
  "Mushi Mushi no Mi, Model: Kabuto": {
    name: "Beetle Horn",
    damage: 47,
    cooldown: 1,
    effect: "horn_pierce",
    description: "Rhinoceros beetle horn pierces armor",
    accuracy: 85,
    type: "physical"
  },
  "Kame Kame no Mi": {
    name: "Shell Defense",
    damage: 48,
    cooldown: 1,
    effect: "turtle_shell",
    description: "Turtle shell provides strong defense",
    accuracy: 70,
    type: "defensive"
  },
  "Tori Tori no Mi, Model: Eagle": {
    name: "Eagle Talon",
    damage: 49,
    cooldown: 1,
    effect: "talon_grip",
    description: "Eagle talons grip and crush",
    accuracy: 85,
    type: "aerial"
  },
  "Susu Susu no Mi": {
    name: "Soot Cloud",
    damage: 45,
    cooldown: 0,
    effect: "smoke_screen",
    description: "Create concealing soot clouds",
    accuracy: 75,
    type: "utility"
  },
  "Shibo Shibo no Mi": {
    name: "Liquid Drain",
    damage: 46,
    cooldown: 1,
    effect: "dehydrate",
    description: "Extract moisture from enemy",
    accuracy: 80,
    type: "drain"
  },
  "Nagi Nagi no Mi": {
    name: "Silent Strike",
    damage: 47,
    cooldown: 1,
    effect: "silence_area",
    description: "Attack in complete silence",
    accuracy: 85,
    type: "stealth"
  },
  "Chiyu Chiyu no Mi": {
    name: "Healing Touch",
    damage: 48,
    cooldown: 1,
    effect: "heal_wounds",
    description: "Heal injuries and restore vitality",
    accuracy: 90,
    type: "healing"
  },
  "Memo Memo no Mi": {
    name: "Memory Wipe",
    damage: 49,
    cooldown: 1,
    effect: "confuse_minor",
    description: "Temporarily confuse enemy's memories",
    accuracy: 85,
    type: "mental"
  },

  // =====================================================
  // UNCOMMON FRUITS (60-80 damage, 1-2 cooldown)
  // =====================================================
  "Sube Sube no Mi": {
    name: "Slip Away",
    damage: 80,
    cooldown: 2,
    effect: "dodge_boost",
    description: "Slippery skin deflects attacks",
    accuracy: 90,
    type: "evasion"
  },
  "Supa Supa no Mi": {
    name: "Blade Storm",
    damage: 79,
    cooldown: 2,
    effect: "multi_cut",
    description: "Multiple blade attacks from body",
    accuracy: 85,
    type: "cutting"
  },
  "Toge Toge no Mi": {
    name: "Spike Barrier",
    damage: 78,
    cooldown: 2,
    effect: "spike_counter",
    description: "Spikes damage anyone who attacks",
    accuracy: 80,
    type: "counter"
  },
  "Ori Ori no Mi": {
    name: "Iron Cage",
    damage: 77,
    cooldown: 2,
    effect: "bind_1_turn",
    description: "Create iron restraints around enemy",
    accuracy: 75,
    type: "control"
  },
  "Bane Bane no Mi": {
    name: "Spring Launcher",
    damage: 76,
    cooldown: 1,
    effect: "bounce_attack",
    description: "Spring-powered bouncing attacks",
    accuracy: 85,
    type: "physical"
  },
  "Noro Noro no Mi": {
    name: "Slow Photon",
    damage: 75,
    cooldown: 2,
    effect: "slow_2_turns",
    description: "Photons drastically slow enemy movement",
    accuracy: 90,
    type: "control"
  },
  "Doa Doa no Mi": {
    name: "Door Surprise",
    damage: 74,
    cooldown: 2,
    effect: "teleport_strike",
    description: "Attack through dimensional doors",
    accuracy: 85,
    type: "spatial"
  },
  "Awa Awa no Mi": {
    name: "Bubble Trap",
    damage: 73,
    cooldown: 2,
    effect: "clean_debuff",
    description: "Soap bubbles wash away strength",
    accuracy: 80,
    type: "debuff"
  },
  "Beta Beta no Mi": {
    name: "Sticky Prison",
    damage: 72,
    cooldown: 2,
    effect: "sticky_bind",
    description: "Trap enemies in sticky mucus",
    accuracy: 85,
    type: "control"
  },
  "Bari Bari no Mi": {
    name: "Barrier Crash",
    damage: 71,
    cooldown: 2,
    effect: "barrier_reflect",
    description: "Unbreakable barriers reflect attacks",
    accuracy: 90,
    type: "defensive"
  },
  "Nui Nui no Mi": {
    name: "Stitch Bind",
    damage: 70,
    cooldown: 2,
    effect: "stitch_disable",
    description: "Stitch enemies to prevent movement",
    accuracy: 85,
    type: "control"
  },
  "Buku Buku no Mi": {
    name: "Book Prison",
    damage: 69,
    cooldown: 2,
    effect: "book_trap",
    description: "Trap enemies inside book worlds",
    accuracy: 80,
    type: "spatial"
  },
  "Pero Pero no Mi": {
    name: "Candy Wall",
    damage: 68,
    cooldown: 2,
    effect: "candy_bind",
    description: "Hardened candy traps enemies",
    accuracy: 85,
    type: "control"
  },
  "Bisu Bisu no Mi": {
    name: "Biscuit Soldier",
    damage: 67,
    cooldown: 2,
    effect: "armor_summon",
    description: "Create protective biscuit armor",
    accuracy: 90,
    type: "summoning"
  },
  "Kuri Kuri no Mi": {
    name: "Cream Burst",
    damage: 66,
    cooldown: 1,
    effect: "cream_blind",
    description: "Explosive cream blast blinds enemies",
    accuracy: 85,
    type: "area"
  },
  "Mira Mira no Mi": {
    name: "Mirror World",
    damage: 65,
    cooldown: 2,
    effect: "mirror_dimension",
    description: "Attack from mirror dimension",
    accuracy: 90,
    type: "dimensional"
  },
  "Maki Maki no Mi": {
    name: "Scroll Technique",
    damage: 64,
    cooldown: 2,
    effect: "scroll_store",
    description: "Store and release attacks from scrolls",
    accuracy: 85,
    type: "storage"
  },
  "Oshi Oshi no Mi": {
    name: "Earth Push",
    damage: 63,
    cooldown: 2,
    effect: "ground_reshape",
    description: "Push and reshape the battlefield",
    accuracy: 80,
    type: "terrain"
  },
  "Fuku Fuku no Mi": {
    name: "Disguise Master",
    damage: 62,
    cooldown: 1,
    effect: "disguise_boost",
    description: "Perfect disguises confuse enemies",
    accuracy: 85,
    type: "illusion"
  },
  "Juku Juku no Mi": {
    name: "Rapid Aging",
    damage: 61,
    cooldown: 2,
    effect: "age_decay",
    description: "Accelerate aging to weaken enemies",
    accuracy: 80,
    type: "decay"
  },
  "Ryu Ryu no Mi, Model: Spinosaurus": {
    name: "Sail Slash",
    damage: 60,
    cooldown: 2,
    effect: "water_boost",
    description: "Back sail creates powerful attacks",
    accuracy: 85,
    type: "ancient"
  },
  "Ryu Ryu no Mi, Model: Pteranodon": {
    name: "Aerial Crash",
    damage: 61,
    cooldown: 2,
    effect: "dive_bomb",
    description: "High-speed pteranodon dive attack",
    accuracy: 90,
    type: "ancient"
  },
  "Ryu Ryu no Mi, Model: Brachiosaurus": {
    name: "Long Neck Smash",
    damage: 62,
    cooldown: 2,
    effect: "reach_smash",
    description: "Massive neck creates devastating reach",
    accuracy: 80,
    type: "ancient"
  },
  "Ryu Ryu no Mi, Model: Allosaurus": {
    name: "Predator Bite",
    damage: 63,
    cooldown: 2,
    effect: "predator_instinct",
    description: "Ancient predator's hunting instincts",
    accuracy: 85,
    type: "ancient"
  },
  "Ryu Ryu no Mi, Model: Triceratops": {
    name: "Triple Horn Drill",
    damage: 64,
    cooldown: 2,
    effect: "horn_pierce",
    description: "Three-horned drilling charge attack",
    accuracy: 80,
    type: "ancient"
  },

  // =====================================================
  // RARE FRUITS (80-120 damage, 2-3 cooldown)
  // =====================================================
  "Bara Bara no Mi": {
    name: "Bara Bara Festival",
    damage: 120,
    cooldown: 3,
    effect: "immune_slash",
    description: "Split body parts attack independently",
    accuracy: 85,
    type: "separation"
  },
  "Bomu Bomu no Mi": {
    name: "Explosive Barrage",
    damage: 119,
    cooldown: 3,
    effect: "area_explosion",
    description: "Multiple explosive body parts detonate",
    accuracy: 80,
    type: "explosive"
  },
  "Kilo Kilo no Mi": {
    name: "10,000 Kilo Press",
    damage: 118,
    cooldown: 3,
    effect: "weight_crush",
    description: "Massive weight crushes through defenses",
    accuracy: 75,
    type: "weight"
  },
  "Doru Doru no Mi": {
    name: "Candle Champion",
    damage: 117,
    cooldown: 3,
    effect: "wax_armor",
    description: "Create hardened wax constructs",
    accuracy: 85,
    type: "creation"
  },
  "Baku Baku no Mi": {
    name: "Munch Munch Factory",
    damage: 116,
    cooldown: 3,
    effect: "transform_eaten",
    description: "Transform into combination of eaten objects",
    accuracy: 80,
    type: "transformation"
  },
  "Mane Mane no Mi": {
    name: "Perfect Clone",
    damage: 115,
    cooldown: 2,
    effect: "copy_abilities",
    description: "Copy enemy's appearance and basic abilities",
    accuracy: 90,
    type: "mimicry"
  },
  "Shari Shari no Mi": {
    name: "Wheel Cannon",
    damage: 114,
    cooldown: 3,
    effect: "spinning_force",
    description: "High-speed spinning wheel attacks",
    accuracy: 85,
    type: "rotation"
  },
  "Beri Beri no Mi": {
    name: "Berry Scatter Shot",
    damage: 113,
    cooldown: 2,
    effect: "split_dodge",
    description: "Split into berries to confuse and attack",
    accuracy: 85,
    type: "separation"
  },
  "Sabi Sabi no Mi": {
    name: "Rust Everything",
    damage: 112,
    cooldown: 3,
    effect: "rust_weapons",
    description: "Rust and corrode all metal equipment",
    accuracy: 90,
    type: "corrosion"
  },
  "Shabon Shabon no Mi": {
    name: "Soap Sheep",
    damage: 111,
    cooldown: 3,
    effect: "strength_wash",
    description: "Soap sheep wash away enemy power",
    accuracy: 85,
    type: "debuff"
  },
  "Suke Suke no Mi": {
    name: "Invisible Assault",
    damage: 110,
    cooldown: 3,
    effect: "invisibility",
    description: "Attack while completely invisible",
    accuracy: 95,
    type: "stealth"
  },
  "Kama Kama no Mi": {
    name: "Wind Sickle Barrage",
    damage: 109,
    cooldown: 2,
    effect: "wind_cut",
    description: "Multiple cutting wind attacks",
    accuracy: 85,
    type: "wind"
  },
  "Horo Horo no Mi": {
    name: "Negative Hollow",
    damage: 108,
    cooldown: 3,
    effect: "negative_depression",
    description: "Ghosts drain fighting spirit completely",
    accuracy: 90,
    type: "psychological"
  },
  "Yomi Yomi no Mi": {
    name: "Soul Parade",
    damage: 107,
    cooldown: 3,
    effect: "soul_chill",
    description: "Soul power freezes enemies to the bone",
    accuracy: 85,
    type: "soul"
  },
  "Kage Kage no Mi": {
    name: "Shadow Revolution",
    damage: 106,
    cooldown: 3,
    effect: "shadow_army",
    description: "Command army of shadow zombies",
    accuracy: 80,
    type: "shadow"
  },
  "Horu Horu no Mi": {
    name: "Emporio Face Growth",
    damage: 105,
    cooldown: 3,
    effect: "stat_manipulation",
    description: "Hormone injection alters enemy abilities",
    accuracy: 85,
    type: "biological"
  },
  "Choki Choki no Mi": {
    name: "Scissor Dimension",
    damage: 104,
    cooldown: 3,
    effect: "cut_reality",
    description: "Cut through anything like paper",
    accuracy: 90,
    type: "cutting"
  },
  "Fuwa Fuwa no Mi": {
    name: "Float Mastery",
    damage: 103,
    cooldown: 3,
    effect: "levitation_control",
    description: "Control gravity of all objects in area",
    accuracy: 85,
    type: "gravity"
  },
  "Mero Mero no Mi": {
    name: "Love Love Beam",
    damage: 102,
    cooldown: 3,
    effect: "petrify_2_turns",
    description: "Turn lustful enemies to stone",
    accuracy: 80,
    type: "petrification"
  },
  "Doku Doku no Mi": {
    name: "Venom Demon",
    damage: 101,
    cooldown: 3,
    effect: "poison_deadly",
    description: "Deadly multi-layered poison attack",
    accuracy: 85,
    type: "poison"
  },
  "Hobi Hobi no Mi": {
    name: "Toy Transformation",
    damage: 100,
    cooldown: 4,
    effect: "toy_convert",
    description: "Turn enemy into harmless toy",
    accuracy: 60,
    type: "transformation"
  },
  "Hoya Hoya no Mi": {
    name: "Genie's Wish",
    damage: 99,
    cooldown: 3,
    effect: "wish_twist",
    description: "Grant twisted wishes with consequences",
    accuracy: 85,
    type: "reality"
  },
  "Netsu Netsu no Mi": {
    name: "Heat Wave",
    damage: 98,
    cooldown: 3,
    effect: "extreme_heat",
    description: "Intense heat melts everything around",
    accuracy: 80,
    type: "heat"
  },
  "Zushi Zushi no Mi": {
    name: "Gravity Blade",
    damage: 97,
    cooldown: 3,
    effect: "gravity_crush",
    description: "Gravity pulls enemies helplessly down",
    accuracy: 85,
    type: "gravity"
  },
  "Iba Iba no Mi": {
    name: "Thorn Garden",
    damage: 80,
    cooldown: 2,
    effect: "thorn_field",
    description: "Create field of damaging thorns",
    accuracy: 85,
    type: "plant"
  },

  // =====================================================
  // EPIC FRUITS (120-160 damage, 3-4 cooldown)
  // =====================================================
  "Hana Hana no Mi": {
    name: "Mil Fleur Gigantesco",
    damage: 160,
    cooldown: 4,
    effect: "giant_limbs",
    description: "Sprout giant limbs for massive attacks",
    accuracy: 85,
    type: "gigantification"
  },
  "Kira Kira no Mi": {
    name: "Diamond Jozu",
    damage: 159,
    cooldown: 4,
    effect: "diamond_armor",
    description: "Diamond body provides ultimate defense",
    accuracy: 80,
    type: "hardness"
  },
  "Goe Goe no Mi": {
    name: "Destructive Voice",
    damage: 158,
    cooldown: 3,
    effect: "sonic_destruction",
    description: "Voice destroys everything in its path",
    accuracy: 85,
    type: "sound"
  },
  "Kachi Kachi no Mi": {
    name: "Molten Armor",
    damage: 157,
    cooldown: 4,
    effect: "heat_armor",
    description: "Body becomes burning hot and hard",
    accuracy: 80,
    type: "heat"
  },
  "Nemu Nemu no Mi": {
    name: "Dream Spores",
    damage: 156,
    cooldown: 4,
    effect: "sleep_3_turns",
    description: "Powerful spores induce deep sleep",
    accuracy: 85,
    type: "sleep"
  },
  "Mini Mini no Mi": {
    name: "Microscopic Strike",
    damage: 155,
    cooldown: 3,
    effect: "size_advantage",
    description: "Shrink to avoid attacks and strike vitals",
    accuracy: 95,
    type: "size"
  },
  "Atsu Atsu no Mi": {
    name: "10,000 Degree Heat",
    damage: 154,
    cooldown: 4,
    effect: "extreme_temperature",
    description: "Generate temperatures that melt steel",
    accuracy: 80,
    type: "heat"
  },
  "Hiso Hiso no Mi": {
    name: "Animal Army",
    damage: 153,
    cooldown: 4,
    effect: "animal_command",
    description: "Command all nearby animals to attack",
    accuracy: 85,
    type: "summoning"
  },
  "Noko Noko no Mi": {
    name: "Toxic Spore Cloud",
    damage: 152,
    cooldown: 3,
    effect: "poison_cloud",
    description: "Release cloud of various toxic spores",
    accuracy: 80,
    type: "poison"
  },
  "Ami Ami no Mi": {
    name: "Net Dimension",
    damage: 151,
    cooldown: 4,
    effect: "net_prison",
    description: "Create inescapable net constructs",
    accuracy: 85,
    type: "binding"
  },
  "Kopi Kopi no Mi": {
    name: "Perfect Copy",
    damage: 150,
    cooldown: 4,
    effect: "ability_copy",
    description: "Copy and use enemy's exact abilities",
    accuracy: 90,
    type: "mimicry"
  },
  "Modo Modo no Mi": {
    name: "Moa Moa 100x",
    damage: 149,
    cooldown: 4,
    effect: "size_speed_boost",
    description: "Increase size and speed by 100 times",
    accuracy: 85,
    type: "amplification"
  },
  "Mosa Mosa no Mi": {
    name: "Forest Genesis",
    damage: 148,
    cooldown: 4,
    effect: "plant_control",
    description: "Create and control entire forest",
    accuracy: 80,
    type: "nature"
  },
  "Gasu Gasu no Mi": {
    name: "Gastille",
    damage: 147,
    cooldown: 3,
    effect: "poison_gas",
    description: "Poisonous gas cloud suffocates enemies",
    accuracy: 85,
    type: "logia"
  },
  "Yuki Yuki no Mi": {
    name: "Blizzard Storm",
    damage: 146,
    cooldown: 3,
    effect: "freeze_field",
    description: "Create blinding blizzard that freezes all",
    accuracy: 80,
    type: "logia"
  },
  "Numa Numa no Mi": {
    name: "Swamp Prison",
    damage: 145,
    cooldown: 3,
    effect: "swamp_sink",
    description: "Trap enemies in bottomless swamp",
    accuracy: 80,
    type: "logia"
  },
  "Moku Moku no Mi": {
    name: "White Blow",
    damage: 144,
    cooldown: 3,
    effect: "smoke_blind",
    description: "Dense smoke blinds and confuses",
    accuracy: 85,
    type: "logia"
  },
  "Suna Suna no Mi": {
    name: "Desert Spada",
    damage: 143,
    cooldown: 3,
    effect: "dehydration",
    description: "Sand blade drains all moisture",
    accuracy: 85,
    type: "logia"
  },
  "Hie Hie no Mi": {
    name: "Ice Block: Pheasant Beak",
    damage: 142,
    cooldown: 3,
    effect: "freeze_3_turns",
    description: "Ice bird freezes enemies solid",
    accuracy: 80,
    type: "logia"
  },
  "Mera Mera no Mi": {
    name: "Hiken (Fire Fist)",
    damage: 141,
    cooldown: 3,
    effect: "burn_4_turns",
    description: "Devastating fire punch burns continuously",
    accuracy: 85,
    type: "logia"
  },
  "Goro Goro no Mi": {
    name: "El Thor",
    damage: 140,
    cooldown: 3,
    effect: "lightning_stun",
    description: "Lightning pillar paralyzes enemies",
    accuracy: 95,
    type: "logia"
  },
  "Peto Peto no Mi": {
    name: "Pet Master",
    damage: 139,
    cooldown: 4,
    effect: "pet_control",
    description: "Control and command all pets and animals",
    accuracy: 85,
    type: "control"
  },
  "Gunyo Gunyo no Mi": {
    name: "Slime Prison",
    damage: 120,
    cooldown: 3,
    effect: "slime_bind",
    description: "Trap enemies in acidic slime",
    accuracy: 80,
    type: "binding"
  },

  // =====================================================
  // MYTHICAL FRUITS (200-240 damage, 5-6 cooldown)
  // =====================================================
  "Kage Kage no Mi": {
    name: "Shadow Revolution",
    damage: 240,
    cooldown: 6,
    effect: "shadow_dominion",
    description: "Control all shadows in vast area",
    accuracy: 85,
    type: "shadow"
  },
  "Nikyu Nikyu no Mi": {
    name: "Ursus Shock",
    damage: 239,
    cooldown: 6,
    effect: "paw_shockwave",
    description: "Compressed air creates devastating explosion",
    accuracy: 85,
    type: "force"
  },
  "Hobi Hobi no Mi": {
    name: "Toy World",
    damage: 238,
    cooldown: 6,
    effect: "mass_toy_transform",
    description: "Turn entire battlefield into toys",
    accuracy: 70,
    type: "reality"
  },
  "Ito Ito no Mi": {
    name: "Overheat",
    damage: 237,
    cooldown: 6,
    effect: "string_control",
    description: "Razor strings control everything",
    accuracy: 85,
    type: "control"
  },
  "Ope Ope no Mi": {
    name: "Room: Shambles",
    damage: 236,
    cooldown: 5,
    effect: "spatial_surgery",
    description: "Surgical manipulation of space itself",
    accuracy: 90,
    type: "spatial"
  },
  "Mochi Mochi no Mi": {
    name: "Zan Giri Mochi",
    damage: 235,
    cooldown: 5,
    effect: "mochi_mastery",
    description: "Perfect mochi control and prediction",
    accuracy: 95,
    type: "special_paramecia"
  },
  "Pika Pika no Mi": {
    name: "Yasakani no Magatama",
    damage: 234,
    cooldown: 5,
    effect: "light_speed_barrage",
    description: "Light-speed projectile barrage",
    accuracy: 100,
    type: "logia"
  },
  "Magu Magu no Mi": {
    name: "Dai Funka",
    damage: 233,
    cooldown: 6,
    effect: "volcanic_eruption",
    description: "Massive magma eruption destroys all",
    accuracy: 85,
    type: "logia"
  },
  "Tori Tori no Mi, Model: Phoenix": {
    name: "Phoenix Brand",
    damage: 232,
    cooldown: 5,
    effect: "regeneration_flames",
    description: "Blue flames heal while burning enemies",
    accuracy: 90,
    type: "mythical_zoan"
  },
  "Hito Hito no Mi, Model: Daibutsu": {
    name: "Buddha Impact",
    damage: 231,
    cooldown: 5,
    effect: "divine_shockwave",
    description: "Divine shockwave purifies everything",
    accuracy: 90,
    type: "mythical_zoan"
  },
  "Hebi Hebi no Mi, Model: Yamata-no-Orochi": {
    name: "Eight-Headed Strike",
    damage: 230,
    cooldown: 6,
    effect: "multi_head_attack",
    description: "Eight serpent heads attack simultaneously",
    accuracy: 85,
    type: "mythical_zoan"
  },
  "Inu Inu no Mi, Model: Okuchi no Makami": {
    name: "Divine Wolf Howl",
    damage: 229,
    cooldown: 5,
    effect: "ice_howl",
    description: "Sacred wolf's howl freezes souls",
    accuracy: 90,
    type: "mythical_zoan"
  },
  "Inu Inu no Mi, Model: Kyubi no Kitsune": {
    name: "Nine-Tail Illusion",
    damage: 228,
    cooldown: 6,
    effect: "reality_illusion",
    description: "Nine tails bend reality with illusions",
    accuracy: 85,
    type: "mythical_zoan"
  },
  "Zou Zou no Mi, Model: Mammoth": {
    name: "Ancient Mammoth Charge",
    damage: 227,
    cooldown: 6,
    effect: "prehistoric_might",
    description: "Ancient mammoth's unstoppable charge",
    accuracy: 80,
    type: "ancient_zoan"
  },
  "Mori Mori no Mi": {
    name: "Forest World",
    damage: 200,
    cooldown: 5,
    effect: "nature_dominion",
    description: "Transform area into vast forest",
    accuracy: 85,
    type: "logia"
  },

  // =====================================================
  // LEGENDARY FRUITS (160-200 damage, 4-5 cooldown)
  // =====================================================
  "Soru Soru no Mi": {
    name: "Soul Extraction",
    damage: 200,
    cooldown: 5,
    effect: "soul_steal",
    description: "Extract and manipulate enemy souls",
    accuracy: 85,
    type: "soul"
  },
  "Gomu Gomu no Mi": {
    name: "Gear 4: Boundman",
    damage: 199,
    cooldown: 5,
    effect: "rubber_boost",
    description: "Enhanced rubber abilities with Haki",
    accuracy: 85,
    type: "awakening"
  },
  "Toki Toki no Mi": {
    name: "Time Skip",
    damage: 198,
    cooldown: 6,
    effect: "time_leap",
    description: "Send attacks through time",
    accuracy: 95,
    type: "time"
  },
  "Uo Uo no Mi, Model: Seiryu": {
    name: "Bolo Breath",
    damage: 197,
    cooldown: 5,
    effect: "dragon_breath",
    description: "Concentrated heat beam breath",
    accuracy: 85,
    type: "mythical_zoan"
  },
  "Ryu Ryu no Mi, Model: Kirin": {
    name: "Lightning Blessing",
    damage: 196,
    cooldown: 4,
    effect: "divine_lightning",
    description: "Sacred Kirin's lightning blessing",
    accuracy: 90,
    type: "mythical_zoan"
  },
  "Wara Wara no Mi": {
    name: "Straw Voodoo",
    damage: 195,
    cooldown: 5,
    effect: "damage_redirect",
    description: "Redirect all damage through voodoo dolls",
    accuracy: 85,
    type: "voodoo"
  },
  "Ura Ura no Mi": {
    name: "Dimensional Warp",
    damage: 194,
    cooldown: 4,
    effect: "teleport_mastery",
    description: "Instantly teleport attacks across space",
    accuracy: 90,
    type: "spatial"
  },
  "Shima Shima no Mi": {
    name: "Island Control",
    damage: 160,
    cooldown: 4,
    effect: "terrain_mastery",
    description: "Control entire island's terrain",
    accuracy: 85,
    type: "environmental"
  },

  // =====================================================
  // DIVINE FRUITS (240-280 damage, 6-7 cooldown)
  // =====================================================
  "Gura Gura no Mi": {
    name: "World Ender",
    damage: 280,
    cooldown: 7,
    effect: "reality_crack",
    description: "Crack the very fabric of reality",
    accuracy: 85,
    type: "world_destroyer"
  },
  "Hito Hito no Mi, Model: Nika": {
    name: "Gear 5: Liberation",
    damage: 265,
    cooldown: 6,
    effect: "cartoon_physics",
    description: "Sun God's power bends all reality",
    accuracy: 90,
    type: "divine_zoan"
  },
  "Yami Yami no Mi": {
    name: "Kurouzu",
    damage: 240,
    cooldown: 6,
    effect: "darkness_void",
    description: "Infinite darkness consumes everything",
    accuracy: 80,
    type: "ultimate_logia"
  }
};

// Status effects system
const statusEffects = {
  // Damage over time
  "poison_light": {
    type: "dot",
    damage: 8,
    duration: 2,
    description: "Light poison damage over time"
  },
  "poison_deadly": {
    type: "dot",
    damage: 25,
    duration: 3,
    description: "Deadly poison that spreads"
  },
  "burn_4_turns": {
    type: "dot",
    damage: 20,
    duration: 4,
    description: "Intense fire damage over time"
  },
  "bleed_light": {
    type: "dot",
    damage: 10,
    duration: 2,
    description: "Light bleeding from cuts"
  },

  // Control effects
  "bind_1_turn": {
    type: "disable",
    duration: 1,
    description: "Bound and cannot move",
    preventAction: true
  },
  "freeze_3_turns": {
    type: "disable",
    duration: 3,
    description: "Frozen solid, cannot act",
    preventAction: true
  },
  "sleep_3_turns": {
    type: "disable",
    duration: 3,
    description: "Deep sleep, completely helpless",
    preventAction: true
  },
  "petrify_2_turns": {
    type: "disable",
    duration: 2,
    description: "Turned to stone by love",
    preventAction: true
  },
  "toy_convert": {
    type: "disable",
    duration: 3,
    description: "Transformed into a toy",
    preventAction: true
  },

  // Debuffs
  "slow_2_turns": {
    type: "debuff",
    duration: 2,
    description: "Movement drastically slowed",
    speedReduction: 80
  },
  "negative_depression": {
    type: "debuff",
    duration: 2,
    description: "Overwhelmed by negative thoughts",
    damagePenalty: 50
  },
  "dehydration": {
    type: "debuff",
    duration: 3,
    description: "Severely dehydrated",
    damagePenalty: 30
  },

  // Defensive effects
  "diamond_armor": {
    type: "shield",
    duration: 3,
    description: "Diamond hardness blocks 70% damage",
    damageReduction: 70
  },
  "barrier_reflect": {
    type: "shield",
    duration: 2,
    description: "Reflects 50% damage back to attacker",
    reflectPercent: 50,
    damageReduction: 40
  },
  "wax_armor": {
    type: "shield",
    duration: 2,
    description: "Hardened wax blocks 40% damage",
    damageReduction: 40
  },

  // Special effects
  "reality_crack": {
    type: "ultimate",
    duration: 0,
    description: "Cracks reality itself for maximum damage",
    maximumDamage: true
  },
  "cartoon_physics": {
    type: "special",
    duration: 2,
    description: "Toon force bends reality",
    specialMechanic: "ignore_logic"
  },
  "darkness_void": {
    type: "special",
    duration: 1,
    description: "Nullifies all devil fruit abilities",
    preventAbilities: true
  },
  "time_leap": {
    type: "special",
    duration: 0,
    description: "Skip enemy's next turn",
    skipTurn: true
  }
};

// PvP Damage Calculator
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
    
    // Accuracy check
    let accuracy = ability.accuracy || 85;
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
    });
    
    // Calculate final damage
    let finalDamage = Math.floor(
      baseDamage * cpMultiplier * turnMultiplier * damageReduction
    );
    
    // Handle ultimate effects
    if (ability.effect === "reality_crack" || ability.effect === "cartoon_physics") {
      finalDamage = Math.floor(finalDamage * 1.5);
    }
    
    // Minimum damage
    finalDamage = Math.max(5, finalDamage);
    
    return { 
      damage: finalDamage, 
      hit: true, 
      effect: ability.effect,
      critical: hitChance <= 10
    };
  }
  
  static calculateHealth(level, rarityMultiplier) {
    const baseHealth = 200 + (level * 15);
    const rarityBonus = 1 + (rarityMultiplier - 1) * 0.5;
    return Math.floor(baseHealth * rarityBonus);
  }
}

// Utility functions
function getAbilityByFruitName(fruitName) {
  return balancedDevilFruitAbilities[fruitName] || null;
}

function getAbilitiesByRarity(rarity) {
  const damageRanges = {
    'common': { min: 45, max: 60 },
    'uncommon': { min: 60, max: 80 },
    'rare': { min: 80, max: 120 },
    'epic': { min: 120, max: 160 },
    'legendary': { min: 160, max: 200 },
    'mythical': { min: 200, max: 240 },
    'divine': { min: 240, max: 280 }
  };
  
  const range = damageRanges[rarity];
  if (!range) return [];
  
  return Object.entries(balancedDevilFruitAbilities).filter(([name, ability]) => {
    return ability.damage >= range.min && ability.damage <= range.max;
  });
}

module.exports = {
  balancedDevilFruitAbilities,
  statusEffects,
  PvPDamageCalculator,
  getAbilityByFruitName,
  getAbilitiesByRarity
};
