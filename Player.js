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
        this.level = 1;
        this.xp = 0;
        this.xpNextLevel = 100; // Základní XP potřebné pro level 2
        
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

    addXp(amount) {
        this.xp += amount;
        
        // Check na level up
        if (this.xp >= this.xpNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.xp -= this.xpNextLevel;
        this.level++;
        
        // Zvýšíme náročnost pro další level (např. o 20 %)
        this.xpNextLevel = Math.floor(this.xpNextLevel * 1.2 + 50);
        
        console.log(`LEVEL UP! Now at level ${this.level}`);
        // Tady později vyvoláme UI pro výběr upgradů
    }

    update(deltaTime) {
        const input = this.game.getModule('input');
        const gamepad = this.game.getModule('gamepad');
        
        let moveX = 0;
        let moveY = 0;

        // --- LOGIKA KLÁVESNICE ---
        if (input) {
            if (input.isKeyDown('KeyW')) moveY -= 1;
            if (input.isKeyDown('KeyS')) moveY += 1;
            if (input.isKeyDown('KeyA')) moveX -= 1;
            if (input.isKeyDown('KeyD')) moveX += 1;
        }

        // --- LOGIKA GAMEPADU (Levá páčka) ---
        if (gamepad && gamepad.gamepadIndex !== null) {
            // Pokud pohneme páčkou, přepíšeme hodnoty z klávesnice
            if (Math.abs(gamepad.axes[0]) > 0.1 || Math.abs(gamepad.axes[1]) > 0.1) {
                moveX = gamepad.axes[0];
                moveY = gamepad.axes[1];
            }
        }

        // Normalizace (potřeba hlavně pro klávesnici, páčka se normalizuje fyzicky)
        const mag = Math.sqrt(moveX * moveX + moveY * moveY);
        if (mag > 1) { // Ošetříme jen pokud "přestřelíme" (diagonála na klávesnici)
            moveX /= mag;
            moveY /= mag;
        }

        this.pos.x += moveX * this.speed * deltaTime;
        this.pos.y += moveY * this.speed * deltaTime;

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