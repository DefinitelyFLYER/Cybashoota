/**
 * Background.js - Cache verze (eliminace zdvojených čar)
 */
export default class Background {
    constructor() {
        this.gridSize = 100;
        this.offscreenCanvas = null;
    }

    init(game) {
        this.game = game;
        this._createGridCache();
    }

    _createGridCache() {
        this.offscreenCanvas = document.createElement('canvas');
        const size = this.gridSize;
        this.offscreenCanvas.width = size;
        this.offscreenCanvas.height = size;
        
        const osCtx = this.offscreenCanvas.getContext('2d');
        osCtx.strokeStyle = 'rgba(0, 255, 204, 0.12)';
        osCtx.lineWidth = 1;
        
        osCtx.beginPath();
        osCtx.moveTo(0.5, 0);
        osCtx.lineTo(0.5, size);
        osCtx.moveTo(0, 0.5);
        osCtx.lineTo(size, 0.5);
        osCtx.stroke();
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        if (!player || !this.offscreenCanvas) return;

        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

        const offsetX = ((-player.pos.x % this.gridSize) + this.gridSize) % this.gridSize;
        const offsetY = ((-player.pos.y % this.gridSize) + this.gridSize) % this.gridSize;

        ctx.save();
        
        const pattern = ctx.createPattern(this.offscreenCanvas, 'repeat');
        
        ctx.translate(offsetX - this.gridSize, offsetY - this.gridSize);
        
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, w + this.gridSize * 2, h + this.gridSize * 2);
        
        ctx.restore();
    }
}