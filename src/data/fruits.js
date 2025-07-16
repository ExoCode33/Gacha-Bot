// src/data/fruits.js - Devil Fruit Names, Descriptions, and Rarity
const DEVIL_FRUITS = {
    // COMMON FRUITS (40% chance)
    'fruit_001': {
        id: 'fruit_001',
        name: 'Bomu Bomu no Mi',
        rarity: 'common',
        power: 'User can make any part of their body explode.',
        description: 'Allows the user to make any part of their body explode, including breath and bodily waste.',
        source: 'canon'
    },
    'fruit_002': {
        id: 'fruit_002',
        name: 'Bara Bara no Mi',
        rarity: 'common',
        power: 'Body can split into pieces and control them separately.',
        description: 'The user can split their body into pieces and control each piece independently.',
        source: 'canon'
    },
    'fruit_003': {
        id: 'fruit_003',
        name: 'Sube Sube no Mi',
        rarity: 'common',
        power: 'Makes skin perfectly smooth, causing attacks to slip off.',
        description: 'Makes the user\'s skin perfectly smooth, causing most attacks to slip off harmlessly.',
        source: 'canon'
    },
    'fruit_004': {
        id: 'fruit_004',
        name: 'Kilo Kilo no Mi',
        rarity: 'common',
        power: 'Can change body weight from 1kg to 10,000kg.',
        description: 'Allows the user to change their body weight from 1 kilogram to 10,000 kilograms at will.',
        source: 'canon'
    },
    'fruit_005': {
        id: 'fruit_005',
        name: 'Doru Doru no Mi',
        rarity: 'common',
        power: 'Can produce and manipulate wax.',
        description: 'Allows the user to produce and manipulate wax from their body.',
        source: 'canon'
    },
    'fruit_006': { id: 'fruit_006', name: 'Baku Baku no Mi', rarity: 'common', power: 'Can eat anything and incorporate it into the body.', source: 'canon' },
    'fruit_007': { id: 'fruit_007', name: 'Ori Ori no Mi', rarity: 'common', power: 'Can create iron bonds that restrain opponents.', source: 'canon' },
    'fruit_008': { id: 'fruit_008', name: 'Bane Bane no Mi', rarity: 'common', power: 'Can turn body parts into springs.', source: 'canon' },
    'fruit_009': { id: 'fruit_009', name: 'Noro Noro no Mi', rarity: 'common', power: 'Can emit photons that slow down anything for 30 seconds.', source: 'canon' },
    'fruit_010': { id: 'fruit_010', name: 'Doa Doa no Mi', rarity: 'common', power: 'Can create doors on any surface.', source: 'canon' },
    'fruit_011': { id: 'fruit_011', name: 'Awa Awa no Mi', rarity: 'common', power: 'Can produce soap bubbles that clean anything.', source: 'canon' },
    'fruit_012': { id: 'fruit_012', name: 'Beri Beri no Mi', rarity: 'common', power: 'Can split body into berry-shaped orbs.', source: 'canon' },
    'fruit_013': { id: 'fruit_013', name: 'Sabi Sabi no Mi', rarity: 'common', power: 'Can rust any metal by touch.', source: 'canon' },
    'fruit_014': { id: 'fruit_014', name: 'Shari Shari no Mi', rarity: 'common', power: 'Can make body parts spin like wheels.', source: 'canon' },
    'fruit_015': { id: 'fruit_015', name: 'Yomi Yomi no Mi', rarity: 'common', power: 'Grants a second life and soul-based abilities.', source: 'canon' },
    'fruit_016': { id: 'fruit_016', name: 'Kage Kage no Mi', rarity: 'common', power: 'Can manipulate shadows and steal them.', source: 'canon' },
    'fruit_017': { id: 'fruit_017', name: 'Horo Horo no Mi', rarity: 'common', power: 'Can create ghosts that drain willpower.', source: 'canon' },
    'fruit_018': { id: 'fruit_018', name: 'Suke Suke no Mi', rarity: 'common', power: 'Can become invisible and make objects invisible.', source: 'canon' },
    'fruit_019': { id: 'fruit_019', name: 'Choki Choki no Mi', rarity: 'common', power: 'Can turn hands into scissors that cut anything.', source: 'canon' },
    'fruit_020': { id: 'fruit_020', name: 'Woshu Woshu no Mi', rarity: 'common', power: 'Can wash and hang anything to dry.', source: 'canon' },
    'fruit_021': { id: 'fruit_021', name: 'Fuwa Fuwa no Mi', rarity: 'common', power: 'Can make non-living objects float.', source: 'canon' },
    'fruit_022': { id: 'fruit_022', name: 'Mato Mato no Mi', rarity: 'common', power: 'Can mark targets for homing attacks.', source: 'canon' },
    'fruit_023': { id: 'fruit_023', name: 'Buki Buki no Mi', rarity: 'common', power: 'Can turn body parts into weapons.', source: 'canon' },
    'fruit_024': { id: 'fruit_024', name: 'Guru Guru no Mi', rarity: 'common', power: 'Can spin body parts at high speeds.', source: 'canon' },
    'fruit_025': { id: 'fruit_025', name: 'Beta Beta no Mi', rarity: 'common', power: 'Can create sticky mucus.', source: 'canon' },
    'fruit_026': { id: 'fruit_026', name: 'Hira Hira no Mi', rarity: 'common', power: 'Can make objects flat like flags.', source: 'canon' },
    'fruit_027': { id: 'fruit_027', name: 'Ishi Ishi no Mi', rarity: 'common', power: 'Can assimilate with stone.', source: 'canon' },
    'fruit_028': { id: 'fruit_028', name: 'Nui Nui no Mi', rarity: 'common', power: 'Can stitch things together.', source: 'canon' },
    'fruit_029': { id: 'fruit_029', name: 'Giro Giro no Mi', rarity: 'common', power: 'Can see through anything and read minds.', source: 'canon' },
    'fruit_030': { id: 'fruit_030', name: 'Ato Ato no Mi', rarity: 'common', power: 'Can turn people into art.', source: 'canon' },
    'fruit_031': { id: 'fruit_031', name: 'Jake Jake no Mi', rarity: 'common', power: 'Can become a controlling jacket.', source: 'canon' },
    'fruit_032': { id: 'fruit_032', name: 'Mira Mira no Mi', rarity: 'common', power: 'Can create mirror portals.', source: 'canon' },
    'fruit_033': { id: 'fruit_033', name: 'Bisu Bisu no Mi', rarity: 'common', power: 'Can create hard biscuits.', source: 'canon' },
    'fruit_034': { id: 'fruit_034', name: 'Pero Pero no Mi', rarity: 'common', power: 'Can create and control candy.', source: 'canon' },
    'fruit_035': { id: 'fruit_035', name: 'Bata Bata no Mi', rarity: 'common', power: 'Can create slippery butter.', source: 'canon' },
    'fruit_036': { id: 'fruit_036', name: 'Shibo Shibo no Mi', rarity: 'common', power: 'Can wring moisture from anything.', source: 'canon' },
    'fruit_037': { id: 'fruit_037', name: 'Memo Memo no Mi', rarity: 'common', power: 'Can manipulate memories.', source: 'canon' },
    'fruit_038': { id: 'fruit_038', name: 'Buku Buku no Mi', rarity: 'common', power: 'Can trap people in books.', source: 'canon' },
    'fruit_039': { id: 'fruit_039', name: 'Kuri Kuri no Mi', rarity: 'common', power: 'Can create cream.', source: 'canon' },
    'fruit_040': { id: 'fruit_040', name: 'Tama Tama no Mi', rarity: 'common', power: 'Can evolve through defeats.', source: 'canon' },
    'fruit_041': { id: 'fruit_041', name: 'Kame Kame no Mi', rarity: 'common', power: 'Can transform into a turtle.', source: 'canon' },
    'fruit_042': { id: 'fruit_042', name: 'Mushi Mushi no Mi, Model: Kabutomushi', rarity: 'common', power: 'Can transform into a beetle.', source: 'canon' },
    'fruit_043': { id: 'fruit_043', name: 'Mushi Mushi no Mi, Model: Suzumebachi', rarity: 'common', power: 'Can transform into a hornet.', source: 'canon' },
    'fruit_044': { id: 'fruit_044', name: 'Poke Poke no Mi', rarity: 'common', power: 'Can create pockets in surfaces.', source: 'canon' },
    'fruit_045': { id: 'fruit_045', name: 'Kuku Kuku no Mi', rarity: 'common', power: 'Can create baked goods.', source: 'canon' },
    'fruit_046': { id: 'fruit_046', name: 'Gocha Gocha no Mi', rarity: 'common', power: 'Can merge with objects.', source: 'canon' },
    'fruit_047': { id: 'fruit_047', name: 'Hiso Hiso no Mi', rarity: 'common', power: 'Can communicate with animals.', source: 'anime' },
    'fruit_048': { id: 'fruit_048', name: 'Mini Mini no Mi', rarity: 'common', power: 'Can shrink objects and self.', source: 'anime' },
    'fruit_049': { id: 'fruit_049', name: 'Ton Ton no Mi', rarity: 'common', power: 'Can change weight exponentially.', source: 'canon' },
    'fruit_050': { id: 'fruit_050', name: 'Mero Mero no Mi', rarity: 'common', power: 'Can turn those attracted to user into stone.', source: 'canon' },

    // UNCOMMON FRUITS (30% chance)
    'fruit_051': {
        id: 'fruit_051',
        name: 'Gomu Gomu no Mi',
        rarity: 'uncommon',
        power: 'Grants rubber body properties.',
        description: 'Rubber body immune to blunt attacks and electricity. True nature revealed as Hito Hito no Mi Model: Nika.',
        source: 'canon'
    },
    'fruit_052': { id: 'fruit_052', name: 'Hana Hana no Mi', rarity: 'uncommon', power: 'Can sprout body parts anywhere.', source: 'canon' },
    'fruit_053': { id: 'fruit_053', name: 'Bari Bari no Mi', rarity: 'uncommon', power: 'Can create unbreakable barriers.', source: 'canon' },
    'fruit_054': { id: 'fruit_054', name: 'Nagi Nagi no Mi', rarity: 'uncommon', power: 'Can create soundproof barriers.', source: 'canon' },
    'fruit_055': { id: 'fruit_055', name: 'Hobi Hobi no Mi', rarity: 'uncommon', power: 'Can turn people into toys.', source: 'canon' },
    'fruit_056': { id: 'fruit_056', name: 'Sui Sui no Mi', rarity: 'uncommon', power: 'Can swim through solid surfaces.', source: 'canon' },
    'fruit_057': { id: 'fruit_057', name: 'Zou Zou no Mi', rarity: 'uncommon', power: 'Can transform into elephant.', source: 'canon' },
    'fruit_058': { id: 'fruit_058', name: 'Inu Inu no Mi, Model: Wolf', rarity: 'uncommon', power: 'Can transform into wolf.', source: 'canon' },
    'fruit_059': { id: 'fruit_059', name: 'Neko Neko no Mi, Model: Leopard', rarity: 'uncommon', power: 'Can transform into leopard.', source: 'canon' },
    'fruit_060': { id: 'fruit_060', name: 'Ushi Ushi no Mi, Model: Bison', rarity: 'uncommon', power: 'Can transform into bison.', source: 'canon' },
    'fruit_061': { id: 'fruit_061', name: 'Ushi Ushi no Mi, Model: Giraffe', rarity: 'uncommon', power: 'Can transform into giraffe.', source: 'canon' },
    'fruit_062': { id: 'fruit_062', name: 'Inu Inu no Mi, Model: Jackal', rarity: 'uncommon', power: 'Can transform into jackal.', source: 'canon' },
    'fruit_063': { id: 'fruit_063', name: 'Tori Tori no Mi, Model: Falcon', rarity: 'uncommon', power: 'Can transform into falcon.', source: 'canon' },
    'fruit_064': { id: 'fruit_064', name: 'Mogu Mogu no Mi', rarity: 'uncommon', power: 'Can transform into mole.', source: 'canon' },
    'fruit_065': { id: 'fruit_065', name: 'Inu Inu no Mi, Model: Dachshund', rarity: 'uncommon', power: 'Can transform into dachshund.', source: 'canon' },
    'fruit_066': { id: 'fruit_066', name: 'Sara Sara no Mi, Model: Axolotl', rarity: 'uncommon', power: 'Can transform into axolotl.', source: 'canon' },
    'fruit_067': { id: 'fruit_067', name: 'Ryu Ryu no Mi, Model: Allosaurus', rarity: 'uncommon', power: 'Can transform into Allosaurus.', source: 'canon' },
    'fruit_068': { id: 'fruit_068', name: 'Ryu Ryu no Mi, Model: Spinosaurus', rarity: 'uncommon', power: 'Can transform into Spinosaurus.', source: 'canon' },
    'fruit_069': { id: 'fruit_069', name: 'Ryu Ryu no Mi, Model: Pteranodon', rarity: 'uncommon', power: 'Can transform into Pteranodon.', source: 'canon' },
    'fruit_070': { id: 'fruit_070', name: 'Ryu Ryu no Mi, Model: Brachiosaurus', rarity: 'uncommon', power: 'Can transform into Brachiosaurus.', source: 'canon' },
    'fruit_071': { id: 'fruit_071', name: 'Ryu Ryu no Mi, Model: Mammoth', rarity: 'uncommon', power: 'Can transform into Mammoth.', source: 'canon' },
    'fruit_072': { id: 'fruit_072', name: 'Ryu Ryu no Mi, Model: Triceratops', rarity: 'uncommon', power: 'Can transform into Triceratops.', source: 'canon' },
    'fruit_073': { id: 'fruit_073', name: 'Ryu Ryu no Mi, Model: Pachycephalosaurus', rarity: 'uncommon', power: 'Can transform into Pachycephalosaurus.', source: 'canon' },
    'fruit_074': { id: 'fruit_074', name: 'Ryu Ryu no Mi, Model: Saber-tooth Tiger', rarity: 'uncommon', power: 'Can transform into Saber-tooth Tiger.', source: 'canon' },
    'fruit_075': { id: 'fruit_075', name: 'Kumo Kumo no Mi, Model: Rosamygale Grauvogeli', rarity: 'uncommon', power: 'Can transform into ancient spider.', source: 'canon' },

    // RARE FRUITS (20% chance)
    'fruit_076': {
        id: 'fruit_076',
        name: 'Moku Moku no Mi',
        rarity: 'rare',
        power: 'Can create, control, and become smoke.',
        description: 'Allows the user to create, control, and transform into smoke at will.',
        source: 'canon'
    },
    'fruit_077': { id: 'fruit_077', name: 'Mera Mera no Mi', rarity: 'rare', power: 'Can create, control, and become fire.', source: 'canon' },
    'fruit_078': { id: 'fruit_078', name: 'Suna Suna no Mi', rarity: 'rare', power: 'Can create, control, and become sand.', source: 'canon' },
    'fruit_079': { id: 'fruit_079', name: 'Goro Goro no Mi', rarity: 'rare', power: 'Can create, control, and become lightning.', source: 'canon' },
    'fruit_080': { id: 'fruit_080', name: 'Hie Hie no Mi', rarity: 'rare', power: 'Can create, control, and become ice.', source: 'canon' },
    'fruit_081': { id: 'fruit_081', name: 'Yami Yami no Mi', rarity: 'rare', power: 'Can create and control darkness, absorb attacks.', source: 'canon' },
    'fruit_082': { id: 'fruit_082', name: 'Pika Pika no Mi', rarity: 'rare', power: 'Can create, control, and become light.', source: 'canon' },
    'fruit_083': { id: 'fruit_083', name: 'Magu Magu no Mi', rarity: 'rare', power: 'Can create, control, and become magma.', source: 'canon' },
    'fruit_084': { id: 'fruit_084', name: 'Numa Numa no Mi', rarity: 'rare', power: 'Can create, control, and become swamp.', source: 'canon' },
    'fruit_085': { id: 'fruit_085', name: 'Gasu Gasu no Mi', rarity: 'rare', power: 'Can create, control, and become gas.', source: 'canon' },
    'fruit_086': { id: 'fruit_086', name: 'Yuki Yuki no Mi', rarity: 'rare', power: 'Can create, control, and become snow.', source: 'canon' },
    'fruit_087': { id: 'fruit_087', name: 'Mori Mori no Mi', rarity: 'rare', power: 'Can create, control, and become forest.', source: 'canon' },
    'fruit_088': { id: 'fruit_088', name: 'Soru Soru no Mi', rarity: 'rare', power: 'Can manipulate souls and lifespan.', source: 'canon' },
    'fruit_089': { id: 'fruit_089', name: 'Mochi Mochi no Mi', rarity: 'rare', power: 'Can create and become mochi.', source: 'canon' },
    'fruit_090': { id: 'fruit_090', name: 'Ope Ope no Mi', rarity: 'rare', power: 'Can create spherical operating rooms.', source: 'canon' },
    'fruit_091': { id: 'fruit_091', name: 'Gura Gura no Mi', rarity: 'rare', power: 'Can create earthquakes and shockwaves.', source: 'canon' },
    'fruit_092': { id: 'fruit_092', name: 'Kaze Kaze no Mi', rarity: 'rare', power: 'Can create, control, and become wind.', source: 'theoretical' },
    'fruit_093': { id: 'fruit_093', name: 'Denki Denki no Mi', rarity: 'rare', power: 'Can create, control, and become electricity.', source: 'theoretical' },
    'fruit_094': { id: 'fruit_094', name: 'Tetsu Tetsu no Mi', rarity: 'rare', power: 'Can turn body into steel.', source: 'theoretical' },
    'fruit_095': { id: 'fruit_095', name: 'Kin Kin no Mi', rarity: 'rare', power: 'Can create and control gold.', source: 'movie' },
    'fruit_096': { id: 'fruit_096', name: 'Tsuchi Tsuchi no Mi', rarity: 'rare', power: 'Can create, control, and become earth.', source: 'theoretical' },
    'fruit_097': { id: 'fruit_097', name: 'Kuki Kuki no Mi', rarity: 'rare', power: 'Can create, control, and become air.', source: 'theoretical' },
    'fruit_098': { id: 'fruit_098', name: 'Chi Chi no Mi', rarity: 'rare', power: 'Can create, control, and become blood.', source: 'theoretical' },
    'fruit_099': { id: 'fruit_099', name: 'Kori Kori no Mi', rarity: 'rare', power: 'Can create and control crystal.', source: 'theoretical' },
    'fruit_100': { id: 'fruit_100', name: 'Mizu Mizu no Mi', rarity: 'rare', power: 'Can create, control, and become water.', source: 'theoretical' },

    // EPIC FRUITS (7% chance)
    'fruit_101': {
        id: 'fruit_101',
        name: 'Hito Hito no Mi, Model: Daibutsu',
        rarity: 'epic',
        power: 'Can transform into a giant golden Buddha.',
        description: 'Transforms the user into a giant golden Buddha with immense physical power and shockwave abilities.',
        source: 'canon'
    },
    'fruit_102': { id: 'fruit_102', name: 'Zushi Zushi no Mi', rarity: 'epic', power: 'Can control gravity.', source: 'canon' },
    'fruit_103': { id: 'fruit_103', name: 'Nikyu Nikyu no Mi', rarity: 'epic', power: 'Can repel anything with paw pads.', source: 'canon' },
    'fruit_104': { id: 'fruit_104', name: 'Doku Doku no Mi', rarity: 'epic', power: 'Can create and control poison.', source: 'canon' },
    'fruit_105': { id: 'fruit_105', name: 'Horm Horm no Mi', rarity: 'epic', power: 'Can control hormones.', source: 'canon' },
    'fruit_106': { id: 'fruit_106', name: 'Chyu Chyu no Mi', rarity: 'epic', power: 'Can heal any injury.', source: 'canon' },
    'fruit_107': { id: 'fruit_107', name: 'Toki Toki no Mi', rarity: 'epic', power: 'Can send people forward in time.', source: 'canon' },
    'fruit_108': { id: 'fruit_108', name: 'Kibi Kibi no Mi', rarity: 'epic', power: 'Can tame animals with dango.', source: 'canon' },
    'fruit_109': { id: 'fruit_109', name: 'Juku Juku no Mi', rarity: 'epic', power: 'Can age anything touched.', source: 'canon' },
    'fruit_110': { id: 'fruit_110', name: 'Basu Basu no Mi', rarity: 'epic', power: 'Can control sound and vibrations.', source: 'theoretical' },
    'fruit_111': { id: 'fruit_111', name: 'Rei Rei no Mi', rarity: 'epic', power: 'Can control temperature.', source: 'theoretical' },
    'fruit_112': { id: 'fruit_112', name: 'Kuukan Kuukan no Mi', rarity: 'epic', power: 'Can manipulate space.', source: 'theoretical' },
    'fruit_113': { id: 'fruit_113', name: 'Sei Sei no Mi', rarity: 'epic', power: 'Can control life force.', source: 'theoretical' },
    'fruit_114': { id: 'fruit_114', name: 'Kokoro Kokoro no Mi', rarity: 'epic', power: 'Can read and control emotions.', source: 'theoretical' },
    'fruit_115': { id: 'fruit_115', name: 'Gensou Gensou no Mi', rarity: 'epic', power: 'Can create illusions.', source: 'theoretical' },

    // LEGENDARY FRUITS (2.5% chance)
    'fruit_116': {
        id: 'fruit_116',
        name: 'Uo Uo no Mi, Model: Seiryu',
        rarity: 'legendary',
        power: 'Can transform into an Azure Dragon.',
        description: 'Allows transformation into a massive Azure Dragon with control over elements and devastating power.',
        source: 'canon'
    },
    'fruit_117': { id: 'fruit_117', name: 'Inu Inu no Mi, Model: Okuchi no Makami', rarity: 'legendary', power: 'Can transform into a wolf deity.', source: 'canon' },
    'fruit_118': { id: 'fruit_118', name: 'Hebi Hebi no Mi, Model: Yamata-no-Orochi', rarity: 'legendary', power: 'Can transform into eight-headed dragon.', source: 'canon' },
    'fruit_119': { id: 'fruit_119', name: 'Tori Tori no Mi, Model: Phoenix', rarity: 'legendary', power: 'Can transform into immortal phoenix.', source: 'canon' },
    'fruit_120': { id: 'fruit_120', name: 'Hito Hito no Mi, Model: Onyudo', rarity: 'legendary', power: 'Can transform into giant monk spirit.', source: 'canon' },
    'fruit_121': { id: 'fruit_121', name: 'Inu Inu no Mi, Model: Nine-Tailed Fox', rarity: 'legendary', power: 'Can transform into nine-tailed fox.', source: 'canon' },
    'fruit_122': { id: 'fruit_122', name: 'Uma Uma no Mi, Model: Pegasus', rarity: 'legendary', power: 'Can transform into winged horse.', source: 'canon' },
    'fruit_123': { id: 'fruit_123', name: 'Batto Batto no Mi, Model: Vampire', rarity: 'legendary', power: 'Can transform into vampire bat.', source: 'non-canon' },
    'fruit_124': { id: 'fruit_124', name: 'Shi Shi no Mi', rarity: 'legendary', power: 'Can control life and death.', source: 'theoretical' },
    'fruit_125': { id: 'fruit_125', name: 'Jikan Jikan no Mi', rarity: 'legendary', power: 'Can manipulate time freely.', source: 'theoretical' },
    'fruit_126': { id: 'fruit_126', name: 'Mugen Mugen no Mi', rarity: 'legendary', power: 'Can create infinite quantities.', source: 'theoretical' },
    'fruit_127': { id: 'fruit_127', name: 'Zero Zero no Mi', rarity: 'legendary', power: 'Can reduce anything to zero.', source: 'theoretical' },
    'fruit_128': { id: 'fruit_128', name: 'Akuma Akuma no Mi', rarity: 'legendary', power: 'Can transform into demon lord.', source: 'theoretical' },
    'fruit_129': { id: 'fruit_129', name: 'Tenshi Tenshi no Mi', rarity: 'legendary', power: 'Can transform into archangel.', source: 'theoretical' },
    'fruit_130': { id: 'fruit_130', name: 'Ryuu Ryuu no Mi, Model: Eastern Dragon', rarity: 'legendary', power: 'Can transform into Eastern Dragon.', source: 'theoretical' },

    // MYTHICAL FRUITS (0.4% chance)
    'fruit_131': {
        id: 'fruit_131',
        name: 'Hito Hito no Mi, Model: Nika',
        rarity: 'mythical',
        power: 'Can transform into the Sun God Nika.',
        description: 'The legendary Sun God fruit that grants reality-warping rubber powers and brings joy and freedom.',
        source: 'canon'
    },
    'fruit_132': { id: 'fruit_132', name: 'Hito Hito no Mi, Model: Raijin', rarity: 'mythical', power: 'Can transform into Thunder God.', source: 'theoretical' },
    'fruit_133': { id: 'fruit_133', name: 'Hito Hito no Mi, Model: Susanoo', rarity: 'mythical', power: 'Can transform into Storm God.', source: 'theoretical' },
    'fruit_134': { id: 'fruit_134', name: 'Kami Kami no Mi, Model: Amaterasu', rarity: 'mythical', power: 'Can transform into Sun Goddess.', source: 'theoretical' },
    'fruit_135': { id: 'fruit_135', name: 'Kami Kami no Mi, Model: Tsukuyomi', rarity: 'mythical', power: 'Can transform into Moon God.', source: 'theoretical' },
    'fruit_136': { id: 'fruit_136', name: 'Tora Tora no Mi, Model: White Tiger', rarity: 'mythical', power: 'Can transform into White Tiger deity.', source: 'theoretical' },
    'fruit_137': { id: 'fruit_137', name: 'Kitsune Kitsune no Mi, Model: Kyubi', rarity: 'mythical', power: 'Can transform into nine-tailed fox spirit.', source: 'theoretical' },
    'fruit_138': { id: 'fruit_138', name: 'Shinigami Shinigami no Mi', rarity: 'mythical', power: 'Can transform into death god.', source: 'theoretical' },
    'fruit_139': { id: 'fruit_139', name: 'Yume Yume no Mi', rarity: 'mythical', power: 'Can control dreams and reality.', source: 'theoretical' },
    'fruit_140': { id: 'fruit_140', name: 'Kuro Kuro no Mi', rarity: 'mythical', power: 'Can create, control, and become void.', source: 'theoretical' },
    'fruit_141': { id: 'fruit_141', name: 'Shiro Shiro no Mi', rarity: 'mythical', power: 'Can create, control, and become pure light.', source: 'theoretical' },
    'fruit_142': { id: 'fruit_142', name: 'Henka Henka no Mi', rarity: 'mythical', power: 'Can transform anything into anything.', source: 'theoretical' },
    'fruit_143': { id: 'fruit_143', name: 'Yuugou Yuugou no Mi', rarity: 'mythical', power: 'Can fuse any two things together.', source: 'theoretical' },
    'fruit_144': { id: 'fruit_144', name: 'Bunretsu Bunretsu no Mi', rarity: 'mythical', power: 'Can divide anything infinitely.', source: 'theoretical' },
    'fruit_145': { id: 'fruit_145', name: 'Zouryoku Zouryoku no Mi', rarity: 'mythical', power: 'Can amplify anything to infinite levels.', source: 'theoretical' },

    // OMNIPOTENT FRUITS (0.1% chance)
    'fruit_146': {
        id: 'fruit_146',
        name: 'Kami Kami no Mi',
        rarity: 'omnipotent',
        power: 'Can become a true deity.',
        description: 'The ultimate mythical fruit that grants true godhood and control over all aspects of reality.',
        source: 'theoretical'
    },
    'fruit_147': { id: 'fruit_147', name: 'Sekai Sekai no Mi', rarity: 'omnipotent', power: 'Can control the world itself.', source: 'theoretical' },
    'fruit_148': { id: 'fruit_148', name: 'Uchuu Uchuu no Mi', rarity: 'omnipotent', power: 'Can manipulate the universe.', source: 'theoretical' },
    'fruit_149': { id: 'fruit_149', name: 'Sonzai Sonzai no Mi', rarity: 'omnipotent', power: 'Can control existence itself.', source: 'theoretical' },
    'fruit_150': { id: 'fruit_150', name: 'Subete Subete no Mi', rarity: 'omnipotent', power: 'Can control everything in existence.', source: 'theoretical' }
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
        byRarity: {}
    };
    
    Object.values(DEVIL_FRUITS).forEach(fruit => {
        stats.byRarity[fruit.rarity] = (stats.byRarity[fruit.rarity] || 0) + 1;
    });
    
    return stats;
}

module.exports = {
    DEVIL_FRUITS,
    RARITY_RATES,
    getRandomFruit,
    getFruitById,
    getFruitsByRarity,
    getRarityColor,
    getRarityEmoji,
    getAllFruits,
    getStats
};
