// PowerUpData.js
export const POWER_UPS = {
    SPEED_BOOST: {
        id: 'speed_boost',
        name: 'Overdrive',
        duration: 5000,
        color: '#00ffcc',
        // sprite: 'assets/powerups/speed_boost.png',
        statModifiers: {
            moveSpeed: 0.1 // Přičte se k aktuální rychlosti
        }
    },
    DAMAGE_BOOST: {
        id: 'damage_boost',
        name: 'Damage Surge',
        duration: 4000,
        color: '#ff0055',
        // sprite: 'assets/powerups/damage.png',
        statModifiers: {
            damage: 2 // Dočasně zvýší poškození
        }
    }
};