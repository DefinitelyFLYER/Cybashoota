/**
 * EnemyTypes.js - Definice druhů nepřátel
 */
export const ENEMY_TYPES = {
    TRIANGLE: {
        type: 'TRIANGLE',
        hp: 3,
        speed: 0.15,
        size: 40,
        color: '#ff0000',
        scoreValue: 100,
        renderType: 'shape' // Použije kreslený tvar
    },
    SQUARE: {
        type: 'SQUARE',
        hp: 5,
        speed: 0.1, // Pomalejší ale tužší
        size: 50,
        color: '#ffff00',
        scoreValue: 250,
        renderType: 'shape'
    },
    HEXAGON: {
        type: 'HEXAGON',
        hp: 2,
        speed: 0.25, // Rychlý "skaut"
        size: 35,
        color: '#00ccff',
        scoreValue: 150,
        renderType: 'shape'
    },
    CYBER_DRONE: {
        type: 'DRONE',
        hp: 4,
        speed: 0.2,
        size: 60,
        sprite: 'drone.png', // Cesta k obrázku
        scoreValue: 500,
        renderType: 'sprite' // Použije tvůj dodaný sprite
    }
};