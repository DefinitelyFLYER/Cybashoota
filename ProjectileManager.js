/**
 * ProjectileManager.js - Správa střelby (Mouse + Gamepad)
 */
export default class ProjectileManager {
    constructor() {
        this.projectiles = [];
        this.lastFireTime = 0;
        this.fireRate = 150; // Rychlost střelby v ms
        
        // Pomocné proměnné pro myš
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;

        // Listenery pro myš (zůstávají pro PC hráče)
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        window.addEventListener('mousedown', () => this.isMouseDown = true);
        window.addEventListener('mouseup', () => this.isMouseDown = false);
    }

    init(game) {
        this.game = game;
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        const gamepad = this.game.getModule('gamepad');
        if (!player) return;

        const center = player.getCenter();

        // --- 1. LOGIKA STŘELBY (VÝPOČET ÚHLU) ---
        let targetAngle = null;

        // Priorita 1: Gamepad (Pravá páčka nebo RT)
        if (gamepad && gamepad.gamepadIndex !== null) {
            const rx = gamepad.axes[2]; // Pravá páčka X
            const ry = gamepad.axes[3]; // Pravá páčka Y

            // Pokud pohneme pravou páčkou (deadzone 0.5 pro střelbu)
            if (Math.abs(rx) > 0.5 || Math.abs(ry) > 0.5) {
                targetAngle = Math.atan2(ry, rx);
            } 
            // Nebo pokud držíme RT, střílíme ve směru, kam postava kouká (nebo kam míří páčka)
            else if (gamepad.buttons.RT) {
                // Pokud nemíříme páčkou, ale držíme RT, střílíme před sebe (default úhel)
                targetAngle = Math.atan2(ry, rx); 
            }
        }

        // Priorita 2: Myš (pokud není aktivní gamepad střelba)
        if (targetAngle === null && this.isMouseDown) {
            const worldMouseX = this.mouseX + player.pos.x - this.game.center.x;
            const worldMouseY = this.mouseY + player.pos.y - this.game.center.y;
            targetAngle = Math.atan2(worldMouseY - center.y, worldMouseX - center.x);
        }

        // --- 2. SAMOTNÝ VÝSTŘEL ---
        if (targetAngle !== null) {
            this._fire(center.x, center.y, targetAngle);
        }

        // --- 3. POHYB PROJEKTILŮ ---
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;

            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    _fire(x, y, angle) {
        const now = Date.now();
        if (now - this.lastFireTime < this.fireRate) return;

        this.projectiles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * 0.8,
            vy: Math.sin(angle) * 0.8,
            life: 2000
        });

        this.lastFireTime = now;
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        if (!player) return;

        ctx.save();
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffff00';

        for (const p of this.projectiles) {
            const screenX = p.x - player.pos.x + this.game.center.x;
            const screenY = p.y - player.pos.y + this.game.center.y;

            ctx.beginPath();
            ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}