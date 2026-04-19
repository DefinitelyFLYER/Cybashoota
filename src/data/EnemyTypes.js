export const ENEMY_TYPES = {
    TRIANGLE: {
        type: 'TRIANGLE',
        hp: 3,
        speed: 0.12,
        size: 30,
        color: '#ff0000',
        scoreValue: 15,
        renderType: 'shape',
        isSuicidal: false
    },
    SQUARE: {
        type: 'SQUARE',
        hp: 2,
        speed: 0.2,
        size: 25,
        color: '#ffcc00',
        scoreValue: 20,
        renderType: 'shape',
        isSuicidal: true
    },
    HEXAGON: {
        type: 'HEXAGON',
        hp: 12,
        speed: 0.05,
        size: 50,
        color: '#3799f4',
        scoreValue: 50,
        renderType: 'shape',
        isSuicidal: false
    },
    CIRCLE: {
        type: 'CIRCLE',
        hp: 2,
        speed: 0.18,
        size: 25,
        color: '#00ff22',
        scoreValue: 20,
        renderType: 'shape',
        isSuicidal: true
    },
    RHOMBUS: {
        type: 'RHOMBUS',
        hp: 6,
        speed: 0.14,
        size: 40,
        color: '#ffffff',
        scoreValue: 100,
        renderType: 'shape',
        isSuicidal: false
    },
    SENTRY: {
        type: 'HEXAGON',
        hp: 5,
        speed: 0.0075,
        size: 35,
        color: '#ff44ff',
        scoreValue: 75,
        renderType: 'shape',
        isSuicidal: false,
        ranged: {
            fireRate: 2500,
            projectileSpeed: 0.5,
            projectileSize: 15,
            range: 5,
            stopToShoot: true,
            color: '#ff7bff'
        }
    }
};