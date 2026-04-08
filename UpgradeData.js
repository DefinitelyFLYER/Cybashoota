export const UPGRADES = [
    // offensive upgrades
    {
        id: 'rapid_fire',
        name: 'Overclock',
        description: 'Increases fire rate by 15%.',
        rarity: 'Common',
        tags: ['weapon', 'speed'],
        weight: 100,
        maxStack: 4,
        onApply: (player) => { player.stats.fireRate *= 0.85; }
    },
    {
        id: 'damage_boost',
        name: 'High Voltage',
        description: '+1 Damage to all projectiles.',
        rarity: 'Common',
        tags: ['weapon', 'damage'],
        weight: 90,
        maxStack: 20,
        onApply: (player) => { player.stats.damage += 1; }
    },
    {
        id: 'multishot',
        name: 'Multishot Protocol',
        description: '+2 Projectiles',
        rarity: 'Rare',
        tags: ['weapon', 'projectile'],
        weight: 40,
        maxStack: 2,
        onApply: (player) => { 
            player.stats.projectileCount += 2;
            player.stats.projectileSpread += 3;
        }
    },
    {
        id: 'crit_chance',
        name: 'Optical Sensor',
        description: '+10% Critical Hit Chance.',
        rarity: 'Common',
        tags: ['weapon', 'crit'],
        weight: 60,
        maxStack: 10,
        onApply: (player) => { player.stats.critChance += 0.1; }
    },
    {
        id: 'crit_multi',
        name: 'Deep Analysis',
        description: 'Critical hits deal +50% more damage.',
        rarity: 'Rare',
        tags: ['weapon', 'crit'],
        weight: 50,
        maxStack: 5,
        requirements: (player) => player.stats.critChance > 0.15,
        onApply: (player) => { player.stats.critMultiplier += 0.5; }
    },
    {
        id: 'ricochet_logic',
        name: 'Ricochet Module',
        description: 'Projectiles bounce to the nearest enemy upon hit.',
        rarity: 'Rare',
        tags: ['weapon', 'projectile'],
        weight: 35,
        maxStack: 3,
        onApply: (player) => { 
            player.stats.ricochetCount += 1; 
        }
    },
    {
        id: 'advanced_ricochet_module',
        name: 'Ricochet Mastery',
        description: 'Projectiles bounce to the nearest enemy upon hit... +5 times.',
        rarity: 'Epic',
        tags: ['weapon', 'projectile'],
        weight: 10,
        unique: true,
        onApply: (player) => { 
            player.stats.ricochetCount += 5; 
        }
    },

    // defensive upgrades
    {
        id: 'extra_hp',
        name: 'Backup Battery',
        description: '+2 Max HP and heals 2 HP.',
        rarity: 'Common',
        tags: ['defense', 'healing'],
        weight: 60,
        onApply: (player) => { 
            player.stats.maxHp += 2;
            player.stats.hp += 2;
        }
    },
    {
        id: 'armor',
        name: 'Titan Shell',
        description: '+1 Defense (Reduces incoming damage).',
        rarity: 'Rare',
        tags: ['defense'],
        weight: 40,
        maxStack: 5,
        onApply: (player) => { player.stats.defense += 1; }
    },
    {
        id: 'dodge',
        name: 'Ghost Module',
        description: '+12% Chance to dodge any damage.',
        rarity: 'Rare',
        tags: ['defense', 'speed'],
        weight: 40,
        maxStack: 6,
        onApply: (player) => { player.stats.dodgeChance += 0.12; }
    },

    // utilities
    {
        id: 'lucky_dice',
        name: 'Fortune.exe',
        description: '+25% Luck (Better upgrades & drops).',
        rarity: 'Common',
        tags: ['utility', 'luck'],
        weight: 60,
        maxStack: 4,
        onApply: (player) => { player.stats.luck += 0.25; }
    },
    {
        id: 'glass_cannon',
        name: 'Glass Cannon',
        description: 'Double your Damage, but set Max HP to 1.',
        rarity: 'Epic',
        tags: ['weapon', 'risky'],
        weight: 15,
        unique: true,
        requirements: (player) => player.stats.maxHp > 2,
        onApply: (player) => { 
            player.stats.damage *= 2;
            player.stats.maxHp = 1;
            player.stats.hp = 1;
        }
    },
    {
        id: 'sniper_protocol',
        name: 'Sniper Protocol',
        description: '+100% Bullet Speed and +2 Damage, but -30% Fire Rate.',
        rarity: 'Epic',
        tags: ['weapon', 'projectile'],
        weight: 20,
        unique: true,
        onApply: (player) => {
            player.stats.bulletSpeed *= 2;
            player.stats.damage += 2;
            player.stats.fireRate *= 1.3;
        }
    },
    {
        id: 'magnetic_field',
        name: 'Neural Link',
        description: 'Slightly increases orb pickup range.',
        rarity: 'Common',
        tags: ['utility', 'magnet'],
        weight: 60,
        maxStack: 10,
        onApply: (player) => { 
            player.stats.magnetRange += 40; 
        }
    },
    {
        id: 'true_magnetic_field',
        name: 'True Neural Link',
        description: 'Significantly increases orb pickup range.',
        rarity: 'Epic',
        tags: ['utility', 'magnet'],
        weight: 10,
        unique: true,
        onApply: (player) => { 
            player.stats.magnetRange += 240; 
        }
    },
    // movement upgrades
    {
        id: 'servo_boost',
        name: 'Hydraulic Servos',
        description: '+10% Movement Speed.',
        rarity: 'Common',
        tags: ['utility', 'speed'],
        weight: 80,
        maxStack: 5,
        onApply: (player) => { 
            player.stats.moveSpeed *= 1.10; 
        }
    },
    {
        id: 'lightweight_alloy',
        name: 'Lightweight Alloy',
        description: '+10% Speed and +5% Dodge Chance, but -1 Max HP.',
        rarity: 'Rare',
        tags: ['utility', 'speed', 'defense'],
        weight: 40,
        requirements: (player) => player.stats.maxHp > 2,
        onApply: (player) => {
            player.stats.moveSpeed *= 1.10;
            player.stats.dodgeChance += 0.05;
            player.stats.maxHp -= 1;
            if (player.stats.hp > player.stats.maxHp) player.stats.hp = player.stats.maxHp;
        }
    },
    {
        id: 'kinetic_charge',
        name: 'Kinetic Overdrive',
        description: 'Massive +40% Speed boost, but decreases Fire Rate by 35%.',
        rarity: 'Epic',
        tags: ['utility', 'speed', 'weapon'],
        weight: 20,
        unique: true,
        onApply: (player) => {
            player.stats.moveSpeed *= 1.40;
            player.stats.fireRate *= 1.35;
        }
    },
    {
        id: 'dash_protocol',
        name: 'Adrenaline Sync',
        description: 'Small +5% speed boost +1 max HP.',
        rarity: 'Common',
        tags: ['utility', 'speed', 'healing'],
        weight: 80,
        onApply: (player) => {
            player.stats.moveSpeed *= 1.05;
            player.stats.maxHp += 1;
        }
    },
    {
        id: 'iron_plates',
        name: 'Iron Plates',
        description: 'Massive +6 max HP, but -30% Movement Speed.',
        rarity: 'Epic',
        tags: ['utility', 'healing'],
        weight: 20,
        onApply: (player) => {
            player.stats.moveSpeed *= 0.70;
            player.stats.maxHp += 6;
        }
    }
];