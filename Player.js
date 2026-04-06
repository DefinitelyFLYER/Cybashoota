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

        this.shockwaveActive = false;
        this.shockwaveRadius = 0;
        this.shockwaveMaxRadius = 500; // Dosah vlny
        this.shockwaveDuration = 800;  // Jak dlouho vlna cestuje (ms)
        this.shockwaveTimer = 0;
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
        this.xpNextLevel = Math.floor(this.xpNextLevel * 1.2 + 50);

        // Aktivace vlny
        this.shockwaveActive = true;
        this.shockwaveRadius = 0;
        this.shockwaveTimer = 0;

        console.log("SHOCKWAVE DEPLOYED");
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

        if (this.shockwaveActive) {
            this.shockwaveTimer += deltaTime;
            // Plynulé zvětšování rádiusu
            const progress = this.shockwaveTimer / this.shockwaveDuration;
            this.shockwaveRadius = progress * this.shockwaveMaxRadius;

            // Pokud vlna dojela na konec, vypneme ji
            if (progress >= 1) {
                this.shockwaveActive = false;
            }

            // INTERAKCE S ENEMÁKY
            const enemyMgr = this.game.getModule('enemies');
            if (enemyMgr) {
                for (const e of enemyMgr.enemies) {
                    const dx = e.x - this.pos.x;
                    const dy = e.y - this.pos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Pokud je nepřítel v úzkém pásmu čela vlny (tolerance např. 30px)
                    if (Math.abs(dist - this.shockwaveRadius) < 30) {
                        const pushForce = 0.5; // Síla "odfouknutí"
                        e.x += (dx / dist) * pushForce * deltaTime;
                        e.y += (dy / dist) * pushForce * deltaTime;
                    }
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

        if (this.shockwaveActive) {
            const progress = this.shockwaveTimer / this.shockwaveDuration;
            ctx.save();
            
            // --- NASTAVENÍ STYLU ---
            ctx.beginPath();
            ctx.arc(this.game.center.x, this.game.center.y, this.shockwaveRadius, 0, Math.PI * 2);
            
            ctx.strokeStyle = `rgba(0, 255, 204, ${1 - progress})`;
            ctx.lineWidth = 15 * (1 - progress);
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#00ffcc';

            ctx.setLineDash([20, 15]);
            
            ctx.stroke();

            ctx.setLineDash([]); 
            
            ctx.restore();
        }
    }
}