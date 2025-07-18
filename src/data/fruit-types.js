// src/data/fruit-types.js - Devil Fruit Types and Elements for 149 Canonical Fruits

const FRUIT_TYPES = {
  // =====================================================
  // COMMON FRUITS
  // =====================================================
  "Gomu Gomu no Mi": { type: 'Paramecia', fruitType: 'Rubber' },
  "Bara Bara no Mi": { type: 'Paramecia', fruitType: 'Separation' },
  "Sube Sube no Mi": { type: 'Paramecia', fruitType: 'Smooth' },
  "Bomu Bomu no Mi": { type: 'Paramecia', fruitType: 'Explosion' },
  "Kilo Kilo no Mi": { type: 'Paramecia', fruitType: 'Weight' },
  "Doru Doru no Mi": { type: 'Paramecia', fruitType: 'Wax' },
  "Bane Bane no Mi": { type: 'Paramecia', fruitType: 'Spring' },
  "Supa Supa no Mi": { type: 'Paramecia', fruitType: 'Blade' },
  "Toge Toge no Mi": { type: 'Paramecia', fruitType: 'Spike' },
  "Ori Ori no Mi": { type: 'Paramecia', fruitType: 'Cage' },
  "Baku Baku no Mi": { type: 'Paramecia', fruitType: 'Munch' },
  "Mane Mane no Mi": { type: 'Paramecia', fruitType: 'Clone' },
  "Hana Hana no Mi": { type: 'Paramecia', fruitType: 'Flower' },
  "Shari Shari no Mi": { type: 'Paramecia', fruitType: 'Wheel' },
  "Beri Beri no Mi": { type: 'Paramecia', fruitType: 'Berry' },
  "Sabi Sabi no Mi": { type: 'Paramecia', fruitType: 'Rust' },
  "Shabon Shabon no Mi": { type: 'Paramecia', fruitType: 'Soap' },
  "Awa Awa no Mi": { type: 'Paramecia', fruitType: 'Bubble' },
  "Goe Goe no Mi": { type: 'Paramecia', fruitType: 'Voice' },
  "Hiso Hiso no Mi": { type: 'Paramecia', fruitType: 'Whisper' },
  "Kama Kama no Mi": { type: 'Paramecia', fruitType: 'Sickle' },
  "Kachi Kachi no Mi": { type: 'Paramecia', fruitType: 'Hardness' },
  "Nemu Nemu no Mi": { type: 'Paramecia', fruitType: 'Sleep' },
  "Mini Mini no Mi": { type: 'Paramecia', fruitType: 'Miniature' },

  // =====================================================
  // UNCOMMON FRUITS
  // =====================================================
  "Horo Horo no Mi": { type: 'Paramecia', fruitType: 'Hollow' },
  "Suke Suke no Mi": { type: 'Paramecia', fruitType: 'Clear' },
  "Nikyu Nikyu no Mi": { type: 'Paramecia', fruitType: 'Paw' },
  "Mero Mero no Mi": { type: 'Paramecia', fruitType: 'Love' },
  "Doa Doa no Mi": { type: 'Paramecia', fruitType: 'Door' },
  "Kage Kage no Mi": { type: 'Paramecia', fruitType: 'Shadow' },
  "Horu Horu no Mi": { type: 'Paramecia', fruitType: 'Hormone' },
  "Choki Choki no Mi": { type: 'Paramecia', fruitType: 'Scissors' },
  "Yomi Yomi no Mi": { type: 'Paramecia', fruitType: 'Revive' },
  "Kuma Kuma no Mi": { type: 'Zoan', fruitType: 'Bear' },
  "Ushi Ushi no Mi, Model: Bison": { type: 'Zoan', fruitType: 'Bison' },
  "Hito Hito no Mi": { type: 'Zoan', fruitType: 'Human' },
  "Tori Tori no Mi, Model: Falcon": { type: 'Zoan', fruitType: 'Falcon' },
  "Mogu Mogu no Mi": { type: 'Zoan', fruitType: 'Mole' },
  "Inu Inu no Mi, Model: Dachshund": { type: 'Zoan', fruitType: 'Dachshund' },
  "Inu Inu no Mi, Model: Jackal": { type: 'Zoan', fruitType: 'Jackal' },
  "Tori Tori no Mi, Model: Eagle": { type: 'Zoan', fruitType: 'Eagle' },
  "Saru Saru no Mi": { type: 'Zoan', fruitType: 'Monkey' },
  "Uma Uma no Mi": { type: 'Zoan', fruitType: 'Horse' },
  "Neko Neko no Mi, Model: Leopard": { type: 'Zoan', fruitType: 'Leopard' },
  "Zou Zou no Mi": { type: 'Zoan', fruitType: 'Elephant' },
  "Inu Inu no Mi, Model: Wolf": { type: 'Zoan', fruitType: 'Wolf' },
  "Neko Neko no Mi, Model: Saber Tiger": { type: 'Zoan', fruitType: 'Saber Tiger' },
  "Batto Batto no Mi, Model: Vampire": { type: 'Zoan', fruitType: 'Vampire Bat' },
  "Kumo Kumo no Mi, Model: Rosamygale Grauvogeli": { type: 'Ancient Zoan', fruitType: 'Ancient Spider' },
  "Ryu Ryu no Mi, Model: Spinosaurus": { type: 'Ancient Zoan', fruitType: 'Spinosaurus' },
  "Ryu Ryu no Mi, Model: Pteranodon": { type: 'Ancient Zoan', fruitType: 'Pteranodon' },
  "Ryu Ryu no Mi, Model: Brachiosaurus": { type: 'Ancient Zoan', fruitType: 'Brachiosaurus' },
  "Ryu Ryu no Mi, Model: Allosaurus": { type: 'Ancient Zoan', fruitType: 'Allosaurus' },
  "Ryu Ryu no Mi, Model: Triceratops": { type: 'Ancient Zoan', fruitType: 'Triceratops' },
  "Zou Zou no Mi, Model: Mammoth": { type: 'Ancient Zoan', fruitType: 'Mammoth' },
  "Ryu Ryu no Mi, Model: Pachycephalosaurus": { type: 'Ancient Zoan', fruitType: 'Pachycephalosaurus' },
  "Neko Neko no Mi, Model: Smilodon": { type: 'Ancient Zoan', fruitType: 'Smilodon' },
  "Inu Inu no Mi, Model: Kyubi no Kitsune": { type: 'Mythical Zoan', fruitType: 'Nine-Tailed Fox' },
  "Sara Sara no Mi, Model: Axolotl": { type: 'Zoan', fruitType: 'Axolotl' },

  // =====================================================
  // RARE FRUITS
  // =====================================================
  "Mera Mera no Mi": { type: 'Logia', fruitType: 'Fire' },
  "Hie Hie no Mi": { type: 'Logia', fruitType: 'Ice' },
  "Suna Suna no Mi": { type: 'Logia', fruitType: 'Sand' },
  "Moku Moku no Mi": { type: 'Logia', fruitType: 'Smoke' },
  "Goro Goro no Mi": { type: 'Logia', fruitType: 'Lightning' },
  "Numa Numa no Mi": { type: 'Logia', fruitType: 'Swamp' },
  "Gasu Gasu no Mi": { type: 'Logia', fruitType: 'Gas' },
  "Yuki Yuki no Mi": { type: 'Logia', fruitType: 'Snow' },
  "Beta Beta no Mi": { type: 'Special Paramecia', fruitType: 'Mochi' },
  "Noro Noro no Mi": { type: 'Paramecia', fruitType: 'Slow' },
  "Doku Doku no Mi": { type: 'Paramecia', fruitType: 'Poison' },
  "Hobi Hobi no Mi": { type: 'Paramecia', fruitType: 'Hobby' },
  "Bari Bari no Mi": { type: 'Paramecia', fruitType: 'Barrier' },
  "Nui Nui no Mi": { type: 'Paramecia', fruitType: 'Stitch' },
  "Gura Gura no Mi": { type: 'Paramecia', fruitType: 'Tremor' },
  "Yami Yami no Mi": { type: 'Logia', fruitType: 'Darkness' },
  "Kira Kira no Mi": { type: 'Paramecia', fruitType: 'Twinkle' },
  "Sabi Sabi no Mi": { type: 'Paramecia', fruitType: 'Rust' },
  "Ito Ito no Mi": { type: 'Paramecia', fruitType: 'String' },
  "Zushi Zushi no Mi": { type: 'Paramecia', fruitType: 'Gravity' },

  // =====================================================
  // EPIC FRUITS
  // =====================================================
  "Pika Pika no Mi": { type: 'Logia', fruitType: 'Light' },
  "Magu Magu no Mi": { type: 'Logia', fruitType: 'Magma' },
  "Ope Ope no Mi": { type: 'Paramecia', fruitType: 'Op' },
  "Nikyu Nikyu no Mi, Awakened": { type: 'Paramecia', fruitType: 'Paw' },
  "Mochi Mochi no Mi": { type: 'Special Paramecia', fruitType: 'Mochi' },
  "Memo Memo no Mi": { type: 'Paramecia', fruitType: 'Memo' },
  "Bisu Bisu no Mi": { type: 'Paramecia', fruitType: 'Biscuit' },
  "Pero Pero no Mi": { type: 'Paramecia', fruitType: 'Lick' },
  "Soru Soru no Mi": { type: 'Paramecia', fruitType: 'Soul' },
  "Mira Mira no Mi": { type: 'Paramecia', fruitType: 'Mirror' },
  "Hoya Hoya no Mi": { type: 'Paramecia', fruitType: 'Lamp' },
  "Netsu Netsu no Mi": { type: 'Paramecia', fruitType: 'Heat' },
  "Kuku Kuku no Mi": { type: 'Paramecia', fruitType: 'Cook' },
  "Gocha Gocha no Mi": { type: 'Paramecia', fruitType: 'Gotcha' },
  "Oshi Oshi no Mi": { type: 'Paramecia', fruitType: 'Push' },

  // =====================================================
  // LEGENDARY FRUITS
  // =====================================================
  "Hito Hito no Mi, Model: Nika": { type: 'Mythical Zoan', fruitType: 'Sun God' },
  "Tori Tori no Mi, Model: Phoenix": { type: 'Mythical Zoan', fruitType: 'Phoenix' },
  "Uo Uo no Mi, Model: Seiryu": { type: 'Mythical Zoan', fruitType: 'Azure Dragon' },
  "Hito Hito no Mi, Model: Daibutsu": { type: 'Mythical Zoan', fruitType: 'Great Buddha' },
  "Hebi Hebi no Mi, Model: Yamata-no-Orochi": { type: 'Mythical Zoan', fruitType: 'Eight-Headed Serpent' },
  "Inu Inu no Mi, Model: Okuchi no Makami": { type: 'Mythical Zoan', fruitType: 'Wolf God' },
  "Toki Toki no Mi": { type: 'Paramecia', fruitType: 'Time' },
  "Yami Yami no Mi, Awakened": { type: 'Logia', fruitType: 'Darkness' },
  "Gura Gura no Mi, Awakened": { type: 'Paramecia', fruitType: 'Tremor' },
  "Ope Ope no Mi, Ultimate": { type: 'Paramecia', fruitType: 'Op' },

  // =====================================================
  // MYTHICAL FRUITS
  // =====================================================
  "Hito Hito no Mi, Model: Nika, Awakened": { type: 'Mythical Zoan', fruitType: 'Sun God' },
  "Yami Yami no Mi + Gura Gura no Mi": { type: 'Dual Fruit', fruitType: 'Dark Quake' },
  "Soru Soru no Mi, Awakened": { type: 'Paramecia', fruitType: 'Soul' },
  "Magu Magu no Mi, Awakened": { type: 'Logia', fruitType: 'Magma' },
  "Pika Pika no Mi, Awakened": { type: 'Logia', fruitType: 'Light' },
  "Goro Goro no Mi, Awakened": { type: 'Logia', fruitType: 'Lightning' },
  "Hobi Hobi no Mi, Awakened": { type: 'Paramecia', fruitType: 'Hobby' },

  // =====================================================
  // OMNIPOTENT FRUITS
  // =====================================================
  "Hito Hito no Mi, Model: Nika, Perfect": { type: 'Divine Zoan', fruitType: 'Perfect Sun God' },
  "Im-sama's Power": { type: 'World Sovereign', fruitType: 'World Control' },
  "Joy Boy's Will": { type: 'Ancient Will', fruitType: 'Liberation' },
  "One Piece": { type: 'Legendary Treasure', fruitType: 'Ultimate Dream' },
  "Void Century Weapon": { type: 'Ancient Weapon', fruitType: 'Civilization Ender' }
};

// Type counters - which elements are effective against others
const TYPE_COUNTERS = {
  // Elemental counters
  'Fire': ['Ice', 'Snow', 'Wax', 'Flower'],
  'Ice': ['Fire', 'Magma', 'Lightning'],
  'Water': ['Fire', 'Magma', 'Sand'],
  'Lightning': ['Water', 'Ice', 'Cage'],
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
  'Soul': ['Hollow'],
  'Death': ['Soul', 'Revive'],
  'Chaos': ['Order'],
  'Order': ['Chaos'],
  'Reality': ['Illusion'],
  'Void': ['Creation'],
  'Creation': ['Void'],
  'Sun God': ['All'], // Beats everything except itself
  'Liberation': ['All'], // Ultimate freedom
  'World Control': ['All'], // World sovereign power
  'Ultimate Dream': ['All'], // One Piece power
  'Civilization Ender': ['All'] // Ancient weapon power
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
  'Divine Zoan': '☀️',
  'Dual Fruit': '⚡',
  'World Sovereign': '👑',
  'Ancient Will': '🎺',
  'Legendary Treasure': '💎',
  'Ancient Weapon': '⚔️',
  
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
  'Sun God': '☀️',
  'Liberation': '🎺',
  'World Control': '👑',
  'Ultimate Dream': '💎',
  'Civilization Ender': '⚔️'
};

// Utility functions
function getFruitType(fruitName) {
  return FRUIT_TYPES[fruitName] || { type: 'Paramecia', fruitType: 'Unknown' };
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
    .filter(([fruitName, typeData]) => typeData.type === type)
    .map(([fruitName, typeData]) => ({ fruitName, ...typeData }));
}

function getFruitsByElement(element) {
  return Object.entries(FRUIT_TYPES)
    .filter(([fruitName, typeData]) => typeData.fruitType === element)
    .map(([fruitName, typeData]) => ({ fruitName, ...typeData }));
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

function calculateBattleEffectiveness(attackerFruitName, defenderFruitName) {
  const attackerType = getFruitType(attackerFruitName);
  const defenderType = getFruitType(defenderFruitName);
  
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
    'Sun God': 'Divine power that liberates all',
    'Liberation': 'Freedom from all constraints',
    'World Control': 'Domin
