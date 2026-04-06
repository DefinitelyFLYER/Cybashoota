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

    // Vytvoříme jeden velký čtverec mřížky do paměti
    _createGridCache() {
        this.offscreenCanvas = document.createElement('canvas');
        // Velikost musí být gridSize + kousek na přesah
        const size = this.gridSize;
        this.offscreenCanvas.width = size;
        this.offscreenCanvas.height = size;
        
        const osCtx = this.offscreenCanvas.getContext('2d');
        osCtx.strokeStyle = 'rgba(0, 255, 204, 0.12)';
        osCtx.lineWidth = 1;
        
        osCtx.beginPath();
        // Nakreslíme jen dvě čáry (L tvar), které se budou opakovat
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

        // Přesný posun podle hráče
        const offsetX = ((-player.pos.x % this.gridSize) + this.gridSize) % this.gridSize;
        const offsetY = ((-player.pos.y % this.gridSize) + this.gridSize) % this.gridSize;

        ctx.save();
        
        // Použijeme nativní funkci Canvasu pro opakování obrázku
        // To je nejrychlejší a nejčistší cesta, jak zaplnit pozadí
        const pattern = ctx.createPattern(this.offscreenCanvas, 'repeat');
        
        // Posuneme počátek kreslení patternu
        ctx.translate(offsetX - this.gridSize, offsetY - this.gridSize);
        
        ctx.fillStyle = pattern;
        // Vyplníme plochu o něco větší než je obrazovka
        ctx.fillRect(0, 0, w + this.gridSize * 2, h + this.gridSize * 2);
        
        ctx.restore();
    }
}