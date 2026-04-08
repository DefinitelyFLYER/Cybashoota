export const UPGRADES = [
    // offensive upgrades
    {
        id: 'rapid_fire',
        name: 'Overclock',
        description: 'Increases fire rate by 20%.',
        rarity: 'Common',
        tags: ['weapon', 'speed'],
        weight: 100,
        maxStack: 10,
        onApply: (player) => { player.stats.fireRate *= 0.8; }
    },
    {
        id: 'damage_boost',
        name: 'High Voltage',
        description: '+1 Flat Damage to all projectiles.',
        rarity: 'Common',
        tags: ['weapon', 'damage'],
        weight: 90,
        maxStack: 20,
        onApply: (player) => { player.stats.damage += 1; }
    },
    {
        id: 'multishot',
        name: 'Split Protocol',
        description: '+1 Projectile, +5° Spread.',
        rarity: 'Rare',
        tags: ['weapon', 'projectile'],
        weight: 40,
        maxStack: 5,
        onApply: (player) => { 
            player.stats.projectileCount += 1;
            player.stats.projectileSpread += 5;
        }
    },
    {
        id: 'crit_chance',
        name: 'Optical Sensor',
        description: '+10% Critical Hit Chance.',
        rarity: 'Common',
        tags: ['weapon', 'crit'],
        weight: 80,
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

    // defensive upgrades
    {
        id: 'extra_hp',
        name: 'Backup Battery',
        description: '+2 Max HP and heals 2 HP.',
        rarity: 'Common',
        tags: ['defense', 'healing'],
        weight: 70,
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
        description: '+8% Chance to dodge any damage.',
        rarity: 'Rare',
        tags: ['defense', 'speed'],
        weight: 40,
        maxStack: 6,
        onApply: (player) => { player.stats.dodgeChance += 0.08; }
    },

    // utilities
    {
        id: 'speed_freak',
        name: 'Turbo Boost',
        description: '+15% Movement Speed.',
        rarity: 'Common',
        tags: ['utility', 'speed'],
        weight: 80,
        maxStack: 5,
        onApply: (player) => { player.stats.moveSpeed *= 1.15; }
    },
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
        description: 'Increases item pickup range by 50 units.',
        rarity: 'Common',
        tags: ['utility', 'magnet'],
        weight: 70,
        maxStack: 5,
        onApply: (player) => { 
            player.stats.magnetRange += 50; 
        }
    },
    // movement upgrades
    {
        id: 'servo_boost',
        name: 'Hydraulic Servos',
        description: '+15% Movement Speed.',
        rarity: 'Common',
        tags: ['utility', 'speed'],
        weight: 90,
        maxStack: 8,
        onApply: (player) => { 
            player.stats.moveSpeed *= 1.15; 
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
        description: 'Massive +40% Speed boost, but increases Fire Rate delay by 15%.',
        rarity: 'Epic',
        tags: ['utility', 'speed', 'weapon'],
        weight: 20,
        unique: true,
        onApply: (player) => {
            player.stats.moveSpeed *= 1.40;
            player.stats.fireRate *= 1.15;
        }
    },
    {
        id: 'dash_protocol',
        name: 'Adrenaline Sync',
        description: 'Small speed boost (+5%) and heals 1 HP.',
        rarity: 'Common',
        tags: ['utility', 'speed', 'healing'],
        weight: 50,
        onApply: (player) => {
            player.stats.moveSpeed *= 1.05;
            player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + 1);
        }
    }
];