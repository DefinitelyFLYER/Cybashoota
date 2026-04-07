export const ENEMY_TYPES = {
    // --- ZÁKLADNÍ PĚŠÁK ---
    TRIANGLE: {
        type: 'TRIANGLE',
        hp: 3,
        speed: 0.12,
        size: 30,
        color: '#ff0000',
        scoreValue: 10,
        renderType: 'shape'
    },

    // --- RYCHLÝ, ALE KŘEHKÝ (Skaut) ---
    SQUARE: {
        type: 'SQUARE',
        hp: 1, // Umře na jednu ránu
        speed: 0.22, // Velmi rychlý (překonává základní rychlost hráče)
        size: 25,
        color: '#ffcc00',
        scoreValue: 15,
        renderType: 'shape'
    },

    // --- TANK (Pomalý obr) ---
    HEXAGON: {
        type: 'HEXAGON',
        hp: 15, // Hodně životů
        speed: 0.05, // Velmi pomalý (nerozhodí ho hned tak něco)
        size: 50, // Větší cíl
        color: '#3799f4',
        scoreValue: 50,
        renderType: 'shape'
    },

    // --- NOVINKA: SEBEVRAH (Seeker) ---
    // Je velmi malý, středně rychlý, ale má jen 1 HP. 
    // Ideální pro vytváření tlaku v hordě.
    CIRCLE: {
        type: 'CIRCLE',
        hp: 1,
        speed: 0.18,
        size: 15,
        color: '#00ff22',
        scoreValue: 20,
        renderType: 'shape'
    },

    // --- NOVINKA: ELITNÍ HUNTER ---
    // Má průměrné HP i rychlost, ale je vizuálně výrazný.
    RHOMBUS: {
        type: 'RHOMBUS',
        hp: 8,
        speed: 0.15,
        size: 40,
        color: '#ffffff',
        scoreValue: 100,
        renderType: 'shape'
    }
};