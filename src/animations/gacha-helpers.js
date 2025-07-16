// src/animations/gacha-helpers.js - Helper functions for gacha animation
const rainbowColors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫'];
const rainbowEmbedColors = [0xFF0000, 0xFF8000, 0xFFFF00, 0x00FF00, 0x0080FF, 0x8000FF, 0x654321];

// Professional status indicators
const STATUS_INDICATORS = {
    scanning: [
        { energy: "FAINT", aura: "UNKNOWN", potential: "STIRRING" },
        { energy: "WEAK", aura: "MYSTERIOUS", potential: "BUILDING" },
        { energy: "MODEST", aura: "ENIGMATIC", potential: "RISING" },
        { energy: "GROWING", aura: "POWERFUL", potential: "SURGING" },
        { energy: "STRONG", aura: "LEGENDARY", potential: "CRITICAL" },
        { energy: "INTENSE", aura: "MYTHICAL", potential: "TRANSCENDENT" }
    ],
    crystallizing: [
        { energy: "OVERWHELMING", aura: "DIVINE", potential: "REALITY-BENDING" },
        { energy: "WORLD-SHAKING", aura: "OMNIPOTENT", potential: "UNIVERSE-ALTERING" },
        { energy: "TRANSCENDENT", aura: "ABSOLUTE", potential: "LEGEND-FORGING" }
    ],
    revealing: [
        { energy: "CONFIRMED", aura: "ANALYZED", potential: "MANIFESTATION COMPLETE" }
    ]
};

// Hunt descriptions
const HUNT_DESCRIPTIONS = {
    mystery: [
        "The Grand Line's mysterious energies swirl through the depths...",
        "Ancient Devil Fruit essence stirs in the ocean's heart...",
        "Whispers of legendary power echo across the waves...",
        "The sea itself trembles with anticipation...",
        "Reality begins to bend around an emerging force...",
        "Destiny threads weave together in the cosmic tapestry..."
    ],
    rising: [
        "Tremendous energy cascades through dimensional barriers...",
        "The fruit's true nature fights to break through...",
        "Waves of power ripple across space and time...",
        "The ocean's blessing intensifies beyond mortal comprehension...",
        "Reality crystallizes around a world-changing force...",
        "The Devil Fruit's legend begins to take physical form..."
    ],
    manifestation: [
        "The legendary power reaches critical manifestation threshold...",
        "Cosmic forces align to birth a new chapter in history...",
        "The Grand Line itself acknowledges this moment of destiny...",
        "Your legend as a Devil Fruit user begins to unfold...",
        "The sea grants you a power beyond imagination...",
        "A force that will reshape your very existence emerges..."
    ]
};

function getSyncedRainbowPattern(frame, barLength = 20) {
    const positions = [];
    for (let i = 0; i < barLength; i++) {
        const colorIndex = (i - frame + rainbowColors.length * 100) % rainbowColors.length;
        positions.push(rainbowColors[colorIndex]);
    }
    return positions.join(' ');
}

function getEmbedColorSyncedToFirst(frame) {
    const firstSquareColorIndex = (0 - frame + rainbowColors.length * 100) % rainbowColors.length;
    return rainbowEmbedColors[firstSquareColorIndex];
}

function createProfessionalStatusDisplay(frame, phase = 'scanning') {
    let statusSet;
    
    if (phase === 'scanning' && frame < 18) {
        const index = Math.min(Math.floor(frame / 3), STATUS_INDICATORS.scanning.length - 1);
        statusSet = STATUS_INDICATORS.scanning[index];
    } else if (phase === 'crystallizing') {
        const index = Math.min(Math.floor(frame / 4), STATUS_INDICATORS.crystallizing.length - 1);
        statusSet = STATUS_INDICATORS.crystallizing[index];
    } else {
        statusSet = STATUS_INDICATORS.revealing[0];
    }
    
    return {
        energy: statusSet.energy,
        aura: statusSet.aura,
        potential: statusSet.potential
    };
}

function getHuntDescription(frame) {
    let descriptions;
    
    if (frame < 6) {
        descriptions = HUNT_DESCRIPTIONS.mystery;
    } else if (frame < 12) {
        descriptions = HUNT_DESCRIPTIONS.rising;
    } else {
        descriptions = HUNT_DESCRIPTIONS.manifestation;
    }
    
    const index = Math.min(frame % descriptions.length, descriptions.length - 1);
    return descriptions[index];
}

function getRarityColor(rarity) {
    const colors = {
        'common': 0x8B4513,     // Brown
        'uncommon': 0x00FF00,   // Green  
        'rare': 0x0080FF,       // Blue
        'epic': 0x8000FF,       // Purple
        'legendary': 0xFFD700,  // Gold
        'mythical': 0xFF8000,   // Orange
        'omnipotent': 0xFF0000  // Red
    };
    return colors[rarity] || 0x8B4513;
}

function getRarityEmoji(rarity) {
    const rarityEmojis = {
        'common': '🟫',
        'uncommon': '🟩', 
        'rare': '🟦',
        'epic': '🟪',
        'legendary': '🟨',
        'mythical': '🟧',
        'omnipotent': '🟥'
    };
    return rarityEmojis[rarity] || '🟫';
}

module.exports = {
    getSyncedRainbowPattern,
    getEmbedColorSyncedToFirst,
    createProfessionalStatusDisplay,
    getHuntDescription,
    getRarityColor,
    getRarityEmoji,
    STATUS_INDICATORS,
    HUNT_DESCRIPTIONS,
    rainbowColors,
    rainbowEmbedColors
};
