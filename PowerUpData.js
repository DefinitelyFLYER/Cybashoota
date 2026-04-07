// PowerUpData.js
export const POWER_UPS = {
    SPEED_BOOST: {
        id: 'speed_boost',
        name: 'Overdrive',
        duration: 5000,
        color: '#00ffcc',
        statModifiers: {
            moveSpeed: 0.1 // Přičte se k aktuální rychlosti
        },
        onPickup: (game) => {
            console.log("ZOOM!");
        }
    },
    FIRE_RATE: {
        id: 'fire_rate',
        name: 'Rapid Cycle',
        duration: 4000,
        color: '#ff0055',
        statModifiers: {
            damage: 2 // Dočasně zvýší poškození
        }
    }
};