export default class InputHandler {
    constructor() {
        this.keys = {};
        this.mouseButtons = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        this.isHackPressed = false;
        this.isHackCyclePressed = false;
        this.isUltimatePressed = false;
        this.lastMouseMoveTime = 0;
        this.wheelDeltaY = 0;

        window.addEventListener('keydown', (e) => {
            const hackBinding = this._getActionBinding('hack');
            const hackCycleBinding = this._getActionBinding('hackCycle');
            const ultimateBinding = this._getActionBinding('setUltimate');

            if (e.code === hackBinding) {
                this.isHackPressed = true;
            }
            if (e.code === hackCycleBinding) {
                this.isHackCyclePressed = true;
            }
            if (e.code === ultimateBinding) {
                this.isUltimatePressed = true;
            }

            this.keys[e.code] = true;
        });

        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            const hackBinding = this._getActionBinding('hack');
            const hackCycleBinding = this._getActionBinding('hackCycle');
            const ultimateBinding = this._getActionBinding('setUltimate');

            if (e.code === hackBinding) {
                this.isHackPressed = false;
            }
            if (e.code === hackCycleBinding) {
                this.isHackCyclePressed = false;
            }
            if (e.code === ultimateBinding) {
                this.isUltimatePressed = false;
            }
            this.keys[e.code] = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.lastMouseMoveTime = Date.now();
        });

        window.addEventListener('mousedown', (e) => {
            const buttonKey = `Mouse${e.button}`;
            this.mouseButtons[buttonKey] = true;
            if (e.button === 0) {
                this.isMouseDown = true;
            }

            if (this._getActionBinding('hack') === buttonKey) {
                this.isHackPressed = true;
            }
            if (this._getActionBinding('hackCycle') === buttonKey) {
                this.isHackCyclePressed = true;
            }
            if (this._getActionBinding('setUltimate') === buttonKey) {
                this.isUltimatePressed = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            const buttonKey = `Mouse${e.button}`;
            this.mouseButtons[buttonKey] = false;
            if (e.button === 0) {
                this.isMouseDown = false;
            }

            if (this._getActionBinding('hack') === buttonKey) {
                this.isHackPressed = false;
            }
            if (this._getActionBinding('hackCycle') === buttonKey) {
                this.isHackCyclePressed = false;
            }
            if (this._getActionBinding('setUltimate') === buttonKey) {
                this.isUltimatePressed = false;
            }
        });

        window.addEventListener('blur', () => {
            this.keys = {};
            this.mouseButtons = {};
            this.isMouseDown = false;
            this.isHackPressed = false;
            this.isHackCyclePressed = false;
            this.isUltimatePressed = false;
        });
    }

    init(game) {
        this.game = game;
    }

    handleWheelEvent(e) {
        if (!e || typeof e.deltaY !== 'number') return;
        if (this.game && this.game.settingsOpen) {
            e.preventDefault();
        }
        this.wheelDeltaY += e.deltaY;
    }

    consumeWheelDelta() {
        const delta = this.wheelDeltaY;
        this.wheelDeltaY = 0;
        return delta;
    }

    _getActionBinding(action) {
        return this.game?.settings?.controls?.[action] ?? null;
    }

    isKeyDown(keyCode) {
        return this.keys[keyCode] === true;
    }

    isMouseButtonDown(buttonKey) {
        return this.mouseButtons[buttonKey] === true;
    }

    isActionDown(action) {
        const binding = this._getActionBinding(action);
        if (!binding) return false;
        if (binding.startsWith('Mouse')) {
            return this.mouseButtons[binding] === true;
        }
        return this.keys[binding] === true;
    }
}