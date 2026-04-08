// PowerUpData.js
export const POWER_UPS = {
    SPEED_BOOST: {
        id: 'speed_boost',
        name: 'Overdrive',
        duration: 5000,
        color: '#00ffcc',
        sprite: 'assets/powerups/speed_boost.png',
        statModifiers: {
            moveSpeed: 0.1
        }
    },
    DAMAGE_BOOST: {
        id: 'damage_boost',
        name: 'Damage Surge',
        duration: 4000,
        color: '#f2ff00',
        sprite: 'assets/powerups/damage.png',
        statModifiers: {
            damage: 2
        }
    },
    HP_SMALL: {
        id: 'hp_small',
        name: 'Repair Kit',
        color: '#ff0000',
        sprite: 'assets/powerups/hp_small.png',
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
        color: '#ff0073',
        sprite: 'assets/powerups/full_recovery.png',
        onPickup: (game) => {
            const player = game.getModule('player');
            if (player) player.stats.hp = player.stats.maxHp;
        }
    },
    TEMP_HP: {
        id: 'temp_hp',
        name: 'Shield Overlay',
        color: '#3300ff',
        sprite: 'assets/powerups/temp_hp.png',
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
        duration: 5000,
        color: '#ff9900',
        sprite: 'assets/powerups/magnet.png',
        statModifiers: {
            magnetRange: 1000
        }
    },
    FIRE_RATE_FRENZY: {
        id: 'fire_rate_frenzy',
        name: 'Overclocked Cores',
        duration: 8000,
        color: '#77ff00',
        sprite: 'assets/powerups/fire_rate.png',
        onPickup: (game) => {
            const player = game.getModule('player');
            if (player) player.stats.fireRate /= 3;
        },
        onExpire: (game) => {
            const player = game.getModule('player');
            if (player) player.stats.fireRate *= 3;
        }
    },
    CRIT_OVERLOAD: {
        id: 'crit_overload',
        name: 'Targeting Glitch',
        duration: 5000,
        color: '#f2ff00',
        sprite: 'assets/powerups/crit_overload.png',
        statModifiers: {
            critChance: 1.0
        }
    }
};