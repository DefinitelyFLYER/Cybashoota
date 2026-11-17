export const AUGMENT_SLOTS = {
    HEAD: 'head',
    ARMS: 'arms',
    LEGS: 'legs',
    CORE: 'core'
};

export const AUGMENT_SLOT_LIST = Object.values(AUGMENT_SLOTS);

export const AUGMENT_TYPES = {
    STRIKER: {
        id: 'STRIKER',
        name: 'Striker',
        color: '#ff0055',
        description: 'Offensive combat cyberware focused on raw firepower and fire rate.'
    },
    GHOST: {
        id: 'GHOST',
        name: 'Ghost',
        color: '#00ffcc',
        description: 'Stealth and precision cyberware enhancing critical strikes, evasion, and speed.'
    },
    TITAN: {
        id: 'TITAN',
        name: 'Titan',
        color: '#ff7b00',
        description: 'Heavy-duty plating and reinforcement cyberware built for survivability.'
    },
    NETRUNNER: {
        id: 'NETRUNNER',
        name: 'Netrunner',
        color: '#bc00ff',
        description: 'Neural and tactical systems boosting hacks, drones, and data collection.'
    }
};

export const AUGMENT_SET_BONUSES = {
    STRIKER: {
        twoPiece: {
            id: 'striker_2pc',
            name: 'Munitions Overdrive',
            description: '+2 Damage, +20% Fire Rate, and +1 Penetration.',
            stats: { damage: 2, penetration: 1 },
            multipliers: { fireRate: 0.2 }
        },
        fourPiece: {
            active: {
                id: 'striker_4pc_active',
                mode: 'active',
                name: 'Bullet Storm',
                description: 'ACTIVE (25s CD): For 5s, gain +200% Fire Rate, +4 Projectiles, +3 Ricochets, and +100% Crit Chance.',
                cooldownMs: 25000,
                durationMs: 5000
            },
            passive: {
                id: 'striker_4pc_passive',
                mode: 'passive',
                name: 'Explosive Payload',
                description: 'PASSIVE: +3 Damage. Critical hits detonate on impact, dealing 50% AoE plasma damage to nearby enemies.',
                stats: { damage: 3 },
                explosiveCrits: true
            }
        }
    },
    GHOST: {
        twoPiece: {
            id: 'ghost_2pc',
            name: 'Phantom Reflexes',
            description: '+15% Crit Chance, +10% Dodge Chance, and +15% Move Speed.',
            stats: { critChance: 0.15, dodgeChance: 0.10 },
            multipliers: { moveSpeed: 0.15 }
        },
        fourPiece: {
            active: {
                id: 'ghost_4pc_active',
                mode: 'active',
                name: 'Chrono-Stasis',
                description: 'ACTIVE (25s CD): For 5s, slows all enemies and enemy projectiles by 90% while leaving a cyan afterimage trail.',
                cooldownMs: 25000,
                durationMs: 5000
            },
            passive: {
                id: 'ghost_4pc_passive',
                mode: 'passive',
                name: 'Wraith Assassin',
                description: 'PASSIVE: +20% Dodge Chance and +60% Crit Multiplier. Dodging triggers Ghost Protocol and 100% Crit Chance for 2.5s.',
                stats: { dodgeChance: 0.20 },
                multipliers: { critMultiplier: 0.60 },
                wraithDodgeProc: true
            }
        }
    },
    TITAN: {
        twoPiece: {
            id: 'titan_2pc',
            name: 'Reactive Plating',
            description: '+3 Max HP, +1 Defense, and regenerates 1 HP every 25s.',
            stats: { maxHp: 3, defense: 1 },
            regenIntervalMs: 25000
        },
        fourPiece: {
            active: {
                id: 'titan_4pc_active',
                mode: 'active',
                name: 'Supernova Bastion',
                description: 'ACTIVE (30s CD): Emit a damaging shockwave (15 DMG), gain +4 Shield HP, and become Invulnerable for 5s.',
                cooldownMs: 30000,
                durationMs: 5000
            },
            passive: {
                id: 'titan_4pc_passive',
                mode: 'passive',
                name: 'Immortal Juggernaut',
                description: 'PASSIVE: +6 Max HP, regenerates 1 HP every 12s, and taking damage or dodging triggers a 10 DMG shockwave.',
                stats: { maxHp: 6 },
                regenIntervalMs: 12000,
                retaliationShockwave: true
            }
        }
    },
    NETRUNNER: {
        twoPiece: {
            id: 'netrunner_2pc',
            name: 'Overclocked Uplink',
            description: '+1 Max Hack Capacity, -30% Hack Cooldown, and +35% Drone Speed & Fire Rate.',
            stats: { maxHackSlots: 1 },
            hackCooldownMulti: 0.7,
            droneRateMulti: 0.74
        },
        fourPiece: {
            active: {
                id: 'netrunner_4pc_active',
                mode: 'active',
                name: 'Total Takeover',
                description: 'ACTIVE (30s CD): Triggers ALL 4 Hacks at once and overclocks all Drones to 2.5x fire rate for 6s.',
                cooldownMs: 30000,
                durationMs: 6000
            },
            passive: {
                id: 'netrunner_4pc_passive',
                mode: 'passive',
                name: 'Hive Mind',
                description: 'PASSIVE: +2 Max Drones, -50% Hack Cooldown, +3 Drone Damage, and using a Hack glitches 2 nearby enemies.',
                stats: { maxDrones: 2 },
                hackCooldownMulti: 0.5,
                droneDamageBonus: 3,
                hackGlitchSpread: true
            }
        }
    }
};

/**
 * Factory helper to create a standardized augment definition.
 * @param {Object} config
 * @param {string} config.id
 * @param {string} config.name
 * @param {'head'|'arms'|'legs'|'core'} config.slot
 * @param {string} config.type
 * @param {'Common'|'Rare'|'Epic'|'Legendary'} [config.rarity='Common']
 * @param {string} [config.description='']
 * @param {number} [config.weight=50]
 * @param {string|null} [config.sprite=null]
 * @param {Object} [config.stats={}] Flat additions to player.stats
 * @param {Object} [config.multipliers={}] Additive multiplier bonuses to player.multipliers
 * @param {Function|null} [config.onEquip=null]
 * @param {Function|null} [config.onUnequip=null]
 */
export function createAugment(config) {
    if (!config || !config.id || !config.name) {
        throw new Error('Augment definition requires an id and name.');
    }
    if (!AUGMENT_SLOT_LIST.includes(config.slot)) {
        throw new Error(`Invalid augment slot "${config.slot}" for augment "${config.id}".`);
    }
    if (!config.type || !AUGMENT_TYPES[config.type]) {
        throw new Error(`Invalid augment type "${config.type}" for augment "${config.id}".`);
    }

    return {
        id: config.id,
        name: config.name,
        slot: config.slot,
        type: config.type,
        rarity: config.rarity || 'Common',
        description: config.description || '',
        weight: config.weight ?? 50,
        sprite: config.sprite || null,
        stats: { ...(config.stats || {}) },
        multipliers: { ...(config.multipliers || {}) },
        onEquip: typeof config.onEquip === 'function' ? config.onEquip : null,
        onUnequip: typeof config.onUnequip === 'function' ? config.onUnequip : null
    };
}

export const AUGMENTS = [
    // HEAD AUGMENTS
    createAugment({
        id: 'aug_head_target_visor',
        name: 'Ballistic Visor',
        slot: AUGMENT_SLOTS.HEAD,
        type: 'STRIKER',
        rarity: 'Common',
        description: '+1 Damage, +20% Bullet Speed, and +25% Aim Assist.',
        weight: 60,
        stats: { damage: 1, aimAssist: 0.25 },
        multipliers: { bulletSpeed: 0.2 }
    }),
    createAugment({
        id: 'aug_head_stalker_optics',
        name: 'Stalker Optics',
        slot: AUGMENT_SLOTS.HEAD,
        type: 'GHOST',
        rarity: 'Rare',
        description: '+15% Crit Chance and +40% Crit Multiplier.',
        weight: 40,
        stats: { critChance: 0.15 },
        multipliers: { critMultiplier: 0.4 }
    }),
    createAugment({
        id: 'aug_head_cranial_plating',
        name: 'Cranial Plating',
        slot: AUGMENT_SLOTS.HEAD,
        type: 'TITAN',
        rarity: 'Common',
        description: '+2 Max HP and +1 Defense.',
        weight: 60,
        stats: { maxHp: 2, defense: 1 }
    }),
    createAugment({
        id: 'aug_head_neural_coprocessor',
        name: 'Neural Co-Processor',
        slot: AUGMENT_SLOTS.HEAD,
        type: 'NETRUNNER',
        rarity: 'Epic',
        description: '+1 Max Hack Capacity and +20% XP Gain.',
        weight: 20,
        stats: { maxHackSlots: 1 },
        multipliers: { xpMultiplier: 0.2 }
    }),

    // ARMS AUGMENTS
    createAugment({
        id: 'aug_arms_recoil_stabilizers',
        name: 'Recoil Stabilizers',
        slot: AUGMENT_SLOTS.ARMS,
        type: 'STRIKER',
        rarity: 'Rare',
        description: '+25% Fire Rate and +1.5 Damage.',
        weight: 45,
        stats: { damage: 1.5 },
        multipliers: { fireRate: 0.25 }
    }),
    createAugment({
        id: 'aug_arms_phantom_actuators',
        name: 'Phantom Actuators',
        slot: AUGMENT_SLOTS.ARMS,
        type: 'GHOST',
        rarity: 'Rare',
        description: '+1 Ricochet and +15% Fire Rate.',
        weight: 40,
        stats: { ricochetCount: 1 },
        multipliers: { fireRate: 0.15 }
    }),
    createAugment({
        id: 'aug_arms_shock_gauntlets',
        name: 'Shock Gauntlets',
        slot: AUGMENT_SLOTS.ARMS,
        type: 'TITAN',
        rarity: 'Common',
        description: '+2 Max HP and +30% Projectile Size.',
        weight: 60,
        stats: { maxHp: 2 },
        multipliers: { projectileSize: 0.3 }
    }),
    createAugment({
        id: 'aug_arms_drone_uplink_rig',
        name: 'Drone Uplink Rig',
        slot: AUGMENT_SLOTS.ARMS,
        type: 'NETRUNNER',
        rarity: 'Epic',
        description: '+1 Max Drone Capacity and +25% Luck.',
        weight: 20,
        stats: { maxDrones: 1 },
        multipliers: { luck: 0.25 }
    }),

    // LEGS AUGMENTS
    createAugment({
        id: 'aug_legs_combat_thrusters',
        name: 'Combat Thrusters',
        slot: AUGMENT_SLOTS.LEGS,
        type: 'STRIKER',
        rarity: 'Common',
        description: '+15% Move Speed and +10% Fire Rate.',
        weight: 60,
        multipliers: { moveSpeed: 0.15, fireRate: 0.1 }
    }),
    createAugment({
        id: 'aug_legs_mirage_servos',
        name: 'Mirage Servos',
        slot: AUGMENT_SLOTS.LEGS,
        type: 'GHOST',
        rarity: 'Rare',
        description: '+20% Move Speed and +12% Dodge Chance.',
        weight: 40,
        stats: { dodgeChance: 0.12 },
        multipliers: { moveSpeed: 0.2 }
    }),
    createAugment({
        id: 'aug_legs_anchor_pistons',
        name: 'Anchor Pistons',
        slot: AUGMENT_SLOTS.LEGS,
        type: 'TITAN',
        rarity: 'Rare',
        description: '+4 Max HP, but -10% Move Speed.',
        weight: 40,
        stats: { maxHp: 4 },
        multipliers: { moveSpeed: -0.1 }
    }),
    createAugment({
        id: 'aug_legs_flux_striders',
        name: 'Flux Striders',
        slot: AUGMENT_SLOTS.LEGS,
        type: 'NETRUNNER',
        rarity: 'Common',
        description: '+15% Move Speed and +60% Magnet Range.',
        weight: 55,
        multipliers: { moveSpeed: 0.15, magnetRange: 0.6 }
    }),

    // CORE AUGMENTS
    createAugment({
        id: 'aug_core_overdrive_reactor',
        name: 'Overdrive Reactor',
        slot: AUGMENT_SLOTS.CORE,
        type: 'STRIKER',
        rarity: 'Epic',
        description: '+3 Damage and +20% Fire Rate.',
        weight: 25,
        stats: { damage: 3 },
        multipliers: { fireRate: 0.2 }
    }),
    createAugment({
        id: 'aug_core_wraith_engine',
        name: 'Wraith Engine',
        slot: AUGMENT_SLOTS.CORE,
        type: 'GHOST',
        rarity: 'Epic',
        description: '+20% Crit Chance, +10% Dodge Chance, and +15% Move Speed.',
        weight: 25,
        stats: { critChance: 0.2, dodgeChance: 0.1 },
        multipliers: { moveSpeed: 0.15 }
    }),
    createAugment({
        id: 'aug_core_aegis_heart',
        name: 'Aegis Heart',
        slot: AUGMENT_SLOTS.CORE,
        type: 'TITAN',
        rarity: 'Epic',
        description: '+5 Max HP and +1 Defense.',
        weight: 25,
        stats: { maxHp: 5, defense: 1 }
    }),
    createAugment({
        id: 'aug_core_quantum_nexus',
        name: 'Quantum Nexus',
        slot: AUGMENT_SLOTS.CORE,
        type: 'NETRUNNER',
        rarity: 'Legendary',
        description: '+35% XP Gain, +35% Luck, and +100% Magnet Range.',
        weight: 10,
        multipliers: { xpMultiplier: 0.35, luck: 0.35, magnetRange: 1.0 }
    })
];

export const getAugmentById = (id) => AUGMENTS.find(aug => aug.id === id) || null;

export const getAugmentsBySlot = (slot) => AUGMENTS.filter(aug => aug.slot === slot);

export const getAugmentsByType = (type) => AUGMENTS.filter(aug => aug.type === type);
