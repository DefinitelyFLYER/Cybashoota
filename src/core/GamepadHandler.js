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
    }
}