export const CURRENT_VERSION = 'v0.7.1';

const CHANGELOG = [
    {
        version: 'v0.7.1',
        title: 'VIRUS REWORK & QOL',
        date: '28-11-2026',
        notes: [
            'Reworked Virus & Glitched enemy interactions.',
            'Added a new Assault Drone card and a new Auto-Recycle option.',
            'Added confirmation prompts for overwriting or destroying gear.',
            'Added a Small Text Scale slider and fixed minor UI bugs.',
            'Adjusted Boss HP, spawn pacing, and Scrap-to-XP balance.'
        ]
    },
    {
        version: 'v0.7.0',
        title: 'WE GOT BOSSES NOW!!',
        date: '28-11-2026',
        notes: [
            'Added 3 bosses: Firewall Warden, Null-Pointer & Apex Overmind.',
            'Added Boss HP bar, warning alerts, and guaranteed boss loot drops.',
            'Added an Enemy Boss Arena during boss fights.',
            'Added Bosses into the Enemies Codex.',
            'Unified game distances to units across all screen resolutions.'
        ]
    },
    {
        version: 'v0.6.0',
        title: 'SOUNDTRACK & SFX!',
        date: '21-11-2026',
        notes: [
            'Added a procedural soundtrack with 8 tracks.',
            'Added procedural SFX for combat, upgrades, hacks and UI.',
            'Added audio settings and a now playing track switcher in menus.',
            'Added a screen effect for the Overload hack and fixed a duplicate card.'
        ]
    },
    {
        version: 'v0.5.0',
        title: 'NEW THREATS!',
        date: '21-11-2026',
        notes: [
            'Added 6 new enemy types: EMP, Dasher, Glitched, Virus, Splitter & Shield Bearer.',
            'Added Enemies Bestiary to the Codex (3-tier kill progression).',
            'Added 24 new player cards and cool new mechanics.',
            'Added 18 new Synergies.',
            'Fixed minor UI bugs.'
        ]
    },
    {
        version: 'v0.4.0',
        title: 'SYNERGIES & OVERLOAD!',
        date: '17-11-2026',
        notes: [
            'Added Synergy system with 22 OP combos across Drones, Hacks, Augments and Upgrade Cards.',
            'Added full Main Menu Codex (Synergies, Augments, Cards, Drones & Hacks) with discovery tracking.',
            'Added 3 new Drones (Arc, Harvester, Cyber-Saw), 2 new Hacks (Data Siphon, Holo-Decoy) and 6 Drone Cards.',
            'Added Mk.II / Mk.III Set Bonus tiers, full Mk.III Scrap-to-XP exchange and Auto-Recycler Protocol card.',
            'Removed Forge Charges (craft anytime near active Forge), toned down augment drops and added double-click equip.',
            'Added 4-side enemy spawning, Pause on Focus Loss toggle, instant unpause input and 5 Performance settings.'
        ]
    },
    {
        version: 'v0.3.1',
        title: 'Defense, Aim Assist & Loadout',
        date: '17-11-2026',
        notes: [
            'Reworked Defense into rechargeable Armor Shields and re-enabled Titan Shell.',
            'Overhauled Aim Assist with forward-cone targeting, a strength slider and Smart Targeting.',
            'Added Cards, Drones & Hacks loadout tab with Drone/Hack scrapping, 0.5% Cyber-Scrap drops and XP orb size scaling.'
        ]
    },
    {
        version: 'v0.3.0',
        title: 'CYBERWARE AUGMENTS!',
        date: '16-11-2026',
        notes: [
            'Added augment system with 16 augments across 4 body slots and 4 types.',
            'Added 2-piece & 4-piece set bonuses (active ultimates & passives).',
            'Added augment inventory, duplicate fusion and Cyber-Forge terminals.'
        ]
    },
    {
        version: 'v0.2.3',
        title: 'Bugfixes & polish',
        date: '15-11-2026',
        notes: [
            'Fixed drone stats, upgrades and card icons.',
            'Fixed hack capacity, debuffs and reset state.',
            'Fixed level-up queue, collisions and UI bugs.'
        ]
    },
    {
        version: 'v0.2.2',
        title: 'Rebalance.',
        date: '18-04-2026',
        notes: [
            'Rebalanced enemies, player stats, hacks, drones, upgrades and spawn stages.',
            'Added common heal upgrade card.',
            'Added new lategame stage'
        ]
    },
    {
        version: 'v0.2.1',
        title: 'Keybindings & more',
        date: '18-04-2026',
        notes: [
            'Added keybinding settings for all actions.',
            'Added section labels, dividers and scrollbars to settings.',
        ]
    },
    {
        version: 'v0.2.0',
        title: 'HACKS!',
        date: '17-04-2026',
        notes: [
            'Added new hack(active skills) system and 4 hack types.',
            'Added a changelog panel and version label to the main menu.',
        ]
    },
    {
        version: 'v0.1.2',
        title: 'Some cleaning...',
        date: '15-04-2026',
        notes: [
            'Refactored code and fixed some bugs.',
            'Added new font and UI scaling.',
            'Added new cursor styles and a cursor editor.',
            'Added a cooldown when closing the pause menu.',
        ]
    },
    {
        version: 'v0.1.1',
        title: 'Main menu and UI improvements',
        date: '13-04-2026',
        notes: [
            'Added main menu, settings, pause and a proper game over screen.',
            'Fixed gamepad support.',
        ]
    },
    {
        version: 'v0.1.0',
        title: 'Introducing DRONES!',
        date: '12-04-2026',
        notes: [
            'Added a drone system and the first 4 drone types.',
        ]
    },
    {
        version: 'v0.0.x',
        title: 'First steps...',
        date: 'xx-04-2026',
        notes: [
            'Created the basic game structure(player, background)',
            'Created the first enemy types.',
            'Added upgrade system.',
            'Added a powerup system.',
        ]
    }
];

export default CHANGELOG;