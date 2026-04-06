/**
 * SpawnTimeline.js - Scénář hry
 * start/end: čas v sekundách od začátku hry
 * rate: prodleva mezi spawny v ms
 */
export const SPAWN_TIMELINE = [
    {
        name: "Začátek: Jen pár trojúhelníků",
        start: 0,
        end: 20,
        types: ["TRIANGLE"],
        rate: 2000,
        hpMultiplier: 1,
        speedMultiplier: 1
    },
    {
        name: "Zahušťování provozu",
        start: 20,
        end: 45,
        types: ["TRIANGLE"],
        rate: 1000, // Rychlejší spawn
        hpMultiplier: 1.2,
        speedMultiplier: 1.1
    },
    {
        name: "První čtverce se objevují",
        start: 45,
        end: 90,
        types: ["TRIANGLE", "SQUARE"],
        rate: 800,
        hpMultiplier: 1.5,
        speedMultiplier: 1.2
    },
    {
        name: "Rychlá invaze hexagonů",
        start: 90,
        end: 150,
        types: ["SQUARE", "HEXAGON"],
        rate: 500,
        hpMultiplier: 2,
        speedMultiplier: 1.5
    }
];