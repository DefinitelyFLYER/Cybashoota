import { getFormattedStats } from '../ui/Infobox.js';

export default class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.modules = new Map();
        this.lastTime = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.gameState = 'MENU';
        this.pauseButtons = [];

        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());
        window.addEventListener('keydown', (e) => this._handleGlobalKeydown(e));
        window.addEventListener('mousedown', (e) => this._handlePauseMouseClick(e));
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

    startGame() {
        this.gameState = 'PLAYING';
        this.isPaused = false;
        this.isGameOver = false;
        this.lastTime = performance.now();
    }

    _gameLoop(timestamp) {
        let deltaTime = timestamp - this.lastTime;
        if (deltaTime > 100) deltaTime = 16; 
        this.lastTime = timestamp;

        const upgrades = this.getModule('upgrades');
        const isMenuOpen = upgrades && upgrades.isSelectionActive;

        if (this.gameState === 'PLAYING' && !isMenuOpen && !this.isPaused && !this.isGameOver) {
            this._update(deltaTime);
        }

        if (this.gameState === 'MENU' || isMenuOpen || (this.isPaused && !this.isGameOver)) {
            this._updateMenuInput(deltaTime);
        }

        this._draw();

        requestAnimationFrame(this._gameLoop.bind(this));
    }

    _updateMenuInput(deltaTime) {
        const gamepad = this.getModule('gamepad');
        if (gamepad && typeof gamepad.update === 'function') {
            gamepad.update();
        }

        const proj = this.getModule('projectiles');
        if (proj && typeof proj.updateMenu === 'function') {
            proj.updateMenu(deltaTime);
        }

        const menu = this.getModule('menu');
        if (menu && typeof menu.update === 'function') {
            menu.update(deltaTime);
        }

        const upgrades = this.getModule('upgrades');
        if (upgrades && upgrades.isSelectionActive && typeof upgrades.update === 'function') {
            upgrades.update(deltaTime);
        }

        if (this.isPaused && !this.isGameOver) {
            this._updatePauseInput(deltaTime);
        }
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

        const bg = this.getModule('background');
        if (bg && bg.draw) bg.draw(this.ctx);

        if (this.gameState === 'MENU') {
            const menu = this.getModule('menu');
            if (menu && menu.draw) menu.draw(this.ctx);

            const proj = this.getModule('projectiles');
            if (proj) {
                this._drawCrosshair(this.ctx, proj);
            }
            return;
        }

        for (const [key, module] of this.modules) {
            if (module.draw && key !== 'upgrades' && key !== 'background' && key !== 'menu') {
                module.draw(this.ctx);
            }
        }

        if (this.isPaused && !this.isGameOver) {
            this._drawPauseMenu();
        }

        if (this.isGameOver) {
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
        
        const x = proj.crosshairX ?? proj.mouseX;
        const y = proj.crosshairY ?? proj.mouseY;
        
        ctx.strokeStyle = '#00ffcc';
        ctx.fillStyle = '#00ffcc';
        ctx.lineWidth = 2;

        const gap = 4 + (proj.crosshairPulse * 8);
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

    _handleGlobalKeydown(e) {
        if (e.code !== 'Escape') return;
        if (this.gameState !== 'PLAYING' || this.isGameOver) return;

        const upgrades = this.getModule('upgrades');
        if (upgrades && upgrades.isSelectionActive) return;

        this.isPaused = !this.isPaused;
    }

    _handlePauseMouseClick(e) {
        if (!this.isPaused || this.isGameOver) return;
        if (!this.pauseButtons || this.pauseButtons.length === 0) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (const button of this.pauseButtons) {
            if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
                button.action();
                return;
            }
        }
    }

    _updatePauseInput(deltaTime) {
        const gamepad = this.getModule('gamepad');
        const proj = this.getModule('projectiles');
        if (!proj) return;

        const hasPad = gamepad && gamepad.gamepadIndex !== null;
        if (!hasPad) return;

        const pointerX = proj.crosshairX ?? proj.mouseX;
        const pointerY = proj.crosshairY ?? proj.mouseY;
        const actionPressed = gamepad.justPressed.A || gamepad.justPressed.X;

        if (!actionPressed) return;

        for (const button of this.pauseButtons) {
            if (pointerX >= button.x && pointerX <= button.x + button.w && pointerY >= button.y && pointerY <= button.y + button.h) {
                button.action();
                return;
            }
        }
    }

    _drawPauseMenu() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 64px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffcc';
        ctx.fillText('PAUSED', w / 2, 120);
        ctx.restore();

        const player = this.getModule('player');
        if (player) {
            this._drawPauseStatsInfobox(ctx, 40, h / 2 - 200, player);
        }

        const btnW = 260;
        const btnH = 64;
        const btnX = w - btnW - 40;
        const btnY = h / 2 - btnH - 10;

        const pointer = this._getPausePointer();
        this.pauseButtons = [
            { x: btnX, y: btnY, w: btnW, h: btnH, action: () => this.resumeGame(), text: 'CONTINUE' },
            { x: btnX, y: btnY + btnH + 24, w: btnW, h: btnH, action: () => window.location.reload(), text: 'RESTART' }
        ];

        this.pauseButtons.forEach((button) => {
            const isHovered = pointer && pointer.x >= button.x && pointer.x <= button.x + button.w && pointer.y >= button.y && pointer.y <= button.y + button.h;
            ctx.save();
            ctx.fillStyle = isHovered ? '#0a2d30' : '#050606';
            ctx.strokeStyle = isHovered ? '#00ffcc' : '#333';
            ctx.lineWidth = 3;
            ctx.shadowBlur = isHovered ? 18 : 0;
            ctx.shadowColor = '#00ffcc';
            ctx.fillRect(button.x, button.y, button.w, button.h);
            ctx.strokeRect(button.x, button.y, button.w, button.h);
            ctx.fillStyle = isHovered ? '#ffffff' : '#88c8d0';
            ctx.font = 'bold 22px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(button.text, button.x + button.w / 2, button.y + button.h / 2);
            ctx.restore();
        });
    }

    _resumeGame() {
        this.isPaused = false;
    }

    resumeGame() {
        this.isPaused = false;
    }

    _getPausePointer() {
        const proj = this.getModule('projectiles');
        const gamepad = this.getModule('gamepad');
        const hasPad = gamepad && gamepad.gamepadIndex !== null;
        if (hasPad && proj) {
            return { x: proj.crosshairX ?? proj.mouseX, y: proj.crosshairY ?? proj.mouseY };
        }
        if (proj) {
            return { x: proj.mouseX, y: proj.mouseY };
        }
        return null;
    }

    _drawPauseStatsInfobox(ctx, x, y, player) {
        const rowH = 22; const panelW = 260; const panelH = 420;
        ctx.save();
        ctx.fillStyle = 'rgba(0, 40, 40, 0.5)';
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.fillRect(x - 10, y - 40, panelW, panelH);
        ctx.strokeRect(x - 10, y - 40, panelW, panelH);

        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('STATUS', x, y - 15);
        ctx.font = '12px monospace';

        const displayStats = getFormattedStats(player);
        displayStats.forEach((s, i) => {
            const curY = y + (i * rowH);
            ctx.fillStyle = '#00ffcc';
            ctx.fillText(s.label, x, curY);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.fillText(s.val, x + panelW - 30, curY);
            ctx.textAlign = 'left';
        });
        ctx.restore();
    }

    gameOver() {
        this.isPaused = true;
        this.isGameOver = true;
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