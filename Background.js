/**
 * Background.js - Nekonečná cyberpunková mřížka
 */
export default class Background {
    constructor() {
        this.gridSize = 100; // Velikost jednoho čtverce mřížky
        this.offsetX = 0;
        this.offsetY = 0;
    }

    init(game) {
        this.game = game;
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return;

        // Offset je přesný zbytek po dělení pozice hráče velikostí mřížky
        // Musíme odečíst pozici od středu, aby mřížka lícovala
        this.offsetX = (this.game.center.x - player.pos.x) % this.gridSize;
        this.offsetY = (this.game.center.y - player.pos.y) % this.gridSize;
    }

    draw(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

        ctx.save();
        // Barva s nižší alpha, aby tolik nerušila
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.1)'; 
        ctx.lineWidth = 1;

        // Musíme zaokrouhlit offsety na celá čísla
        const offX = Math.floor(this.offsetX);
        const offY = Math.floor(this.offsetY);

        // Svislé čáry
        for (let x = offX; x < w; x += this.gridSize) {
            ctx.beginPath();
            // Přidání 0.5 zajistí, že čára sedne přesně na pixel (ostrost)
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, h);
            ctx.stroke();
        }

        // Vodorovné čáry
        for (let y = offY; y < h; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(w, y + 0.5);
            ctx.stroke();
        }

        ctx.restore();
    }
}