export default class InputHandler {
    constructor() {
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        this.isHackPressed = false;
        this.isHackCyclePressed = false;
        this.lastMouseMoveTime = 0;

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.isHackPressed = true;
            }
            if (e.code === 'KeyQ') {
                this.isHackCyclePressed = true;
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.isHackPressed = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.lastMouseMoveTime = Date.now();
        });

        window.addEventListener('mousedown', () => {
            this.isMouseDown = true;
        });

        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });
    }

    init(game) {
        this.game = game;
    }

    isKeyDown(keyCode) {
        return this.keys[keyCode] === true;
    }
}