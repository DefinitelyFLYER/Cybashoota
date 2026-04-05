/**
 * Player.js - Modul hráče
 */
export default class Player {
    constructor(x, y) {
        this.pos = { x: x, y: y };
        this.speed = 0.3;
        this.size = 64;
        
        this.sprite = new Image();
        this.sprite.src = 'player.png';
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
        const input = this.game.getModule('input');
        const enemyMgr = this.game.getModule('enemies');
        if (!input) return;

        if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) this.pos.y -= this.speed * deltaTime;
        if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) this.pos.y += this.speed * deltaTime;
        if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) this.pos.x -= this.speed * deltaTime;
        if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) this.pos.x += this.speed * deltaTime;

        if (enemyMgr) {
            for (const enemy of enemyMgr.enemies) {
                const dx = (this.pos.x + this.size / 2) - enemy.x;
                const dy = (this.pos.y + this.size / 2) - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < (this.size / 2.5) + (enemy.size / 2)) {
                    this.game.gameOver();
                }
            }
        }
    }

    draw(ctx) {
        if (this.isLoaded) {
            ctx.drawImage(this.sprite, this.pos.x, this.pos.y, this.size, this.size);
        } else {
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x, this.pos.y, this.size, this.size);
            ctx.fillStyle = 'rgba(0, 255, 204, 0.2)';
            ctx.fillRect(this.pos.x, this.pos.y, this.size, this.size);
        }
    }
}