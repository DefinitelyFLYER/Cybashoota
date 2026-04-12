export default class MenuManager {
    constructor() {
        this.buttons = [];
        this.mousePos = { x: 0, y: 0 };
        this.logo = new Image();
        this.logoLoaded = false;
        this.logo.onload = () => {
            this.logoLoaded = true;
        };
        this.logo.onerror = () => {
            this.logoLoaded = false;
        };
        this.logo.src = 'assets/logo.png';
    }

    init(game) {
        this.game = game;
        
        window.addEventListener('mousemove', (e) => {
            if (this.game.gameState !== 'MENU') return;
            const rect = this.game.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });

        window.addEventListener('mousedown', (e) => {
            if (this.game.gameState !== 'MENU') return;
            this._handleClick();
        });

        this._setupMenu();
    }

    // future menu items can be added here, like upgrades, achievements, etc.
    _setupMenu() {
        this.menuItems = [
            { id: 'play', text: 'PLAY', action: () => this.game.startGame() },
            { id: 'settings', text: 'SETTINGS (WIP)', action: () => console.log('Settings WIP - Not yet implemented') }
        ];
    }

    _handleClick() {
        for (const btn of this.buttons) {
            if (this.mousePos.x >= btn.x && this.mousePos.x <= btn.x + btn.w &&
                this.mousePos.y >= btn.y && this.mousePos.y <= btn.y + btn.h) {
                btn.action();
                return;
            }
        }
    }

    draw(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

        ctx.fillStyle = 'rgba(5, 5, 10, 0.85)';
        ctx.fillRect(0, 0, w, h);

        // game title
        ctx.save();
        ctx.textAlign = 'center';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00ffcc';

        if (this.logoLoaded) {
            const maxLogoWidth = Math.min(w * 0.65, 700);
            const maxLogoHeight = Math.min(h * 0.22, 220);
            const aspect = this.logo.width / this.logo.height || 3;
            let logoWidth = maxLogoWidth;
            let logoHeight = logoWidth / aspect;
            if (logoHeight > maxLogoHeight) {
                logoHeight = maxLogoHeight;
                logoWidth = logoHeight * aspect;
            }

            ctx.drawImage(this.logo, (w - logoWidth) / 2, h / 3 - logoHeight / 2, logoWidth, logoHeight);
        } else {
            ctx.font = 'bold 80px "Courier New", monospace';
            ctx.fillStyle = '#00ffcc';
            ctx.fillText('CYBASHOOTA', w / 2, h / 3);
        }

        ctx.restore();

        this.buttons = [];
        const btnW = 300;
        const btnH = 60;
        const spacing = 30;
        const startY = h / 2;

        ctx.save();
        this.menuItems.forEach((item, index) => {
            const btnX = (w - btnW) / 2;
            const btnY = startY + index * (btnH + spacing);
            
            this.buttons.push({ x: btnX, y: btnY, w: btnW, h: btnH, action: item.action });

            const isHovered = (this.mousePos.x >= btnX && this.mousePos.x <= btnX + btnW &&
                               this.mousePos.y >= btnY && this.mousePos.y <= btnY + btnH);

            ctx.fillStyle = isHovered ? '#111' : '#050505';
            ctx.strokeStyle = isHovered ? '#00ffcc' : '#333';
            ctx.lineWidth = 3;
            
            if (isHovered) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00ffcc';
            } else {
                ctx.shadowBlur = 0;
            }

            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeRect(btnX, btnY, btnW, btnH);

            ctx.fillStyle = isHovered ? '#fff' : '#888';
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.text, btnX + btnW / 2, btnY + btnH / 2);
        });
        ctx.restore();
    }
}