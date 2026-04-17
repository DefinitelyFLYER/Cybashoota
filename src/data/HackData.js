export const HACK_DATA = {
    OVERLOAD: {
        id: 'OVERLOAD',
        name: 'System Overload',
        unlocked: true
    },
    GLITCH_EM: {
        id: 'GLITCH_EM',
        name: 'Glitch EM',
        unlocked: true
    },
    GHOST_PROTOCOL: {
        id: 'GHOST_PROTOCOL',
        name: 'Ghost Protocol',
        unlocked: true,
        durationMs: 5000,
        speedBoostMultiplier: 1.5,
        alpha: 0.4
    }
};

export const HACK_UNLOCKED = Object.values(HACK_DATA)
    .filter((hack) => hack.unlocked)
    .map((hack) => hack.id);

export const GLITCH_PHASES = {
    NORMAL: 0,
    PRIMARY: 1,
    SECONDARY: 2
};

export const GLITCH_EFFECT_CONFIG = {
    carrierDotDamagePerMs: 0.001,
    carrierTickRadiusScale: 0.8,
    spreadRadiusPx: 150,
    spreadDamage: 1,
    visual: {
        primary: {
            jitter: 10,
            alpha: 0.9,
            whiteFlashChance: 0.005
        },
        secondary: {
            shift: 1,
            alpha: 0.6
        },
        colors: {
            cyan: '#00ffcc',
            magenta: '#ff00ff',
            white: '#ffffff'
        }
    },
    tickParticles: {
        colors: ['#00ffcc', '#ff00ff'],
        countMin: 1,
        countMax: 2,
        life: 1.0,
        decayMin: 0.04,
        decayMax: 0.06,
        sizeMin: 2,
        sizeMax: 4
    },
    burstParticles: {
        colors: ['#00ffcc', '#ff00ff', '#ffffff'],
        countMin: 25,
        countMax: 50,
        lifeMin: 0.5,
        lifeMax: 2,
        decayMin: 0.01,
        decayMax: 0.06,
        sizeMin: 2,
        sizeMax: 10
    }
};
