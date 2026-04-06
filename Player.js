/**
 * Player.js - Aktualizace o systém životů
 */
export default class Player {
    constructor(x, y) {
        this.pos = { x: x, y: y };
        this.speed = 0.2;
        this.size = 64;
        this.hp = 1;
        this.maxHp = 1;
        this.invulnerable = 0;
        
        this.sprite = new Image();
        this.sprite.src = 'player.png';
        this.isLoaded = false;
        this.sprite.onload = () => { this.isLoaded = true; };
    }

    getCenter() {
        return { x: this.pos.x, y: this.pos.y };
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
        if (!input) return;

        let moveX = 0;
        let moveY = 0;

        // 1. SBĚR VSTUPU
        if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) moveY -= 1;
        if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) moveY += 1;
        if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) moveX -= 1;
        if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) moveX += 1;

        // 2. NORMALIZACE
        if (moveX !== 0 || moveY !== 0) {
            // Vypočítáme délku vektoru: sqrt(x^2 + y^2)
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            
            // Vydělíme komponenty délkou, aby výsledná délka byla 1
            // (U přímého směru to bude 1/1=1, u diagonály 1/1.41=0.707)
            moveX /= length;
            moveY /= length;

            // 3. APLIKACE POHYBU
            this.pos.x += moveX * this.speed * deltaTime;
            this.pos.y += moveY * this.speed * deltaTime;
        }

        // --- ZBYTEK KÓDU (Invis frames, Kolize) ---
        if (this.invulnerable > 0) {
            this.invulnerable -= deltaTime;
        }

        const enemyMgr = this.game.getModule('enemies');
        if (enemyMgr && enemyMgr.enemies && this.hp > 0) {
            for (const enemy of enemyMgr.enemies) {
                const dx = this.pos.x - enemy.x;
                const dy = this.pos.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 35) { 
                    this.takeDamage();
                }
            }
        }
    }

    draw(ctx) {
        // Hráčův logický střed (this.pos) chceme vidět na středu obrazovky (game.center)
        const screenX = this.game.center.x - this.size / 2;
        const screenY = this.game.center.y - this.size / 2;

        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;

        if (this.isLoaded) {
            // Vykreslíme obrázek tak, aby jeho střed byl na screenX/Y
            ctx.drawImage(this.sprite, screenX, screenY, this.size, this.size);
        } else {
            ctx.fillStyle = '#00ffcc';
            ctx.fillRect(screenX, screenY, this.size, this.size);
        }
    }
}