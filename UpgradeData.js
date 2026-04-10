const hasUpgrade = (id, count = 1) => (p, m) => (m.inventory[id] || 0) >= count;
const hasStat = (stat, val) => (p, m) => p.stats[stat] >= val;
const not = (conditionFunc) => (p, m) => !conditionFunc(p, m);
const and = (...funcs) => (p, m) => funcs.every(f => f(p, m));

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
        onApply: (player) => { player.multipliers.fireRate += 0.15; }
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
        requirementText: 'Requires at least 15% Crit Chance.',
        onApply: (player) => { player.multipliers.critMultiplier += 0.5; }
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
        description: 'Projectiles bounce to the nearest enemy upon hit ...+5 times...',
        rarity: 'Epic',
        tags: ['weapon', 'projectile'],
        weight: 10,
        unique: true,
        onApply: (player) => { 
            player.stats.ricochetCount += 5; 
        }
    },
    {
        id: 'penetration_module',
        name: 'Piercing Rounds',
        description: 'Projectiles pass through +1 additional enemy.',
        rarity: 'Rare',
        tags: ['weapon', 'projectile'],
        weight: 30,
        maxStack: 5,
        onApply: (player) => { 
            player.stats.penetration += 1; 
        }
    },
    {
        id: 'heavy_railgun',
        name: 'Railgun Protocol',
        description: 'Massive projectile penetration (+3), but -50% Fire Rate.',
        rarity: 'Epic',
        tags: ['weapon', 'projectile'],
        weight: 10,
        unique: true,
        onApply: (player) => { 
            player.stats.penetration += 3;
            player.multipliers.fireRate -= 0.5;
        }
    },
    {
        id: 'big_bullets',
        name: 'Glichy Ammo',
        description: 'Increases projectile size by 25%.',
        rarity: 'Common',
        tags: ['weapon', 'projectile'],
        weight: 70,
        maxStack: 10,
        onApply: (player) => { 
            player.multipliers.projectileSize += 0.25; 
        }
    },
    {
        id: 'plasma_enlarger',
        name: 'Plasma Enlarger',
        description: 'Increases projectile size by 100%. (AND they do +1 more damage!)',
        rarity: 'Rare',
        tags: ['weapon', 'projectile'],
        weight: 50,
        unique: true,
        onApply: (player) => { 
            player.multipliers.projectileSize += 1; 
            player.stats.damage += 1;
        }
    },
    {
        id: 'needle_rounds',
        name: 'Needle Precision',
        description: 'Projectiles are 30% smaller, but your bullets are 50% faster. (And they bounce(+1) now!)',
        rarity: 'Epic',
        tags: ['weapon', 'projectile', 'ricochet', 'risky'],
        weight: 15,
        requirements: (player) => player.stats.ricochetCount >= 1,
        requirementText: 'Requires at least 1 Ricochet.',
        onApply: (player) => { 
            player.multipliers.projectileSize -= 0.3;
            player.multipliers.bulletSpeed += 0.5;
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
        onApply: (player) => { player.multipliers.luck += 0.25; }
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
        requirementText: 'Requires more than 2 Max HP.',
        onApply: (player) => { 
            player.stats.damage *= 2.0;
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
            player.multipliers.bulletSpeed += 1;
            player.stats.damage += 2;
            player.multipliers.fireRate -= 0.3;
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
            player.multipliers.magnetRange += 0.4;
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
            player.multipliers.magnetRange += 5;
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
            player.multipliers.moveSpeed += 0.10;
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
        requirementText: 'Requires more than 2 Max HP.',
        onApply: (player) => {
            player.multipliers.moveSpeed += 0.10;
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
            player.multipliers.moveSpeed += 0.40;
            player.multipliers.fireRate -= 0.35;
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
            player.multipliers.moveSpeed += 0.05;
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
            player.multipliers.moveSpeed -= 0.30;
            player.stats.maxHp += 6;
        }
    },
    {
        id: 'xp_boost',
        name: 'Learning Algorithm',
        description: 'Increases XP gain by 10%.',
        rarity: 'Rare',
        tags: ['utility', 'xp'],
        weight: 30,
        maxStack: 3,
        onApply: (player) => { 
            player.multipliers.xpMultiplier += 0.1; 
        }
    },
    {
        id: 'reroll',
        name: 'Hack the System',
        description: 'Gain a reroll.',
        rarity: 'Rare',
        tags: ['utility'],
        weight: 40,
        onApply: (player) => { 
            player.stats.rerolls += 1; 
        }
    },
    {
        id: 'reroll_mastery',
        name: 'The ultimate hack',
        description: 'Gain 100 rerolls. Use them!!!',
        rarity: 'Legendary',
        tags: ['utility'],
        weight: 1,
        unique: true,
        requirements: (player) => { player.stats.rerolls >= 10; },
        requirementText: 'Requires at least 10 rerolls.',
        onApply: (player) => { 
            player.stats.rerolls += 100; 
        }
    },
    {
        id: 'AI',
        name: 'AI protocol',
        description: 'Massive XP boost (+100%), but your damage is reduced to 1, and your Max HP too.',
        rarity: 'Legendary',
        tags: ['utility', 'xp', 'risky'],
        weight: 5,
        unique: true,
        requirements: (player) => { player.getStat('maxHp') >= 4 && player.getStat('damage') >= 4;},
        requirementText: 'Requires at least 4 Max HP and 4 Damage.',
        onApply: (player) => { 
            player.multipliers.xpMultiplier += 1;
            player.stats.hp = 1;
            player.stats.maxHp = 1;
            player.stats.damage = 1;
            if (player.stats.hp > player.stats.maxHp) player.stats.hp = player.stats.maxHp;
        }
    }
];