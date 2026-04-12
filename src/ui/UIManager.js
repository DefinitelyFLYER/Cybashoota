export default class UIManager {
    constructor() {
        this.score = 0;
        this.highScore = localStorage.getItem('cyberpunk_highscore') || 0;
        this.notifications = [];
    }

    init(game) {
        this.game = game;
    }

    addScore(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('cyberpunk_highscore', this.highScore);
        }
    }

    showNotification(text, color) {
        this.notifications.push({
            text: text.toUpperCase(),
            color: color,
            alpha: 1,
            y: 0
        });
    }

    _drawActiveBuffs(ctx) {
        const powerUpMgr = this.game.getModule('powerups');
        if (!powerUpMgr || powerUpMgr.activeEffects.length === 0) return;

        const iconSize = 32;
        const spacing = 12;
        const startX = 20;
        let startY = 120;

        powerUpMgr.activeEffects.forEach((effect, i) => {
            const rowY = startY + i * (iconSize + spacing);
            const rowX = startX;

            ctx.save();
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = effect.color;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 10;
            ctx.shadowColor = effect.color;
            
            ctx.strokeRect(rowX, rowY, iconSize, iconSize);
            ctx.fillRect(rowX, rowY, iconSize, iconSize);

            const img = powerUpMgr.sprites.get(effect.id);
            if (img && img.isReady) {
                ctx.drawImage(img, rowX + 2, rowY + 2, iconSize - 4, iconSize - 4);
            }

            ctx.shadowBlur = 0;

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(effect.name.toUpperCase(), rowX + iconSize + 10, rowY + 12);

            const barW = 80;
            const barH = 4;
            const progress = effect.remaining / effect.duration;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(rowX + iconSize + 10, rowY + 20, barW, barH);
            
            ctx.fillStyle = effect.color;
            ctx.fillRect(rowX + iconSize + 10, rowY + 20, barW * progress, barH);

            ctx.restore();
        });
    }

    _drawNotifications(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const n = this.notifications[i];
            
            ctx.save();
            ctx.globalAlpha = n.alpha;
            ctx.fillStyle = n.color;
            ctx.font = 'bold 24px "Courier New"';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 15;
            ctx.shadowColor = n.color;
            
            ctx.fillText(n.text, w / 2, h / 3 - n.y);
            ctx.restore();

            n.y += 1;
            n.alpha -= 0.005;
            if (n.alpha <= 0) this.notifications.splice(i, 1);
        }
    }

    _drawXpBar(ctx) {
        const player = this.game.getModule('player');
        if (!player) return;

        const w = this.game.canvas.width;
        const barHeight = 6;
        
        ctx.fillStyle = 'rgba(0, 20, 20, 0.8)';
        ctx.fillRect(0, 0, w, barHeight);

        const progress = Math.min(player.xp / player.xpNextLevel, 1);
        const barWidth = w * progress;

        if (barWidth > 0) {
            ctx.save();
            ctx.fillStyle = '#00ffcc';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffcc';
            ctx.fillRect(0, 0, barWidth, barHeight);
            ctx.restore();
        }

        ctx.save();
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#00ffcc';
        ctx.fillText(`LVL ${player.level}`, w - 20, barHeight + 20);
        ctx.restore();
    }

    update(deltaTime) {
    }

    draw(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;
        const player = this.game.getModule('player');
        const director = this.game.getModule('director');
        
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00ffcc';
        ctx.fillText(`SCORE: ${this.score.toString().padStart(6, '0')}`, 20, 40);
        
        if (player) {
            ctx.save();
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.shadowBlur = 8;
            
            let healthText = "HP: ";
            for(let i = 0; i < player.stats.maxHp; i++) {
                healthText += (i < player.stats.hp) ? "▮" : "▯";
            }
            
            ctx.fillStyle = '#00ffcc'; 
            ctx.shadowColor = '#00ffcc';
            ctx.fillText(healthText, 20, 75);

            if (player.stats.hp > player.stats.maxHp) {
                const extraHp = player.stats.hp - player.stats.maxHp;
                let shieldText = "";
                for(let i = 0; i < extraHp; i++) {
                    shieldText += "▮";
                }
                
                const metrics = ctx.measureText(healthText);
                ctx.fillStyle = '#00bbff';
                ctx.shadowColor = '#00bbff';
                ctx.fillText(shieldText, 20 + metrics.width, 75);
            }
            ctx.restore();
        }

        ctx.textAlign = 'right';
        ctx.font = '16px "Courier New", monospace';
        ctx.fillText(`HI-SCORE: ${this.highScore.toString().padStart(6, '0')}`, w - 20, 40);
        
        ctx.shadowBlur = 0;

        if (director) {
                const totalSeconds = Math.floor(director.gameTime / 1000);
                const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
                const secs = (totalSeconds % 60).toString().padStart(2, '0');
                const timeStr = `${mins}:${secs}`;

                ctx.save();
                ctx.textAlign = 'center';
                
                let scale = 1;
                let alpha = 1;

                if (director.phaseChanged) {
                    const elapsed = director.phaseTimer || 0;
                    
                    const pulse = Math.sin(Date.now() / 200) * 0.05;
                    scale = 1.05 + pulse;
                    alpha = 0.7 + Math.abs(Math.sin(Date.now() / 400) * 0.3);

                    if (elapsed > 5000) {
                        director.phaseChanged = false;
                    }
                    director.phaseTimer = elapsed + 16;
                }

                ctx.translate(w / 2, h - 40);
                ctx.scale(scale, scale);
                ctx.globalAlpha = alpha;

                ctx.fillStyle = '#00ffcc';
                ctx.shadowBlur = 15 * scale;
                ctx.shadowColor = '#00ffcc';
                ctx.font = 'bold 30px "Courier New", monospace';
                ctx.fillText(timeStr, 0, 0);

                ctx.font = '12px "Courier New", monospace';
                ctx.globalAlpha = alpha * 0.7;
                ctx.fillText(director.getPhaseName().toUpperCase(), 0, 20);

                ctx.restore();
        }

        this._drawXpBar(ctx);
        this._drawActiveBuffs(ctx);
        this._drawNotifications(ctx);
    }
}