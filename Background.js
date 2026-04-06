/**
 * Background.js - Verze využívající ctx.translate pro eliminaci ghostingu
 */
export default class Background {
    constructor() {
        this.gridSize = 100;
    }

    init(game) {
        this.game = game;
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        if (!player) return;

        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

        ctx.save();
        
        /**
         * 1. VYPOČTEME OFSET
         * Chceme vědět, o kolik pixelů je hráč posunutý vůči mřížce.
         * Použijeme modulo, ale s fixem pro záporná čísla.
         */
        const offsetX = ((-player.pos.x % this.gridSize) + this.gridSize) % this.gridSize;
        const offsetY = ((-player.pos.y % this.gridSize) + this.gridSize) % this.gridSize;

        // 2. POSUNEME CELÉ PLÁTNO
        // Tímto se vše, co nakreslíme potom, posune o tyto pixely
        ctx.translate(Math.floor(offsetX), Math.floor(offsetY));

        // 3. VYKRESLÍME MŘÍŽKU (o něco větší, aby pokryla přesah při posunu)
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();

        // Kreslíme od -gridSize do Šířky + gridSize, abychom nikde neměli prázdno
        for (let x = -this.gridSize; x <= w + this.gridSize; x += this.gridSize) {
            ctx.moveTo(x + 0.5, -this.gridSize);
            ctx.lineTo(x + 0.5, h + this.gridSize);
        }

        for (let y = -this.gridSize; y <= h + this.gridSize; y += this.gridSize) {
            ctx.moveTo(-this.gridSize, y + 0.5);
            ctx.lineTo(w + this.gridSize, y + 0.5);
        }

        ctx.stroke();
        
        ctx.restore(); // Tímto zrušíme ctx.translate pro další moduly
    }
}