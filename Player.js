/**
 * Player.js - Aktualizace o systém životů
 */
export default class Player {
    constructor(x, y) {
        this.pos = { x: x, y: y };
        this.speed = 0.2;
        this.size = 64;
        this.hp = 1;      // Aktuální životy
        this.maxHp = 1;   // Maximální možná kapacita (pro UI)
        this.invulnerable = 0;
        
        this.sprite = new Image();
        this.sprite.src = 'player.png';
        this.isLoaded = false;
        this.sprite.onload = () => { this.isLoaded = true; };
    }

    init(game) {
        this.game = game;
    }

    takeDamage() {
        if (this.invulnerable > 0) return; // Pokud je hráč v ochranné lhůtě, nic se neděje

        this.hp--;
        this.invulnerable = 1500; // 1.5 sekundy nesmrtelnosti po zásahu

        if (this.hp <= 0) {
            this.game.gameOver();
        }
    }

    update(deltaTime) {
        const input = this.game.getModule('input');
        const enemyMgr = this.game.getModule('enemies');
        if (!input) return;

        // Snižování počítadla nesmrtelnosti
        if (this.invulnerable > 0) {
            this.invulnerable -= deltaTime;
        }

        // POHYB (stávající)
        if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) this.pos.y -= this.speed * deltaTime;
        if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) this.pos.y += this.speed * deltaTime;
        if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) this.pos.x -= this.speed * deltaTime;
        if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) this.pos.x += this.speed * deltaTime;

        // KOLIZE
        if (enemyMgr && enemyMgr.enemies && this.hp > 0) {
            for (const enemy of enemyMgr.enemies) {
                const dx = (this.pos.x + this.size / 2) - enemy.x;
                const dy = (this.pos.y + this.size / 2) - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 45) {
                    this.takeDamage(); // Místo game over voláme ubrání životů
                }
            }
        }
    }

    draw(ctx) {
        // Pokud je hráč nesmrtelný, necháme ho blikat
        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            return; 
        }

        if (this.isLoaded) {
            ctx.drawImage(this.sprite, this.pos.x, this.pos.y, this.size, this.size);
        } else {
            ctx.fillStyle = '#00ffcc';
            ctx.fillRect(this.pos.x, this.pos.y, this.size, this.size);
        }
    }
}