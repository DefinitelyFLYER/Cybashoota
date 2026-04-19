/**
 * SpawnTimeline.js
 */
export const SPAWN_TIMELINE = [
    {
        name: "Warming up",
        start: 0, end: 40,
        types: ["TRIANGLE",],
        rate: 500,
        hpMultiplier: 1, speedMultiplier: 1,
        xpDrop: { value: 10, color: '#ffff00' } 
    },
    {
        name: "Shooting so soon?",
        start: 40, end: 45,
        types: ["TRIANGLE", "SENTRY"],
        rate: 1000,
        hpMultiplier: 1, speedMultiplier: 1,
        xpDrop: { value: 12, color: '#ffff1a' } 
    },
    {
        name: "Are they suicidal?",
        start: 45, end: 60,
        types: ["SQUARE"],
        rate: 800,
        hpMultiplier: 1, speedMultiplier: 1,
        xpDrop: { value: 5, color: '#969600' }
    },
    {
        name: "The Tanks are coming.",
        start: 60, end: 65,
        types: ["TRIANGLE", "HEXAGON"],
        rate: 600,
        hpMultiplier: 1.1, speedMultiplier: 0.9,
        xpDrop: { value: 30, color: '#ffff41' }
    },
    {
        name: "The Tanks are coming..",
        start: 65, end: 70,
        types: ["HEXAGON"],
        rate: 800,
        hpMultiplier: 1, speedMultiplier: 0.9,
        xpDrop: { value: 30, color: '#ffff41' }
    },
    {
        name: "The Tanks are coming...",
        start: 70, end: 118,
        types: ["HEXAGON"],
        rate: 3000,
        hpMultiplier: 1.5, speedMultiplier: 1,
        xpDrop: { value: 30, color: '#ffff41' }
    },    
    {
        name: "Triangles... everywhere?",
        start: 118, end: 120,
        types: ["HEXAGON"],
        rate: 300,
        hpMultiplier: 1, speedMultiplier: 0.8,
        xpDrop: { value: 30, color: '#ffff41' }
    },
    {
        name: "Triangles... everywhere.",
        start: 120, end: 180,
        types: ["TRIANGLE"],
        rate: 150,
        hpMultiplier: 1, speedMultiplier: 0.8,
        xpDrop: { value: 10, color: '#ffff00' } 
    },
    {
        name: "Data Breach: Chaos outbreak",
        start: 180, end: 200,
        types: ["SQUARE", "CIRCLE"],
        rate: 500,
        hpMultiplier: 1.2, speedMultiplier: 1.2,
        xpDrop: { value: 20, color: '#ffff1d' }
    },
    {
        name: "The Elite arrives",
        start: 200, end: 220,
        types: ["RHOMBUS", "HEXAGON"],
        rate: 5000,
        hpMultiplier: 2, speedMultiplier: 1.1,
        xpDrop: { value: 50, color: '#ffff8c' }
    },
    {
        name: "The real Elite arrives..",
        start: 220, end: 300,
        types: ["SQUARE", "RHOMBUS", "HEXAGON"],
        rate: 1500,
        hpMultiplier: 2.2, speedMultiplier: 1.5,
        xpDrop: { value: 50, color: '#ffff8c' }
    },
    {
        name: "Easy enough?",
        start: 300, end: 360,
        types: ["TRIANGLE", "SQUARE"],
        rate: 350,
        hpMultiplier: 2.8, speedMultiplier: 1.8,
        xpDrop: { value: 30, color: '#ffff41' }
    },
    {
        name: "What is this..",
        start: 360, end: 480,
        types: ["TRIANGLE", "SQUARE", "CIRCLE", "HEXAGON", "RHOMBUS"],
        rate: 600,
        hpMultiplier: 3.8, speedMultiplier: 2,
        xpDrop: { value: 100, color: '#ffffab' }
    },
    {
        name: "Critical Overload",
        start: 480, end: 600,
        types: ["RHOMBUS", "HEXAGON", "SENTRY"],
        rate: 800,
        hpMultiplier: 5.5, speedMultiplier: 2.3,
        xpDrop: { value: 150, color: '#ffffff' }
    },
    {
        name: "You can't win",
        start: 600, end: 900,
        types: ["TRIANGLE", "SQUARE", "CIRCLE", "RHOMBUS", "HEXAGON", "SENTRY"],
        rate: 400,
        hpMultiplier: 7, speedMultiplier: 2.3,
        xpDrop: { value: 1000, color: '#ff8400' }
    }
];