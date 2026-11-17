import { SYNERGIES } from '../data/SynergyData.js';
import { AUGMENTS } from '../data/AugmentData.js';
import { UPGRADES } from '../data/UpgradeData.js';
import { DRONE_UPGRADES } from '../data/DroneUpgradeData.js';
import { DRONE_TYPES } from '../data/DroneTypes.js';
import { HACK_DATA } from '../data/HackData.js';

export default class CodexManager {
    constructor() {
        this.storageKey = 'cyberpunk_codex_discovered';
        this.discovered = {
            synergies: new Set(),
            augments: new Set(),
            playerCards: new Set(),
            droneCards: new Set(),
            drones: new Set(),
            hacks: new Set()
        };
        this._load();
    }

    init(game) {
        this.game = game;
        // Migrate any previously discovered synergies from SynergyManager
        const synMgr = game.getModule('synergies');
        if (synMgr && synMgr.discoveredSynergies) {
            let changed = false;
            for (const id of synMgr.discoveredSynergies) {
                if (!this.discovered.synergies.has(id)) {
                    this.discovered.synergies.add(id);
                    changed = true;
                }
            }
            if (changed) this._save();
        }
    }

    _load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            for (const key of Object.keys(this.discovered)) {
                if (Array.isArray(parsed[key])) {
                    this.discovered[key] = new Set(parsed[key]);
                }
            }
        } catch {
            // ignore storage errors
        }
    }

    _save() {
        try {
            const payload = {};
            for (const [key, set] of Object.entries(this.discovered)) {
                payload[key] = [...set];
            }
            localStorage.setItem(this.storageKey, JSON.stringify(payload));
        } catch {
            // ignore storage errors
        }
    }

    discover(category, id) {
        if (!id || !this.discovered[category]) return false;
        if (this.discovered[category].has(id)) return false;
        this.discovered[category].add(id);
        this._save();
        return true;
    }

    isDiscovered(category, id) {
        if (!this.discovered[category]) return false;
        if (category === 'synergies') {
            const synMgr = this.game?.getModule('synergies');
            if (synMgr && synMgr.isDiscovered(id)) return true;
        }
        return this.discovered[category].has(id);
    }

    getCounts() {
        return {
            synergies: {
                found: SYNERGIES.filter(s => this.isDiscovered('synergies', s.id)).length,
                total: SYNERGIES.length
            },
            augments: {
                found: AUGMENTS.filter(a => this.isDiscovered('augments', a.id)).length,
                total: AUGMENTS.length
            },
            playerCards: {
                found: UPGRADES.filter(u => !u.unlockHackId && this.isDiscovered('playerCards', u.id)).length,
                total: UPGRADES.filter(u => !u.unlockHackId).length
            },
            droneCards: {
                found: DRONE_UPGRADES.filter(u => this.isDiscovered('droneCards', u.id)).length,
                total: DRONE_UPGRADES.length
            },
            dronesAndHacks: {
                found: Object.keys(DRONE_TYPES).filter(id => this.isDiscovered('drones', id)).length +
                    Object.keys(HACK_DATA).filter(id => this.isDiscovered('hacks', id)).length,
                total: Object.keys(DRONE_TYPES).length + Object.keys(HACK_DATA).length
            }
        };
    }
}
