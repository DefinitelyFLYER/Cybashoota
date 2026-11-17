import { HACK_DATA, getUnlockedHackIds, resetHacks, GLITCH_PHASES } from '../data/HackData.js';

export default class HackManager {
    constructor() {
        this.signalJammerTimeout = null;
        this.HACK_TYPES = {
            [HACK_DATA.OVERLOAD.id]: {
                id: HACK_DATA.OVERLOAD.id,
                name: HACK_DATA.OVERLOAD.name,
                execute: (game) => {
                    const enemyManager = game.getModule('enemies');
                    if (!enemyManager || !enemyManager.enemies) return false;

                    for (const enemy of enemyManager.enemies) {
                        enemy.currentHp = Math.max(0, (enemy.currentHp || 0) - 5);
                        enemy.speedModifier = 0.3;
                        enemy.hackDebuffTimer = 4000;
                    }

                    return true;
                }
            },
            [HACK_DATA.GLITCH_EM.id]: {
                id: HACK_DATA.GLITCH_EM.id,
                name: HACK_DATA.GLITCH_EM.name,
                execute: (game) => {
                    const enemyManager = game.getModule('enemies');
                    const input = game.getModule('input');
                    const proj = game.getModule('projectiles');
                    const player = game.getModule('player');
                    if (!enemyManager || !enemyManager.enemies || enemyManager.enemies.length === 0 || !input || !player) return false;

                    const targetX = proj && typeof proj.crosshairX === 'number' ? proj.crosshairX : (input.mouseX || 0);
                    const targetY = proj && typeof proj.crosshairY === 'number' ? proj.crosshairY : (input.mouseY || 0);
                    let closestEnemy = null;
                    let closestDistance = Infinity;

                    for (const enemy of enemyManager.enemies) {
                        if (enemy.currentHp <= 0) continue;

                        const screenX = enemy.x - player.pos.x + game.center.x;
                        const screenY = enemy.y - player.pos.y + game.center.y;
                        const dx = screenX - targetX;
                        const dy = screenY - targetY;
                        const distance = dx * dx + dy * dy;

                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestEnemy = enemy;
                        }
                    }

                    if (!closestEnemy) return false;
                    closestEnemy.glitchPhase = GLITCH_PHASES.PRIMARY;
                    return true;
                }
            },
            [HACK_DATA.SIGNAL_JAMMER.id]: {
                id: HACK_DATA.SIGNAL_JAMMER.id,
                name: HACK_DATA.SIGNAL_JAMMER.name,
                execute: (game) => {
                    if (!game) return false;
                    const projectileManager = game.getModule('projectiles');
                    if (projectileManager) {
                        projectileManager.projectiles = [];
                        projectileManager.enemyProjectiles = [];
                    }
                    game.isSignalJammed = true;
                    if (this.signalJammerTimeout) {
                        clearTimeout(this.signalJammerTimeout);
                    }
                    this.signalJammerTimeout = setTimeout(() => {
                        if (game) game.isSignalJammed = false;
                        this.signalJammerTimeout = null;
                    }, HACK_DATA.SIGNAL_JAMMER.durationMs);
                    return true;
                }
            },
            [HACK_DATA.GHOST_PROTOCOL.id]: {
                id: HACK_DATA.GHOST_PROTOCOL.id,
                name: HACK_DATA.GHOST_PROTOCOL.name,
                execute: (game) => {
                    const player = game.getModule('player');
                    if (!player) return false;

                    player.ghostActive = true;
                    player.ghostTimer = HACK_DATA.GHOST_PROTOCOL.durationMs;
                    return true;
                }
            }
        };

        this.unlockedHacks = getUnlockedHackIds();
        this.activeHack = this.unlockedHacks.length > 0 ? this.unlockedHacks[0] : null;

        this.cooldownTimer = 0;
        this.cooldownDuration = 20000;
    }

    init(game) {
        this.game = game;
    }

    reset() {
        resetHacks();
        this.unlockedHacks = [];
        this.activeHack = null;
        this.cooldownTimer = 0;
        if (this.signalJammerTimeout) {
            clearTimeout(this.signalJammerTimeout);
            this.signalJammerTimeout = null;
        }
    }

    unlockHack(hackId) {
        if (!HACK_DATA[hackId]) return;

        const player = this.game?.getModule('player');
        const maxSlots = player ? Math.max(1, Math.floor(player.getStat('maxHackSlots'))) : 1;

        if (!this.unlockedHacks.includes(hackId)) {
            while (this.unlockedHacks.length >= maxSlots && this.unlockedHacks.length > 0) {
                const replaceIdx = this.activeHack && this.unlockedHacks.includes(this.activeHack)
                    ? this.unlockedHacks.indexOf(this.activeHack)
                    : 0;
                const removedId = this.unlockedHacks.splice(replaceIdx, 1)[0];
                if (HACK_DATA[removedId]) {
                    HACK_DATA[removedId].unlocked = false;
                }
                this._clearUnlockUpgradeFromInventory(removedId);
            }
            this.unlockedHacks.push(hackId);
        }

        HACK_DATA[hackId].unlocked = true;
        this.activeHack = hackId;
    }

    removeHack(hackId) {
        const idx = this.unlockedHacks.indexOf(hackId);
        if (idx === -1) return false;

        this.unlockedHacks.splice(idx, 1);
        if (HACK_DATA[hackId]) {
            HACK_DATA[hackId].unlocked = false;
        }
        this._clearUnlockUpgradeFromInventory(hackId);

        if (this.activeHack === hackId) {
            this.activeHack = this.unlockedHacks.length > 0 ? this.unlockedHacks[0] : null;
        }
        return true;
    }

    _clearUnlockUpgradeFromInventory(hackId) {
        const upgrades = this.game?.getModule('upgrades');
        if (!upgrades || !upgrades.inventory) return;
        const map = {
            OVERLOAD: 'unlock_overload',
            GLITCH_EM: 'unlock_glitch_em',
            SIGNAL_JAMMER: 'unlock_signal_jammer',
            GHOST_PROTOCOL: 'unlock_ghost_protocol'
        };
        const upgId = map[hackId];
        if (upgId && upgrades.inventory[upgId]) {
            delete upgrades.inventory[upgId];
        }
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        if (player) {
            const maxSlots = Math.max(1, Math.floor(player.getStat('maxHackSlots')));
            while (this.unlockedHacks.length > maxSlots) {
                const removedId = this.unlockedHacks.pop();
                if (HACK_DATA[removedId]) {
                    HACK_DATA[removedId].unlocked = false;
                }
                this._clearUnlockUpgradeFromInventory(removedId);
            }
            if (this.unlockedHacks.length > 0) {
                if (!this.unlockedHacks.includes(this.activeHack)) {
                    this.activeHack = this.unlockedHacks[0];
                }
            } else {
                this.activeHack = null;
            }
        }

        const input = this.game.getModule('input');
        const gamepad = this.game.getModule('gamepad');
        const hackPressed = (input && input.isHackPressed) || (gamepad && gamepad.justPressed && gamepad.justPressed.X);
        const cyclePressed = (input && input.isHackCyclePressed) || (gamepad && gamepad.justPressed && gamepad.justPressed.Y);

        if (hackPressed) {
            this.executeHack();
            if (input) input.isHackPressed = false;
        }

        if (cyclePressed) {
            if (input) input.isHackCyclePressed = false;
            if (this.unlockedHacks.length > 0) {
                const currentIndex = this.unlockedHacks.indexOf(this.activeHack);
                const nextIndex = (currentIndex + 1) % this.unlockedHacks.length;
                this.activeHack = this.unlockedHacks[nextIndex];
            }
        }

        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= deltaTime;
            if (this.cooldownTimer <= 0) {
                this.cooldownTimer = 0;
            }
        }
    }

    executeHack() {
        if (this.cooldownTimer > 0 || !this.activeHack) {
            return false;
        }

        const hack = this.HACK_TYPES[this.activeHack];
        if (!hack || typeof hack.execute !== 'function') {
            return false;
        }

        const result = hack.execute(this.game);
        if (!result) {
            return false;
        }

        const augmentMgr = this.game?.getModule('augments');
        const cdMulti = augmentMgr ? augmentMgr.getHackCooldownMultiplier() : 1.0;
        this.cooldownTimer = this.cooldownDuration * cdMulti;
        if (augmentMgr) {
            augmentMgr.onHackExecuted();
        }
        return true;
    }
}
