/**
 * SpawnTimeline.js - Revidovaná verze pro lepší gradaci a balanc
 */
export const SPAWN_TIMELINE = [
    {
        name: "Průzkumná fáze",
        start: 0, end: 25,
        types: ["TRIANGLE"], // Jen základní pomalý enemy na rozehřátí
        rate: 1800,
        hpMultiplier: 1, speedMultiplier: 1,
        xpDrop: { value: 10, color: '#00ffcc' } 
    },
    {
        name: "Rychlý výpad",
        start: 25, end: 50,
        types: ["TRIANGLE", "SQUARE"], // Přidáváme "skleněná děla" - jsou rychlí, ale padnou na ránu
        rate: 1200,
        hpMultiplier: 1, speedMultiplier: 1, // Držíme rychlost na base hodnotách ze souboru
        xpDrop: { value: 15, color: '#00ffcc' }
    },
    {
        name: "Příjezd těžké techniky",
        start: 50, end: 90,
        types: ["TRIANGLE", "HEXAGON"], // První pomalí tanci, hráč už by měl mít nějaký Damage upgrade
        rate: 1000,
        hpMultiplier: 1.1, speedMultiplier: 0.9, // Hexagonům rychlost spíš lehce srážíme
        xpDrop: { value: 30, color: '#bc00ff' }
    },
    {
        name: "Chaos v datech",
        start: 90, end: 140,
        types: ["SQUARE", "CIRCLE"], // Kombinace velmi rychlých a sebevražedných malých koulí
        rate: 700,
        hpMultiplier: 1.2, speedMultiplier: 1.1,
        xpDrop: { value: 20, color: '#ff3300' }
    },
    {
        name: "Elitní komando",
        start: 140, end: 200,
        types: ["RHOMBUS", "HEXAGON"], // Nejtěžší fáze s elitními lovci a tanky
        rate: 600,
        hpMultiplier: 1.5, speedMultiplier: 1.1,
        xpDrop: { value: 50, color: '#ffffff' }
    }
];