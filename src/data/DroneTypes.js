export const DRONE_TYPES = {
    'BASIC_SHOOTER': {
        id: 'BASIC_SHOOTER',
        name: 'Assault Drone',
        description: 'Automated combat unit that follows the player and shoots at the closest targets.',
        color: '#00ffcc',
        size: 48,
        sprite: 'assets/drones/assault_drone.png',
        
        movement: 'FOLLOW',
        followOffset: { x: -0.4, y: -0.5 },
        followSpeed: 0.1,
        
        behavior: 'RANGED',    
        targeting: 'CLOSEST_ENEMY', 
        
        fireRate: (player) => player.getStat('fireRate') * 0.9, 
        damage: (player) => player.getStat('damage') * 0.75, 
        projectileSpeed: (player) => player.getStat('bulletSpeed') * 1.2, 
        range: 5
    },
    
    'SHIELD_DEFENDER': {
        id: 'SHIELD_DEFENDER',
        name: 'Aegis Drone',
        description: 'Defensive satellite orbiting the player. Actively seeks and destroys enemy projectiles.',
        color: '#ff7b00',
        size: 64,              
        sprite: 'assets/drones/shield_drone.png', 
        
        movement: 'ORBIT',
        orbitRadius: 1.2,
        orbitSpeed: 0.0015,
        
        hasCollision: true,
        pushbackForce: 1,
        collisionDamage: (player) => player.getStat('damage') * 0.2,

        behavior: 'INTERCEPTOR', 
        targeting: 'CLOSEST_PROJECTILE',
        
        droneAccuracy: 0.4,
        maxBoost: 12,
        blockRadius: 0.25,
        patrolRadius: 3,
        cooldown: 100         
    },

    'SABOTEUR_DRONE': {
        id: 'SABOTEUR_DRONE',
        name: 'Saboteur Drone',
        description: 'Support unit that marks targets. Marked enemies take double damage.',
        color: '#bc00ff',
        size: 48,
        sprite: 'assets/drones/saboteur_drone.png',
        
        movement: 'FOLLOW',
        followOffset: { x: 0, y: -0.7 },
        followSpeed: 0.1,
        
        behavior: 'DEBUFF',    
        
        actionRate: 4000,
        range: 10,
        debuffMultiplier: 2.5,
        debuffTargets: 1
    },
    
    'SNIPER_DRONE': {
        id: 'SNIPER_DRONE',
        name: 'Sniper Drone',
        description: 'Long-range specialist targeting your cursor. Extreme damage.',
        color: '#ff0055',
        size: 48,
        sprite: 'assets/drones/sniper_drone.png',
        
        movement: 'FOLLOW',
        followOffset: { x: 0.4, y: -0.5 },
        followSpeed: 0.06,
        
        behavior: 'RANGED',    
        targeting: 'CURSOR',
        
        fireRate: 1500,         
        damage: (player) => player.getStat('damage') * 1.2,      
        projectileSpeed: 1.6,   
        range: 12
    },

    'ARC_DRONE': {
        id: 'ARC_DRONE',
        name: 'Arc Drone',
        description: 'Tesla unit that zaps nearby enemies with chain lightning, slowing them.',
        color: '#00bcff',
        size: 50,
        sprite: 'assets/drones/arc_drone.png',

        movement: 'FOLLOW',
        followOffset: { x: -0.5, y: 0.45 },
        followSpeed: 0.09,

        behavior: 'TESLA',
        actionRate: 1350,
        damage: (player) => player.getStat('damage') * 0.9,
        range: 4.5,
        chainCount: 3
    },

    'HARVESTER_DRONE': {
        id: 'HARVESTER_DRONE',
        name: 'Harvester Drone',
        description: 'Utility unit that vacuums nearby drops and pulses to repair 1 HP or Armor every 25s.',
        color: '#00ff66',
        size: 52,
        sprite: 'assets/drones/harvester_drone.png',

        movement: 'FOLLOW',
        followOffset: { x: 0.5, y: 0.45 },
        followSpeed: 0.1,

        behavior: 'SUPPORT',
        actionRate: 25000,
        range: 4.5,
        collectSpeed: 0.48
    },

    'SAW_DRONE': {
        id: 'SAW_DRONE',
        name: 'Cyber-Saw Drone',
        description: 'Aggressive melee drone that dashes through enemy clusters, slicing them.',
        color: '#ff2244',
        size: 52,
        sprite: 'assets/drones/saw_drone.png',

        movement: 'FOLLOW',
        followOffset: { x: 0, y: 0.6 },
        followSpeed: 0.1,

        behavior: 'MELEE',
        actionRate: 350,
        damage: (player) => player.getStat('damage') * 1.15,
        range: 4.5,
        dashSpeed: 0.48
    }
};