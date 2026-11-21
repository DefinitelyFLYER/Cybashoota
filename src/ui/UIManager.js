export default class UIManager {
    constructor() {
        this.score = 0;
        this.highScore = Number(localStorage.getItem('cyberpunk_highscore')) || 0;
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
        const player = this.game.getModule('player');
        const hasArmor = player && typeof player.getMaxArmor === 'function' && player.getMaxArmor() > 0;
        let startY = hasArmor ? 145 : 120;

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
            ctx.font = 'bold 12px "VT323", monospace';
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

    _drawNotifications(ctx, width = this.game.canvas.width, height = this.game.canvas.height) {
        const w = width;
        const h = height;

        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const n = this.notifications[i];
            
            ctx.save();
            ctx.globalAlpha = n.alpha;
            ctx.fillStyle = n.color;
            ctx.font = 'bold 24px "VT323"';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 15;
            ctx.shadowColor = n.color;
            
            ctx.fillText(n.text, w / 2, h / 3 - n.y);
            ctx.restore();
        }
    }

    _drawXpBar(ctx, width = this.game.canvas.width) {
        const player = this.game.getModule('player');
        if (!player) return;

        const w = width;
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
        ctx.font = 'bold 20px "VT323", monospace';
        ctx.textAlign = 'right';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#00ffcc';
        ctx.fillText(`LVL ${player.level}`, w - 20, barHeight + 20);
        ctx.restore();
    }

    reset() {
        this.score = 0;
        this.notifications = [];
    }

    update(deltaTime) {
        const step = deltaTime / 16;
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const n = this.notifications[i];
            n.y += 1 * step;
            n.alpha -= 0.005 * step;
            if (n.alpha <= 0) this.notifications.splice(i, 1);
        }
    }

    _drawHackHud(ctx, virtualW, virtualH) {
        const hack = this.game.getModule('hack');
        if (!hack || !hack.unlockedHacks || hack.unlockedHacks.length === 0 || !hack.activeHack) return;

        const x = 20;
        const y = virtualH - 110;
        const width = 250;
        const height = 70;
        const barWidth = 200;
        const barHeight = 10;

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 16px "VT323", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`HACK: ${hack.activeHack}`, x + 12, y + 12);

        const cooldownY = y + 34;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 12, cooldownY, barWidth, barHeight);

        if (hack.cooldownTimer > 0 && hack.cooldownDuration > 0) {
            const progress = 1 - Math.min(1, Math.max(0, hack.cooldownTimer / hack.cooldownDuration));
            ctx.fillStyle = '#00ffcc';
            ctx.fillRect(x + 12, cooldownY, barWidth * progress, barHeight);

            ctx.fillStyle = '#ffffff';
            ctx.font = '13px "VT323", monospace';
            ctx.fillText(`RECHARGING ${Math.ceil(hack.cooldownTimer / 1000)}s`, x + 12, cooldownY + 16);
        } else {
            ctx.fillStyle = '#00ffcc';
            ctx.font = '13px "VT323", monospace';
            ctx.fillText('READY', x + 12, cooldownY + 16);
        }

        ctx.restore();
    }

    _drawUltimateHud(ctx, virtualW, virtualH) {
        const augmentMgr = this.game.getModule('augments');
        if (!augmentMgr || typeof augmentMgr.getActiveUltimateInfo !== 'function') return;
        const ult = augmentMgr.getActiveUltimateInfo();
        if (!ult) return;

        const hack = this.game.getModule('hack');
        const hasHackHud = hack && hack.unlockedHacks && hack.unlockedHacks.length > 0 && hack.activeHack;

        const x = hasHackHud ? 286 : 20;
        const y = virtualH - 110;
        const width = 260;
        const height = 70;
        const barWidth = 210;
        const barHeight = 10;

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = ult.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = ult.color;
        ctx.font = 'bold 16px "VT323", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`ULT: ${ult.name.toUpperCase()}`, x + 12, y + 12);

        const cooldownY = y + 34;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 12, cooldownY, barWidth, barHeight);

        if (ult.activeTimer > 0 && ult.activeDuration > 0) {
            const activeProgress = Math.min(1, Math.max(0, ult.activeTimer / ult.activeDuration));
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 12, cooldownY, barWidth * activeProgress, barHeight);

            ctx.fillStyle = '#ffffff';
            ctx.font = '13px "VT323", monospace';
            ctx.fillText(`ACTIVE ${(ult.activeTimer / 1000).toFixed(1)}s`, x + 12, cooldownY + 16);
        } else if (ult.cooldownTimer > 0 && ult.cooldownDuration > 0) {
            const progress = 1 - Math.min(1, Math.max(0, ult.cooldownTimer / ult.cooldownDuration));
            ctx.fillStyle = ult.color;
            ctx.fillRect(x + 12, cooldownY, barWidth * progress, barHeight);

            ctx.fillStyle = '#ffffff';
            ctx.font = '13px "VT323", monospace';
            ctx.fillText(`RECHARGING ${Math.ceil(ult.cooldownTimer / 1000)}s`, x + 12, cooldownY + 16);
        } else {
            ctx.fillStyle = ult.color;
            ctx.fillRect(x + 12, cooldownY, barWidth, barHeight);

            ctx.fillStyle = ult.color;
            ctx.font = '13px "VT323", monospace';
            ctx.fillText('READY', x + 12, cooldownY + 16);
        }

        ctx.restore();
    }

    _drawEmpDisruptionHud(ctx, virtualW, virtualH) {
        const player = this.game.getModule('player');
        if (!player || (player.empDisruptedTimer || 0) <= 0) return;

        ctx.save();
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 20px "VT323", monospace';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00e5ff';
        const secs = (player.empDisruptedTimer / 1000).toFixed(1);
        ctx.fillText(`⚡ EMP DISRUPTED: DRONES & HACKS OFFLINE (${secs}s)`, virtualW / 2, 34);
        ctx.restore();
    }

    _drawSynergyHud(ctx, virtualW) {
        const synergyMgr = this.game.getModule('synergies');
        if (!synergyMgr || typeof synergyMgr.getActiveSynergyList !== 'function') return;
        const active = synergyMgr.getActiveSynergyList();
        if (active.length === 0) return;

        ctx.save();
        ctx.textAlign = 'right';
        ctx.font = 'bold 16px "VT323", monospace';
        let y = 70;

        for (const syn of active) {
            ctx.fillStyle = syn.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = syn.color;
            ctx.fillText(`★ ${syn.name.toUpperCase()}`, virtualW - 20, y);
            y += 20;
        }
        ctx.restore();
    }

    _getUiScale() {
        return Math.max(0.5, Math.min(2, Number(this.game?.settings?.ui?.scale ?? 1)));
    }

    drawCursor(ctx, inputModule, settings, projectiles) {
        if (!inputModule || !settings) return;

        const gamepad = this.game.getModule('gamepad');
        const useGamepadCursor = gamepad && gamepad.gamepadIndex !== null && projectiles;
        const x = useGamepadCursor && typeof projectiles.crosshairX === 'number'
            ? projectiles.crosshairX
            : inputModule.mouseX || 0;
        const y = useGamepadCursor && typeof projectiles.crosshairY === 'number'
            ? projectiles.crosshairY
            : inputModule.mouseY || 0;
        const gp = settings.gameplay || {};
        
        const color = gp.crosshairColor || '#00ffcc';
        const skin = gp.cursorSkin || 'classic'; 
        const borderEnabled = gp.cursorBorderEnabled !== false;
        const borderColor = gp.cursorBorderColor || '#ffffff';
        const cursorWidth = Math.max(1, Number(gp.cursorWidth ?? 2));
        const cursorSize = Math.max(0.5, Number(gp.cursorSize ?? 1));
        const borderW = Math.max(1, Number(gp.cursorBorderWidth ?? 4));

        const pulse = this.game.getModule('projectiles')?.crosshairPulse || 0;
        const gap = (4 + pulse * 8) * cursorSize;

        ctx.save();
        ctx.lineCap = 'round';

        const drawShape = (pathBuilder, isFill = false, borderOffset = 0) => {
            if (borderEnabled) {
                ctx.beginPath();
                pathBuilder(borderOffset);
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = borderW;
                ctx.globalAlpha = 0.9;
                ctx.stroke();
            }
            
            ctx.beginPath();
            pathBuilder(0);
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = cursorWidth;
            ctx.globalAlpha = 1.0;
            
            if (isFill) ctx.fill(); 
            else ctx.stroke();
        };

        switch(skin.toLowerCase()) {
            case 'dot': {
                const r = (3 + pulse * 2) * cursorSize;
                drawShape((offset) => ctx.arc(x, y, r + offset, 0, Math.PI * 2), true, borderW * 0.5);
                break;
            }
            case 'circle': {
                const r = (10 + pulse * 6) * cursorSize;
                drawShape(() => ctx.arc(x, y, r, 0, Math.PI * 2), false, 0);
                drawShape(() => ctx.rect(x - 1, y - 1, 2, 2), true, 0);
                break;
            }
            case 'classic':
            default: {
                const len = 6 * cursorSize;
                const buildCross = () => {
                    ctx.moveTo(x, y - gap); ctx.lineTo(x, y - gap - len);
                    ctx.moveTo(x, y + gap); ctx.lineTo(x, y + gap + len);
                    ctx.moveTo(x - gap, y); ctx.lineTo(x - gap - len, y);
                    ctx.moveTo(x + gap, y); ctx.lineTo(x + gap + len, y);
                };
                
                drawShape(() => ctx.rect(x - 1, y - 1, 2, 2), true, 0);
                drawShape(buildCross, false, 0);
                break;
            }
        }
        ctx.restore();
    }

    draw(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;
        const player = this.game.getModule('player');
        const director = this.game.getModule('director');
        const hack = this.game.getModule('hack');
        const uiScale = this._getUiScale();
        const virtualW = w / uiScale;
        const virtualH = h / uiScale;

        ctx.save();
        if (uiScale !== 1) {
            ctx.scale(uiScale, uiScale);
        }

        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 28px "VT323", monospace';
        ctx.textAlign = 'left';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00ffcc';
        ctx.fillText(`SCORE: ${this.score.toString().padStart(6, '0')}`, 20, 40);
        
        if (player) {
            ctx.save();
            ctx.font = 'bold 28px "VT323", monospace';
            ctx.textAlign = 'left';
            ctx.shadowBlur = 8;
            
            const currentHp = Math.min(player.stats.hp, player.stats.maxHp);
            const missingHp = player.stats.maxHp - currentHp;
            const healthText = "HP: " + "▮".repeat(Math.max(0, currentHp)) + "▯".repeat(Math.max(0, missingHp));
            
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

            const maxArmor = typeof player.getMaxArmor === 'function' ? player.getMaxArmor() : 0;
            if (maxArmor > 0) {
                const curArmor = Math.max(0, Math.min(maxArmor, player.armorCharges || 0));
                const missingArmor = maxArmor - curArmor;
                const armorText = "ARMOR: " + "▮".repeat(curArmor) + "▯".repeat(missingArmor);

                ctx.font = 'bold 24px "VT323", monospace';
                ctx.fillStyle = '#ff9900';
                ctx.shadowColor = '#ff9900';
                ctx.fillText(armorText, 20, 105);

                if (curArmor < maxArmor && player.armorRechargeDuration > 0) {
                    const textW = ctx.measureText(armorText).width;
                    const barX = 20 + textW + 12;
                    const barY = 92;
                    const barW = 70;
                    const barH = 8;
                    const prog = Math.min(1, Math.max(0, player.armorRechargeTimer / player.armorRechargeDuration));

                    ctx.shadowBlur = 0;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    ctx.fillRect(barX, barY, barW, barH);
                    ctx.fillStyle = '#ff9900';
                    ctx.fillRect(barX, barY, barW * prog, barH);
                }
            }
            ctx.restore();
        }

        ctx.textAlign = 'right';
        ctx.font = '20px "VT323", monospace';
        ctx.fillText(`HI-SCORE: ${this.highScore.toString().padStart(6, '0')}`, virtualW - 20, 40);

        if (this.game?.settings?.performance?.showFps) {
            ctx.save();
            ctx.fillStyle = '#88c8d0';
            ctx.font = '18px "VT323", monospace';
            ctx.textAlign = 'right';
            ctx.shadowBlur = 0;
            ctx.fillText(`FPS: ${this.game.fps || 60}`, virtualW - 20, 58);
            ctx.restore();
        }
        
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
                const pulse = Math.sin(Date.now() / 200) * 0.1;
                scale = 1.15 + pulse;
                alpha = 0.7 + Math.abs(Math.sin(Date.now() / 400) * 0.3);
            }

            ctx.translate(virtualW / 2, virtualH - 40);
            ctx.scale(scale, scale);
            ctx.globalAlpha = alpha;

            ctx.fillStyle = '#00ffcc';
            ctx.shadowBlur = 15 * scale;
            ctx.shadowColor = '#00ffcc';
            ctx.font = 'bold 30px "VT323", monospace';
            ctx.fillText(timeStr, 0, 0);

            ctx.font = '20px "VT323", monospace';
            ctx.globalAlpha = alpha * 0.7;
            ctx.fillText(director.getPhaseName().toUpperCase(), 0, 20);

            ctx.restore();
        }

        this._drawHackHud(ctx, virtualW, virtualH);
        this._drawUltimateHud(ctx, virtualW, virtualH);
        this._drawEmpDisruptionHud(ctx, virtualW, virtualH);
        this._drawSynergyHud(ctx, virtualW);
        this._drawXpBar(ctx, virtualW);
        this._drawActiveBuffs(ctx, virtualW, virtualH);
        this._drawNotifications(ctx, virtualW, virtualH);

        ctx.restore();
    }
}