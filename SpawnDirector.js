import { SPAWN_TIMELINE } from './SpawnTimeline.js';

export default class SpawnDirector {
    constructor() {
        this.gameTime = 0;
        this.currentPhase = null;
        this.phaseChanged = false; // Změna na false
        this.phaseTimer = 0;
    }

    init(game) {
        this.game = game;
    }

    update(deltaTime) {
        this.gameTime += deltaTime;
        const seconds = this.gameTime / 1000;

        const phase = SPAWN_TIMELINE.find(p => seconds >= p.start && seconds < p.end);

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

    // Pomocná metoda pro UI (abys viděl, v jaké jsi fázi)
    getPhaseName() {
        return this.currentPhase ? this.currentPhase.name : "Unknown Phase";
    }
}