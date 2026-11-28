import { SPAWN_TIMELINE } from '../data/SpawnTimeline.js';
import { BOSS_MILESTONES } from '../data/EnemyTypes.js';

export default class SpawnDirector {
    constructor() {
        this.gameTime = 0;
        this.currentPhase = null;
        this.phaseChanged = false;
        this.phaseTimer = 0;
        this._triggeredBossMilestones = new Set();
    }

    init(game) {
        this.game = game;
    }

    reset() {
        this.gameTime = 0;
        this.currentPhase = null;
        this.phaseChanged = false;
        this.phaseTimer = 0;
        this._triggeredBossMilestones.clear();
    }

    update(deltaTime) {
        this.gameTime += deltaTime;
        const seconds = this.gameTime / 1000;

        const enemyMgr = this.game.getModule('enemies');
        if (enemyMgr && typeof enemyMgr.spawnBoss === 'function') {
            for (let i = 0; i < BOSS_MILESTONES.length; i++) {
                if (this._triggeredBossMilestones.has(i)) continue;
                const m = BOSS_MILESTONES[i];
                if (seconds >= m.timeSec) {
                    this._triggeredBossMilestones.add(i);
                    enemyMgr.spawnBoss(m.bossId, m.hpScale || 1);
                }
            }
        }

        const phase = SPAWN_TIMELINE.find(p => seconds >= p.start && seconds < p.end);

        if (this.phaseChanged) {
            this.phaseTimer += deltaTime;
            if (this.phaseTimer > 5000) {
                this.phaseChanged = false;
            }
        }

        if (phase && seconds > phase.end - 1 && !this.phaseChanged) {
            this.phaseChanged = true;
            this.phaseTimer = 0;
        }

        if (phase && phase !== this.currentPhase) {
            if (this.currentPhase !== null) {
                this.phaseChanged = true;
                this.phaseTimer = 0;
            }
            this.currentPhase = phase;
            const enemyMgr = this.game.getModule('enemies');
            if (enemyMgr) {
                enemyMgr.spawnRate = phase.rate;
                enemyMgr.activePhase = phase; 
            }
        }
    }

    getPhaseName() {
        return this.currentPhase ? this.currentPhase.name : "Unknown Phase";
    }
}