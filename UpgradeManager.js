// UpgradeManager.js
import { UPGRADES } from './UpgradeData.js';

export default class UpgradeManager {
    constructor() {
        this.inventory = {}; // Formát: { 'rapid_fire': 3, 'multishot': 1 }
        this.isSelectionActive = false;
        this.currentOptions = [];
    }

    init(game) {
        this.game = game;
    }

    // Hlavní funkce pro výběr karet k zobrazení
    getAvailableUpgrades(count = 3) {
        const player = this.game.getModule('player');
        
        // 1. Filtrování podle podmínek (requirements, maxStack, unique)
        let pool = UPGRADES.filter(upgrade => {
            // Kontrola stackování
            const currentCount = this.inventory[upgrade.id] || 0;
            if (upgrade.unique && currentCount > 0) return false;
            if (upgrade.maxStack && currentCount >= upgrade.maxStack) return false;

            // Kontrola prerekvizit (pokud existují)
            if (upgrade.requirements && !upgrade.requirements(player)) return false;

            return true;
        });

        // 2. Výběr náhodných karet (pro teď jednoduchý random, později zapojíme Luck a Weight)
        const selected = [];
        const poolCopy = [...pool];

        for (let i = 0; i < count; i++) {
            if (poolCopy.length === 0) break;
            const index = Math.floor(Math.random() * poolCopy.length);
            selected.push(poolCopy.splice(index, 1)[0]);
        }

        return selected;
    }

    // Aplikace vybrané karty
    applyUpgrade(upgradeId) {
        const player = this.game.getModule('player');
        const upgrade = UPGRADES.find(u => u.id === upgradeId);

        if (upgrade) {
            // Logika zápisu do inventáře
            this.inventory[upgradeId] = (this.inventory[upgradeId] || 0) + 1;
            
            // Samotná změna statů
            upgrade.onApply(player);
            
            console.log(`Applied upgrade: ${upgrade.name}. Current stack: ${this.inventory[upgradeId]}`);
        }
    }

    showSelection() {
        this.currentOptions = this.getAvailableUpgrades(3);
        this.isSelectionActive = true;
        
        // Přidáme listener na kliknutí (jednorázově při zobrazení)
        this._clickHandler = (e) => this._handleInput(e);
        window.addEventListener('mousedown', this._clickHandler);
    }

    _handleInput(e) {
        if (!this.isSelectionActive) return;

        // Přepočet souřadnic myši na canvas
        const rect = this.game.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Kontrola, zda jsme klikli na kartu
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
        // Tady případně obnovíme běh hry, pokud ji budeme pauzovat
    }

    draw(ctx) {
        if (!this.isSelectionActive) return;

        const { width, height } = this.game.canvas;

        // 1. Ztmavení pozadí (Overlay)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);

        // 2. Vykreslení karet
        const cardW = 220;
        const cardH = 320;
        const spacing = 40;
        const totalW = (cardW * 3) + (spacing * 2);
        let startX = (width - totalW) / 2;
        const startY = (height - cardH) / 2;

        this.cardBounds = []; // Uložíme si pozice pro detekci kliknutí

        this.currentOptions.forEach((upgrade, i) => {
            const x = startX + i * (cardW + spacing);
            const y = startY;

            // Uložíme hitboxy
            this.cardBounds.push({ x, y, w: cardW, h: cardH, id: upgrade.id });

            // Tělo karty
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = this._getRarityColor(upgrade.rarity);
            ctx.fillStyle = '#050505';
            ctx.strokeStyle = this._getRarityColor(upgrade.rarity);
            ctx.lineWidth = 3;
            
            // Zaoblený obdélník (zjednodušeně)
            ctx.fillRect(x, y, cardW, cardH);
            ctx.strokeRect(x, y, cardW, cardH);

            // Placeholder pro SPRITE (kostička)
            const spriteSize = 60;
            ctx.fillStyle = '#111';
            ctx.fillRect(x + (cardW - spriteSize) / 2, y + 40, spriteSize, spriteSize);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(x + (cardW - spriteSize) / 2, y + 40, spriteSize, spriteSize);
            
            if (upgrade.sprite) {
                // Tady by byla logika pro ctx.drawImage, pokud sprite existuje
            } else {
                // Text "NO DATA" do kostičky
                ctx.fillStyle = '#333';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('NO_IMG', x + cardW/2, y + 40 + spriteSize/2 + 4);
            }

            // Texty
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px Orbitron, sans-serif'; // Nebo monospace
            ctx.textAlign = 'center';
            ctx.fillText(upgrade.name.toUpperCase(), x + cardW/2, y + 140);

            ctx.font = '12px monospace';
            ctx.fillStyle = '#aaa';
            this._wrapText(ctx, upgrade.description, x + 20, y + 180, cardW - 40, 16);

            // Rarity Label
            ctx.fillStyle = this._getRarityColor(upgrade.rarity);
            ctx.font = '10px monospace';
            ctx.fillText(upgrade.rarity, x + cardW/2, y + cardH - 20);

            ctx.restore();
        });
    }

    // Pomocná pro barvy rarit
    _getRarityColor(rarity) {
        switch(rarity) {
            case 'Common': return '#00ffcc';
            case 'Rare': return '#00bcff';
            case 'Epic': return '#bc00ff';
            case 'Legendary': return '#ffcc00';
            default: return '#ffffff';
        }
    }

    // Pomocná pro zalomení textu na kartě
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