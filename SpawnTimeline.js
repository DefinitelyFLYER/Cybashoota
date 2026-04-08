/**
 * SpawnTimeline.js
 */
export const SPAWN_TIMELINE = [
    {
        name: "Warming up",
        start: 0, end: 45,
        types: ["TRIANGLE"],
        rate: 1500,
        hpMultiplier: 1, speedMultiplier: 1,
        xpDrop: { value: 10, color: '#6e6cff' } 
    },
    {
        name: "Are they suicidal?",
        start: 45, end: 60,
        types: ["SQUARE"],
        rate: 800,
        hpMultiplier: 1, speedMultiplier: 1,
        xpDrop: { value: 5, color: '#c7fff4' }
    },
    {
        name: "The Tanks are coming.",
        start: 60, end: 65,
        types: ["TRIANGLE", "HEXAGON"],
        rate: 600,
        hpMultiplier: 1.1, speedMultiplier: 0.9,
        xpDrop: { value: 30, color: '#bc00ff' }
    },
    {
        name: "The Tanks are coming..",
        start: 65, end: 70,
        types: ["HEXAGON"],
        rate: 800,
        hpMultiplier: 1, speedMultiplier: 0.9,
        xpDrop: { value: 30, color: '#bc00ff' }
    },
    {
        name: "The Tanks are coming...",
        start: 70, end: 120,
        types: ["HEXAGON"],
        rate: 3000,
        hpMultiplier: 1.5, speedMultiplier: 1,
        xpDrop: { value: 30, color: '#bc00ff' }
    },
    {
        name: "Triangles... everywhere.",
        start: 120, end: 180,
        types: ["TRIANGLE"],
        rate: 200,
        hpMultiplier: 1, speedMultiplier: 0.8,
        xpDrop: { value: 10, color: '#6e6cff' } 
    },
    {
        name: "Data Breach: Chaos outbreak",
        start: 180, end: 200,
        types: ["SQUARE", "CIRCLE"],
        rate: 500,
        hpMultiplier: 1.2, speedMultiplier: 1.2,
        xpDrop: { value: 20, color: '#ff3300' }
    },
    {
        name: "The Elite arrives",
        start: 200, end: 220,
        types: ["RHOMBUS", "HEXAGON"],
        rate: 5000,
        hpMultiplier: 2, speedMultiplier: 1.1,
        xpDrop: { value: 50, color: '#ffffff' }
    },
    {
        name: "The real Elite arrives..",
        start: 220, end: 300,
        types: ["SQUARE", "RHOMBUS", "HEXAGON"],
        rate: 1500,
        hpMultiplier: 2.2, speedMultiplier: 1.5,
        xpDrop: { value: 50, color: '#ffffff' }
    },
    {
        name: "Easy enough?",
        start: 300, end: 360,
        types: ["TRIANGLE", "SQUARE"],
        rate: 350,
        hpMultiplier: 3, speedMultiplier: 2,
        xpDrop: { value: 30, color: '#6e6cff' }
    },
    {
        name: "What is this..",
        start: 360, end: 600,
        types: ["TRIANGLE", "SQUARE", "CIRCLE", "HEXAGON", "RHOMBUS"],
        rate: 400,
        hpMultiplier: 7, speedMultiplier: 3,
        xpDrop: { value: 100, color: '#ffff00' }
    }
];