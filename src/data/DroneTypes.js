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
    }
};