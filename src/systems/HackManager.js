export default class HackManager {
    constructor() {
        this.HACK_TYPES = {
            OVERLOAD: {
                id: 'OVERLOAD',
                name: 'System Overload',
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
            }
        };

        this.activeHack = this.HACK_TYPES.OVERLOAD.id;
        this.unlockedHacks = [this.HACK_TYPES.OVERLOAD.id];

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
