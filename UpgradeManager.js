import { UPGRADES } from './UpgradeData.js';

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
            if (upgrade.requirements && !upgrade.requirements(player)) return false;
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
        this.currentOptions = this.getAvailableUpgrades(3);
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

        if (this.reRollBtnBounds && player && player.stats.reRollCount > 0) {
            const b = this.reRollBtnBounds;
            if (mouseX >= b.x && mouseX <= b.x + b.w && 
                mouseY >= b.y && mouseY <= b.y + b.h) {
                
                player.stats.reRollCount--;
                this.currentOptions = this.getAvailableUpgrades(3);
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

        const cardW = 220;
        const cardH = 320;
        const spacing = 40;
        const totalW = (cardW * 3) + (spacing * 2);
        let startX = (width - totalW) / 2;
        const startY = (height - cardH) / 2;

        this.cardBounds = [];

        this.currentOptions.forEach((upgrade, i) => {
            const x = startX + i * (cardW + spacing);
            const y = startY;

            this.cardBounds.push({ x, y, w: cardW, h: cardH, id: upgrade.id });

            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = this._getRarityColor(upgrade.rarity);
            ctx.fillStyle = '#050505';
            ctx.strokeStyle = this._getRarityColor(upgrade.rarity);
            ctx.lineWidth = 3;
            
            ctx.fillRect(x, y, cardW, cardH);
            ctx.strokeRect(x, y, cardW, cardH);

            const spriteSize = 60;
            ctx.fillStyle = '#111';
            ctx.fillRect(x + (cardW - spriteSize) / 2, y + 40, spriteSize, spriteSize);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(x + (cardW - spriteSize) / 2, y + 40, spriteSize, spriteSize);
            
            if (upgrade.sprite) {
            } else {
                ctx.fillStyle = '#333';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('NO_DATA', x + cardW/2, y + 40 + spriteSize/2 + 4);
            }

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(upgrade.name.toUpperCase(), x + cardW/2, y + 140);

            ctx.font = '12px monospace';
            ctx.fillStyle = '#aaa';
            this._wrapText(ctx, upgrade.description, x + 20, y + 180, cardW - 40, 16);

            ctx.fillStyle = this._getRarityColor(upgrade.rarity);
            ctx.font = '10px monospace';
            ctx.fillText(upgrade.rarity, x + cardW/2, y + cardH - 20);

            ctx.restore();
        });
        if (player && player.stats.reRollCount > 0) {
            const btnW = 220;
            const btnH = 50;
            const btnX = (width - btnW) / 2;
            const btnY = startY + cardH + 40;

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
            ctx.fillText(`RE-ROLL (${player.stats.reRollCount})`, btnX + btnW/2, btnY + 32);
            ctx.restore();
        }
    }

    _drawStatsInfobox(ctx, x, y, player) {
        const stats = player.stats;
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
        ctx.fillStyle = '#aaa';
        
        const displayStats = [
            { label: "MAX HP", val: stats.maxHp },
            { label: "DEFENSE", val: stats.defense },
            { label: "DODGE CHANCE", val: (stats.dodgeChance * 100).toFixed(0) + "%" },
            { label: "DAMAGE", val: stats.damage },
            { label: "FIRE RATE", val: (1000 / stats.fireRate).toFixed(2) + "/s" },
            { label: "PROJ. SPEED", val: stats.bulletSpeed.toFixed(1) },
            { label: "PROJ. SIZE", val: (stats.projectileSize * 100).toFixed(0) + "%" },
            { label: "PROJ. COUNT", val: stats.projectileCount },
            { label: "PENETRATION", val: stats.penetration },
            { label: "RICOCHET(bullet bounce)", val: stats.ricochetCount },
            { label: "CRIT CHANCE", val: (stats.critChance * 100).toFixed(0) + "%" },
            { label: "CRIT MULTI", val: stats.critMultiplier.toFixed(1) + "x" },
            { label: "MOVE SPEED", val: stats.moveSpeed.toFixed(2) },
            { label: "MAGNET", val: stats.magnetRange },
            { label: "LUCK", val: stats.luck.toFixed(2) },
            { label: "XP GAIN", val: (stats.xpMultiplier * 100).toFixed(0) + "%" }
        ];

        displayStats.forEach((s, i) => {
            const curY = y + (i * rowH) + 10;
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