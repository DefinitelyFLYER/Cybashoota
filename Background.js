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

        /**
         * Trik pro nekonečné pozadí:
         * Mřížku posouváme proti pohybu hráče, ale udržujeme ji 
         * v rozmezí jedné buňky (modulo gridSize).
         */
        this.offsetX = (-player.pos.x) % this.gridSize;
        this.offsetY = (-player.pos.y) % this.gridSize;
    }

    draw(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.15)'; // Velmi jemná neonová barva
        ctx.lineWidth = 1;

        // Svislé čáry
        for (let x = this.offsetX; x < w; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        // Vodorovné čáry
        for (let y = this.offsetY; y < h; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        ctx.restore();
    }
}