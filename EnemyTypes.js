export const ENEMY_TYPES = {
    TRIANGLE: {
        type: 'TRIANGLE',
        hp: 3,
        speed: 0.12,
        size: 30,
        color: '#ff0000',
        scoreValue: 10,
        renderType: 'shape',
        isSuicidal: false
    },
    SQUARE: {
        type: 'SQUARE',
        hp: 1,
        speed: 0.22,
        size: 25,
        color: '#ffcc00',
        scoreValue: 15,
        renderType: 'shape',
        isSuicidal: true
    },
    HEXAGON: {
        type: 'HEXAGON',
        hp: 15,
        speed: 0.05,
        size: 50,
        color: '#3799f4',
        scoreValue: 50,
        renderType: 'shape',
        isSuicidal: false
    },
    CIRCLE: {
        type: 'CIRCLE',
        hp: 1,
        speed: 0.18,
        size: 15,
        color: '#00ff22',
        scoreValue: 20,
        renderType: 'shape',
        isSuicidal: true
    },
    RHOMBUS: {
        type: 'RHOMBUS',
        hp: 8,
        speed: 0.15,
        size: 40,
        color: '#ffffff',
        scoreValue: 100,
        renderType: 'shape',
        isSuicidal: false
    },
    SENTRY: {
        type: 'HEXAGON',
        hp: 5,
        speed: 0.01,
        size: 35,
        color: '#ff44ff',
        scoreValue: 75,
        renderType: 'shape',
        isSuicidal: false,
        ranged: {
            fireRate: 3000,
            projectileSpeed: 0.6,
            projectileSize: 10,
            range: 6,
            stopToShoot: true,
            color: '#ff44ff'
        }
    }
};