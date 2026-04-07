/**
 * SpawnTimeline.js
 */
export const SPAWN_TIMELINE = [
    {
        name: "Warming up",
        start: 0, end: 45,
        types: ["TRIANGLE"],
        rate: 1800,
        hpMultiplier: 1, speedMultiplier: 1,
        xpDrop: { value: 10, color: '#6e6cff' } 
    },
    {
        name: "Are they suicidal?",
        start: 45, end: 60,
        types: ["SQUARE"],
        rate: 2000,
        hpMultiplier: 1, speedMultiplier: 1,
        xpDrop: { value: 5, color: '#c7fff4' }
    },
    {
        name: "The Tanks are coming",
        start: 60, end: 70,
        types: ["TRIANGLE", "HEXAGON"],
        rate: 1000,
        hpMultiplier: 1.1, speedMultiplier: 0.9,
        xpDrop: { value: 30, color: '#bc00ff' }
    },
    {
        name: "A suspicious silence",
        start: 70, end: 100,
        types: ["TRIANGLE"],
        rate: 1500,
        hpMultiplier: 1, speedMultiplier: 1,
        xpDrop: { value: 10, color: '#6e6cff' } 
    },
    {
        name: "Data Breach: Chaos outbreak",
        start: 100, end: 120,
        types: ["SQUARE", "CIRCLE"],
        rate: 1000,
        hpMultiplier: 1.2, speedMultiplier: 1.2,
        xpDrop: { value: 20, color: '#ff3300' }
    },
    {
        name: "The Elite arrives",
        start: 120, end: 180,
        types: ["RHOMBUS", "HEXAGON"],
        rate: 100,
        hpMultiplier: 2, speedMultiplier: 1.1,
        xpDrop: { value: 50, color: '#ffffff' }
    }
];