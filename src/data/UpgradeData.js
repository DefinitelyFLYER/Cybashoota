const hasUpgrade = (id, count = 1) => (p, m) => (m.inventory[id] || 0) >= count;
const hasStat = (stat, val) => (p, m) => p.stats[stat] >= val;
const not = (conditionFunc) => (p, m) => !conditionFunc(p, m);
const and = (...funcs) => (p, m) => funcs.every(f => f(p, m));

export const UPGRADES = [
    // offensive upgrades
    {
        id: 'rapid_fire',
        name: 'Overclock',
        description: 'Increases fire rate by 20%.',
        rarity: 'Common',
        tags: ['weapon', 'speed'],
        weight: 100,
        onApply: (player) => { player.multipliers.fireRate += 0.20; }
    },
    {
        id: 'damage_boost',
        name: 'High Voltage',
        description: '+1.5 Damage to all projectiles.',
        rarity: 'Common',
        tags: ['weapon', 'damage'],
        weight: 90,
        onApply: (player) => { player.stats.damage += 1.5; }
    },
    {
        id: 'multishot',
        name: 'Multishot Protocol',
        description: '+2 Projectiles',
        rarity: 'Rare',
        tags: ['weapon', 'projectile'],
        weight: 40,
        maxStack: 3,
        onApply: (player) => { 
            player.stats.projectileCount += 2;
            player.stats.projectileSpread += 3;
        }
    },
    {
        id: 'crit_chance',
        name: 'Optical Sensor',
        description: '+15% Critical Hit Chance.',
        rarity: 'Common',
        tags: ['weapon', 'crit'],
        weight: 60,
        maxStack: 5,
        onApply: (player) => { player.stats.critChance += 0.15; }
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
        name: 'Glitchy Ammo',
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
        description: 'Projectiles are 30% smaller, your bullets are 50% faster, and they bounce(+1) now!',
        rarity: 'Epic',
        tags: ['weapon', 'projectile', 'ricochet', 'risky'],
        weight: 15,
        maxStack: 2,
        requirements: (player) => player.stats.ricochetCount >= 1,
        requirementText: 'Requires at least 1 Ricochet.',
        onApply: (player) => { 
            player.multipliers.projectileSize -= 0.3;
            player.multipliers.bulletSpeed += 0.5;
            player.stats.ricochetCount += 1;
        }
    },
    {
        id: 'smart_targeting',
        name: 'Smart Targeting',
        description: '+35% Aim Assist (Projectiles home toward enemies in your line of fire).',
        rarity: 'Rare',
        tags: ['weapon', 'projectile'],
        weight: 35,
        maxStack: 3,
        onApply: (player) => {
            player.stats.aimAssist += 0.35;
        }
    },

    // defensive upgrades
    {
    id: 'emergency_shield',
    name: 'Emergency Shield',
    description: '+2 Max HP.',
    rarity: 'Common',
    tags: ['utility', 'healing'],
    weight: 70,
    maxStack: 5,
    onApply: (player) => { player.stats.maxHp += 2; }
    },
    {
    id: 'extra_hp',
    name: 'Backup Battery',
    description: '+2 Max HP and heals 2 HP.',
    rarity: 'Common',
    tags: ['defense', 'healing'],
    weight: 80,
    onApply: (player) => { 
        player.stats.maxHp += 2;
        player.stats.hp += 2;
    }
    },
    {
        id: 'armor',
        name: 'Titan Shell',
        description: '+1 Defense (Grants 1 rechargeable Armor Shield that blocks a hit every 20s).',
        rarity: 'Rare',
        tags: ['defense'],
        weight: 35,
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
        description: 'Massive +5 max HP, but -20% Movement Speed.',
        rarity: 'Epic',
        tags: ['utility', 'healing'],
        weight: 20,
        onApply: (player) => {
            player.multipliers.moveSpeed -= 0.2;
            player.stats.maxHp += 5;
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
        requirements: (player) => player.stats.rerolls >= 10,
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
        requirements: (player) => player.getStat('maxHp') >= 4 && player.getStat('damage') >= 4,
        requirementText: 'Requires at least 4 Max HP and 4 Damage.',
        onApply: (player) => { 
            player.multipliers.xpMultiplier += 1;
            player.stats.hp = 1;
            player.stats.maxHp = 1;
            player.stats.damage = 1;
            if (player.stats.hp > player.stats.maxHp) player.stats.hp = player.stats.maxHp;
        }
    },
    {
        id: 'extra_hack_capacity',
        name: 'Expanded Hack Matrix',
        description: 'Increases your maximum active hack capacity by 1.',
        rarity: 'Legendary',
        tags: ['utility', 'hack'],
        weight: 2,
        unique: true,
        onApply: (player) => {
            player.stats.maxHackSlots += 1;
        }
    },
    {
        id: 'unlock_overload',
        name: 'Unlock hack: Overload',
        description: 'Overload hack damages all visible enemies.',
        rarity: 'Epic',
        tags: ['utility', 'hack', 'unlock'],
        weight: 25,
        unique: true,
        unlockHackId: 'OVERLOAD',
        onApply: (player, game) => {
            const hackMgr = game?.getModule('hack');
            if (hackMgr?.unlockHack) hackMgr.unlockHack('OVERLOAD');
        }
    },
    {
        id: 'unlock_glitch_em',
        name: 'Unlock hack: Glitch\'em',
        description: 'Glitch\'em applies glitch effect onto a targeted enemy.',
        rarity: 'Epic',
        tags: ['utility', 'hack', 'unlock'],
        weight: 25,
        unique: true,
        unlockHackId: 'GLITCH_EM',
        onApply: (player, game) => {
            const hackMgr = game?.getModule('hack');
            if (hackMgr?.unlockHack) hackMgr.unlockHack('GLITCH_EM');
        }
    },
    {
        id: 'unlock_signal_jammer',
        name: 'Unlock hack: Signal Jammer',
        description: 'Signal Jammer makes ranged enemies stop shooting for a short duration.',
        rarity: 'Epic',
        tags: ['utility', 'hack', 'unlock'],
        weight: 25,
        unique: true,
        unlockHackId: 'SIGNAL_JAMMER',
        onApply: (player, game) => {
            const hackMgr = game?.getModule('hack');
            if (hackMgr?.unlockHack) hackMgr.unlockHack('SIGNAL_JAMMER');
        }
    },
    {
        id: 'unlock_ghost_protocol',
        name: 'Unlock hack: Ghost Protocol',
        description: 'Ghost Protocol makes you invincible and faster for a short duration.',
        rarity: 'Epic',
        tags: ['utility', 'hack', 'unlock'],
        weight: 25,
        unique: true,
        unlockHackId: 'GHOST_PROTOCOL',
        onApply: (player, game) => {
            const hackMgr = game?.getModule('hack');
            if (hackMgr?.unlockHack) hackMgr.unlockHack('GHOST_PROTOCOL');
        }
    },
    {
        id: 'unlock_data_siphon',
        name: 'Unlock hack: Data Siphon',
        description: 'Pulls all XP orbs and drops across the map to you and grants +5 bonus XP per enemy.',
        rarity: 'Epic',
        tags: ['utility', 'hack', 'unlock'],
        weight: 25,
        unique: true,
        unlockHackId: 'DATA_SIPHON',
        onApply: (player, game) => {
            const hackMgr = game?.getModule('hack');
            if (hackMgr?.unlockHack) hackMgr.unlockHack('DATA_SIPHON');
        }
    },
    {
        id: 'unlock_holo_decoy',
        name: 'Unlock hack: Holo-Decoy',
        description: 'Deploys a decoy at your cursor for 8s that taunts enemies and explodes on expiration.',
        rarity: 'Epic',
        tags: ['utility', 'hack', 'unlock'],
        weight: 25,
        unique: true,
        unlockHackId: 'HOLO_DECOY',
        onApply: (player, game) => {
            const hackMgr = game?.getModule('hack');
            if (hackMgr?.unlockHack) hackMgr.unlockHack('HOLO_DECOY');
        }
    },
    {
        id: 'EXTRA_DRONE_CAPACITY',
        name: 'Mothership Protocol',
        description: 'Increases your maximum drone capacity by 1.',
        rarity: 'Legendary',
        tags: ['utility', 'drone'],
        weight: 1,
        onApply: (player) => {
            player.stats.maxDrones += 1;
        }
    },
    {
        id: 'extra_upgrade_choice',
        name: 'Quantum Core',
        description: 'Expands your interface. +1 Upgrade Choice on level up.',
        rarity: 'Legendary',
        tags: ['utility'],
        weight: 2,
        maxStack: 2,
        onApply: (player) => {
            player.stats.upgradeOptions += 1;
        }
    },
    {
        id: 'auto_recycler_protocol',
        name: 'Auto-Recycler Protocol',
        description: 'Choose a target Augment Set in the Augments menu; other sets auto-scrap on pickup (or convert to XP at full Mk.III).',
        rarity: 'Rare',
        tags: ['utility', 'augments'],
        weight: 30,
        unique: true,
        onApply: (player, game) => {
            const augMgr = game?.getModule('augments');
            if (augMgr) augMgr.autoRecyclerUnlocked = true;
        }
    },

    // --- Scaling Rarity Cards ---
    {
        id: 'rapid_fire_rare',
        name: 'Turbo Overclock',
        description: 'Increases fire rate by 35%.',
        rarity: 'Rare',
        tags: ['weapon', 'speed'],
        weight: 45,
        onApply: (player) => { player.multipliers.fireRate += 0.35; }
    },
    {
        id: 'rapid_fire_epic',
        name: 'Hyper-Cycle Core',
        description: 'Increases fire rate by 55%.',
        rarity: 'Epic',
        tags: ['weapon', 'speed'],
        weight: 20,
        onApply: (player) => { player.multipliers.fireRate += 0.55; }
    },
    {
        id: 'damage_boost_rare',
        name: 'Plasma Infuser',
        description: '+3 Damage to all projectiles.',
        rarity: 'Rare',
        tags: ['weapon', 'damage'],
        weight: 45,
        onApply: (player) => { player.stats.damage += 3; }
    },
    {
        id: 'damage_boost_legendary',
        name: 'Antimatter Core',
        description: '+5 Damage to all projectiles and +25% Bullet Speed.',
        rarity: 'Legendary',
        tags: ['weapon', 'damage'],
        weight: 8,
        onApply: (player) => {
            player.stats.damage += 5;
            player.multipliers.bulletSpeed += 0.25;
        }
    },
    {
        id: 'multishot_common',
        name: 'Twin Barrel',
        description: '+1 Projectile.',
        rarity: 'Common',
        tags: ['weapon', 'projectile'],
        weight: 70,
        maxStack: 4,
        onApply: (player) => {
            player.stats.projectileCount += 1;
            player.stats.projectileSpread += 2;
        }
    },
    {
        id: 'multishot_legendary',
        name: 'Barrage Array',
        description: '+4 Projectiles (+5° spread).',
        rarity: 'Legendary',
        tags: ['weapon', 'projectile'],
        weight: 6,
        maxStack: 2,
        onApply: (player) => {
            player.stats.projectileCount += 4;
            player.stats.projectileSpread += 5;
        }
    },
    {
        id: 'crit_mastery_epic',
        name: 'Precision Optics',
        description: '+25% Critical Hit Chance and +35% Crit Damage.',
        rarity: 'Epic',
        tags: ['weapon', 'crit'],
        weight: 22,
        maxStack: 3,
        onApply: (player) => {
            player.stats.critChance += 0.25;
            player.multipliers.critMultiplier += 0.35;
        }
    },
    {
        id: 'crit_overdrive_legendary',
        name: 'Apex Targeting',
        description: '+30% Critical Hit Chance and +100% Crit Damage.',
        rarity: 'Legendary',
        tags: ['weapon', 'crit'],
        weight: 7,
        unique: true,
        onApply: (player) => {
            player.stats.critChance += 0.30;
            player.multipliers.critMultiplier += 1.0;
        }
    },
    {
        id: 'bullet_speed_common',
        name: 'Accelerator Rails',
        description: '+25% Bullet Speed.',
        rarity: 'Common',
        tags: ['weapon', 'speed'],
        weight: 75,
        onApply: (player) => { player.multipliers.bulletSpeed += 0.25; }
    },
    {
        id: 'bullet_speed_rare',
        name: 'Hyper-Velocity Barrel',
        description: '+45% Bullet Speed and +15% Fire Rate.',
        rarity: 'Rare',
        tags: ['weapon', 'speed'],
        weight: 40,
        onApply: (player) => {
            player.multipliers.bulletSpeed += 0.45;
            player.multipliers.fireRate += 0.15;
        }
    },
    {
        id: 'lucky_dice_rare',
        name: 'Probability Matrix',
        description: '+50% Luck (Better upgrades & drops).',
        rarity: 'Rare',
        tags: ['utility', 'luck'],
        weight: 40,
        onApply: (player) => { player.multipliers.luck += 0.50; }
    },
    {
        id: 'xp_boost_epic',
        name: 'Neural Archive',
        description: '+50% XP Gain from all sources.',
        rarity: 'Epic',
        tags: ['utility', 'xp'],
        weight: 20,
        onApply: (player) => { player.multipliers.xpMultiplier += 0.50; }
    },
    {
        id: 'field_medkit_common',
        name: 'Med-Gel Injector',
        description: 'Heals +3 HP and +10% Move Speed.',
        rarity: 'Common',
        tags: ['defense', 'healing'],
        weight: 75,
        onApply: (player) => {
            player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + 3);
            player.multipliers.moveSpeed += 0.10;
        }
    },
    {
        id: 'armor_regen_rare',
        name: 'Reactive Plating',
        description: '+2 Max HP and Titan Shell recharges 25% faster.',
        rarity: 'Rare',
        tags: ['defense'],
        weight: 40,
        maxStack: 3,
        onApply: (player) => {
            player.stats.maxHp += 2;
            player.armorRechargeDuration = Math.max(4000, Math.round(player.armorRechargeDuration * 0.75));
        }
    },

    // --- New Mechanic Cards ---
    {
        id: 'explosive_rounds_epic',
        name: 'Volatile Shells',
        description: '25% chance per hit to trigger an explosive blast (60% AoE damage).',
        rarity: 'Epic',
        tags: ['weapon', 'aoe'],
        weight: 20,
        maxStack: 3,
        onApply: (player) => { player.stats.explosiveChance += 0.25; }
    },
    {
        id: 'shrapnel_core_legendary',
        name: 'Shrapnel Core',
        description: 'Enemies explode on death for 4 AoE damage, and +20% Explosive Round chance.',
        rarity: 'Legendary',
        tags: ['weapon', 'aoe'],
        weight: 7,
        maxStack: 2,
        onApply: (player) => {
            player.stats.deathBlastDamage += 4;
            player.stats.explosiveChance += 0.20;
        }
    },
    {
        id: 'life_steal_rare',
        name: 'Nano-Siphon',
        description: '4% chance on enemy kill to restore +1 HP (or speed up Armor recharge).',
        rarity: 'Rare',
        tags: ['defense', 'healing'],
        weight: 35,
        maxStack: 3,
        onApply: (player) => { player.stats.lifeStealChance += 0.04; }
    },
    {
        id: 'life_steal_epic',
        name: 'Vampiric Protocol',
        description: '8% chance on enemy kill to restore +1 HP (or speed up Armor recharge).',
        rarity: 'Epic',
        tags: ['defense', 'healing'],
        weight: 18,
        maxStack: 2,
        onApply: (player) => { player.stats.lifeStealChance += 0.08; }
    },
    {
        id: 'execute_rare',
        name: 'Hunter Protocol',
        description: 'Deal +35% damage to enemies below 45% HP.',
        rarity: 'Rare',
        tags: ['weapon', 'damage'],
        weight: 35,
        maxStack: 2,
        onApply: (player) => { player.stats.executeBonus += 0.35; }
    },
    {
        id: 'execute_epic',
        name: 'Executioner Chip',
        description: 'Deal +70% damage to enemies below 45% HP.',
        rarity: 'Epic',
        tags: ['weapon', 'damage'],
        weight: 18,
        unique: true,
        onApply: (player) => { player.stats.executeBonus += 0.70; }
    },
    {
        id: 'super_shot_epic',
        name: 'Overcharge Capacitor',
        description: 'Every 5th shot fires a larger piercing Super-Shot (+2 Pierce, 2.5x Damage).',
        rarity: 'Epic',
        tags: ['weapon', 'projectile'],
        weight: 18,
        unique: true,
        onApply: (player) => {
            if (!player.stats.superShotInterval || player.stats.superShotInterval > 5) {
                player.stats.superShotInterval = 5;
            }
        }
    },
    {
        id: 'super_shot_legendary',
        name: 'Singularity Cannon',
        description: 'Every 3rd shot fires a Super-Shot (+2 Pierce, 3.5x Damage).',
        rarity: 'Legendary',
        tags: ['weapon', 'projectile'],
        weight: 6,
        unique: true,
        onApply: (player) => {
            player.stats.superShotInterval = 3;
            player.stats.superShotDmgMulti = Math.max(player.stats.superShotDmgMulti || 2.5, 3.5);
        }
    },
    {
        id: 'hack_cooldown_rare',
        name: 'Quick-Boot Daemon',
        description: 'Reduces active Hack cooldowns by 15%.',
        rarity: 'Rare',
        tags: ['utility', 'hack'],
        weight: 35,
        maxStack: 3,
        onApply: (player) => { player.stats.hackCooldownMulti *= 0.85; }
    },
    {
        id: 'scrap_hunter_rare',
        name: 'Salvage Scanner',
        description: 'Doubles Cyber-Scrap drop chance from enemies and reduces Hack cooldowns by 10%.',
        rarity: 'Rare',
        tags: ['utility', 'augments'],
        weight: 32,
        maxStack: 2,
        onApply: (player) => {
            player.stats.scrapDropMulti *= 2.0;
            player.stats.hackCooldownMulti *= 0.90;
        }
    }
];