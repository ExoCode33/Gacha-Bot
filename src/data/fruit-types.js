// src/data/fruit-types.js - Devil Fruit Types and Elements System

// Fruit type definitions
const FRUIT_TYPES = {
    // Common fruits
    'gomu_gomu': { type: 'Paramecia', fruitType: 'Rubber' },
    'kilo_kilo': { type: 'Paramecia', fruitType: 'Weight' },
    'chop_chop': { type: 'Paramecia', fruitType: 'Blade' },
    'slip_slip': { type: 'Paramecia', fruitType: 'Smooth' },
    'boom_boom': { type: 'Paramecia', fruitType: 'Explosion' },
    'wax_wax': { type: 'Paramecia', fruitType: 'Wax' },
    'spring_spring': { type: 'Paramecia', fruitType: 'Spring' },
    'dice_dice': { type: 'Paramecia', fruitType: 'Blade' },
    'spin_spin': { type: 'Paramecia', fruitType: 'Iron' },
    'jacket_jacket': { type: 'Paramecia', fruitType: 'Cloth' },
    'berry_berry': { type: 'Paramecia', fruitType: 'Berry' },
    'rust_rust': { type: 'Paramecia', fruitType: 'Rust' },
    'wheel_wheel': { type: 'Paramecia', fruitType: 'Wheel' },
    'wash_wash': { type: 'Paramecia', fruitType: 'Clean' },
    'brush_brush': { type: 'Paramecia', fruitType: 'Art' },

    // Uncommon fruits
    'spike_spike': { type: 'Paramecia', fruitType: 'Spike' },
    'hollow_hollow': { type: 'Paramecia', fruitType: 'Ghost' },
    'barrier_barrier': { type: 'Paramecia', fruitType: 'Barrier' },
    'hobby_hobby': { type: 'Paramecia', fruitType: 'Toy' },
    'clear_clear': { type: 'Paramecia', fruitType: 'Invisibility' },
    'flower_flower': { type: 'Paramecia', fruitType: 'Flower' },
    'revive_revive': { type: 'Paramecia', fruitType: 'Soul' },
    'shadow_shadow': { type: 'Paramecia', fruitType: 'Shadow' },
    'slow_slow': { type: 'Paramecia', fruitType: 'Slow' },
    'door_door': { type: 'Paramecia', fruitType: 'Door' },
    'bubble_bubble': { type: 'Paramecia', fruitType: 'Bubble' },
    'string_string': { type: 'Paramecia', fruitType: 'String' },
    'paw_paw': { type: 'Paramecia', fruitType: 'Repel' },
    'love_love': { type: 'Paramecia', fruitType: 'Love' },

    // Rare fruits (mostly Logia)
    'flame_flame': { type: 'Logia', fruitType: 'Fire' },
    'smoke_smoke': { type: 'Logia', fruitType: 'Smoke' },
    'sand_sand': { type: 'Logia', fruitType: 'Sand' },
    'rumble_rumble': { type: 'Logia', fruitType: 'Lightning' },
    'ice_ice': { type: 'Logia', fruitType: 'Ice' },
    'dark_dark': { type: 'Logia', fruitType: 'Darkness' },
    'light_light': { type: 'Logia', fruitType: 'Light' },
    'magma_magma': { type: 'Logia', fruitType: 'Magma' },
    'marsh_marsh': { type: 'Logia', fruitType: 'Swamp' },
    'gas_gas': { type: 'Logia', fruitType: 'Gas' },
    'snow_snow': { type: 'Logia', fruitType: 'Snow' },
    'tremor_tremor': { type: 'Paramecia', fruitType: 'Earthquake' },
    'venom_venom': { type: 'Paramecia', fruitType: 'Poison' },
    'ope_ope': { type: 'Paramecia', fruitType: 'Surgery' },
    'gravity_gravity': { type: 'Paramecia', fruitType: 'Gravity' },

    // Epic fruits
    'human_buddha': { type: 'Mythical Zoan', fruitType: 'Buddha' },
    'dragon_eastern': { type: 'Mythical Zoan', fruitType: 'Dragon' },
    'bird_phoenix': { type: 'Mythical Zoan', fruitType: 'Phoenix' },
    'dog_kyubi': { type: 'Mythical Zoan', fruitType: 'Kitsune' },
    'spider_rosamygale': { type: 'Ancient Zoan', fruitType: 'Spider' },
    'castle_castle': { type: 'Paramecia', fruitType: 'Castle' },
    'soul_soul': { type: 'Paramecia', fruitType: 'Soul' },
    'mirror_mirror': { type: 'Paramecia', fruitType: 'Mirror' },
    'biscuit_biscuit': { type: 'Paramecia', fruitType: 'Biscuit' },
    'mochi_mochi': { type: 'Special Paramecia', fruitType: 'Mochi' },
    'memory_memory': { type: 'Paramecia', fruitType: 'Memory' },
    'time_time': { type: 'Paramecia', fruitType: 'Time' },
    'float_float': { type: 'Paramecia', fruitType: 'Float' },
    'push_push': { type: 'Paramecia', fruitType: 'Push' },
    'heal_heal': { type: 'Paramecia', fruitType: 'Heal' },

    // Legendary fruits
    'nika_nika': { type: 'Mythical Zoan', fruitType: 'Sun God' },
    'yamata_orochi': { type: 'Mythical Zoan', fruitType: 'Serpent' },
    'azure_dragon': { type: 'Mythical Zoan', fruitType: 'Azure Dragon' },
    'white_tiger': { type: 'Mythical Zoan', fruitType: 'White Tiger' },
    'black_tortoise': { type: 'Mythical Zoan', fruitType: 'Black Tortoise' },
    'vermillion_bird': { type: 'Mythical Zoan', fruitType: 'Vermillion Bird' },
    'grim_reaper': { type: 'Mythical Zoan', fruitType: 'Death' },
    'void_void': { type: 'Special Paramecia', fruitType: 'Void' },
    'space_space': { type: 'Special Paramecia', fruitType: 'Space' },
    'creation_creation': { type: 'Special Paramecia', fruitType: 'Creation' },

    // Mythical fruits
    'world_world': { type: 'Special Paramecia', fruitType: 'World' },
    'reality_reality': { type: 'Special Paramecia', fruitType: 'Reality' },
    'concept_concept': { type: 'Special Paramecia', fruitType: 'Concept' },
    'infinity_infinity': { type: 'Special Paramecia', fruitType: 'Infinity' },
    'alpha_alpha': { type: 'Mythical Zoan', fruitType: 'Alpha' },
    'omega_omega': { type: 'Mythical Zoan', fruitType: 'Omega' },
    'primordial_chaos': { type: 'Mythical Zoan', fruitType: 'Chaos' },

    // Omnipotent fruits
    'god_god': { type: 'Divine Fruit', fruitType: 'Omnipotence' },
    'all_all': { type: 'Divine Fruit', fruitType: 'Totality' },
    'one_one': { type: 'Divine Fruit', fruitType: 'Unity' }
};

// Type counters - which types are effective against others
const TYPE_COUNTERS = {
    // Elemental counters
    'Fire': ['Ice', 'Snow', 'Wax', 'Flower'],
    'Ice': ['Fire', 'Magma', 'Lightning'],
    'Water': ['Fire', 'Magma', 'Sand'],
    'Lightning': ['Water', 'Ice', 'Iron'],
    'Earth': ['Lightning', 'Fire'],
    'Wind': ['Earth', 'Sand'],
    'Light': ['Darkness', 'Shadow'],
    'Darkness': ['Light'],
    'Magma': ['Ice', 'Snow'],
    'Sand': ['Water'],
    'Poison': ['Heal'],
    'Gravity': ['Float'],
    'Time': ['Space'],
    'Space': ['Time'],
    'Soul': ['Ghost'],
    'Death': ['Soul', 'Life'],
    'Chaos': ['Order'],
    'Order': ['Chaos'],
    'Reality': ['Illusion'],
    'Void': ['Creation'],
    'Creation': ['Void'],
    'Omnipotence': ['All'], // Beats everything except itself
};

// Type effectiveness multipliers
const TYPE_EFFECTIVENESS = {
    SUPER_EFFECTIVE: 1.5,
    NORMAL: 1.0,
    NOT_VERY_EFFECTIVE: 0.7,
    NO_EFFECT: 0.5
};

// Type emojis
const TYPE_EMOJIS = {
    'Paramecia': '🔮',
    'Logia': '🌪️',
    'Zoan': '🐺',
    'Ancient Zoan': '🦕',
    'Mythical Zoan': '🐉',
    'Special Paramecia': '✨',
    'Divine Fruit': '👑',
    
    // Element emojis
    'Fire': '🔥',
    'Ice': '❄️',
    'Water': '🌊',
    'Lightning': '⚡',
    'Earth': '🌍',
    'Wind': '💨',
    'Light': '☀️',
    'Darkness': '🌑',
    'Magma': '🌋',
    'Sand': '🏜️',
    'Poison': '☠️',
    'Gravity': '🌌',
    'Time': '⏰',
    'Space': '🌠',
    'Soul': '👻',
    'Death': '💀',
    'Chaos': '🌪️',
    'Reality': '🔮',
    'Void': '⚫',
    'Creation': '✨',
    'Omnipotence': '🌟'
};

// Utility functions
function getFruitType(fruitId) {
    return FRUIT_TYPES[fruitId] || { type: 'Paramecia', fruitType: 'Unknown' };
}

function getTypeMatchup(attackingType, defendingType) {
    const counters = TYPE_COUNTERS[attackingType];
    if (!counters) return TYPE_EFFECTIVENESS.NORMAL;
    
    if (counters.includes(defendingType)) {
        return TYPE_EFFECTIVENESS.SUPER_EFFECTIVE;
    }
    
    // Check if defending type counters attacking type
    const defenderCounters = TYPE_COUNTERS[defendingType];
    if (defenderCounters && defenderCounters.includes(attackingType)) {
        return TYPE_EFFECTIVENESS.NOT_VERY_EFFECTIVE;
    }
    
    return TYPE_EFFECTIVENESS.NORMAL;
}

function getFruitsByType(type) {
    return Object.entries(FRUIT_TYPES)
        .filter(([fruitId, typeData]) => typeData.type === type)
        .map(([fruitId, typeData]) => ({ fruitId, ...typeData }));
}

function getFruitsByElement(element) {
    return Object.entries(FRUIT_TYPES)
        .filter(([fruitId, typeData]) => typeData.fruitType === element)
        .map(([fruitId, typeData]) => ({ fruitId, ...typeData }));
}

function getAllFruitTypes() {
    const types = new Set();
    Object.values(FRUIT_TYPES).forEach(typeData => {
        types.add(typeData.type);
    });
    return Array.from(types);
}

function getAllElements() {
    const elements = new Set();
    Object.values(FRUIT_TYPES).forEach(typeData => {
        elements.add(typeData.fruitType);
    });
    return Array.from(elements);
}

function getTypeEmoji(type) {
    return TYPE_EMOJIS[type] || '❓';
}

function calculateBattleEffectiveness(attackerFruitId, defenderFruitId) {
    const attackerType = getFruitType(attackerFruitId);
    const defenderType = getFruitType(defenderFruitId);
    
    const effectiveness = getTypeMatchup(attackerType.fruitType, defenderType.fruitType);
    
    let message = '';
    if (effectiveness === TYPE_EFFECTIVENESS.SUPER_EFFECTIVE) {
        message = 'It\'s super effective!';
    } else if (effectiveness === TYPE_EFFECTIVENESS.NOT_VERY_EFFECTIVE) {
        message = 'It\'s not very effective...';
    } else if (effectiveness === TYPE_EFFECTIVENESS.NO_EFFECT) {
        message = 'It has no effect...';
    } else {
        message = 'Normal effectiveness';
    }
    
    return {
        effectiveness,
        message,
        attackerType: attackerType.fruitType,
        defenderType: defenderType.fruitType
    };
}

function getTypeInfo(type) {
    const emoji = getTypeEmoji(type);
    const counters = TYPE_COUNTERS[type] || [];
    const weakTo = Object.entries(TYPE_COUNTERS)
        .filter(([counterType, targets]) => targets.includes(type))
        .map(([counterType]) => counterType);
    
    return {
        name: type,
        emoji,
        strongAgainst: counters,
        weakAgainst: weakTo,
        description: getTypeDescription(type)
    };
}

function getTypeDescription(type) {
    const descriptions = {
        'Fire': 'Burns through ice and nature',
        'Ice': 'Freezes water and slows lightning',
        'Lightning': 'Conducts through water and metal',
        'Water': 'Extinguishes fire and erodes earth',
        'Earth': 'Grounds lightning and absorbs fire',
        'Light': 'Banishes darkness and shadows',
        'Darkness': 'Consumes light and creates fear',
        'Time': 'Controls the flow of temporal reality',
        'Space': 'Manipulates dimensional boundaries',
        'Soul': 'Affects the essence of life',
        'Death': 'The ultimate end of all things',
        'Reality': 'Bends the laws of existence',
        'Omnipotence': 'Supreme power over all creation'
    };
    
    return descriptions[type] || 'A mysterious power';
}

function getTypeStats() {
    const allTypes = getAllFruitTypes();
    const allElements = getAllElements();
    
    return {
        totalTypes: allTypes.length,
        totalElements: allElements.length,
        mostCommonType: getMostCommonType(),
        mostCommonElement: getMostCommonElement(),
        typeDistribution: getTypeDistribution()
    };
}

function getMostCommonType() {
    const typeCounts = {};
    Object.values(FRUIT_TYPES).forEach(typeData => {
        typeCounts[typeData.type] = (typeCounts[typeData.type] || 0) + 1;
    });
    
    return Object.entries(typeCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';
}

function getMostCommonElement() {
    const elementCounts = {};
    Object.values(FRUIT_TYPES).forEach(typeData => {
        elementCounts[typeData.fruitType] = (elementCounts[typeData.fruitType] || 0) + 1;
    });
    
    return Object.entries(elementCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';
}

function getTypeDistribution() {
    const distribution = {};
    Object.values(FRUIT_TYPES).forEach(typeData => {
        distribution[typeData.type] = (distribution[typeData.type] || 0) + 1;
    });
    
    return distribution;
}

// Validate type data
function validateTypeData() {
    const errors = [];
    
    // Check if all fruits have type data
    const fruitIds = Object.keys(FRUIT_TYPES);
    
    // Check for missing emojis
    const missingEmojis = [];
    Object.values(FRUIT_TYPES).forEach(typeData => {
        if (!TYPE_EMOJIS[typeData.type] && !TYPE_EMOJIS[typeData.fruitType]) {
            missingEmojis.push(`${typeData.type}/${typeData.fruitType}`);
        }
    });
    
    if (missingEmojis.length > 0) {
        errors.push(`Missing emojis for: ${missingEmojis.slice(0, 5).join(', ')}`);
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        totalFruits: fruitIds.length,
        checkedComponents: ['types', 'elements', 'emojis', 'counters']
    };
}

module.exports = {
    FRUIT_TYPES,
    TYPE_COUNTERS,
    TYPE_EFFECTIVENESS,
    TYPE_EMOJIS,
    getFruitType,
    getTypeMatchup,
    getFruitsByType,
    getFruitsByElement,
    getAllFruitTypes,
    getAllElements,
    getTypeEmoji,
    calculateBattleEffectiveness,
    getTypeInfo,
    getTypeStats,
    validateTypeData
};
