/**
 * Background.js - Finální verze bez zdvojování čar
 */
export default class Background {
    constructor() {
        this.gridSize = 100;
    }

    init(game) {
        this.game = game;
    }

    update(deltaTime) {
        // Update necháváme prázdný, vše se počítá v draw pro maximální plynulost
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        if (!player) return;

        const w = this.game.canvas.width;
        const h = this.game.canvas.height;
        const centerX = this.game.center.x;
        const centerY = this.game.center.y;

        ctx.save();
        
        // Velmi jemná barva, aby mřížka nebyla agresivní
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.1)'; 
        ctx.lineWidth = 1;

        // --- KLÍČOVÁ ČÁST ---
        // Vypočítáme, kde ve světě (v pixelech) začíná naše obrazovka.
        // Math.floor zajistí, že se souřadnice "nepohupují" mezi pixely.
        const viewX = Math.floor(player.pos.x - centerX);
        const viewY = Math.floor(player.pos.y - centerY);

        // Najdeme souřadnici první čáry, která je vlevo/nahoře těsně mimo obrazovku
        const startX = Math.floor(viewX / this.gridSize) * this.gridSize;
        const startY = Math.floor(viewY / this.gridSize) * this.gridSize;

        ctx.beginPath();

        // Svislé čáry
        // Kreslíme od startX až po pravý okraj obrazovky (+ rezerva gridSize)
        for (let x = startX; x <= viewX + w + this.gridSize; x += this.gridSize) {
            // Převod ze světa na obrazovku (worldX - viewX)
            const screenX = Math.round(x - viewX);
            // +0.5 zajistí, že 1px čára bude ostrá a nebude se "rozpíjet" do dvou pixelů
            ctx.moveTo(screenX + 0.5, 0);
            ctx.lineTo(screenX + 0.5, h);
        }

        // Vodorovné čáry
        for (let y = startY; y <= viewY + h + this.gridSize; y += this.gridSize) {
            const screenY = Math.round(y - viewY);
            ctx.moveTo(0, screenY + 0.5);
            ctx.lineTo(w, screenY + 0.5);
        }

        ctx.stroke(); // Vykreslíme vše najednou (jeden tah štětcem)
        ctx.restore();
    }
}