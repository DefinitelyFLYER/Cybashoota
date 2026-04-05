/**
 * InputHandler.js - Sledování klávesnice
 */
export default class InputHandler {
    constructor() {
        this.keys = {}; // Mapa stisknutých kláves

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

    // Pomocná metoda pro kontrolu, zda je klávesa dole
    isKeyDown(keyCode) {
        return this.keys[keyCode] === true;
    }
}