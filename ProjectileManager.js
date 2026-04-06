/**
 * ProjectileManager.js - Opravená verze se všemi fixy a podporou gamepadu
 */
export default class ProjectileManager {
    constructor() {
        this.projectiles = [];
        this.lastFireTime = 0;
        this.fireRate = 150; // Limit střelby (ms)
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;

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

        // VŽDY používáme střed hráče (Fix z kroku 51)
        const center = player.getCenter();
        let targetAngle = null;

        // 1. Logika Gamepadu
        if (gamepad && gamepad.gamepadIndex !== null) {
            // Update gamepadu musí proběhnout (pokud ho nemáš v Core.js, zavoláme ho zde)
            gamepad.update(); 

            const rx = gamepad.axes[2]; 
            const ry = gamepad.axes[3];

            // Střelba pravou páčkou (Twin-stick)
            if (Math.abs(rx) > 0.4 || Math.abs(ry) > 0.4) {
                targetAngle = Math.atan2(ry, rx);
            } 
            // Střelba pomocí RT (R2)
            else if (gamepad.buttons.RT) {
                // Pokud jen držíme RT, střílíme ve směru pohybu nebo k myši
                const worldMouseX = this.mouseX + player.pos.x - this.game.center.x;
                const worldMouseY = this.mouseY + player.pos.y - this.game.center.y;
                targetAngle = Math.atan2(worldMouseY - center.y, worldMouseX - center.x);
            }
        }

        // 2. Logika Myši (pokud gamepad nemíří)
        if (targetAngle === null && this.isMouseDown) {
            const worldMouseX = this.mouseX + player.pos.x - this.game.center.x;
            const worldMouseY = this.mouseY + player.pos.y - this.game.center.y;
            targetAngle = Math.atan2(worldMouseY - center.y, worldMouseX - center.x);
        }

        // 3. Výstřel s limitem fireRate
        if (targetAngle !== null) {
            this._fire(center.x, center.y, targetAngle);
        }

        // 4. Update pozic projektilů
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;

            if (p.life <= 0) this.projectiles.splice(i, 1);
        }
    }

    _fire(x, y, angle) {
        const now = Date.now();
        if (now - this.lastFireTime < this.fireRate) return;

        this.projectiles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * 0.8, // Rychlost střely
            vy: Math.sin(angle) * 0.8,
            life: 2000
        });

        this.lastFireTime = now;
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        if (!player) return;

        ctx.save();
        // VRÁCENÁ BARVA: Neonová azurová/zelená (jako mřížka)
        ctx.fillStyle = '#00ffcc'; 
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffcc';

        for (const p of this.projectiles) {
            // Převod ze světa na obrazovku (Fix z kroku 51)
            const screenX = p.x - player.pos.x + this.game.center.x;
            const screenY = p.y - player.pos.y + this.game.center.y;

            ctx.beginPath();
            ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}