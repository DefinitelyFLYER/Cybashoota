export const SYNERGIES = [
    {
        id: 'orbital_railcannon',
        name: 'Orbital Railcannon',
        color: '#ff0055',
        description: 'Sniper Drone fires a piercing crimson rail-beam across the screen, hitting all enemies in a line for 3x damage.',
        requirements: [
            {
                label: 'Sniper Drone',
                revealedInHint: true,
                check: ({ drones }) => drones.some(d => d.id === 'SNIPER_DRONE')
            },
            {
                label: '2+ STRIKER Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.STRIKER || 0) >= 2
            },
            {
                label: 'Piercing Rounds or Railgun Protocol',
                revealedInHint: false,
                check: ({ inventory }) => (inventory.penetration_module || 0) > 0 || (inventory.heavy_railgun || 0) > 0
            }
        ]
    },
    {
        id: 'solar_aegis',
        name: 'Solar Aegis',
        color: '#ff9900',
        description: 'Aegis Drone reflects intercepted projectiles back as homing plasma orbs (3x DMG) and restores 1 Armor Charge every 4 intercepts.',
        requirements: [
            {
                label: 'Aegis Drone',
                revealedInHint: true,
                check: ({ drones }) => drones.some(d => d.id === 'SHIELD_DEFENDER')
            },
            {
                label: '2+ TITAN Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.TITAN || 0) >= 2
            },
            {
                label: 'Signal Jammer Hack',
                revealedInHint: false,
                check: ({ hacks }) => hacks.includes('SIGNAL_JAMMER')
            }
        ]
    },
    {
        id: 'viral_swarm',
        name: 'Viral Swarm',
        color: '#bc00ff',
        description: 'Saboteur Drone marks automatically apply Primary Glitch. Glitched enemy deaths infect all nearby enemies and launch 3 homing shards.',
        requirements: [
            {
                label: 'Saboteur Drone',
                revealedInHint: true,
                check: ({ drones }) => drones.some(d => d.id === 'SABOTEUR_DRONE')
            },
            {
                label: 'Glitch EM Hack',
                revealedInHint: false,
                check: ({ hacks }) => hacks.includes('GLITCH_EM')
            },
            {
                label: '2+ NETRUNNER Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.NETRUNNER || 0) >= 2
            }
        ]
    },
    {
        id: 'bullet_choir',
        name: 'Bullet Choir',
        color: '#00ffcc',
        description: 'Assault Drone fires a 3-round spread burst of projectiles that inherit your Ricochet and Crit stats.',
        requirements: [
            {
                label: 'Assault Drone',
                revealedInHint: true,
                check: ({ drones }) => drones.some(d => d.id === 'BASIC_SHOOTER')
            },
            {
                label: 'Multishot Protocol',
                revealedInHint: false,
                check: ({ inventory }) => (inventory.multishot || 0) > 0
            },
            {
                label: 'Ricochet Module or Mastery',
                revealedInHint: false,
                check: ({ inventory }) => (inventory.ricochet_logic || 0) > 0 || (inventory.advanced_ricochet_module || 0) > 0
            }
        ]
    },
    {
        id: 'tesla_coil',
        name: 'Tesla Coil',
        color: '#00bcff',
        description: 'Assault Drone shots chain lightning arcs to 2 nearby enemies. System Overload unleashes a lightning storm from you and your drone.',
        requirements: [
            {
                label: 'Assault Drone',
                revealedInHint: false,
                check: ({ drones }) => drones.some(d => d.id === 'BASIC_SHOOTER')
            },
            {
                label: 'System Overload Hack',
                revealedInHint: true,
                check: ({ hacks }) => hacks.includes('OVERLOAD')
            },
            {
                label: '2+ NETRUNNER Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.NETRUNNER || 0) >= 2
            }
        ]
    },
    {
        id: 'chrono_mirage',
        name: 'Chrono-Mirage',
        color: '#00ffcc',
        description: 'While Ghost Protocol is active, 2 phantom turret clones mirror your shots (50% DMG) and dodging extends Ghost Protocol by +1.5s.',
        requirements: [
            {
                label: 'Ghost Protocol Hack',
                revealedInHint: true,
                check: ({ hacks }) => hacks.includes('GHOST_PROTOCOL')
            },
            {
                label: '2+ GHOST Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.GHOST || 0) >= 2
            }
        ]
    },
    {
        id: 'emp_singularity',
        name: 'EMP Singularity',
        color: '#ff55aa',
        description: 'System Overload pulls all visible enemies toward your cursor and detonates a 12 DMG plasma nova at the cursor.',
        requirements: [
            {
                label: 'System Overload Hack',
                revealedInHint: true,
                check: ({ hacks }) => hacks.includes('OVERLOAD')
            },
            {
                label: '2+ STRIKER Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.STRIKER || 0) >= 2
            },
            {
                label: 'Glitchy Ammo or Plasma Enlarger',
                revealedInHint: false,
                check: ({ inventory }) => (inventory.big_bullets || 0) > 0 || (inventory.plasma_enlarger || 0) > 0
            }
        ]
    },
    {
        id: 'blackout_matrix',
        name: 'Blackout Matrix',
        color: '#bc00ff',
        description: 'While Signal Jammer is active, enemies take +75% bonus damage from all sources and your Fire Rate increases by +50%.',
        requirements: [
            {
                label: 'Signal Jammer Hack',
                revealedInHint: true,
                check: ({ hacks }) => hacks.includes('SIGNAL_JAMMER')
            },
            {
                label: '2+ NETRUNNER Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.NETRUNNER || 0) >= 2
            },
            {
                label: '2+ GHOST Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.GHOST || 0) >= 2
            }
        ]
    },
    {
        id: 'glitch_nova',
        name: 'Glitch Nova',
        color: '#ff00ff',
        description: 'Ricocheting bullets have a 35% chance on bounce to apply Secondary Glitch, and Glitch EM has -40% cooldown.',
        requirements: [
            {
                label: 'Glitch EM Hack',
                revealedInHint: true,
                check: ({ hacks }) => hacks.includes('GLITCH_EM')
            },
            {
                label: 'Ricochet Mastery or 2x Ricochet Module',
                revealedInHint: false,
                check: ({ inventory }) => (inventory.advanced_ricochet_module || 0) > 0 || (inventory.ricochet_logic || 0) >= 2
            },
            {
                label: '2+ GHOST Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.GHOST || 0) >= 2
            }
        ]
    },
    {
        id: 'juggernaut_fortress',
        name: 'Juggernaut Fortress',
        color: '#ff7b00',
        description: 'When an Armor Charge breaks, unleash a 360° ring of 12 fiery projectiles and gain +25% Move Speed & +35% Fire Rate for 3s.',
        requirements: [
            {
                label: '2+ TITAN Augments',
                revealedInHint: true,
                check: ({ typeCounts }) => (typeCounts.TITAN || 0) >= 2
            },
            {
                label: 'Titan Shell Card',
                revealedInHint: false,
                check: ({ inventory }) => (inventory.armor || 0) > 0
            },
            {
                label: 'Backup Battery Card',
                revealedInHint: false,
                check: ({ inventory }) => (inventory.extra_hp || 0) > 0
            }
        ]
    },
    {
        id: 'phantom_barrage',
        name: 'Phantom Barrage',
        color: '#00ffcc',
        description: 'Critical hits have a 25% chance to fire a free bonus homing dagger at a nearby enemy.',
        requirements: [
            {
                label: '2+ GHOST Augments',
                revealedInHint: true,
                check: ({ typeCounts }) => (typeCounts.GHOST || 0) >= 2
            },
            {
                label: 'Smart Targeting Card',
                revealedInHint: false,
                check: ({ inventory }) => (inventory.smart_targeting || 0) > 0
            },
            {
                label: 'Optical Sensor Card',
                revealedInHint: false,
                check: ({ inventory }) => (inventory.crit_chance || 0) > 0
            }
        ]
    },
    {
        id: 'cyber_overload',
        name: 'Cyber-Overload',
        color: '#ffcc00',
        description: 'Activating your 4-Piece Set Ultimate (or triggering a 4-Piece Passive) resets your Hack cooldown and overclocks Drones for 5s.',
        requirements: [
            {
                label: '4-Piece Augment Set',
                revealedInHint: true,
                check: ({ augmentMgr }) => Boolean(augmentMgr?.activeFourPieceType)
            },
            {
                label: 'Any Active Drone',
                revealedInHint: false,
                check: ({ drones }) => drones.length > 0
            },
            {
                label: 'Any Unlocked Hack',
                revealedInHint: false,
                check: ({ hacks }) => hacks.length > 0
            }
        ]
    },
    {
        id: 'storm_conduit',
        name: 'Storm Conduit',
        color: '#00bcff',
        description: 'Arc Drone chains to +3 extra enemies and applies Secondary Glitch on every chain hit.',
        requirements: [
            {
                label: 'Arc Drone',
                revealedInHint: true,
                check: ({ drones }) => drones.some(d => d.id === 'ARC_DRONE')
            },
            {
                label: '2+ NETRUNNER Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.NETRUNNER || 0) >= 2
            },
            {
                label: 'System Overload Hack',
                revealedInHint: false,
                check: ({ hacks }) => hacks.includes('OVERLOAD')
            }
        ]
    },
    {
        id: 'blood_grinder',
        name: 'Blood Grinder',
        color: '#ff2244',
        description: 'Cyber-Saw Drone becomes 80% larger, 40% faster, deals 2x damage, and heals 1 HP every 25 hits.',
        requirements: [
            {
                label: 'Cyber-Saw Drone',
                revealedInHint: true,
                check: ({ drones }) => drones.some(d => d.id === 'SAW_DRONE')
            },
            {
                label: '2+ STRIKER Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.STRIKER || 0) >= 2
            },
            {
                label: 'High Voltage or Ghost Protocol',
                revealedInHint: false,
                check: ({ inventory, hacks }) => (inventory.damage_boost || 0) > 0 || hacks.includes('GHOST_PROTOCOL')
            }
        ]
    },
    {
        id: 'nano_harvest',
        name: 'Nano-Harvest',
        color: '#00ff66',
        description: 'Harvester & Data Siphon pickups have a 3% chance to drop +1 Cyber-Scrap, and Harvester pulse grants Shield HP when full.',
        requirements: [
            {
                label: 'Harvester Drone',
                revealedInHint: true,
                check: ({ drones }) => drones.some(d => d.id === 'HARVESTER_DRONE')
            },
            {
                label: 'Data Siphon Hack',
                revealedInHint: false,
                check: ({ hacks }) => hacks.includes('DATA_SIPHON')
            },
            {
                label: '2+ TITAN Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.TITAN || 0) >= 2
            }
        ]
    },
    {
        id: 'mirage_detonator',
        name: 'Mirage Detonator',
        color: '#ff00ff',
        description: 'Holo-Decoy fires 8 homing Glitch projectiles every 1.5s and explodes for 30 DMG + Primary Glitch.',
        requirements: [
            {
                label: 'Holo-Decoy Hack',
                revealedInHint: true,
                check: ({ hacks }) => hacks.includes('HOLO_DECOY')
            },
            {
                label: '2+ GHOST Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.GHOST || 0) >= 2
            },
            {
                label: 'Glitch EM Hack',
                revealedInHint: false,
                check: ({ hacks }) => hacks.includes('GLITCH_EM')
            }
        ]
    },
    {
        id: 'ion_barrage',
        name: 'Ion Barrage',
        color: '#00bcff',
        description: 'Assault Drone shots have a 30% chance to chain lightning on hit, and Arc Drone zaps 30% faster.',
        requirements: [
            {
                label: 'Arc Drone',
                revealedInHint: true,
                check: ({ drones }) => drones.some(d => d.id === 'ARC_DRONE')
            },
            {
                label: 'Assault Drone',
                revealedInHint: false,
                check: ({ drones }) => drones.some(d => d.id === 'BASIC_SHOOTER')
            }
        ]
    },
    {
        id: 'shredder_protocol',
        name: 'Shredder Protocol',
        color: '#ff2244',
        description: 'Cyber-Saw Drone deals +100% bonus damage to Marked enemies and automatically marks enemies it slices.',
        requirements: [
            {
                label: 'Cyber-Saw Drone',
                revealedInHint: true,
                check: ({ drones }) => drones.some(d => d.id === 'SAW_DRONE')
            },
            {
                label: 'Saboteur Drone',
                revealedInHint: false,
                check: ({ drones }) => drones.some(d => d.id === 'SABOTEUR_DRONE')
            }
        ]
    },
    {
        id: 'guardian_relay',
        name: 'Guardian Relay',
        color: '#00ff66',
        description: 'Whenever Aegis Drone intercepts a projectile, Harvester Drone pulse cooldown speeds up by 2.5s.',
        requirements: [
            {
                label: 'Aegis Drone',
                revealedInHint: true,
                check: ({ drones }) => drones.some(d => d.id === 'SHIELD_DEFENDER')
            },
            {
                label: 'Harvester Drone',
                revealedInHint: false,
                check: ({ drones }) => drones.some(d => d.id === 'HARVESTER_DRONE')
            }
        ]
    },
    {
        id: 'spotter_beam',
        name: 'Spotter Beam',
        color: '#ff0055',
        description: 'While Holo-Decoy is active, Sniper Drone fires 2x faster and its shots are guaranteed Critical Hits.',
        requirements: [
            {
                label: 'Sniper Drone',
                revealedInHint: true,
                check: ({ drones }) => drones.some(d => d.id === 'SNIPER_DRONE')
            },
            {
                label: 'Holo-Decoy Hack',
                revealedInHint: false,
                check: ({ hacks }) => hacks.includes('HOLO_DECOY')
            }
        ]
    },
    {
        id: 'bunker_buster',
        name: 'Bunker Buster',
        color: '#ff7b00',
        description: 'Gain +1 Armor Charge capacity and deal +35% bonus projectile damage while you have at least 1 Armor Charge.',
        requirements: [
            {
                label: '2+ TITAN Augments',
                revealedInHint: true,
                check: ({ typeCounts }) => (typeCounts.TITAN || 0) >= 2
            },
            {
                label: '2+ STRIKER Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.STRIKER || 0) >= 2
            }
        ]
    },
    {
        id: 'ghostwire',
        name: 'Ghostwire',
        color: '#bc00ff',
        description: 'Hack cooldowns are reduced by 25%, and activating any Hack grants +25% Dodge & +20% Move Speed for 4s.',
        requirements: [
            {
                label: '2+ GHOST Augments',
                revealedInHint: true,
                check: ({ typeCounts }) => (typeCounts.GHOST || 0) >= 2
            },
            {
                label: '2+ NETRUNNER Augments',
                revealedInHint: false,
                check: ({ typeCounts }) => (typeCounts.NETRUNNER || 0) >= 2
            }
        ]
    }
];

export const getSynergyById = (id) => SYNERGIES.find(s => s.id === id) || null;
