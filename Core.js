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

        this.center = {
        x: this.canvas.width / 2,
        y: this.canvas.height / 2
        };
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
        this.center = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
    }

    // Hlavní herní smyčka
    start() {
        requestAnimationFrame(this._gameLoop.bind(this));
    }

    _gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // 1. ÚPLNÉ ZASTAVENÍ (Game Over)
        if (this.isPaused) {
            return; 
        }

        // 2. KONTROLA MENU (Level-up)
        const upgrades = this.getModule('upgrades');
        const isMenuOpen = upgrades && upgrades.isSelectionActive;

        // Pokud menu NENÍ otevřené, aktualizujeme logiku (pohyb, střely, atd.)
        if (!isMenuOpen) {
            this._update(deltaTime);
        }

        // Vykreslování běží VŽDY (aby bylo vidět menu i scéna pod ním)
        this._draw();

        // Požádáme o další snímek
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Vykreslíme všechny běžné moduly (Hráč, Nepřátelé, Projektily, Částice, HUD)
        // Tady proběhne všechno "herní" kreslení, včetně Data Shockwave.
        for (const [key, module] of this.modules) {
            // Kreslíme vše, kromě 'upgrades' modulu
            if (module.draw && key !== 'upgrades') {
                module.draw(this.ctx);
            }
        }

        // 2. Vykreslíme UPGRADE MENU (pokud je otevřené) - ZCELA NA KONEC
        // To zaručí, že karty budou VŽDY nad vším ostatním.
        const upgrades = this.getModule('upgrades');
        if (upgrades && upgrades.isSelectionActive && upgrades.draw) {
            upgrades.draw(this.ctx);
        }
    }

    gameOver() {
        this.isPaused = true;
        
        setTimeout(() => {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            ctx.fillStyle = 'rgba(10, 10, 25, 0.85)';
            ctx.fillRect(0, 0, w, h);
            
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff0055';
            ctx.fillStyle = '#ff0055';
            ctx.font = 'bold 60px "Courier New", Courier, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.fillText('CRITICAL FAILURE', w / 2, h / 2 - 20);

            const ui = this.getModule('ui');
            if (ui) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '24px "Courier New"';
                ctx.fillText(`FINAL SCORE: ${ui.score}`, w / 2, h / 2 + 20);
            }
            
            // Podnadpis bez stínu
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#00ffcc';
            ctx.font = '20px "Courier New", Courier, monospace';
            ctx.fillText('REBOOT REQUIRED (PRESS F5)', w / 2, h / 2 + 60);
            
            console.log("Game Over screen rendered.");
        }, 20);
    }
}