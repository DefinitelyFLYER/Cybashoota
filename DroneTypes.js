export const DRONE_TYPES = {
    'BASIC_SHOOTER': {
        id: 'BASIC_SHOOTER',
        name: 'Gun Drone',
        color: '#00ffcc',
        size: 24,
        sprite: 'assets/drones/gun_drone.png',
        
        movement: 'FOLLOW',
        followOffset: { x: -40, y: -50 },
        followSpeed: 0.1,
        
        behavior: 'RANGED',    
        targeting: 'CLOSEST_ENEMY', 
        
        fireRate: (player) => player.getStat('fireRate'), 
        damage: (player) => player.getStat('damage') * 0.5, 
        projectileSpeed: (player) => player.getStat('bulletSpeed') * 1.2, 
        range: 400 
    },
    
    'SHIELD_DEFENDER': {
        id: 'SHIELD_DEFENDER',
        name: 'Aegis Drone',
        color: '#ffcc00',
        size: 32,              
        sprite: 'assets/drones/shield_drone.png', 
        
        movement: 'ORBIT',
        orbitRadius: 120,
        orbitSpeed: 0.0015,
        
        hasCollision: true,
        pushbackForce: 1.5,
        collisionDamage: (player) => player.getStat('damage') * 0.2,

        behavior: 'INTERCEPTOR', 
        targeting: 'CLOSEST_PROJECTILE',
        
        droneAccuracy: 0.2, // for intercepting projectiles
        blockRadius: 400,       
        cooldown: 2000         
    },

    'SABOTEUR_DRONE': {
        id: 'SABOTEUR_DRONE',
        name: 'Saboteur Drone',
        color: '#bc00ff',
        size: 20,
        sprite: 'assets/drones/saboteur_drone.png',
        
        movement: 'FOLLOW',
        followOffset: { x: 0, y: -70 }, 
        followSpeed: 0.1,
        
        behavior: 'DEBUFF',    
        
        actionRate: 1500,
        range: 800,
        debuffMultiplier: 2.0,
        debuffTargets: 2
    },

    'SNIPER_DRONE': {
        id: 'SNIPER_DRONE',
        name: 'Sniper Drone',
        color: '#ff0055',
        size: 20,
        
        movement: 'FOLLOW',
        followOffset: { x: 40, y: -50 },
        followSpeed: 0.08,
        
        behavior: 'RANGED',    
        targeting: 'CURSOR',
        
        fireRate: 1500,         
        damage: 3,              
        projectileSpeed: 1.5,   
        range: 1000             
    }
};