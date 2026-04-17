import { HACK_DATA, HACK_UNLOCKED, GLITCH_PHASES } from '../data/HackData.js';

export default class HackManager {
    constructor() {
        this.HACK_TYPES = {
            [HACK_DATA.OVERLOAD.id]: {
                id: HACK_DATA.OVERLOAD.id,
                name: HACK_DATA.OVERLOAD.name,
                execute: (game) => {
                    const enemyManager = game.getModule('enemies');
                    if (!enemyManager || !enemyManager.enemies) return false;

                    for (const enemy of enemyManager.enemies) {
                        enemy.currentHp = Math.max(0, (enemy.currentHp || 0) - 5);
                        enemy.speedModifier = 0.2;
                        enemy.hackDebuffTimer = 5000;
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
                    const player = game.getModule('player');
                    if (!enemyManager || !enemyManager.enemies || enemyManager.enemies.length === 0 || !input || !player) return false;

                    const mouseX = input.mouseX || 0;
                    const mouseY = input.mouseY || 0;
                    let closestEnemy = null;
                    let closestDistance = Infinity;

                    for (const enemy of enemyManager.enemies) {
                        if (enemy.currentHp <= 0) continue;

                        const screenX = enemy.x - player.pos.x + game.center.x;
                        const screenY = enemy.y - player.pos.y + game.center.y;
                        const dx = screenX - mouseX;
                        const dy = screenY - mouseY;
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
                    setTimeout(() => {
                        if (game) game.isSignalJammed = false;
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

        this.activeHack = HACK_DATA.OVERLOAD.id;
        this.unlockedHacks = HACK_UNLOCKED;

        this.currentCharges = 1;
        this.maxCharges = 1;
        this.cooldownTimer = 0;
        this.cooldownDuration = 10000;
    }

    init(game) {
        this.game = game;
    }

    update(deltaTime) {
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
            const currentIndex = this.unlockedHacks.indexOf(this.activeHack);
            const nextIndex = (currentIndex + 1) % this.unlockedHacks.length;
            this.activeHack = this.unlockedHacks[nextIndex];
        }

        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= deltaTime;
            if (this.cooldownTimer <= 0) {
                this.cooldownTimer = 0;
                this.currentCharges = Math.min(this.maxCharges, this.currentCharges + 1);
            }
        }
    }

    executeHack() {
        if (this.currentCharges <= 0 || !this.activeHack) {
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

        this.currentCharges -= 1;
        this.cooldownTimer = this.cooldownDuration;
        return true;
    }
}
