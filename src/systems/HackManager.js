export default class HackManager {
    constructor() {
        this.HACK_TYPES = {
            OVERLOAD: 'OVERLOAD'
        };

        this.activeHack = this.HACK_TYPES.OVERLOAD;
        this.unlockedHacks = [this.HACK_TYPES.OVERLOAD];

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
        if (input && input.isHackPressed) {
            this.executeHack();
            input.isHackPressed = false;
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

        if (this.activeHack === this.HACK_TYPES.OVERLOAD) {
            const enemyManager = this.game.getModule('enemies');
            if (!enemyManager || !enemyManager.enemies) return false;

            for (const enemy of enemyManager.enemies) {
                enemy.currentHp = Math.max(0, (enemy.currentHp || 0) - 5);
                enemy.speedModifier = 0.2;
                enemy.hackDebuffTimer = 5000;
            }
        }

        this.currentCharges -= 1;
        this.cooldownTimer = this.cooldownDuration;
        return true;
    }
}
