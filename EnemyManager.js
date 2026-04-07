import { ENEMY_TYPES } from './EnemyTypes.js';

export default class EnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnRate = 1500;
        this.sprites = new Map(); // Cache pro načtené obrázky
    }

    init(game) {
        this.game = game;
        this._preloadSprites();
    }

    _preloadSprites() {
        // Automaticky načte všechny obrázky definované v EnemyTypes
        for (const key in ENEMY_TYPES) {
            const config = ENEMY_TYPES[key];
            if (config.renderType === 'sprite' && config.sprite) {
                const img = new Image();
                img.src = config.sprite;
                this.sprites.set(config.type, img);
            }
        }
    }

    spawnEnemy() {
        if (!this.activePhase) return;

        const player = this.game.getModule('player');
        const center = this.game.center;
        
        // 1. Výběr typu POUZE z povolených v aktuální fázi
        const allowedTypes = this.activePhase.types;
        const typeKey = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
        const baseConfig = ENEMY_TYPES[typeKey];

        // 2. Výpočet pozice (stejné jako minule)
        const margin = 100;
        let spawnX = Math.random() < 0.5 ? -margin : this.game.canvas.width + margin;
        let spawnY = Math.random() * this.game.canvas.height;
        
        const worldX = spawnX + player.pos.x - center.x;
        const worldY = spawnY + player.pos.y - center.y;

        // 3. Vytvoření nepřítele s násobiči z fáze
        this.enemies.push({
            ...baseConfig,
            x: worldX,
            y: worldY,
            // Aplikujeme násobiče obtížnosti z Timeline
            maxHp: Math.ceil(baseConfig.hp * this.activePhase.hpMultiplier),
            currentHp: Math.ceil(baseConfig.hp * this.activePhase.hpMultiplier),
            speed: baseConfig.speed * this.activePhase.speedMultiplier
        });
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return;

        const stopMargin = 80; 
        const innerW = (this.game.canvas.width / 2) - stopMargin;
        const innerH = (this.game.canvas.height / 2) - stopMargin;
        const turboMultiplier = 3;
        const COOLDOWN_TIME = 5000; // 5 sekund v milisekundách

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            
            // Inicializace cooldownu, pokud neexistuje (pro jistotu)
            if (e.turboCooldown === undefined) e.turboCooldown = 0;
            
            // Snižujeme cooldown v každém framu
            if (e.turboCooldown > 0) {
                e.turboCooldown -= deltaTime;
            }
                    
            // --- 1. SEPARACE (Aby nebyli v sobě) ---
            let separationX = 0;
            let separationY = 0;

            for (let j = 0; j < this.enemies.length; j++) {
                if (i === j) continue; // Nepočítáme kolizi sám se sebou
                
                const other = this.enemies[j];
                const dx = e.x - other.x;
                const dy = e.y - other.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Minimální vzdálenost, kterou mezi sebou chtějí mít (podle jejich velikosti)
                const minDist = (e.size + other.size) * 0.8; 

                if (dist < minDist && dist > 0) {
                    // Odpudivá síla: čím blíž jsou, tím víc se odtlačují
                    const force = (minDist - dist) / minDist;
                    separationX += (dx / dist) * force * 0.1; // 0.1 je citlivost odtlačení
                    separationY += (dy / dist) * force * 0.1;
                }
            }

            // Relativní vzdálenost od hráče (středu obrazovky)
            const dxP = player.pos.x - e.x;
            const dyP = player.pos.y - e.y;
            
            // Zjištění, zda je mimo vnitřní obdélník
            const isOutsideView = Math.abs(dxP) > innerW || Math.abs(dyP) > innerH;
            
            let currentSpeed = e.speed;

            // LOGIKA TURBA:
            if (isOutsideView && e.turboCooldown <= 0) {
                // Opraveno na player.stats.moveSpeed
                currentSpeed = player.stats.moveSpeed * turboMultiplier; 
            } 
            else if (!isOutsideView && e.turboCooldown <= 0) {
                e.turboCooldown = COOLDOWN_TIME;
            }

            // --- POHYB ---
            const distP = Math.sqrt(dxP * dxP + dyP * dyP);
            if (distP > 1) {
                const moveX = (dxP / distP) * currentSpeed + separationX;
                const moveY = (dyP / distP) * currentSpeed + separationY;
                
                e.x += moveX * deltaTime;
                e.y += moveY * deltaTime;
            }

            // --- KOLIZE S HRÁČEM + KNOCKBACK NEPŘÍTELE ---
            const distToPlayer = Math.sqrt(dxP * dxP + dyP * dyP);
            const collisionDist = (e.size + player.size) * 0.4; 

            if (distToPlayer < collisionDist) {
                if (player.invulnerable <= 0) {
                    player.takeDamage(1);
                    
                    // Díváme se na vlastnost isSuicidal definovanou v EnemyTypes
                    if (e.isSuicidal) {
                        e.currentHp = 0; // Sebevrah se zničí (spustí to tvůj efekt částic a drop XP)
                    } else {
                        // Klasický knockback pro ty, co mají přežít
                        const enemyKnockback = 80;
                        if (distToPlayer > 0) {
                            const dirX = (e.x - player.pos.x) / distToPlayer;
                            const dirY = (e.y - player.pos.y) / distToPlayer;
                            e.x += dirX * enemyKnockback;
                            e.y += dirY * enemyKnockback;
                            e.turboCooldown = 2000; 
                        }
                    }
                }
            }


            if (distToPlayer < collisionDist) {
                // Knockback a poškození provedeme JEN pokud hráč není právě "nezranitelný"
                // To slouží jako přirozený cooldown pro oba efekty.
                if (player.invulnerable <= 0) {
                    // 1. Hráč dostane DMG (v metodě takeDamage se mu nastaví invulnerable > 0)
                    player.takeDamage(1);


                }
            }

            // Kolize s projektily
            const pm = this.game.getModule('projectiles');
            if (pm) {
                for (let j = pm.projectiles.length - 1; j >= 0; j--) {
                    const p = pm.projectiles[j];
                    const pdx = p.x - e.x;
                    const pdy = p.y - e.y;
                    if (Math.sqrt(pdx * pdx + pdy * pdy) < e.size / 2) {
                        const player = this.game.getModule('player');
                        let damage = player.stats.damage;

                        if (p.isCrit) {
                            damage = 1 * player.stats.critMultiplier;
                            // Tady můžeme vyvolat extra částice pro kritický zásah
                            const particles = this.game.getModule('particles');
                            if (particles) particles.emit(p.x, p.y, '#ffffff', 5); 
                        }

                        e.currentHp -= damage;
                        pm.projectiles.splice(j, 1);
                        if (e.currentHp <= 0) break;
                    }
                }
            }

            if (e.currentHp <= 0) {
                const ui = this.game.getModule('ui');
                const particles = this.game.getModule('particles');
                const xpMgr = this.game.getModule('experience');
                const director = this.game.getModule('director');
                const powerUpMgr = this.game.getModule('powerups');


                if (ui) ui.addScore(e.scoreValue);
                if (particles) particles.emit(e.x, e.y, e.color || '#ffffff', 15);

                // DROP XP ORBU (Nové)
                if (xpMgr && director && director.currentPhase) {
                    const drop = director.currentPhase.xpDrop;
                    xpMgr.spawnOrb(e.x, e.y, drop.value, drop.color);
                }

                if (powerUpMgr) powerUpMgr.trySpawn(e.x, e.y);

                this.enemies.splice(i, 1);
            }
        }

        this.spawnTimer += deltaTime;
        if (this.spawnTimer > this.spawnRate) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        if (!player) return;

        for (const e of this.enemies) {
            const drawX = e.x - player.pos.x + this.game.center.x;
            const drawY = e.y - player.pos.y + this.game.center.y;

            ctx.save();
            
            if (e.renderType === 'sprite' && this.sprites.has(e.type)) {
                // Vykreslení obrázkem
                const img = this.sprites.get(e.type);
                ctx.drawImage(img, drawX - e.size/2, drawY - e.size/2, e.size, e.size);
            } else {
                // Vykreslení tvarem (fallback na tvůj kód)
                ctx.shadowBlur = 15;
                ctx.shadowColor = e.color;
                ctx.fillStyle = e.color + '66'; // Přidáme průhlednost
                ctx.strokeStyle = e.color;
                ctx.lineWidth = 3;

                this._drawShape(ctx, drawX, drawY, e);
            }

            if (e.currentHp < e.maxHp) {
                this._drawHealthBar(ctx, drawX, drawY, e);
            }
            ctx.restore();
        }
    }

    _drawShape(ctx, x, y, e) {
        ctx.beginPath();
        
        if (e.type === 'TRIANGLE') {
            ctx.moveTo(x, y - e.size / 2);
            ctx.lineTo(x + e.size / 2, y + e.size / 2);
            ctx.lineTo(x - e.size / 2, y + e.size / 2);
        } 
        else if (e.type === 'SQUARE') {
            ctx.rect(x - e.size / 2, y - e.size / 2, e.size, e.size);
        } 
        else if (e.type === 'HEXAGON') {
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const px = x + (e.size / 2) * Math.cos(angle);
                const py = y + (e.size / 2) * Math.sin(angle);
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
        } 
        // --- NOVÉ TVARY ---
        else if (e.type === 'CIRCLE') {
            ctx.arc(x, y, e.size / 2, 0, Math.PI * 2);
        } 
        else if (e.type === 'RHOMBUS') {
            ctx.moveTo(x, y - e.size / 2);
            ctx.lineTo(x + e.size / 2, y);
            ctx.lineTo(x, y + e.size / 2);
            ctx.lineTo(x - e.size / 2, y);
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    _drawHealthBar(ctx, x, y, e) {
        const barWidth = e.size;
        const drawX = x - barWidth / 2;
        const drawY = y - (e.size / 2 + 15);
        ctx.fillStyle = '#333';
        ctx.fillRect(drawX, drawY, barWidth, 4);
        const hpPercent = e.currentHp / e.maxHp;
        ctx.fillStyle = hpPercent > 0.5 ? '#00ffcc' : '#ff0055'; 
        ctx.fillRect(drawX, drawY, barWidth * hpPercent, 4);
    }
}