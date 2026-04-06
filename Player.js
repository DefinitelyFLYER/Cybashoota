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
        const enemyMgr = this.game.getModule('enemies');
        
        if (!input) return;

        // 1. POHYB (wasd/šipky) - ten zůstává stejný, hýbeme "rohem", to nevadí
        if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) this.pos.y -= this.speed * deltaTime;
        if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) this.pos.y += this.speed * deltaTime;
        if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) this.pos.x -= this.speed * deltaTime;
        if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) this.pos.x += this.speed * deltaTime;

        // --- SNÍŽENÍ NESMRTELNOSTI ---
        if (this.invulnerable > 0) {
            this.invulnerable -= deltaTime;
        }

        // 2. DETEKCE KOLIZE - Tady je ta změna!
        if (enemyMgr && enemyMgr.enemies && this.hp > 0) {
            // ZÍSKÁME STŘED HRÁČE
            const center = this.getCenter(); 

            for (const enemy of enemyMgr.enemies) {
                // Počítáme vzdálenost od STŘEDU ke STŘEDU
                // (Nepřítel už svůj střed má v e.x a e.y z EnemyManageru)
                const dx = center.x - enemy.x;
                const dy = center.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Pokud je nepřítel blíž než 40 pixelů k našemu STŘEDU, dostaneme dmg
                // (40px je cca polovina tvého 64px spritu + rezerva)
                if (distance < 35) {
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