import { getFormattedStats } from '../ui/Infobox.js';
import CHANGELOG, { CURRENT_VERSION } from '../ui/Changelog.js';
import { MENU_DEFINITIONS } from '../data/MenuDefinitions.js';
import { AUGMENT_SLOTS, AUGMENT_SLOT_LIST, AUGMENT_TYPES, AUGMENT_SET_BONUSES, AUGMENTS } from '../data/AugmentData.js';
import { UPGRADES } from '../data/UpgradeData.js';
import { DRONE_UPGRADES } from '../data/DroneUpgradeData.js';
import { DRONE_TYPES } from '../data/DroneTypes.js';
import { HACK_DATA } from '../data/HackData.js';
import { SYNERGIES } from '../data/SynergyData.js';
import { ENEMY_TYPES, ENEMY_CODEX_IDS } from '../data/EnemyTypes.js';

export default class MenuManager {
    constructor() {
        this.buttons = [];
        this.pauseButtons = [];
        this.gameOverButtons = [];
        this.settingsButtons = [];
        this.augmentsButtons = [];
        this.settingsTab = 'performance';
        this.settingsOrigin = null;
        this.augmentsOrigin = null;
        this.codexMode = false;
        this.augmentsTab = 'augments';
        this.codexTab = 'synergies';
        this.selectedAugmentItem = null;
        this.loadoutScrollOffset = 0;
        this.maxLoadoutScrollOffset = 0;
        this._lastStorageClick = { index: -1, time: 0 };
        this.mousePos = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.activeSlider = null;
        this.isWaitingForKey = false;
        this.waitingForKeyPath = null;
        this.waitingForKeyId = null;
        this.suppressNextSettingsMouseCapture = false;
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.changelogScrollOffset = 0;
        this.maxChangelogScrollOffset = 0;
        this.logo = new Image();
        this.logoLoaded = false;
        this.logo.onload = () => {
            this.logoLoaded = true;
        };
        this.logo.onerror = () => {
            this.logoLoaded = false;
        };
        this.logo.src = 'assets/logo.png';

        this.styleConfig = {
            fonts: {
                title: 'bold 64px "VT323", monospace',
                bigTitle: 'bold 80px "VT323", monospace',
                button: 'bold 24px "VT323", monospace',
                label: '24px "VT323", monospace',
                small: '20px "VT323", monospace',
                cardTitle: 'bold 24px "VT323", monospace',
                cardName: 'bold 24px "VT323", monospace',
                cardDescription: '20px "VT323", monospace',
                cardRarity: 'bold 18px "VT323", monospace',
                cardIcon: '10px "VT323", monospace',
                cardRequirement: 'italic bold 10px "VT323", monospace',
                cardFooter: 'bold 11px "VT323", monospace',
                infoTitle: 'bold 22px "VT323", monospace',
                infoText: '18px "VT323", monospace'
            },
            button: {
                default: {
                    fill: '#050606',
                    hoverFill: '#0a2d30',
                    stroke: '#333',
                    text: '#88c8d0',
                    textHover: '#ffffff',
                    shadowColor: '#00ffcc',
                    shadowBlur: 0,
                    hoverShadowBlur: 16,
                    strokeWidth: 3
                },
                danger: {
                    fill: '#090608',
                    hoverFill: '#120008',
                    stroke: '#ff0055',
                    text: '#f0b0b8',
                    textHover: '#ffffff',
                    shadowColor: '#ff0055',
                    shadowBlur: 0,
                    hoverShadowBlur: 18,
                    strokeWidth: 3
                },
                tab: {
                    fill: '#050606',
                    hoverFill: '#0a2d30',
                    stroke: '#333',
                    text: '#88c8d0',
                    textHover: '#ffffff',
                    shadowColor: '#00ffcc',
                    shadowBlur: 0,
                    hoverShadowBlur: 14,
                    strokeWidth: 2
                },
                selectedTab: {
                    fill: '#0a2d30',
                    hoverFill: '#0a2d30',
                    stroke: '#00ffcc',
                    text: '#ffffff',
                    textHover: '#ffffff',
                    shadowColor: '#00ffcc',
                    shadowBlur: 0,
                    hoverShadowBlur: 18,
                    strokeWidth: 2
                },
                toggle: {
                    fill: '#111',
                    hoverFill: '#0a2d30',
                    stroke: '#333',
                    text: '#888',
                    textHover: '#ffffff',
                    shadowColor: '#00ffcc',
                    shadowBlur: 0,
                    hoverShadowBlur: 14,
                    strokeWidth: 2
                },
                toggleOn: {
                    fill: '#00ffcc',
                    hoverFill: '#22ffe0',
                    stroke: '#00ffcc',
                    text: '#050606',
                    textHover: '#050606',
                    shadowColor: '#00ffcc',
                    shadowBlur: 0,
                    hoverShadowBlur: 14,
                    strokeWidth: 2
                }
            },
            panel: {
                default: {
                    fill: 'rgba(0, 40, 40, 0.75)',
                    stroke: '#00ffcc',
                    shadowColor: '#00ffcc',
                    shadowBlur: 0
                },
                overlay: {
                    fill: 'rgba(0, 0, 0, 0.5)',
                    stroke: 'transparent',
                    shadowColor: '#00ffcc',
                    shadowBlur: 0
                },
                card: {
                    fill: 'rgba(0, 40, 40, 0.75)',
                    stroke: '#00ffcc',
                    shadowColor: '#00ffcc',
                    shadowBlur: 0,
                    titleFont: 'bold 24px "VT323", monospace'
                }
            },
            colors: {
                title: '#00ffcc',
                accent: '#ff0055',
                text: '#ffffff'
            }
        };
    }

    init(game) {
        this.game = game;

        window.addEventListener('mousemove', this._handleMouseMove.bind(this));
        window.addEventListener('mousedown', () => {
            if (!this._isOverlayActive()) return;
            this.isMouseDown = true;
            if (!this.isWaitingForKey) {
                this._handleClick();
            }
        });
        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
            this.activeSlider = null;
        });
        window.addEventListener('keydown', this._handleSettingsKeyCapture.bind(this));
        window.addEventListener('mousedown', this._handleSettingsMouseCapture.bind(this));
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
            return;
        }

        if (this.game.augmentsOpen) {
            this._updateAugmentsInput(deltaTime, gamepad);
            return;
        }

        if (this.game.isGameOver) {
            this._updateScreenInput(deltaTime, this.gameOverButtons, gamepad);
            return;
        }

        if (this.game.isPaused) {
            if (this.game.pauseResumeCooldownTimer > 0) return;
            this._updateScreenInput(deltaTime, this.pauseButtons, gamepad);
        }
    }

    draw(ctx) {
        if (this.game.settingsOpen) {
            this._drawSettingsMenu(ctx);
            return;
        }

        if (this.game.augmentsOpen) {
            this._drawAugmentsMenu(ctx);
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
        }
    }

    drawButton(ctx, x, y, w, h, text, isHovered, styleType = 'default') {
        const style = this.styleConfig.button[styleType] || this.styleConfig.button.default;
        const fill = isHovered ? (style.hoverFill || style.fill) : style.fill;
        const stroke = style.stroke;
        const lineWidth = style.strokeWidth || 2;
        const shadowBlur = isHovered ? style.hoverShadowBlur || style.shadowBlur : style.shadowBlur;

        ctx.save();
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowColor = style.shadowColor;
        if (style.alpha !== undefined) ctx.globalAlpha = style.alpha;
        ctx.fillRect(x, y, w, h);
        if (stroke !== 'transparent') {
            ctx.strokeRect(x, y, w, h);
        }

        ctx.fillStyle = isHovered ? style.textHover : style.text;
        ctx.font = style.font || this.styleConfig.fonts.button;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, y + h / 2);
        ctx.restore();
    }

    drawPanel(ctx, x, y, w, h, title = '', styleType = 'default', alphaOverride = null) {
        const style = this.styleConfig.panel[styleType] || this.styleConfig.panel.default;

        ctx.save();
        if (alphaOverride !== null) {
            ctx.globalAlpha = alphaOverride;
        }
        ctx.fillStyle = style.fill;
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = 2;
        ctx.shadowBlur = style.shadowBlur;
        ctx.shadowColor = style.shadowColor;
        ctx.fillRect(x, y, w, h);
        if (style.stroke !== 'transparent') {
            ctx.strokeRect(x, y, w, h);
        }
        ctx.restore();

        if (title) {
            ctx.save();
            ctx.fillStyle = this.styleConfig.colors.title;
            const titleFont = style.titleFont || this.styleConfig.fonts.title;
            ctx.font = titleFont;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(title, x + w / 2, y + 20);
            ctx.restore();
        }
    }

    renderMenu(ctx, menuKey, layout = {}) {
        const menu = MENU_DEFINITIONS[menuKey];
        if (!menu || !menu.length) return [];

        const pointer = layout.pointer || this.mousePos;
        const x = layout.startX ?? 0;
        const y = layout.startY ?? 0;
        const width = layout.width ?? 300;
        const itemHeight = layout.itemHeight ?? 60;
        const spacing = layout.spacing ?? 20;

        const buttons = [];
        let nextY = y;

        menu.forEach((item) => {
            const text = typeof item.text === 'function' ? item.text() : item.text;
            const style = item.style || 'default';
            const isHovered = this._isHovered(pointer, x, nextY, width, itemHeight);
            const action = this._resolveAction(item);

            buttons.push({
                x,
                y: nextY,
                w: width,
                h: itemHeight,
                action,
                text,
                style,
                drag: item.drag
            });

            this.drawButton(ctx, x, nextY, width, itemHeight, text, isHovered, style);
            nextY += itemHeight + spacing;
        });

        return buttons;
    }

    _checkInput(pointer, buttons) {
        if (!pointer || !buttons) return false;
        for (const button of buttons) {
            if (this._isHovered(pointer, button.x, button.y, button.w, button.h)) {
                button.action();
                if (button.drag) {
                    this.activeSlider = button;
                }
                return true;
            }
        }
        return false;
    }

    _handleClick() {
        const buttons = this.game.settingsOpen
            ? this.settingsButtons
            : this.game.augmentsOpen
                ? this.augmentsButtons
                : this.game.gameState === 'MENU'
                    ? this.buttons
                    : this.game.isGameOver
                        ? this.gameOverButtons
                        : this.game.isPaused
                            ? this.pauseButtons
                            : [];

        this._checkInput(this.mousePos, buttons);
    }

    _updateScreenInput(deltaTime, buttons, gamepad) {
        const pointer = this._getPointer();
        const hasPad = gamepad && gamepad.gamepadIndex !== null;
        if (!pointer || !hasPad) return;

        const actionPressed = gamepad.justPressed.A || gamepad.justPressed.X;
        const backPressed = gamepad.justPressed.B;

        if (backPressed && this.game.settingsOpen) {
            this.closeSettingsMenu();
            return;
        }

        if (!actionPressed) return;
        this._checkInput(pointer, buttons);
    }

    _updateSettingsInput(deltaTime) {
        const gamepad = this.game.getModule('gamepad');
        const gamepadPointer = this._getPointer();
        const pointer = (gamepad && gamepad.gamepadIndex !== null) ? gamepadPointer : this.mousePos;
        if (!pointer) return;

        const actionPressed = gamepad && gamepad.gamepadIndex !== null && (gamepad.justPressed.A || gamepad.justPressed.X);
        const backPressed = gamepad && gamepad.gamepadIndex !== null && gamepad.justPressed.B;

        if (backPressed) {
            this.closeSettingsMenu();
            return;
        }

        if (this.isMouseDown && this.activeSlider && this.activeSlider.drag) {
            this.activeSlider.drag(pointer);
        }

        if (actionPressed) {
            this._checkInput(pointer, this.settingsButtons);
        }
    }

    _updateAugmentsInput(deltaTime, gamepad) {
        const pointer = this._getPointer();
        const hasPad = gamepad && gamepad.gamepadIndex !== null;
        if (!pointer || !hasPad) return;

        if (gamepad.justPressed.B) {
            this.closeAugmentsMenu();
            return;
        }

        if (gamepad.justPressed.A || gamepad.justPressed.X) {
            this._checkInput(pointer, this.augmentsButtons);
        }
    }

    _isOverlayActive() {
        return this.game.gameState === 'MENU' || this.game.settingsOpen || this.game.augmentsOpen || this.game.isGameOver || this.game.isPaused;
    }

    _handleMouseMove(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
    }

    _handleSettingsKeyCapture(e) {
        if (!this.game.settingsOpen || !this.isWaitingForKey || !this.waitingForKeyPath) return;
        e.preventDefault();
        this._setSettingsValue(this.waitingForKeyPath, e.code);
        this.isWaitingForKey = false;
        this.waitingForKeyPath = null;
        this.waitingForKeyId = null;
    }

    _handleSettingsMouseCapture(e) {
        if (this.suppressNextSettingsMouseCapture) {
            this.suppressNextSettingsMouseCapture = false;
            return;
        }
        if (!this.game.settingsOpen || !this.isWaitingForKey || !this.waitingForKeyPath) return;
        const buttonKey = `Mouse${e.button}`;
        e.preventDefault();
        this._setSettingsValue(this.waitingForKeyPath, buttonKey);
        this.isWaitingForKey = false;
        this.waitingForKeyPath = null;
        this.waitingForKeyId = null;
    }

    handleScroll(deltaY) {
        if (this.game.settingsOpen) {
            this.scrollOffset += deltaY;
            this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));
            return;
        }
        if (this.game.augmentsOpen && (this.augmentsTab === 'loadout' || this.augmentsTab === 'synergies')) {
            this.loadoutScrollOffset += deltaY;
            this.loadoutScrollOffset = Math.max(0, Math.min(this.loadoutScrollOffset, this.maxLoadoutScrollOffset));
            return;
        }
        if (this.game.gameState === 'MENU') {
            this.changelogScrollOffset += deltaY;
            this.changelogScrollOffset = Math.max(0, Math.min(this.changelogScrollOffset, this.maxChangelogScrollOffset));
        }
    }

    _formatBindingLabel(binding) {
        if (!binding) return 'UNBOUND';
        if (binding.startsWith('Mouse')) {
            switch (binding) {
                case 'Mouse0': return 'Left Click';
                case 'Mouse1': return 'Middle Click';
                case 'Mouse2': return 'Right Click';
                case 'Mouse3': return 'Mouse4';
                case 'Mouse4': return 'Mouse5';
                default: return binding;
            }
        }

        if (binding.startsWith('Key')) {
            return binding.slice(3);
        }
        if (binding.startsWith('Digit')) {
            return binding.slice(5);
        }
        if (binding.startsWith('Arrow')) {
            return binding.slice(5);
        }
        return binding;
    }

    openSettingsMenu(origin = 'menu') {
        this.game.settingsOpen = true;
        this.settingsTab = 'performance';
        this.settingsOrigin = origin;
        this.scrollOffset = 0;
    }

    closeSettingsMenu() {
        this.game.settingsOpen = false;
        this.settingsButtons = [];
        this.settingsOrigin = null;
    }

    openAugmentsMenu(origin = 'pause') {
        this.game.augmentsOpen = true;
        this.augmentsOrigin = origin;
        this.codexMode = false;
        this.augmentsTab = 'augments';
        this.codexTab = 'synergies';
        this.selectedAugmentItem = null;
        this.loadoutScrollOffset = 0;
        if (origin === 'gameplay') {
            this.game.isPaused = true;
            this.game.pauseResumeCooldownTimer = 0;
        }
    }

    openSynergyCodex(origin = 'menu') {
        this.game.augmentsOpen = true;
        this.augmentsOrigin = origin;
        this.codexMode = true;
        this.augmentsTab = 'synergies';
        this.codexTab = 'synergies';
        this.selectedAugmentItem = null;
        this.loadoutScrollOffset = 0;
    }

    closeAugmentsMenu() {
        const augmentMgr = this.game?.getModule('augments');
        if (augmentMgr && augmentMgr.pendingFourPieceChoiceType) return;

        const origin = this.augmentsOrigin;
        this.game.augmentsOpen = false;
        this.augmentsButtons = [];
        this.selectedAugmentItem = null;
        this.augmentsOrigin = null;
        this.codexMode = false;
        if (origin === 'gameplay') {
            this.game.resumeGame();
        }
    }

    setSettingsTab(tab) {
        this.settingsTab = tab;
        this.scrollOffset = 0;
    }

    _resolveAction(item) {
        if (typeof item.action === 'function') {
            return item.action;
        }

        if (typeof item.action !== 'string') {
            return () => {};
        }

        const method = this[item.action];
        if (typeof method !== 'function') {
            return () => {};
        }

        return () => method.apply(this, item.args || []);
    }

    _getSettingsValue(path) {
        return path.reduce((current, key) => {
            if (current && Object.prototype.hasOwnProperty.call(current, key)) {
                return current[key];
            }
            return undefined;
        }, this.game.settings);
    }

    _setSettingsValue(path, value) {
        let current = this.game.settings;
        for (let i = 0; i < path.length - 1; i += 1) {
            const key = path[i];
            if (typeof current[key] !== 'object' || current[key] === null) {
                current[key] = {};
            }
            current = current[key];
        }
        current[path[path.length - 1]] = value;
        this.game._savePersistentSettings();
    }

    startGame() {
        this.game.startGame();
    }

    returnToMainMenu() {
        this.game.returnToMainMenu();
    }

    resumeGame() {
        this.game.resumeGame();
    }

    reloadGame() {
        window.location.reload();
    }

    selectUpgrade() {
        // Placeholder for future upgrade menu handling
    }

    _getPointer() {
        const proj = this.game.getModule('projectiles');
        if (!proj) return null;
        return { x: proj.crosshairX ?? proj.mouseX, y: proj.crosshairY ?? proj.mouseY };
    }

    _drawMainMenu(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

        this.drawPanel(ctx, 0, 0, w, h, '', 'overlay');
        this._drawChangelogPanel(ctx);

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

            const logoX = (w - logoWidth) / 2;
            const logoY = h / 3 - logoHeight / 2;

            ctx.save();
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#00ffcc';
            ctx.drawImage(this.logo, logoX, logoY, logoWidth, logoHeight);
            ctx.restore();

            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.font = this.styleConfig.fonts.label;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(CURRENT_VERSION, logoX + logoWidth + 20, logoY + 10);
            ctx.restore();
        } else {
            ctx.save();
            ctx.fillStyle = '#00ffcc';
            ctx.font = this.styleConfig.fonts.bigTitle;
            ctx.textAlign = 'center';
            ctx.fillText('CYBASHOOTA', w / 2, h / 3);
            const titleMetrics = ctx.measureText('CYBASHOOTA');
            ctx.restore();

            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.font = this.styleConfig.fonts.label;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(CURRENT_VERSION, w / 2 + titleMetrics.width / 2 + 20, h / 3);
            ctx.restore();
        }

        const buttonWidth = 300;
        const buttonHeight = 60;
        const buttonX = (w - buttonWidth) / 2;
        const buttonY = h / 2;

        this.buttons = this.renderMenu(ctx, 'MAIN_MENU', {
            startX: buttonX,
            startY: buttonY,
            width: buttonWidth,
            itemHeight: buttonHeight,
            spacing: 30,
            pointer: this.mousePos
        });
    }

    _drawChangelogPanel(ctx) {
        const panelX = 40;
        const panelWidth = 470;
        const contentX = panelX + 20;
        const lineHeight = 24;
        const textWidth = panelWidth - 40;
        const maxPanelHeight = this.game.canvas.height - 80;

        ctx.font = this.styleConfig.fonts.infoText;

        const wrapText = (text, maxWidth) => {
            const words = text.split(' ');
            const lines = [];
            let line = '';

            words.forEach((word) => {
                const testLine = line ? `${line} ${word}` : word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && line) {
                    lines.push(line);
                    line = word;
                } else {
                    line = testLine;
                }
            });

            if (line) lines.push(line);
            return lines;
        };

        let requiredHeight = 80;
        CHANGELOG.forEach((entry, entryIndex) => {
            requiredHeight += lineHeight;
            if (entry.title) {
                requiredHeight += lineHeight * 1.1;
            }
            entry.notes.forEach((note) => {
                requiredHeight += wrapText(`- ${note}`, textWidth).length * lineHeight;
            });
            if (entryIndex < CHANGELOG.length - 1) {
                requiredHeight += lineHeight * 0.5;
            }
        });

        const panelHeight = Math.min(Math.max(requiredHeight + 40, 260), maxPanelHeight);
        const panelY = Math.max(40, (this.game.canvas.height - panelHeight) / 2);
        const viewportTop = panelY + 48;
        const viewportHeight = panelHeight - 68;
        const contentHeight = requiredHeight - 40;
        this.maxChangelogScrollOffset = Math.max(0, contentHeight - viewportHeight);
        this.changelogScrollOffset = Math.max(0, Math.min(this.changelogScrollOffset, this.maxChangelogScrollOffset));

        let currentY = panelY + 70 - this.changelogScrollOffset;

        this.drawPanel(ctx, panelX - 10, panelY - 10, panelWidth, panelHeight);

        ctx.save();
        ctx.fillStyle = '#00ffcc';
        ctx.font = this.styleConfig.fonts.infoTitle;
        ctx.textAlign = 'left';
        ctx.fillText('CHANGELOG', contentX, panelY + 25);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.rect(panelX - 8, viewportTop, panelWidth - 4, viewportHeight);
        ctx.clip();

        ctx.fillStyle = '#ffffff';
        ctx.font = this.styleConfig.fonts.infoText;
        ctx.textAlign = 'left';

        CHANGELOG.forEach((entry, entryIndex) => {
            ctx.fillStyle = '#00ffcc';
            ctx.fillText(`${entry.version} • ${entry.date}`, contentX, currentY);
            currentY += lineHeight;

            if (entry.title) {
                ctx.fillStyle = '#88c8d0';
                ctx.font = 'italic 18px "VT323", monospace';
                ctx.fillText(entry.title, contentX, currentY);
                currentY += lineHeight * 1.1;
                ctx.font = this.styleConfig.fonts.infoText;
            }

            ctx.fillStyle = '#ffffff';
            entry.notes.forEach((note) => {
                const wrappedLines = wrapText(`- ${note}`, textWidth);
                wrappedLines.forEach((line) => {
                    ctx.fillText(line, contentX, currentY);
                    currentY += lineHeight;
                });
            });

            if (entryIndex < CHANGELOG.length - 1) {
                currentY += lineHeight * 0.5;
            }
        });

        ctx.restore();
    }

    _drawSettingsMenu(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;
        const settings = this.game.settings;
        const tabWidth = 220;
        const tabHeight = 52;
        const tabSpacing = 18;
        const tabCount = MENU_DEFINITIONS.SETTINGS_MENU.tabs.length;
        const startX = (w - (tabWidth * tabCount + tabSpacing * (tabCount - 1))) / 2;
        const tabY = 170;
        const pointer = this._getPointer() || this.mousePos;
        const panelX = 80;
        const panelY = 250;
        const panelW = w - 160;
        const panelH = h - panelY - 140;
        const panelPadding = 40;
        const scrollButtonSize = 38;
        const optionX = panelX + panelPadding;
        const contentX = panelX + panelPadding;
        const contentY = panelY + panelPadding;
        const contentW = panelW - panelPadding * 2 - scrollButtonSize - 24;
        const contentH = panelH - panelPadding * 2;
        const swatchSize = 38;
        const swatchSpacing = 16;
        const sliderWidth = Math.min(360, contentW - 40);
        const sliderHeight = 10;
        const scrollX = panelX + panelW - panelPadding - scrollButtonSize;
        const scrollTopY = panelY + panelPadding;
        const scrollBottomY = panelY + panelH - panelPadding - scrollButtonSize;
        const rightControlX = contentX + contentW - 32;

        this.drawPanel(ctx, 0, 0, w, h, '', 'overlay', 0.5);

        ctx.save();
        ctx.fillStyle = this.styleConfig.colors.title;
        ctx.font = this.styleConfig.fonts.title;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.styleConfig.colors.title;
        ctx.fillText('SETTINGS', w / 2, 100);
        ctx.restore();

        this.settingsButtons = [];

        MENU_DEFINITIONS.SETTINGS_MENU.tabs.forEach((tab, index) => {
            const x = startX + index * (tabWidth + tabSpacing);
            const isSelected = this.settingsTab === tab.id;
            const style = isSelected ? 'selectedTab' : 'tab';
            const isHovered = pointer && this._isHovered(pointer, x, tabY, tabWidth, tabHeight);

            this.drawButton(ctx, x, tabY, tabWidth, tabHeight, tab.text, isHovered || isSelected, style);
            this.settingsButtons.push({ x, y: tabY, w: tabWidth, h: tabHeight, action: this._resolveAction(tab) });
        });

        this.drawPanel(ctx, panelX, panelY, panelW, panelH, '', 'default', 0.75);

        const visibleY = (y) => y - this.scrollOffset;
        let optionY = contentY + 20;

        ctx.save();
        ctx.beginPath();
        ctx.rect(contentX, contentY, contentW, contentH);
        ctx.clip();
        ctx.translate(0, -this.scrollOffset);

        const drawToggle = (item) => {
            const value = this._getSettingsValue(item.path);
            ctx.fillStyle = this.styleConfig.colors.title;
            ctx.font = this.styleConfig.fonts.label;
            ctx.textAlign = 'left';
            ctx.fillText(item.label, optionX, optionY + 8);

            const btnWidth = 180;
            const btnHeight = 38;
            const btnX = rightControlX - btnWidth;
            const btnY = optionY - 16;
            const visibleBtnY = visibleY(btnY);
            const isHovered = pointer && this._isHovered(pointer, btnX, visibleBtnY, btnWidth, btnHeight);
            const text = value ? 'ON' : 'OFF';
            const style = value ? 'selectedTab' : 'toggle';

            this.drawButton(ctx, btnX, btnY, btnWidth, btnHeight, text, isHovered || value, style);
            this.settingsButtons.push({
                x: btnX,
                y: visibleBtnY,
                w: btnWidth,
                h: btnHeight,
                action: () => this._setSettingsValue(item.path, !value)
            });
            optionY += 70;
        };

        const drawSwatch = (item) => {
            const value = this._getSettingsValue(item.path);
            ctx.fillStyle = this.styleConfig.colors.title;
            ctx.font = this.styleConfig.fonts.label;
            ctx.textAlign = 'left';
            ctx.fillText(item.label, optionX, optionY + 8);
            optionY += 50;

            let swatchX = optionX;
            item.options.forEach((optionValue) => {
                const selected = value === optionValue;
                ctx.save();
                ctx.fillStyle = optionValue;
                ctx.fillRect(swatchX, optionY, swatchSize, swatchSize);
                ctx.strokeStyle = selected ? '#00ffcc' : '#444';
                ctx.lineWidth = selected ? 4 : 2;
                ctx.strokeRect(swatchX, optionY, swatchSize, swatchSize);
                ctx.restore();

                const visibleSwatchY = visibleY(optionY);
                const isHovered = pointer && this._isHovered(pointer, swatchX, visibleSwatchY, swatchSize, swatchSize);
                if (isHovered) {
                    ctx.save();
                    ctx.strokeStyle = '#00ffcc';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(swatchX, optionY, swatchSize, swatchSize);
                    ctx.restore();
                }

                this.settingsButtons.push({
                    x: swatchX,
                    y: visibleSwatchY,
                    w: swatchSize,
                    h: swatchSize,
                    action: () => this._setSettingsValue(item.path, optionValue)
                });
                swatchX += swatchSize + swatchSpacing;
            });
            optionY += swatchSize + 40;
        };

        const drawSlider = (item) => {
            const value = this._getSettingsValue(item.path);
            const displayValue = item.step < 0.1 ? value.toFixed(2) : (item.step < 1 ? value.toFixed(1) : value.toString());
            const sliderDisabled = this.settingsOrigin === 'menu' && item.id === 'uiScale';
            const trackX = optionX;
            const trackY = optionY + 30;
            const progress = (value - item.min) / (item.max - item.min);
            const handleRadius = 10;
            const handleX = trackX + progress * sliderWidth;
            const visibleTrackY = visibleY(trackY - handleRadius);
            const isHovered = pointer && this._isHovered(pointer, trackX, visibleTrackY, sliderWidth, sliderHeight + handleRadius * 2);

            ctx.fillStyle = sliderDisabled ? '#888' : this.styleConfig.colors.title;
            ctx.font = this.styleConfig.fonts.label;
            ctx.textAlign = 'left';
            ctx.fillText(`${item.label}: ${displayValue}`, optionX, optionY + 8);

            ctx.save();
            ctx.fillStyle = sliderDisabled ? '#222' : '#111';
            ctx.fillRect(trackX, trackY, sliderWidth, sliderHeight);
            ctx.strokeStyle = sliderDisabled ? '#555' : '#444';
            ctx.lineWidth = 2;
            ctx.strokeRect(trackX, trackY, sliderWidth, sliderHeight);
            ctx.fillStyle = sliderDisabled ? '#666' : '#00ffcc';
            ctx.fillRect(trackX, trackY, sliderWidth * progress, sliderHeight);
            ctx.restore();

            ctx.save();
            ctx.fillStyle = sliderDisabled ? '#999' : '#00ffcc';
            ctx.strokeStyle = sliderDisabled ? '#aaaaaa' : (isHovered ? '#ffffff' : '#88c8d0');
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(handleX, trackY + sliderHeight / 2, handleRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            if (sliderDisabled) {
                ctx.save();
                ctx.font = '18px "VT323", monospace';
                ctx.fillStyle = '#bbbbbb';
                ctx.textAlign = 'left';
                ctx.fillText('Works only from in-game settings.', optionX, trackY + sliderHeight + 24);
                ctx.restore();
            }

            const updateValue = (pointer) => {
                let ratio = (pointer.x - trackX) / sliderWidth;
                ratio = Math.max(0, Math.min(1, ratio));
                const raw = item.min + ratio * (item.max - item.min);
                const stepped = Number((Math.round(raw / item.step) * item.step).toFixed(4));
                this._setSettingsValue(item.path, stepped);
            };

            this.settingsButtons.push({
                x: trackX,
                y: visibleTrackY,
                w: sliderWidth,
                h: sliderHeight + handleRadius * 2,
                action: sliderDisabled ? () => {} : () => {
                    const pointer = this._getPointer() || this.mousePos;
                    if (!pointer) return;
                    updateValue(pointer);
                },
                drag: sliderDisabled ? null : (pointer) => {
                    updateValue(pointer);
                }
            });

            optionY += 80;
        };

        const drawKeybind = (item) => {
            const value = this._getSettingsValue(item.path);
            const displayValue = this._formatBindingLabel(value);
            const btnWidth = 260;
            const btnHeight = 42;
            const btnX = rightControlX - btnWidth;
            const btnY = optionY - 16;
            const visibleBtnY = visibleY(btnY);
            const isSelected = this.isWaitingForKey && this.waitingForKeyId === item.id;
            const isHovered = pointer && this._isHovered(pointer, btnX, visibleBtnY, btnWidth, btnHeight);
            const buttonText = isSelected ? 'Press key...' : displayValue;
            const styleType = isSelected ? 'selectedTab' : 'toggle';

            this.drawButton(ctx, btnX, btnY, btnWidth, btnHeight, buttonText, isHovered || isSelected, styleType);
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.font = '18px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, optionX, optionY + 8);
            ctx.restore();

            this.settingsButtons.push({
                x: btnX,
                y: visibleBtnY,
                w: btnWidth,
                h: btnHeight,
                action: () => {
                    this.suppressNextSettingsMouseCapture = true;
                    this.isWaitingForKey = true;
                    this.waitingForKeyPath = item.path;
                    this.waitingForKeyId = item.id;
                }
            });
            optionY += 70;
        };

        const drawCrosshairPreview = (ctx, x, y, w, h, skin) => {
            const cx = x + w / 2;
            const cy = y + h / 2;
            const radius = Math.min(w, h) * 0.18;

            ctx.save();
            ctx.strokeStyle = this.styleConfig.colors.title;
            ctx.fillStyle = this.styleConfig.colors.title;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            switch (skin.toLowerCase()) {
                case 'dot': {
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
                case 'circle': {
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
                case 'classic':
                default: {
                    const lineLen = radius * 1.4;
                    const gap = radius * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(cx - gap - lineLen, cy);
                    ctx.lineTo(cx - gap, cy);
                    ctx.moveTo(cx + gap, cy);
                    ctx.lineTo(cx + gap + lineLen, cy);
                    ctx.moveTo(cx, cy - gap - lineLen);
                    ctx.lineTo(cx, cy - gap);
                    ctx.moveTo(cx, cy + gap);
                    ctx.lineTo(cx, cy + gap + lineLen);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius * 0.25, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
            }

            ctx.restore();
        };

        const drawSelection = (item) => {
            const value = this._getSettingsValue(item.path);
            ctx.fillStyle = this.styleConfig.colors.title;
            ctx.font = this.styleConfig.fonts.label;
            ctx.textAlign = 'left';
            ctx.fillText(item.label, optionX, optionY + 8);
            optionY += 40;

            const btnWidth = 150;
            const btnHeight = 38;
            const btnSpacing = 16;
            let btnX = optionX;

            item.options.forEach((optionValue) => {
                const isSelected = value === optionValue;
                const visibleBtnY = visibleY(optionY);
                const isHovered = pointer && this._isHovered(pointer, btnX, visibleBtnY, btnWidth, btnHeight);
                const style = isSelected ? 'selectedTab' : 'default';
                const text = item.id === 'cursorSkin' ? '' : optionValue.toUpperCase();

                this.drawButton(ctx, btnX, optionY, btnWidth, btnHeight, text, isHovered || isSelected, style);
                if (item.id === 'cursorSkin') {
                    drawCrosshairPreview(ctx, btnX, optionY, btnWidth, btnHeight, optionValue);
                }

                this.settingsButtons.push({
                    x: btnX,
                    y: visibleBtnY,
                    w: btnWidth,
                    h: btnHeight,
                    action: () => this._setSettingsValue(item.path, optionValue)
                });
                btnX += btnWidth + btnSpacing;
            });

            optionY += btnHeight + 40;
        };

        const drawSection = (item) => {
            const sectionHeight = 52;
            ctx.fillStyle = '#00ffcc';
            ctx.font = 'bold 22px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, optionX, optionY + 8);

            ctx.save();
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(optionX, optionY + 18);
            ctx.lineTo(panelX + panelW - 30, optionY + 18);
            ctx.stroke();
            ctx.restore();

            optionY += sectionHeight;
        };

        const drawLabel = (item) => {
            ctx.fillStyle = this.styleConfig.colors.title;
            ctx.font = this.styleConfig.fonts.label;
            ctx.textAlign = 'left';
            ctx.fillText(item.label, optionX, optionY + 8);
            optionY += 50;
        };

        const settingsItems = MENU_DEFINITIONS.SETTINGS_MENU.body[this.settingsTab] || [];
        settingsItems.forEach((item) => {
            switch (item.type) {
                case 'section':
                    drawSection(item);
                    break;
                case 'toggle':
                    drawToggle(item);
                    break;
                case 'swatch':
                    drawSwatch(item);
                    break;
                case 'slider':
                    drawSlider(item);
                    break;
                case 'selection':
                    drawSelection(item);
                    break;
                case 'keybind':
                    drawKeybind(item);
                    break;
                case 'label':
                default:
                    drawLabel(item);
                    break;
            }
        });

        const totalItemsHeight = optionY - contentY;
        const visibleHeight = contentH;
        this.maxScrollOffset = Math.max(0, totalItemsHeight - visibleHeight);
        this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));

        ctx.restore();

        if (this.maxScrollOffset > 0) {
            const trackX = scrollX + scrollButtonSize / 2 - 4;
            const trackTop = scrollTopY + scrollButtonSize + 12;
            const trackH = scrollBottomY - trackTop - 12;
            const handleHeight = Math.max(32, trackH * visibleHeight / Math.max(totalItemsHeight, visibleHeight));
            const handleY = trackTop + (this.maxScrollOffset === 0 ? 0 : (this.scrollOffset / this.maxScrollOffset) * (trackH - handleHeight));

            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(trackX, trackTop, 8, trackH);
            ctx.restore();

            const handleHovered = pointer && this._isHovered(pointer, trackX - 4, handleY - 4, 16, handleHeight + 8);
            if (handleHovered) {
                ctx.save();
                ctx.fillStyle = 'rgba(0, 255, 204, 0.18)';
                ctx.fillRect(trackX - 6, handleY - 6, 20, handleHeight + 12);
                ctx.restore();
            }

            ctx.save();
            ctx.fillStyle = handleHovered ? '#66ffdd' : '#00ffcc';
            ctx.fillRect(trackX, handleY, 8, handleHeight);
            ctx.restore();

            const scrollUpHovered = pointer && this._isHovered(pointer, scrollX, scrollTopY, scrollButtonSize, scrollButtonSize);
            const scrollDownHovered = pointer && this._isHovered(pointer, scrollX, scrollBottomY, scrollButtonSize, scrollButtonSize);
            this.drawButton(ctx, scrollX, scrollTopY, scrollButtonSize, scrollButtonSize, '▲', scrollUpHovered, 'tab');
            this.drawButton(ctx, scrollX, scrollBottomY, scrollButtonSize, scrollButtonSize, '▼', scrollDownHovered, 'tab');

            const updateScrollFromPointer = (pointer) => {
                if (!pointer) return;
                let targetY = pointer.y - trackTop - handleHeight / 2;
                targetY = Math.max(0, Math.min(trackH - handleHeight, targetY));
                const ratio = trackH - handleHeight > 0 ? targetY / (trackH - handleHeight) : 0;
                this.scrollOffset = ratio * this.maxScrollOffset;
            };

            this.settingsButtons.push({
                x: scrollX,
                y: scrollTopY,
                w: scrollButtonSize,
                h: scrollButtonSize,
                action: () => this.handleScroll(-60)
            });
            this.settingsButtons.push({
                x: scrollX,
                y: scrollBottomY,
                w: scrollButtonSize,
                h: scrollButtonSize,
                action: () => this.handleScroll(60)
            });
            this.settingsButtons.push({
                x: trackX,
                y: handleY,
                w: 8,
                h: handleHeight,
                action: () => {},
                drag: updateScrollFromPointer
            });
        }

        const backDefinition = MENU_DEFINITIONS.SETTINGS_MENU.footer[0];
        const backWidth = 200;
        const backHeight = 50;
        const backX = w / 2 - backWidth / 2;
        const backY = h - 90;
        const backHovered = pointer && this._isHovered(pointer, backX, backY, backWidth, backHeight);

        this.drawButton(ctx, backX, backY, backWidth, backHeight, backDefinition.text, backHovered, backDefinition.style);
        this.settingsButtons.push({ x: backX, y: backY, w: backWidth, h: backHeight, action: this._resolveAction(backDefinition) });
    }

    _drawPauseMenu(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

        this.drawPanel(ctx, 0, 0, w, h, '', 'overlay');

        ctx.save();
        ctx.fillStyle = this.styleConfig.colors.title;
        ctx.font = this.styleConfig.fonts.title;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.styleConfig.colors.title;
        ctx.fillText('PAUSED', w / 2, 120);
        ctx.restore();

        const player = this.game.getModule('player');
        if (player) {
            this._drawPauseStatsInfobox(ctx, 40, h / 2 - 200, player);
        }

        const btnWidth = 260;
        const btnHeight = 64;
        const btnSpacing = 24;
        const totalBtnH = MENU_DEFINITIONS.PAUSE_MENU.length * btnHeight + (MENU_DEFINITIONS.PAUSE_MENU.length - 1) * btnSpacing;
        const btnX = w - btnWidth - 40;
        const btnY = (h - totalBtnH) / 2;

        this.pauseButtons = this.renderMenu(ctx, 'PAUSE_MENU', {
            startX: btnX,
            startY: btnY,
            width: btnWidth,
            itemHeight: btnHeight,
            spacing: btnSpacing,
            pointer: this._getPointer()
        });
    }

    _drawAugmentsMenu(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;
        const pointer = this._getPointer() || this.mousePos;
        const player = this.game.getModule('player');
        const augmentMgr = this.game.getModule('augments');

        this.drawPanel(ctx, 0, 0, w, h, '', 'overlay', 0.65);

        const isMenuCodex = this.codexMode;

        ctx.save();
        ctx.fillStyle = this.styleConfig.colors.title;
        ctx.font = this.styleConfig.fonts.title;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.styleConfig.colors.title;
        ctx.fillText(isMenuCodex ? 'CODEX' : 'CYBERWARE & LOADOUT', w / 2, 54);
        ctx.restore();

        this.augmentsButtons = [];

        if (player && !isMenuCodex) {
            this._drawPauseStatsInfobox(ctx, 40, Math.max(150, h / 2 - 200), player);
        }

        const mainX = isMenuCodex ? 80 : 310;
        const mainY = 140;
        const mainW = isMenuCodex ? Math.max(700, w - 160) : Math.max(620, w - mainX - 40);
        const mainH = Math.max(440, h - mainY - 95);

        const synergyMgr = this.game.getModule('synergies');
        const codexMgr = this.game.getModule('codex');
        const activeSynCount = synergyMgr ? synergyMgr.activeSynergies.size : 0;

        if (isMenuCodex) {
            const counts = codexMgr ? codexMgr.getCounts() : {
                synergies: { found: 0, total: SYNERGIES.length },
                augments: { found: 0, total: AUGMENTS.length },
                playerCards: { found: 0, total: UPGRADES.filter(u => !u.unlockHackId).length },
                droneCards: { found: 0, total: DRONE_UPGRADES.length },
                dronesAndHacks: { found: 0, total: Object.keys(DRONE_TYPES).length + Object.keys(HACK_DATA).length },
                enemies: { found: 0, total: ENEMY_CODEX_IDS.length }
            };
            const codexTabs = [
                { id: 'synergies', label: `SYNERGIES (${counts.synergies.found}/${counts.synergies.total})` },
                { id: 'augments', label: `AUGMENTS (${counts.augments.found}/${counts.augments.total})` },
                { id: 'playerCards', label: `PLAYER CARDS (${counts.playerCards.found}/${counts.playerCards.total})` },
                { id: 'droneCards', label: `DRONE CARDS (${counts.droneCards.found}/${counts.droneCards.total})` },
                { id: 'dronesAndHacks', label: `DRONES & HACKS (${counts.dronesAndHacks.found}/${counts.dronesAndHacks.total})` },
                { id: 'enemies', label: `ENEMIES (${counts.enemies.found}/${counts.enemies.total})` }
            ];
            const tabGap = 10;
            const tabW = Math.floor((mainW - tabGap * (codexTabs.length - 1)) / codexTabs.length);
            const tabH = 42;
            const tabY = mainY - tabH - 10;

            codexTabs.forEach((t, idx) => {
                const tx = mainX + idx * (tabW + tabGap);
                const isSelected = this.codexTab === t.id;
                const isHovered = pointer && this._isHovered(pointer, tx, tabY, tabW, tabH);
                this.drawButton(ctx, tx, tabY, tabW, tabH, t.label, isHovered || isSelected, isSelected ? 'selectedTab' : 'tab');
                this.augmentsButtons.push({
                    x: tx,
                    y: tabY,
                    w: tabW,
                    h: tabH,
                    action: () => {
                        this.codexTab = t.id;
                        this.selectedAugmentItem = null;
                        this.loadoutScrollOffset = 0;
                    }
                });
            });
        } else {
            const tabs = [
                { id: 'augments', label: 'CYBERWARE AUGMENTS' },
                { id: 'loadout', label: 'CARDS, DRONES & HACKS' },
                { id: 'synergies', label: `SYNERGIES (${activeSynCount}/${SYNERGIES.length})` }
            ];
            const tabW = 240;
            const tabH = 42;
            const tabGap = 14;
            const tabsStartX = mainX;
            const tabY = mainY - tabH - 10;

            tabs.forEach((t, idx) => {
                const tx = tabsStartX + idx * (tabW + tabGap);
                const isSelected = this.augmentsTab === t.id;
                const isHovered = pointer && this._isHovered(pointer, tx, tabY, tabW, tabH);
                const style = isSelected ? 'selectedTab' : 'tab';
                this.drawButton(ctx, tx, tabY, tabW, tabH, t.label, isHovered || isSelected, style);
                this.augmentsButtons.push({
                    x: tx,
                    y: tabY,
                    w: tabW,
                    h: tabH,
                    action: () => {
                        this.augmentsTab = t.id;
                        this.selectedAugmentItem = null;
                        this.loadoutScrollOffset = 0;
                    }
                });
            });
        }

        this.drawPanel(ctx, mainX, mainY, mainW, mainH, '', 'default', 0.8);

        if (!augmentMgr) return;

        const pad = 24;
        const innerX = mainX + pad;
        const innerY = mainY + pad;
        const innerW = mainW - pad * 2;
        const inspectorH = 120;
        const topAreaH = mainH - pad * 2 - inspectorH - 16;

        const wrapCardText = (text, maxWidth) => {
            const words = (text || '').split(' ');
            const lines = [];
            let line = '';
            for (const word of words) {
                const test = line ? `${line} ${word}` : word;
                if (ctx.measureText(test).width > maxWidth && line) {
                    lines.push(line);
                    line = word;
                } else {
                    line = test;
                }
            }
            if (line) lines.push(line);
            return lines;
        };

        if (isMenuCodex) {
            if (this.codexTab === 'synergies') {
                this._drawSynergiesTabContent(ctx, w, h, pointer, synergyMgr, innerX, innerY, innerW, topAreaH, inspectorH, wrapCardText);
            } else {
                this._drawCodexCategoryContent(ctx, w, h, pointer, codexMgr, innerX, innerY, innerW, topAreaH, inspectorH, wrapCardText);
            }
            return;
        }

        if (this.augmentsTab === 'loadout') {
            this._drawLoadoutTabContent(ctx, w, h, pointer, player, augmentMgr, innerX, innerY, innerW, topAreaH, inspectorH, wrapCardText);
            return;
        }

        if (this.augmentsTab === 'synergies') {
            this._drawSynergiesTabContent(ctx, w, h, pointer, synergyMgr, innerX, innerY, innerW, topAreaH, inspectorH, wrapCardText);
            return;
        }

        const leftColW = Math.floor(innerW * 0.48);
        const rightColW = innerW - leftColW - 24;
        const leftColX = innerX;
        const rightColX = innerX + leftColW + 24;

        // Section Headers
        ctx.save();
        ctx.fillStyle = '#00ffcc';
        ctx.font = this.styleConfig.fonts.infoTitle;
        ctx.textAlign = 'left';
        ctx.fillText('EQUIPPED SLOTS (BODY)', leftColX, innerY + 16);
        ctx.fillText(`STORAGE STASH (${augmentMgr.getStoredCount()}/${augmentMgr.maxStorage})`, rightColX, innerY + 16);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ff9900';
        const isFullMk3 = augmentMgr.isFullMk3Build();
        const nearForge = augmentMgr.isPlayerNearForge();
        ctx.fillText(
            `CYBER-SCRAP: ${augmentMgr.scrap}${nearForge ? '  •  [FORGE IN RANGE]' : ''}`,
            rightColX + rightColW,
            innerY + 16
        );
        ctx.restore();

        // Optional compact utility buttons in header: Auto-Recycler Filter & Full Mk.III Scrap->XP
        if (augmentMgr.autoRecyclerUnlocked) {
            const pref = augmentMgr.preferredSet;
            const filterLabel = pref ? `AUTO-RECYCLE: ${pref}` : 'AUTO-RECYCLE: OFF';
            ctx.save();
            ctx.font = 'bold 17px "VT323", monospace';
            const fW = Math.max(150, Math.ceil(ctx.measureText(filterLabel).width) + 22);
            ctx.restore();
            const fH = 26;
            const fX = leftColX + leftColW - fW;
            const fY = innerY - 6;
            const fHover = pointer && this._isHovered(pointer, fX, fY, fW, fH);
            this.drawButton(ctx, fX, fY, fW, fH, '', fHover, pref ? 'selectedTab' : 'tab');
            ctx.save();
            ctx.fillStyle = fHover || pref ? '#ffffff' : '#88c8d0';
            ctx.font = 'bold 17px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(filterLabel, fX + fW / 2, fY + fH / 2 + 1);
            ctx.restore();
            this.augmentsButtons.push({
                x: fX,
                y: fY,
                w: fW,
                h: fH,
                action: () => {
                    const order = [null, ...Object.keys(AUGMENT_TYPES)];
                    const idx = order.indexOf(augmentMgr.preferredSet);
                    augmentMgr.preferredSet = order[(idx + 1) % order.length];
                }
            });
        }

        if (isFullMk3 && player) {
            const xpPerScrap = Math.max(10, Math.round(player.xpNextLevel * 0.2));
            const xpLabel = `1 SCRAP -> +${xpPerScrap} XP`;
            ctx.save();
            ctx.font = 'bold 17px "VT323", monospace';
            const xpBtnW = Math.max(160, Math.ceil(ctx.measureText(xpLabel).width) + 22);
            ctx.restore();
            const xpBtnH = 26;
            const xpBtnX = rightColX + 165;
            const xpBtnY = innerY - 6;
            const canExchange = augmentMgr.scrap >= 1;
            const xpHover = canExchange && pointer && this._isHovered(pointer, xpBtnX, xpBtnY, xpBtnW, xpBtnH);
            this.drawButton(
                ctx,
                xpBtnX,
                xpBtnY,
                xpBtnW,
                xpBtnH,
                '',
                xpHover,
                canExchange ? 'selectedTab' : 'toggle'
            );
            ctx.save();
            ctx.fillStyle = canExchange ? '#ffffff' : '#777777';
            ctx.font = 'bold 17px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(xpLabel, xpBtnX + xpBtnW / 2, xpBtnY + xpBtnH / 2 + 1);
            ctx.restore();
            if (canExchange) {
                this.augmentsButtons.push({
                    x: xpBtnX,
                    y: xpBtnY,
                    w: xpBtnW,
                    h: xpBtnH,
                    action: () => {
                        augmentMgr.convertScrapToXp(1);
                    }
                });
            }
        }

        // 1. Equipped Slots (2x2 Grid + Type Set Bar)
        const setBarH = 44;
        const equipGridY = innerY + 30;
        const equipGridH = topAreaH - 30 - setBarH - 12;
        const equipGap = 14;
        const equipCardW = Math.floor((leftColW - equipGap) / 2);
        const equipCardH = Math.floor((equipGridH - equipGap) / 2);

        const slotOrder = [
            AUGMENT_SLOTS.HEAD,
            AUGMENT_SLOTS.CORE,
            AUGMENT_SLOTS.ARMS,
            AUGMENT_SLOTS.LEGS
        ];

        slotOrder.forEach((slotKey, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const cardX = leftColX + col * (equipCardW + equipGap);
            const cardY = equipGridY + row * (equipCardH + equipGap);
            const equipped = augmentMgr.getEquippedAugment(slotKey);
            const isSelected = this.selectedAugmentItem &&
                this.selectedAugmentItem.source === 'equipped' &&
                this.selectedAugmentItem.key === slotKey;
            const isHovered = pointer && this._isHovered(pointer, cardX, cardY, equipCardW, equipCardH);

            const typeInfo = equipped ? AUGMENT_TYPES[equipped.type] : null;
            const accentColor = typeInfo ? typeInfo.color : '#335555';
            const borderColor = isSelected ? '#ffffff' : (isHovered ? '#00ffcc' : accentColor);

            ctx.save();
            ctx.fillStyle = isSelected ? '#122628' : (equipped ? '#081214' : '#050708');
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = isSelected ? 3 : 2;
            if (isSelected || (equipped && isHovered)) {
                ctx.shadowBlur = 14;
                ctx.shadowColor = borderColor;
            }
            ctx.fillRect(cardX, cardY, equipCardW, equipCardH);
            ctx.strokeRect(cardX, cardY, equipCardW, equipCardH);

            // Slot tag
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#00ffcc';
            ctx.font = 'bold 18px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`[${slotKey.toUpperCase()}]`, cardX + 10, cardY + 22);

            if (equipped) {
                const tierLabel = augmentMgr.getTierLabel(equipped.tier || 1);
                ctx.fillStyle = accentColor;
                ctx.textAlign = 'right';
                ctx.fillText(
                    `${typeInfo ? typeInfo.name.toUpperCase() : equipped.type} • ${tierLabel}`,
                    cardX + equipCardW - 10,
                    cardY + 22
                );

                ctx.fillStyle = (equipped.tier || 1) > 1 ? '#ffcc00' : '#ffffff';
                ctx.font = 'bold 21px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`${equipped.name.toUpperCase()} (${tierLabel})`, cardX + 10, cardY + 46);

                ctx.fillStyle = '#b8d0d4';
                ctx.font = '17px "VT323", monospace';
                const descLines = wrapCardText(equipped.description, equipCardW - 20).slice(0, 3);
                descLines.forEach((line, lineIdx) => {
                    ctx.fillText(line, cardX + 10, cardY + 68 + lineIdx * 18);
                });
            } else {
                ctx.fillStyle = '#4a6668';
                ctx.font = '18px "VT323", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('EMPTY SLOT', cardX + equipCardW / 2, cardY + equipCardH / 2 + 6);
            }
            ctx.restore();

            this.augmentsButtons.push({
                x: cardX,
                y: cardY,
                w: equipCardW,
                h: equipCardH,
                action: () => {
                    if (equipped) {
                        this.selectedAugmentItem = { source: 'equipped', key: slotKey };
                    } else {
                        this.selectedAugmentItem = null;
                    }
                }
            });
        });

        // Set / Type Counts Bar (clickable to inspect set bonuses)
        const setBarY = equipGridY + equipGridH + 12;
        ctx.save();
        ctx.fillStyle = '#050809';
        ctx.strokeStyle = '#1f4447';
        ctx.lineWidth = 2;
        ctx.fillRect(leftColX, setBarY, leftColW, setBarH);
        ctx.strokeRect(leftColX, setBarY, leftColW, setBarH);

        const typeKeys = Object.keys(AUGMENT_TYPES);
        const typeCellW = leftColW / typeKeys.length;
        typeKeys.forEach((tKey, i) => {
            const tInfo = AUGMENT_TYPES[tKey];
            const count = augmentMgr.getTypeCount(tKey);
            const cellX = leftColX + i * typeCellW;
            const isSetSelected = this.selectedAugmentItem &&
                this.selectedAugmentItem.source === 'set' &&
                this.selectedAugmentItem.key === tKey;
            const isSetHovered = pointer && this._isHovered(pointer, cellX, setBarY, typeCellW, setBarH);

            if (isSetSelected || isSetHovered) {
                ctx.fillStyle = isSetSelected ? 'rgba(0, 255, 204, 0.16)' : 'rgba(0, 255, 204, 0.08)';
                ctx.fillRect(cellX + 2, setBarY + 2, typeCellW - 4, setBarH - 4);
            }

            const twoTier = count >= 2 ? augmentMgr.getTwoPieceTier(tKey) : 0;
            const tierTag = twoTier >= 2 ? ` [${augmentMgr.getTierLabel(twoTier)}]` : '';
            ctx.fillStyle = count >= 2 ? tInfo.color : (count > 0 ? '#d0e8ec' : '#556668');
            ctx.font = 'bold 17px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${tInfo.name.toUpperCase()}: ${count}/4${tierTag}`, cellX + typeCellW / 2, setBarY + 27);

            this.augmentsButtons.push({
                x: cellX,
                y: setBarY,
                w: typeCellW,
                h: setBarH,
                action: () => {
                    this.selectedAugmentItem = { source: 'set', key: tKey };
                }
            });
        });
        ctx.restore();

        // 2. Storage Grid (2 columns x 3 rows = 6 slots) + Cyber-Forge Bar
        const storageGridY = innerY + 30;
        const storageGridH = topAreaH - 30 - setBarH - 12;
        const storageCols = 2;
        const storageRows = 3;
        const storageGap = 12;
        const storageCardW = Math.floor((rightColW - storageGap) / storageCols);
        const storageCardH = Math.floor((storageGridH - storageGap * (storageRows - 1)) / storageRows);
        const storageList = augmentMgr.getStorage();

        for (let idx = 0; idx < augmentMgr.maxStorage; idx++) {
            const col = idx % storageCols;
            const row = Math.floor(idx / storageCols);
            const cardX = rightColX + col * (storageCardW + storageGap);
            const cardY = storageGridY + row * (storageCardH + storageGap);
            const item = storageList[idx];
            const isSelected = this.selectedAugmentItem &&
                this.selectedAugmentItem.source === 'storage' &&
                this.selectedAugmentItem.key === idx;
            const isHovered = pointer && this._isHovered(pointer, cardX, cardY, storageCardW, storageCardH);

            const typeInfo = item ? AUGMENT_TYPES[item.type] : null;
            const accentColor = typeInfo ? typeInfo.color : '#2a3d3f';
            const borderColor = isSelected ? '#ffffff' : (isHovered ? '#00ffcc' : accentColor);

            ctx.save();
            ctx.fillStyle = isSelected ? '#122628' : (item ? '#081214' : '#050708');
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = isSelected ? 3 : 2;
            if (isSelected || (item && isHovered)) {
                ctx.shadowBlur = 12;
                ctx.shadowColor = borderColor;
            }
            ctx.fillRect(cardX, cardY, storageCardW, storageCardH);
            ctx.strokeRect(cardX, cardY, storageCardW, storageCardH);

            ctx.shadowBlur = 0;
            if (item) {
                const eqMatch = augmentMgr.getEquippedAugment(item.slot);
                const isDuplicate = eqMatch && eqMatch.id === item.id;

                ctx.fillStyle = isDuplicate ? '#ffcc00' : '#00ffcc';
                ctx.font = 'bold 16px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(
                    isDuplicate ? `SLOT: ${item.slot.toUpperCase()} [DUPLICATE]` : `SLOT: ${item.slot.toUpperCase()}`,
                    cardX + 10,
                    cardY + 18
                );

                ctx.fillStyle = accentColor;
                ctx.textAlign = 'right';
                ctx.fillText(typeInfo ? typeInfo.name.toUpperCase() : item.type, cardX + storageCardW - 10, cardY + 18);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 19px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(item.name.toUpperCase(), cardX + 10, cardY + 38);

                ctx.fillStyle = '#b8d0d4';
                ctx.font = '15px "VT323", monospace';
                const descLines = wrapCardText(item.description, storageCardW - 20).slice(0, 2);
                descLines.forEach((line, lineIdx) => {
                    ctx.fillText(line, cardX + 10, cardY + 56 + lineIdx * 15);
                });
            } else {
                ctx.fillStyle = '#3d5557';
                ctx.font = '17px "VT323", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`EMPTY [0${idx + 1}]`, cardX + storageCardW / 2, cardY + storageCardH / 2 + 6);
            }
            ctx.restore();

            this.augmentsButtons.push({
                x: cardX,
                y: cardY,
                w: storageCardW,
                h: storageCardH,
                action: () => {
                    if (item) {
                        const now = Date.now();
                        const isDoubleClick = this._lastStorageClick.index === idx && (now - this._lastStorageClick.time) < 380;
                        this._lastStorageClick = { index: idx, time: now };

                        if (isDoubleClick) {
                            const targetSlot = item.slot;
                            if (augmentMgr.equipFromStorage(idx)) {
                                this.selectedAugmentItem = { source: 'equipped', key: targetSlot };
                                this._lastStorageClick = { index: -1, time: 0 };
                            }
                        } else {
                            this.selectedAugmentItem = { source: 'storage', key: idx };
                        }
                    } else {
                        this.selectedAugmentItem = null;
                    }
                }
            });
        }

        // Cyber-Forge Slot Crafting Bar (aligned with Set Bar at setBarY)
        ctx.save();
        const isNearForge = augmentMgr.isPlayerNearForge();
        const canForge = isNearForge &&
            augmentMgr.scrap >= augmentMgr.forgeSlotCost &&
            augmentMgr.getStoredCount() < augmentMgr.maxStorage;

        ctx.fillStyle = '#050809';
        ctx.strokeStyle = isNearForge ? '#ff9900' : '#1f4447';
        ctx.lineWidth = 2;
        ctx.fillRect(rightColX, setBarY, rightColW, setBarH);
        ctx.strokeRect(rightColX, setBarY, rightColW, setBarH);

        if (isNearForge) {
            const forgeSlots = [
                AUGMENT_SLOTS.HEAD,
                AUGMENT_SLOTS.ARMS,
                AUGMENT_SLOTS.LEGS,
                AUGMENT_SLOTS.CORE
            ];
            const cellW = rightColW / forgeSlots.length;
            forgeSlots.forEach((fSlot, i) => {
                const cellX = rightColX + i * cellW;
                const isHover = pointer && this._isHovered(pointer, cellX, setBarY, cellW, setBarH);
                if (isHover && canForge) {
                    ctx.fillStyle = 'rgba(255, 153, 0, 0.22)';
                    ctx.fillRect(cellX + 2, setBarY + 2, cellW - 4, setBarH - 4);
                }
                ctx.fillStyle = canForge ? (isHover ? '#ffffff' : '#ff9900') : '#665544';
                ctx.font = 'bold 17px "VT323", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(
                    `FORGE ${fSlot.toUpperCase()} (${augmentMgr.forgeSlotCost})`,
                    cellX + cellW / 2,
                    setBarY + 27
                );

                this.augmentsButtons.push({
                    x: cellX,
                    y: setBarY,
                    w: cellW,
                    h: setBarH,
                    action: () => {
                        if (!canForge) return;
                        const res = augmentMgr.forgeBySlot(fSlot);
                        if (res.success && typeof res.index === 'number') {
                            this.selectedAugmentItem = { source: 'storage', key: res.index };
                        }
                    }
                });
            });
        } else {
            ctx.fillStyle = '#668082';
            ctx.font = '17px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
                `CYBER-FORGE OFFLINE — REACH A FORGE TERMINAL IN ARENA TO CRAFT BY SLOT (${augmentMgr.forgeSlotCost} SCRAP)`,
                rightColX + rightColW / 2,
                setBarY + 27
            );
        }
        ctx.restore();

        // 3. Bottom Inspector & Action Bar
        const inspY = innerY + topAreaH + 16;
        ctx.save();
        ctx.fillStyle = '#050809';
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.fillRect(innerX, inspY, innerW, inspectorH);
        ctx.strokeRect(innerX, inspY, innerW, inspectorH);

        let selectedAug = null;
        let selectedSetKey = null;
        if (this.selectedAugmentItem) {
            if (this.selectedAugmentItem.source === 'equipped') {
                selectedAug = augmentMgr.getEquippedAugment(this.selectedAugmentItem.key);
            } else if (this.selectedAugmentItem.source === 'storage') {
                selectedAug = storageList[this.selectedAugmentItem.key] || null;
            } else if (this.selectedAugmentItem.source === 'set') {
                selectedSetKey = this.selectedAugmentItem.key;
            }
            if (!selectedAug && !selectedSetKey) {
                this.selectedAugmentItem = null;
            }
        }

        if (selectedSetKey && AUGMENT_TYPES[selectedSetKey]) {
            const tInfo = AUGMENT_TYPES[selectedSetKey];
            const bonuses = AUGMENT_SET_BONUSES[selectedSetKey];
            const count = augmentMgr.getTypeCount(selectedSetKey);
            const has2Pc = count >= 2;
            const has4Pc = count >= 4;

            ctx.fillStyle = tInfo.color;
            ctx.font = 'bold 22px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${tInfo.name.toUpperCase()} SET BONUSES (${count}/4 EQUIPPED)`, innerX + 18, inspY + 26);

            if (bonuses) {
                ctx.fillStyle = has2Pc ? '#00ffcc' : '#778c8f';
                ctx.font = '18px "VT323", monospace';
                ctx.fillText(
                    `[2-PC] ${bonuses.twoPiece.name}: ${bonuses.twoPiece.description}`,
                    innerX + 18,
                    inspY + 52
                );

                const activeChosen = has4Pc && augmentMgr.fourPieceChoice === 'active';
                const passiveChosen = has4Pc && augmentMgr.fourPieceChoice === 'passive';

                ctx.fillStyle = activeChosen ? '#00ffcc' : (has4Pc ? '#ffffff' : '#778c8f');
                ctx.fillText(
                    `[4-PC ACTIVE${activeChosen ? ' ★' : ''}] ${bonuses.fourPiece.active.name}: ${bonuses.fourPiece.active.description}`,
                    innerX + 18,
                    inspY + 78
                );

                ctx.fillStyle = passiveChosen ? '#00ffcc' : (has4Pc ? '#ffffff' : '#778c8f');
                ctx.fillText(
                    `[4-PC PASSIVE${passiveChosen ? ' ★' : ''}] ${bonuses.fourPiece.passive.name}: ${bonuses.fourPiece.passive.description}`,
                    innerX + 18,
                    inspY + 102
                );
            }
        } else if (!selectedAug) {
            ctx.fillStyle = '#88c8d0';
            ctx.font = '20px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
                'Select an augment or click a Set name above to inspect set bonuses.',
                innerX + innerW / 2,
                inspY + 48
            );
            ctx.fillStyle = '#ff7b00';
            ctx.font = '18px "VT323", monospace';
            ctx.fillText(
                'NOTE: Unequipping or overwriting an installed augment permanently destroys it.',
                innerX + innerW / 2,
                inspY + 78
            );
        } else {
            const tInfo = AUGMENT_TYPES[selectedAug.type] || { name: selectedAug.type, color: '#00ffcc' };
            const tierLabel = augmentMgr.getTierLabel(selectedAug.tier || 1);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${selectedAug.name.toUpperCase()} (${tierLabel})`, innerX + 18, inspY + 30);

            ctx.fillStyle = tInfo.color;
            ctx.font = 'bold 18px "VT323", monospace';
            ctx.fillText(
                `[${selectedAug.slot.toUpperCase()}] • ${tInfo.name.toUpperCase()} • ${selectedAug.rarity.toUpperCase()} • ${tierLabel}`,
                innerX + 18,
                inspY + 54
            );

            ctx.fillStyle = '#d0e8ec';
            ctx.font = '19px "VT323", monospace';
            ctx.fillText(selectedAug.description, innerX + 18, inspY + 80);

            if (this.selectedAugmentItem.source === 'storage') {
                const storageIdx = this.selectedAugmentItem.key;
                const existingInSlot = augmentMgr.getEquippedAugment(selectedAug.slot);
                const isDuplicate = existingInSlot && existingInSlot.id === selectedAug.id;
                const canFuse = isDuplicate && (existingInSlot.tier || 1) < augmentMgr.maxTier;
                const isMaxTierDup = isDuplicate && (existingInSlot.tier || 1) >= augmentMgr.maxTier;
                const scrapValue = augmentMgr.getScrapValue(selectedAug);

                if (canFuse) {
                    const nextTierLabel = augmentMgr.getTierLabel((existingInSlot.tier || 1) + 1);
                    ctx.fillStyle = '#00ffcc';
                    ctx.font = '17px "VT323", monospace';
                    ctx.fillText(
                        `DUPLICATE MATCH: Fuse to overclock "${existingInSlot.name}" to ${nextTierLabel} (+25% stats)!`,
                        innerX + 18,
                        inspY + 104
                    );
                } else if (isMaxTierDup) {
                    ctx.fillStyle = '#ffcc00';
                    ctx.font = '17px "VT323", monospace';
                    ctx.fillText(
                        `Equipped "${existingInSlot.name}" is already at MAX TIER (Mk.III). Scrap for +${scrapValue} Cyber-Scrap.`,
                        innerX + 18,
                        inspY + 104
                    );
                } else if (existingInSlot) {
                    ctx.fillStyle = '#ffcc00';
                    ctx.font = '17px "VT323", monospace';
                    ctx.fillText(
                        `WARNING: Overwrites & destroys equipped "${existingInSlot.name}"!`,
                        innerX + 18,
                        inspY + 104
                    );
                }

                const btnW = 195;
                const btnH = 44;
                const scrapX = innerX + innerW - btnW - 18;
                const installX = scrapX - btnW - 14;
                const btnY = inspY + (inspectorH - btnH) / 2;

                const scrapHover = pointer && this._isHovered(pointer, scrapX, btnY, btnW, btnH);
                this.drawButton(ctx, scrapX, btnY, btnW, btnH, `SCRAP (+${scrapValue})`, scrapHover, 'danger');

                if (!isMaxTierDup) {
                    const nextTierLabel = existingInSlot
                        ? augmentMgr.getTierLabel((existingInSlot.tier || 1) + 1)
                        : 'Mk.II';
                    const installText = canFuse
                        ? `FUSE -> ${nextTierLabel}`
                        : (existingInSlot ? 'OVERWRITE' : 'INSTALL');
                    const installHover = pointer && this._isHovered(pointer, installX, btnY, btnW, btnH);

                    this.drawButton(ctx, installX, btnY, btnW, btnH, installText, installHover, 'selectedTab');
                    this.augmentsButtons.push({
                        x: installX,
                        y: btnY,
                        w: btnW,
                        h: btnH,
                        action: () => {
                            const targetSlot = selectedAug.slot;
                            if (canFuse) {
                                if (augmentMgr.fuseFromStorage(storageIdx)) {
                                    this.selectedAugmentItem = { source: 'equipped', key: targetSlot };
                                }
                            } else if (augmentMgr.equipFromStorage(storageIdx)) {
                                this.selectedAugmentItem = { source: 'equipped', key: targetSlot };
                            }
                        }
                    });
                }

                this.augmentsButtons.push({
                    x: scrapX,
                    y: btnY,
                    w: btnW,
                    h: btnH,
                    action: () => {
                        augmentMgr.scrapFromStorage(storageIdx);
                        this.selectedAugmentItem = null;
                    }
                });
            } else if (this.selectedAugmentItem.source === 'equipped') {
                const slotKey = this.selectedAugmentItem.key;
                ctx.fillStyle = '#ff0055';
                ctx.font = '17px "VT323", monospace';
                ctx.fillText(
                    'WARNING: Unequipping permanently destroys this augment!',
                    innerX + 18,
                    inspY + 104
                );

                const btnW = 220;
                const btnH = 44;
                const destroyX = innerX + innerW - btnW - 18;
                const btnY = inspY + (inspectorH - btnH) / 2;
                const destroyHover = pointer && this._isHovered(pointer, destroyX, btnY, btnW, btnH);

                this.drawButton(ctx, destroyX, btnY, btnW, btnH, 'UNEQUIP & DESTROY', destroyHover, 'danger');
                this.augmentsButtons.push({
                    x: destroyX,
                    y: btnY,
                    w: btnW,
                    h: btnH,
                    action: () => {
                        augmentMgr.unequipSlot(slotKey);
                        this.selectedAugmentItem = null;
                    }
                });
            }
        }
        ctx.restore();

        // Back / Resume Button
        const backWidth = 220;
        const backHeight = 50;
        const backX = w / 2 - backWidth / 2;
        const backY = h - 75;
        const backText = this.augmentsOrigin === 'gameplay' ? 'RESUME' : 'BACK';
        const backHovered = pointer && this._isHovered(pointer, backX, backY, backWidth, backHeight);

        this.drawButton(ctx, backX, backY, backWidth, backHeight, backText, backHovered, 'default');
        this.augmentsButtons.push({
            x: backX,
            y: backY,
            w: backWidth,
            h: backHeight,
            action: () => this.closeAugmentsMenu()
        });

        // 4. 4-Piece Set Bonus Selection Modal (when player completes a 4-piece set)
        if (augmentMgr.pendingFourPieceChoiceType) {
            this._drawFourPieceChoiceModal(ctx, w, h, pointer, augmentMgr, wrapCardText);
        }
    }

    _drawLoadoutTabContent(ctx, w, h, pointer, player, augmentMgr, innerX, innerY, innerW, topAreaH, inspectorH, wrapCardText) {
        const droneMgr = this.game.getModule('drones');
        const hackMgr = this.game.getModule('hack');
        const upgradeMgr = this.game.getModule('upgrades');

        const leftColW = Math.floor(innerW * 0.48);
        const rightColW = innerW - leftColW - 24;
        const leftColX = innerX;
        const rightColX = innerX + leftColW + 24;

        const activeDrones = droneMgr?.drones || [];
        const maxDrones = player ? player.stats.maxDrones : 1;
        const unlockedHacks = hackMgr?.unlockedHacks || [];
        const maxHacks = player ? Math.max(1, Math.floor(player.getStat('maxHackSlots'))) : 1;

        // Top Row: Active Drones (Left) & Unlocked Hacks (Right)
        ctx.save();
        ctx.fillStyle = '#00ffcc';
        ctx.font = this.styleConfig.fonts.infoTitle;
        ctx.textAlign = 'left';
        ctx.fillText(`ACTIVE DRONES (${activeDrones.length}/${maxDrones})`, leftColX, innerY + 16);
        ctx.fillText(`UNLOCKED HACKS (${unlockedHacks.length}/${maxHacks})`, rightColX, innerY + 16);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ff9900';
        ctx.fillText(`CYBER-SCRAP: ${augmentMgr.scrap}`, rightColX + rightColW, innerY + 16);
        ctx.restore();

        const topRowY = innerY + 28;
        const topRowH = 66;
        const droneCols = Math.max(2, Math.min(4, Math.max(maxDrones, activeDrones.length)));
        const droneGap = 10;
        const droneCardW = Math.floor((leftColW - droneGap * (droneCols - 1)) / droneCols);

        for (let i = 0; i < droneCols; i++) {
            const d = activeDrones[i] || null;
            const cx = leftColX + i * (droneCardW + droneGap);
            const cy = topRowY;
            const isSelected = this.selectedAugmentItem &&
                this.selectedAugmentItem.source === 'drone' &&
                this.selectedAugmentItem.key === (d && d.id);
            const isHovered = pointer && this._isHovered(pointer, cx, cy, droneCardW, topRowH);
            const accent = d ? (d.color || '#00ffcc') : '#2a3d3f';
            const border = isSelected ? '#ffffff' : (isHovered ? '#00ffcc' : accent);

            ctx.save();
            ctx.fillStyle = isSelected ? '#122628' : (d ? '#081214' : '#050708');
            ctx.strokeStyle = border;
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.fillRect(cx, cy, droneCardW, topRowH);
            ctx.strokeRect(cx, cy, droneCardW, topRowH);

            if (d) {
                ctx.fillStyle = accent;
                ctx.font = 'bold 15px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`[${d.behavior}]`, cx + 8, cy + 18);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 18px "VT323", monospace';
                ctx.fillText(d.name.toUpperCase(), cx + 8, cy + 40);

                ctx.fillStyle = '#88c8d0';
                ctx.font = '14px "VT323", monospace';
                ctx.fillText('CLICK TO INSPECT / SCRAP', cx + 8, cy + 56);
            } else {
                ctx.fillStyle = '#3d5557';
                ctx.font = '16px "VT323", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(i < maxDrones ? 'EMPTY DRONE SLOT' : 'LOCKED', cx + droneCardW / 2, cy + 38);
            }
            ctx.restore();

            if (d) {
                this.augmentsButtons.push({
                    x: cx,
                    y: cy,
                    w: droneCardW,
                    h: topRowH,
                    action: () => {
                        this.selectedAugmentItem = { source: 'drone', key: d.id, data: d };
                    }
                });
            }
        }

        const hackCols = Math.max(2, Math.min(4, Math.max(maxHacks, unlockedHacks.length)));
        const hackGap = 10;
        const hackCardW = Math.floor((rightColW - hackGap * (hackCols - 1)) / hackCols);

        for (let i = 0; i < hackCols; i++) {
            const hId = unlockedHacks[i] || null;
            const hData = hId ? HACK_DATA[hId] : null;
            const cx = rightColX + i * (hackCardW + hackGap);
            const cy = topRowY;
            const isSelected = this.selectedAugmentItem &&
                this.selectedAugmentItem.source === 'hack' &&
                this.selectedAugmentItem.key === hId;
            const isHovered = pointer && this._isHovered(pointer, cx, cy, hackCardW, topRowH);
            const isActiveHack = hId && hackMgr && hackMgr.activeHack === hId;
            const accent = hData ? '#bc00ff' : '#2a3d3f';
            const border = isSelected ? '#ffffff' : (isHovered ? '#00ffcc' : accent);

            ctx.save();
            ctx.fillStyle = isSelected ? '#1e1028' : (hData ? '#0d0814' : '#050708');
            ctx.strokeStyle = border;
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.fillRect(cx, cy, hackCardW, topRowH);
            ctx.strokeRect(cx, cy, hackCardW, topRowH);

            if (hData) {
                ctx.fillStyle = isActiveHack ? '#00ffcc' : '#bc00ff';
                ctx.font = 'bold 15px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(isActiveHack ? '[ACTIVE HACK]' : '[UNLOCKED HACK]', cx + 8, cy + 18);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 18px "VT323", monospace';
                ctx.fillText(hData.name.toUpperCase(), cx + 8, cy + 40);

                ctx.fillStyle = '#88c8d0';
                ctx.font = '14px "VT323", monospace';
                ctx.fillText('CLICK TO INSPECT / SCRAP', cx + 8, cy + 56);
            } else {
                ctx.fillStyle = '#3d5557';
                ctx.font = '16px "VT323", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(i < maxHacks ? 'EMPTY HACK SLOT' : 'LOCKED', cx + hackCardW / 2, cy + 38);
            }
            ctx.restore();

            if (hData) {
                this.augmentsButtons.push({
                    x: cx,
                    y: cy,
                    w: hackCardW,
                    h: topRowH,
                    action: () => {
                        this.selectedAugmentItem = { source: 'hack', key: hId, data: hData };
                    }
                });
            }
        }

        // Middle Area: Player Upgrade Cards (Left) & Drone Upgrade Cards (Right)
        const cardsHeaderY = topRowY + topRowH + 26;
        const playerInv = upgradeMgr?.inventory || {};
        const droneInv = upgradeMgr?.droneUpgradeInventory || {};

        const ownedPlayerCards = UPGRADES
            .filter(u => (playerInv[u.id] || 0) > 0 && !u.unlockHackId)
            .map(u => ({ ...u, count: playerInv[u.id] }));

        const ownedDroneCards = DRONE_UPGRADES
            .filter(u => (droneInv[u.id] || 0) > 0)
            .map(u => ({ ...u, count: droneInv[u.id] }));

        const totalPlayerCardStacks = ownedPlayerCards.reduce((sum, c) => sum + c.count, 0);
        const totalDroneCardStacks = ownedDroneCards.reduce((sum, c) => sum + c.count, 0);

        ctx.save();
        ctx.fillStyle = '#00ffcc';
        ctx.font = this.styleConfig.fonts.infoTitle;
        ctx.textAlign = 'left';
        ctx.fillText(`PLAYER UPGRADE CARDS (${totalPlayerCardStacks})`, leftColX, cardsHeaderY);
        ctx.fillText(`DRONE UPGRADE CARDS (${totalDroneCardStacks})`, rightColX, cardsHeaderY);
        ctx.restore();

        const listTopY = cardsHeaderY + 12;
        const listH = Math.max(100, (innerY + topAreaH) - listTopY);
        const rowH = 38;
        const rowGap = 6;

        const maxRows = Math.max(ownedPlayerCards.length, ownedDroneCards.length);
        const contentH = maxRows * (rowH + rowGap);
        this.maxLoadoutScrollOffset = Math.max(0, contentH - listH);
        this.loadoutScrollOffset = Math.max(0, Math.min(this.loadoutScrollOffset, this.maxLoadoutScrollOffset));

        const getRarityColor = (rarity) => {
            switch (rarity) {
                case 'Common': return '#00ffcc';
                case 'Rare': return '#00bcff';
                case 'Epic': return '#bc00ff';
                case 'Legendary': return '#ffcc00';
                default: return '#00ffcc';
            }
        };

        ctx.save();
        ctx.beginPath();
        ctx.rect(innerX, listTopY, innerW, listH);
        ctx.clip();

        // Draw Player Cards List
        if (ownedPlayerCards.length === 0) {
            ctx.fillStyle = '#4a6668';
            ctx.font = '18px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('NO PLAYER CARDS COLLECTED YET', leftColX + leftColW / 2, listTopY + listH / 2);
        } else {
            ownedPlayerCards.forEach((card, i) => {
                const ry = listTopY + i * (rowH + rowGap) - this.loadoutScrollOffset;
                if (ry + rowH < listTopY || ry > listTopY + listH) return;

                const isSelected = this.selectedAugmentItem &&
                    this.selectedAugmentItem.source === 'playerCard' &&
                    this.selectedAugmentItem.key === card.id;
                const isHovered = pointer && this._isHovered(pointer, leftColX, ry, leftColW, rowH);
                const rColor = getRarityColor(card.rarity);

                ctx.fillStyle = isSelected ? '#122628' : '#071012';
                ctx.strokeStyle = isSelected ? '#ffffff' : (isHovered ? '#00ffcc' : rColor);
                ctx.lineWidth = isSelected ? 2.5 : 1.5;
                ctx.fillRect(leftColX, ry, leftColW, rowH);
                ctx.strokeRect(leftColX, ry, leftColW, rowH);

                ctx.fillStyle = rColor;
                ctx.font = 'bold 16px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`[${(card.rarity || 'Common').toUpperCase()}]`, leftColX + 10, ry + 24);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 19px "VT323", monospace';
                ctx.fillText(card.name.toUpperCase(), leftColX + 105, ry + 24);

                ctx.fillStyle = '#ffcc00';
                ctx.font = 'bold 20px "VT323", monospace';
                ctx.textAlign = 'right';
                ctx.fillText(`x${card.count}`, leftColX + leftColW - 12, ry + 24);

                this.augmentsButtons.push({
                    x: leftColX,
                    y: ry,
                    w: leftColW,
                    h: rowH,
                    action: () => {
                        this.selectedAugmentItem = { source: 'playerCard', key: card.id, data: card };
                    }
                });
            });
        }

        // Draw Drone Cards List
        if (ownedDroneCards.length === 0) {
            ctx.fillStyle = '#4a6668';
            ctx.font = '18px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('NO DRONE CARDS COLLECTED YET', rightColX + rightColW / 2, listTopY + listH / 2);
        } else {
            ownedDroneCards.forEach((card, i) => {
                const ry = listTopY + i * (rowH + rowGap) - this.loadoutScrollOffset;
                if (ry + rowH < listTopY || ry > listTopY + listH) return;

                const isSelected = this.selectedAugmentItem &&
                    this.selectedAugmentItem.source === 'droneCard' &&
                    this.selectedAugmentItem.key === card.id;
                const isHovered = pointer && this._isHovered(pointer, rightColX, ry, rightColW, rowH);
                const rColor = '#ff55ff';

                ctx.fillStyle = isSelected ? '#221026' : '#100712';
                ctx.strokeStyle = isSelected ? '#ffffff' : (isHovered ? '#00ffcc' : rColor);
                ctx.lineWidth = isSelected ? 2.5 : 1.5;
                ctx.fillRect(rightColX, ry, rightColW, rowH);
                ctx.strokeRect(rightColX, ry, rightColW, rowH);

                const tag = (card.targetBehaviors || ['ALL']).join('/');
                ctx.fillStyle = rColor;
                ctx.font = 'bold 16px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`[${tag}]`, rightColX + 10, ry + 24);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 19px "VT323", monospace';
                ctx.fillText(card.name.toUpperCase(), rightColX + 115, ry + 24);

                ctx.fillStyle = '#ffcc00';
                ctx.font = 'bold 20px "VT323", monospace';
                ctx.textAlign = 'right';
                ctx.fillText(`x${card.count}`, rightColX + rightColW - 12, ry + 24);

                this.augmentsButtons.push({
                    x: rightColX,
                    y: ry,
                    w: rightColW,
                    h: rowH,
                    action: () => {
                        this.selectedAugmentItem = { source: 'droneCard', key: card.id, data: card };
                    }
                });
            });
        }
        ctx.restore();

        // Bottom Inspector for Loadout Tab
        const inspY = innerY + topAreaH + 16;
        ctx.save();
        ctx.fillStyle = '#050809';
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.fillRect(innerX, inspY, innerW, inspectorH);
        ctx.strokeRect(innerX, inspY, innerW, inspectorH);

        const sel = this.selectedAugmentItem;
        if (!sel || !sel.data) {
            ctx.fillStyle = '#88c8d0';
            ctx.font = '20px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
                'Click any Active Drone, Unlocked Hack, or Upgrade Card above to inspect details.',
                innerX + innerW / 2,
                inspY + 48
            );
            ctx.fillStyle = '#ff9900';
            ctx.font = '18px "VT323", monospace';
            ctx.fillText(
                'TIP: You can scrap active Drones or Hacks for +2 Cyber-Scrap to free up a slot!',
                innerX + innerW / 2,
                inspY + 78
            );
        } else if (sel.source === 'drone') {
            const d = sel.data;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(d.name.toUpperCase(), innerX + 18, inspY + 28);

            // Live calculated drone stats
            let statSummary = `BEHAVIOR: ${d.behavior}`;
            if (droneMgr && player) {
                const parts = [];
                if (d.damage !== undefined) {
                    parts.push(`DMG: ${droneMgr._getStat(d, 'damage', player).toFixed(1)}`);
                } else if (d.collisionDamage !== undefined) {
                    parts.push(`RAM DMG: ${droneMgr._getStat(d, 'collisionDamage', player).toFixed(1)}`);
                }
                if (d.fireRate !== undefined) {
                    const rate = 1000 / Math.max(50, droneMgr._getStat(d, 'fireRate', player));
                    parts.push(`RATE: ${rate.toFixed(1)}/s`);
                } else if (d.actionRate !== undefined) {
                    const cd = droneMgr._getStat(d, 'actionRate', player) / 1000;
                    parts.push(`CD: ${cd.toFixed(1)}s`);
                } else if (d.cooldown !== undefined) {
                    const cd = droneMgr._getStat(d, 'cooldown', player);
                    parts.push(`BLOCK CD: ${Math.round(cd)}ms`);
                }
                if (d.range !== undefined) {
                    parts.push(`RANGE: ${droneMgr._getStat(d, 'range', player).toFixed(1)}u`);
                }
                parts.push(`SPD: ${(droneMgr._getStat(d, 'speedMulti', player) * 100).toFixed(0)}%`);
                statSummary = parts.join('  •  ');
            }

            ctx.fillStyle = d.color || '#00ffcc';
            ctx.font = 'bold 18px "VT323", monospace';
            ctx.fillText(statSummary, innerX + 18, inspY + 54);

            ctx.fillStyle = '#d0e8ec';
            ctx.font = '19px "VT323", monospace';
            ctx.fillText(d.description || '', innerX + 18, inspY + 82);

            const btnW = 210;
            const btnH = 44;
            const btnX = innerX + innerW - btnW - 18;
            const btnY = inspY + (inspectorH - btnH) / 2;
            const isHover = pointer && this._isHovered(pointer, btnX, btnY, btnW, btnH);

            this.drawButton(ctx, btnX, btnY, btnW, btnH, 'SCRAP DRONE (+2)', isHover, 'danger');
            this.augmentsButtons.push({
                x: btnX,
                y: btnY,
                w: btnW,
                h: btnH,
                action: () => {
                    if (droneMgr && droneMgr.removeDrone(d.id)) {
                        augmentMgr.scrap += 2;
                        const ui = this.game.getModule('ui');
                        if (ui && ui.showNotification) {
                            ui.showNotification(`DRONE SCRAPPED: +2 CYBER-SCRAP`, '#ff9900');
                        }
                        this.selectedAugmentItem = null;
                    }
                }
            });
        } else if (sel.source === 'hack') {
            const hData = sel.data;
            const unlockUpgrade = UPGRADES.find(u => u.unlockHackId === hData.id);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(hData.name.toUpperCase(), innerX + 18, inspY + 30);

            ctx.fillStyle = '#bc00ff';
            ctx.font = 'bold 18px "VT323", monospace';
            ctx.fillText(`ACTIVE HACK MODULE • ID: ${hData.id}`, innerX + 18, inspY + 54);

            ctx.fillStyle = '#d0e8ec';
            ctx.font = '19px "VT323", monospace';
            ctx.fillText(unlockUpgrade ? unlockUpgrade.description : 'Active cyberware hack ability.', innerX + 18, inspY + 80);

            const btnW = 210;
            const btnH = 44;
            const btnX = innerX + innerW - btnW - 18;
            const btnY = inspY + (inspectorH - btnH) / 2;
            const isHover = pointer && this._isHovered(pointer, btnX, btnY, btnW, btnH);

            this.drawButton(ctx, btnX, btnY, btnW, btnH, 'SCRAP HACK (+2)', isHover, 'danger');
            this.augmentsButtons.push({
                x: btnX,
                y: btnY,
                w: btnW,
                h: btnH,
                action: () => {
                    if (hackMgr && hackMgr.removeHack(hData.id)) {
                        augmentMgr.scrap += 2;
                        const ui = this.game.getModule('ui');
                        if (ui && ui.showNotification) {
                            ui.showNotification(`HACK SCRAPPED: +2 CYBER-SCRAP`, '#ff9900');
                        }
                        this.selectedAugmentItem = null;
                    }
                }
            });
        } else if (sel.source === 'playerCard' || sel.source === 'droneCard') {
            const c = sel.data;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${c.name.toUpperCase()} (OWNED: x${c.count})`, innerX + 18, inspY + 30);

            ctx.fillStyle = sel.source === 'playerCard' ? '#00ffcc' : '#ff55ff';
            ctx.font = 'bold 18px "VT323", monospace';
            const sub = sel.source === 'playerCard'
                ? `PLAYER UPGRADE CARD • ${(c.rarity || 'Common').toUpperCase()}`
                : `DRONE UPGRADE CARD • TARGET: ${(c.targetBehaviors || ['ALL']).join(' & ')}`;
            ctx.fillText(sub, innerX + 18, inspY + 56);

            ctx.fillStyle = '#d0e8ec';
            ctx.font = '19px "VT323", monospace';
            ctx.fillText(c.description || '', innerX + 18, inspY + 84);
        }
        ctx.restore();

        // Back / Resume Button
        const backWidth = 220;
        const backHeight = 50;
        const backX = w / 2 - backWidth / 2;
        const backY = h - 75;
        const backText = this.augmentsOrigin === 'gameplay' ? 'RESUME' : 'BACK';
        const backHovered = pointer && this._isHovered(pointer, backX, backY, backWidth, backHeight);

        this.drawButton(ctx, backX, backY, backWidth, backHeight, backText, backHovered, 'default');
        this.augmentsButtons.push({
            x: backX,
            y: backY,
            w: backWidth,
            h: backHeight,
            action: () => this.closeAugmentsMenu()
        });
    }

    _drawCodexCategoryContent(ctx, w, h, pointer, codexMgr, innerX, innerY, innerW, topAreaH, inspectorH, wrapCardText) {
        let entries = [];
        let title = '';

        if (this.codexTab === 'augments') {
            title = 'CYBERWARE AUGMENTS CODEX';
            entries = AUGMENTS.map(a => ({
                id: a.id,
                category: 'augments',
                name: a.name,
                tag: `${a.slot.toUpperCase()} • ${AUGMENT_TYPES[a.type]?.name.toUpperCase() || a.type}`,
                subtitle: `${a.rarity.toUpperCase()} AUGMENT • SLOT: ${a.slot.toUpperCase()}`,
                color: AUGMENT_TYPES[a.type]?.color || '#00ffcc',
                description: a.description
            }));
        } else if (this.codexTab === 'playerCards') {
            title = 'PLAYER UPGRADE CARDS CODEX';
            const rarityColors = { Common: '#00ffcc', Rare: '#00bcff', Epic: '#bc00ff', Legendary: '#ffcc00' };
            const rarityOrder = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
            entries = UPGRADES.filter(u => !u.unlockHackId)
                .slice()
                .sort((a, b) => (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99))
                .map(u => ({
                    id: u.id,
                    category: 'playerCards',
                    name: u.name,
                    tag: (u.rarity || 'Common').toUpperCase(),
                    subtitle: `PLAYER UPGRADE CARD • ${(u.rarity || 'Common').toUpperCase()}`,
                    color: rarityColors[u.rarity] || '#00ffcc',
                    description: u.description
                }));
        } else if (this.codexTab === 'droneCards') {
            title = 'DRONE UPGRADE CARDS CODEX';
            const rarityColors = { Common: '#00ffcc', Rare: '#00bcff', Epic: '#bc00ff', Legendary: '#ffcc00' };
            const rarityOrder = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
            entries = DRONE_UPGRADES.slice()
                .sort((a, b) => (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99))
                .map(u => {
                    const rarity = u.rarity || 'Common';
                    const targets = (u.targetBehaviors || ['ALL']).join(' & ');
                    return {
                        id: u.id,
                        category: 'droneCards',
                        name: u.name,
                        tag: `${rarity.toUpperCase()} • ${(u.targetBehaviors || ['ALL']).join('/')}`,
                        subtitle: `DRONE UPGRADE CARD • ${rarity.toUpperCase()} • TARGET: ${targets}`,
                        color: rarityColors[rarity] || '#00ffcc',
                        description: u.description
                    };
                });
        } else if (this.codexTab === 'dronesAndHacks') {
            title = 'DRONES & HACKS CODEX';
            const droneEntries = Object.values(DRONE_TYPES).map(d => ({
                id: d.id,
                category: 'drones',
                name: d.name,
                tag: `DRONE • ${d.behavior}`,
                subtitle: `DRONE UNIT • BEHAVIOR: ${d.behavior}`,
                color: d.color || '#00ffcc',
                description: d.description
            }));
            const hackEntries = Object.values(HACK_DATA).map(hk => {
                const unlockCard = UPGRADES.find(u => u.unlockHackId === hk.id);
                return {
                    id: hk.id,
                    category: 'hacks',
                    name: hk.name,
                    tag: 'ACTIVE HACK',
                    subtitle: `HACK MODULE • ID: ${hk.id}`,
                    color: '#bc00ff',
                    description: unlockCard ? unlockCard.description : 'Active cyberware hack ability.'
                };
            });
            entries = [...droneEntries, ...hackEntries];
        } else if (this.codexTab === 'enemies') {
            title = 'ENEMIES BESTIARY CODEX';
            entries = ENEMY_CODEX_IDS.map(id => {
                const cfg = ENEMY_TYPES[id];
                const kills = codexMgr ? codexMgr.getEnemyKills(id) : 0;
                const tier = codexMgr ? codexMgr.getEnemyTier(id) : 0;
                const nextThreshold = codexMgr ? codexMgr.getNextEnemyThreshold(id) : 1;
                return {
                    id,
                    category: 'enemies',
                    isEnemy: true,
                    enemyConfig: cfg,
                    codexTier: cfg.codexTier || 'common',
                    kills,
                    tier,
                    nextThreshold,
                    name: cfg.codexName || id,
                    tag: tier >= 3 ? 'TIER 3/3 (MAX)' : `TIER ${tier}/3`,
                    subtitle: `KILLS: ${kills}${nextThreshold ? ` • NEXT TIER AT ${nextThreshold}` : ' • MAX INTEL UNLOCKED'}`,
                    color: cfg.color || '#ff5555',
                    description: cfg.codexDescription || '',
                    statsText: this._formatEnemyCodexStats(cfg)
                };
            });
        }

        const discoveredCount = entries.filter(e =>
            e.isEnemy ? e.tier >= 1 : (codexMgr && codexMgr.isDiscovered(e.category, e.id))
        ).length;

        ctx.save();
        ctx.fillStyle = '#00ffcc';
        ctx.font = this.styleConfig.fonts.infoTitle;
        ctx.textAlign = 'left';
        ctx.fillText(`${title} (${discoveredCount}/${entries.length})`, innerX, innerY + 16);
        ctx.restore();

        const gridTopY = innerY + 30;
        const gridH = topAreaH - 30;
        const cols = 4;
        const gap = 12;
        const cardW = Math.floor((innerW - gap * (cols - 1)) / cols);
        const cardH = 82;
        const totalRows = Math.ceil(entries.length / cols);
        const contentH = totalRows * (cardH + gap);

        this.maxLoadoutScrollOffset = Math.max(0, contentH - gridH);
        this.loadoutScrollOffset = Math.max(0, Math.min(this.loadoutScrollOffset, this.maxLoadoutScrollOffset));

        ctx.save();
        ctx.beginPath();
        ctx.rect(innerX, gridTopY, innerW, gridH);
        ctx.clip();

        entries.forEach((entry, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const cx = innerX + col * (cardW + gap);
            const cy = gridTopY + row * (cardH + gap) - this.loadoutScrollOffset;

            if (cy + cardH < gridTopY || cy > gridTopY + gridH) return;

            const isDiscovered = entry.isEnemy
                ? entry.tier >= 1
                : (codexMgr ? codexMgr.isDiscovered(entry.category, entry.id) : false);
            const isSelected = this.selectedAugmentItem &&
                this.selectedAugmentItem.source === 'codexEntry' &&
                this.selectedAugmentItem.key === `${entry.category}:${entry.id}`;
            const isHovered = pointer && this._isHovered(pointer, cx, cy, cardW, cardH);

            const accent = isDiscovered ? entry.color : '#2a3d3f';
            const border = isSelected ? '#ffffff' : (isHovered ? '#00ffcc' : accent);

            ctx.save();
            ctx.fillStyle = isSelected ? '#122628' : (isDiscovered ? '#081214' : '#050708');
            ctx.strokeStyle = border;
            ctx.lineWidth = isSelected ? 2.5 : 1.5;
            ctx.fillRect(cx, cy, cardW, cardH);
            ctx.strokeRect(cx, cy, cardW, cardH);

            if (isDiscovered) {
                const textMaxW = entry.isEnemy ? cardW - 60 : cardW - 20;
                ctx.fillStyle = entry.color;
                ctx.font = 'bold 15px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`[${entry.tag}]`, cx + 10, cy + 22, textMaxW);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 19px "VT323", monospace';
                ctx.fillText(entry.name.toUpperCase(), cx + 10, cy + 48, textMaxW);

                if (entry.isEnemy) {
                    ctx.fillStyle = '#88c8d0';
                    ctx.font = '15px "VT323", monospace';
                    const killLabel = entry.nextThreshold
                        ? `KILLS: ${entry.kills}/${entry.nextThreshold}`
                        : `KILLS: ${entry.kills}`;
                    ctx.fillText(killLabel, cx + 10, cy + 70, textMaxW);
                    this._drawEnemyCodexIcon(ctx, entry.enemyConfig, cx + cardW - 28, cy + 41, 15);
                }
            } else {
                ctx.fillStyle = '#556668';
                ctx.font = 'bold 15px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText('[UNDISCOVERED]', cx + 10, cy + 22);

                ctx.fillStyle = '#778c8f';
                ctx.font = 'bold 20px "VT323", monospace';
                ctx.fillText('???', cx + 10, cy + 48);

                if (entry.isEnemy) {
                    ctx.fillStyle = '#4e5f61';
                    ctx.font = '15px "VT323", monospace';
                    ctx.fillText('KILLS: 0/1', cx + 10, cy + 70);
                }
            }
            ctx.restore();

            this.augmentsButtons.push({
                x: cx,
                y: cy,
                w: cardW,
                h: cardH,
                action: () => {
                    this.selectedAugmentItem = {
                        source: 'codexEntry',
                        key: `${entry.category}:${entry.id}`,
                        data: entry,
                        discovered: isDiscovered
                    };
                }
            });
        });
        ctx.restore();

        // Bottom Inspector
        const inspY = innerY + topAreaH + 16;
        ctx.save();
        ctx.fillStyle = '#050809';
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.fillRect(innerX, inspY, innerW, inspectorH);
        ctx.strokeRect(innerX, inspY, innerW, inspectorH);

        const sel = this.selectedAugmentItem;
        if (!sel || sel.source !== 'codexEntry' || !sel.data) {
            ctx.fillStyle = '#88c8d0';
            ctx.font = '20px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
                'Select any discovered entry above to inspect its stats and description.',
                innerX + innerW / 2,
                inspY + 48
            );
            ctx.fillStyle = '#778c8f';
            ctx.font = '18px "VT323", monospace';
            ctx.fillText(
                'Undiscovered entries unlock permanently when you obtain them during a run.',
                innerX + innerW / 2,
                inspY + 78
            );
        } else if (!sel.discovered) {
            ctx.fillStyle = '#88999c';
            ctx.font = 'bold 24px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.fillText('UNDISCOVERED ENTRY (???)', innerX + 18, inspY + 36);

            ctx.fillStyle = '#778c8f';
            ctx.font = '19px "VT323", monospace';
            const hint = sel.data.isEnemy
                ? 'Eliminate 1 of this enemy type during a run to unlock Tier 1 (Name & Visual).'
                : 'Obtain or equip this item during a run to unlock its details in the Codex.';
            ctx.fillText(hint, innerX + 18, inspY + 72);
        } else if (sel.data.isEnemy) {
            const e = sel.data;
            this._drawEnemyCodexIcon(ctx, e.enemyConfig, innerX + 42, inspY + inspectorH / 2, 22);
            const textX = innerX + 82;
            const textMaxW = innerW - 100;

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${e.name.toUpperCase()}  [${e.codexTier.toUpperCase()} • ${e.tag}]`, textX, inspY + 28, textMaxW);

            ctx.fillStyle = e.color;
            ctx.font = 'bold 18px "VT323", monospace';
            ctx.fillText(e.subtitle, textX, inspY + 50, textMaxW);

            if (e.tier < 2) {
                ctx.fillStyle = '#778c8f';
                ctx.font = '19px "VT323", monospace';
                ctx.fillText(
                    `TIER 2 LOCKED — Eliminate ${e.nextThreshold - e.kills} more to unlock behavior description.`,
                    textX,
                    inspY + 80,
                    textMaxW
                );
            } else {
                ctx.fillStyle = '#d0e8ec';
                ctx.font = '18px "VT323", monospace';
                const descLines = wrapCardText(e.description, textMaxW).slice(0, 2);
                descLines.forEach((line, lIdx) => {
                    ctx.fillText(line, textX, inspY + 74 + lIdx * 18, textMaxW);
                });

                if (e.tier < 3) {
                    ctx.fillStyle = '#ffcc00';
                    ctx.font = '17px "VT323", monospace';
                    ctx.fillText(
                        `TIER 3 LOCKED — Eliminate ${e.nextThreshold - e.kills} more to unlock detailed stats.`,
                        textX,
                        inspY + 110,
                        textMaxW
                    );
                } else {
                    ctx.fillStyle = '#00ffcc';
                    ctx.font = 'bold 17px "VT323", monospace';
                    ctx.fillText(e.statsText, textX, inspY + 110, textMaxW);
                }
            }
        } else {
            const e = sel.data;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(e.name.toUpperCase(), innerX + 18, inspY + 30);

            ctx.fillStyle = e.color;
            ctx.font = 'bold 18px "VT323", monospace';
            ctx.fillText(e.subtitle, innerX + 18, inspY + 56);

            ctx.fillStyle = '#d0e8ec';
            ctx.font = '19px "VT323", monospace';
            const lines = wrapCardText(e.description, innerW - 36).slice(0, 2);
            lines.forEach((line, lIdx) => {
                ctx.fillText(line, innerX + 18, inspY + 84 + lIdx * 20);
            });
        }
        ctx.restore();

        // Back Button
        const backWidth = 220;
        const backHeight = 50;
        const backX = w / 2 - backWidth / 2;
        const backY = h - 75;
        const backHovered = pointer && this._isHovered(pointer, backX, backY, backWidth, backHeight);

        this.drawButton(ctx, backX, backY, backWidth, backHeight, 'BACK', backHovered, 'default');
        this.augmentsButtons.push({
            x: backX,
            y: backY,
            w: backWidth,
            h: backHeight,
            action: () => this.closeAugmentsMenu()
        });
    }

    _drawSynergiesTabContent(ctx, w, h, pointer, synergyMgr, innerX, innerY, innerW, topAreaH, inspectorH, wrapCardText) {
        if (synergyMgr) {
            synergyMgr.evaluateSynergies(false);
        }

        const discoveredCount = synergyMgr ? synergyMgr.discoveredSynergies.size : 0;
        const activeCount = synergyMgr ? synergyMgr.activeSynergies.size : 0;

        ctx.save();
        ctx.fillStyle = '#00ffcc';
        ctx.font = this.styleConfig.fonts.infoTitle;
        ctx.textAlign = 'left';
        ctx.fillText(`SYNERGY CODEX (DISCOVERED: ${discoveredCount}/${SYNERGIES.length})`, innerX, innerY + 16);

        ctx.textAlign = 'right';
        ctx.fillStyle = activeCount > 0 ? '#ffcc00' : '#88c8d0';
        ctx.fillText(`ACTIVE THIS RUN: ${activeCount}`, innerX + innerW, innerY + 16);
        ctx.restore();

        const gridTopY = innerY + 30;
        const gridH = topAreaH - 30;
        const cols = 3;
        const gap = 12;
        const cardW = Math.floor((innerW - gap * (cols - 1)) / cols);
        const cardH = 92;
        const totalRows = Math.ceil(SYNERGIES.length / cols);
        const contentH = totalRows * (cardH + gap);

        this.maxLoadoutScrollOffset = Math.max(0, contentH - gridH);
        this.loadoutScrollOffset = Math.max(0, Math.min(this.loadoutScrollOffset, this.maxLoadoutScrollOffset));

        ctx.save();
        ctx.beginPath();
        ctx.rect(innerX, gridTopY, innerW, gridH);
        ctx.clip();

        SYNERGIES.forEach((syn, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const cx = innerX + col * (cardW + gap);
            const cy = gridTopY + row * (cardH + gap) - this.loadoutScrollOffset;

            if (cy + cardH < gridTopY || cy > gridTopY + gridH) return;

            const isActive = synergyMgr ? synergyMgr.hasSynergy(syn.id) : false;
            const isDiscovered = synergyMgr ? synergyMgr.isDiscovered(syn.id) : false;
            const isSelected = this.selectedAugmentItem &&
                this.selectedAugmentItem.source === 'synergy' &&
                this.selectedAugmentItem.key === syn.id;
            const isHovered = pointer && this._isHovered(pointer, cx, cy, cardW, cardH);

            const accent = isActive ? syn.color : (isDiscovered ? '#55888c' : '#2a3d3f');
            const border = isSelected ? '#ffffff' : (isHovered ? '#00ffcc' : accent);

            ctx.save();
            ctx.fillStyle = isSelected ? '#122628' : (isActive ? '#0c1c1e' : '#050708');
            ctx.strokeStyle = border;
            ctx.lineWidth = isSelected || isActive ? 2.5 : 1.5;
            if (isActive) {
                ctx.shadowBlur = 12;
                ctx.shadowColor = syn.color;
            }
            ctx.fillRect(cx, cy, cardW, cardH);
            ctx.strokeRect(cx, cy, cardW, cardH);
            ctx.shadowBlur = 0;

            if (isDiscovered || isActive) {
                ctx.fillStyle = isActive ? syn.color : '#88c8d0';
                ctx.font = 'bold 15px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(isActive ? '[ACTIVE]' : '[DISCOVERED]', cx + 10, cy + 20);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 20px "VT323", monospace';
                ctx.fillText(syn.name.toUpperCase(), cx + 10, cy + 42);

                const statuses = synergyMgr ? synergyMgr.getRequirementStatuses(syn) : [];
                const metCount = statuses.filter(s => s.met).length;
                ctx.fillStyle = isActive ? '#00ffcc' : '#b8d0d4';
                ctx.font = '16px "VT323", monospace';
                ctx.fillText(`COMPONENTS: ${metCount}/${statuses.length}`, cx + 10, cy + 68);
            } else {
                ctx.fillStyle = '#556668';
                ctx.font = 'bold 15px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText('[UNDISCOVERED]', cx + 10, cy + 20);

                ctx.fillStyle = '#88999c';
                ctx.font = 'bold 20px "VT323", monospace';
                ctx.fillText('???', cx + 10, cy + 42);

                const hintParts = syn.requirements.map(r => (r.revealedInHint ? r.label : '???'));
                ctx.fillStyle = '#667a7d';
                ctx.font = '15px "VT323", monospace';
                const hintLine = wrapCardText(`HINT: ${hintParts.join(' + ')}`, cardW - 20)[0] || '';
                ctx.fillText(hintLine, cx + 10, cy + 68);
            }
            ctx.restore();

            this.augmentsButtons.push({
                x: cx,
                y: cy,
                w: cardW,
                h: cardH,
                action: () => {
                    this.selectedAugmentItem = { source: 'synergy', key: syn.id, data: syn };
                }
            });
        });
        ctx.restore();

        // Bottom Inspector
        const inspY = innerY + topAreaH + 16;
        ctx.save();
        ctx.fillStyle = '#050809';
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.fillRect(innerX, inspY, innerW, inspectorH);
        ctx.strokeRect(innerX, inspY, innerW, inspectorH);

        const sel = this.selectedAugmentItem;
        if (!sel || sel.source !== 'synergy' || !sel.data) {
            ctx.fillStyle = '#88c8d0';
            ctx.font = '20px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
                'Select any Synergy card above to view its recipe or cryptic hint.',
                innerX + innerW / 2,
                inspY + 48
            );
            ctx.fillStyle = '#ffcc00';
            ctx.font = '18px "VT323", monospace';
            ctx.fillText(
                'Discovered Synergies are saved permanently in your Codex across runs!',
                innerX + innerW / 2,
                inspY + 78
            );
        } else {
            const syn = sel.data;
            const isActive = synergyMgr ? synergyMgr.hasSynergy(syn.id) : false;
            const isDiscovered = synergyMgr ? synergyMgr.isDiscovered(syn.id) : false;
            const statuses = synergyMgr ? synergyMgr.getRequirementStatuses(syn) : [];

            if (isDiscovered || isActive) {
                ctx.fillStyle = syn.color;
                ctx.font = 'bold 24px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`${syn.name.toUpperCase()} ${isActive ? '[ACTIVE]' : '[INACTIVE]'}`, innerX + 18, inspY + 28);

                const reqLine = statuses.map(s => `${s.met ? '✓' : '✗'} ${s.label}`).join('   |   ');
                ctx.fillStyle = '#00ffcc';
                ctx.font = '17px "VT323", monospace';
                ctx.fillText(reqLine, innerX + 18, inspY + 54);

                ctx.fillStyle = '#d0e8ec';
                ctx.font = '18px "VT323", monospace';
                const descLines = wrapCardText(syn.description, innerW - 36).slice(0, 2);
                descLines.forEach((line, lIdx) => {
                    ctx.fillText(line, innerX + 18, inspY + 80 + lIdx * 20);
                });
            } else {
                ctx.fillStyle = '#88999c';
                ctx.font = 'bold 24px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText('UNDISCOVERED SYNERGY', innerX + 18, inspY + 30);

                const hintParts = statuses.map(s => (s.revealedInHint ? `${s.met ? '✓' : '•'} ${s.label}` : '???'));
                ctx.fillStyle = '#ffcc00';
                ctx.font = '19px "VT323", monospace';
                ctx.fillText(`HINT: ${hintParts.join('   +   ')}`, innerX + 18, inspY + 62);

                ctx.fillStyle = '#778c8f';
                ctx.font = '18px "VT323", monospace';
                ctx.fillText('Combine matching Augments, Drones, Hacks, and Upgrade Cards to discover this Synergy.', innerX + 18, inspY + 92);
            }
        }
        ctx.restore();

        // Back / Resume Button
        const backWidth = 220;
        const backHeight = 50;
        const backX = w / 2 - backWidth / 2;
        const backY = h - 75;
        const backText = this.augmentsOrigin === 'gameplay' ? 'RESUME' : 'BACK';
        const backHovered = pointer && this._isHovered(pointer, backX, backY, backWidth, backHeight);

        this.drawButton(ctx, backX, backY, backWidth, backHeight, backText, backHovered, 'default');
        this.augmentsButtons.push({
            x: backX,
            y: backY,
            w: backWidth,
            h: backHeight,
            action: () => this.closeAugmentsMenu()
        });
    }

    _drawCodexCategoryContent(ctx, w, h, pointer, codexMgr, innerX, innerY, innerW, topAreaH, inspectorH, wrapCardText) {
        let entries = [];
        let title = '';

        if (this.codexTab === 'augments') {
            title = 'CYBERWARE AUGMENTS CODEX';
            entries = AUGMENTS.map(a => ({
                id: a.id,
                category: 'augments',
                name: a.name,
                tag: `${a.slot.toUpperCase()} • ${AUGMENT_TYPES[a.type]?.name.toUpperCase() || a.type}`,
                subtitle: `${a.rarity.toUpperCase()} AUGMENT • SLOT: ${a.slot.toUpperCase()}`,
                color: AUGMENT_TYPES[a.type]?.color || '#00ffcc',
                description: a.description
            }));
        } else if (this.codexTab === 'playerCards') {
            title = 'PLAYER UPGRADE CARDS CODEX';
            const rarityColors = { Common: '#00ffcc', Rare: '#00bcff', Epic: '#bc00ff', Legendary: '#ffcc00' };
            const rarityOrder = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
            entries = UPGRADES.filter(u => !u.unlockHackId)
                .slice()
                .sort((a, b) => (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99))
                .map(u => ({
                    id: u.id,
                    category: 'playerCards',
                    name: u.name,
                    tag: (u.rarity || 'Common').toUpperCase(),
                    subtitle: `PLAYER UPGRADE CARD • ${(u.rarity || 'Common').toUpperCase()}`,
                    color: rarityColors[u.rarity] || '#00ffcc',
                    description: u.description
                }));
        } else if (this.codexTab === 'droneCards') {
            title = 'DRONE UPGRADE CARDS CODEX';
            const rarityColors = { Common: '#00ffcc', Rare: '#00bcff', Epic: '#bc00ff', Legendary: '#ffcc00' };
            const rarityOrder = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
            entries = DRONE_UPGRADES.slice()
                .sort((a, b) => (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99))
                .map(u => {
                    const rarity = u.rarity || 'Common';
                    const targets = (u.targetBehaviors || ['ALL']).join(' & ');
                    return {
                        id: u.id,
                        category: 'droneCards',
                        name: u.name,
                        tag: `${rarity.toUpperCase()} • ${(u.targetBehaviors || ['ALL']).join('/')}`,
                        subtitle: `DRONE UPGRADE CARD • ${rarity.toUpperCase()} • TARGET: ${targets}`,
                        color: rarityColors[rarity] || '#00ffcc',
                        description: u.description
                    };
                });
        } else if (this.codexTab === 'dronesAndHacks') {
            title = 'DRONES & HACKS CODEX';
            const droneEntries = Object.values(DRONE_TYPES).map(d => ({
                id: d.id,
                category: 'drones',
                name: d.name,
                tag: `DRONE • ${d.behavior}`,
                subtitle: `DRONE UNIT • BEHAVIOR: ${d.behavior}`,
                color: d.color || '#00ffcc',
                description: d.description
            }));
            const hackEntries = Object.values(HACK_DATA).map(hk => {
                const unlockCard = UPGRADES.find(u => u.unlockHackId === hk.id);
                return {
                    id: hk.id,
                    category: 'hacks',
                    name: hk.name,
                    tag: 'ACTIVE HACK',
                    subtitle: `HACK MODULE • ID: ${hk.id}`,
                    color: '#bc00ff',
                    description: unlockCard ? unlockCard.description : 'Active cyberware hack ability.'
                };
            });
            entries = [...droneEntries, ...hackEntries];
        } else if (this.codexTab === 'enemies') {
            title = 'ENEMIES BESTIARY CODEX';
            entries = ENEMY_CODEX_IDS.map(id => {
                const cfg = ENEMY_TYPES[id];
                const kills = codexMgr ? codexMgr.getEnemyKills(id) : 0;
                const tier = codexMgr ? codexMgr.getEnemyTier(id) : 0;
                const nextThreshold = codexMgr ? codexMgr.getNextEnemyThreshold(id) : 1;
                return {
                    id,
                    category: 'enemies',
                    isEnemy: true,
                    enemyConfig: cfg,
                    codexTier: cfg.codexTier || 'common',
                    kills,
                    tier,
                    nextThreshold,
                    name: cfg.codexName || id,
                    tag: tier >= 3 ? 'TIER 3/3 (MAX)' : `TIER ${tier}/3`,
                    subtitle: `KILLS: ${kills}${nextThreshold ? ` • NEXT TIER AT ${nextThreshold}` : ' • MAX INTEL UNLOCKED'}`,
                    color: cfg.color || '#ff5555',
                    description: cfg.codexDescription || '',
                    statsText: this._formatEnemyCodexStats(cfg)
                };
            });
        }

        const discoveredCount = entries.filter(e =>
            e.isEnemy ? e.tier >= 1 : (codexMgr && codexMgr.isDiscovered(e.category, e.id))
        ).length;

        ctx.save();
        ctx.fillStyle = '#00ffcc';
        ctx.font = this.styleConfig.fonts.infoTitle;
        ctx.textAlign = 'left';
        ctx.fillText(`${title} (${discoveredCount}/${entries.length})`, innerX, innerY + 16);
        ctx.restore();

        const gridTopY = innerY + 30;
        const gridH = topAreaH - 30;
        const cols = 4;
        const gap = 12;
        const cardW = Math.floor((innerW - gap * (cols - 1)) / cols);
        const cardH = 82;
        const totalRows = Math.ceil(entries.length / cols);
        const contentH = totalRows * (cardH + gap);

        this.maxLoadoutScrollOffset = Math.max(0, contentH - gridH);
        this.loadoutScrollOffset = Math.max(0, Math.min(this.loadoutScrollOffset, this.maxLoadoutScrollOffset));

        ctx.save();
        ctx.beginPath();
        ctx.rect(innerX, gridTopY, innerW, gridH);
        ctx.clip();

        entries.forEach((entry, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const cx = innerX + col * (cardW + gap);
            const cy = gridTopY + row * (cardH + gap) - this.loadoutScrollOffset;

            if (cy + cardH < gridTopY || cy > gridTopY + gridH) return;

            const isDiscovered = entry.isEnemy
                ? entry.tier >= 1
                : (codexMgr ? codexMgr.isDiscovered(entry.category, entry.id) : false);
            const isSelected = this.selectedAugmentItem &&
                this.selectedAugmentItem.source === 'codexEntry' &&
                this.selectedAugmentItem.key === `${entry.category}:${entry.id}`;
            const isHovered = pointer && this._isHovered(pointer, cx, cy, cardW, cardH);

            const accent = isDiscovered ? entry.color : '#2a3d3f';
            const border = isSelected ? '#ffffff' : (isHovered ? '#00ffcc' : accent);

            ctx.save();
            ctx.fillStyle = isSelected ? '#122628' : (isDiscovered ? '#081214' : '#050708');
            ctx.strokeStyle = border;
            ctx.lineWidth = isSelected ? 2.5 : 1.5;
            ctx.fillRect(cx, cy, cardW, cardH);
            ctx.strokeRect(cx, cy, cardW, cardH);

            if (isDiscovered) {
                const textMaxW = entry.isEnemy ? cardW - 60 : cardW - 20;
                ctx.fillStyle = entry.color;
                ctx.font = 'bold 15px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`[${entry.tag}]`, cx + 10, cy + 22, textMaxW);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 19px "VT323", monospace';
                ctx.fillText(entry.name.toUpperCase(), cx + 10, cy + 48, textMaxW);

                if (entry.isEnemy) {
                    ctx.fillStyle = '#88c8d0';
                    ctx.font = '15px "VT323", monospace';
                    const killLabel = entry.nextThreshold
                        ? `KILLS: ${entry.kills}/${entry.nextThreshold}`
                        : `KILLS: ${entry.kills}`;
                    ctx.fillText(killLabel, cx + 10, cy + 70, textMaxW);
                    this._drawEnemyCodexIcon(ctx, entry.enemyConfig, cx + cardW - 28, cy + 41, 15);
                }
            } else {
                ctx.fillStyle = '#556668';
                ctx.font = 'bold 15px "VT323", monospace';
                ctx.textAlign = 'left';
                ctx.fillText('[UNDISCOVERED]', cx + 10, cy + 22);

                ctx.fillStyle = '#778c8f';
                ctx.font = 'bold 20px "VT323", monospace';
                ctx.fillText('???', cx + 10, cy + 48);

                if (entry.isEnemy) {
                    ctx.fillStyle = '#4e5f61';
                    ctx.font = '15px "VT323", monospace';
                    ctx.fillText('KILLS: 0/1', cx + 10, cy + 70);
                }
            }
            ctx.restore();

            this.augmentsButtons.push({
                x: cx,
                y: cy,
                w: cardW,
                h: cardH,
                action: () => {
                    this.selectedAugmentItem = {
                        source: 'codexEntry',
                        key: `${entry.category}:${entry.id}`,
                        data: entry,
                        discovered: isDiscovered
                    };
                }
            });
        });
        ctx.restore();

        // Bottom Inspector
        const inspY = innerY + topAreaH + 16;
        ctx.save();
        ctx.fillStyle = '#050809';
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.fillRect(innerX, inspY, innerW, inspectorH);
        ctx.strokeRect(innerX, inspY, innerW, inspectorH);

        const sel = this.selectedAugmentItem;
        if (!sel || sel.source !== 'codexEntry' || !sel.data) {
            ctx.fillStyle = '#88c8d0';
            ctx.font = '20px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
                'Select any discovered entry above to inspect its stats and description.',
                innerX + innerW / 2,
                inspY + 48
            );
            ctx.fillStyle = '#778c8f';
            ctx.font = '18px "VT323", monospace';
            ctx.fillText(
                'Undiscovered entries unlock permanently when you obtain them during a run.',
                innerX + innerW / 2,
                inspY + 78
            );
        } else if (!sel.discovered) {
            ctx.fillStyle = '#88999c';
            ctx.font = 'bold 24px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.fillText('UNDISCOVERED ENTRY (???)', innerX + 18, inspY + 36);

            ctx.fillStyle = '#778c8f';
            ctx.font = '19px "VT323", monospace';
            const hint = sel.data.isEnemy
                ? 'Eliminate 1 of this enemy type during a run to unlock Tier 1 (Name & Visual).'
                : 'Obtain or equip this item during a run to unlock its details in the Codex.';
            ctx.fillText(hint, innerX + 18, inspY + 72);
        } else if (sel.data.isEnemy) {
            const e = sel.data;
            this._drawEnemyCodexIcon(ctx, e.enemyConfig, innerX + 42, inspY + inspectorH / 2, 22);
            const textX = innerX + 82;
            const textMaxW = innerW - 100;

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${e.name.toUpperCase()}  [${e.codexTier.toUpperCase()} • ${e.tag}]`, textX, inspY + 28, textMaxW);

            ctx.fillStyle = e.color;
            ctx.font = 'bold 18px "VT323", monospace';
            ctx.fillText(e.subtitle, textX, inspY + 50, textMaxW);

            if (e.tier < 2) {
                ctx.fillStyle = '#778c8f';
                ctx.font = '19px "VT323", monospace';
                ctx.fillText(
                    `TIER 2 LOCKED — Eliminate ${e.nextThreshold - e.kills} more to unlock behavior description.`,
                    textX,
                    inspY + 80,
                    textMaxW
                );
            } else {
                ctx.fillStyle = '#d0e8ec';
                ctx.font = '18px "VT323", monospace';
                const descLines = wrapCardText(e.description, textMaxW).slice(0, 2);
                descLines.forEach((line, lIdx) => {
                    ctx.fillText(line, textX, inspY + 74 + lIdx * 18, textMaxW);
                });

                if (e.tier < 3) {
                    ctx.fillStyle = '#ffcc00';
                    ctx.font = '17px "VT323", monospace';
                    ctx.fillText(
                        `TIER 3 LOCKED — Eliminate ${e.nextThreshold - e.kills} more to unlock detailed stats.`,
                        textX,
                        inspY + 110,
                        textMaxW
                    );
                } else {
                    ctx.fillStyle = '#00ffcc';
                    ctx.font = 'bold 17px "VT323", monospace';
                    ctx.fillText(e.statsText, textX, inspY + 110, textMaxW);
                }
            }
        } else {
            const e = sel.data;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(e.name.toUpperCase(), innerX + 18, inspY + 30);

            ctx.fillStyle = e.color;
            ctx.font = 'bold 18px "VT323", monospace';
            ctx.fillText(e.subtitle, innerX + 18, inspY + 56);

            ctx.fillStyle = '#d0e8ec';
            ctx.font = '19px "VT323", monospace';
            const lines = wrapCardText(e.description, innerW - 36).slice(0, 2);
            lines.forEach((line, lIdx) => {
                ctx.fillText(line, innerX + 18, inspY + 84 + lIdx * 20);
            });
        }
        ctx.restore();

        // Back Button
        const backWidth = 220;
        const backHeight = 50;
        const backX = w / 2 - backWidth / 2;
        const backY = h - 75;
        const backHovered = pointer && this._isHovered(pointer, backX, backY, backWidth, backHeight);

        this.drawButton(ctx, backX, backY, backWidth, backHeight, 'BACK', backHovered, 'default');
        this.augmentsButtons.push({
            x: backX,
            y: backY,
            w: backWidth,
            h: backHeight,
            action: () => this.closeAugmentsMenu()
        });
    }

    _drawFourPieceChoiceModal(ctx, w, h, pointer, augmentMgr, wrapCardText) {
        const typeKey = augmentMgr.pendingFourPieceChoiceType;
        const tInfo = AUGMENT_TYPES[typeKey];
        const bonuses = AUGMENT_SET_BONUSES[typeKey]?.fourPiece;
        if (!tInfo || !bonuses) return;

        // Block background buttons while modal is open
        this.augmentsButtons = [];

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.fillRect(0, 0, w, h);

        const modalW = Math.min(820, w - 80);
        const modalH = 420;
        const modalX = (w - modalW) / 2;
        const modalY = (h - modalH) / 2;

        ctx.fillStyle = '#060c0e';
        ctx.strokeStyle = tInfo.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 24;
        ctx.shadowColor = tInfo.color;
        ctx.fillRect(modalX, modalY, modalW, modalH);
        ctx.strokeRect(modalX, modalY, modalW, modalH);
        ctx.shadowBlur = 0;

        ctx.fillStyle = tInfo.color;
        ctx.font = 'bold 36px "VT323", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`4-PIECE ${tInfo.name.toUpperCase()} SET COMPLETED!`, w / 2, modalY + 46);

        ctx.fillStyle = '#d0e8ec';
        ctx.font = '22px "VT323", monospace';
        ctx.fillText('CHOOSE YOUR 4-PIECE SET BONUS SPECIALIZATION:', w / 2, modalY + 80);

        const cardGap = 28;
        const cardW = Math.floor((modalW - 72 - cardGap) / 2);
        const cardH = modalH - 130;
        const cardY = modalY + 104;

        const choices = [
            { mode: 'active', label: 'ACTIVE ULTIMATE', data: bonuses.active },
            { mode: 'passive', label: 'PASSIVE MASTERY', data: bonuses.passive }
        ];

        choices.forEach((choice, idx) => {
            const cardX = modalX + 36 + idx * (cardW + cardGap);
            const isHovered = pointer && this._isHovered(pointer, cardX, cardY, cardW, cardH);

            ctx.save();
            ctx.fillStyle = isHovered ? '#102428' : '#081214';
            ctx.strokeStyle = isHovered ? '#ffffff' : tInfo.color;
            ctx.lineWidth = isHovered ? 3 : 2;
            if (isHovered) {
                ctx.shadowBlur = 18;
                ctx.shadowColor = tInfo.color;
            }
            ctx.fillRect(cardX, cardY, cardW, cardH);
            ctx.strokeRect(cardX, cardY, cardW, cardH);
            ctx.shadowBlur = 0;

            ctx.fillStyle = tInfo.color;
            ctx.font = 'bold 20px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`[${choice.label}]`, cardX + cardW / 2, cardY + 34);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px "VT323", monospace';
            ctx.fillText(choice.data.name.toUpperCase(), cardX + cardW / 2, cardY + 72);

            ctx.fillStyle = '#c8e0e4';
            ctx.font = '20px "VT323", monospace';
            const lines = wrapCardText(choice.data.description, cardW - 32);
            lines.forEach((line, lIdx) => {
                ctx.fillText(line, cardX + cardW / 2, cardY + 115 + lIdx * 24);
            });

            const btnW = cardW - 48;
            const btnH = 46;
            const btnX = cardX + 24;
            const btnY = cardY + cardH - btnH - 20;
            this.drawButton(
                ctx,
                btnX,
                btnY,
                btnW,
                btnH,
                `SELECT ${choice.mode.toUpperCase()}`,
                isHovered,
                'selectedTab'
            );
            ctx.restore();

            this.augmentsButtons.push({
                x: cardX,
                y: cardY,
                w: cardW,
                h: cardH,
                action: () => {
                    augmentMgr.selectFourPieceBonus(choice.mode);
                    this.selectedAugmentItem = { source: 'set', key: typeKey };
                }
            });
        });

        ctx.restore();
    }

    _formatEnemyCodexStats(cfg) {
        if (!cfg) return '';
        const parts = [
            `HP: ${cfg.hp}`,
            `SPD: ${cfg.speed}`,
            `SIZE: ${cfg.size}`,
            `SCORE: ${cfg.scoreValue}`
        ];
        if (cfg.isSuicidal) parts.push('SUICIDAL');
        if (cfg.ranged) parts.push(`RANGED (${(cfg.ranged.fireRate / 1000).toFixed(1)}s CD, SPD ${cfg.ranged.projectileSpeed})`);
        if (cfg.emp) parts.push(`EMP (${cfg.emp.radius}px, ${(cfg.emp.disableDuration / 1000).toFixed(1)}s JAM, ${(cfg.emp.cooldown / 1000).toFixed(1)}s CD)`);
        if (cfg.dasher) parts.push(`DASH (SPD ${cfg.dasher.dashSpeed}, ${(cfg.dasher.cooldown / 1000).toFixed(1)}s CD)`);
        if (cfg.virus) parts.push(`VIRUS (${Math.round(cfg.virus.glitchChance * 100)}% GLITCH, ${Math.round(cfg.virus.rangedMutationChance * 100)}% RANGED, ${Math.round(cfg.virus.virusCloneChance * 100)}% CLONE)`);
        if (cfg.splitCount) parts.push(`SPLITS: ${cfg.splitCount} SHARDS (2 HP, 0.22 SPD)`);
        if (cfg.shieldAura) parts.push(`AURA (${cfg.shieldAura.radius}px, -${Math.round(cfg.shieldAura.damageReduction * 100)}% DMG)`);
        if (cfg.isVirusGlitched) parts.push('RANDOMIZED STATS');
        return parts.join('  |  ');
    }

    _drawEnemyCodexIcon(ctx, cfg, cx, cy, radius) {
        if (!cfg) return;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.strokeStyle = cfg.color || '#ffffff';
        ctx.fillStyle = `${cfg.color || '#ffffff'}33`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = cfg.color || '#ffffff';

        const drawShape = (shape, r) => {
            ctx.beginPath();
            if (shape === 'CIRCLE') {
                ctx.arc(0, 0, r, 0, Math.PI * 2);
            } else if (shape === 'SQUARE') {
                ctx.rect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);
            } else if (shape === 'TRIANGLE') {
                for (let i = 0; i < 3; i++) {
                    const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
                    const px = Math.cos(a) * r;
                    const py = Math.sin(a) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
            } else if (shape === 'HEXAGON') {
                for (let i = 0; i < 6; i++) {
                    const a = (i * Math.PI) / 3;
                    const px = Math.cos(a) * r;
                    const py = Math.sin(a) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
            } else {
                // RHOMBUS
                ctx.moveTo(0, -r);
                ctx.lineTo(r * 0.85, 0);
                ctx.lineTo(0, r);
                ctx.lineTo(-r * 0.85, 0);
                ctx.closePath();
            }
            ctx.fill();
            ctx.stroke();
        };

        if (cfg.specialType === 'GLITCHED') {
            ctx.save();
            ctx.translate(-2, 0);
            ctx.strokeStyle = '#ff00ff';
            drawShape(cfg.type, radius);
            ctx.restore();
            ctx.save();
            ctx.translate(2, 0);
            ctx.strokeStyle = '#00ffcc';
            drawShape(cfg.type, radius);
            ctx.restore();
        } else {
            drawShape(cfg.type, radius);
        }

        if (cfg.specialType === 'EMP') {
            ctx.beginPath();
            ctx.setLineDash([3, 3]);
            ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (cfg.specialType === 'SHIELD_BEARER') {
            ctx.beginPath();
            ctx.strokeStyle = '#66aaff';
            ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
            ctx.stroke();
        } else if (cfg.specialType === 'VIRUS') {
            ctx.beginPath();
            ctx.fillStyle = '#b4ff00';
            ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
        } else if (cfg.specialType === 'SPLITTER') {
            ctx.beginPath();
            ctx.strokeStyle = '#ffcc55';
            ctx.moveTo(-radius * 0.5, 0);
            ctx.lineTo(radius * 0.5, 0);
            ctx.moveTo(0, -radius * 0.5);
            ctx.lineTo(0, radius * 0.5);
            ctx.stroke();
        }

        ctx.restore();
    }

    _drawPauseCountdown(ctx) {
        const seconds = Math.ceil(this.game.pauseResumeCooldownTimer / 1000);
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "VT323", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(seconds.toString(), this.game.canvas.width / 2, this.game.canvas.height / 2 + 100);
        ctx.restore();
    }

    _drawPauseStatsInfobox(ctx, x, y, player) {
        const rowHeight = 22;
        const panelWidth = 260;
        const displayStats = getFormattedStats(player);
        const panelHeight = displayStats.length * rowHeight + 50;

        this.drawPanel(ctx, x - 10, y - 40, panelWidth, panelHeight);

        ctx.save();
        ctx.fillStyle = '#00ffcc';
        ctx.font = this.styleConfig.fonts.infoTitle;
        ctx.textAlign = 'left';
        ctx.fillText('STATUS', x, y - 15);
        ctx.font = this.styleConfig.fonts.infoText;

        displayStats.forEach((stat, index) => {
            const currentY = y + (index * rowHeight);
            ctx.fillStyle = '#00ffcc';
            ctx.fillText(stat.label, x, currentY);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.fillText(stat.val, x + panelWidth - 30, currentY);
            ctx.textAlign = 'left';
        });
        ctx.restore();
    }

    _drawGameOverScreen(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

        this.drawPanel(ctx, 0, 0, w, h, '', 'overlay');

        ctx.save();
        ctx.fillStyle = this.styleConfig.colors.accent;
        ctx.font = this.styleConfig.fonts.title;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.styleConfig.colors.accent;
        ctx.fillText('CRITICAL FAILURE', w / 2, 120);
        ctx.restore();

        const ui = this.game.getModule('ui');
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px "VT323", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`FINAL SCORE: ${ui ? ui.score : 0}`, w / 2, 180);
        ctx.restore();

        const player = this.game.getModule('player');
        if (player) {
            this._drawPauseStatsInfobox(ctx, 40, h / 2 - 200, player);
        }

        const btnWidth = 260;
        const btnHeight = 64;
        const btnX = w - btnWidth - 40;
        const btnY = h / 2 - btnHeight - 10;

        this.gameOverButtons = this.renderMenu(ctx, 'GAME_OVER_MENU', {
            startX: btnX,
            startY: btnY,
            width: btnWidth,
            itemHeight: btnHeight,
            spacing: 24,
            pointer: this._getPointer()
        });
    }

    _isHovered(pointer, x, y, w, h) {
        return pointer && pointer.x >= x && pointer.x <= x + w && pointer.y >= y && pointer.y <= y + h;
    }

    renderCardSelection(ctx, cards, selectedCardId = null, layout = {}) {
        const x = layout.startX ?? 60;
        const y = layout.startY ?? 120;
        const cardWidth = layout.cardWidth ?? 280;
        const cardHeight = layout.cardHeight ?? 220;
        const gap = layout.gap ?? 30;
        const pointer = this._getPointer() || this.mousePos;

        this.cardBounds = [];

        cards.forEach((card, index) => {
            const cardX = x + index * (cardWidth + gap);
            const cardY = y;
            const isSelected = selectedCardId === card.id;
            this.drawPanel(ctx, cardX, cardY, cardWidth, cardHeight, card.name, 'card');

            ctx.fillStyle = '#ffffff';
            ctx.font = this.styleConfig.fonts.cardDescription;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(card.description, cardX + 16, cardY + 60, cardWidth - 32);

            if (card.rarity) {
                ctx.fillStyle = '#00ffcc';
                ctx.font = this.styleConfig.fonts.cardRarity;
                ctx.fillText(card.rarity.toUpperCase(), cardX + 16, cardY + 34);
            }

            this.cardBounds.push({
                x: cardX,
                y: cardY,
                w: cardWidth,
                h: cardHeight,
                id: card.id,
                action: card.action,
                selected: isSelected
            });

            if (isSelected) {
                this.drawButton(ctx, cardX, cardY + cardHeight - 56, cardWidth, 48, 'SELECT', this._isHovered(pointer, cardX, cardY + cardHeight - 56, cardWidth, 48), 'default');
            }
        });
    }
}

