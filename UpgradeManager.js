import { UPGRADES } from './UpgradeData.js';
import { getFormattedStats } from './Infobox.js';

export default class UpgradeManager {
    constructor() {
        this.inventory = {};
        this.isSelectionActive = false;
        this.currentOptions = [];
    }

    init(game) {
        this.game = game;
    }

    getAvailableUpgrades(count = 3) {
        const player = this.game.getModule('player');
        const luck = player.stats.luck || 1.0;

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
            const weightedPool = pool.map(upgrade => {
                let weight = upgrade.weight || 100;

                if (upgrade.rarity === 'Rare') weight *= luck;
                if (upgrade.rarity === 'Epic') weight *= (luck * 1.5);
                if (upgrade.rarity === 'Legendary') weight *= (luck * 2.5);

                totalWeight += weight;
                return { upgrade, weight };
            });

            let random = Math.random() * totalWeight;
            for (let j = 0; j < weightedPool.length; j++) {
                random -= weightedPool[j].weight;
                if (random <= 0) {
                    const picked = weightedPool[j].upgrade;
                    selected.push(picked);
                    pool = pool.filter(u => u.id !== picked.id);
                    break;
                }
            }
        }

        return selected;
    }

    applyUpgrade(upgradeId) {
        const player = this.game.getModule('player');
        const upgrade = UPGRADES.find(u => u.id === upgradeId);

        if (upgrade) {
            this.inventory[upgradeId] = (this.inventory[upgradeId] || 0) + 1;
            
            upgrade.onApply(player);
            
            console.log(`Applied upgrade: ${upgrade.name}. Current stack: ${this.inventory[upgradeId]}`);
        }
    }

    showSelection() {
        const player = this.game.getModule('player');
        
        const choiceCount = player ? player.stats.upgradeOptions : 3;

        this.currentOptions = this.getAvailableUpgrades(choiceCount);
        this.isSelectionActive = true;
        this.reRollBtnBounds = null;
        
        this._clickHandler = (e) => this._handleInput(e);
        window.addEventListener('mousedown', this._clickHandler);
    }

    _handleInput(e) {
        if (!this.isSelectionActive) return;

        const rect = this.game.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const player = this.game.getModule('player');

        if (this.reRollBtnBounds && player && player.stats.rerolls > 0) {
            const b = this.reRollBtnBounds;
            if (mouseX >= b.x && mouseX <= b.x + b.w && 
                mouseY >= b.y && mouseY <= b.y + b.h) {
                
                player.stats.rerolls--;
                const choiceCount = player.stats.upgradeOptions || 3;
                this.currentOptions = this.getAvailableUpgrades(choiceCount);
                return;
            }
        }

        for (const card of this.cardBounds) {
            if (mouseX >= card.x && mouseX <= card.x + card.w &&
                mouseY >= card.y && mouseY <= card.y + card.h) {
                
                this.applyUpgrade(card.id);
                this._closeSelection();
                break;
            }
        }
    }

    _closeSelection() {
        this.isSelectionActive = false;
        window.removeEventListener('mousedown', this._clickHandler);
    }

    draw(ctx) {
        if (!this.isSelectionActive) return;
        
        const { width, height } = this.game.canvas;
        const player = this.game.getModule('player');

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, width, height);

        if (player) {
            this._drawStatsInfobox(ctx, 40, height / 2 - 150, player);
        }

        const bottomY = this._drawCards(ctx, width, height);

        if (player && player.stats.rerolls > 0) {
            this._drawRerollButton(ctx, player, width, bottomY);
        }
    }

    _drawCards(ctx, width, height) {
        const cardW = 220;
        const cardH = 320;
        const spacing = 40;
        const maxPerRow = 3;

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
                
                this._drawSingleCard(ctx, upgrade, x, y, cardW, cardH);
            });
        });

        return startY + totalH; 
    }

    _drawSingleCard(ctx, upgrade, x, y, cardW, cardH) {
        ctx.save();
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = this._getRarityColor(upgrade.rarity);
        ctx.fillStyle = '#050505';
        ctx.strokeStyle = this._getRarityColor(upgrade.rarity);
        ctx.lineWidth = 3;
        
        ctx.fillRect(x, y, cardW, cardH);
        ctx.strokeRect(x, y, cardW, cardH);

        const spriteSize = 60;
        const spriteX = x + (cardW - spriteSize) / 2;
        const spriteY = y + 40;

        ctx.fillStyle = '#111';
        ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(spriteX, spriteY, spriteSize, spriteSize);
        
        if (!upgrade.sprite) {
            ctx.fillStyle = '#333';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('NO_DATA', x + cardW / 2, spriteY + spriteSize / 2 + 4);
        }

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(upgrade.name.toUpperCase(), x + cardW / 2, y + 140);

        ctx.font = '12px monospace';
        ctx.fillStyle = '#aaa';
        this._wrapText(ctx, upgrade.description, x + 20, y + 180, cardW - 40, 16);

        if (upgrade.requirementText) {
            ctx.save();
            ctx.font = 'italic bold 10px monospace';
            ctx.fillStyle = '#ffcc00';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ffcc00';
            ctx.fillText(upgrade.requirementText.toUpperCase(), x + cardW / 2, y + cardH - 45);
            ctx.restore();
        }

        ctx.fillStyle = this._getRarityColor(upgrade.rarity);
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(upgrade.rarity, x + cardW / 2, y + cardH - 20);

        ctx.restore();
        }


    _drawRerollButton(ctx, player, width, bottomY) {
        const btnW = 220;
        const btnH = 50;
        const btnX = (width - btnW) / 2;
        
        const btnY = bottomY + 40; 

        this.reRollBtnBounds = { x: btnX, y: btnY, w: btnW, h: btnH };

        ctx.save();
        ctx.fillStyle = '#050505';
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffcc00';
        
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`RE-ROLL (${player.stats.rerolls})`, btnX + btnW / 2, btnY + 32);
        ctx.restore();
    }

    _drawStatsInfobox(ctx, x, y, player) {
        const rowH = 22;
        const panelW = 220;
        const panelH = 400;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 40, 40, 0.4)';
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 10, y - 40, panelW, panelH);
        ctx.fillRect(x - 10, y - 40, panelW, panelH);

        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText("STATUS", x, y - 15);
        
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