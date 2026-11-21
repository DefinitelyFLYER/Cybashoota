export const DRONE_UPGRADES = [
    // ranged type drone upgrades
    {
        id: 'drone_ranged_dmg_common',
        name: 'Hollow-Point Tips',
        rarity: 'Common',
        description: '[Assault & Sniper] +1 Bullet Damage.',
        targetBehaviors: ['RANGED'],
        onApply: (droneMods) => { droneMods['RANGED'].damageBonus += 1; }
    },
    {
        id: 'drone_ranged_dmg',
        name: 'Depleted Uranium Rounds',
        rarity: 'Rare',
        description: '[Assault & Sniper] +2 Bullet Damage.',
        targetBehaviors: ['RANGED'],
        onApply: (droneMods) => { droneMods['RANGED'].damageBonus += 2; }
    },
    {
        id: 'drone_ranged_dmg_epic',
        name: 'Rail-Accelerated Slugs',
        rarity: 'Epic',
        description: '[Assault & Sniper] +4 Bullet Damage.',
        targetBehaviors: ['RANGED'],
        onApply: (droneMods) => { droneMods['RANGED'].damageBonus += 4; }
    },
    {
        id: 'drone_ranged_firerate_common',
        name: 'Quick-Feed Loader',
        rarity: 'Common',
        description: '[Assault & Sniper] +15% Fire Rate (shorter fire cooldown).',
        targetBehaviors: ['RANGED'],
        onApply: (droneMods) => { droneMods['RANGED'].fireRateMulti *= 0.87; }
    },
    {
        id: 'drone_ranged_firerate_rare',
        name: 'Rapid Loader',
        rarity: 'Rare',
        description: '[Assault & Sniper] +30% Fire Rate (shorter fire cooldown).',
        targetBehaviors: ['RANGED'],
        onApply: (droneMods) => { droneMods['RANGED'].fireRateMulti *= 0.77; }
    },
    {
        id: 'drone_ranged_firerate',
        name: 'Autoloader Mechanisms',
        rarity: 'Legendary',
        description: '[Assault & Sniper] Fire 2x faster (halves fire cooldown).',
        targetBehaviors: ['RANGED'],
        onApply: (droneMods) => { droneMods['RANGED'].fireRateMulti *= 0.5; }
    },
    {
        id: 'drone_ranged_range_common',
        name: 'Telemetry Lens',
        rarity: 'Common',
        description: '[Assault & Sniper] +40% Targeting Range.',
        targetBehaviors: ['RANGED'],
        onApply: (droneMods) => { droneMods['RANGED'].rangeMulti += 0.4; }
    },
    {
        id: 'drone_ranged_range',
        name: 'Advanced Optics',
        rarity: 'Rare',
        description: '[Assault & Sniper] +100% Targeting Range.',
        targetBehaviors: ['RANGED'],
        onApply: (droneMods) => { droneMods['RANGED'].rangeMulti += 1.0; }
    },

    // interceptor type drone upgrades
    {
        id: 'drone_aegis_radius_common',
        name: 'Shield Capacitor',
        rarity: 'Common',
        description: '[Aegis] +40% Projectile Block Radius.',
        targetBehaviors: ['INTERCEPTOR'],
        onApply: (droneMods) => { droneMods['INTERCEPTOR'].blockRadiusMulti += 0.4; }
    },
    {
        id: 'drone_aegis_radius',
        name: 'Broad-Spectrum Shields',
        rarity: 'Rare',
        description: '[Aegis] +100% Projectile Block Radius.',
        targetBehaviors: ['INTERCEPTOR'],
        onApply: (droneMods) => { droneMods['INTERCEPTOR'].blockRadiusMulti += 1.0; }
    },
    {
        id: 'drone_aegis_cooldown_common',
        name: 'Pulse Recharge',
        rarity: 'Common',
        description: '[Aegis] Block cooldown is 20% shorter.',
        targetBehaviors: ['INTERCEPTOR'],
        onApply: (droneMods) => { droneMods['INTERCEPTOR'].cooldownMulti *= 0.8; }
    },
    {
        id: 'drone_aegis_cooldown',
        name: 'Overcharged Capacitors',
        rarity: 'Epic',
        description: '[Aegis] Block cooldown is 50% shorter.',
        targetBehaviors: ['INTERCEPTOR'],
        onApply: (droneMods) => { droneMods['INTERCEPTOR'].cooldownMulti *= 0.5; }
    },
    {
        id: 'drone_aegis_speed',
        name: 'Thruster Overdrive',
        rarity: 'Rare',
        description: '[Aegis] +100% Intercept Flight Speed.',
        targetBehaviors: ['INTERCEPTOR'],
        onApply: (droneMods) => { droneMods['INTERCEPTOR'].speedMulti += 1.0; }
    },

    // debuff type drone upgrades
    {
        id: 'drone_debuff_rate_common',
        name: 'Quick Scan',
        rarity: 'Common',
        description: '[Saboteur] Marks enemies 25% faster.',
        targetBehaviors: ['DEBUFF'],
        onApply: (droneMods) => { droneMods['DEBUFF'].actionRateMulti *= 0.8; }
    },
    {
        id: 'drone_debuff_rate',
        name: 'Rapid Analysis',
        rarity: 'Epic',
        description: '[Saboteur] Marks enemies 2x faster (halves mark cooldown).',
        targetBehaviors: ['DEBUFF'],
        onApply: (droneMods) => { droneMods['DEBUFF'].actionRateMulti *= 0.5; }
    },
    {
        id: 'drone_debuff_range',
        name: 'Extended Sensor Array',
        rarity: 'Rare',
        description: '[Saboteur] +100% Mark Targeting Range.',
        targetBehaviors: ['DEBUFF'],
        onApply: (droneMods) => { droneMods['DEBUFF'].rangeMulti += 1.0; }
    },
    {
        id: 'drone_debuff_combo',
        name: 'Aggressive Targeting',
        rarity: 'Legendary',
        description: '[Saboteur] +100% Mark Range and marks 2x faster.',
        targetBehaviors: ['DEBUFF'],
        onApply: (droneMods) => { 
            droneMods['DEBUFF'].rangeMulti += 1.0; 
            droneMods['DEBUFF'].actionRateMulti *= 0.5; 
        }
    },

    // all type drone upgrades
    {
        id: 'drone_global_speed_common',
        name: 'Aero Thrusters',
        rarity: 'Common',
        description: '[All Drones] +20% Flight, Orbit & Follow Speed.',
        targetBehaviors: ['ALL'],
        onApply: (droneMods) => { droneMods['ALL'].speedMulti += 0.2; }
    },
    {
        id: 'drone_global_speed',
        name: 'Sync Protocol',
        rarity: 'Rare',
        description: '[All Drones] +50% Flight, Orbit & Follow Speed.',
        targetBehaviors: ['ALL'],
        onApply: (droneMods) => { droneMods['ALL'].speedMulti += 0.5; }
    },
    {
        id: 'drone_global_dmg_common',
        name: 'Weapon Calibration',
        rarity: 'Common',
        description: '[All Combat Drones] +1 Damage (Bullets, Lightning, Sawblade & Aegis Ram).',
        targetBehaviors: ['ALL'],
        onApply: (droneMods) => { droneMods['ALL'].damageBonus += 1; }
    },
    {
        id: 'drone_global_combat_ai',
        name: 'Combat AI Module',
        rarity: 'Epic',
        description: '[All Drones] +30% Flight Speed and +2 Combat Damage.',
        targetBehaviors: ['ALL'],
        onApply: (droneMods) => { 
            droneMods['ALL'].speedMulti += 0.30; 
            droneMods['ALL'].damageBonus += 2;
        }
    },
    {
        id: 'drone_global_dmg',
        name: 'Core Overclock',
        rarity: 'Epic',
        description: '[All Combat Drones] +3 Damage (Bullets, Lightning, Sawblade & Aegis Ram).',
        targetBehaviors: ['ALL'],
        onApply: (droneMods) => { droneMods['ALL'].damageBonus += 3; }
    },
    {
        id: 'drone_global_apex',
        name: 'Swarm Singularity',
        rarity: 'Legendary',
        description: '[All Drones] +4 Combat Damage, +40% Flight Speed & +25% Action Speed.',
        targetBehaviors: ['ALL'],
        onApply: (droneMods) => {
            droneMods['ALL'].damageBonus += 4;
            droneMods['ALL'].speedMulti += 0.4;
            droneMods['ALL'].fireRateMulti *= 0.8;
            droneMods['ALL'].actionRateMulti *= 0.8;
        }
    },

    // tesla type drone upgrades
    {
        id: 'drone_tesla_chains_common',
        name: 'Spark Relay',
        rarity: 'Common',
        description: '[Arc] Lightning chains to +1 extra enemy.',
        targetBehaviors: ['TESLA'],
        onApply: (droneMods) => {
            droneMods['TESLA'].chainBonus += 1;
        }
    },
    {
        id: 'drone_tesla_chains',
        name: 'High Voltage Coils',
        rarity: 'Rare',
        description: '[Arc] Lightning chains to +2 extra enemies and +25% Range.',
        targetBehaviors: ['TESLA'],
        onApply: (droneMods) => {
            droneMods['TESLA'].chainBonus += 2;
            droneMods['TESLA'].rangeMulti += 0.25;
        }
    },
    {
        id: 'drone_tesla_rate_common',
        name: 'Static Buildup',
        rarity: 'Common',
        description: '[Arc] Zaps 15% faster (reduces zap cooldown).',
        targetBehaviors: ['TESLA'],
        onApply: (droneMods) => {
            droneMods['TESLA'].actionRateMulti *= 0.85;
        }
    },
    {
        id: 'drone_tesla_rate',
        name: 'Arc Capacitor',
        rarity: 'Rare',
        description: '[Arc] Zaps 35% faster (reduces zap cooldown).',
        targetBehaviors: ['TESLA'],
        onApply: (droneMods) => {
            droneMods['TESLA'].actionRateMulti *= 0.65;
        }
    },
    {
        id: 'drone_tesla_overload',
        name: 'Storm Core',
        rarity: 'Epic',
        description: '[Arc] +2 Chain Targets, Zaps 25% faster & +2 Damage.',
        targetBehaviors: ['TESLA'],
        onApply: (droneMods) => {
            droneMods['TESLA'].chainBonus += 2;
            droneMods['TESLA'].actionRateMulti *= 0.75;
            droneMods['TESLA'].damageBonus += 2;
        }
    },

    // support type drone upgrades
    {
        id: 'drone_support_magnet_common',
        name: 'Magnetic Grapple',
        rarity: 'Common',
        description: '[Harvester] +25% Pickup Range and +20% Flight Speed.',
        targetBehaviors: ['SUPPORT'],
        onApply: (droneMods) => {
            droneMods['SUPPORT'].rangeMulti += 0.25;
            droneMods['SUPPORT'].speedMulti += 0.2;
        }
    },
    {
        id: 'drone_support_magnet',
        name: 'Turbo Collector',
        rarity: 'Rare',
        description: '[Harvester] +50% Pickup Range and +40% Flight Speed.',
        targetBehaviors: ['SUPPORT'],
        onApply: (droneMods) => {
            droneMods['SUPPORT'].rangeMulti += 0.5;
            droneMods['SUPPORT'].speedMulti += 0.4;
        }
    },
    {
        id: 'drone_support_heal_common',
        name: 'Repair Routine',
        rarity: 'Common',
        description: '[Harvester] Healing/Armor pulse triggers 15% more often.',
        targetBehaviors: ['SUPPORT'],
        onApply: (droneMods) => {
            droneMods['SUPPORT'].actionRateMulti *= 0.85;
        }
    },
    {
        id: 'drone_support_heal',
        name: 'Nano-Repair Matrix',
        rarity: 'Epic',
        description: '[Harvester] Healing/Armor pulse triggers 35% more often.',
        targetBehaviors: ['SUPPORT'],
        onApply: (droneMods) => {
            droneMods['SUPPORT'].actionRateMulti *= 0.65;
        }
    },

    // melee type drone upgrades
    {
        id: 'drone_melee_dmg_common',
        name: 'Serrated Edge',
        rarity: 'Common',
        description: '[Cyber-Saw] +1 Sawblade Contact Damage.',
        targetBehaviors: ['MELEE'],
        onApply: (droneMods) => {
            droneMods['MELEE'].damageBonus += 1;
        }
    },
    {
        id: 'drone_melee_dmg',
        name: 'Titanium Teeth',
        rarity: 'Rare',
        description: '[Cyber-Saw] +3 Sawblade Contact Damage.',
        targetBehaviors: ['MELEE'],
        onApply: (droneMods) => {
            droneMods['MELEE'].damageBonus += 3;
        }
    },
    {
        id: 'drone_melee_speed_common',
        name: 'Gyro Stabilizers',
        rarity: 'Common',
        description: '[Cyber-Saw] +25% Dash Speed.',
        targetBehaviors: ['MELEE'],
        onApply: (droneMods) => {
            droneMods['MELEE'].speedMulti += 0.25;
        }
    },
    {
        id: 'drone_melee_speed',
        name: 'Hyper-Thrusters',
        rarity: 'Epic',
        description: '[Cyber-Saw] +50% Dash Speed and 25% faster slice tick rate.',
        targetBehaviors: ['MELEE'],
        onApply: (droneMods) => {
            droneMods['MELEE'].speedMulti += 0.5;
            droneMods['MELEE'].actionRateMulti *= 0.75;
        }
    }
];
