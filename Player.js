export default class Player {
    constructor(x, y) {
        this.pos = { x: x, y: y };
        this.size = 64;
        this.facing = 1;
        this.invulnerable = 0;
        this.level = 1;
        this.xp = 0;
        this.xpNextLevel = 100;

        this.baseStats = {
            moveSpeed: 0.2,
            maxHp: 2,
            fireRate: 600,
            bulletSpeed: 0.8,
            projectileSize: 1.0,
            critMultiplier: 2.0,
            magnetRange: 0.75,
            xpMultiplier: 1.0,
            luck: 1.0
        };

        this.multipliers = {
            moveSpeed: 1.0,
            fireRate: 1.0, 
            bulletSpeed: 1.0,
            projectileSize: 1.0,
            critMultiplier: 1.0,
            magnetRange: 1.0,
            xpMultiplier: 1.0,
            luck: 1.0
        };

        this.stats = {
            hp: 2,
            maxHp: 2, 
            defense: 0,
            damage: 1,
            dodgeChance: 0,
            projectileCount: 1,
            projectileSpread: 5,
            aimAssist: 0,
            critChance: 0.05,
            penetration: 0,
            ricochetCount: 0,
            rerolls: 0
        };
        
        this.sprite = new Image();
        this.sprite.src = 'assets/characters/player.png';
        this.isLoaded = false;
        this.sprite.onload = () => { this.isLoaded = true; };

        this.weaponSprite = new Image();
        this.weaponSprite.src = 'assets/weapons/weapon.png';
        this.isWeaponLoaded = false;
        this.weaponSprite.onload = () => this.isWeaponLoaded = true;
        
        this.weaponAnchorDist = 5;
        this.weaponAngle = 0;

        this.shockwaveActive = false;
        this.shockwaveRadius = 0;
        this.shockwaveMaxRadius = 400;
        this.shockwaveDuration = 1400;
        this.shockwaveTimer = 0;
    }

    getStat(name) {
        if (name === 'damage') {
            return this.stats.damage;
        }

        if (this.baseStats[name] !== undefined) {
            if (name === 'fireRate') return this.baseStats[name] / this.multipliers[name];
            return this.baseStats[name] * this.multipliers[name];
        }
        return this.stats[name];
    }

    getCenter() {
        return { x: this.pos.x, y: this.pos.y };
    }

    init(game) {
        this.game = game;
    }

    takeDamage(amount = 1) {
        if (this.invulnerable > 0) return;

        if (Math.random() < this.stats.dodgeChance) {
            this.invulnerable = 500;
            return;
        }

        const finalDamage = Math.max(1, amount - this.stats.defense);
        
        this.stats.hp -= finalDamage;
        
        this.invulnerable = 1500;

        if (this.stats.hp <= 0) {
            this.stats.hp = 0;
            if (this.game.gameOver) {
                this.game.gameOver();
            } else {
                console.log("GAME OVER - Hráč zemřel");
            }
        }
    }

    addXp(amount) {
        const bonusXp = amount * this.getStat('xpMultiplier');
        this.xp += bonusXp;
        
        if (this.xp >= this.xpNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.xp -= this.xpNextLevel;
        this.level++;
        this.xpNextLevel = Math.floor(this.xpNextLevel * 1.2 + 50);

        this.shockwaveActive = true;
        this.shockwaveRadius = 0;
        this.shockwaveTimer = 0;

        const upgrades = this.game.getModule('upgrades');
        if (upgrades) {
            setTimeout(() => upgrades.showSelection(), 200);
        }
    }

    updateMaxHp() {
        if (this.stats.hp > this.stats.maxHp) {
            this.stats.hp = this.stats.maxHp;
        }
    }

    _handleMovement(deltaTime, input) {
        let moveX = 0;
        let moveY = 0;

        if (input) {
            if (input.isKeyDown('KeyW')) moveY -= 1;
            if (input.isKeyDown('KeyS')) moveY += 1;
            if (input.isKeyDown('KeyA')) {
                moveX -= 1;
                this.facing = -1;
            }
            if (input.isKeyDown('KeyD')) {
                moveX += 1;
                this.facing = 1;
            }
        }

        const mag = Math.sqrt(moveX * moveX + moveY * moveY);
        if (mag > 1) {
            moveX /= mag;
            moveY /= mag;
        }

        this.pos.x += moveX * this.getStat('moveSpeed') * deltaTime;
        this.pos.y += moveY * this.getStat('moveSpeed') * deltaTime;
    }

    _handleWeaponAim(projMgr) {
        if (projMgr) {
            const dx = projMgr.mouseX - this.game.center.x;
            const dy = projMgr.mouseY - this.game.center.y;
            this.weaponAngle = Math.atan2(dy, dx);
        }
    }

    _updateInvulnerability(deltaTime) {
        if (this.invulnerable > 0) {
            this.invulnerable -= deltaTime;
        }
    }

    _checkEnemyCollisions(enemyMgr) {
        if (enemyMgr && enemyMgr.enemies && this.stats.hp > 0) {
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

    _updateShockwave(deltaTime, enemyMgr, projMgr, particles) {
        this.shockwaveTimer += deltaTime;
        const progress = this.shockwaveTimer / this.shockwaveDuration;
        this.shockwaveRadius = progress * this.shockwaveMaxRadius;

        if (progress >= 1) {
            this.shockwaveActive = false;
        }

        if (enemyMgr) {
            for (const e of enemyMgr.enemies) {
                const dx = e.x - this.pos.x;
                const dy = e.y - this.pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (Math.abs(dist - this.shockwaveRadius) < 40) {
                    const pushForce = 1.0; 
                    e.x += (dx / dist) * pushForce * deltaTime;
                    e.y += (dy / dist) * pushForce * deltaTime;
                    e.turboCooldown = 2000; 
                }
            }
        }

        if (projMgr && projMgr.enemyProjectiles) {
            for (let i = projMgr.enemyProjectiles.length - 1; i >= 0; i--) {
                const p = projMgr.enemyProjectiles[i];
                const dx = p.x - this.pos.x;
                const dy = p.y - this.pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (Math.abs(dist - this.shockwaveRadius) < 30) {
                    if (particles) {
                        particles.emit(p.x, p.y, p.color, 4);
                    }
                    projMgr.enemyProjectiles.splice(i, 1);
                }
            }
        }
    }

    update(deltaTime) {
        const input = this.game.getModule('input');
        const projMgr = this.game.getModule('projectiles');
        const enemyMgr = this.game.getModule('enemies');
        const particles = this.game.getModule('particles');

        this._handleMovement(deltaTime, input);
        this._handleWeaponAim(projMgr);
        this._updateInvulnerability(deltaTime);
        this._checkEnemyCollisions(enemyMgr);

        if (this.shockwaveActive) {
            this._updateShockwave(deltaTime, enemyMgr, projMgr, particles);
        }
    }

    draw(ctx) {
        const screenX = this.game.center.x;
        const screenY = this.game.center.y;

        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(this.facing, 1); 

        if (this.isLoaded) {
            ctx.drawImage(this.sprite, -this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            ctx.fillStyle = '#00ffcc';
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        }
        ctx.restore();

        if (this.isWeaponLoaded) {
            this._drawWeapon(ctx, screenX, screenY);
        }

        if (this.shockwaveActive) {
            this._drawShockwave(ctx);
        }
    }

    _drawWeapon(ctx, screenX, screenY) {
        ctx.save();
        
        ctx.translate(screenX, screenY);
        
        ctx.rotate(this.weaponAngle);
        
        ctx.translate(this.weaponAnchorDist, 0);

        if (Math.abs(this.weaponAngle) > Math.PI / 2) {
            ctx.scale(1, -1); 
        }

        const wWidth = 32;
        const wHeight = 16;
        
        ctx.drawImage(this.weaponSprite, 0, -wHeight / 2, wWidth, wHeight);
        
        ctx.restore();
    }

    _drawShockwave(ctx) {
        const progress = this.shockwaveTimer / this.shockwaveDuration;
        ctx.save();
        
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