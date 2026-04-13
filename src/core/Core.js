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
        this.gameOverButtons = [];
        this.settingsOpen = false;
        this.settingsTab = 'performance';
        this.settingsButtons = [];
        this.settingsKey = 'cyberpunk_settings';
        this.settings = {
            performance: {
                particles: true,
                enemyHealthBars: true
            },
            gameplay: {
                autoFire: false,
                crosshairColor: '#00ffcc'
            },
            audio: {
                // work in progress
            }
        };

        this._loadPersistentSettings();
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
        this.resetGame();
        this.gameState = 'PLAYING';
        this.isPaused = false;
        this.isGameOver = false;
        this.lastTime = performance.now();
    }

    resetGame() {
        const resets = [
            'player', 'ui', 'projectiles', 'enemies', 'drones', 'powerups',
            'experience', 'director', 'upgrades', 'particles'
        ];

        for (const name of resets) {
            const module = this.getModule(name);
            if (module && typeof module.reset === 'function') {
                module.reset();
            }
        }

        this.isPaused = false;
        this.isGameOver = false;
        this.pauseButtons = [];
        this.gameOverButtons = [];
    }

    _loadPersistentSettings() {
        try {
            const raw = localStorage.getItem(this.settingsKey);
            if (!raw) return;
            const stored = JSON.parse(raw);
            if (stored.performance) {
                this.settings.performance = { ...this.settings.performance, ...stored.performance };
            }
            if (stored.gameplay) {
                this.settings.gameplay = { ...this.settings.gameplay, ...stored.gameplay };
            }
            if (stored.audio) {
                this.settings.audio = { ...this.settings.audio, ...stored.audio };
            }
        } catch (error) {
            console.warn('Could not load settings from storage.', error);
        }
    }

    _savePersistentSettings() {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Could not save settings to storage.', error);
        }
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

        if (this.gameState === 'MENU' || isMenuOpen || this.isPaused || this.isGameOver || this.settingsOpen) {
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

        if (this.settingsOpen) {
            this._updateSettingsInput(deltaTime);
            return;
        }

        if (this.isPaused && !this.isGameOver) {
            this._updatePauseInput(deltaTime);
        }

        if (this.isGameOver) {
            this._updateGameOverInput(deltaTime);
        }

        this._updateGamepadMenuButton();
    }

    _update(deltaTime) {
        for (let module of this.modules.values()) {
            if (typeof module.update === 'function') {
                module.update(deltaTime);
            }
        }

        this._updateGamepadMenuButton();
    }

    _draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const bg = this.getModule('background');
        if (bg && bg.draw) bg.draw(this.ctx);

        if (this.settingsOpen) {
            this._drawSettingsMenu();
            const proj = this.getModule('projectiles');
            if (proj) {
                this._drawCrosshair(this.ctx, proj);
            }
            return;
        }

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
        const color = this.settings?.gameplay?.crosshairColor || '#00ffcc';
        
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
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

    _updateGamepadMenuButton() {
        const gamepad = this.getModule('gamepad');
        if (!gamepad || gamepad.gamepadIndex === null) return;
        if (!gamepad.justPressed.menu) return;
        if (this.gameState !== 'PLAYING' || this.isGameOver) return;

        const upgrades = this.getModule('upgrades');
        if (upgrades && upgrades.isSelectionActive) return;

        this.isPaused = !this.isPaused;
    }

    openSettingsMenu(origin = 'menu') {
        this.settingsOpen = true;
        this.settingsTab = 'performance';
        this.settingsOrigin = origin;
    }

    closeSettingsMenu() {
        this.settingsOpen = false;
        this.settingsButtons = [];
        this.settingsOrigin = null;
    }

    _updateSettingsInput(deltaTime) {
        const gamepad = this.getModule('gamepad');
        const proj = this.getModule('projectiles');
        if (!proj) return;

        const pointerX = proj.crosshairX ?? proj.mouseX;
        const pointerY = proj.crosshairY ?? proj.mouseY;
        const actionPressed = gamepad && gamepad.gamepadIndex !== null && (gamepad.justPressed.A || gamepad.justPressed.X);
        const backPressed = gamepad && gamepad.gamepadIndex !== null && gamepad.justPressed.B;

        if (backPressed) {
            this.closeSettingsMenu();
            return;
        }

        if (actionPressed) {
            for (const button of this.settingsButtons) {
                if (pointerX >= button.x && pointerX <= button.x + button.w && pointerY >= button.y && pointerY <= button.y + button.h) {
                    button.action();
                    return;
                }
            }
        }
    }

    _drawSettingsMenu() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const settings = this.settings;
        const tabTitles = {
            performance: 'Performance',
            gameplay: 'Gameplay',
            audio: 'Audio (WIP)'
        };

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 56px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffcc';
        ctx.fillText('SETTINGS', w / 2, 100);
        ctx.restore();

        const tabWidth = 220;
        const tabHeight = 52;
        const tabSpacing = 18;
        const startX = (w - (tabWidth * 3 + tabSpacing * 2)) / 2;
        const tabY = 170;

        const proj = this.getModule('projectiles');
        const pointer = proj ? { x: proj.crosshairX ?? proj.mouseX, y: proj.crosshairY ?? proj.mouseY } : null;
        this.settingsButtons = [];

        Object.keys(tabTitles).forEach((tab, index) => {
            const x = startX + index * (tabWidth + tabSpacing);
            const y = tabY;
            const isSelected = this.settingsTab === tab;
            const isHovered = pointer && this._isHovered(pointer, x, y, tabWidth, tabHeight);

            ctx.save();
            ctx.fillStyle = isHovered ? '#0a2d30' : (isSelected ? '#0a2d30' : '#050606');
            ctx.strokeStyle = isHovered ? '#00ffcc' : (isSelected ? '#00ffcc' : '#333');
            ctx.lineWidth = 2;
            ctx.shadowBlur = isHovered ? 16 : 0;
            ctx.shadowColor = '#00ffcc';
            ctx.fillRect(x, y, tabWidth, tabHeight);
            ctx.strokeRect(x, y, tabWidth, tabHeight);
            ctx.fillStyle = isSelected ? '#ffffff' : '#88c8d0';
            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tabTitles[tab], x + tabWidth / 2, y + tabHeight / 2);
            ctx.restore();

            this.settingsButtons.push({ x, y, w: tabWidth, h: tabHeight, action: () => { this.settingsTab = tab; } });
        });
        const panelX = 80;
        const panelY = 250;
        const panelW = w - 160;
        const lineHeight = 42;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 40, 40, 0.7)';
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.fillRect(panelX, panelY, panelW, h - panelY - 140);
        ctx.strokeRect(panelX, panelY, panelW, h - panelY - 140);
        ctx.restore();

        const optionX = panelX + 30;
        let optionY = panelY + 40;

        const drawToggle = (label, value, action) => {
            ctx.fillStyle = '#00ffcc';
            ctx.font = '18px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(label, optionX, optionY + 8);

            const btnW = 180;
            const btnH = 38;
            const btnX = panelX + panelW - btnW - 30;
            const btnY = optionY - 16;
            const isHovered = pointer && this._isHovered(pointer, btnX, btnY, btnW, btnH);
            ctx.save();
            ctx.fillStyle = isHovered ? '#0a2d30' : (value ? '#00ffcc' : '#111');
            ctx.strokeStyle = isHovered ? '#00ffcc' : '#333';
            ctx.lineWidth = 2;
            ctx.shadowBlur = isHovered ? 14 : 0;
            ctx.shadowColor = '#00ffcc';
            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeRect(btnX, btnY, btnW, btnH);
            ctx.fillStyle = value ? '#050606' : '#888';
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value ? 'ON' : 'OFF', btnX + btnW / 2, btnY + btnH / 2);
            ctx.restore();

            this.settingsButtons.push({ x: btnX, y: btnY, w: btnW, h: btnH, action });
            optionY += 70;
        };

        if (this.settingsTab === 'performance') {
            drawToggle('Particle Effects', settings.performance.particles, () => {
                settings.performance.particles = !settings.performance.particles;
                this._savePersistentSettings();
            });
            drawToggle('Enemy Health Bars', settings.performance.enemyHealthBars, () => {
                settings.performance.enemyHealthBars = !settings.performance.enemyHealthBars;
                this._savePersistentSettings();
            });
        }

        if (this.settingsTab === 'gameplay') {
            drawToggle('Auto-Fire', settings.gameplay.autoFire, () => {
                settings.gameplay.autoFire = !settings.gameplay.autoFire;
                this._savePersistentSettings();
            });

            ctx.fillStyle = '#00ffcc';
            ctx.font = '18px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText('Crosshair Color', optionX, optionY + 8);
            optionY += 50;

            const colors = ['#00ffcc', '#ff55aa', '#ffff55', '#55ff55', '#ff5500', '#ffffff'];
            const swatchSize = 38;
            const swatchSpacing = 16;
            let swatchX = optionX;

            colors.forEach((color) => {
                const selected = settings.gameplay.crosshairColor === color;
                ctx.save();
                ctx.fillStyle = color;
                ctx.fillRect(swatchX, optionY, swatchSize, swatchSize);
                ctx.strokeStyle = selected ? '#00ffcc' : '#444';
                ctx.lineWidth = selected ? 4 : 2;
                ctx.strokeRect(swatchX, optionY, swatchSize, swatchSize);
                ctx.restore();

                const swatchHovered = pointer && this._isHovered(pointer, swatchX, optionY, swatchSize, swatchSize);
                ctx.save();
                ctx.strokeStyle = swatchHovered ? '#00ffcc' : (selected ? '#00ffcc' : '#444');
                ctx.lineWidth = swatchHovered ? 4 : (selected ? 4 : 2);
                ctx.strokeRect(swatchX, optionY, swatchSize, swatchSize);
                ctx.restore();

                this.settingsButtons.push({ x: swatchX, y: optionY, w: swatchSize, h: swatchSize, action: () => {
                    settings.gameplay.crosshairColor = color;
                    this._savePersistentSettings();
                }});
                swatchX += swatchSize + swatchSpacing;
            });

            optionY += swatchSize + 40;
        }

        if (this.settingsTab === 'audio') {
            ctx.fillStyle = '#00ffcc';
            ctx.font = '18px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText('Audio settings are work in progress.', optionX, optionY + 8);
        }

        const backW = 200;
        const backH = 50;
        const backX = w / 2 - backW / 2;
        const backY = h - 90;
        const backHovered = pointer && this._isHovered(pointer, backX, backY, backW, backH);
        ctx.save();
        ctx.fillStyle = backHovered ? '#0a2d30' : '#050606';
        ctx.strokeStyle = backHovered ? '#00ffcc' : '#333';
        ctx.lineWidth = 3;
        ctx.shadowBlur = backHovered ? 18 : 0;
        ctx.shadowColor = '#00ffcc';
        ctx.fillRect(backX, backY, backW, backH);
        ctx.strokeRect(backX, backY, backW, backH);
        ctx.fillStyle = '#88c8d0';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BACK', backX + backW / 2, backY + backH / 2);
        ctx.restore();
        this.settingsButtons.push({ x: backX, y: backY, w: backW, h: backH, action: () => this.closeSettingsMenu() });
    }

    _isHovered(pointer, x, y, w, h) {
        return pointer.x >= x && pointer.x <= x + w && pointer.y >= y && pointer.y <= y + h;
    }

    _handlePauseMouseClick(e) {
        if (this.settingsOpen) {
            this._handleSettingsMouseClick(e);
            return;
        }

        if (!this.isPaused && !this.isGameOver) return;

        const buttons = this.isGameOver ? this.gameOverButtons : this.pauseButtons;
        if (!buttons || buttons.length === 0) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (const button of buttons) {
            if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
                button.action();
                return;
            }
        }
    }

    _handleSettingsMouseClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (const button of this.settingsButtons) {
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
        const backPressed = gamepad.justPressed.B;

        if (backPressed) {
            const continueButton = this.pauseButtons.find((button) => button.text === 'CONTINUE');
            if (continueButton) {
                continueButton.action();
            }
            return;
        }

        if (!actionPressed) return;

        for (const button of this.pauseButtons) {
            if (pointerX >= button.x && pointerX <= button.x + button.w && pointerY >= button.y && pointerY <= button.y + button.h) {
                button.action();
                return;
            }
        }
    }

    _updateGameOverInput(deltaTime) {
        const gamepad = this.getModule('gamepad');
        const proj = this.getModule('projectiles');
        if (!proj) return;

        const hasPad = gamepad && gamepad.gamepadIndex !== null;
        if (!hasPad) return;

        const pointerX = proj.crosshairX ?? proj.mouseX;
        const pointerY = proj.crosshairY ?? proj.mouseY;
        const actionPressed = gamepad.justPressed.A || gamepad.justPressed.X;

        if (!actionPressed) return;

        for (const button of this.gameOverButtons) {
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
            { x: btnX, y: btnY + btnH + 24, w: btnW, h: btnH, action: () => this.openSettingsMenu('pause'), text: 'SETTINGS' },
            { x: btnX, y: btnY + (btnH + 24) * 2, w: btnW, h: btnH, action: () => window.location.reload(), text: 'RESTART' }
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

    returnToMainMenu() {
        this.gameState = 'MENU';
        this.isPaused = false;
        this.isGameOver = false;
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
        ctx.fillStyle = 'rgba(5, 5, 15, 0.92)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 64px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0055';
        ctx.fillText('CRITICAL FAILURE', w / 2, 120);
        ctx.restore();

        const ui = this.getModule('ui');
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`FINAL SCORE: ${ui ? ui.score : 0}`, w / 2, 180);
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
        this.gameOverButtons = [
            { x: btnX, y: btnY, w: btnW, h: btnH, action: () => this.startGame(), text: 'PLAY AGAIN' },
            { x: btnX, y: btnY + btnH + 24, w: btnW, h: btnH, action: () => this.returnToMainMenu(), text: 'MAIN MENU' }
        ];

        this.gameOverButtons.forEach((button) => {
            const isHovered = pointer && pointer.x >= button.x && pointer.x <= button.x + button.w && pointer.y >= button.y && pointer.y <= button.y + button.h;
            ctx.save();
            ctx.fillStyle = isHovered ? '#120008' : '#090608';
            ctx.strokeStyle = isHovered ? '#ff0055' : '#333';
            ctx.lineWidth = 3;
            ctx.shadowBlur = isHovered ? 18 : 0;
            ctx.shadowColor = '#ff0055';
            ctx.fillRect(button.x, button.y, button.w, button.h);
            ctx.strokeRect(button.x, button.y, button.w, button.h);
            ctx.fillStyle = isHovered ? '#ffffff' : '#f0b0b8';
            ctx.font = 'bold 22px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(button.text, button.x + button.w / 2, button.y + button.h / 2);
            ctx.restore();
        });
    }
}