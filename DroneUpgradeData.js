export const DRONE_UPGRADES = [
    // ranged type drone upgrades
    {
        id: 'drone_ranged_dmg',
        name: 'Depleted Uranium Rounds',
        description: 'All ranged drones gain +2 Damage.',
        targetBehaviors: ['RANGED'],
        onApply: (droneMods) => { droneMods['RANGED'].damageBonus += 2; }
    },
    {
        id: 'drone_ranged_firerate',
        name: 'Autoloader Mechanisms',
        description: 'Ranged drones attack twice as fast.',
        targetBehaviors: ['RANGED'],
        onApply: (droneMods) => { droneMods['RANGED'].fireRateMulti *= 0.5; }
    },
    {
        id: 'drone_ranged_range',
        name: 'Advanced Optics',
        description: 'Increases the range of shooting drones by 100%.',
        targetBehaviors: ['RANGED'],
        onApply: (droneMods) => { droneMods['RANGED'].rangeMulti += 1.0; }
    },

    // interceptor type drone upgrades
    {
        id: 'drone_aegis_radius',
        name: 'Broad-Spectrum Shields',
        description: 'Interceptor block radius increased by 100%.',
        targetBehaviors: ['INTERCEPTOR'],
        onApply: (droneMods) => { droneMods['INTERCEPTOR'].blockRadiusMulti += 1.0; }
    },
    {
        id: 'drone_aegis_cooldown',
        name: 'Overcharged Capacitors',
        description: 'Interceptors recharge their defense matrix 50% faster.',
        targetBehaviors: ['INTERCEPTOR'],
        onApply: (droneMods) => { droneMods['INTERCEPTOR'].cooldownMulti *= 0.5; }
    },
    {
        id: 'drone_aegis_speed',
        name: 'Thruster Overdrive',
        description: 'Interceptors fly twice as fast to catch projectiles.',
        targetBehaviors: ['INTERCEPTOR'],
        onApply: (droneMods) => { droneMods['INTERCEPTOR'].speedMulti += 1.0; }
    },

    // debuff type drone upgrades
    {
        id: 'drone_debuff_rate',
        name: 'Rapid Analysis',
        description: 'Support drones mark targets twice as fast.',
        targetBehaviors: ['DEBUFF'],
        onApply: (droneMods) => { droneMods['DEBUFF'].actionRateMulti *= 0.5; }
    },
    {
        id: 'drone_debuff_range',
        name: 'Extended Sensor Array',
        description: 'Increases marking range of saboteur drones by 100%.',
        targetBehaviors: ['DEBUFF'],
        onApply: (droneMods) => { droneMods['DEBUFF'].rangeMulti += 1.0; }
    },
    {
        id: 'drone_debuff_combo',
        name: 'Aggressive Targeting',
        description: 'Marking range increased by 100% and speed by 100%.',
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
        description: 'All drones move and react 50% faster.',
        targetBehaviors: ['ALL'],
        onApply: (droneMods) => { droneMods['ALL'].speedMulti += 0.5; }
    },
    {
        id: 'drone_global_dmg',
        name: 'Core Overclock',
        description: 'All drones gain a universal +3 Damage bonus.',
        targetBehaviors: ['ALL'],
        onApply: (droneMods) => { droneMods['ALL'].damageBonus += 3; }
    },
    {
        id: 'drone_global_combat_ai',
        name: 'Combat AI Module',
        description: 'All drones gain +30% Speed and +2 Damage.',
        targetBehaviors: ['ALL'],
        onApply: (droneMods) => { 
            droneMods['ALL'].speedMulti += 0.30; 
            droneMods['ALL'].damageBonus += 2;
        }
    }
];