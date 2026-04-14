import { getFormattedStats } from '../ui/Infobox.js';

export default class MenuManager {
    constructor() {
        this.buttons = [];
        this.pauseButtons = [];
        this.gameOverButtons = [];
        this.settingsButtons = [];
        this.settingsTab = 'performance';
        this.settingsOrigin = null;
        this.mousePos = { x: 0, y: 0 };
        this.logo = new Image();
        this.logoLoaded = false;
        this.logo.onload = () => {
            this.logoLoaded = true;
        };
        this.logo.onerror = () => {
            this.logoLoaded = false;
        };
        this.logo.src = 'assets/logo.png';
    }

    init(game) {
        this.game = game;

        window.addEventListener('mousemove', (e) => {
            if (!this._isOverlayActive()) return;
            const rect = this.game.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });

        window.addEventListener('mousedown', () => {
            if (!this._isOverlayActive()) return;
            this._handleClick();
        });

        this._setupMenu();
    }

    update(deltaTime) {
        const gamepad = this.game.getModule('gamepad');
        const proj = this.game.getModule('projectiles');
        if (!proj) return;

        if (gamepad && gamepad.gamepadIndex !== null) {
            this.mousePos.x = proj.crosshairX ?? proj.mouseX;
            this.mousePos.y = proj.crosshairY ?? proj.mouseY;
            if ((gamepad.justPressed.A || gamepad.justPressed.X) && this._isOverlayActive()) {
                this._handleClick();
            }
        }

        if (this.game.settingsOpen) {
            this._updateSettingsInput(deltaTime);
        } else if (this.game.isGameOver) {
            this._updateGameOverInput(deltaTime);
        } else if (this.game.isPaused) {
            this._updatePauseInput(deltaTime);
        }
    }

    _isOverlayActive() {
        return this.game.gameState === 'MENU' || this.game.settingsOpen || this.game.isGameOver || this.game.isPaused;
    }

    _setupMenu() {
        this.menuItems = [
            { id: 'play', text: 'PLAY', action: () => this.game.startGame() },
            { id: 'settings', text: 'SETTINGS', action: () => this.openSettingsMenu('menu') }
        ];
    }

    _handleClick() {
        const buttons = this.game.settingsOpen
            ? this.settingsButtons
            : this.game.gameState === 'MENU'
                ? this.buttons
                : this.game.isGameOver
                    ? this.gameOverButtons
                    : this.game.isPaused
                        ? this.pauseButtons
                        : [];

        for (const btn of buttons) {
            if (this.mousePos.x >= btn.x && this.mousePos.x <= btn.x + btn.w &&
                this.mousePos.y >= btn.y && this.mousePos.y <= btn.y + btn.h) {
                btn.action();
                return;
            }
        }
    }

    openSettingsMenu(origin = 'menu') {
        this.game.settingsOpen = true;
        this.settingsTab = 'performance';
        this.settingsOrigin = origin;
    }

    closeSettingsMenu() {
        this.game.settingsOpen = false;
        this.settingsButtons = [];
        this.settingsOrigin = null;
    }

    draw(ctx) {
        if (this.game.settingsOpen) {
            this._drawSettingsMenu(ctx);
            return;
        }

        if (this.game.gameState === 'MENU') {
            this._drawMainMenu(ctx);
            return;
        }

        if (this.game.isGameOver) {
            this._drawGameOverScreen(ctx);
            return;
        }

        if (this.game.isPaused) {
            if (this.game.pauseResumeCooldownTimer > 0) {
                this._drawPauseCountdown(ctx);
            } else {
                this._drawPauseMenu(ctx);
            }
            return;
        }
    }

    _drawMainMenu(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

        ctx.fillStyle = 'rgba(5, 5, 10, 0.85)';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00ffcc';

        if (this.logoLoaded) {
            const maxLogoWidth = Math.min(w * 0.65, 700);
            const maxLogoHeight = Math.min(h * 0.22, 220);
            const aspect = this.logo.width / this.logo.height || 3;
            let logoWidth = maxLogoWidth;
            let logoHeight = logoWidth / aspect;
            if (logoHeight > maxLogoHeight) {
                logoHeight = maxLogoHeight;
                logoWidth = logoHeight * aspect;
            }

            ctx.drawImage(this.logo, (w - logoWidth) / 2, h / 3 - logoHeight / 2, logoWidth, logoHeight);
        } else {
            ctx.font = 'bold 80px "Courier New", monospace';
            ctx.fillStyle = '#00ffcc';
            ctx.fillText('CYBASHOOTA', w / 2, h / 3);
        }

        ctx.restore();

        this.buttons = [];
        const btnW = 300;
        const btnH = 60;
        const spacing = 30;
        const startY = h / 2;

        ctx.save();
        this.menuItems.forEach((item, index) => {
            const btnX = (w - btnW) / 2;
            const btnY = startY + index * (btnH + spacing);

            this.buttons.push({ x: btnX, y: btnY, w: btnW, h: btnH, action: item.action });

            const isHovered = (this.mousePos.x >= btnX && this.mousePos.x <= btnX + btnW &&
                               this.mousePos.y >= btnY && this.mousePos.y <= btnY + btnH);

            ctx.fillStyle = isHovered ? '#111' : '#050505';
            ctx.strokeStyle = isHovered ? '#00ffcc' : '#333';
            ctx.lineWidth = 3;

            if (isHovered) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00ffcc';
            } else {
                ctx.shadowBlur = 0;
            }

            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeRect(btnX, btnY, btnW, btnH);

            ctx.fillStyle = isHovered ? '#fff' : '#888';
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.text, btnX + btnW / 2, btnY + btnH / 2);
        });
        ctx.restore();
    }

    _getPointer() {
        const proj = this.game.getModule('projectiles');
        if (!proj) return null;
        return { x: proj.crosshairX ?? proj.mouseX, y: proj.crosshairY ?? proj.mouseY };
    }

    _updateSettingsInput(deltaTime) {
        const gamepad = this.game.getModule('gamepad');
        const pointer = this._getPointer();
        const hasPad = gamepad && gamepad.gamepadIndex !== null;
        if (!pointer) return;

        const actionPressed = hasPad && (gamepad.justPressed.A || gamepad.justPressed.X);
        const backPressed = hasPad && gamepad.justPressed.B;

        if (backPressed) {
            this.closeSettingsMenu();
            return;
        }

        if (!actionPressed) return;

        for (const button of this.settingsButtons) {
            if (pointer.x >= button.x && pointer.x <= button.x + button.w &&
                pointer.y >= button.y && pointer.y <= button.y + button.h) {
                button.action();
                return;
            }
        }
    }

    _drawSettingsMenu(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;
        const settings = this.game.settings;
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

        const pointer = this._getPointer();
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
                this.game._savePersistentSettings();
            });
            drawToggle('Enemy Health Bars', settings.performance.enemyHealthBars, () => {
                settings.performance.enemyHealthBars = !settings.performance.enemyHealthBars;
                this.game._savePersistentSettings();
            });
        }

        if (this.settingsTab === 'gameplay') {
            drawToggle('Auto-Fire', settings.gameplay.autoFire, () => {
                settings.gameplay.autoFire = !settings.gameplay.autoFire;
                this.game._savePersistentSettings();
            });

            drawToggle('Cooldown after pause', settings.gameplay.resumeCooldown, () => {
                settings.gameplay.resumeCooldown = !settings.gameplay.resumeCooldown;
                this.game._savePersistentSettings();
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
                    this.game._savePersistentSettings();
                }});
                swatchX += swatchSize + swatchSpacing;
            });

            optionY += swatchSize + 40;

            ctx.fillStyle = '#00ffcc';
            ctx.font = '18px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText('Crosshair Style', optionX, optionY + 8);
            optionY += 40;

            const styles = ['classic', 'dot', 'circle'];
            const btnW = 150;
            const btnH = 38;
            const btnSpacing = 16;
            let btnX = optionX;

            styles.forEach((style) => {
                const selected = settings.gameplay.cursorSkin === style;
                const isHovered = pointer && this._isHovered(pointer, btnX, optionY, btnW, btnH);

                ctx.save();
                ctx.fillStyle = selected ? '#00ffcc' : '#050606';
                ctx.strokeStyle = isHovered ? '#ffffff' : '#333';
                ctx.lineWidth = selected ? 3 : 2;
                ctx.shadowBlur = isHovered ? 10 : 0;
                ctx.shadowColor = '#00ffcc';
                ctx.fillRect(btnX, optionY, btnW, btnH);
                ctx.strokeRect(btnX, optionY, btnW, btnH);
                ctx.fillStyle = selected ? '#050606' : '#88c8d0';
                ctx.font = 'bold 14px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(style.toUpperCase(), btnX + btnW / 2, optionY + btnH / 2);
                ctx.restore();

                this.settingsButtons.push({ x: btnX, y: optionY, w: btnW, h: btnH, action: () => {
                    settings.gameplay.cursorSkin = style;
                    this.game._savePersistentSettings();
                }});

                btnX += btnW + btnSpacing;
            });

            optionY += btnH + 40;
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

    _updatePauseInput(deltaTime) {
        if (this.game.pauseResumeCooldownTimer > 0) return;

        const gamepad = this.game.getModule('gamepad');
        const pointer = this._getPointer();
        const hasPad = gamepad && gamepad.gamepadIndex !== null;
        if (!pointer || !hasPad) return;

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
            if (pointer.x >= button.x && pointer.x <= button.x + button.w &&
                pointer.y >= button.y && pointer.y <= button.y + button.h) {
                button.action();
                return;
            }
        }
    }

    _updateGameOverInput(deltaTime) {
        const gamepad = this.game.getModule('gamepad');
        const pointer = this._getPointer();
        const hasPad = gamepad && gamepad.gamepadIndex !== null;
        if (!pointer || !hasPad) return;

        const actionPressed = gamepad.justPressed.A || gamepad.justPressed.X;
        if (!actionPressed) return;

        for (const button of this.gameOverButtons) {
            if (pointer.x >= button.x && pointer.x <= button.x + button.w &&
                pointer.y >= button.y && pointer.y <= button.y + button.h) {
                button.action();
                return;
            }
        }
    }

    _drawPauseMenu(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

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

        const player = this.game.getModule('player');
        if (player) {
            this._drawPauseStatsInfobox(ctx, 40, h / 2 - 200, player);
        }

        const btnW = 260;
        const btnH = 64;
        const btnX = w - btnW - 40;
        const btnY = h / 2 - btnH - 10;

        const pointer = this._getPointer();
        this.pauseButtons = [
            { x: btnX, y: btnY, w: btnW, h: btnH, action: () => this.game.resumeGame(), text: 'CONTINUE' },
            { x: btnX, y: btnY + btnH + 24, w: btnW, h: btnH, action: () => this.openSettingsMenu('pause'), text: 'SETTINGS' },
            { x: btnX, y: btnY + (btnH + 24) * 2, w: btnW, h: btnH, action: () => window.location.reload(), text: 'RESTART' }
        ];

        this.pauseButtons.forEach((button) => {
            const isHovered = pointer && pointer.x >= button.x && pointer.x <= button.x + button.w &&
                              pointer.y >= button.y && pointer.y <= button.y + button.h;
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

    _drawPauseCountdown(ctx) {
        const seconds = Math.ceil(this.game.pauseResumeCooldownTimer / 1000);
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(seconds.toString(), this.game.canvas.width / 2, this.game.canvas.height / 2 + 100);
        ctx.restore();
    }

    _drawPauseStatsInfobox(ctx, x, y, player) {
        const rowH = 22;
        const panelW = 260;
        const panelH = 420;
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

    _drawGameOverScreen(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

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

        const ui = this.game.getModule('ui');
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`FINAL SCORE: ${ui ? ui.score : 0}`, w / 2, 180);
        ctx.restore();

        const player = this.game.getModule('player');
        if (player) {
            this._drawPauseStatsInfobox(ctx, 40, h / 2 - 200, player);
        }

        const btnW = 260;
        const btnH = 64;
        const btnX = w - btnW - 40;
        const btnY = h / 2 - btnH - 10;

        const pointer = this._getPointer();
        this.gameOverButtons = [
            { x: btnX, y: btnY, w: btnW, h: btnH, action: () => this.game.startGame(), text: 'PLAY AGAIN' },
            { x: btnX, y: btnY + btnH + 24, w: btnW, h: btnH, action: () => this.game.returnToMainMenu(), text: 'MAIN MENU' }
        ];

        this.gameOverButtons.forEach((button) => {
            const isHovered = pointer && pointer.x >= button.x && pointer.x <= button.x + button.w &&
                              pointer.y >= button.y && pointer.y <= button.y + button.h;
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
