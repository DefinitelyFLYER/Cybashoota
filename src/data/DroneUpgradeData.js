export const DRONE_UPGRADES = [
    // ranged type drone upgrades
    {
        id: 'drone_ranged_dmg',
        name: 'Depleted Uranium Rounds',
        description: '[Assault & Sniper] +2 Bullet Damage.',
        targetBehaviors: ['RANGED'],
        onApply: (droneMods) => { droneMods['RANGED'].damageBonus += 2; }
    },
    {
        id: 'drone_ranged_firerate',
        name: 'Autoloader Mechanisms',
        description: '[Assault & Sniper] Fire 2x faster (halves fire cooldown).',
        targetBehaviors: ['RANGED'],
        onApply: (droneMods) => { droneMods['RANGED'].fireRateMulti *= 0.5; }
    },
    {
        id: 'drone_ranged_range',
        name: 'Advanced Optics',
        description: '[Assault & Sniper] +100% Targeting Range.',
        targetBehaviors: ['RANGED'],
        onApply: (droneMods) => { droneMods['RANGED'].rangeMulti += 1.0; }
    },

    // interceptor type drone upgrades
    {
        id: 'drone_aegis_radius',
        name: 'Broad-Spectrum Shields',
        description: '[Aegis] +100% Projectile Block Radius.',
        targetBehaviors: ['INTERCEPTOR'],
        onApply: (droneMods) => { droneMods['INTERCEPTOR'].blockRadiusMulti += 1.0; }
    },
    {
        id: 'drone_aegis_cooldown',
        name: 'Overcharged Capacitors',
        description: '[Aegis] Block cooldown is 50% shorter.',
        targetBehaviors: ['INTERCEPTOR'],
        onApply: (droneMods) => { droneMods['INTERCEPTOR'].cooldownMulti *= 0.5; }
    },
    {
        id: 'drone_aegis_speed',
        name: 'Thruster Overdrive',
        description: '[Aegis] +100% Intercept Flight Speed.',
        targetBehaviors: ['INTERCEPTOR'],
        onApply: (droneMods) => { droneMods['INTERCEPTOR'].speedMulti += 1.0; }
    },

    // debuff type drone upgrades
    {
        id: 'drone_debuff_rate',
        name: 'Rapid Analysis',
        description: '[Saboteur] Marks enemies 2x faster (halves mark cooldown).',
        targetBehaviors: ['DEBUFF'],
        onApply: (droneMods) => { droneMods['DEBUFF'].actionRateMulti *= 0.5; }
    },
    {
        id: 'drone_debuff_range',
        name: 'Extended Sensor Array',
        description: '[Saboteur] +100% Mark Targeting Range.',
        targetBehaviors: ['DEBUFF'],
        onApply: (droneMods) => { droneMods['DEBUFF'].rangeMulti += 1.0; }
    },
    {
        id: 'drone_debuff_combo',
        name: 'Aggressive Targeting',
        description: '[Saboteur] +100% Mark Range and marks 2x faster.',
        targetBehaviors: ['DEBUFF'],
        onApply: (droneMods) => { 
            droneMods['DEBUFF'].rangeMulti += 1.0; 
            droneMods['DEBUFF'].actionRateMulti *= 0.5; 
        }
    },

    // all type drone upgrades
    {
        id: 'drone_global_speed',
        name: 'Sync Protocol',
        description: '[All Drones] +50% Flight, Orbit & Follow Speed.',
        targetBehaviors: ['ALL'],
        onApply: (droneMods) => { droneMods['ALL'].speedMulti += 0.5; }
    },
    {
        id: 'drone_global_dmg',
        name: 'Core Overclock',
        description: '[All Combat Drones] +3 Damage (Bullets, Lightning, Sawblade & Aegis Ram).',
        targetBehaviors: ['ALL'],
        onApply: (droneMods) => { droneMods['ALL'].damageBonus += 3; }
    },
    {
        id: 'drone_global_combat_ai',
        name: 'Combat AI Module',
        description: '[All Drones] +30% Flight Speed and +2 Combat Damage.',
        targetBehaviors: ['ALL'],
        onApply: (droneMods) => { 
            droneMods['ALL'].speedMulti += 0.30; 
            droneMods['ALL'].damageBonus += 2;
        }
    },

    // tesla type drone upgrades
    {
        id: 'drone_tesla_chains',
        name: 'High Voltage Coils',
        description: '[Arc] Lightning chains to +2 extra enemies and +25% Range.',
        targetBehaviors: ['TESLA'],
        onApply: (droneMods) => {
            droneMods['TESLA'].chainBonus += 2;
            droneMods['TESLA'].rangeMulti += 0.25;
        }
    },
    {
        id: 'drone_tesla_rate',
        name: 'Arc Capacitor',
        description: '[Arc] Zaps 35% faster (reduces zap cooldown).',
        targetBehaviors: ['TESLA'],
        onApply: (droneMods) => {
            droneMods['TESLA'].actionRateMulti *= 0.65;
        }
    },

    // support type drone upgrades
    {
        id: 'drone_support_magnet',
        name: 'Turbo Collector',
        description: '[Harvester] +50% Pickup Range and +40% Flight Speed.',
        targetBehaviors: ['SUPPORT'],
        onApply: (droneMods) => {
            droneMods['SUPPORT'].rangeMulti += 0.5;
            droneMods['SUPPORT'].speedMulti += 0.4;
        }
    },
    {
        id: 'drone_support_heal',
        name: 'Nano-Repair Matrix',
        description: '[Harvester] Healing/Armor pulse triggers 35% more often.',
        targetBehaviors: ['SUPPORT'],
        onApply: (droneMods) => {
            droneMods['SUPPORT'].actionRateMulti *= 0.65;
        }
    },

    // melee type drone upgrades
    {
        id: 'drone_melee_dmg',
        name: 'Titanium Teeth',
        description: '[Cyber-Saw] +3 Sawblade Contact Damage.',
        targetBehaviors: ['MELEE'],
        onApply: (droneMods) => {
            droneMods['MELEE'].damageBonus += 3;
        }
    },
    {
        id: 'drone_melee_speed',
        name: 'Hyper-Thrusters',
        description: '[Cyber-Saw] +50% Dash Speed and 25% faster slice tick rate.',
        targetBehaviors: ['MELEE'],
        onApply: (droneMods) => {
            droneMods['MELEE'].speedMulti += 0.5;
            droneMods['MELEE'].actionRateMulti *= 0.75;
        }
    }
];