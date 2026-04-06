import { SPAWN_TIMELINE } from './SpawnTimeline.js';

export default class SpawnDirector {
    constructor() {
        this.gameTime = 0;
        this.currentPhase = null;
        this.phaseChanged = false;
        this.phaseTimer = 0; // <--- Přidej tento řádek
    }

    init(game) {
        this.game = game;
    }

    update(deltaTime) {
        this.gameTime += deltaTime;
        const seconds = this.gameTime / 1000;

        const phase = SPAWN_TIMELINE.find(p => seconds >= p.start && seconds < p.end);

        if (phase && phase !== this.currentPhase) {
            this.currentPhase = phase;
            this.phaseChanged = true; // Signalizace pro UI
            this.phaseTimer = 0;      // Reset vnitřního časovače pro efekt
            
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