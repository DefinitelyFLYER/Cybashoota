// DroneUpgradeData.js

export const DRONE_UPGRADES = [
    // --- TAG: COMBAT ---
    {
        id: 'drone_combat_dmg_ultra',
        name: 'Overcharged Fusion Core',
        description: 'Combat drones focus all energy into shots. +100% Damage.',
        onApply: (droneStats) => { droneStats.damageBonus += 10; }
    },
];