export const ENEMY_TYPES = {
    TRIANGLE: {
        type: 'TRIANGLE',
        codexName: 'Chaser',
        codexTier: 'common',
        codexDescription: 'Standard swarm unit that steadily pursues the player.',
        hp: 3,
        speed: 0.12,
        size: 30,
        color: '#ff0000',
        scoreValue: 15,
        renderType: 'shape',
        isSuicidal: false
    },
    SQUARE: {
        type: 'SQUARE',
        codexName: 'Bomber',
        codexTier: 'common',
        codexDescription: 'Fast suicidal cube that detonates on contact with the player.',
        hp: 2,
        speed: 0.2,
        size: 25,
        color: '#ffcc00',
        scoreValue: 20,
        renderType: 'shape',
        isSuicidal: true
    },
    HEXAGON: {
        type: 'HEXAGON',
        codexName: 'Tank',
        codexTier: 'elite',
        codexDescription: 'Heavy armored unit with high HP and slow movement.',
        hp: 12,
        speed: 0.05,
        size: 50,
        color: '#3799f4',
        scoreValue: 50,
        renderType: 'shape',
        isSuicidal: false
    },
    CIRCLE: {
        type: 'CIRCLE',
        codexName: 'Swarmer',
        codexTier: 'common',
        codexDescription: 'Agile suicidal orb that rushes the player in packs.',
        hp: 2,
        speed: 0.18,
        size: 25,
        color: '#00ff22',
        scoreValue: 20,
        renderType: 'shape',
        isSuicidal: true
    },
    RHOMBUS: {
        type: 'RHOMBUS',
        codexName: 'Speedster',
        codexTier: 'elite',
        codexDescription: 'High-value agile flanker with solid durability and fast speed.',
        hp: 6,
        speed: 0.14,
        size: 40,
        color: '#ffffff',
        scoreValue: 100,
        renderType: 'shape',
        isSuicidal: false
    },
    SENTRY: {
        type: 'HEXAGON',
        codexName: 'Sentry',
        codexTier: 'elite',
        codexDescription: 'Stationary ranged turret that stops to fire plasma projectiles.',
        hp: 5,
        speed: 0.0075,
        size: 35,
        color: '#ff44ff',
        scoreValue: 75,
        renderType: 'shape',
        isSuicidal: false,
        ranged: {
            fireRate: 2500,
            projectileSpeed: 0.5,
            projectileSize: 15,
            range: 5,
            stopToShoot: true,
            color: '#ff7bff'
        }
    },

    // v0.5.0 New Enemy Types
    EMP: {
        type: 'HEXAGON',
        specialType: 'EMP',
        codexName: 'EMP Unit',
        codexTier: 'elite',
        codexDescription: 'Charges and emits an EMP shockwave that temporarily disables drones, hacks, and augment actives.',
        hp: 8,
        speed: 0.075,
        size: 42,
        color: '#00e5ff',
        scoreValue: 90,
        renderType: 'shape',
        isSuicidal: false,
        emp: {
            cooldown: 6000,
            chargeDuration: 1500,
            radius: 3.2,
            disableDuration: 3500
        }
    },
    DASHER: {
        type: 'TRIANGLE',
        specialType: 'DASHER',
        codexName: 'Dasher',
        codexTier: 'common',
        codexDescription: 'Locks onto your position, charges briefly, then lunges forward at high speed.',
        hp: 4,
        speed: 0.13,
        size: 32,
        color: '#ff5500',
        scoreValue: 45,
        renderType: 'shape',
        isSuicidal: false,
        dasher: {
            triggerRange: 3.8,
            chargeDuration: 650,
            dashDuration: 450,
            dashSpeed: 0.72,
            cooldown: 2600
        }
    },
    GLITCHED: {
        type: 'RHOMBUS',
        specialType: 'GLITCHED',
        codexName: 'Glitched',
        codexTier: 'common',
        codexDescription: 'Corrupted enemy with randomized stats and erratic behavior.',
        hp: 5,
        speed: 0.15,
        size: 34,
        color: '#00ffcc',
        scoreValue: 65,
        renderType: 'shape',
        isSuicidal: false,
        isVirusGlitched: true
    },
    VIRUS: {
        type: 'CIRCLE',
        specialType: 'VIRUS',
        codexName: 'Virus',
        codexTier: 'elite',
        codexDescription: 'Fires at other enemies to glitch their stats, grant ranged attacks, or rarely clone itself.',
        hp: 7,
        speed: 0.11,
        size: 34,
        color: '#b4ff00',
        scoreValue: 85,
        renderType: 'shape',
        isSuicidal: false,
        virus: {
            fireRate: 1200,
            range: 4.2,
            projectileSpeed: 0.65,
            glitchChance: 0.45,
            rangedMutationChance: 0.18,
            virusCloneChance: 0.02
        }
    },
    SPLITTER: {
        type: 'RHOMBUS',
        specialType: 'SPLITTER',
        codexName: 'Splitter',
        codexTier: 'elite',
        codexDescription: 'Breaks apart on death into 3 fast Mini Shards (2 HP, 0.22 speed, 10 score each).',
        hp: 9,
        speed: 0.09,
        size: 44,
        color: '#ffaa00',
        scoreValue: 60,
        renderType: 'shape',
        isSuicidal: false,
        splitCount: 3
    },
    MINI_SHARD: {
        type: 'TRIANGLE',
        specialType: 'MINI_SHARD',
        hp: 2,
        speed: 0.22,
        size: 20,
        color: '#ffaa00',
        scoreValue: 10,
        renderType: 'shape',
        isSuicidal: false
    },
    SHIELD_BEARER: {
        type: 'HEXAGON',
        specialType: 'SHIELD_BEARER',
        codexName: 'Shield Bearer',
        codexTier: 'elite',
        codexDescription: 'Projects a protective aura that reduces damage taken by nearby allies.',
        hp: 14,
        speed: 0.06,
        size: 46,
        color: '#4488ff',
        scoreValue: 110,
        renderType: 'shape',
        isSuicidal: false,
        shieldAura: {
            radius: 1.9,
            damageReduction: 0.45
        }
    },

    // v0.7.0 Bosses
    BOSS_WARDEN: {
        type: 'HEXAGON',
        specialType: 'BOSS_WARDEN',
        isBoss: true,
        codexName: 'Firewall Warden',
        codexTier: 'boss',
        codexDescription: 'Siege boss that fires 14-shot bullet novas, charges along red-telegraphed lanes, and deploys Sentry/Shield escorts.',
        hp: 180,
        speed: 0.055,
        size: 76,
        color: '#ff4400',
        scoreValue: 1000,
        renderType: 'shape',
        isSuicidal: false,
        bossConfig: {
            skillCooldown: 3200,
            novaCount: 14,
            novaSpeed: 0.42,
            chargeTime: 900,
            dashTime: 650,
            dashSpeed: 0.78
        }
    },
    BOSS_PHANTOM: {
        type: 'RHOMBUS',
        specialType: 'BOSS_PHANTOM',
        isBoss: true,
        codexName: 'Null-Pointer',
        codexTier: 'boss',
        codexDescription: 'Glitch assassin that teleports onto telegraphed markers, spawns ranged clones, and emits EMP disruption rings.',
        hp: 260,
        speed: 0.085,
        size: 70,
        color: '#ff00ff',
        scoreValue: 1500,
        renderType: 'shape',
        isSuicidal: false,
        bossConfig: {
            skillCooldown: 2900,
            blinkDelay: 850,
            empRadius: 2.8,
            empDuration: 2500
        }
    },
    BOSS_OVERMIND: {
        type: 'CIRCLE',
        specialType: 'BOSS_OVERMIND',
        isBoss: true,
        codexName: 'Apex Overmind',
        codexTier: 'boss',
        codexDescription: 'Core boss that unleashes rotating dual-spiral barrages, AoE overload rings, and Dasher/Virus swarms.',
        hp: 380,
        speed: 0.05,
        size: 84,
        color: '#ffcc00',
        scoreValue: 2500,
        renderType: 'shape',
        isSuicidal: false,
        bossConfig: {
            skillCooldown: 2700,
            overloadRadius: 2.2,
            overloadDelay: 1200
        }
    }
};

export const ENEMY_CODEX_IDS = Object.keys(ENEMY_TYPES).filter(id => id !== 'MINI_SHARD' && !ENEMY_TYPES[id].isBoss);
export const BOSS_CODEX_IDS = Object.keys(ENEMY_TYPES).filter(id => ENEMY_TYPES[id].isBoss);
export const BOSS_MILESTONES = [
    { timeSec: 180, bossId: 'BOSS_WARDEN', hpScale: 1.0 },
    { timeSec: 360, bossId: 'BOSS_PHANTOM', hpScale: 1.0 },
    { timeSec: 540, bossId: 'BOSS_OVERMIND', hpScale: 1.0 },
    { timeSec: 720, bossId: 'BOSS_OVERMIND', hpScale: 1.5 }
];