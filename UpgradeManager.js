import { UPGRADES } from './UpgradeData.js';
import { getFormattedStats } from './Infobox.js';
import { DRONE_TYPES } from './DroneTypes.js';
import { DRONE_UPGRADES } from './DroneUpgradeData.js';

export default class UpgradeManager {
    constructor() {
        this.inventory = {};
        this.isSelectionActive = false;
        this.currentOptions = [];
        this.selectionMode = 'UPGRADES';
        this.selectedCardId = null; 
        this.confirmBtnBounds = null;
        this.droneLevelInterval = 3;
    }

    init(game) {
        this.game = game;
    }

    getAvailableUpgrades(count = 3) {
        const player = this.game.getModule('player');
        const luck = player ? player.getStat('luck') : 1.0;

        let pool = UPGRADES.filter(upgrade => {
            const currentCount = this.inventory[upgrade.id] || 0;
            if (upgrade.unique && currentCount > 0) return false;
            if (upgrade.maxStack && currentCount >= upgrade.maxStack) return false;
            if (upgrade.requirements && !upgrade.requirements(player, this)) return false;
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

    getAvailableDrones(count = 3) {
        const droneMgr = this.game.getModule('drones');
        if (!droneMgr) return [];

        const activeDroneIds = droneMgr.drones.map(d => d.id);
        
        let poolDrones = Object.values(DRONE_TYPES).filter(d => !activeDroneIds.includes(d.id));
        
        return poolDrones.sort(() => 0.5 - Math.random()).slice(0, count);
    }

    applyUpgrade(upgradeId) {
        const player = this.game.getModule('player');
        const upgrade = UPGRADES.find(u => u.id === upgradeId);
        if (upgrade) {
            this.inventory[upgradeId] = (this.inventory[upgradeId] || 0) + 1;
            upgrade.onApply(player);
        }
    }

    showSelection(mode = 'UPGRADES') {
        const player = this.game.getModule('player');
        if (!player) return;

        this.selectionMode = mode;
        this.selectedCardId = null;

        if (mode === 'UPGRADES') {
            const choiceCount = player.stats.upgradeOptions || 3;
            this.currentOptions = this.getAvailableUpgrades(choiceCount);
        } else {
            this.currentOptions = this.getAvailableDrones(3);
        }

        if (this.currentOptions.length === 0) {
            this.isSelectionActive = false;
            return;
        }

        this.isSelectionActive = true;
        this.reRollBtnBounds = null;
        this.confirmBtnBounds = null;
        
        this._clickHandler = (e) => this._handleInput(e);
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
        }
    }

    _checkRerollClick(x, y) {
        const player = this.game.getModule('player');
        if (this.selectionMode !== 'UPGRADES' || !this.reRollBtnBounds || !player || player.stats.rerolls <= 0) return false;
        const b = this.reRollBtnBounds;
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            this._executeReroll(player);
            return true;
        }
        return false;
    }

    _checkConfirmClick(x, y) {
        if (!this.confirmBtnBounds || !this.selectedCardId) return false;
        const b = this.confirmBtnBounds;
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            this._executeSelection(this.selectedCardId);
            return true;
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
        const choiceCount = player.stats.upgradeOptions || 3;
        this.currentOptions = this.getAvailableUpgrades(choiceCount);
        this.selectedCardId = null;
    }

    _executeSelection(selectedId) {
        const droneMgr = this.game.getModule('drones');

        if (this.selectionMode === 'UPGRADES') {
            this.applyUpgrade(selectedId);
        } else {
            if (droneMgr) droneMgr.spawnDrone(selectedId);
        }
        
        this._closeSelection();
        this._triggerNextPhaseIfNeeded();
    }

    draw(ctx) {
        if (!this.isSelectionActive) return;
        const { width, height } = this.game.canvas;
        const player = this.game.getModule('player');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, width, height);

        const infoX = 40;
        const infoY = height / 2 - 150;
        if (player) {
            this._drawStatsInfobox(ctx, infoX, infoY, player);
            if (player.stats.rerolls > 0 && this.selectionMode === 'UPGRADES') {
                this._drawRerollButton(ctx, player, infoX, infoY + 380);
            }
        }
        const bottomY = this._drawCards(ctx, width, height);
        this._drawConfirmButton(ctx, width, bottomY);
    }

    _drawCards(ctx, width, height) {
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
        const isDrone = !item.rarity;
        const mainColor = isDrone ? item.color : this._getRarityColor(item.rarity);
        const borderColor = isSelected ? '#ffffff' : mainColor;
        ctx.save();
        this._drawCardFrame(ctx, x, y, cardW, cardH, isSelected, borderColor);
        this._drawCardIcon(ctx, item, x, y, cardW);
        this._drawCardText(ctx, item, x, y, cardW);
        this._drawCardFooter(ctx, item, x, y, cardW, cardH, mainColor, isDrone);
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
            ctx.fillStyle = '#333'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
            ctx.fillText('NO_DATA', x + cardW / 2, py + size / 2 + 4);
        }
    }

    _drawCardText(ctx, item, x, y, cardW) {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Orbitron, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(item.name.toUpperCase(), x + cardW / 2, y + 140);
        ctx.font = '12px monospace'; ctx.fillStyle = '#aaa';
        this._wrapText(ctx, item.description, x + 20, y + 180, cardW - 40, 16);
    }

    _drawCardFooter(ctx, item, x, y, cardW, cardH, mainColor, isDrone) {
        if (item.requirementText) {
            ctx.save(); ctx.font = 'italic bold 10px monospace'; ctx.fillStyle = '#ffcc00'; ctx.textAlign = 'center';
            ctx.shadowBlur = 5; ctx.shadowColor = '#ffcc00';
            ctx.fillText(item.requirementText.toUpperCase(), x + cardW / 2, y + cardH - 45);
            ctx.restore();
        }
        ctx.save(); ctx.fillStyle = mainColor; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
        ctx.shadowBlur = 8; ctx.shadowColor = mainColor;
        const label = isDrone ? `TYPE: ${item.behavior.toUpperCase()}` : item.rarity.toUpperCase();
        ctx.fillText(label, x + cardW / 2, y + cardH - 20);
        ctx.restore();
    }

    _drawRerollButton(ctx, player, x, y) {
        const btnW = 220; const btnH = 50; const btnX = x - 10; const btnY = y; 
        this.reRollBtnBounds = { x: btnX, y: btnY, w: btnW, h: btnH };
        ctx.save(); ctx.fillStyle = '#050505'; ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2;
        ctx.shadowBlur = 15; ctx.shadowColor = '#ffcc00';
        ctx.fillRect(btnX, btnY, btnW, btnH); ctx.strokeRect(btnX, btnY, btnW, btnH);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`RE-ROLL (${player.stats.rerolls})`, btnX + btnW / 2, btnY + 32); ctx.restore();
    }

    _drawConfirmButton(ctx, width, bottomY) {
        const btnW = 220; const btnH = 50; const btnX = (width - btnW) / 2; const btnY = bottomY + 40; 
        this.confirmBtnBounds = { x: btnX, y: btnY, w: btnW, h: btnH };
        const isActive = this.selectedCardId !== null;
        ctx.save();
        ctx.fillStyle = isActive ? '#050505' : '#111';
        ctx.strokeStyle = isActive ? '#00ffcc' : '#333';
        ctx.lineWidth = 2;
        if (isActive) { ctx.shadowBlur = 15; ctx.shadowColor = '#00ffcc'; }
        ctx.fillRect(btnX, btnY, btnW, btnH); ctx.strokeRect(btnX, btnY, btnW, btnH);
        ctx.fillStyle = isActive ? '#fff' : '#666'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
        ctx.fillText("CONFIRM", btnX + btnW / 2, btnY + 32); ctx.restore();
    }

    _drawStatsInfobox(ctx, x, y, player) {
        const rowH = 22; const panelW = 220; const panelH = 400;
        ctx.save(); ctx.fillStyle = 'rgba(0, 40, 40, 0.4)'; ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 2;
        ctx.strokeRect(x - 10, y - 40, panelW, panelH); ctx.fillRect(x - 10, y - 40, panelW, panelH);
        ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'left';
        ctx.fillText("STATUS", x, y - 15); ctx.font = '12px monospace';
        const displayStats = getFormattedStats(player);
        displayStats.forEach((s, i) => {
            const curY = y + (i * rowH);
            ctx.fillStyle = '#00ffcc'; ctx.fillText(s.label, x, curY);
            ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
            ctx.fillText(s.val, x + panelW - 30, curY); ctx.textAlign = 'left';
        });
        ctx.restore();
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