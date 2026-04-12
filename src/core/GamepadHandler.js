export default class GamepadHandler {
    constructor() {
        this.gamepadIndex = null;
        this.axes = [0, 0, 0, 0];
        this.buttons = {
            RT: false,
            A: false,
            B: false,
            X: false,
            Y: false,
            up: false,
            down: false,
            left: false,
            right: false
        };
        this.lastButtons = { ...this.buttons };
        this.justPressed = { ...this.buttons };
        
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepadIndex = e.gamepad.index;
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
            }
        });
    }

    update() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

        if (this.gamepadIndex === null) {
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i]) {
                    this.gamepadIndex = i;
                    break;
                }
            }
        }

        const gp = this.gamepadIndex !== null ? gamepads[this.gamepadIndex] : null;
        if (!gp) {
            this.axes = [0, 0, 0, 0];
            this.buttons.RT = false;
            this.buttons.A = false;
            this.buttons.B = false;
            this.buttons.X = false;
            this.buttons.Y = false;
            this.buttons.up = false;
            this.buttons.down = false;
            this.buttons.left = false;
            this.buttons.right = false;
            this.justPressed = { ...this.buttons };
            this.lastButtons = { ...this.buttons };
            return;
        }

        this.axes[0] = gp.axes[0] || 0;
        this.axes[1] = gp.axes[1] || 0;
        this.axes[2] = gp.axes[2] || 0;
        this.axes[3] = gp.axes[3] || 0;

        this.buttons.RT = gp.buttons[7] ? gp.buttons[7].pressed : false;
        this.buttons.A = gp.buttons[0] ? gp.buttons[0].pressed : false;
        this.buttons.B = gp.buttons[1] ? gp.buttons[1].pressed : false;
        this.buttons.X = gp.buttons[2] ? gp.buttons[2].pressed : false;
        this.buttons.Y = gp.buttons[3] ? gp.buttons[3].pressed : false;
        this.buttons.up = gp.buttons[12] ? gp.buttons[12].pressed : false;
        this.buttons.down = gp.buttons[13] ? gp.buttons[13].pressed : false;
        this.buttons.left = gp.buttons[14] ? gp.buttons[14].pressed : false;
        this.buttons.right = gp.buttons[15] ? gp.buttons[15].pressed : false;

        this.justPressed.RT = this.buttons.RT && !this.lastButtons.RT;
        this.justPressed.A = this.buttons.A && !this.lastButtons.A;
        this.justPressed.B = this.buttons.B && !this.lastButtons.B;
        this.justPressed.X = this.buttons.X && !this.lastButtons.X;
        this.justPressed.Y = this.buttons.Y && !this.lastButtons.Y;
        this.justPressed.up = this.buttons.up && !this.lastButtons.up;
        this.justPressed.down = this.buttons.down && !this.lastButtons.down;
        this.justPressed.left = this.buttons.left && !this.lastButtons.left;
        this.justPressed.right = this.buttons.right && !this.lastButtons.right;

        this.lastButtons = { ...this.buttons };
    }
}