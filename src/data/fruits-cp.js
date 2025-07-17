// src/data/fruit-cp.js - Devil Fruit CP Multipliers

// Common Fruits (1.0x - 1.2x multiplier)
const commonFruits = [
    { id: 'gomu_gomu', name: 'Gomu Gomu no Mi', type: 'Paramecia', power: 'Grants rubber properties to the user\'s body' },
    { id: 'kilo_kilo', name: 'Kilo Kilo no Mi', type: 'Paramecia', power: 'Allows the user to change their weight' },
    { id: 'chop_chop', name: 'Bara Bara no Mi', type: 'Paramecia', power: 'Allows the user to split their body into pieces' },
    { id: 'slip_slip', name: 'Sube Sube no Mi', type: 'Paramecia', power: 'Makes the user\'s skin slippery' },
    { id: 'boom_boom', name: 'Bomu Bomu no Mi', type: 'Paramecia', power: 'Makes the user a bomb human' },
    { id: 'wax_wax', name: 'Doru Doru no Mi', type: 'Paramecia', power: 'Allows the user to create and control wax' },
    { id: 'spring_spring', name: 'Bane Bane no Mi', type: 'Paramecia', power: 'Turns the user\'s legs into springs' },
    { id: 'dice_dice', name: 'Supa Supa no Mi', type: 'Paramecia', power: 'Turns the user\'s body into blades' },
    { id: 'spin_spin', name: 'Ori Ori no Mi', type: 'Paramecia', power: 'Allows the user to bind opponents with iron' },
    { id: 'jacket_jacket', name: 'Jaku Jaku no Mi', type: 'Paramecia', power: 'Allows the user to become a jacket' },
    { id: 'berry_berry', name: 'Beri Beri no Mi', type: 'Paramecia', power: 'Allows the user to turn into berries' },
    { id: 'rust_rust', name: 'Sabi Sabi no Mi', type: 'Paramecia', power: 'Allows the user to rust metal' },
    { id: 'wheel_wheel', name: 'Sharin Sharin no Mi', type: 'Paramecia', power: 'Turns the user\'s limbs into wheels' },
    { id: 'wash_wash', name: 'Woshu Woshu no Mi', type: 'Paramecia', power: 'Allows the user to wash and fold anything' },
    { id: 'brush_brush', name: 'Fude Fude no Mi', type: 'Paramecia', power: 'Allows the user to create paintings that come to life' }
];

// Uncommon Fruits (1.2x - 1.4x multiplier)
const uncommonFruits = [
    { id: 'spike_spike', name: 'Toge Toge no Mi', type: 'Paramecia', power: 'Allows the user to grow spikes from their body' },
    { id: 'hollow_hollow', name: 'Horo Horo no Mi', type: 'Paramecia', power: 'Allows the user to create and control ghosts' },
    { id: 'barrier_barrier', name: 'Bari Bari no Mi', type: 'Paramecia', power: 'Allows the user to create barriers' },
    { id: 'hobby_hobby', name: 'Hobi Hobi no Mi', type: 'Paramecia', power: 'Allows the user to turn people into toys' },
    { id: 'clear_clear', name: 'Suke Suke no Mi', type: 'Paramecia', power: 'Grants the user invisibility' },
    { id: 'flower_flower', name: 'Hana Hana no Mi', type: 'Paramecia', power: 'Allows the user to sprout body parts anywhere' },
    { id: 'revive_revive', name: 'Yomi Yomi no Mi', type: 'Paramecia', power: 'Grants the user a second life' },
    { id: 'shadow_shadow', name: 'Kage Kage no Mi', type: 'Paramecia', power: 'Allows the user to control shadows' },
    { id: 'slow_slow', name: 'Noro Noro no Mi', type: 'Paramecia', power: 'Allows the user to slow down anything' },
    { id: 'door_door', name: 'Doa Doa no Mi', type: 'Paramecia', power: 'Allows the user to create doors anywhere' },
    { id: 'bubble_bubble', name: 'Awa Awa no Mi', type: 'Paramecia', power: 'Allows the user to create and control bubbles' },
    { id: 'rust_rust', name: 'Sabi Sabi no Mi', type: 'Paramecia', power: 'Allows the user to rust anything' },
    { id: 'string_string', name: 'Ito Ito no Mi', type: 'Paramecia', power: 'Allows the user to create and control strings' },
    { id: 'paw_paw', name: 'Nikyu Nikyu no Mi', type: 'Paramecia', power: 'Grants paw pads that can repel anything' },
    { id: 'love_love', name: 'Mero Mero no Mi', type: 'Paramecia', power: 'Allows the user to turn people to stone with love' }
];

// Rare Fruits (1.4x - 1.7x multiplier)
const rareFruits = [
    { id: 'flame_flame', name: 'Mera Mera no Mi', type: 'Logia', power: 'Allows the user to create and control fire' },
    { id: 'smoke_smoke', name: 'Moku Moku no Mi', type: 'Logia', power: 'Allows the user to create and control smoke' },
    { id: 'sand_sand', name: 'Suna Suna no Mi', type: 'Logia', power: 'Allows the user to create and control sand' },
    { id: 'rumble_rumble', name: 'Goro Goro no Mi', type: 'Logia', power: 'Allows the user to create and control lightning' },
    { id: 'ice_ice', name: 'Hie Hie no Mi', type: 'Logia', power: 'Allows the user to create and control ice' },
    { id: 'dark_dark', name: 'Yami Yami no Mi', type: 'Logia', power: 'Allows the user to create and control darkness' },
    { id: 'light_light', name: 'Pika Pika no Mi', type: 'Logia', power: 'Allows the user to create and control light' },
    { id: 'magma_magma', name: 'Magu Magu no Mi', type: 'Logia', power: 'Allows the user to create and control magma' },
    { id: 'marsh_marsh', name: 'Numa Numa no Mi', type: 'Logia', power: 'Allows the user to create and control swamps' },
    { id: 'gas_gas', name: 'Gasu Gasu no Mi', type: 'Logia', power: 'Allows the user to create and control gas' },
    { id: 'snow_snow', name: 'Yuki Yuki no Mi', type: 'Logia', power: 'Allows the user to create and control snow' },
    { id: 'tremor_tremor', name: 'Gura Gura no Mi', type: 'Paramecia', power: 'Allows the user to create earthquakes' },
    { id: 'venom_venom', name: 'Doku Doku no Mi', type: 'Paramecia', power: 'Allows the user to create and control poison' },
    { id: 'chop_chop', name: 'Ope Ope no Mi', type: 'Paramecia', power: 'Grants surgical powers within a "Room"' },
    { id: 'gravity_gravity', name: 'Zushi Zushi no Mi', type: 'Paramecia', power: 'Allows the user to control gravity' }
];

// Epic Fruits (1.7x - 2.1x multiplier)
const epicFruits = [
    { id: 'human_buddha', name: 'Hito Hito no Mi, Model: Daibutsu', type: 'Mythical Zoan', power: 'Transforms the user into a giant golden Buddha' },
    { id: 'dragon_eastern', name: 'Uo Uo no Mi, Model: Seiryu', type: 'Mythical Zoan', power: 'Transforms the user into an Eastern Dragon' },
    { id: 'bird_phoenix', name: 'Tori Tori no Mi, Model: Phoenix', type: 'Mythical Zoan', power: 'Transforms the user into a phoenix with regeneration' },
    { id: 'dog_kyubi', name: 'Inu Inu no Mi, Model: Kyubi no Kitsune', type: 'Mythical Zoan', power: 'Transforms the user into a nine-tailed fox' },
    { id: 'spider_rosamygale', name: 'Kumo Kumo no Mi, Model: Rosamygale Grauvogeli', type: 'Ancient Zoan', power: 'Transforms the user into an ancient spider' },
    { id: 'castle_castle', name: 'Shiro Shiro no Mi', type: 'Paramecia', power: 'Allows the user to become a living fortress' },
    { id: 'soul_soul', name: 'Soru Soru no Mi', type: 'Paramecia', power: 'Allows the user to manipulate souls' },
    { id: 'mirror_mirror', name: 'Mira Mira no Mi', type: 'Paramecia', power: 'Allows the user to create and travel through mirrors' },
    { id: 'biscuit_biscuit', name: 'Bisu Bisu no Mi', type: 'Paramecia', power: 'Allows the user to create and control biscuits' },
    { id: 'mochi_mochi', name: 'Mochi Mochi no Mi', type: 'Special Paramecia', power: 'Allows the user to create and control mochi' },
    { id: 'memory_memory', name: 'Memo Memo no Mi', type: 'Paramecia', power: 'Allows the user to manipulate memories' },
    { id: 'time_time', name: 'Toki Toki no Mi', type: 'Paramecia', power: 'Allows the user to travel through time' },
    { id: 'float_float', name: 'Fuwa Fuwa no Mi', type: 'Paramecia', power: 'Allows the user to make objects float' },
    { id: 'push_push', name: 'Oshi Oshi no Mi', type: 'Paramecia', power: 'Allows the user to push anything' },
    { id: 'heal_heal', name: 'Chiyu Chiyu no Mi', type: 'Paramecia', power: 'Allows the user to heal any injury' }
];

// Legendary Fruits (2.1x - 2.6x multiplier)
const legendaryFruits = [
    { id: 'nika_nika', name: 'Hito Hito no Mi, Model: Nika', type: 'Mythical Zoan', power: 'Sun God Nika - grants rubber powers and reality manipulation' },
    { id: 'yamata_orochi', name: 'Hebi Hebi no Mi, Model: Yamata-no-Orochi', type: 'Mythical Zoan', power: 'Transforms the user into the eight-headed serpent' },
    { id: 'azure_dragon', name: 'Uo Uo no Mi, Model: Seiryu', type: 'Mythical Zoan', power: 'Transforms the user into Kaido\'s Azure Dragon form' },
    { id: 'white_tiger', name: 'Neko Neko no Mi, Model: Byakko', type: 'Mythical Zoan', power: 'Transforms the user into the White Tiger god' },
    { id: 'black_tortoise', name: 'Kame Kame no Mi, Model: Genbu', type: 'Mythical Zoan', power: 'Transforms the user into the Black Tortoise god' },
    { id: 'vermillion_bird', name: 'Tori Tori no Mi, Model: Suzaku', type: 'Mythical Zoan', power: 'Transforms the user into the Vermillion Bird god' },
    { id: 'grim_reaper', name: 'Shin Shin no Mi, Model: Shinigami', type: 'Mythical Zoan', power: 'Transforms the user into the Grim Reaper' },
    { id: 'void_void', name: 'Kuu Kuu no Mi', type: 'Special Paramecia', power: 'Allows the user to control the void and nothingness' },
    { id: 'space_space', name: 'Kukan Kukan no Mi', type: 'Special Paramecia', power: 'Allows the user to manipulate space itself' },
    { id: 'creation_creation', name: 'Souzou Souzou no Mi', type: 'Special Paramecia', power: 'Allows the user to create anything from imagination' }
];

// Mythical Fruits (2.6x - 3.2x multiplier)
const mythicalFruits = [
    { id: 'world_world', name: 'Sekai Sekai no Mi', type: 'Special Paramecia', power: 'Grants control over entire worlds and dimensions' },
    { id: 'reality_reality', name: 'Genjitsu Genjitsu no Mi', type: 'Special Paramecia', power: 'Allows the user to alter reality itself' },
    { id: 'concept_concept', name: 'Gainen Gainen no Mi', type: 'Special Paramecia', power: 'Allows the user to manipulate abstract concepts' },
    { id: 'infinity_infinity', name: 'Mugen Mugen no Mi', type: 'Special Paramecia', power: 'Grants infinite power and possibilities' },
    { id: 'alpha_alpha', name: 'Arufa Arufa no Mi', type: 'Mythical Zoan', power: 'Transforms the user into the Alpha of all existence' },
    { id: 'omega_omega', name: 'Omega Omega no Mi', type: 'Mythical Zoan', power: 'Transforms the user into the Omega, the end of all things' },
    { id: 'primordial_chaos', name: 'Konton Konton no Mi', type: 'Mythical Zoan', power: 'Transforms the user into Primordial Chaos itself' }
];

// Omnipotent Fruits (3.2x - 4.0x multiplier)
const omnipotentFruits = [
    { id: 'god_god', name: 'Kami Kami no Mi', type: 'Divine Fruit', power: 'Grants true omnipotence and godhood' },
    { id: 'all_all', name: 'Zen Zen no Mi', type: 'Divine Fruit', power: 'Grants power over all existence, past, present, and future' },
    { id: 'one_one', name: 'Ichi Ichi no Mi', type: 'Divine Fruit', power: 'Makes the user the One Above All, supreme over everything' }
];

// CP Multipliers for each fruit
const FRUIT_CP_MULTIPLIERS = {};

// Assign multipliers based on rarity
const assignMultipliers = (fruits, minMultiplier, maxMultiplier) => {
    fruits.forEach(fruit => {
        const randomMultiplier = Math.random() * (maxMultiplier - minMultiplier) + minMultiplier;
        FRUIT_CP_MULTIPLIERS[fruit.id] = parseFloat(randomMultiplier.toFixed(2));
    });
};

// Assign multipliers for each rarity tier
assignMultipliers(commonFruits, 1.0, 1.2);
assignMultipliers(uncommonFruits, 1.2, 1.4);
assignMultipliers(rareFruits, 1.4, 1.7);
assignMultipliers(epicFruits, 1.7, 2.1);
assignMultipliers(legendaryFruits, 2.1, 2.6);
assignMultipliers(mythicalFruits, 2.6, 3.2);
assignMultipliers(omnipotentFruits, 3.2, 4.0);

// CP ranges for validation
const CP_RANGES = {
    common: { min: 1.0, max: 1.2 },
    uncommon: { min: 1.2, max: 1.4 },
    rare: { min: 1.4, max: 1.7 },
    epic: { min: 1.7, max: 2.1 },
    legendary: { min: 2.1, max: 2.6 },
    mythical: { min: 2.6, max: 3.2 },
    omnipotent: { min: 3.2, max: 4.0 }
};

// Utility functions
function getFruitCP(fruitId) {
    return FRUIT_CP_MULTIPLIERS[fruitId] || 1.0;
}

function getFruitCPAsInt(fruitId) {
    return Math.floor(getFruitCP(fruitId) * 100);
}

function intToCP(intValue) {
    return intValue / 100;
}

function getCPRange(rarity) {
    return CP_RANGES[rarity] || { min: 1.0, max: 1.2 };
}

function isValidCP(cp, rarity) {
    const range = getCPRange(rarity);
    return cp >= range.min && cp <= range.max;
}

function getRandomCPForRarity(rarity) {
    const range = getCPRange(rarity);
    return Math.random() * (range.max - range.min) + range.min;
}

function getRarityFromCP(cp) {
    for (const [rarity, range] of Object.entries(CP_RANGES)) {
        if (cp >= range.min && cp <= range.max) {
            return rarity;
        }
    }
    return 'common';
}

function getCPTierDescription(cp) {
    if (cp >= 3.2) return 'Divine';
    if (cp >= 2.6) return 'Mythical';
    if (cp >= 2.1) return 'Legendary';
    if (cp >= 1.7) return 'Epic';
    if (cp >= 1.4) return 'Rare';
    if (cp >= 1.2) return 'Uncommon';
    return 'Common';
}

function calculateTotalCP(baseCPFromLevel, fruits) {
    if (!fruits || fruits.length === 0) return baseCPFromLevel;
    
    const fruitGroups = {};
    
    // Group fruits by ID to handle duplicates
    fruits.forEach(fruit => {
        if (!fruitGroups[fruit.fruit_id]) {
            fruitGroups[fruit.fruit_id] = {
                cpMultiplier: fruit.cpMultiplier || getFruitCP(fruit.fruit_id),
                count: 0
            };
        }
        fruitGroups[fruit.fruit_id].count++;
    });
    
    // Calculate total CP with duplicates
    let totalMultiplier = 0;
    Object.values(fruitGroups).forEach(group => {
        const baseMultiplier = group.cpMultiplier;
        const duplicateBonus = (group.count - 1) * 0.01; // 1% per duplicate
        totalMultiplier += baseMultiplier + duplicateBonus;
    });
    
    return Math.floor(baseCPFromLevel * (1 + totalMultiplier));
}

function calculateDuplicateBonus(duplicateCount) {
    return 1 + ((duplicateCount - 1) * 0.01);
}

function getCPStats() {
    const allCPs = Object.values(FRUIT_CP_MULTIPLIERS);
    return {
        total: allCPs.length,
        average: allCPs.reduce((sum, cp) => sum + cp, 0) / allCPs.length,
        min: Math.min(...allCPs),
        max: Math.max(...allCPs)
    };
}

function getTopCPFruits(limit = 10) {
    return Object.entries(FRUIT_CP_MULTIPLIERS)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([fruitId, cp]) => ({ fruitId, cp }));
}

function getFruitsByCPRange(minCP, maxCP) {
    return Object.entries(FRUIT_CP_MULTIPLIERS)
        .filter(([,cp]) => cp >= minCP && cp <= maxCP)
        .map(([fruitId, cp]) => ({ fruitId, cp }));
}

module.exports = {
    commonFruits,
    uncommonFruits,
    rareFruits,
    epicFruits,
    legendaryFruits,
    mythicalFruits,
    omnipotentFruits,
    FRUIT_CP_MULTIPLIERS,
    CP_RANGES,
    getFruitCP,
    getFruitCPAsInt,
    intToCP,
    getCPRange,
    getFruitsByCPRange,
    getTopCPFruits,
    calculateTotalCP,
    calculateDuplicateBonus,
    getCPStats,
    getRandomCPForRarity,
    getRarityFromCP,
    isValidCP,
    getCPTierDescription
};
