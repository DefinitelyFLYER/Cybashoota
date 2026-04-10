export default class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.modules = new Map();
        this.lastTime = 0;
        this.isPaused = false;

        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());
        this.UNIT_SIZE = 100;

        this.center = {
        x: this.canvas.width / 2,
        y: this.canvas.height / 2
        };
    }

    addModule(name, moduleInstance) {
        this.modules.set(name, moduleInstance);
        if (typeof moduleInstance.init === 'function') {
            moduleInstance.init(this);
        }
        console.log(`Module [${name}] initialized.`);
    }

    getModule(name) {
        return this.modules.get(name);
    }

    _resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.center = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
    }

    start() {
        requestAnimationFrame(this._gameLoop.bind(this));
    }

    _gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;


        const upgrades = this.getModule('upgrades');
        const isMenuOpen = upgrades && upgrades.isSelectionActive;

        if (!isMenuOpen && !this.isPaused) {
            this._update(deltaTime);
        }

        this._draw();

        requestAnimationFrame(this._gameLoop.bind(this));
    }

    _update(deltaTime) {
        for (let module of this.modules.values()) {
            if (typeof module.update === 'function') {
                module.update(deltaTime);
            }
        }
    }

    _draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (const [key, module] of this.modules) {
            if (module.draw && key !== 'upgrades') {
                module.draw(this.ctx);
            }
        }

        if (this.isPaused) {
            this._drawGameOverScreen();
        }

        const upgrades = this.getModule('upgrades');
        if (upgrades && upgrades.isSelectionActive && upgrades.draw) {
            upgrades.draw(this.ctx);
        }

        const proj = this.getModule('projectiles');
        if (proj) {
            this._drawCrosshair(this.ctx, proj);
        }
    }

    _drawCrosshair(ctx, proj) {
        ctx.save();
        
        const x = proj.mouseX;
        const y = proj.mouseY;
        
        ctx.strokeStyle = '#00ffcc';
        ctx.fillStyle = '#00ffcc';
        ctx.lineWidth = 2;

        const gap = 4 + (proj.crosshairPulse * 12);
        const lineLen = 6;

        ctx.fillRect(x - 1, y - 1, 2, 2);

        ctx.beginPath();
        ctx.moveTo(x, y - gap); ctx.lineTo(x, y - gap - lineLen);
        ctx.moveTo(x, y + gap); ctx.lineTo(x, y + gap + lineLen);
        ctx.moveTo(x - gap, y); ctx.lineTo(x - gap - lineLen, y);
        ctx.moveTo(x + gap, y); ctx.lineTo(x + gap + lineLen, y);
        ctx.stroke();

        ctx.restore();
    }

    gameOver() {
        this.isPaused = true;
        console.log("Game Over state triggered.");
    }

    _drawGameOverScreen() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.save();
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
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#00ffcc';
        ctx.font = '20px "Courier New", Courier, monospace';
        ctx.fillText('REBOOT REQUIRED (PRESS F5)', w / 2, h / 2 + 60);
        ctx.restore();
    }
}