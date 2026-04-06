/**
 * GamepadHandler.js - Podpora pro Xbox a DualSense
 */
export default class GamepadHandler {
    constructor() {
        this.gamepadIndex = null;
        this.axes = [0, 0, 0, 0]; // [LX, LY, RX, RY]
        this.buttons = {};
        
        window.addEventListener("gamepadconnected", (e) => {
            console.log("Gamepad připojen:", e.gamepad.id);
            this.gamepadIndex = e.gamepad.index;
        });

        window.addEventListener("gamepaddisconnected", () => {
            console.log("Gamepad odpojen");
            this.gamepadIndex = null;
        });
    }

    update() {
        if (this.gamepadIndex === null) return;

        const gp = navigator.getGamepads()[this.gamepadIndex];
        if (!gp) return;

        // Páčky (Xbox i DualSense mají obvykle indexy 0,1 a 2,3)
        // Deadzone 0.1 zabrání samovolnému pohybu při opotřebených páčkách
        this.axes = gp.axes.map(a => Math.abs(a) < 0.1 ? 0 : a);

        // Tlačítka (RT/R2 je obvykle index 7)
        this.buttons.RT = gp.buttons[7].pressed;
        this.buttons.A = gp.buttons[0].pressed; // Pro budoucí dash
    }
}