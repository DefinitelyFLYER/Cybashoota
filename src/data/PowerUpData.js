export const POWER_UPS = {
    SPEED_BOOST: {
        id: 'speed_boost',
        name: 'Overdrive',
        infoText: 'MOVEMENT SPEED INCREASED',
        duration: 5000,
        color: '#00ffcc',
        sprite: 'assets/powerups/speed_boost.png',
        weight: 50,
        statModifiers: {
            moveSpeed: 0.1
        }
    },
    DAMAGE_BOOST: {
        id: 'damage_boost',
        name: 'Damage Surge',
        infoText: 'DAMAGE INCREASED',
        duration: 4000,
        color: '#f2ff00',
        sprite: 'assets/powerups/damage.png',
        weight: 20,
        statModifiers: {
            damage: 2
        }
    },
    HP_SMALL: {
        id: 'hp_small',
        name: 'Repair Kit',
        infoText: '+1 HEALTH RESTORED',
        color: '#ff0000',
        sprite: 'assets/powerups/hp_small.png',
        weight: 100,
        onPickup: (game) => {
            const player = game.getModule('player');
            if (player) {
                player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + 1);
            }
        }
    },
    FULL_RECOVERY: {
        id: 'full_recovery',
        name: 'System Restore',
        infoText: 'FULL HEALTH RESTORED',
        color: '#ff0073',
        sprite: 'assets/powerups/full_recovery.png',
        weight: 15,
        onPickup: (game) => {
            const player = game.getModule('player');
            if (player) player.stats.hp = player.stats.maxHp;
        }
    },
    TEMP_HP: {
        id: 'temp_hp',
        name: 'Shield Overlay',
        infoText: 'TEMPORARY HEALTH BOOST',
        color: '#3300ff',
        sprite: 'assets/powerups/temp_hp.png',
        weight: 35,
        onPickup: (game) => {
            const player = game.getModule('player');
            if (player) {
                player.stats.hp += 2; 
            }
        }
    },
    MAGNET: {
        id: 'magnet',
        name: 'Data Siphon',
        infoText: 'ENHANCED MAGNETIC FIELD',
        duration: 5000,
        color: '#ff9900',
        sprite: 'assets/powerups/magnet.png',
        weight: 70,
        statModifiers: {
            magnetRange: 20
        }
    },
    FIRE_RATE_FRENZY: {
        id: 'fire_rate_frenzy',
        name: 'Overclocked Cores',
        infoText: 'FIRERATE GREATLY INCREASED',
        duration: 8000,
        color: '#77ff00',
        sprite: 'assets/powerups/fire_rate.png',
        weight: 7,
        onPickup: (game) => {
            const player = game.getModule('player');
            if (player) player.multipliers.fireRate += 2.0;
        },
        onExpire: (game) => {
            const player = game.getModule('player');
            if (player) player.multipliers.fireRate -= 2.0;
        }
    },
    CRIT_OVERLOAD: {
        id: 'crit_overload',
        name: 'Targeting Glitch',
        infoText: 'CRITICAL HIT CHANCE MAXIMIZED',
        duration: 5000,
        color: '#f2ff00',
        sprite: 'assets/powerups/crit_overload.png',
        weight: 10,
        statModifiers: {
            critChance: 1.0
        }
    }
};