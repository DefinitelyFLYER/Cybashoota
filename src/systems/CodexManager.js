import { SYNERGIES } from '../data/SynergyData.js';
import { AUGMENTS } from '../data/AugmentData.js';
import { UPGRADES } from '../data/UpgradeData.js';
import { DRONE_UPGRADES } from '../data/DroneUpgradeData.js';
import { DRONE_TYPES } from '../data/DroneTypes.js';
import { HACK_DATA } from '../data/HackData.js';
import { ENEMY_TYPES, ENEMY_CODEX_IDS, BOSS_CODEX_IDS } from '../data/EnemyTypes.js';

const ALL_CODEX_ENEMY_IDS = [...ENEMY_CODEX_IDS, ...BOSS_CODEX_IDS];

export default class CodexManager {
    constructor() {
        this.storageKey = 'cyberpunk_codex_discovered';
        this.discovered = {
            synergies: new Set(),
            augments: new Set(),
            playerCards: new Set(),
            droneCards: new Set(),
            drones: new Set(),
            hacks: new Set(),
            enemies: new Set()
        };
        this.enemyKills = {};
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
            if (parsed.enemyKills && typeof parsed.enemyKills === 'object') {
                for (const [enemyId, count] of Object.entries(parsed.enemyKills)) {
                    const num = Number(count);
                    if (Number.isFinite(num) && num > 0) {
                        this.enemyKills[enemyId] = Math.floor(num);
                    }
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
            payload.enemyKills = this.enemyKills;
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

    getEnemyThresholds(enemyId) {
        const cfg = ENEMY_TYPES[enemyId];
        if (cfg && cfg.codexTier === 'boss') return [1, 3, 10];
        return cfg && cfg.codexTier === 'elite' ? [1, 50, 150] : [1, 100, 250];
    }

    getEnemyKills(enemyId) {
        return this.enemyKills[enemyId] || 0;
    }

    getEnemyTier(enemyId) {
        const kills = this.getEnemyKills(enemyId);
        const [t1, t2, t3] = this.getEnemyThresholds(enemyId);
        if (kills >= t3) return 3;
        if (kills >= t2) return 2;
        if (kills >= t1) return 1;
        return 0;
    }

    getNextEnemyThreshold(enemyId) {
        const kills = this.getEnemyKills(enemyId);
        const [t1, t2, t3] = this.getEnemyThresholds(enemyId);
        if (kills < t1) return t1;
        if (kills < t2) return t2;
        if (kills < t3) return t3;
        return null;
    }

    recordEnemyKill(enemyId) {
        if (!enemyId || !ALL_CODEX_ENEMY_IDS.includes(enemyId)) return;
        this.enemyKills[enemyId] = (this.enemyKills[enemyId] || 0) + 1;
        this.discovered.enemies.add(enemyId);
        this._save();
    }

    setDebugStorage(enabled) {
        this.storageKey = enabled ? 'cyberpunk_codex_discovered_debug' : 'cyberpunk_codex_discovered';
        for (const set of Object.values(this.discovered)) set.clear();
        this.enemyKills = {};
        this._load();
    }

    addKillsToAll(amount = 50) {
        for (const id of ALL_CODEX_ENEMY_IDS) {
            this.enemyKills[id] = (this.enemyKills[id] || 0) + amount;
            this.discovered.enemies.add(id);
        }
        this._save();
    }

    unlockAll() {
        SYNERGIES.forEach(s => this.discovered.synergies.add(s.id));
        AUGMENTS.forEach(a => this.discovered.augments.add(a.id));
        UPGRADES.filter(u => !u.unlockHackId).forEach(u => this.discovered.playerCards.add(u.id));
        DRONE_UPGRADES.forEach(u => this.discovered.droneCards.add(u.id));
        Object.keys(DRONE_TYPES).forEach(id => this.discovered.drones.add(id));
        Object.keys(HACK_DATA).forEach(id => this.discovered.hacks.add(id));
        for (const id of ALL_CODEX_ENEMY_IDS) {
            const [, , t3] = this.getEnemyThresholds(id);
            this.enemyKills[id] = Math.max(this.enemyKills[id] || 0, t3);
            this.discovered.enemies.add(id);
        }
        this._save();
    }

    resetCodex() {
        for (const set of Object.values(this.discovered)) set.clear();
        this.enemyKills = {};
        this._save();
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
            },
            enemies: {
                found: ALL_CODEX_ENEMY_IDS.filter(id => this.getEnemyTier(id) >= 1).length,
                total: ALL_CODEX_ENEMY_IDS.length
            }
        };
    }
}
