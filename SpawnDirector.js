import { SPAWN_TIMELINE } from './SpawnTimeline.js';

export default class SpawnDirector {
    constructor() {
        this.gameTime = 0; // Čas v milisekundách
        this.currentPhase = null;
    }

    init(game) {
        this.game = game;
    }

    update(deltaTime) {
        this.gameTime += deltaTime;
        const seconds = this.gameTime / 1000;

        // Najdeme aktuální fázi podle času
        const phase = SPAWN_TIMELINE.find(p => seconds >= p.start && seconds < p.end);

        if (phase) {
            this.currentPhase = phase;
            
            // Aktualizujeme parametry v EnemyManageru dynamicky
            const enemyMgr = this.game.getModule('enemies');
            if (enemyMgr) {
                enemyMgr.spawnRate = phase.rate;
                // Předáme fázi do manageru pro další výpočty
                enemyMgr.activePhase = phase; 
            }
        }
    }

    // Pomocná metoda pro UI (abys viděl, v jaké jsi fázi)
    getPhaseName() {
        return this.currentPhase ? this.currentPhase.name : "Unknown Phase";
    }
}