import { UPGRADES } from '../data/UpgradeData.js';
import { getFormattedStats } from '../ui/Infobox.js';
import { DRONE_TYPES } from '../data/DroneTypes.js';
import { DRONE_UPGRADES } from '../data/DroneUpgradeData.js';
import { getUnlockedHackIds } from '../data/HackData.js';

export default class UpgradeManager {
    constructor() {
        this.inventory = {};
        this.isSelectionActive = false;
        this.currentOptions = [];
        this.selectionMode = 'UPGRADES';
        this.selectedCardId = null; 
        this.confirmBtnBounds = null;
        this.droneLevelInterval = 3;
        this.pendingLevelUps = 0;
        this._clickHandler = this._handleInput.bind(this);
        this._gamepadActionHeld = false;

        this.droneMods = {
            'ALL': { damageBonus: 0, speedMulti: 1.0 },
            'RANGED': { fireRateMulti: 1.0, rangeMulti: 1.0, damageBonus: 0 },
            'INTERCEPTOR': { blockRadiusMulti: 1.0, cooldownMulti: 1.0, speedMulti: 1.0 },
            'DEBUFF': { actionRateMulti: 1.0, rangeMulti: 1.0 }
        };
    }

    init(game) {
        this.game = game;
    }

    _getMenuFonts() {
        const menu = this.game && this.game.getModule('menu');
        if (menu && menu.styleConfig && menu.styleConfig.fonts) {
            return menu.styleConfig.fonts;
        }

        return {
            cardUnavailable: 'bold 24px "VT323", monospace',
            cardIcon: '10px "VT323", monospace',
            cardName: 'bold 18px Orbitron, sans-serif',
            cardDescription: '12px "VT323", monospace',
            cardRequirement: 'italic bold 10px "VT323", monospace',
            cardFooter: 'bold 11px "VT323", monospace',
            button: 'bold 16px "VT323", monospace',
            infoTitle: 'bold 16px "VT323", monospace',
            infoText: '12px "VT323", monospace'
        };
    }

    reset() {
        this.inventory = {};
        this.isSelectionActive = false;
        this.currentOptions = [];
        this.selectionMode = 'UPGRADES';
        this.selectedCardId = null;
        this.confirmBtnBounds = null;
        this.reRollBtnBounds = null;
        this.pendingLevelUps = 0;
        this._gamepadActionHeld = false;
        this.droneMods = {
            'ALL': { damageBonus: 0, speedMulti: 1.0 },
            'RANGED': { fireRateMulti: 1.0, rangeMulti: 1.0, damageBonus: 0 },
            'INTERCEPTOR': { blockRadiusMulti: 1.0, cooldownMulti: 1.0, speedMulti: 1.0 },
            'DEBUFF': { actionRateMulti: 1.0, rangeMulti: 1.0 }
        };
        window.removeEventListener('mousedown', this._clickHandler);
    }

    update(deltaTime) {
        if (!this.isSelectionActive) return;

        const gamepad = this.game.getModule('gamepad');
        const proj = this.game.getModule('projectiles');
        const hasPad = gamepad && gamepad.gamepadIndex !== null && proj;
        if (!hasPad) return;

        const pointerX = proj.crosshairX ?? proj.mouseX;
        const pointerY = proj.crosshairY ?? proj.mouseY;

        let hoveredCardId = null;
        if (this.cardBounds) {
            for (const card of this.cardBounds) {
                if (pointerX >= card.x && pointerX <= card.x + card.w &&
                    pointerY >= card.y && pointerY <= card.y + card.h) {
                    hoveredCardId = card.id;
                    break;
                }
            }
        }

        const actionDown = gamepad.buttons.A || gamepad.buttons.X;
        const actionPressed = actionDown && !this._gamepadActionHeld;

        if (hoveredCardId) {
            this.selectedCardId = hoveredCardId;
            if (actionPressed) {
                this._executeSelection(hoveredCardId);
            }
            this._gamepadActionHeld = actionDown;
            return;
        }

        if (this.reRollBtnBounds && pointerX >= this.reRollBtnBounds.x && pointerX <= this.reRollBtnBounds.x + this.reRollBtnBounds.w &&
            pointerY >= this.reRollBtnBounds.y && pointerY <= this.reRollBtnBounds.y + this.reRollBtnBounds.h) {
            if (actionPressed) {
                const player = this.game.getModule('player');
                if (player) this._executeReroll(player);
            }
            this._gamepadActionHeld = actionDown;
            return;
        }

        if (this.confirmBtnBounds && pointerX >= this.confirmBtnBounds.x && pointerX <= this.confirmBtnBounds.x + this.confirmBtnBounds.w &&
            pointerY >= this.confirmBtnBounds.y && pointerY <= this.confirmBtnBounds.y + this.confirmBtnBounds.h) {
            if (actionPressed) {
                if (this.selectedCardId !== null || this.currentOptions.length === 0) {
                    this._executeSelection(this.selectedCardId);
                }
            }
            this._gamepadActionHeld = actionDown;
            return;
        }

        this._gamepadActionHeld = actionDown;
    }

    getAvailableUpgrades(count = 3) {
        const player = this.game.getModule('player');
        const luck = player ? player.getStat('luck') : 1.0;
        const unlockedHacks = getUnlockedHackIds();
        const hackCapacityFull = player ? unlockedHacks.length >= Math.max(1, Math.floor(player.getStat('maxHackSlots'))) : true;

        let pool = UPGRADES.filter(upgrade => {
            const currentCount = this.inventory[upgrade.id] || 0;
            if (upgrade.unique && currentCount > 0) return false;
            if (upgrade.maxStack && currentCount >= upgrade.maxStack) return false;
            if (upgrade.requirements && !upgrade.requirements(player, this)) return false;
            if (upgrade.unlockHackId) {
                if (unlockedHacks.includes(upgrade.unlockHackId)) return false;
                if (hackCapacityFull) return false;
            }
            return true;
        });

        const selected = [];
        for (let i = 0; i < count; i++) {
            if (pool.length === 0) break;

            let totalWeight = 0;
            pool.forEach(u => {
                let w = u.weight || 100;
                if (u.rarity === 'Rare') w *= luck;
                if (u.rarity === 'Epic') w *= (luck * 0.5);
                if (u.rarity === 'Legendary') w *= (luck * 0.1);
                totalWeight += w;
            });

            let random = Math.random() * totalWeight;
            for (let j = 0; j < pool.length; j++) {
                let w = pool[j].weight || 100;
                if (pool[j].rarity === 'Rare') w *= luck;
                if (pool[j].rarity === 'Epic') w *= (luck * 0.5);
                if (pool[j].rarity === 'Legendary') w *= (luck * 0.1);
                
                random -= w;
                if (random <= 0) {
                    selected.push(pool[j]);
                    pool.splice(j, 1);
                    break;
                }
            }
        }
        return selected;
    }

    getDroneSelectionPool(count = 3) {
        const droneMgr = this.game.getModule('drones');
        const player = this.game.getModule('player');
        if (!droneMgr || !player) return [];

        const ownedCount = droneMgr.drones.length;
        const maxDrones = player.stats.maxDrones;
        const activeDroneIds = droneMgr.drones.map(d => d.id);
        
        let availableDrones = Object.values(DRONE_TYPES)
            .filter(d => !activeDroneIds.includes(d.id));

        const activeBehaviors = [...new Set(droneMgr.drones.map(d => d.behavior))];
        let availableUpgrades = DRONE_UPGRADES.filter(upg => 
            upg.targetBehaviors.includes('ALL') || 
            upg.targetBehaviors.some(b => activeBehaviors.includes(b))
        );

        let selected = [];

        if (ownedCount === 0) {
            return availableDrones.sort(() => 0.5 - Math.random()).slice(0, count);
        }

        if (ownedCount >= maxDrones) {
            return availableUpgrades.sort(() => 0.5 - Math.random()).slice(0, count);
        }

        if (availableDrones.length > 0) {
            const shuffledDrones = availableDrones.sort(() => 0.5 - Math.random());
            selected.push(shuffledDrones[0]);
        }
        
        const remainingCount = count - selected.length;
        const shuffledUpgrades = availableUpgrades.sort(() => 0.5 - Math.random());
        selected.push(...shuffledUpgrades.slice(0, remainingCount));

        return selected.sort(() => 0.5 - Math.random());
    }

    applyUpgrade(upgradeId) {
        const player = this.game.getModule('player');
        const upgrade = UPGRADES.find(u => u.id === upgradeId);
        if (upgrade) {
            this.inventory[upgradeId] = (this.inventory[upgradeId] || 0) + 1;
            upgrade.onApply(player, this.game);
        }
    }

    applyDroneUpgrade(upgradeId) {
        const upgrade = DRONE_UPGRADES.find(u => u.id === upgradeId);
        if (upgrade) {
            upgrade.onApply(this.droneMods);
        }
    }

    addLevelUp() {
        this.pendingLevelUps++;
        if (!this.isSelectionActive) {
            this.showSelection('UPGRADES');
        }
    }

    showSelection(mode = 'UPGRADES') {
        const player = this.game.getModule('player');
        if (!player) return;

        if (mode === 'UPGRADES' && this.pendingLevelUps > 0) {
            this.pendingLevelUps--;
        }

        this.selectionMode = mode;
        this.selectedCardId = null;

        if (mode === 'UPGRADES') {
            const choiceCount = player.stats.upgradeOptions || 3;
            this.currentOptions = this.getAvailableUpgrades(choiceCount);
        } else {
            this.currentOptions = this.getDroneSelectionPool(3);
        }

        this.isSelectionActive = true;
        this.reRollBtnBounds = null;
        this.confirmBtnBounds = null;
        
        window.removeEventListener('mousedown', this._clickHandler);
        window.addEventListener('mousedown', this._clickHandler);
    }

    _handleInput(e) {
        if (!this.isSelectionActive) return;
        const rect = this.game.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (this._checkRerollClick(mouseX, mouseY)) return; 
        if (this._checkConfirmClick(mouseX, mouseY)) return;
        this._checkCardClick(mouseX, mouseY);
    }

    _closeSelection() {
        this.isSelectionActive = false;
        window.removeEventListener('mousedown', this._clickHandler);
    }

    _triggerNextPhaseIfNeeded() {
        const player = this.game.getModule('player');
        
        if (this.selectionMode === 'UPGRADES' && player && player.level % this.droneLevelInterval === 0) {
            setTimeout(() => this.showSelection('DRONES'), 150);
        } else if (this.pendingLevelUps > 0) {
            setTimeout(() => this.showSelection('UPGRADES'), 150);
        }
    }

    _checkRerollClick(x, y) {
        const player = this.game.getModule('player');
        if (!this.reRollBtnBounds || !player || player.stats.rerolls <= 0) return false;
        
        const b = this.reRollBtnBounds;
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            this._executeReroll(player);
            return true;
        }
        return false;
    }

    _checkConfirmClick(x, y) {
        if (!this.confirmBtnBounds) return false;

        const b = this.confirmBtnBounds;
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            if (this.selectedCardId !== null || this.currentOptions.length === 0) {
                this._executeSelection(this.selectedCardId);
                return true;
            }
        }
        return false;
    }

    _checkCardClick(x, y) {
        for (const card of this.cardBounds) {
            if (x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h) {
                if (this.selectedCardId === card.id) {
                    this._executeSelection(card.id);
                } else {
                    this.selectedCardId = card.id;
                }
                return true;
            }
        }
        return false;
    }

    _executeReroll(player) {
        player.stats.rerolls--;
        
        if (this.selectionMode === 'UPGRADES') {
            const choiceCount = player.stats.upgradeOptions || 3;
            this.currentOptions = this.getAvailableUpgrades(choiceCount);
        } else {
            this.currentOptions = this.getDroneSelectionPool(3);
        }
        
        this.selectedCardId = null;
    }

    _executeSelection(selectedId) {
        const droneMgr = this.game.getModule('drones');
        const player = this.game.getModule('player');

        if (selectedId) {
            if (this.selectionMode === 'UPGRADES') {
                this.applyUpgrade(selectedId);
            } else {
                const isDrone = DRONE_TYPES[selectedId] !== undefined;
                
                if (isDrone) {
                    if (droneMgr && droneMgr.drones.length < player.stats.maxDrones) {
                        droneMgr.spawnDrone(selectedId);
                    }
                } else {
                    this.applyDroneUpgrade(selectedId);
                }
            }
        }
        
        this._closeSelection();
        this._triggerNextPhaseIfNeeded();
    }

    draw(ctx) {
        if (!this.isSelectionActive) return;
        const { width, height } = this.game.canvas;
        const player = this.game.getModule('player');
        const menu = this.game.getModule('menu');
        const overlayFill = menu?.styleConfig?.panel?.overlay?.fill || 'rgba(0, 0, 0, 0.70)';
        ctx.fillStyle = overlayFill;
        ctx.fillRect(0, 0, width, height);

        const infoX = 40;
        const infoY = height / 2 - 150;
        if (player) {
            const infoboxBottomY = this._drawStatsInfobox(ctx, infoX, infoY, player);
            if (player.stats.rerolls > 0) {
                this._drawRerollButton(ctx, player, infoX, infoboxBottomY + 20);
            }
        }
        const bottomY = this._drawCards(ctx, width, height);
        this._drawConfirmButton(ctx, width, bottomY);
    }

    _drawCards(ctx, width, height) {
        const fonts = this._getMenuFonts();
        if (this.currentOptions.length === 0) {
            ctx.save();
            ctx.fillStyle = '#ffcc00'; 
            ctx.font = fonts.cardUnavailable; 
            ctx.textAlign = 'center';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffcc00';
            ctx.fillText("NO UPGRADES AVAILABLE", width / 2, height / 2);
            ctx.restore();
            return height / 2 + 40; 
        }

        const cardW = 220; const cardH = 320; const spacing = 40; const maxPerRow = 3;
        this.cardBounds = [];
        const rows = [];
        for (let i = 0; i < this.currentOptions.length; i += maxPerRow) {
            rows.push(this.currentOptions.slice(i, i + maxPerRow));
        }
        const totalH = (rows.length * cardH) + (spacing * Math.max(0, rows.length - 1));
        const startY = (height - totalH) / 2;
        rows.forEach((rowOptions, rowIndex) => {
            const rowY = startY + rowIndex * (cardH + spacing);
            const rowTotalW = (cardW * rowOptions.length) + (spacing * Math.max(0, rowOptions.length - 1));
            const startX = (width - rowTotalW) / 2;
            rowOptions.forEach((upgrade, colIndex) => {
                const x = startX + colIndex * (cardW + spacing);
                const y = rowY;
                this.cardBounds.push({ x, y, w: cardW, h: cardH, id: upgrade.id });
                const isSelected = (this.selectedCardId === upgrade.id);
                this._drawSingleCard(ctx, upgrade, x, y, cardW, cardH, isSelected);
            });
        });
        return startY + totalH;
    }

    _drawSingleCard(ctx, item, x, y, cardW, cardH, isSelected) {
        let mainColor = '#ffffff';
        
        if (item.rarity) {
            mainColor = this._getRarityColor(item.rarity);
        } else if (item.behavior) {
            mainColor = item.color || '#ffffff';
        } else if (item.targetBehaviors) {
            mainColor = '#ff55ff'; 
        }

        const borderColor = isSelected ? '#ffffff' : mainColor;
        
        ctx.save();
        this._drawCardFrame(ctx, x, y, cardW, cardH, isSelected, borderColor);
        this._drawCardIcon(ctx, item, x, y, cardW);
        this._drawCardText(ctx, item, x, y, cardW);
        this._drawCardFooter(ctx, item, x, y, cardW, cardH, mainColor); 
        ctx.restore();
    }

    _drawCardFrame(ctx, x, y, w, h, isSelected, borderColor) {
        ctx.shadowBlur = isSelected ? 30 : 20;
        ctx.shadowColor = borderColor;
        ctx.fillStyle = isSelected ? '#151515' : '#050505';
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isSelected ? 5 : 3;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
    }

    _drawCardIcon(ctx, item, x, y, cardW) {
        const size = 60; const px = x + (cardW - size) / 2; const py = y + 40;
        ctx.fillStyle = '#111';
        ctx.fillRect(px, py, size, size);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(px, py, size, size);
        if (!item.sprite) {
            const fonts = this._getMenuFonts();
            ctx.fillStyle = '#333'; ctx.font = fonts.cardIcon; ctx.textAlign = 'center';
            ctx.fillText('NO_DATA', x + cardW / 2, py + size / 2 + 4);
        }
    }

    _drawCardText(ctx, item, x, y, cardW) {
        const fonts = this._getMenuFonts();
        ctx.fillStyle = '#fff'; ctx.font = fonts.cardTitle || fonts.cardName; ctx.textAlign = 'center';
        ctx.fillText(item.name.toUpperCase(), x + cardW / 2, y + 140);
        ctx.font = fonts.cardDescription; ctx.fillStyle = '#aaa';
        this._wrapText(ctx, item.description, x + 20, y + 180, cardW - 40, 16);
    }

    _drawCardFooter(ctx, item, x, y, cardW, cardH, mainColor) {
        const fonts = this._getMenuFonts();
        if (item.requirementText) {
            ctx.save(); ctx.font = fonts.cardRequirement; ctx.fillStyle = '#ffcc00'; ctx.textAlign = 'center';
            ctx.shadowBlur = 5; ctx.shadowColor = '#ffcc00';
            ctx.fillText(item.requirementText.toUpperCase(), x + cardW / 2, y + cardH - 45);
            ctx.restore();
        }
        
        ctx.save(); 
        ctx.fillStyle = mainColor; 
        ctx.font = fonts.cardFooter; 
        ctx.textAlign = 'center';
        ctx.shadowBlur = 8; 
        ctx.shadowColor = mainColor;
        
        let label = 'SYSTEM MODULE';
        if (item.rarity) {
            label = item.rarity.toUpperCase();
        } else if (item.behavior) {
            label = `TYPE: ${item.behavior.toUpperCase()}`;
        } else if (item.targetBehaviors) {
            label = `TYPE: ${item.targetBehaviors.join(' & ').toUpperCase()}`;
        }

        ctx.fillText(label, x + cardW / 2, y + cardH - 20);
        ctx.restore();
    }

    _drawRerollButton(ctx, player, x, y) {
        const btnW = 220; const btnH = 50; const btnX = x - 10; const btnY = y; 
        this.reRollBtnBounds = { x: btnX, y: btnY, w: btnW, h: btnH };
        const fonts = this._getMenuFonts();
        ctx.save(); ctx.fillStyle = '#050505'; ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2;
        ctx.shadowBlur = 15; ctx.shadowColor = '#ffcc00';
        ctx.fillRect(btnX, btnY, btnW, btnH); ctx.strokeRect(btnX, btnY, btnW, btnH);
        ctx.fillStyle = '#fff'; ctx.font = fonts.button; ctx.textAlign = 'center';
        ctx.fillText(`RE-ROLL (${player.stats.rerolls})`, btnX + btnW / 2, btnY + 32); ctx.restore();
    }

    _drawConfirmButton(ctx, width, bottomY) {
        const btnW = 220; const btnH = 50; const btnX = (width - btnW) / 2; const btnY = bottomY + 40; 
        this.confirmBtnBounds = { x: btnX, y: btnY, w: btnW, h: btnH };
        const isActive = this.selectedCardId !== null || this.currentOptions.length === 0;
        
        ctx.save();
        ctx.fillStyle = isActive ? '#050505' : '#111';
        ctx.strokeStyle = isActive ? '#00ffcc' : '#333';
        ctx.lineWidth = 2;
        if (isActive) { ctx.shadowBlur = 15; ctx.shadowColor = '#00ffcc'; }
        ctx.fillRect(btnX, btnY, btnW, btnH); ctx.strokeRect(btnX, btnY, btnW, btnH);
        const fonts = this._getMenuFonts();
        ctx.fillStyle = isActive ? '#fff' : '#666'; ctx.font = fonts.button; ctx.textAlign = 'center';
        ctx.fillText("CONFIRM", btnX + btnW / 2, btnY + 32); ctx.restore();
    }

    _drawStatsInfobox(ctx, x, y, player) {
        const rowH = 22; const panelW = 220;
        const displayStats = getFormattedStats(player);
        const panelH = displayStats.length * rowH + 50;
        const fonts = this._getMenuFonts();
        ctx.save(); ctx.fillStyle = 'rgba(0, 40, 40, 0.4)'; ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 2;
        ctx.strokeRect(x - 10, y - 40, panelW, panelH); ctx.fillRect(x - 10, y - 40, panelW, panelH);
        ctx.fillStyle = '#00ffcc'; ctx.font = fonts.infoTitle; ctx.textAlign = 'left';
        ctx.fillText("STATUS", x, y - 15); ctx.font = fonts.infoText;
        displayStats.forEach((s, i) => {
            const curY = y + (i * rowH);
            ctx.fillStyle = '#00ffcc'; ctx.fillText(s.label, x, curY);
            ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
            ctx.fillText(s.val, x + panelW - 30, curY); ctx.textAlign = 'left';
        });
        ctx.restore();
        return y - 40 + panelH;
    }

    _getRarityColor(rarity) {
        switch(rarity) {
            case 'Common': return '#00ffcc';
            case 'Rare': return '#00bcff';
            case 'Epic': return '#bc00ff';
            case 'Legendary': return '#ffcc00';
            default: return '#ffffff';
        }
    }

    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        for(let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x + maxWidth/2, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else { line = testLine; }
        }
        ctx.fillText(line, x + maxWidth/2, y);
    }
}