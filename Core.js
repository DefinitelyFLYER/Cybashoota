/**
 * Core.js - Centrální mozek hry
 * Spravuje herní smyčku a koordinuje moduly.
 */
export default class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.modules = new Map(); // Registr aktivních modulů
        this.lastTime = 0;
        this.isPaused = false;

        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());
    }

    // Metoda pro přidání modulu (např. Player, Input, Renderer)
    addModule(name, moduleInstance) {
        this.modules.set(name, moduleInstance);
        if (typeof moduleInstance.init === 'function') {
            moduleInstance.init(this);
        }
        console.log(`Module [${name}] initialized.`);
    }

    // Získání modulu pro komunikaci mezi nimi
    getModule(name) {
        return this.modules.get(name);
    }

    _resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // Hlavní herní smyčka
    start() {
        requestAnimationFrame(this._gameLoop.bind(this));
    }

    _gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (!this.isPaused) {
            this._update(deltaTime);
            this._draw();
        }

        requestAnimationFrame(this._gameLoop.bind(this));
    }

    _update(deltaTime) {
        // Každý modul může mít svou update metodu
        for (let module of this.modules.values()) {
            if (typeof module.update === 'function') {
                module.update(deltaTime);
            }
        }
    }

    _draw() {
        // Vyčištění plátna - "Neonové" černé pozadí
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Vykreslení všech modulů
        for (let module of this.modules.values()) {
            if (typeof module.draw === 'function') {
                module.draw(this.ctx);
            }
        }
    }
}