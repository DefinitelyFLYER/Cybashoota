import { getFormattedStats } from '../ui/Infobox.js';
import { MENU_DEFINITIONS } from '../data/MenuDefinitions.js';

export default class MenuManager {
    constructor() {
        this.buttons = [];
        this.pauseButtons = [];
        this.gameOverButtons = [];
        this.settingsButtons = [];
        this.settingsTab = 'performance';
        this.settingsOrigin = null;
        this.mousePos = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.activeSlider = null;
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
            this._handleClick();
        });
        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
            this.activeSlider = null;
        });
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

    _isOverlayActive() {
        return this.game.gameState === 'MENU' || this.game.settingsOpen || this.game.isGameOver || this.game.isPaused;
    }

    _handleMouseMove(e) {
        if (!this._isOverlayActive()) return;
        const rect = this.game.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
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

    setSettingsTab(tab) {
        this.settingsTab = tab;
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
            ctx.fillStyle = '#00ffcc';
            ctx.font = this.styleConfig.fonts.bigTitle;
            ctx.fillText('CYBASHOOTA', w / 2, h / 3);
        }
        ctx.restore();

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
        const optionX = panelX + 30;
        const swatchSize = 38;
        const swatchSpacing = 16;
        const sliderWidth = 360;
        const sliderHeight = 10;

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

        let optionY = panelY + 40;

        const drawToggle = (item) => {
            const value = this._getSettingsValue(item.path);
            ctx.fillStyle = this.styleConfig.colors.title;
            ctx.font = this.styleConfig.fonts.label;
            ctx.textAlign = 'left';
            ctx.fillText(item.label, optionX, optionY + 8);

            const btnWidth = 180;
            const btnHeight = 38;
            const btnX = panelX + panelW - btnWidth - 30;
            const btnY = optionY - 16;
            const isHovered = pointer && this._isHovered(pointer, btnX, btnY, btnWidth, btnHeight);
            const text = value ? 'ON' : 'OFF';
            const style = value ? 'selectedTab' : 'toggle';

            this.drawButton(ctx, btnX, btnY, btnWidth, btnHeight, text, isHovered || value, style);
            this.settingsButtons.push({
                x: btnX,
                y: btnY,
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

                const isHovered = pointer && this._isHovered(pointer, swatchX, optionY, swatchSize, swatchSize);
                if (isHovered) {
                    ctx.save();
                    ctx.strokeStyle = '#00ffcc';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(swatchX, optionY, swatchSize, swatchSize);
                    ctx.restore();
                }

                this.settingsButtons.push({
                    x: swatchX,
                    y: optionY,
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
            const displayValue = item.step < 1 ? value.toFixed(1) : value.toString();
            const sliderDisabled = this.settingsOrigin === 'menu' && item.id === 'uiScale';
            const trackX = optionX;
            const trackY = optionY + 30;
            const progress = (value - item.min) / (item.max - item.min);
            const handleRadius = 10;
            const handleX = trackX + progress * sliderWidth;
            const isHovered = pointer && this._isHovered(pointer, trackX, trackY - handleRadius, sliderWidth, sliderHeight + handleRadius * 2);

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
                const stepped = Math.round(raw / item.step) * item.step;
                this._setSettingsValue(item.path, stepped);
            };

            this.settingsButtons.push({
                x: trackX,
                y: trackY - handleRadius,
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
                const isHovered = pointer && this._isHovered(pointer, btnX, optionY, btnWidth, btnHeight);
                const style = isSelected ? 'selectedTab' : 'default';
                const text = item.id === 'cursorSkin' ? '' : optionValue.toUpperCase();

                this.drawButton(ctx, btnX, optionY, btnWidth, btnHeight, text, isHovered || isSelected, style);
                if (item.id === 'cursorSkin') {
                    drawCrosshairPreview(ctx, btnX, optionY, btnWidth, btnHeight, optionValue);
                }

                this.settingsButtons.push({
                    x: btnX,
                    y: optionY,
                    w: btnWidth,
                    h: btnHeight,
                    action: () => this._setSettingsValue(item.path, optionValue)
                });
                btnX += btnWidth + btnSpacing;
            });

            optionY += btnHeight + 40;
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
                case 'label':
                default:
                    drawLabel(item);
                    break;
            }
        });

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
        const btnX = w - btnWidth - 40;
        const btnY = h / 2 - btnHeight - 10;

        this.pauseButtons = this.renderMenu(ctx, 'PAUSE_MENU', {
            startX: btnX,
            startY: btnY,
            width: btnWidth,
            itemHeight: btnHeight,
            spacing: 24,
            pointer: this._getPointer()
        });
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
        const panelHeight = 420;

        this.drawPanel(ctx, x - 10, y - 40, panelWidth, panelHeight);

        ctx.fillStyle = '#00ffcc';
        ctx.font = this.styleConfig.fonts.infoTitle;
        ctx.textAlign = 'left';
        ctx.fillText('STATUS', x, y - 15);
        ctx.font = this.styleConfig.fonts.infoText;

        const displayStats = getFormattedStats(player);
        displayStats.forEach((stat, index) => {
            const currentY = y + (index * rowHeight);
            ctx.fillStyle = '#00ffcc';
            ctx.fillText(stat.label, x, currentY);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.fillText(stat.val, x + panelWidth - 30, currentY);
            ctx.textAlign = 'left';
        });
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

