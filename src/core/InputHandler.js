export default class InputHandler {
    constructor() {
        this.keys = {};

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    init(game) {
        this.game = game;
    }

    isKeyDown(keyCode) {
        return this.keys[keyCode] === true;
    }
}