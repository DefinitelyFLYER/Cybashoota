export default class GamepadHandler {
    constructor() {
        this.gamepadIndex = null;
        this.axes = [0, 0, 0, 0];
        this.buttons = { RT: false };
        
        window.addEventListener("gamepadconnected", (e) => {
            this.gamepadIndex = e.gamepad.index;
        });
    }

    update() {
        if (this.gamepadIndex === null) return;
        // Získání aktuálního stavu z prohlížeče
        const gp = navigator.getGamepads()[this.gamepadIndex];
        if (!gp) return;

        this.axes = [gp.axes[0], gp.axes[1], gp.axes[2], gp.axes[3]];
        // RT je většinou index 7 u Xbox i DualSense
        this.buttons.RT = gp.buttons[7].pressed;
    }
}