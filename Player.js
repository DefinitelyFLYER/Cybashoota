/**
 * Player.js - Modul hráče
 */
export default class Player {
    constructor(x, y) {
        this.pos = { x: x, y: y };
        this.speed = 0.3; // Rychlost pohybu
        this.size = 64;   // Velikost v pixelech (64x64)
        
        // Příprava obrázku
        this.sprite = new Image();
        this.sprite.src = 'player.png'; // Sem vložíš svůj soubor
        this.isLoaded = false;

        this.sprite.onload = () => {
            this.isLoaded = true;
        };
    }

    init(game) {
        this.game = game;
        console.log("Player module linked to Core.");
    }

    update(deltaTime) {
        /** 
         * Tady bude logika pohybu. 
         * Zatím necháme prázdné, dokud nevytvoříme InputHandler.
         */
    }

    draw(ctx) {
        if (this.isLoaded) {
            // Vykreslení tvého obrázku
            ctx.drawImage(this.sprite, this.pos.x, this.pos.y, this.size, this.size);
        } else {
            // Záložní zobrazení (neonový čtverec), dokud se obrázek nenačte
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x, this.pos.y, this.size, this.size);
            ctx.fillStyle = 'rgba(0, 255, 204, 0.2)';
            ctx.fillRect(this.pos.x, this.pos.y, this.size, this.size);
        }
    }
}