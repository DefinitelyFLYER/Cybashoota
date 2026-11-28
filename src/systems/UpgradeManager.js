import { UPGRADES } from '../data/UpgradeData.js';
import { getFormattedStats } from '../ui/Infobox.js';
import { DRONE_TYPES } from '../data/DroneTypes.js';
import { DRONE_UPGRADES } from '../data/DroneUpgradeData.js';
import { getUnlockedHackIds } from '../data/HackData.js';

export default class UpgradeManager {
    constructor() {
        this.inventory = {};
        this.droneUpgradeInventory = {};
        this.isSelectionActive = false;
        this.currentOptions = [];
        this.selectionMode = 'UPGRADES';
        this.selectedCardId = null; 
        this.pendingConfirm = null;
        this._confirmYesBounds = null;
        this._confirmNoBounds = null;
        this.confirmBtnBounds = null;
        this.reRollBtnBounds = null;
        this.cardBounds = [];
        this.droneLevelInterval = 3;
        this.pendingLevelUps = 0;
        this.selectionQueue = [];
        this.nextPhaseTimeout = null;
        this._clickHandler = this._handleInput.bind(this);
        this._gamepadActionHeld = false;

        this.droneMods = {
            'ALL': { damageBonus: 0, speedMulti: 1.0 },
            'RANGED': { fireRateMulti: 1.0, rangeMulti: 1.0, damageBonus: 0, independentTargeting: false },
            'INTERCEPTOR': { blockRadiusMulti: 1.0, cooldownMulti: 1.0, speedMulti: 1.0 },
            'DEBUFF': { actionRateMulti: 1.0, rangeMulti: 1.0 },
            'TESLA': { actionRateMulti: 1.0, rangeMulti: 1.0, chainBonus: 0, damageBonus: 0 },
            'SUPPORT': { actionRateMulti: 1.0, rangeMulti: 1.0, speedMulti: 1.0 },
            'MELEE': { actionRateMulti: 1.0, speedMulti: 1.0, damageBonus: 0 }
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
        this.droneUpgradeInventory = {};
        this.isSelectionActive = false;
        this.currentOptions = [];
        this.selectionMode = 'UPGRADES';
        this.selectedCardId = null;
        this.pendingConfirm = null;
        this._confirmYesBounds = null;
        this._confirmNoBounds = null;
        this.confirmBtnBounds = null;
        this.reRollBtnBounds = null;
        this.cardBounds = [];
        this.pendingLevelUps = 0;
        this.selectionQueue = [];
        if (this.nextPhaseTimeout) {
            clearTimeout(this.nextPhaseTimeout);
            this.nextPhaseTimeout = null;
        }
        this._gamepadActionHeld = false;
        this.droneMods = {
            'ALL': { damageBonus: 0, speedMulti: 1.0 },
            'RANGED': { fireRateMulti: 1.0, rangeMulti: 1.0, damageBonus: 0, independentTargeting: false },
            'INTERCEPTOR': { blockRadiusMulti: 1.0, cooldownMulti: 1.0, speedMulti: 1.0 },
            'DEBUFF': { actionRateMulti: 1.0, rangeMulti: 1.0 },
            'TESLA': { actionRateMulti: 1.0, rangeMulti: 1.0, chainBonus: 0, damageBonus: 0 },
            'SUPPORT': { actionRateMulti: 1.0, rangeMulti: 1.0, speedMulti: 1.0 },
            'MELEE': { actionRateMulti: 1.0, speedMulti: 1.0, damageBonus: 0 }
        };
        window.removeEventListener('mousedown', this._clickHandler);
    }

    update(deltaTime) {
        if (!this.isSelectionActive) return;
        if (this.game.isPaused || this.game.isGameOver || this.game.settingsOpen) return;

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

        if (this.pendingConfirm) {
            if (actionPressed) {
                if (this._confirmYesBounds && pointerX >= this._confirmYesBounds.x && pointerX <= this._confirmYesBounds.x + this._confirmYesBounds.w &&
                    pointerY >= this._confirmYesBounds.y && pointerY <= this._confirmYesBounds.y + this._confirmYesBounds.h) {
                    const id = this.pendingConfirm.selectedId;
                    this.pendingConfirm = null;
                    this._executeSelection(id, true);
                } else if (this._confirmNoBounds && pointerX >= this._confirmNoBounds.x && pointerX <= this._confirmNoBounds.x + this._confirmNoBounds.w &&
                    pointerY >= this._confirmNoBounds.y && pointerY <= this._confirmNoBounds.y + this._confirmNoBounds.h) {
                    this.pendingConfirm = null;
                }
            } else if (gamepad.buttons.B) {
                this.pendingConfirm = null;
            }
            this._gamepadActionHeld = actionDown;
            return;
        }

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
        const hackMgr = this.game.getModule('hack');
        const unlockedHacks = hackMgr && Array.isArray(hackMgr.unlockedHacks)
            ? hackMgr.unlockedHacks
            : getUnlockedHackIds();
        const hackCapacityFull = player ? unlockedHacks.length >= Math.max(1, Math.floor(player.getStat('maxHackSlots'))) : true;

        let pool = UPGRADES.filter(upgrade => {
            const currentCount = this.inventory[upgrade.id] || 0;
            if (upgrade.unique && currentCount > 0) return false;
            if (upgrade.maxStack && currentCount >= upgrade.maxStack) return false;
            if (upgrade.requirements && !upgrade.requirements(player, this)) return false;
            if (upgrade.unlockHackId) {
                if (unlockedHacks.includes(upgrade.unlockHackId)) return false;
            }
            return true;
        }).map(upgrade => {
            if (upgrade.unlockHackId && hackCapacityFull) {
                return {
                    ...upgrade,
                    requirementText: 'Replaces active hack (slots full).'
                };
            }
            return upgrade;
        });

        return this._pickWeightedItems(pool, count, luck);
    }

    _pickWeightedItems(pool, count, luck = 1) {
        const available = [...pool];
        const selected = [];
        const getWeight = (item) => {
            let w = item.weight || 100;
            if (item.rarity === 'Rare') w *= luck;
            if (item.rarity === 'Epic') w *= (luck * 0.5);
            if (item.rarity === 'Legendary') w *= (luck * 0.1);
            return w;
        };

        for (let i = 0; i < count; i++) {
            if (available.length === 0) break;

            let totalWeight = 0;
            available.forEach(item => { totalWeight += getWeight(item); });

            let random = Math.random() * totalWeight;
            for (let j = 0; j < available.length; j++) {
                random -= getWeight(available[j]);
                if (random <= 0) {
                    selected.push(available[j]);
                    available.splice(j, 1);
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
        const synergyMgr = this.game.getModule('synergies');
        let availableUpgrades = DRONE_UPGRADES.filter(upg => {
            const matchesBehavior = upg.targetBehaviors.includes('ALL') ||
                upg.targetBehaviors.some(b => activeBehaviors.includes(b));
            if (!matchesBehavior) return false;
            if (upg.unique && (this.droneUpgradeInventory[upg.id] || 0) > 0) return false;
            if (typeof upg.requirements === 'function' && !upg.requirements(droneMgr, synergyMgr)) return false;
            return true;
        });

        let selected = [];

        if (ownedCount === 0) {
            return availableDrones.sort(() => 0.5 - Math.random()).slice(0, count);
        }

        if (availableDrones.length > 0) {
            const shuffledDrones = availableDrones.sort(() => 0.5 - Math.random());
            const droneOption = ownedCount >= maxDrones
                ? { ...shuffledDrones[0], requirementText: 'Replaces oldest drone (slots full).' }
                : shuffledDrones[0];
            selected.push(droneOption);
        }
        
        const remainingCount = count - selected.length;
        const luck = player.stats.luck || 1;
        selected.push(...this._pickWeightedItems(availableUpgrades, remainingCount, luck));

        return selected.sort(() => 0.5 - Math.random());
    }

    applyUpgrade(upgradeId) {
        const player = this.game.getModule('player');
        const upgrade = UPGRADES.find(u => u.id === upgradeId);
        if (upgrade) {
            this.inventory[upgradeId] = (this.inventory[upgradeId] || 0) + 1;
            upgrade.onApply(player, this.game);
            if (!upgrade.unlockHackId) {
                const codex = this.game?.getModule('codex');
                if (codex) codex.discover('playerCards', upgradeId);
            }
        }
    }

    applyDroneUpgrade(upgradeId) {
        const upgrade = DRONE_UPGRADES.find(u => u.id === upgradeId);
        if (upgrade) {
            this.droneUpgradeInventory[upgradeId] = (this.droneUpgradeInventory[upgradeId] || 0) + 1;
            upgrade.onApply(this.droneMods);
            const codex = this.game?.getModule('codex');
            if (codex) codex.discover('droneCards', upgradeId);
        }
    }

    addLevelUp(level) {
        const player = this.game?.getModule('player');
        const targetLevel = level !== undefined ? level : (player ? player.level : 1);
        this.selectionQueue.push('UPGRADES');
        if (targetLevel % this.droneLevelInterval === 0) {
            this.selectionQueue.push('DRONES');
        }
        this.pendingLevelUps = this.selectionQueue.filter(m => m === 'UPGRADES').length;

        if (!this.isSelectionActive && !this.nextPhaseTimeout) {
            const nextMode = this.selectionQueue.shift();
            this.pendingLevelUps = this.selectionQueue.filter(m => m === 'UPGRADES').length;
            this.showSelection(nextMode);
        }
    }

    showSelection(mode = 'UPGRADES') {
        if (!this.game || this.game.isGameOver || this.game.gameState !== 'PLAYING') return;
        const player = this.game.getModule('player');
        if (!player) return;

        this.selectionMode = mode;
        this.selectedCardId = null;
        this.pendingConfirm = null;
        this._confirmYesBounds = null;
        this._confirmNoBounds = null;

        if (mode === 'UPGRADES') {
            const choiceCount = player.stats.upgradeOptions || 3;
            this.currentOptions = this.getAvailableUpgrades(choiceCount);
        } else {
            this.currentOptions = this.getDroneSelectionPool(3);
        }

        this.isSelectionActive = true;
        this.reRollBtnBounds = null;
        this.confirmBtnBounds = null;
        this.cardBounds = [];
        
        window.removeEventListener('mousedown', this._clickHandler);
        window.addEventListener('mousedown', this._clickHandler);
    }

    _handleInput(e) {
        if (!this.isSelectionActive) return;
        if (this.game.isPaused || this.game.isGameOver || this.game.settingsOpen) return;
        const rect = this.game.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (this.pendingConfirm) {
            const yB = this._confirmYesBounds;
            const nB = this._confirmNoBounds;
            if (yB && mouseX >= yB.x && mouseX <= yB.x + yB.w && mouseY >= yB.y && mouseY <= yB.y + yB.h) {
                const id = this.pendingConfirm.selectedId;
                this.pendingConfirm = null;
                this._executeSelection(id, true);
            } else if (nB && mouseX >= nB.x && mouseX <= nB.x + nB.w && mouseY >= nB.y && mouseY <= nB.y + nB.h) {
                this.pendingConfirm = null;
            }
            return;
        }

        if (this._checkRerollClick(mouseX, mouseY)) return; 
        if (this._checkConfirmClick(mouseX, mouseY)) return;
        this._checkCardClick(mouseX, mouseY);
    }

    _closeSelection() {
        this.isSelectionActive = false;
        this.pendingConfirm = null;
        this._confirmYesBounds = null;
        this._confirmNoBounds = null;
        window.removeEventListener('mousedown', this._clickHandler);
    }

    _triggerNextPhaseIfNeeded() {
        if (this.selectionQueue.length > 0) {
            const nextMode = this.selectionQueue.shift();
            this.pendingLevelUps = this.selectionQueue.filter(m => m === 'UPGRADES').length;
            this.nextPhaseTimeout = setTimeout(() => {
                this.nextPhaseTimeout = null;
                this.showSelection(nextMode);
            }, 150);
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

    _executeSelection(selectedId, confirmed = false) {
        const droneMgr = this.game.getModule('drones');
        const player = this.game.getModule('player');
        const hackMgr = this.game.getModule('hack');

        if (!confirmed && selectedId) {
            if (this.selectionMode === 'DRONES' && DRONE_TYPES[selectedId] && droneMgr && player) {
                const maxDrones = player.stats.maxDrones || 1;
                if (droneMgr.drones.length >= maxDrones) {
                    const oldest = droneMgr.drones[0];
                    const oldestName = oldest?.name || 'oldest drone';
                    this.pendingConfirm = {
                        selectedId,
                        title: 'OVERWRITE DRONE?',
                        message: `Drone slots full (${droneMgr.drones.length}/${maxDrones}). Installing ${DRONE_TYPES[selectedId].name} will replace ${oldestName}.`
                    };
                    return;
                }
            } else if (this.selectionMode === 'UPGRADES' && hackMgr && player) {
                const upg = UPGRADES.find(u => u.id === selectedId);
                if (upg && upg.unlockHackId && !hackMgr.unlockedHacks.includes(upg.unlockHackId)) {
                    const maxHacks = player.stats.maxHackSlots || 1;
                    if (hackMgr.unlockedHacks.length >= maxHacks) {
                        const oldestHackId = hackMgr.unlockedHacks[0];
                        const oldestUpg = UPGRADES.find(u => u.unlockHackId === oldestHackId);
                        const oldestHackName = oldestUpg ? oldestUpg.name : oldestHackId;
                        this.pendingConfirm = {
                            selectedId,
                            title: 'OVERWRITE HACK?',
                            message: `Hack slots full (${hackMgr.unlockedHacks.length}/${maxHacks}). Installing ${upg.name} will replace ${oldestHackName}.`
                        };
                        return;
                    }
                }
            }
        }

        if (selectedId) {
            if (this.selectionMode === 'UPGRADES') {
                this.applyUpgrade(selectedId);
            } else {
                const isDrone = DRONE_TYPES[selectedId] !== undefined;
                
                if (isDrone) {
                    if (droneMgr) {
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
        if (this.pendingConfirm) {
            this._drawOverwriteConfirmModal(ctx, width, height);
        }
    }

    _drawOverwriteConfirmModal(ctx, width, height) {
        const modal = this.pendingConfirm;
        if (!modal) return;
        const menu = this.game.getModule('menu');
        const pointer = this.game.getModule('input')?.getPointer();

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.fillRect(0, 0, width, height);

        const mw = Math.min(540, width - 40);
        const mh = 210;
        const mx = (width - mw) / 2;
        const my = (height - mh) / 2;

        ctx.fillStyle = 'rgba(10, 14, 24, 0.98)';
        ctx.fillRect(mx, my, mw, mh);
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(mx, my, mw, mh);

        ctx.fillStyle = '#ff5555';
        ctx.font = 'bold 26px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(modal.title, width / 2, my + 40);

        ctx.fillStyle = '#e0f0f5';
        ctx.font = '20px "VT323", monospace';
        const words = (modal.message || '').split(' ');
        const lines = [];
        let cur = '';
        for (const word of words) {
            const test = cur ? `${cur} ${word}` : word;
            if (ctx.measureText(test).width > mw - 56 && cur) {
                lines.push(cur);
                cur = word;
            } else {
                cur = test;
            }
        }
        if (cur) lines.push(cur);
        lines.slice(0, 3).forEach((line, i) => {
            ctx.fillText(line, width / 2, my + 82 + i * 24);
        });

        const btnW = 190;
        const btnH = 44;
        const gap = 24;
        const btnY = my + mh - btnH - 22;
        const yesX = width / 2 - btnW - gap / 2;
        const noX = width / 2 + gap / 2;

        this._confirmYesBounds = { x: yesX, y: btnY, w: btnW, h: btnH };
        this._confirmNoBounds = { x: noX, y: btnY, w: btnW, h: btnH };

        const yesHover = pointer && pointer.x >= yesX && pointer.x <= yesX + btnW && pointer.y >= btnY && pointer.y <= btnY + btnH;
        const noHover = pointer && pointer.x >= noX && pointer.x <= noX + btnW && pointer.y >= btnY && pointer.y <= btnY + btnH;

        if (menu && menu.drawButton) {
            menu.drawButton(ctx, yesX, btnY, btnW, btnH, 'OVERWRITE', yesHover, 'danger');
            menu.drawButton(ctx, noX, btnY, btnW, btnH, 'CANCEL', noHover, 'default');
        } else {
            ctx.fillStyle = yesHover ? '#882222' : '#441111';
            ctx.fillRect(yesX, btnY, btnW, btnH);
            ctx.strokeStyle = '#ff4444';
            ctx.strokeRect(yesX, btnY, btnW, btnH);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px "VT323", monospace';
            ctx.fillText('OVERWRITE', yesX + btnW / 2, btnY + btnH / 2);

            ctx.fillStyle = noHover ? '#224444' : '#112222';
            ctx.fillRect(noX, btnY, btnW, btnH);
            ctx.strokeStyle = '#00ffcc';
            ctx.strokeRect(noX, btnY, btnW, btnH);
            ctx.fillStyle = '#ffffff';
            ctx.fillText('CANCEL', noX + btnW / 2, btnY + btnH / 2);
        }

        ctx.restore();
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
        this._drawCardText(ctx, item, x, y, cardW, cardH);
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
        const droneMgr = this.game && this.game.getModule('drones');
        const sprite = item.sprite && droneMgr && droneMgr.sprites ? droneMgr.sprites.get(item.id) : null;
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            ctx.drawImage(sprite, px + 6, py + 6, size - 12, size - 12);
        } else {
            const fonts = this._getMenuFonts();
            const smallScale = Math.max(1.0, Math.min(2.0, Number(this.game?.settings?.ui?.smallTextScale ?? 1)));
            const iconSize = Math.round(this._getFontSize(fonts.cardIcon, 10) * smallScale);
            ctx.fillStyle = '#333'; ctx.font = this._scaleFont(fonts.cardIcon, iconSize); ctx.textAlign = 'center';
            ctx.fillText('NO_DATA', x + cardW / 2, py + size / 2 + 4, size - 8);
        }
    }

    _drawCardText(ctx, item, x, y, cardW, cardH = 320) {
        const fonts = this._getMenuFonts();
        const centerX = x + cardW / 2;
        const maxTitleW = cardW - 24;
        const baseTitleFont = fonts.cardTitle || fonts.cardName || 'bold 24px "VT323", monospace';
        const titleFit = this._fitTextLines(ctx, (item.name || '').toUpperCase(), baseTitleFont, maxTitleW, 2, 16);
        const titleLineH = Math.max(16, Math.round(titleFit.size * 0.92));
        const titleStartY = titleFit.lines.length > 1 ? y + 126 : y + 140;

        ctx.fillStyle = '#fff';
        ctx.font = titleFit.font;
        ctx.textAlign = 'center';
        titleFit.lines.forEach((line, i) => {
            ctx.fillText(line, centerX, titleStartY + i * titleLineH, maxTitleW);
        });

        const titleBottomY = titleStartY + Math.max(0, titleFit.lines.length - 1) * titleLineH;
        const descStartY = Math.max(y + 174, titleBottomY + 26);
        const descMaxY = item.requirementText ? (y + cardH - 60) : (y + cardH - 36);
        const maxDescW = cardW - 32;
        const baseDescFont = fonts.cardDescription || '20px "VT323", monospace';
        const baseDescSize = this._getFontSize(baseDescFont, 20);

        let chosenDescFont = baseDescFont;
        let chosenLineH = 16;
        let chosenLines = [];
        for (let size = baseDescSize; size >= 13; size -= 1) {
            chosenDescFont = this._scaleFont(baseDescFont, size);
            ctx.font = chosenDescFont;
            chosenLineH = Math.max(12, Math.round(size * 0.85));
            chosenLines = this._wrapLines(ctx, item.description || '', maxDescW);
            const endY = descStartY + Math.max(0, chosenLines.length - 1) * chosenLineH;
            const allFitW = chosenLines.every(line => ctx.measureText(line).width <= maxDescW);
            if ((endY <= descMaxY && allFitW) || size === 13) {
                break;
            }
        }

        ctx.font = chosenDescFont;
        ctx.fillStyle = '#aaa';
        chosenLines.forEach((line, i) => {
            ctx.fillText(line, centerX, descStartY + i * chosenLineH, cardW - 24);
        });
    }

    _drawCardFooter(ctx, item, x, y, cardW, cardH, mainColor) {
        const fonts = this._getMenuFonts();
        const maxFooterW = cardW - 24;
        const smallScale = Math.max(1.0, Math.min(2.0, Number(this.game?.settings?.ui?.smallTextScale ?? 1)));
        if (item.requirementText) {
            const reqSize = Math.round(this._getFontSize(fonts.cardRequirement, 10) * smallScale);
            ctx.save(); ctx.font = this._scaleFont(fonts.cardRequirement, reqSize); ctx.fillStyle = '#ffcc00'; ctx.textAlign = 'center';
            ctx.shadowBlur = 5; ctx.shadowColor = '#ffcc00';
            ctx.fillText(item.requirementText.toUpperCase(), x + cardW / 2, y + cardH - 45, maxFooterW);
            ctx.restore();
        }
        
        const footerSize = Math.round(this._getFontSize(fonts.cardFooter, 16) * Math.min(1.65, smallScale));
        ctx.save(); 
        ctx.fillStyle = mainColor; 
        ctx.font = this._scaleFont(fonts.cardFooter, footerSize); 
        ctx.textAlign = 'center';
        ctx.shadowBlur = 8; 
        ctx.shadowColor = mainColor;
        
        let label = 'SYSTEM MODULE';
        if (item.rarity && item.targetBehaviors) {
            label = `${item.rarity.toUpperCase()} • ${item.targetBehaviors.join(' & ').toUpperCase()}`;
        } else if (item.rarity) {
            label = item.rarity.toUpperCase();
        } else if (item.behavior) {
            label = `TYPE: ${item.behavior.toUpperCase()}`;
        } else if (item.targetBehaviors) {
            label = `TYPE: ${item.targetBehaviors.join(' & ').toUpperCase()}`;
        }

        ctx.fillText(label, x + cardW / 2, y + cardH - 20, maxFooterW);
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

    _getFontSize(fontStr, fallback = 20) {
        const match = /(\d+(?:\.\d+)?)px/.exec(fontStr || '');
        return match ? parseFloat(match[1]) : fallback;
    }

    _scaleFont(fontStr, targetSize) {
        if (!fontStr) return `${targetSize}px "VT323", monospace`;
        return /(\d+(?:\.\d+)?)px/.test(fontStr)
            ? fontStr.replace(/(\d+(?:\.\d+)?)px/, `${targetSize}px`)
            : fontStr;
    }

    _wrapLines(ctx, text, maxWidth) {
        const words = String(text || '').trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return [''];
        const lines = [];
        let line = words[0];
        for (let i = 1; i < words.length; i++) {
            const testLine = `${line} ${words[i]}`;
            if (ctx.measureText(testLine).width > maxWidth) {
                lines.push(line);
                line = words[i];
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        return lines;
    }

    _fitTextLines(ctx, text, baseFont, maxWidth, maxLines = 2, minSize = 14) {
        const baseSize = this._getFontSize(baseFont, 24);
        for (let size = baseSize; size >= minSize; size -= 2) {
            const font = this._scaleFont(baseFont, size);
            ctx.font = font;
            const lines = this._wrapLines(ctx, text, maxWidth);
            const allFitWidth = lines.every(line => ctx.measureText(line).width <= maxWidth);
            if (lines.length <= maxLines && allFitWidth) {
                return { font, size, lines };
            }
        }
        const fallbackFont = this._scaleFont(baseFont, minSize);
        ctx.font = fallbackFont;
        return { font: fallbackFont, size: minSize, lines: this._wrapLines(ctx, text, maxWidth) };
    }

    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const lines = this._wrapLines(ctx, text, maxWidth);
        lines.forEach((line, idx) => {
            ctx.fillText(line, x + maxWidth / 2, y + idx * lineHeight, maxWidth);
        });
    }
}