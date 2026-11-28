import {
    AUGMENTS,
    AUGMENT_SLOTS,
    AUGMENT_SLOT_LIST,
    AUGMENT_TYPES,
    AUGMENT_SET_BONUSES,
    getAugmentById,
    getAugmentsBySlot
} from '../data/AugmentData.js';
import { GLITCH_PHASES } from '../data/HackData.js';

const INTEGER_STATS = new Set([
    'maxHp',
    'defense',
    'penetration',
    'ricochetCount',
    'projectileCount',
    'maxDrones',
    'maxHackSlots',
    'upgradeOptions',
    'rerolls'
]);

const RARITY_SCRAP_VALUES = {
    Common: 1,
    Rare: 2,
    Epic: 3,
    Legendary: 4
};

export default class AugmentManager {
    constructor() {
        this.maxStorage = 6;
        this.maxTier = 3;
        this.forgeSlotCost = 3;

        this.slots = this._createEmptySlots();
        this.appliedModifiers = this._createEmptySlots();
        this.storage = Array(this.maxStorage).fill(null);
        this.drops = [];
        this.scrapDrops = [];
        this.typeCounts = {};
        this._fullNotifyCooldown = 0;

        // Scrap & Cyber-Forge terminal state
        this.scrap = 0;
        this.activeForgeTerminal = null;
        this.forgeSpawnTimer = 15000; // First terminal spawns at 60s (75000 - 15000)
        this.forgeSpawnInterval = 75000;
        this.forgeLifetime = 30000;

        // Auto-Recycler Protocol state
        this.autoRecyclerUnlocked = false;
        this.preferredSet = null;

        // Set bonus state
        this.appliedTwoPieceModifiers = {};
        this.appliedTwoPieceTiers = {};
        this.activeFourPieceType = null;
        this.fourPieceChoice = null; // 'active' | 'passive' | null
        this.appliedFourPieceTier = 1;
        this.pendingFourPieceChoiceType = null;
        this.appliedFourPiecePassive = null;

        // Active Ultimate runtime state
        this.ultimateCooldownTimer = 0;
        this.ultimateCooldownDuration = 0;
        this.ultimateActiveTimer = 0;
        this.ultimateActiveDuration = 0;
        this.ultimateActiveType = null;
        this.timeSlowFactor = 1.0;
        this.afterimages = [];
        this._afterimageSpawnTimer = 0;
        this.bulletStormApplied = null;

        // Passive runtime timers
        this.regenTimer = 0;
        this.wraithCritApplied = false;
        this.wraithCritTimer = 0;

        this._recalculateTypeCounts();
    }

    init(game) {
        this.game = game;
        this._syncPlayerSlots();
    }

    reset() {
        const player = this.game?.getModule('player');
        if (player) {
            this._endActiveUltimateEffect(player);
            this._clearWraithCritBuff(player);
        }

        this.slots = this._createEmptySlots();
        this.appliedModifiers = this._createEmptySlots();
        this.storage = Array(this.maxStorage).fill(null);
        this.drops = [];
        this.scrapDrops = [];
        this._fullNotifyCooldown = 0;

        this.scrap = 0;
        this.activeForgeTerminal = null;
        this.forgeSpawnTimer = 15000;

        this.autoRecyclerUnlocked = false;
        this.preferredSet = null;

        this.appliedTwoPieceModifiers = {};
        this.appliedTwoPieceTiers = {};
        this.activeFourPieceType = null;
        this.fourPieceChoice = null;
        this.appliedFourPieceTier = 1;
        this.pendingFourPieceChoiceType = null;
        this.appliedFourPiecePassive = null;

        this.ultimateCooldownTimer = 0;
        this.ultimateCooldownDuration = 0;
        this.ultimateActiveTimer = 0;
        this.ultimateActiveDuration = 0;
        this.ultimateActiveType = null;
        this.timeSlowFactor = 1.0;
        this.afterimages = [];
        this._afterimageSpawnTimer = 0;
        this.bulletStormApplied = null;

        this.regenTimer = 0;
        this.wraithCritApplied = false;
        this.wraithCritTimer = 0;

        this._recalculateTypeCounts();
        this._syncPlayerSlots();
    }

    _createEmptySlots() {
        return {
            [AUGMENT_SLOTS.HEAD]: null,
            [AUGMENT_SLOTS.ARMS]: null,
            [AUGMENT_SLOTS.LEGS]: null,
            [AUGMENT_SLOTS.CORE]: null
        };
    }

    _syncPlayerSlots() {
        const player = this.game?.getModule('player');
        if (player) {
            player.augments = { ...this.slots };
        }
    }

    getScrapValue(augment) {
        if (!augment) return 0;
        const base = RARITY_SCRAP_VALUES[augment.rarity] || 1;
        const tierBonus = Math.max(0, (augment.tier || 1) - 1);
        return base + tierBonus;
    }

    getTierLabel(tier = 1) {
        if (tier === 2) return 'Mk.II';
        if (tier >= 3) return 'Mk.III';
        return 'Mk.I';
    }

    /**
     * Try spawning an Augment Pod (from tough enemies) or a small Cyber-Scrap drop (0.5% from basic enemies).
     */
    trySpawn(x, y, enemy) {
        if (!enemy) return;

        const player = this.game?.getModule('player');
        const luck = player ? player.getStat('luck') : 1.0;
        const scrapDropMulti = player ? (player.stats.scrapDropMulti || 1.0) : 1.0;

        let baseChance = 0;
        if (enemy.type === 'RHOMBUS') {
            baseChance = 0.05;
        } else if (enemy.ranged) {
            baseChance = 0.035;
        } else if (enemy.type === 'HEXAGON') {
            baseChance = 0.025;
        } else {
            // 0.5% base chance for basic enemies to drop +1 Cyber-Scrap
            if (Math.random() < 0.005 * luck * scrapDropMulti) {
                this.spawnScrapDrop(x, y, 1);
            }
            return;
        }

        const finalChance = baseChance * luck;

        if (Math.random() < finalChance) {
            const chosen = this._rollRandomAugment(luck);
            if (chosen) {
                this.spawnPod(chosen, x, y);
            }
        }
    }

    spawnScrapDrop(x, y, amount = 1) {
        this.scrapDrops.push({
            amount,
            x,
            y,
            bobbing: Math.random() * Math.PI * 2
        });
    }

    _rollRandomAugment(luck = 1.0, pool = AUGMENTS) {
        if (!pool || pool.length === 0) return null;

        let totalWeight = 0;
        const weights = pool.map(aug => {
            let w = aug.weight ?? 50;
            if (aug.rarity === 'Rare') w *= luck;
            else if (aug.rarity === 'Epic') w *= (luck * 0.5);
            else if (aug.rarity === 'Legendary') w *= (luck * 0.15);
            totalWeight += w;
            return w;
        });

        let random = Math.random() * totalWeight;
        for (let i = 0; i < pool.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return pool[i];
            }
        }
        return pool[0];
    }

    spawnPod(augmentOrId, x, y) {
        const augment = typeof augmentOrId === 'string'
            ? getAugmentById(augmentOrId)
            : augmentOrId;
        if (!augment) return;

        const typeInfo = AUGMENT_TYPES[augment.type] || { color: '#00ffcc' };
        this.drops.push({
            augment: { ...augment, tier: augment.tier || 1 },
            color: typeInfo.color,
            x,
            y,
            bobbing: Math.random() * Math.PI * 2,
            pulse: 0
        });
    }

    update(deltaTime) {
        if (this._fullNotifyCooldown > 0) {
            this._fullNotifyCooldown -= deltaTime;
            if (this._fullNotifyCooldown < 0) this._fullNotifyCooldown = 0;
        }

        const player = this.game?.getModule('player');
        if (!player) return;

        this._updateSetBonusRuntime(player, deltaTime);
        this._updatePods(player, deltaTime);
        this._updateForgeTerminal(player, deltaTime);
    }

    isPlayerNearForge() {
        if (!this.activeForgeTerminal) return false;
        const player = this.game?.getModule('player');
        if (!player) return false;
        const term = this.activeForgeTerminal;
        const dx = player.pos.x - term.x;
        const dy = player.pos.y - term.y;
        return Math.sqrt(dx * dx + dy * dy) <= term.radius + 25;
    }

    _updateForgeTerminal(player, deltaTime) {
        if (this.activeForgeTerminal) {
            const term = this.activeForgeTerminal;
            term.remaining -= deltaTime;
            term.rotation += deltaTime * 0.0015;
            term.pulse += deltaTime * 0.005;

            const dx = player.pos.x - term.x;
            const dy = player.pos.y - term.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const isInside = dist <= term.radius;

            if (isInside && !term.playerInside) {
                term.playerInside = true;
                const particles = this.game?.getModule('particles');
                if (particles) {
                    particles.emit(term.x, term.y, '#ff9900', 20);
                }
                const menu = this.game?.getModule('menu');
                if (menu && typeof menu.openAugmentsMenu === 'function') {
                    menu.openAugmentsMenu('gameplay');
                }
                return;
            } else if (!isInside) {
                term.playerInside = false;
            }

            if (term.remaining <= 0) {
                this.activeForgeTerminal = null;
                const ui = this.game?.getModule('ui');
                if (ui && ui.showNotification) {
                    ui.showNotification('CYBER-FORGE TERMINAL OFFLINE', '#888888');
                }
            }
        } else {
            this.forgeSpawnTimer += deltaTime;
            if (this.forgeSpawnTimer >= this.forgeSpawnInterval) {
                this.forgeSpawnTimer = 0;
                this.spawnForgeTerminal(player);
            }
        }
    }

    spawnForgeTerminal(player, customDistUnits = null) {
        if (!player) return;
        const unitSize = this.game?.UNIT_SIZE || 100;
        const angle = Math.random() * Math.PI * 2;
        const dist = (customDistUnits !== null ? customDistUnits : (4.8 + Math.random() * 1.8)) * unitSize;
        const x = player.pos.x + Math.cos(angle) * dist;
        const y = player.pos.y + Math.sin(angle) * dist;

        this.activeForgeTerminal = {
            x,
            y,
            radius: 0.65 * unitSize,
            remaining: this.forgeLifetime,
            duration: this.forgeLifetime,
            rotation: 0,
            pulse: 0,
            playerInside: false
        };

        const ui = this.game?.getModule('ui');
        if (ui && ui.showNotification) {
            ui.showNotification('CYBER-FORGE TERMINAL ONLINE (30s)', '#ff9900');
        }
    }

    /**
     * Spend Cyber-Scrap while standing near an active Cyber-Forge Terminal to craft an augment for a chosen slot.
     * @param {'head'|'arms'|'legs'|'core'} slot
     * @returns {{ success: boolean, index?: number, augment?: Object, reason?: string }}
     */
    forgeBySlot(slot) {
        if (!AUGMENT_SLOT_LIST.includes(slot)) {
            return { success: false, reason: 'INVALID SLOT' };
        }
        if (!this.isPlayerNearForge()) {
            return { success: false, reason: 'MUST BE NEAR ACTIVE FORGE' };
        }
        if (this.scrap < this.forgeSlotCost) {
            return { success: false, reason: `NEED ${this.forgeSlotCost} SCRAP` };
        }
        if (this.getStoredCount() >= this.maxStorage) {
            return { success: false, reason: 'STORAGE FULL' };
        }

        const player = this.game?.getModule('player');
        const luck = player ? player.getStat('luck') : 1.0;
        const slotPool = getAugmentsBySlot(slot);
        const crafted = this._rollRandomAugment(luck, slotPool);
        if (!crafted) {
            return { success: false, reason: 'NO AUGMENTS IN POOL' };
        }

        this.scrap -= this.forgeSlotCost;

        const storageIndex = this.addToStorage({ ...crafted, tier: 1 });
        const audio = this.game?.getModule('audio');
        if (audio) audio.play('forgeCraft');
        const ui = this.game?.getModule('ui');
        const typeColor = AUGMENT_TYPES[crafted.type]?.color || '#ff9900';
        if (ui && ui.showNotification) {
            ui.showNotification(
                `FORGED: ${crafted.name} [${slot.toUpperCase()}]`,
                typeColor
            );
        }

        return { success: true, index: storageIndex, augment: this.storage[storageIndex] };
    }

    _updateSetBonusRuntime(player, deltaTime) {
        const input = this.game?.getModule('input');
        const gamepad = this.game?.getModule('gamepad');
        const ultPressed = (input && input.isUltimatePressed) ||
            (gamepad && gamepad.justPressed && gamepad.justPressed.B);

        if (ultPressed) {
            if (input) input.isUltimatePressed = false;
            this.activateUltimate();
        }

        if (this.ultimateActiveTimer > 0) {
            this.ultimateActiveTimer -= deltaTime;
            if (this.ultimateActiveType === 'GHOST') {
                this._afterimageSpawnTimer += deltaTime;
                if (this._afterimageSpawnTimer >= 55) {
                    this._afterimageSpawnTimer = 0;
                    this.afterimages.push({
                        x: player.pos.x,
                        y: player.pos.y,
                        facing: player.facing,
                        alpha: 0.65
                    });
                }
            }
            if (this.ultimateActiveTimer <= 0) {
                this.ultimateActiveTimer = 0;
                this._endActiveUltimateEffect(player);
            }
        }

        for (let i = this.afterimages.length - 1; i >= 0; i--) {
            this.afterimages[i].alpha -= deltaTime * 0.0018;
            if (this.afterimages[i].alpha <= 0) {
                this.afterimages.splice(i, 1);
            }
        }

        if (this.ultimateCooldownTimer > 0) {
            this.ultimateCooldownTimer -= deltaTime;
            if (this.ultimateCooldownTimer < 0) this.ultimateCooldownTimer = 0;
        }

        if (this.wraithCritTimer > 0) {
            this.wraithCritTimer -= deltaTime;
            if (this.wraithCritTimer <= 0) {
                this._clearWraithCritBuff(player);
            }
        }

        let regenInterval = 0;
        if (this.activeFourPieceType === 'TITAN' && this.fourPieceChoice === 'passive') {
            regenInterval = AUGMENT_SET_BONUSES.TITAN.fourPiece.passive.regenIntervalMs;
        } else if ((this.typeCounts['TITAN'] || 0) >= 2) {
            regenInterval = AUGMENT_SET_BONUSES.TITAN.twoPiece.regenIntervalMs;
        }

        if (regenInterval > 0 && player.stats.hp < player.stats.maxHp) {
            this.regenTimer += deltaTime;
            if (this.regenTimer >= regenInterval) {
                this.regenTimer = 0;
                player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + 1);
                const particles = this.game?.getModule('particles');
                if (particles) {
                    particles.emit(player.pos.x, player.pos.y, '#ff7b00', 12);
                }
            }
        } else {
            this.regenTimer = 0;
        }
    }

    _updatePods(player, deltaTime) {
        const magnetRangePx = player.getStat('magnetRange') * this.game.UNIT_SIZE;
        const pickupRangePx = 0.35 * this.game.UNIT_SIZE;

        // Update Cyber-Scrap world drops
        for (let i = this.scrapDrops.length - 1; i >= 0; i--) {
            const s = this.scrapDrops[i];
            s.bobbing += deltaTime * 0.005;

            const dx = player.pos.x - s.x;
            const dy = player.pos.y - s.y;
            const distPx = Math.sqrt(dx * dx + dy * dy);

            if (distPx > 0 && distPx < magnetRangePx) {
                const magnetSpeed = 0.6;
                s.x += (dx / distPx) * magnetSpeed * deltaTime;
                s.y += (dy / distPx) * magnetSpeed * deltaTime;
            }

            if (distPx < pickupRangePx) {
                this.scrap += s.amount;
                const ui = this.game.getModule('ui');
                const particles = this.game.getModule('particles');
                if (ui && ui.showNotification) {
                    ui.showNotification(`+${s.amount} CYBER-SCRAP (TOTAL: ${this.scrap})`, '#ff9900');
                }
                if (particles) {
                    particles.emit(s.x, s.y, '#ff9900', 10);
                }
                this.scrapDrops.splice(i, 1);
            }
        }

        if (this.drops.length === 0) return;

        const hasFreeStorage = this.getStoredCount() < this.maxStorage;

        for (let i = this.drops.length - 1; i >= 0; i--) {
            const pod = this.drops[i];
            pod.bobbing += deltaTime * 0.004;
            pod.pulse += deltaTime * 0.005;

            const dx = player.pos.x - pod.x;
            const dy = player.pos.y - pod.y;
            const distPx = Math.sqrt(dx * dx + dy * dy);

            if (hasFreeStorage && distPx > 0 && distPx < magnetRangePx) {
                const magnetSpeed = 0.55;
                pod.x += (dx / distPx) * magnetSpeed * deltaTime;
                pod.y += (dy / distPx) * magnetSpeed * deltaTime;
            }

            if (distPx < pickupRangePx) {
                const ui = this.game.getModule('ui');
                const particles = this.game.getModule('particles');

                // Auto-Recycler Protocol: auto-scrap non-preferred sets on pickup
                if (this.autoRecyclerUnlocked && this.preferredSet && pod.augment.type !== this.preferredSet) {
                    const scrapGain = this.getScrapValue(pod.augment);
                    const codex = this.game?.getModule('codex');
                    if (codex) codex.discover('augments', pod.augment.id);

                    if (this.isFullMk3Build()) {
                        const xpGain = Math.max(10, Math.round(player.xpNextLevel * 0.2 * scrapGain));
                        player.addXp(xpGain);
                        if (ui && ui.showNotification) {
                            ui.showNotification(`AUTO-RECYCLED FOR +${xpGain} XP`, '#00ffcc');
                        }
                    } else {
                        this.scrap += scrapGain;
                        if (ui && ui.showNotification) {
                            ui.showNotification(`AUTO-SCRAPPED: +${scrapGain} CYBER-SCRAP`, '#ff9900');
                        }
                    }
                    if (particles) {
                        particles.emit(pod.x, pod.y, '#ff9900', 14);
                    }
                    this.drops.splice(i, 1);
                    continue;
                }

                const slotIndex = this.addToStorage(pod.augment);

                if (slotIndex !== -1) {
                    if (ui && ui.showNotification) {
                        ui.showNotification(
                            `AUGMENT STORED: ${pod.augment.name} [${pod.augment.slot.toUpperCase()}]`,
                            pod.color
                        );
                    }
                    if (particles) {
                        particles.emit(pod.x, pod.y, pod.color, 18);
                    }
                    this.drops.splice(i, 1);
                } else if (this._fullNotifyCooldown <= 0) {
                    if (ui && ui.showNotification) {
                        ui.showNotification('AUGMENT STORAGE FULL (6/6)', '#ff0055');
                    }
                    this._fullNotifyCooldown = 2500;
                }
            }
        }
    }

    draw(ctx) {
        const player = this.game?.getModule('player');
        if (!player) return;

        if (this.afterimages.length > 0) {
            for (const img of this.afterimages) {
                const screenX = img.x - player.pos.x + this.game.center.x;
                const screenY = img.y - player.pos.y + this.game.center.y;
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.scale(img.facing, 1);
                ctx.globalAlpha = Math.max(0, img.alpha * 0.6);
                ctx.shadowBlur = 16;
                ctx.shadowColor = '#00ffcc';
                if (player.isLoaded) {
                    ctx.drawImage(player.sprite, -player.size / 2, -player.size / 2, player.size, player.size);
                } else {
                    ctx.fillStyle = '#00ffcc';
                    ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);
                }
                ctx.restore();
            }
        }

        if (this.ultimateActiveType === 'GHOST' && this.ultimateActiveTimer > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 255, 204, 0.06)';
            ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
            ctx.restore();
        }

        if (this.activeForgeTerminal) {
            this._drawForgeTerminal(ctx, player, this.activeForgeTerminal);
        }

        // Draw Cyber-Scrap world drops
        for (const s of this.scrapDrops) {
            const drawX = s.x - player.pos.x + this.game.center.x;
            const drawY = s.y - player.pos.y + this.game.center.y + Math.sin(s.bobbing) * 5;
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#ff9900';
            ctx.fillStyle = '#ff9900';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(drawX, drawY - 8);
            ctx.lineTo(drawX + 8, drawY);
            ctx.lineTo(drawX, drawY + 8);
            ctx.lineTo(drawX - 8, drawY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        if (this.drops.length === 0) return;

        for (const pod of this.drops) {
            const drawX = pod.x - player.pos.x + this.game.center.x;
            const drawY = pod.y - player.pos.y + this.game.center.y + Math.sin(pod.bobbing) * 6;
            const radius = 16;
            const pulseOffset = Math.sin(pod.pulse) * 3;

            ctx.save();
            ctx.shadowBlur = 18;
            ctx.shadowColor = pod.color;

            ctx.fillStyle = '#080c0e';
            ctx.strokeStyle = pod.color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                const px = drawX + (radius + pulseOffset * 0.4) * Math.cos(angle);
                const py = drawY + (radius + pulseOffset * 0.4) * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            const innerR = 7;
            ctx.fillStyle = pod.color;
            ctx.beginPath();
            ctx.moveTo(drawX, drawY - innerR);
            ctx.lineTo(drawX + innerR, drawY);
            ctx.lineTo(drawX, drawY + innerR);
            ctx.lineTo(drawX - innerR, drawY);
            ctx.closePath();
            ctx.fill();

            ctx.shadowBlur = 6;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`AUG [${pod.augment.slot[0].toUpperCase()}]`, drawX, drawY - radius - 4);

            ctx.restore();
        }
    }

    _drawForgeTerminal(ctx, player, term) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;
        const screenX = term.x - player.pos.x + this.game.center.x;
        const screenY = term.y - player.pos.y + this.game.center.y;
        const secsLeft = Math.ceil(term.remaining / 1000);

        const margin = 60;
        const isOffScreen = screenX < margin || screenX > w - margin || screenY < margin || screenY > h - margin;

        ctx.save();
        if (!isOffScreen) {
            const pulseR = term.radius + Math.sin(term.pulse) * 4;

            // Outer rotating dashed zone ring
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(term.rotation);
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 16;
            ctx.shadowColor = '#ff9900';
            ctx.setLineDash([14, 10]);
            ctx.beginPath();
            ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Inner octagonal station base
            const coreR = 26;
            ctx.fillStyle = 'rgba(15, 10, 5, 0.85)';
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#00ffcc';
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI / 4) * i + Math.PI / 8;
                const px = screenX + coreR * Math.cos(a);
                const py = screenY + coreR * Math.sin(a);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Anvil/Core icon
            ctx.fillStyle = '#ff9900';
            ctx.shadowColor = '#ff9900';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 9, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff9900';
            ctx.font = 'bold 18px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`CYBER-FORGE (${secsLeft}s)`, screenX, screenY - pulseR - 10);
        } else {
            // Off-screen directional indicator arrow along screen edge
            const dx = screenX - this.game.center.x;
            const dy = screenY - this.game.center.y;
            const angle = Math.atan2(dy, dx);

            const halfW = w / 2 - 55;
            const halfH = h / 2 - 55;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const tx = cos !== 0 ? Math.abs(halfW / cos) : Infinity;
            const ty = sin !== 0 ? Math.abs(halfH / sin) : Infinity;
            const t = Math.min(tx, ty);

            const indX = this.game.center.x + cos * t;
            const indY = this.game.center.y + sin * t;

            ctx.save();
            ctx.translate(indX, indY);
            ctx.rotate(angle);
            ctx.fillStyle = '#ff9900';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#ff9900';
            ctx.beginPath();
            ctx.moveTo(16, 0);
            ctx.lineTo(-10, -10);
            ctx.lineTo(-6, 0);
            ctx.lineTo(-10, 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = '#ff9900';
            ctx.font = 'bold 16px "VT323", monospace';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#000000';
            ctx.fillText(`FORGE ${secsLeft}s`, indX, indY + 24);
        }
        ctx.restore();
    }

    addToStorage(augmentOrId) {
        const augment = typeof augmentOrId === 'string'
            ? getAugmentById(augmentOrId)
            : augmentOrId;
        if (!augment) return -1;

        const emptyIdx = this.storage.findIndex(item => item === null);
        if (emptyIdx === -1) return -1;

        this.storage[emptyIdx] = { ...augment, tier: augment.tier || 1 };
        const codex = this.game?.getModule('codex');
        if (codex) codex.discover('augments', augment.id);
        return emptyIdx;
    }

    equipFromStorage(storageIndex) {
        if (storageIndex < 0 || storageIndex >= this.maxStorage) return false;
        const augment = this.storage[storageIndex];
        if (!augment) return false;

        // Check if this is a true duplicate of the currently equipped augment in that slot
        const existing = this.slots[augment.slot];
        if (existing && existing.id === augment.id) {
            return this.fuseFromStorage(storageIndex);
        }

        const success = this.equipAugment(augment);
        if (success) {
            this.storage[storageIndex] = null;
        }
        return success;
    }

    /**
     * Fuse a duplicate augment from storage into the currently equipped matching augment,
     * upgrading its tier (Mk.I -> Mk.II -> Mk.III, +25% stats per tier).
     * @param {number} storageIndex
     * @returns {boolean}
     */
    fuseFromStorage(storageIndex) {
        if (storageIndex < 0 || storageIndex >= this.maxStorage) return false;
        const storedAug = this.storage[storageIndex];
        if (!storedAug) return false;

        const slot = storedAug.slot;
        const equippedAug = this.slots[slot];
        if (!equippedAug || equippedAug.id !== storedAug.id) return false;

        const currentTier = equippedAug.tier || 1;
        if (currentTier >= this.maxTier) return false;

        const player = this.game?.getModule('player');
        if (!player) return false;

        const nextTier = currentTier + 1;

        // Revert old tier's modifiers without resetting set bonus choice
        const oldApplied = this.appliedModifiers[slot];
        if (oldApplied) {
            this._removeAugmentModifiers(player, oldApplied);
        }

        const baseDef = getAugmentById(equippedAug.id) || equippedAug;
        const upgradedAug = this._buildTieredAugment(baseDef, nextTier);
        const newApplied = this._applyAugmentModifiers(player, upgradedAug);

        this.slots[slot] = upgradedAug;
        this.appliedModifiers[slot] = newApplied;
        this.storage[storageIndex] = null;
        this._syncSetBonuses(player);
        this._syncPlayerSlots();

        const ui = this.game?.getModule('ui');
        const typeColor = AUGMENT_TYPES[upgradedAug.type]?.color || '#00ffcc';
        if (ui && ui.showNotification) {
            ui.showNotification(
                `OVERCLOCKED: ${upgradedAug.name} ${this.getTierLabel(nextTier)}!`,
                typeColor
            );
        }

        const synergyMgr = this.game?.getModule('synergies');
        if (synergyMgr) {
            synergyMgr.triggerCyberOverload();
        }

        return true;
    }

    _buildTieredAugment(baseAug, tier = 1) {
        const clampedTier = Math.max(1, Math.min(this.maxTier, tier));
        if (clampedTier === 1) {
            return { ...baseAug, tier: 1 };
        }

        const mult = 1 + (clampedTier - 1) * 0.25;
        const scaledStats = {};
        const scaledMultipliers = {};

        if (baseAug.stats) {
            for (const [k, v] of Object.entries(baseAug.stats)) {
                if (typeof v !== 'number') continue;
                if (v > 0) {
                    if (INTEGER_STATS.has(k)) {
                        // Guarantee at least +1 per tier for positive integer stats, or scaled rounded
                        scaledStats[k] = Math.max(v + (clampedTier - 1), Math.round(v * mult));
                    } else {
                        scaledStats[k] = Number((v * mult).toFixed(3));
                    }
                } else {
                    scaledStats[k] = v;
                }
            }
        }

        if (baseAug.multipliers) {
            for (const [k, v] of Object.entries(baseAug.multipliers)) {
                if (typeof v !== 'number') continue;
                if (v > 0) {
                    scaledMultipliers[k] = Number((v * mult).toFixed(3));
                } else {
                    scaledMultipliers[k] = v;
                }
            }
        }

        const bonusPct = (clampedTier - 1) * 25;
        const baseDesc = (getAugmentById(baseAug.id) || baseAug).description || '';

        return {
            ...baseAug,
            tier: clampedTier,
            stats: scaledStats,
            multipliers: scaledMultipliers,
            description: `${baseDesc} [Overclocked +${bonusPct}%]`
        };
    }

    /**
     * Permanently destroy an augment in storage and award Cyber-Scrap.
     * @param {number} storageIndex
     * @returns {number} Scrap awarded, or 0 if failed.
     */
    scrapFromStorage(storageIndex) {
        if (storageIndex < 0 || storageIndex >= this.maxStorage) return 0;
        const item = this.storage[storageIndex];
        if (!item) return 0;

        const scrapGained = this.getScrapValue(item);
        this.scrap += scrapGained;
        this.storage[storageIndex] = null;

        const ui = this.game?.getModule('ui');
        if (ui && ui.showNotification) {
            ui.showNotification(`+${scrapGained} CYBER-SCRAP (TOTAL: ${this.scrap})`, '#ff9900');
        }
        return scrapGained;
    }

    equipAugment(augmentOrId) {
        const rawAugment = typeof augmentOrId === 'string'
            ? getAugmentById(augmentOrId)
            : augmentOrId;

        if (!rawAugment || !AUGMENT_SLOT_LIST.includes(rawAugment.slot)) {
            return false;
        }

        const player = this.game?.getModule('player');
        if (!player) return false;

        const slot = rawAugment.slot;
        if (this.slots[slot]) {
            this.unequipSlot(slot);
        }

        const baseDef = getAugmentById(rawAugment.id) || rawAugment;
        const augment = this._buildTieredAugment(baseDef, rawAugment.tier || 1);
        const applied = this._applyAugmentModifiers(player, augment);
        this.slots[slot] = augment;
        this.appliedModifiers[slot] = applied;

        if (augment.onEquip) {
            augment.onEquip(player, this.game);
        }

        this._recalculateTypeCounts();
        this._syncSetBonuses(player);
        this._syncPlayerSlots();
        return true;
    }

    unequipSlot(slot) {
        if (!AUGMENT_SLOT_LIST.includes(slot)) return null;

        const current = this.slots[slot];
        if (!current) return null;

        const player = this.game?.getModule('player');
        const applied = this.appliedModifiers[slot];

        if (player && applied) {
            this._removeAugmentModifiers(player, applied);
        }

        if (player && current.onUnequip) {
            current.onUnequip(player, this.game);
        }

        this.slots[slot] = null;
        this.appliedModifiers[slot] = null;

        this._recalculateTypeCounts();
        if (player) {
            this._syncSetBonuses(player);
        }
        this._syncPlayerSlots();
        return current;
    }

    isFullMk3Build() {
        return AUGMENT_SLOT_LIST.every(s => this.slots[s] && (this.slots[s].tier || 1) >= 3);
    }

    convertScrapToXp(amount = 1) {
        if (!this.isFullMk3Build() || this.scrap < amount || amount <= 0) return 0;
        const player = this.game?.getModule('player');
        if (!player) return 0;

        this.scrap -= amount;
        const xpGain = Math.max(10, Math.round(player.xpNextLevel * 0.2 * amount));
        player.addXp(xpGain);

        const ui = this.game?.getModule('ui');
        if (ui && ui.showNotification) {
            ui.showNotification(`EXCHANGED ${amount} SCRAP FOR +${xpGain} XP`, '#00ffcc');
        }
        return xpGain;
    }

    getTwoPieceTier(typeKey) {
        const tiers = AUGMENT_SLOT_LIST
            .map(s => this.slots[s])
            .filter(a => a && a.type === typeKey)
            .map(a => a.tier || 1)
            .sort((a, b) => b - a);
        if (tiers.length < 2) return 0;
        return tiers[1]; // minimum tier among top 2 pieces
    }

    getFourPieceTier(typeKey) {
        const tiers = AUGMENT_SLOT_LIST
            .map(s => this.slots[s])
            .filter(a => a && a.type === typeKey)
            .map(a => a.tier || 1);
        if (tiers.length < 4) return 0;
        return Math.min(...tiers);
    }

    _scaleSetBonusDef(bonusDef, tier = 1) {
        if (!bonusDef || tier <= 1) return bonusDef;
        const mult = 1 + (tier - 1) * 0.25;
        const scaledStats = {};
        const scaledMultipliers = {};

        if (bonusDef.stats) {
            for (const [k, v] of Object.entries(bonusDef.stats)) {
                if (typeof v !== 'number') continue;
                if (INTEGER_STATS.has(k)) {
                    scaledStats[k] = v + (tier - 1);
                } else {
                    scaledStats[k] = Number((v * mult).toFixed(3));
                }
            }
        }
        if (bonusDef.multipliers) {
            for (const [k, v] of Object.entries(bonusDef.multipliers)) {
                if (typeof v !== 'number') continue;
                scaledMultipliers[k] = Number((v * mult).toFixed(3));
            }
        }

        return {
            ...bonusDef,
            stats: scaledStats,
            multipliers: scaledMultipliers
        };
    }

    _syncSetBonuses(player) {
        for (const typeKey of Object.keys(AUGMENT_TYPES)) {
            const count = this.typeCounts[typeKey] || 0;
            const baseBonusDef = AUGMENT_SET_BONUSES[typeKey]?.twoPiece;
            const currentlyApplied = this.appliedTwoPieceModifiers[typeKey];
            const prevTier = this.appliedTwoPieceTiers[typeKey] || 0;
            const targetTier = count >= 2 ? this.getTwoPieceTier(typeKey) : 0;

            if (targetTier > 0 && baseBonusDef) {
                if (!currentlyApplied || prevTier !== targetTier) {
                    if (currentlyApplied) {
                        this._removeAugmentModifiers(player, currentlyApplied);
                    }
                    const scaledDef = this._scaleSetBonusDef(baseBonusDef, targetTier);
                    this.appliedTwoPieceModifiers[typeKey] = this._applyAugmentModifiers(player, scaledDef);
                    this.appliedTwoPieceTiers[typeKey] = targetTier;

                    const ui = this.game?.getModule('ui');
                    if (ui && ui.showNotification) {
                        const tierTxt = targetTier > 1 ? ` [${this.getTierLabel(targetTier)}]` : '';
                        ui.showNotification(
                            `2-PC ${AUGMENT_TYPES[typeKey].name.toUpperCase()} SET${tierTxt}: ${baseBonusDef.name}`,
                            AUGMENT_TYPES[typeKey].color
                        );
                    }
                }
            } else if (currentlyApplied) {
                this._removeAugmentModifiers(player, currentlyApplied);
                delete this.appliedTwoPieceModifiers[typeKey];
                delete this.appliedTwoPieceTiers[typeKey];
            }
        }

        let fullSetType = null;
        for (const typeKey of Object.keys(AUGMENT_TYPES)) {
            if ((this.typeCounts[typeKey] || 0) >= 4) {
                fullSetType = typeKey;
                break;
            }
        }

        if (fullSetType !== this.activeFourPieceType) {
            if (this.activeFourPieceType) {
                if (this.appliedFourPiecePassive) {
                    this._removeAugmentModifiers(player, this.appliedFourPiecePassive);
                    this.appliedFourPiecePassive = null;
                }
                this._endActiveUltimateEffect(player);
                this._clearWraithCritBuff(player);
                this.ultimateCooldownTimer = 0;
                this.ultimateCooldownDuration = 0;
                this.fourPieceChoice = null;
                this.appliedFourPieceTier = 1;
            }

            this.activeFourPieceType = fullSetType;
            if (fullSetType) {
                this.pendingFourPieceChoiceType = fullSetType;
                this.appliedFourPieceTier = this.getFourPieceTier(fullSetType);
            } else {
                this.pendingFourPieceChoiceType = null;
            }
        } else if (fullSetType && this.fourPieceChoice) {
            const newTier = this.getFourPieceTier(fullSetType);
            if (newTier !== this.appliedFourPieceTier) {
                this.appliedFourPieceTier = newTier;
                if (this.fourPieceChoice === 'passive') {
                    if (this.appliedFourPiecePassive) {
                        this._removeAugmentModifiers(player, this.appliedFourPiecePassive);
                    }
                    const baseDef = AUGMENT_SET_BONUSES[fullSetType]?.fourPiece?.passive;
                    if (baseDef) {
                        this.appliedFourPiecePassive = this._applyAugmentModifiers(player, this._scaleSetBonusDef(baseDef, newTier));
                    }
                } else if (this.fourPieceChoice === 'active') {
                    const baseCd = AUGMENT_SET_BONUSES[fullSetType]?.fourPiece?.active?.cooldownMs || 25000;
                    const cdScale = newTier >= 3 ? 0.75 : (newTier === 2 ? 0.88 : 1.0);
                    this.ultimateCooldownDuration = Math.round(baseCd * cdScale);
                }
                const ui = this.game?.getModule('ui');
                if (ui && ui.showNotification) {
                    ui.showNotification(
                        `4-PC ${AUGMENT_TYPES[fullSetType].name.toUpperCase()} UPGRADED TO ${this.getTierLabel(newTier)}!`,
                        AUGMENT_TYPES[fullSetType].color
                    );
                }
            }
        }
    }

    selectFourPieceBonus(mode) {
        if (!this.activeFourPieceType) return false;
        if (mode !== 'active' && mode !== 'passive') return false;

        const player = this.game?.getModule('player');
        if (!player) return false;

        if (this.appliedFourPiecePassive) {
            this._removeAugmentModifiers(player, this.appliedFourPiecePassive);
            this.appliedFourPiecePassive = null;
        }
        this._endActiveUltimateEffect(player);
        this._clearWraithCritBuff(player);

        const typeKey = this.activeFourPieceType;
        const setDef = AUGMENT_SET_BONUSES[typeKey]?.fourPiece?.[mode];
        if (!setDef) return false;

        this.fourPieceChoice = mode;
        this.pendingFourPieceChoiceType = null;
        const tier = this.getFourPieceTier(typeKey);
        this.appliedFourPieceTier = tier;

        if (mode === 'passive') {
            this.appliedFourPiecePassive = this._applyAugmentModifiers(player, this._scaleSetBonusDef(setDef, tier));
            this.ultimateCooldownTimer = 0;
            this.ultimateCooldownDuration = 0;
        } else {
            const baseCd = setDef.cooldownMs || 25000;
            const cdScale = tier >= 3 ? 0.75 : (tier === 2 ? 0.88 : 1.0);
            this.ultimateCooldownDuration = Math.round(baseCd * cdScale);
            this.ultimateCooldownTimer = 0;
        }

        const ui = this.game?.getModule('ui');
        if (ui && ui.showNotification) {
            ui.showNotification(
                `4-PC ${AUGMENT_TYPES[typeKey].name.toUpperCase()} (${mode.toUpperCase()}): ${setDef.name}`,
                AUGMENT_TYPES[typeKey].color
            );
        }
        const synergyMgr = this.game?.getModule('synergies');
        if (synergyMgr) {
            synergyMgr.triggerCyberOverload();
        }

        return true;
    }

    getActiveUltimateInfo() {
        if (!this.activeFourPieceType || this.fourPieceChoice !== 'active') return null;
        const setDef = AUGMENT_SET_BONUSES[this.activeFourPieceType]?.fourPiece?.active;
        const typeInfo = AUGMENT_TYPES[this.activeFourPieceType];
        if (!setDef || !typeInfo) return null;

        return {
            type: this.activeFourPieceType,
            name: setDef.name,
            color: typeInfo.color,
            cooldownTimer: this.ultimateCooldownTimer,
            cooldownDuration: this.ultimateCooldownDuration,
            activeTimer: this.ultimateActiveTimer,
            activeDuration: this.ultimateActiveDuration
        };
    }

    activateUltimate() {
        if (!this.activeFourPieceType || this.fourPieceChoice !== 'active') return false;
        if (this.ultimateCooldownTimer > 0 || this.ultimateActiveTimer > 0) return false;

        const player = this.game?.getModule('player');
        if (!player || (player.empDisruptedTimer || 0) > 0) return false;

        const typeKey = this.activeFourPieceType;
        const setDef = AUGMENT_SET_BONUSES[typeKey]?.fourPiece?.active;
        if (!setDef) return false;

        const tier = this.getFourPieceTier(typeKey);
        const cdScale = tier >= 3 ? 0.75 : (tier === 2 ? 0.88 : 1.0);
        const durScale = tier >= 3 ? 1.3 : (tier === 2 ? 1.15 : 1.0);

        this.ultimateActiveType = typeKey;
        this.ultimateActiveDuration = Math.round((setDef.durationMs || 5000) * durScale);
        this.ultimateActiveTimer = this.ultimateActiveDuration;
        this.ultimateCooldownDuration = Math.round((setDef.cooldownMs || 25000) * cdScale);
        this.ultimateCooldownTimer = this.ultimateCooldownDuration;

        const particles = this.game?.getModule('particles');
        const ui = this.game?.getModule('ui');
        const typeColor = AUGMENT_TYPES[typeKey]?.color || '#00ffcc';

        if (ui && ui.showNotification) {
            ui.showNotification(`ULTIMATE: ${setDef.name}!`, typeColor);
        }

        switch (typeKey) {
            case 'GHOST': {
                this.timeSlowFactor = 0.1;
                this._afterimageSpawnTimer = 0;
                if (particles) particles.emit(player.pos.x, player.pos.y, '#00ffcc', 30);
                break;
            }
            case 'STRIKER': {
                this.bulletStormApplied = this._applyAugmentModifiers(player, {
                    stats: { projectileCount: 4, ricochetCount: 3, critChance: 1.0 },
                    multipliers: { fireRate: 2.0 }
                });
                if (particles) particles.emit(player.pos.x, player.pos.y, '#ff0055', 30);
                break;
            }
            case 'TITAN': {
                player.stats.hp += 4;
                player.invulnerable = Math.max(player.invulnerable, setDef.durationMs || 5000);
                player.triggerShockwave({
                    maxRadius: 480,
                    duration: 1200,
                    damage: 15,
                    color: '#ff7b00'
                });
                if (particles) particles.emit(player.pos.x, player.pos.y, '#ff7b00', 35);
                break;
            }
            case 'NETRUNNER': {
                const hackMgr = this.game?.getModule('hack');
                if (hackMgr && hackMgr.HACK_TYPES) {
                    if (hackMgr.HACK_TYPES.OVERLOAD) hackMgr.HACK_TYPES.OVERLOAD.execute(this.game);
                    if (hackMgr.HACK_TYPES.SIGNAL_JAMMER) hackMgr.HACK_TYPES.SIGNAL_JAMMER.execute(this.game);
                    if (hackMgr.HACK_TYPES.GHOST_PROTOCOL) hackMgr.HACK_TYPES.GHOST_PROTOCOL.execute(this.game);
                    this._infectNearestEnemiesWithGlitch(player, 3);
                }
                if (particles) particles.emit(player.pos.x, player.pos.y, '#bc00ff', 35);
                break;
            }
        }

        const synergyMgr = this.game?.getModule('synergies');
        if (synergyMgr) {
            synergyMgr.triggerCyberOverload();
        }

        return true;
    }

    _endActiveUltimateEffect(player) {
        if (this.ultimateActiveType === 'GHOST') {
            this.timeSlowFactor = 1.0;
        }
        if (this.bulletStormApplied && player) {
            this._removeAugmentModifiers(player, this.bulletStormApplied);
            this.bulletStormApplied = null;
        }
        this.ultimateActiveType = null;
        this.ultimateActiveTimer = 0;
    }

    _clearWraithCritBuff(player) {
        if (this.wraithCritApplied && player) {
            player.stats.critChance = Math.max(0, player.stats.critChance - 1.0);
            this.wraithCritApplied = false;
        }
        this.wraithCritTimer = 0;
    }

    onPlayerDamagedOrDodged(wasDodged) {
        const player = this.game?.getModule('player');
        if (!player) return;
        const synergyMgr = this.game?.getModule('synergies');

        if (wasDodged && this.activeFourPieceType === 'GHOST' && this.fourPieceChoice === 'passive') {
            player.ghostActive = true;
            player.ghostTimer = Math.max(player.ghostTimer, 2500);
            if (!this.wraithCritApplied) {
                player.stats.critChance += 1.0;
                this.wraithCritApplied = true;
            }
            this.wraithCritTimer = 2500;
            if (synergyMgr) synergyMgr.triggerCyberOverload();
        }

        if (this.activeFourPieceType === 'TITAN' && this.fourPieceChoice === 'passive') {
            player.triggerShockwave({
                maxRadius: 380,
                duration: 1000,
                damage: 10,
                color: '#ff7b00'
            });
            if (synergyMgr) synergyMgr.triggerCyberOverload();
        }
    }

    onHackExecuted() {
        const player = this.game?.getModule('player');
        if (!player) return;

        if (this.activeFourPieceType === 'NETRUNNER' && this.fourPieceChoice === 'passive') {
            this._infectNearestEnemiesWithGlitch(player, 2);
            const synergyMgr = this.game?.getModule('synergies');
            if (synergyMgr) synergyMgr.triggerCyberOverload();
        }
    }

    _infectNearestEnemiesWithGlitch(player, count = 2) {
        const enemyMgr = this.game?.getModule('enemies');
        const particles = this.game?.getModule('particles');
        if (!enemyMgr || !enemyMgr.enemies) return;

        const candidates = enemyMgr.enemies
            .filter(e => e.currentHp > 0 && e.glitchPhase !== GLITCH_PHASES.PRIMARY)
            .sort((a, b) => {
                const da = (a.x - player.pos.x) ** 2 + (a.y - player.pos.y) ** 2;
                const db = (b.x - player.pos.x) ** 2 + (b.y - player.pos.y) ** 2;
                return da - db;
            });

        for (let i = 0; i < Math.min(count, candidates.length); i++) {
            candidates[i].glitchPhase = GLITCH_PHASES.PRIMARY;
            if (particles) {
                particles.createGlitchEffect(candidates[i].x, candidates[i].y);
            }
        }
    }

    hasExplosiveCrits() {
        return this.activeFourPieceType === 'STRIKER' && this.fourPieceChoice === 'passive';
    }

    getHackCooldownMultiplier() {
        let multi = 1.0;
        if ((this.typeCounts['NETRUNNER'] || 0) >= 2) {
            multi *= AUGMENT_SET_BONUSES.NETRUNNER.twoPiece.hackCooldownMulti || 1.0;
        }
        if (this.activeFourPieceType === 'NETRUNNER' && this.fourPieceChoice === 'passive') {
            multi *= AUGMENT_SET_BONUSES.NETRUNNER.fourPiece.passive.hackCooldownMulti || 1.0;
        }
        return multi;
    }

    getDroneRateMultiplier() {
        let multi = 1.0;
        if ((this.typeCounts['NETRUNNER'] || 0) >= 2) {
            multi *= AUGMENT_SET_BONUSES.NETRUNNER.twoPiece.droneRateMulti || 1.0;
        }
        if (this.ultimateActiveType === 'NETRUNNER' && this.ultimateActiveTimer > 0) {
            multi *= 0.4;
        }
        return multi;
    }

    getDroneDamageBonus() {
        if (this.activeFourPieceType === 'NETRUNNER' && this.fourPieceChoice === 'passive') {
            return AUGMENT_SET_BONUSES.NETRUNNER.fourPiece.passive.droneDamageBonus || 0;
        }
        return 0;
    }

    _applyAugmentModifiers(player, augment) {
        const applied = {
            stats: {},
            multipliers: {}
        };

        if (augment.stats) {
            for (const [stat, delta] of Object.entries(augment.stats)) {
                if (typeof delta !== 'number' || player.stats[stat] === undefined) continue;

                if (stat === 'maxHp') {
                    const prevMaxHp = player.stats.maxHp;
                    const nextMaxHp = Math.max(1, prevMaxHp + delta);
                    const actualDelta = nextMaxHp - prevMaxHp;
                    player.stats.maxHp = nextMaxHp;
                    if (actualDelta > 0) {
                        player.stats.hp += actualDelta;
                    } else if (player.stats.hp > player.stats.maxHp) {
                        player.stats.hp = player.stats.maxHp;
                    }
                    applied.stats.maxHp = actualDelta;
                } else {
                    player.stats[stat] += delta;
                    applied.stats[stat] = delta;
                }
            }
        }

        if (augment.multipliers) {
            for (const [mult, delta] of Object.entries(augment.multipliers)) {
                if (typeof delta !== 'number' || player.multipliers[mult] === undefined) continue;
                player.multipliers[mult] += delta;
                applied.multipliers[mult] = delta;
            }
        }

        return applied;
    }

    _removeAugmentModifiers(player, applied) {
        if (applied.stats) {
            for (const [stat, delta] of Object.entries(applied.stats)) {
                if (player.stats[stat] === undefined) continue;

                if (stat === 'maxHp') {
                    player.stats.maxHp = Math.max(1, player.stats.maxHp - delta);
                    if (player.stats.hp > player.stats.maxHp) {
                        player.stats.hp = player.stats.maxHp;
                    }
                } else if (stat === 'damage') {
                    player.stats.damage = Math.max(0.1, player.stats.damage - delta);
                } else {
                    player.stats[stat] -= delta;
                }
            }
        }

        if (applied.multipliers) {
            for (const [mult, delta] of Object.entries(applied.multipliers)) {
                if (player.multipliers[mult] === undefined) continue;
                player.multipliers[mult] -= delta;
            }
        }
    }

    _recalculateTypeCounts() {
        const counts = {};
        for (const typeKey of Object.keys(AUGMENT_TYPES)) {
            counts[typeKey] = 0;
        }
        for (const slot of AUGMENT_SLOT_LIST) {
            const aug = this.slots[slot];
            if (aug && aug.type) {
                counts[aug.type] = (counts[aug.type] || 0) + 1;
            }
        }
        this.typeCounts = counts;
    }

    getStoredCount() {
        return this.storage.filter(Boolean).length;
    }

    getStorage() {
        return [...this.storage];
    }

    getEquippedAugment(slot) {
        return this.slots[slot] || null;
    }

    getAllEquippedAugments() {
        return { ...this.slots };
    }

    getTypeCount(typeId) {
        return this.typeCounts[typeId] || 0;
    }

    getActiveTypes() {
        return { ...this.typeCounts };
    }

    getAvailableAugments(options = {}) {
        const { slot = null, type = null, excludeEquipped = true } = options;
        const equippedIds = new Set(
            Object.values(this.slots)
                .filter(Boolean)
                .map(aug => aug.id)
        );

        return AUGMENTS.filter(aug => {
            if (slot && aug.slot !== slot) return false;
            if (type && aug.type !== type) return false;
            if (excludeEquipped && equippedIds.has(aug.id)) return false;
            return true;
        });
    }
}
