// src/data/fruit-types.js - Devil Fruit Types and Counter System
const FRUIT_TYPES = {
    // Devil Fruit main categories
    'fruit_001': { type: 'Paramecia', fruitType: 'Explosive' },
    'fruit_002': { type: 'Paramecia', fruitType: 'Body Manipulation' },
    'fruit_003': { type: 'Paramecia', fruitType: 'Surface Manipulation' },
    'fruit_004': { type: 'Paramecia', fruitType: 'Weight Manipulation' },
    'fruit_005': { type: 'Paramecia', fruitType: 'Substance Creation' },
    'fruit_006': { type: 'Paramecia', fruitType: 'Consumption' },
    'fruit_007': { type: 'Paramecia', fruitType: 'Binding' },
    'fruit_008': { type: 'Paramecia', fruitType: 'Body Enhancement' },
    'fruit_009': { type: 'Paramecia', fruitType: 'Time Manipulation' },
    'fruit_010': { type: 'Paramecia', fruitType: 'Space Manipulation' },
    'fruit_011': { type: 'Paramecia', fruitType: 'Cleansing' },
    'fruit_012': { type: 'Paramecia', fruitType: 'Body Manipulation' },
    'fruit_013': { type: 'Paramecia', fruitType: 'Corrosion' },
    'fruit_014': { type: 'Paramecia', fruitType: 'Rotation' },
    'fruit_015': { type: 'Paramecia', fruitType: 'Soul Manipulation' },
    'fruit_016': { type: 'Paramecia', fruitType: 'Shadow Manipulation' },
    'fruit_017': { type: 'Paramecia', fruitType: 'Spirit Manipulation' },
    'fruit_018': { type: 'Paramecia', fruitType: 'Invisibility' },
    'fruit_019': { type: 'Paramecia', fruitType: 'Cutting' },
    'fruit_020': { type: 'Paramecia', fruitType: 'Cleansing' },
    'fruit_021': { type: 'Paramecia', fruitType: 'Levitation' },
    'fruit_022': { type: 'Paramecia', fruitType: 'Targeting' },
    'fruit_023': { type: 'Paramecia', fruitType: 'Weapon Creation' },
    'fruit_024': { type: 'Paramecia', fruitType: 'Rotation' },
    'fruit_025': { type: 'Paramecia', fruitType: 'Substance Creation' },
    'fruit_026': { type: 'Paramecia', fruitType: 'Shape Manipulation' },
    'fruit_027': { type: 'Paramecia', fruitType: 'Material Assimilation' },
    'fruit_028': { type: 'Paramecia', fruitType: 'Stitching' },
    'fruit_029': { type: 'Paramecia', fruitType: 'Perception' },
    'fruit_030': { type: 'Paramecia', fruitType: 'Art Manipulation' },
    'fruit_031': { type: 'Paramecia', fruitType: 'Control' },
    'fruit_032': { type: 'Paramecia', fruitType: 'Space Manipulation' },
    'fruit_033': { type: 'Paramecia', fruitType: 'Food Creation' },
    'fruit_034': { type: 'Paramecia', fruitType: 'Food Creation' },
    'fruit_035': { type: 'Paramecia', fruitType: 'Substance Creation' },
    'fruit_036': { type: 'Paramecia', fruitType: 'Extraction' },
    'fruit_037': { type: 'Paramecia', fruitType: 'Memory Manipulation' },
    'fruit_038': { type: 'Paramecia', fruitType: 'Space Manipulation' },
    'fruit_039': { type: 'Paramecia', fruitType: 'Food Creation' },
    'fruit_040': { type: 'Zoan', fruitType: 'Evolution' },
    'fruit_041': { type: 'Zoan', fruitType: 'Animal' },
    'fruit_042': { type: 'Zoan', fruitType: 'Insect' },
    'fruit_043': { type: 'Zoan', fruitType: 'Insect' },
    'fruit_044': { type: 'Paramecia', fruitType: 'Space Manipulation' },
    'fruit_045': { type: 'Paramecia', fruitType: 'Food Creation' },
    'fruit_046': { type: 'Paramecia', fruitType: 'Fusion' },
    'fruit_047': { type: 'Paramecia', fruitType: 'Communication' },
    'fruit_048': { type: 'Paramecia', fruitType: 'Size Manipulation' },
    'fruit_049': { type: 'Paramecia', fruitType: 'Weight Manipulation' },
    'fruit_050': { type: 'Paramecia', fruitType: 'Petrification' },
    'fruit_051': { type: 'Paramecia', fruitType: 'Body Enhancement' },
    'fruit_052': { type: 'Paramecia', fruitType: 'Body Multiplication' },
    'fruit_053': { type: 'Paramecia', fruitType: 'Barrier Creation' },
    'fruit_054': { type: 'Paramecia', fruitType: 'Sound Manipulation' },
    'fruit_055': { type: 'Paramecia', fruitType: 'Transformation' },
    'fruit_056': { type: 'Paramecia', fruitType: 'Movement' },
    'fruit_057': { type: 'Zoan', fruitType: 'Animal' },
    'fruit_058': { type: 'Zoan', fruitType: 'Animal' },
    'fruit_059': { type: 'Zoan', fruitType: 'Animal' },
    'fruit_060': { type: 'Zoan', fruitType: 'Animal' },
    'fruit_061': { type: 'Zoan', fruitType: 'Animal' },
    'fruit_062': { type: 'Zoan', fruitType: 'Animal' },
    'fruit_063': { type: 'Zoan', fruitType: 'Animal' },
    'fruit_064': { type: 'Zoan', fruitType: 'Animal' },
    'fruit_065': { type: 'Zoan', fruitType: 'Animal' },
    'fruit_066': { type: 'Zoan', fruitType: 'Animal' },
    'fruit_067': { type: 'Ancient Zoan', fruitType: 'Prehistoric' },
    'fruit_068': { type: 'Ancient Zoan', fruitType: 'Prehistoric' },
    'fruit_069': { type: 'Ancient Zoan', fruitType: 'Prehistoric' },
    'fruit_070': { type: 'Ancient Zoan', fruitType: 'Prehistoric' },
    'fruit_071': { type: 'Ancient Zoan', fruitType: 'Prehistoric' },
    'fruit_072': { type: 'Ancient Zoan', fruitType: 'Prehistoric' },
    'fruit_073': { type: 'Ancient Zoan', fruitType: 'Prehistoric' },
    'fruit_074': { type: 'Ancient Zoan', fruitType: 'Prehistoric' },
    'fruit_075': { type: 'Ancient Zoan', fruitType: 'Prehistoric' },
    'fruit_076': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_077': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_078': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_079': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_080': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_081': { type: 'Logia', fruitType: 'Unique' },
    'fruit_082': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_083': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_084': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_085': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_086': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_087': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_088': { type: 'Paramecia', fruitType: 'Soul Manipulation' },
    'fruit_089': { type: 'Special Paramecia', fruitType: 'Substance Creation' },
    'fruit_090': { type: 'Paramecia', fruitType: 'Space Manipulation' },
    'fruit_091': { type: 'Paramecia', fruitType: 'Vibration' },
    'fruit_092': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_093': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_094': { type: 'Paramecia', fruitType: 'Body Enhancement' },
    'fruit_095': { type: 'Paramecia', fruitType: 'Substance Creation' },
    'fruit_096': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_097': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_098': { type: 'Logia', fruitType: 'Biological' },
    'fruit_099': { type: 'Paramecia', fruitType: 'Substance Creation' },
    'fruit_100': { type: 'Logia', fruitType: 'Elemental' },
    'fruit_101': { type: 'Mythical Zoan', fruitType: 'Divine' },
    'fruit_102': { type: 'Paramecia', fruitType: 'Gravity Manipulation' },
    'fruit_103': { type: 'Paramecia', fruitType: 'Repulsion' },
    'fruit_104': { type: 'Paramecia', fruitType: 'Toxin Creation' },
    'fruit_105': { type: 'Paramecia', fruitType: 'Biological Manipulation' },
    'fruit_106': { type: 'Paramecia', fruitType: 'Healing' },
    'fruit_107': { type: 'Paramecia', fruitType: 'Time Manipulation' },
    'fruit_108': { type: 'Paramecia', fruitType: 'Control' },
    'fruit_109': { type: 'Paramecia', fruitType: 'Aging' },
    'fruit_110': { type: 'Paramecia', fruitType: 'Sound Manipulation' },
    'fruit_111': { type: 'Paramecia', fruitType: 'Temperature Manipulation' },
    'fruit_112': { type: 'Paramecia', fruitType: 'Space Manipulation' },
    'fruit_113': { type: 'Paramecia', fruitType: 'Life Manipulation' },
    'fruit_114': { type: 'Paramecia', fruitType: 'Emotion Manipulation' },
    'fruit_115': { type: 'Paramecia', fruitType: 'Illusion Creation' },
    'fruit_116': { type: 'Mythical Zoan', fruitType: 'Divine Beast' },
    'fruit_117': { type: 'Mythical Zoan', fruitType: 'Divine Beast' },
    'fruit_118': { type: 'Mythical Zoan', fruitType: 'Divine Beast' },
    'fruit_119': { type: 'Mythical Zoan', fruitType: 'Divine Beast' },
    'fruit_120': { type: 'Mythical Zoan', fruitType: 'Divine' },
    'fruit_121': { type: 'Mythical Zoan', fruitType: 'Divine Beast' },
    'fruit_122': { type: 'Mythical Zoan', fruitType: 'Divine Beast' },
    'fruit_123': { type: 'Mythical Zoan', fruitType: 'Supernatural' },
    'fruit_124': { type: 'Paramecia', fruitType: 'Death Manipulation' },
    'fruit_125': { type: 'Paramecia', fruitType: 'Time Manipulation' },
    'fruit_126': { type: 'Paramecia', fruitType: 'Infinity Manipulation' },
    'fruit_127': { type: 'Paramecia', fruitType: 'Void Manipulation' },
    'fruit_128': { type: 'Mythical Zoan', fruitType: 'Supernatural' },
    'fruit_129': { type: 'Mythical Zoan', fruitType: 'Divine' },
    'fruit_130': { type: 'Mythical Zoan', fruitType: 'Divine Beast' },
    'fruit_131': { type: 'Mythical Zoan', fruitType: 'Supreme Divine' },
    'fruit_132': { type: 'Mythical Zoan', fruitType: 'Supreme Divine' },
    'fruit_133': { type: 'Mythical Zoan', fruitType: 'Supreme Divine' },
    'fruit_134': { type: 'Mythical Zoan', fruitType: 'Supreme Divine' },
    'fruit_135': { type: 'Mythical Zoan', fruitType: 'Supreme Divine' },
    'fruit_136': { type: 'Mythical Zoan', fruitType: 'Divine Beast' },
    'fruit_137': { type: 'Mythical Zoan', fruitType: 'Divine Beast' },
    'fruit_138': { type: 'Mythical Zoan', fruitType: 'Supreme Divine' },
    'fruit_139': { type: 'Paramecia', fruitType: 'Reality Manipulation' },
    'fruit_140': { type: 'Logia', fruitType: 'Void Manipulation' },
    'fruit_141': { type: 'Logia', fruitType: 'Pure Energy' },
    'fruit_142': { type: 'Paramecia', fruitType: 'Reality Manipulation' },
    'fruit_143': { type: 'Paramecia', fruitType: 'Fusion Manipulation' },
    'fruit_144': { type: 'Paramecia', fruitType: 'Division Manipulation' },
    'fruit_145': { type: 'Paramecia', fruitType: 'Amplification' },
    'fruit_146': { type: 'Mythical Zoan', fruitType: 'Omnipotent' },
    'fruit_147': { type: 'Paramecia', fruitType: 'Omnipotent' },
    'fruit_148': { type: 'Paramecia', fruitType: 'Omnipotent' },
    'fruit_149': { type: 'Paramecia', fruitType: 'Omnipotent' },
    'fruit_150': { type: 'Paramecia', fruitType: 'Omnipotent' }
};

// Type advantages/disadvantages system
const TYPE_COUNTERS = {
    // Paramecia type counters
    'Explosive': { 
        strong: ['Substance Creation', 'Food Creation', 'Barrier Creation'], 
        weak: ['Space Manipulation', 'Void Manipulation', 'Absorption'] 
    },
    'Body Manipulation': { 
        strong: ['Physical', 'Animal', 'Cutting'], 
        weak: ['Elemental', 'Energy', 'Intangible'] 
    },
    'Surface Manipulation': { 
        strong: ['Physical Contact', 'Friction-based'], 
        weak: ['Ranged', 'Elemental', 'Energy'] 
    },
    'Weight Manipulation': { 
        strong: ['Gravity-based', 'Physical'], 
        weak: ['Weightless', 'Energy', 'Intangible'] 
    },
    'Substance Creation': { 
        strong: ['Physical', 'Structural'], 
        weak: ['Corrosion', 'Disintegration', 'Void'] 
    },
    'Time Manipulation': { 
        strong: ['Sequential', 'Causality-based'], 
        weak: ['Timeless', 'Instant', 'Eternal'] 
    },
    'Space Manipulation': { 
        strong: ['Physical', 'Dimensional'], 
        weak: ['Omnipresent', 'Non-spatial', 'Reality-warping'] 
    },
    'Soul Manipulation': { 
        strong: ['Living', 'Spiritual'], 
        weak: ['Soulless', 'Divine Protection', 'Pure Energy'] 
    },
    'Shadow Manipulation': { 
        strong: ['Light-dependent', 'Physical'], 
        weak: ['Pure Light', 'Darkness Immunity', 'Omnipresent Light'] 
    },
    'Memory Manipulation': { 
        strong: ['Conscious', 'Experience-based'], 
        weak: ['Instinctual', 'Divine', 'Absolute Knowledge'] 
    },

    // Zoan type counters
    'Animal': { 
        strong: ['Natural Environment', 'Instinct-based'], 
        weak: ['Supernatural', 'Divine', 'Artificial'] 
    },
    'Insect': { 
        strong: ['Swarm-based', 'Natural'], 
        weak: ['Fire', 'Cold', 'Poison Immunity'] 
    },
    'Prehistoric': { 
        strong: ['Ancient Power', 'Raw Strength'], 
        weak: ['Modern Technology', 'Evolution', 'Divine'] 
    },
    'Divine Beast': { 
        strong: ['Mortal', 'Natural', 'Physical'], 
        weak: ['Supreme Divine', 'Omnipotent', 'Equal Divine'] 
    },
    'Divine': { 
        strong: ['Mortal', 'Supernatural', 'Natural'], 
        weak: ['Supreme Divine', 'Omnipotent', 'Divine Immunity'] 
    },
    'Supreme Divine': { 
        strong: ['Divine', 'Supernatural', 'Mortal'], 
        weak: ['Omnipotent', 'Reality Transcendence'] 
    },
    'Supernatural': { 
        strong: ['Natural', 'Physical', 'Mortal'], 
        weak: ['Divine', 'Holy', 'Pure Energy'] 
    },

    // Logia type counters
    'Elemental': { 
        strong: ['Physical', 'Non-elemental'], 
        weak: ['Opposing Element', 'Absorption', 'Nullification'] 
    },
    'Biological': { 
        strong: ['Living', 'Organic'], 
        weak: ['Inorganic', 'Immunity', 'Purification'] 
    },
    'Pure Energy': { 
        strong: ['Physical', 'Material'], 
        weak: ['Void', 'Absorption', 'Energy Immunity'] 
    },
    'Void Manipulation': { 
        strong: ['Existence', 'Physical', 'Energy'], 
        weak: ['Omnipotent', 'Reality Creation', 'Absolute Existence'] 
    },

    // Special/Advanced type counters
    'Reality Manipulation': { 
        strong: ['Physical Laws', 'Normal Reality'], 
        weak: ['Omnipotent', 'Reality Anchoring', 'Absolute Truth'] 
    },
    'Gravity Manipulation': { 
        strong: ['Physical', 'Mass-based'], 
        weak: ['Massless', 'Anti-gravity', 'Space-time Immunity'] 
    },
    'Life Manipulation': { 
        strong: ['Living', 'Biological'], 
        weak: ['Undead', 'Artificial', 'Divine Life'] 
    },
    'Death Manipulation': { 
        strong: ['Living', 'Mortal'], 
        weak: ['Immortal', 'Undead', 'Divine Protection'] 
    },
    'Infinity Manipulation': { 
        strong: ['Finite', 'Limited'], 
        weak: ['Omnipotent', 'Paradox Immunity', 'Absolute'] 
    },
    'Omnipotent': { 
        strong: ['Everything'], 
        weak: ['Nothing', 'Self-limitation', 'Omnipotent Paradox'] 
    }
};

// Type effectiveness multipliers
const TYPE_EFFECTIVENESS = {
    SUPER_EFFECTIVE: 1.5,    // 50% more damage
    NORMAL: 1.0,             // Normal damage
    NOT_VERY_EFFECTIVE: 0.7, // 30% less damage
    IMMUNE: 0.0              // No damage
};

// Function to get type matchup
function getTypeMatchup(attackerType, defenderType) {
    const counters = TYPE_COUNTERS[attackerType];
    if (!counters) return TYPE_EFFECTIVENESS.NORMAL;
    
    if (counters.strong.includes(defenderType)) {
        return TYPE_EFFECTIVENESS.SUPER_EFFECTIVE;
    } else if (counters.weak.includes(defenderType)) {
        return TYPE_EFFECTIVENESS.NOT_VERY_EFFECTIVE;
    }
    return TYPE_EFFECTIVENESS.NORMAL;
}

// Function to get fruit type info
function getFruitType(fruitId) {
    return FRUIT_TYPES[fruitId];
}

// Function to get fruits by type
function getFruitsByType(fruitType) {
    return Object.entries(FRUIT_TYPES)
        .filter(([id, data]) => data.fruitType === fruitType)
        .map(([id]) => id);
}

// Function to get all unique fruit types
function getAllFruitTypes() {
    const types = new Set();
    Object.values(FRUIT_TYPES).forEach(data => {
        types.add(data.fruitType);
    });
    return Array.from(types).sort();
}

// Function to get type emoji
function getTypeEmoji(fruitType) {
    const emojis = {
        // Paramecia Types
        'Explosive': '💥',
        'Body Manipulation': '🔄',
        'Surface Manipulation': '✨',
        'Weight Manipulation': '⚖️',
        'Substance Creation': '🧪',
        'Consumption': '👄',
        'Binding': '⛓️',
        '
