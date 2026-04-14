export default class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.modules = new Map();
        this.lastTime = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.gameState = 'MENU';
        this.settingsOpen = false;
        this.settingsKey = 'cyberpunk_settings';
        this.settings = {
            performance: {
                particles: true,
                enemyHealthBars: true
            },
            gameplay: {
                autoFire: false,
                resumeCooldown: true,
                crosshairColor: '#00ffcc'
            },
            audio: {
                // work in progress
            }
        };

        this.pauseResumeCooldownTimer = 0;
        this.pauseResumeCooldownDuration = 3000;

        this._loadPersistentSettings();
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());
        window.addEventListener('keydown', (e) => this._handleGlobalKeydown(e));
        window.addEventListener('blur', () => this._handleWindowInactivity());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this._handleWindowInactivity();
            }
        });
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
        this.pauseResumeCooldownTimer = 0;
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

        if (this.pauseResumeCooldownTimer > 0) {
            this.pauseResumeCooldownTimer -= deltaTime;
            if (this.pauseResumeCooldownTimer <= 0) {
                this.pauseResumeCooldownTimer = 0;
                this.isPaused = false;
            }
        }

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

        if (this.gameState !== 'MENU') {
            for (const [key, module] of this.modules) {
                if (module.draw && key !== 'background' && key !== 'menu') {
                    module.draw(this.ctx);
                }
            }
        }

        const upgrades = this.getModule('upgrades');
        if (upgrades && upgrades.isSelectionActive && upgrades.draw) {
            upgrades.draw(this.ctx);
        }

        const menu = this.getModule('menu');
        if (menu && typeof menu.draw === 'function') {
            menu.draw(this.ctx);
        }

        const ui = this.getModule('ui');
        const input = this.getModule('input');
        if (ui && ui.drawCursor && input) {
            ui.drawCursor(this.ctx, input, this.settings);
        }
    }

    _handleGlobalKeydown(e) {
        if (e.code !== 'Escape') return;
        if (this.gameState !== 'PLAYING' || this.isGameOver) return;
        if (this.pauseResumeCooldownTimer > 0) return;

        const upgrades = this.getModule('upgrades');
        if (upgrades && upgrades.isSelectionActive) return;

        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.isPaused = true;
        }
    }

    _updateGamepadMenuButton() {
        const gamepad = this.getModule('gamepad');
        if (!gamepad || gamepad.gamepadIndex === null) return;
        if (!gamepad.justPressed.menu) return;
        if (this.gameState !== 'PLAYING' || this.isGameOver) return;
        if (this.pauseResumeCooldownTimer > 0) return;

        const upgrades = this.getModule('upgrades');
        if (upgrades && upgrades.isSelectionActive) return;

        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.isPaused = true;
        }
    }

    _handleWindowInactivity() {
        if (this.gameState !== 'PLAYING' || this.isGameOver) return;
        if (this.pauseResumeCooldownTimer > 0) {
            this.pauseResumeCooldownTimer = 0;
        }
        this.isPaused = true;
    }


    resumeGame() {
        if (this.settings.gameplay.resumeCooldown) {
            this.pauseResumeCooldownTimer = this.pauseResumeCooldownDuration;
            this.isPaused = true;
        } else {
            this.isPaused = false;
        }
    }

    returnToMainMenu() {
        this.gameState = 'MENU';
        this.isPaused = false;
        this.isGameOver = false;
    }

    gameOver() {
        this.isPaused = true;
        this.isGameOver = true;
        console.log("Game Over state triggered.");
    }
}

