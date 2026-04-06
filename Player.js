/**
 * Player.js - Aktualizace o systém životů
 */
export default class Player {
    constructor(x, y) {
        this.pos = { x: x, y: y };
        this.size = 64;
        this.invulnerable = 0;
        this.level = 1;
        this.xp = 0;
        this.xpNextLevel = 100; // Základní XP potřebné pro level 2
        
        this.stats = {
            // POHYB A ŽIVOT
            moveSpeed: 0.2,
            maxHp: 3,
            hp: 3,
            defense: 0,      // Snižuje příchozí poškození (např. o fixní hodnotu)
            dodgeChance: 0,  // Procentuální šance (0.1 = 10%)

            // STŘELBA
            fireRate: 400,          // Prodleva mezi výstřely v ms
            bulletSpeed: 0.8,
            projectileCount: 1,     // Počet střel naráz
            projectileSpread: 15,   // Úhel rozptylu v stupních mezi střelami
            
            // DAMAGE
            critChance: 0.05,       // 5% šance na kritický zásah
            critMultiplier: 2.0,     // 2x damage při kritickém zásahu

            damage: 1,           // Základní poškození projektilu
            luck: 1.0           // Násobič štěstí (1.0 = základ, 1.5 = o 50% vyšší šance na vzácné věci)
        };
        
        this.sprite = new Image();
        this.sprite.src = 'player.png';
        this.isLoaded = false;
        this.sprite.onload = () => { this.isLoaded = true; };

        this.shockwaveActive = false;
        this.shockwaveRadius = 0;
        this.shockwaveMaxRadius = 600; // Dosah vlny
        this.shockwaveDuration = 1200;  // Jak dlouho vlna cestuje (ms)
        this.shockwaveTimer = 0;
    }

    getCenter() {
        return { x: this.pos.x, y: this.pos.y };
    }

    init(game) {
        this.game = game;
    }

takeDamage(amount = 1) {
    if (this.invulnerable > 0) return;

    // 1. Kontrola Dodge
    if (Math.random() < this.stats.dodgeChance) {
        this.invulnerable = 500;
        return;
    }

    const finalDamage = Math.max(1, amount - this.stats.defense);
    
    this.stats.hp -= finalDamage;
    
    // Aktivace i-frames (nesmrtelnost po zásahu)
    this.invulnerable = 1500;

    // 4. Kontrola smrti
    if (this.stats.hp <= 0) {
        this.stats.hp = 0; // Zamezíme záporným číslům
        if (this.game.gameOver) {
            this.game.gameOver();
        } else {
            console.log("GAME OVER - Hráč zemřel");
        }
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

        // Shockwave efekt
        this.shockwaveActive = true;
        this.shockwaveRadius = 0;
        this.shockwaveTimer = 0;

        // OTEVŘENÍ UPGRADE MENU
        const upgrades = this.game.getModule('upgrades');
        if (upgrades) {
            // Můžeme hru mírně zpozdit, aby doběhl efekt shockwave, 
            // nebo menu otevřít hned:
            setTimeout(() => upgrades.showSelection(), 200);
        }
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

        this.pos.x += moveX * this.stats.moveSpeed * deltaTime;
        this.pos.y += moveY * this.stats.moveSpeed * deltaTime;

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

                    if (Math.abs(dist - this.shockwaveRadius) < 40) { // Trochu širší detekce pro pomalejší vlnu
                        const pushForce = 1.0; 
                        
                        e.x += (dx / dist) * pushForce * deltaTime;
                        e.y += (dy / dist) * pushForce * deltaTime;
                        
                        e.turboCooldown = 2000; 
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