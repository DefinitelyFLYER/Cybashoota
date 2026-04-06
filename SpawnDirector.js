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

        // Najdeme aktuální fázi
        const phase = SPAWN_TIMELINE.find(p => seconds >= p.start && seconds < p.end);

        // Detekce blížícího se konce fáze (začne 1s před koncem)
        if (phase && seconds > phase.end - 1 && !this.phaseChanged) {
            this.phaseChanged = true;
            this.phaseTimer = 0;
        }

        if (phase && phase !== this.currentPhase) {
            this.currentPhase = phase;
            // Aktualizace EnemyManageru (stávající kód)
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