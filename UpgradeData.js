// UpgradeData.js
export const UPGRADES = [
    {
        id: 'rapid_fire',
        name: 'Neural Link',
        description: 'Increases fire rate by 15%.',
        rarity: 'Common',
        tags: ['weapon', 'speed'],
        weight: 100,
        maxStack: 10,
        sprite: null, 
        onApply: (player) => { player.stats.fireRate *= 0.85; }
    },
    {
        id: 'multishot',
        name: 'Split Protocol',
        description: '+1 Projectile, but slightly increases spread.',
        rarity: 'Rare',
        tags: ['weapon', 'projectile'],
        weight: 40,
        maxStack: 4,
        sprite: null,
        onApply: (player) => { 
            player.stats.projectileCount += 1;
            player.stats.projectileSpread += 5;
        }
    },
    {
        id: 'titan_plating',
        name: 'Titan Plating',
        description: '+1 Defense. Become a walking tank.',
        rarity: 'Rare',
        tags: ['defense'],
        weight: 50,
        maxStack: 5,
        sprite: null,
        onApply: (player) => { player.stats.defense += 1; }
    },
    {
        id: 'berserker_mode',
        name: 'Berserker Code',
        description: 'Massive damage boost, but lose 1 Max HP.',
        rarity: 'Epic',
        tags: ['weapon', 'risky'],
        weight: 20,
        unique: true, // Lze vzít jen jednou za celou hru
        requirements: (player) => player.stats.damage >= 2 && player.stats.maxHp > 1,
        onApply: (player) => {
            player.stats.damage += 5;
            player.stats.maxHp -= 1;
            if (player.stats.hp > player.stats.maxHp) player.stats.hp = player.stats.maxHp;
        }
    }
];