// src/data/devil-fruits.js - Complete Devil Fruit Database with Elements
const DEVIL_FRUITS = {
    // COMMON FRUITS (40% chance) - 1.0x to 1.5x CP multiplier
    'fruit_001': {
        id: 'fruit_001',
        name: 'Bomu Bomu no Mi',
        type: 'Paramecia',
        rarity: 'common',
        element: 'explosive',
        power: 'User can make any part of their body explode.',
        description: 'Allows the user to make any part of their body explode, including breath and bodily waste.',
        multiplier: 1.0,
        source: 'canon'
    },
    'fruit_002': {
        id: 'fruit_002',
        name: 'Bara Bara no Mi',
        type: 'Paramecia',
        rarity: 'common',
        element: 'slashing',
        power: 'Body can split into pieces and control them separately.',
        description: 'The user can split their body into pieces and control each piece independently.',
        multiplier: 1.1,
        source: 'canon'
    },
    'fruit_003': {
        id: 'fruit_003',
        name: 'Sube Sube no Mi',
        type: 'Paramecia',
        rarity: 'common',
        element: 'defensive',
        power: 'Makes skin perfectly smooth, causing attacks to slip off.',
        description: 'Makes the user\'s skin perfectly smooth, causing most attacks to slip off harmlessly.',
        multiplier: 1.0,
        source: 'canon'
    },
    'fruit_004': {
        id: 'fruit_004',
        name: 'Kilo Kilo no Mi',
        type: 'Paramecia',
        rarity: 'common',
        element: 'gravity',
        power: 'Can change body weight from 1kg to 10,000kg.',
        description: 'Allows the user to change their body weight from 1 kilogram to 10,000 kilograms at will.',
        multiplier: 1.1,
        source: 'canon'
    },
    'fruit_005': {
        id: 'fruit_005',
        name: 'Doru Doru no Mi',
        type: 'Paramecia',
        rarity: 'common',
        element: 'creation',
        power: 'Can produce and manipulate wax.',
        description: 'Allows the user to produce and manipulate wax from their body.',
        multiplier: 1.0,
        source: 'canon'
    },
    
    // Continue with more common fruits...
    'fruit_006': { id: 'fruit_006', name: 'Baku Baku no Mi', type: 'Paramecia', rarity: 'common', element: 'consumption', power: 'Can eat anything and incorporate it into the body.', multiplier: 1.2, source: 'canon' },
    'fruit_007': { id: 'fruit_007', name: 'Ori Ori no Mi', type: 'Paramecia', rarity: 'common', element: 'binding', power: 'Can create iron bonds that restrain opponents.', multiplier: 1.1, source: 'canon' },
    'fruit_008': { id: 'fruit_008', name: 'Bane Bane no Mi', type: 'Paramecia', rarity: 'common', element: 'elastic', power: 'Can turn body parts into springs.', multiplier: 1.0, source: 'canon' },
    'fruit_009': { id: 'fruit_009', name: 'Noro Noro no Mi', type: 'Paramecia', rarity: 'common', element: 'time', power: 'Can emit photons that slow down anything for 30 seconds.', multiplier: 1.3, source: 'canon' },
    'fruit_010': { id: 'fruit_010', name: 'Doa Doa no Mi', type: 'Paramecia', rarity: 'common', element: 'spatial', power: 'Can create doors on any surface.', multiplier: 1.2, source: 'canon' },
    'fruit_011': { id: 'fruit_011', name: 'Awa Awa no Mi', type: 'Paramecia', rarity: 'common', element: 'cleansing', power: 'Can produce soap bubbles that clean anything.', multiplier: 1.0, source: 'canon' },
    'fruit_012': { id: 'fruit_012', name: 'Beri Beri no Mi', type: 'Paramecia', rarity: 'common', element: 'separation', power: 'Can split body into berry-shaped orbs.', multiplier: 1.1, source: 'canon' },
    'fruit_013': { id: 'fruit_013', name: 'Sabi Sabi no Mi', type: 'Paramecia', rarity: 'common', element: 'corrosion', power: 'Can rust any metal by touch.', multiplier: 1.1, source: 'canon' },
    'fruit_014': { id: 'fruit_014', name: 'Shari Shari no Mi', type: 'Paramecia', rarity: 'common', element: 'rotation', power: 'Can make body parts spin like wheels.', multiplier: 1.0, source: 'canon' },
    'fruit_015': { id: 'fruit_015', name: 'Yomi Yomi no Mi', type: 'Paramecia', rarity: 'common', element: 'soul', power: 'Grants a second life and soul-based abilities.', multiplier: 1.4, source: 'canon' },
    'fruit_016': { id: 'fruit_016', name: 'Kage Kage no Mi', type: 'Paramecia', rarity: 'common', element: 'shadow', power: 'Can manipulate shadows and steal them.', multiplier: 1.3, source: 'canon' },
    'fruit_017': { id: 'fruit_017', name: 'Horo Horo no Mi', type: 'Paramecia', rarity: 'common', element: 'ghost', power: 'Can create ghosts that drain willpower.', multiplier: 1.2, source: 'canon' },
    'fruit_018': { id: 'fruit_018', name: 'Suke Suke no Mi', type: 'Paramecia', rarity: 'common', element: 'invisibility', power: 'Can become invisible and make objects invisible.', multiplier: 1.3, source: 'canon' },
    'fruit_019': { id: 'fruit_019', name: 'Choki Choki no Mi', type: 'Paramecia', rarity: 'common', element: 'cutting', power: 'Can turn hands into scissors that cut anything.', multiplier: 1.2, source: 'canon' },
    'fruit_020': { id: 'fruit_020', name: 'Woshu Woshu no Mi', type: 'Paramecia', rarity: 'common', element: 'cleansing', power: 'Can wash and hang anything to dry.', multiplier: 1.1, source: 'canon' },
    'fruit_021': { id: 'fruit_021', name: 'Fuwa Fuwa no Mi', type: 'Paramecia', rarity: 'common', element: 'levitation', power: 'Can make non-living objects float.', multiplier: 1.4, source: 'canon' },
    'fruit_022': { id: 'fruit_022', name: 'Mato Mato no Mi', type: 'Paramecia', rarity: 'common', element: 'targeting', power: 'Can mark targets for homing attacks.', multiplier: 1.2, source: 'canon' },
    'fruit_023': { id: 'fruit_023', name: 'Buki Buki no Mi', type: 'Paramecia', rarity: 'common', element: 'weapon', power: 'Can turn body parts into weapons.', multiplier: 1.3, source: 'canon' },
    'fruit_024': { id: 'fruit_024', name: 'Guru Guru no Mi', type: 'Paramecia', rarity: 'common', element: 'rotation', power: 'Can spin body parts at high speeds.', multiplier: 1.1, source: 'canon' },
    'fruit_025': { id: 'fruit_025', name: 'Beta Beta no Mi', type: 'Paramecia', rarity: 'common', element: 'adhesive', power: 'Can create sticky mucus.', multiplier: 1.1, source: 'canon' },
    'fruit_026': { id: 'fruit_026', name: 'Hira Hira no Mi', type: 'Paramecia', rarity: 'common', element: 'flattening', power: 'Can make objects flat like flags.', multiplier: 1.0, source: 'canon' },
    'fruit_027': { id: 'fruit_027', name: 'Ishi Ishi no Mi', type: 'Paramecia', rarity: 'common', element: 'stone', power: 'Can assimilate with stone.', multiplier: 1.2, source: 'canon' },
    'fruit_028': { id: 'fruit_028', name: 'Nui Nui no Mi', type: 'Paramecia', rarity: 'common', element: 'stitching', power: 'Can stitch things together.', multiplier: 1.0, source: 'canon' },
    'fruit_029': { id: 'fruit_029', name: 'Giro Giro no Mi', type: 'Paramecia', rarity: 'common', element: 'perception', power: 'Can see through anything and read minds.', multiplier: 1.3, source: 'canon' },
    'fruit_030': { id: 'fruit_030', name: 'Ato Ato no Mi', type: 'Paramecia', rarity: 'common', element: 'art', power: 'Can turn people into art.', multiplier: 1.1, source: 'canon' },
    'fruit_031': { id: 'fruit_031', name: 'Jake Jake no Mi', type: 'Paramecia', rarity: 'common', element: 'control', power: 'Can become a controlling jacket.', multiplier: 1.2, source: 'canon' },
    'fruit_032': { id: 'fruit_032', name: 'Mira Mira no Mi', type: 'Paramecia', rarity: 'common', element: 'reflection', power: 'Can create mirror portals.', multiplier: 1.3, source: 'canon' },
    'fruit_033': { id: 'fruit_033', name: 'Bisu Bisu no Mi', type: 'Paramecia', rarity: 'common', element: 'creation', power: 'Can create hard biscuits.', multiplier: 1.1, source: 'canon' },
    'fruit_034': { id: 'fruit_034', name: 'Pero Pero no Mi', type: 'Paramecia', rarity: 'common', element: 'candy', power: 'Can create and control candy.', multiplier: 1.2, source: 'canon' },
    'fruit_035': { id: 'fruit_035', name: 'Bata Bata no Mi', type: 'Paramecia', rarity: 'common', element: 'slippery', power: 'Can create slippery butter.', multiplier: 1.0, source: 'canon' },
    'fruit_036': { id: 'fruit_036', name: 'Shibo Shibo no Mi', type: 'Paramecia', rarity: 'common', element: 'extraction', power: 'Can wring moisture from anything.', multiplier: 1.1, source: 'canon' },
    'fruit_037': { id: 'fruit_037', name: 'Memo Memo no Mi', type: 'Paramecia', rarity: 'common', element: 'memory', power: 'Can manipulate memories.', multiplier: 1.4, source: 'canon' },
    'fruit_038': { id: 'fruit_038', name: 'Buku Buku no Mi', type: 'Paramecia', rarity: 'common', element: 'book', power: 'Can trap people in books.', multiplier: 1.2, source: 'canon' },
    'fruit_039': { id: 'fruit_039', name: 'Kuri Kuri no Mi', type: 'Paramecia', rarity: 'common', element: 'cream', power: 'Can create cream.', multiplier: 1.0, source: 'canon' },
    'fruit_040': { id: 'fruit_040', name: 'Tama Tama no Mi', type: 'Zoan', rarity: 'common', element: 'evolution', power: 'Can evolve through defeats.', multiplier: 1.1, source: 'canon' },
    'fruit_041': { id: 'fruit_041', name: 'Kame Kame no Mi', type: 'Zoan', rarity: 'common', element: 'turtle', power: 'Can transform into a turtle.', multiplier: 1.2, source: 'canon' },
    'fruit_042': { id: 'fruit_042', name: 'Mushi Mushi no Mi, Model: Kabutomushi', type: 'Zoan', rarity: 'common', element: 'insect', power: 'Can transform into a beetle.', multiplier: 1.1, source: 'canon' },
    'fruit_043': { id: 'fruit_043', name: 'Mushi Mushi no Mi, Model: Suzumebachi', type: 'Zoan', rarity: 'common', element: 'insect', power: 'Can transform into a hornet.', multiplier: 1.2, source: 'canon' },
    'fruit_044': { id: 'fruit_044', name: 'Poke Poke no Mi', type: 'Paramecia', rarity: 'common', element: 'pocket', power: 'Can create pockets in surfaces.', multiplier: 1.0, source: 'canon' },
    'fruit_045': { id: 'fruit_045', name: 'Kuku Kuku no Mi', type: 'Paramecia', rarity: 'common', element: 'cooking', power: 'Can create baked goods.', multiplier: 1.0, source: 'canon' },
    'fruit_046': { id: 'fruit_046', name: 'Gocha Gocha no Mi', type: 'Paramecia', rarity: 'common', element: 'merging', power: 'Can merge with objects.', multiplier: 1.1, source: 'canon' },
    'fruit_047': { id: 'fruit_047', name: 'Hiso Hiso no Mi', type: 'Paramecia', rarity: 'common', element: 'communication', power: 'Can communicate with animals.', multiplier: 1.0, source: 'anime' },
    'fruit_048': { id: 'fruit_048', name: 'Mini Mini no Mi', type: 'Paramecia', rarity: 'common', element: 'size', power: 'Can shrink objects and self.', multiplier: 1.1, source: 'anime' },
    'fruit_049': { id: 'fruit_049', name: 'Ton Ton no Mi', type: 'Paramecia', rarity: 'common', element: 'weight', power: 'Can change weight exponentially.', multiplier: 1.3, source: 'canon' },
    'fruit_050': { id: 'fruit_050', name: 'Mero Mero no Mi', type: 'Paramecia', rarity: 'common', element: 'petrification', power: 'Can turn those attracted to user into stone.', multiplier: 1.5, source: 'canon' },

    // UNCOMMON FRUITS (30% chance) - 1.5x to 2.5x CP multiplier
    'fruit_051': {
        id: 'fruit_051',
        name: 'Gomu Gomu no Mi',
        type: 'Paramecia',
        rarity: 'uncommon',
        element: 'rubber',
        power: 'Grants rubber body properties.',
        description: 'Rubber body immune to blunt attacks and electricity. True nature revealed as Hito Hito no Mi Model: Nika.',
        multiplier: 2.5,
        source: 'canon'
    },
    'fruit_052': { id: 'fruit_052', name: 'Hana Hana no Mi', type: 'Paramecia', rarity: 'uncommon', element: 'sprouting', power: 'Can sprout body parts anywhere.', multiplier: 2.0, source: 'canon' },
    'fruit_053': { id: 'fruit_053', name: 'Bari Bari no Mi', type: 'Paramecia', rarity: 'uncommon', element: 'barrier', power: 'Can create unbreakable barriers.', multiplier: 2.2, source: 'canon' },
    'fruit_054': { id: 'fruit_054', name: 'Nagi Nagi no Mi', type: 'Paramecia', rarity: 'uncommon', element: 'silence', power: 'Can create soundproof barriers.', multiplier: 1.8, source: 'canon' },
    'fruit_055': { id: 'fruit_055', name: 'Hobi Hobi no Mi', type: 'Paramecia', rarity: 'uncommon', element: 'toy', power: 'Can turn people into toys.', multiplier: 2.4, source: 'canon' },
    'fruit_056': { id: 'fruit_056', name: 'Sui Sui no Mi', type: 'Paramecia', rarity: 'uncommon', element: 'swimming', power: 'Can swim through solid surfaces.', multiplier: 1.9, source: 'canon' },
    'fruit_057': { id: 'fruit_057', name: 'Zou Zou no Mi', type: 'Zoan', rarity: 'uncommon', element: 'elephant', power: 'Can transform into elephant.', multiplier: 2.0, source: 'canon' },
    'fruit_058': { id: 'fruit_058', name: 'Inu Inu no Mi, Model: Wolf', type: 'Zoan', rarity: 'uncommon', element: 'wolf', power: 'Can transform into wolf.', multiplier: 2.1, source: 'canon' },
    'fruit_059': { id: 'fruit_059', name: 'Neko Neko no Mi, Model: Leopard', type: 'Zoan', rarity: 'uncommon', element: 'cat', power: 'Can transform into leopard.', multiplier: 2.3, source: 'canon' },
    'fruit_060': { id: 'fruit_060', name: 'Ushi Ushi no Mi, Model: Bison', type: 'Zoan', rarity: 'uncommon', element: 'bull', power: 'Can transform into bison.', multiplier: 2.0, source: 'canon' },
    'fruit_061': { id: 'fruit_061', name: 'Ushi Ushi no Mi, Model: Giraffe', type: 'Zoan', rarity: 'uncommon', element: 'giraffe', power: 'Can transform into giraffe.', multiplier: 1.9, source: 'canon' },
    'fruit_062': { id: 'fruit_062', name: 'Inu Inu no Mi, Model: Jackal', type: 'Zoan', rarity: 'uncommon', element: 'jackal', power: 'Can transform into jackal.', multiplier: 2.0, source: 'canon' },
    'fruit_063': { id: 'fruit_063', name: 'Tori Tori no Mi, Model: Falcon', type: 'Zoan', rarity: 'uncommon', element: 'bird', power: 'Can transform into falcon.', multiplier: 2.1, source: 'canon' },
    'fruit_064': { id: 'fruit_064', name: 'Mogu Mogu no Mi', type: 'Zoan', rarity: 'uncommon', element: 'mole', power: 'Can transform into mole.', multiplier: 1.7, source: 'canon' },
    'fruit_065': { id: 'fruit_065', name: 'Inu Inu no Mi, Model: Dachshund', type: 'Zoan', rarity: 'uncommon', element: 'dog', power: 'Can transform into dachshund.', multiplier: 1.6, source: 'canon' },
    'fruit_066': { id: 'fruit_066', name: 'Sara Sara no Mi, Model: Axolotl', type: 'Zoan', rarity: 'uncommon', element: 'salamander', power: 'Can transform into axolotl.', multiplier: 1.8, source: 'canon' },
    'fruit_067': { id: 'fruit_067', name: 'Ryu Ryu no Mi, Model: Allosaurus', type: 'Ancient Zoan', rarity: 'uncommon', element: 'ancient', power: 'Can transform into Allosaurus.', multiplier: 2.4, source: 'canon' },
    'fruit_068': { id: 'fruit_068', name: 'Ryu Ryu no Mi, Model: Spinosaurus', type: 'Ancient Zoan', rarity: 'uncommon', element: 'ancient', power: 'Can transform into Spinosaurus.', multiplier: 2.5, source: 'canon' },
    'fruit_069': { id: 'fruit_069', name: 'Ryu Ryu no Mi, Model: Pteranodon', type: 'Ancient Zoan', rarity: 'uncommon', element: 'ancient', power: 'Can transform into Pteranodon.', multiplier: 2.3, source: 'canon' },
    'fruit_070': { id: 'fruit_070', name: 'Ryu Ryu no Mi, Model: Brachiosaurus', type: 'Ancient Zoan', rarity: 'uncommon', element: 'ancient', power: 'Can transform into Brachiosaurus.', multiplier: 2.2, source: 'canon' },
    'fruit_071': { id: 'fruit_071', name: 'Ryu Ryu no Mi, Model: Mammoth', type: 'Ancient Zoan', rarity: 'uncommon', element: 'ancient', power: 'Can transform into Mammoth.', multiplier: 2.4, source: 'canon' },
    'fruit_072': { id: 'fruit_072', name: 'Ryu Ryu no Mi, Model: Triceratops', type: 'Ancient Zoan', rarity: 'uncommon', element: 'ancient', power: 'Can transform into Triceratops.', multiplier: 2.3, source: 'canon' },
    'fruit_073': { id: 'fruit_073', name: 'Ryu Ryu no Mi, Model: Pachycephalosaurus', type: 'Ancient Zoan', rarity: 'uncommon', element: 'ancient', power: 'Can transform into Pachycephalosaurus.', multiplier: 2.1, source: 'canon' },
    'fruit_074': { id: 'fruit_074', name: 'Ryu Ryu no Mi, Model: Saber-tooth Tiger', type: 'Ancient Zoan', rarity: 'uncommon', element: 'ancient', power: 'Can transform into Saber-tooth Tiger.', multiplier: 2.4, source: 'canon' },
    'fruit_075': { id: 'fruit_075', name: 'Kumo Kumo no Mi, Model: Rosamygale Grauvogeli', type: 'Ancient Zoan', rarity: 'uncommon', element: 'ancient', power: 'Can transform into ancient spider.', multiplier: 2.0, source: 'canon' },

    // RARE FRUITS (20% chance) - 2.5x to 4.0x CP multiplier
    'fruit_076': {
        id: 'fruit_076',
        name: 'Moku Moku no Mi',
        type: 'Logia',
        rarity: 'rare',
        element: 'smoke',
        power: 'Can create, control, and become smoke.',
        description: 'Allows the user to create, control, and transform into smoke at will.',
        multiplier: 3.0,
        source: 'canon'
    },
    'fruit_077': { id: 'fruit_077', name: 'Mera Mera no Mi', type: 'Logia', rarity: 'rare', element: 'fire', power: 'Can create, control, and become fire.', multiplier: 3.5, source: 'canon' },
    'fruit_078': { id: 'fruit_078', name: 'Suna Suna no Mi', type: 'Logia', rarity: 'rare', element: 'sand', power: 'Can create, control, and become sand.', multiplier: 3.2, source: 'canon' },
    'fruit_079': { id: 'fruit_079', name: 'Goro Goro no Mi', type: 'Logia', rarity: 'rare', element: 'lightning', power: 'Can create, control, and become lightning.', multiplier: 3.8, source: 'canon' },
    'fruit_080': { id: 'fruit_080', name: 'Hie Hie no Mi', type: 'Logia', rarity: 'rare', element: 'ice', power: 'Can create, control, and become ice.', multiplier: 3.6, source: 'canon' },
    'fruit_081': { id: 'fruit_081', name: 'Yami Yami no Mi', type: 'Logia', rarity: 'rare', element: 'darkness', power: 'Can create and control darkness, absorb attacks.', multiplier: 4.0, source: 'canon' },
    'fruit_082': { id: 'fruit_082', name: 'Pika Pika no Mi', type: 'Logia', rarity: 'rare', element: 'light', power: 'Can create, control, and become light.', multiplier: 3.9, source: 'canon' },
    'fruit_083': { id: 'fruit_083', name: 'Magu Magu no Mi', type: 'Logia', rarity: 'rare', element: 'magma', power: 'Can create, control, and become magma.', multiplier: 4.0, source: 'canon' },
    'fruit_084': { id: 'fruit_084', name: 'Numa Numa no Mi', type: 'Logia', rarity: 'rare', element: 'swamp', power: 'Can create, control, and become swamp.', multiplier: 3.1, source: 'canon' },
    'fruit_085': { id: 'fruit_085', name: 'Gasu Gasu no Mi', type: 'Logia', rarity: 'rare', element: 'gas', power: 'Can create, control, and become gas.', multiplier: 3.3, source: 'canon' },
    'fruit_086': { id: 'fruit_086', name: 'Yuki Yuki no Mi', type: 'Logia', rarity: 'rare', element: 'snow', power: 'Can create, control, and become snow.', multiplier: 3.0, source: 'canon' },
    'fruit_087': { id: 'fruit_087', name: 'Mori Mori no Mi', type: 'Logia', rarity: 'rare', element: 'forest', power: 'Can create, control, and become forest.', multiplier: 3.4, source: 'canon' },
    'fruit_088': { id: 'fruit_088', name: 'Soru Soru no Mi', type: 'Paramecia', rarity: 'rare', element: 'soul', power: 'Can manipulate souls and lifespan.', multiplier: 3.7, source: 'canon' },
    'fruit_089': { id: 'fruit_089', name: 'Mochi Mochi no Mi', type: 'Special Paramecia', rarity: 'rare', element: 'mochi', power: 'Can create and become mochi.', multiplier: 3.5, source: 'canon' },
    'fruit_090': { id: 'fruit_090', name: 'Ope Ope no Mi', type: 'Paramecia', rarity: 'rare', element: 'surgery', power: 'Can create spherical operating rooms.', multiplier: 3.8, source: 'canon' },
    'fruit_091': { id: 'fruit_091', name: 'Gura Gura no Mi', type: 'Paramecia', rarity: 'rare', element: 'vibration', power: 'Can create earthquakes and shockwaves.', multiplier: 4.0, source: 'canon' },
    'fruit_092': { id: 'fruit_092', name: 'Kaze Kaze no Mi', type: 'Logia', rarity: 'rare', element: 'wind', power: 'Can create, control, and become wind.', multiplier: 3.2, source: 'theoretical' },
    'fruit_093': { id: 'fruit_093', name: 'Denki Denki no Mi', type: 'Logia', rarity: 'rare', element: 'electricity', power: 'Can create, control, and become electricity.', multiplier: 3.6, source: 'theoretical' },
    'fruit_094': { id: 'fruit_094', name: 'Tetsu Tetsu no Mi', type: 'Paramecia', rarity: 'rare', element: 'metal', power: 'Can turn body into steel.', multiplier: 3.0, source: 'theoretical' },
    'fruit_095': { id: 'fruit_095', name: 'Kin Kin no Mi', type: 'Paramecia', rarity: 'rare', element: 'gold', power: 'Can create and control gold.', multiplier: 3.3, source: 'movie' },
    'fruit_096': { id: 'fruit_096', name: 'Tsuchi Tsuchi no Mi', type: 'Logia', rarity: 'rare', element: 'earth', power: 'Can create, control, and become earth.', multiplier: 3.1, source: 'theoretical' },
    'fruit_097': { id: 'fruit_097', name: 'Kuki Kuki no Mi', type: 'Logia', rarity: 'rare', element: 'air', power: 'Can create, control, and become air.', multiplier: 3.4, source: 'theoretical' },
    'fruit_098': { id: 'fruit_098', name: 'Chi Chi no Mi', type: 'Logia', rarity: 'rare', element: 'blood', power: 'Can create, control, and become blood.', multiplier: 3.7, source: 'theoretical' },
    'fruit_099': { id: 'fruit_099', name: 'Kori Kori no Mi', type: 'Paramecia', rarity: 'rare', element: 'crystal', power: 'Can create and control crystal.', multiplier: 3.0, source: 'theoretical' },
    'fruit_100': { id: 'fruit_100', name: 'Mizu Mizu no Mi', type: 'Logia', rarity: 'rare', element: 'water', power: 'Can create, control, and become water.', multiplier: 3.9, source: 'theoretical' },

    // EPIC FRUITS (7% chance) - 4.0x to 6.0x CP multiplier
    'fruit_101': {
        id: 'fruit_101',
        name: 'Hito Hito no Mi, Model: Daibutsu',
        type: 'Mythical Zoan',
        rarity: 'epic',
        element: 'buddha',
        power: 'Can transform into a giant golden Buddha.',
        description: 'Transforms the user into a giant golden Buddha with immense physical power and shockwave abilities.',
        multiplier: 5.0,
        source: 'canon'
    },
    'fruit_102': { id: 'fruit_102', name: 'Zushi Zushi no Mi', type: 'Paramecia', rarity: 'epic', element: 'gravity', power: 'Can control gravity.', multiplier: 5.2, source: 'canon' },
    'fruit_103': { id: 'fruit_103', name: 'Nikyu Nikyu no Mi', type: 'Paramecia', rarity: 'epic', element: 'repel', power: 'Can repel anything with paw pads.', multiplier: 5.5, source: 'canon' },
    'fruit_104': { id: 'fruit_104', name: 'Doku Doku no Mi', type: 'Paramecia', rarity: 'epic', element: 'poison', power: 'Can create and control poison.', multiplier: 4.8, source: 'canon' },
    'fruit_105': { id: 'fruit_105', name: 'Horm Horm no Mi', type: 'Paramecia', rarity: 'epic', element: 'hormone', power: 'Can control hormones.', multiplier: 4.5, source: 'canon' },
    'fruit_106': { id: 'fruit_106', name: 'Chyu Chyu no Mi', type: 'Paramecia', rarity: 'epic', element: 'healing', power: 'Can heal any injury.', multiplier: 4.2, source: 'canon' },
    'fruit_107': { id: 'fruit_107', name: 'Toki Toki no Mi', type: 'Paramecia', rarity: 'epic', element: 'time', power: 'Can send people forward in time.', multiplier: 6.0, source: 'canon' },
    'fruit_108': { id: 'fruit_108', name: 'Kibi Kibi no Mi', type: 'Paramecia', rarity: 'epic', element: 'taming', power: 'Can tame animals with dango.', multiplier: 4.0, source: 'canon' },
    'fruit_109': { id: 'fruit_109', name: 'Juku Juku no Mi', type: 'Paramecia', rarity: 'epic', element: 'aging', power: 'Can age anything touched.', multiplier: 4.6, source: 'canon' },
    'fruit_110': { id: 'fruit_110', name: 'Basu Basu no Mi', type: 'Paramecia', rarity: 'epic', element: 'sound', power: 'Can control sound and vibrations.', multiplier: 4.4, source: 'theoretical' },
    'fruit_111': { id: 'fruit_111', name: 'Rei Rei no Mi', type: 'Paramecia', rarity: 'epic', element: 'temperature', power: 'Can control temperature.', multiplier: 4.7, source: 'theoretical' },
    'fruit_112': { id: 'fruit_112', name: 'Kuukan Kuukan no Mi', type: 'Paramecia', rarity: 'epic', element: 'space', power: 'Can manipulate space.', multiplier: 5.8, source: 'theoretical' },
    'fruit_113': { id: 'fruit_113', name: 'Sei Sei no Mi', type: 'Paramecia', rarity: 'epic', element: 'life', power: 'Can control life force.', multiplier: 5.5, source: 'theoretical' },
    'fruit_114': { id: 'fruit_114', name: 'Kokoro Kokoro no Mi', type: 'Paramecia', rarity: 'epic', element: 'emotion', power: 'Can read and control emotions.', multiplier: 4.3, source: 'theoretical' },
    'fruit_115': { id: 'fruit_115', name: 'Gensou Gensou no Mi', type: 'Paramecia', rarity: 'epic', element: 'illusion', power: 'Can create illusions.', multiplier: 4.9, source: 'theoretical' },

    // LEGENDARY FRUITS (2.5% chance) - 6.0x to 8.0x CP multiplier
    'fruit_116': {
        id: 'fruit_116',
        name: 'Uo Uo no Mi, Model: Seiryu',
        type: 'Mythical Zoan',
        rarity: 'legendary',
        element: 'dragon',
        power: 'Can transform into an Azure Dragon.',
        description: 'Allows transformation into a massive Azure Dragon with control over elements and devastating power.',
        multiplier: 7.5,
        source: 'canon'
    },
    'fruit_117': { id: 'fruit_117', name: 'Inu Inu no Mi, Model: Okuchi no Makami', type: 'Mythical Zoan', rarity: 'legendary', element: 'wolf-deity', power: 'Can transform into a wolf deity.', multiplier: 7.0, source: 'canon' },
    'fruit_118': { id: 'fruit_118', name: 'Hebi Hebi no Mi, Model: Yamata-no-Orochi', type: 'Mythical Zoan', rarity: 'legendary', element: 'serpent', power: 'Can transform into eight-headed dragon.', multiplier: 6.5, source: 'canon' },
    'fruit_119': { id: 'fruit_119', name: 'Tori Tori no Mi, Model: Phoenix', type: 'Mythical Zoan', rarity: 'legendary', element: 'phoenix', power: 'Can transform into immortal phoenix.', multiplier: 7.2, source: 'canon' },
    'fruit_120': { id: 'fruit_120', name: 'Hito Hito no Mi, Model: Onyudo', type: 'Mythical Zoan', rarity: 'legendary', element: 'monk-spirit', power: 'Can transform into giant monk spirit.', multiplier: 6.8, source: 'canon' },
    'fruit_121': { id: 'fruit_121', name: 'Inu Inu no Mi, Model: Nine-Tailed Fox', type: 'Mythical Zoan', rarity: 'legendary', element: 'fox-spirit', power: 'Can transform into nine-tailed fox.', multiplier: 7.0, source: 'canon' },
    'fruit_122': { id: 'fruit_122', name: 'Uma Uma no Mi, Model: Pegasus', type: 'Mythical Zoan', rarity: 'legendary', element: 'pegasus', power: 'Can transform into winged horse.', multiplier: 6.7, source: 'canon' },
    'fruit_123': { id: 'fruit_123', name: 'Batto Batto no Mi, Model: Vampire', type: 'Mythical Zoan', rarity: 'legendary', element: 'vampire', power: 'Can transform into vampire bat.', multiplier: 6.9, source: 'non-canon' },
    'fruit_124': { id: 'fruit_124', name: 'Shi Shi no Mi', type: 'Paramecia', rarity: 'legendary', element: 'death', power: 'Can control life and death.', multiplier: 8.0, source: 'theoretical' },
    'fruit_125': { id: 'fruit_125', name: 'Jikan Jikan no Mi', type: 'Paramecia', rarity: 'legendary', element: 'time', power: 'Can manipulate time freely.', multiplier: 7.8, source: 'theoretical' },
    'fruit_126': { id: 'fruit_126', name: 'Mugen Mugen no Mi', type: 'Paramecia', rarity: 'legendary', element: 'infinity', power: 'Can create infinite quantities.', multiplier: 7.5, source: 'theoretical' },
    'fruit_127': { id: 'fruit_127', name: 'Zero Zero no Mi', type: 'Paramecia', rarity: 'legendary', element: 'void', power: 'Can reduce anything to zero.', multiplier: 7.7, source: 'theoretical' },
    'fruit_128': { id: 'fruit_128', name: 'Akuma Akuma no Mi', type: 'Mythical Zoan', rarity: 'legendary', element: 'demon', power: 'Can transform into demon lord.', multiplier: 7.3, source: 'theoretical' },
    'fruit_129': { id: 'fruit_129', name: 'Tenshi Tenshi no Mi', type: 'Mythical Zoan', rarity: 'legendary', element: 'angel', power: 'Can transform into archangel.', multiplier: 7.4, source: 'theoretical' },
    'fruit_130': { id: 'fruit_130', name: 'Ryuu Ryuu no Mi, Model: Eastern Dragon', type: 'Mythical Zoan', rarity: 'legendary', element: 'dragon', power: 'Can transform into Eastern Dragon.', multiplier: 7.6, source: 'theoretical' },

    // MYTHICAL FRUITS (0.4% chance) - 8.0x to 10.0x CP multiplier
    'fruit_131': {
        id: 'fruit_131',
        name: 'Hito Hito no Mi, Model: Nika',
        type: 'Mythical Zoan',
        rarity: 'mythical',
        element: 'sun-god',
        power: 'Can transform into the Sun God Nika.',
        description: 'The legendary Sun God fruit that grants reality-warping rubber powers and brings joy and freedom.',
        multiplier: 10.0,
        source: 'canon'
    },
    'fruit_132': { id: 'fruit_132', name: 'Hito Hito no Mi, Model: Raijin', type: 'Mythical Zoan', rarity: 'mythical', element: 'thunder-god', power: 'Can transform into Thunder God.', multiplier: 9.5, source: 'theoretical' },
    'fruit_133': { id: 'fruit_133', name: 'Hito Hito no Mi, Model: Susanoo', type: 'Mythical Zoan', rarity: 'mythical', element: 'storm-god', power: 'Can transform into Storm God.', multiplier: 9.7, source: 'theoretical' },
    'fruit_134': { id: 'fruit_134', name: 'Kami Kami no Mi, Model: Amaterasu', type: 'Mythical Zoan', rarity: 'mythical', element: 'sun-goddess', power: 'Can transform into Sun Goddess.', multiplier: 9.8, source: 'theoretical' },
    'fruit_135': { id: 'fruit_135', name: 'Kami Kami no Mi, Model: Tsukuyomi', type: 'Mythical Zoan', rarity: 'mythical', element: 'moon-god', power: 'Can transform into Moon God.', multiplier: 9.6, source: 'theoretical' },
    'fruit_136': { id: 'fruit_136', name: 'Tora Tora no Mi, Model: White Tiger', type: 'Mythical Zoan', rarity: 'mythical', element: 'tiger-deity', power: 'Can transform into White Tiger deity.', multiplier: 9.2, source: 'theoretical' },
    'fruit_137': { id: 'fruit_137', name: 'Kitsune Kitsune no Mi, Model: Kyubi', type: 'Mythical Zoan', rarity: 'mythical', element: 'fox-deity', power: 'Can transform into nine-tailed fox spirit.', multiplier: 9.3, source: 'theoretical' },
    'fruit_138': { id: 'fruit_138', name: 'Shinigami Shinigami no Mi', type: 'Mythical Zoan', rarity: 'mythical', element: 'death-god', power: 'Can transform into death god.', multiplier: 9.9, source: 'theoretical' },
    'fruit_139': { id: 'fruit_139', name: 'Yume Yume no Mi', type: 'Paramecia', rarity: 'mythical', element: 'dream', power: 'Can control dreams and reality.', multiplier: 9.4, source: 'theoretical' },
    'fruit_140': { id: 'fruit_140', name: 'Kuro Kuro no Mi', type: 'Logia', rarity: 'mythical', element: 'void', power: 'Can create, control, and become void.', multiplier: 9.0, source: 'theoretical' },
    'fruit_141': { id: 'fruit_141', name: 'Shiro Shiro no Mi', type: 'Logia', rarity: 'mythical', element: 'pure-light', power: 'Can create, control, and become pure light.', multiplier: 9.1, source: 'theoretical' },
    'fruit_142': { id: 'fruit_142', name: 'Henka Henka no Mi', type: 'Paramecia', rarity: 'mythical', element: 'transformation', power: 'Can transform anything into anything.', multiplier: 8.8, source: 'theoretical' },
    'fruit_143': { id: 'fruit_143', name: 'Yuugou Yuugou no Mi', type: 'Paramecia', rarity: 'mythical', element: 'fusion', power: 'Can fuse any two things together.', multiplier: 8.5, source: 'theoretical' },
    'fruit_144': { id: 'fruit_144', name: 'Bunretsu Bunretsu no Mi', type: 'Paramecia', rarity: 'mythical', element: 'division', power: 'Can divide anything infinitely.', multiplier: 8.7, source: 'theoretical' },
    'fruit_145': { id: 'fruit_145', name: 'Zouryoku Zouryoku no Mi', type: 'Paramecia', rarity: 'mythical', element: 'amplification', power: 'Can amplify anything to infinite levels.', multiplier: 8.9, source: 'theoretical' },

    // OMNIPOTENT FRUITS (0.1% chance) - 10.0x to 12.0x CP multiplier
    'fruit_146': {
        id: 'fruit_146',
        name: 'Kami Kami no Mi',
        type: 'Mythical Zoan',
        rarity: 'omnipotent',
        element: 'deity',
        power: 'Can become a true deity.',
        description: 'The ultimate mythical fruit that grants true godhood and control over all aspects of reality.',
        multiplier: 12.0,
        source: 'theoretical'
    },
    'fruit_147': { id: 'fruit_147', name: 'Sekai Sekai no Mi', type: 'Paramecia', rarity: 'omnipotent', element: 'world', power: 'Can control the world itself.', multiplier: 11.8, source: 'theoretical' },
    'fruit_148': { id: 'fruit_148', name: 'Uchuu Uchuu no Mi', type: 'Paramecia', rarity: 'omnipotent', element: 'universe', power: 'Can manipulate the universe.', multiplier: 11.9, source: 'theoretical' },
    'fruit_149': { id: 'fruit_149', name: 'Sonzai Sonzai no Mi', type: 'Paramecia', rarity: 'omnipotent', element: 'existence', power: 'Can control existence itself.', multiplier: 11.7, source: 'theoretical' },
    'fruit_150': { id: 'fruit_150', name: 'Subete Subete no Mi', type: 'Paramecia', rarity: 'omnipotent', element: 'all', power: 'Can control everything in existence.', multiplier: 11.5, source: 'theoretical' }
};

// Rarity distribution
const RARITY_RATES = {
    common: 0.40,       // 40%
    uncommon: 0.30,     // 30%
    rare: 0.20,         // 20%
    epic: 0.07,         // 7%
    legendary: 0.025,   // 2.5%
    mythical: 0.004,    // 0.4%
    omnipotent: 0.001   // 0.1%
};

// Element counter system
const ELEMENT_COUNTERS = {
    fire: { strong: ['ice', 'forest', 'gas'], weak: ['water', 'magma', 'sand'] },
    water: { strong: ['fire', 'magma', 'earth'], weak: ['ice', 'lightning', 'forest'] },
    ice: { strong: ['water', 'wind', 'forest'], weak: ['fire', 'magma', 'lightning'] },
    lightning: { strong: ['water', 'metal', 'wind'], weak: ['rubber', 'earth', 'insulation'] },
    earth: { strong: ['lightning', 'fire', 'wind'], weak: ['water', 'forest', 'vibration'] },
    wind: { strong: ['earth', 'gas', 'sound'], weak: ['fire', 'lightning', 'gravity'] },
    light: { strong: ['darkness', 'shadow', 'ghost'], weak: ['reflection', 'prism', 'void'] },
    darkness: { strong: ['light', 'soul', 'spirit'], weak: ['fire', 'lightning', 'pure-light'] },
    gravity: { strong: ['wind', 'levitation', 'flight'], weak: ['space', 'void', 'weightless'] },
    space: { strong: ['gravity', 'time', 'dimension'], weak: ['reality', 'existence', 'void'] },
    time: { strong: ['space', 'causality', 'fate'], weak: ['eternity', 'infinity', 'timeless'] },
    soul: { strong: ['body', 'mind', 'spirit'], weak: ['death', 'void', 'existence'] },
    vibration: { strong: ['solid', 'structure', 'earth'], weak: ['liquid', 'gas', 'void'] },
    poison: { strong: ['organic', 'life', 'healing'], weak: ['immunity', 'purification', 'antidote'] },
    metal: { strong: ['cutting', 'piercing', 'conduct'], weak: ['corrosion', 'rust', 'magnet'] },
    rubber: { strong: ['lightning', 'blunt', 'bounce'], weak: ['cutting', 'piercing', 'fire'] },
    explosion: { strong: ['structure', 'barrier', 'solid'], weak: ['absorption', 'void', 'immunity'] },
    
    // Mythical elements
    'sun-god': { strong: ['darkness', 'evil', 'shadow'], weak: ['moon', 'void', 'eclipse'] },
    'moon-god': { strong: ['illusion', 'dream', 'tide'], weak: ['sun', 'light', 'reality'] },
    'thunder-god': { strong: ['storm', 'sky', 'divine'], weak: ['earth', 'grounding', 'silence'] },
    'storm-god': { strong: ['weather', 'chaos', 'destruction'], weak: ['calm', 'peace', 'order'] },
    'death-god': { strong: ['life', 'soul', 'existence'], weak: ['immortal', 'resurrection', 'eternal'] },
    'deity': { strong: ['mortal', 'human', 'physical'], weak: ['void', 'nothingness', 'anti-divine'] },
    'dragon': { strong: ['treasure', 'magic', 'ancient'], weak: ['hero', 'divine', 'seal'] },
    'phoenix': { strong: ['death', 'decay', 'destruction'], weak: ['ice', 'void', 'permanence'] },
    'void': { strong: ['existence', 'reality', 'everything'], weak: ['creation', 'filling', 'substance'] },
    'existence': { strong: ['void', 'nothingness', 'erasure'], weak: ['transcendence', 'beyond', 'meta'] },
    'all': { strong: ['nothing', 'void', 'limitation'], weak: ['transcendence', 'beyond-all', 'meta-existence'] }
};

// Utility functions
function getRandomFruit() {
    const random = Math.random();
    let cumulative = 0;
    
    for (const [rarity, rate] of Object.entries(RARITY_RATES)) {
        cumulative += rate;
        if (random <= cumulative) {
            const fruitsOfRarity = Object.values(DEVIL_FRUITS).filter(fruit => fruit.rarity === rarity);
            return fruitsOfRarity[Math.floor(Math.random() * fruitsOfRarity.length)];
        }
    }
    
    // Fallback to common
    const commonFruits = Object.values(DEVIL_FRUITS).filter(fruit => fruit.rarity === 'common');
    return commonFruits[Math.floor(Math.random() * commonFruits.length)];
}

function getFruitById(id) {
    return DEVIL_FRUITS[id];
}

function getFruitsByRarity(rarity) {
    return Object.values(DEVIL_FRUITS).filter(fruit => fruit.rarity === rarity);
}

function getFruitsByElement(element) {
    return Object.values(DEVIL_FRUITS).filter(fruit => fruit.element === element);
}

function calculateElementAdvantage(attackerElement, defenderElement) {
    const counters = ELEMENT_COUNTERS[attackerElement];
    if (!counters) return 1.0;
    
    if (counters.strong.includes(defenderElement)) {
        return 1.5; // 50% damage bonus
    } else if (counters.weak.includes(defenderElement)) {
        return 0.7; // 30% damage reduction
    }
    return 1.0; // Normal damage
}

function getRarityColor(rarity) {
    const colors = {
        common: 0x8B4513,      // Brown
        uncommon: 0x00FF00,    // Green
        rare: 0x0080FF,        // Blue
        epic: 0x8000FF,        // Purple
        legendary: 0xFFD700,   // Gold
        mythical: 0xFF4500,    // Orange Red
        omnipotent: 0xFF69B4   // Hot Pink
    };
    return colors[rarity] || 0x8B4513;
}

function getRarityEmoji(rarity) {
    const emojis = {
        common: '🟫',
        uncommon: '🟩',
        rare: '🟦',
        epic: '🟪',
        legendary: '🟨',
        mythical: '🟧',
        omnipotent: '🌈'
    };
    return emojis[rarity] || '🟫';
}

function getAllFruits() {
    return Object.values(DEVIL_FRUITS);
}

function getStats() {
    const stats = {
        total: Object.keys(DEVIL_FRUITS).length,
        byRarity: {},
        byType: {},
        byElement: {}
    };
    
    Object.values(DEVIL_FRUITS).forEach(fruit => {
        stats.byRarity[fruit.rarity] = (stats.byRarity[fruit.rarity] || 0) + 1;
        stats.byType[fruit.type] = (stats.byType[fruit.type] || 0) + 1;
        stats.byElement[fruit.element] = (stats.byElement[fruit.element] || 0) + 1;
    });
    
    return stats;
}

module.exports = {
    DEVIL_FRUITS,
    RARITY_RATES,
    ELEMENT_COUNTERS,
    getRandomFruit,
    getFruitById,
    getFruitsByRarity,
    getFruitsByElement,
    calculateElementAdvantage,
    getRarityColor,
    getRarityEmoji,
    getAllFruits,
    getStats
};
