export default class InputHandler {
    constructor() {
        this.keys = {};
        this.mouseButtons = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        this.isHackPressed = false;
        this.isHackCyclePressed = false;
        this.lastMouseMoveTime = 0;

        window.addEventListener('keydown', (e) => {
            const hackBinding = this._getActionBinding('hack');
            const hackCycleBinding = this._getActionBinding('hackCycle');

            if (e.code === hackBinding) {
                this.isHackPressed = true;
            }
            if (e.code === hackCycleBinding) {
                this.isHackCyclePressed = true;
            }

            this.keys[e.code] = true;
        });

        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            const hackBinding = this._getActionBinding('hack');
            const hackCycleBinding = this._getActionBinding('hackCycle');

            if (e.code === hackBinding) {
                this.isHackPressed = false;
            }
            if (e.code === hackCycleBinding) {
                this.isHackCyclePressed = false;
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
            this.isMouseDown = e.button === 0;

            if (this._getActionBinding('hack') === buttonKey) {
                this.isHackPressed = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            const buttonKey = `Mouse${e.button}`;
            this.mouseButtons[buttonKey] = false;
            this.isMouseDown = false;

            if (this._getActionBinding('hack') === buttonKey) {
                this.isHackPressed = false;
            }
        });
    }

    init(game) {
        this.game = game;
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