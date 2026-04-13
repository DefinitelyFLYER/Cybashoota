export default class TouchControls {
    constructor() {
        this.touchSupported = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        this.movementTouchId = null;
        this.aimTouchId = null;
        this.pauseTouchId = null;
        this.moveVector = { x: 0, y: 0 };
        this.aimVector = { x: 1, y: 0 };
        this.lastAimVector = { x: 1, y: 0 };
        this.movePosition = { x: 0, y: 0 };
        this.aimPosition = { x: 0, y: 0 };
        this.leftCenter = { x: 0, y: 0 };
        this.rightCenter = { x: 0, y: 0 };
        this.pauseButtonBounds = { x: 0, y: 0, w: 0, h: 0 };
        this.controlRadius = 90;
        this.deadzone = 0.2;
        this.showControls = false;
        this.lastInputTime = 0;
    }

    init(game) {
        this.game = game;
        this.canvas = game.canvas;
        this._resize();
        window.addEventListener('resize', () => this._resize());

        this.canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this._onTouchEnd(e), { passive: false });
    }

    get isTouchActive() {
        return this.movementTouchId !== null || this.aimTouchId !== null;
    }

    get isShooting() {
        return this.aimTouchId !== null;
    }

    get isAiming() {
        return this.aimTouchId !== null;
    }

    _resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvasRect = rect;
        const width = rect.width;
        const height = rect.height;
        this.controlRadius = Math.min(100, width * 0.14, height * 0.16);
        this.leftCenter = { x: width * 0.18, y: height * 0.78 };
        this.rightCenter = { x: width * 0.82, y: height * 0.78 };
        const pauseSize = Math.max(48, Math.min(72, width * 0.1));
        this.pauseButtonBounds = {
            x: width - pauseSize - 16,
            y: 16,
            w: pauseSize,
            h: pauseSize
        };
        this.showControls = this.touchSupported || width <= 900;
    }

    _getClientPos(touch) {
        return { x: touch.clientX, y: touch.clientY };
    }

    _getTouchCoords(touch) {
        const rect = this.canvasRect;
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    _isPauseArea(x, y) {
        const b = this.pauseButtonBounds;
        return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    }

    _onTouchStart(event) {
        if (!this.showControls) return;
        event.preventDefault();
        if (!this.canvasRect) this._resize();

        for (const touch of Array.from(event.changedTouches)) {
            const { x, y } = this._getTouchCoords(touch);
            this.lastInputTime = Date.now();

            if (this._isPauseArea(x, y) && this.game && this.game.gameState === 'PLAYING') {
                this.pauseTouchId = touch.identifier;
                this.game.isPaused = !this.game.isPaused;
                continue;
            }

            if (this.movementTouchId === null && x < this.canvasRect.width * 0.5) {
                this.movementTouchId = touch.identifier;
                this.movePosition = { x, y };
                this._updateMoveVector();
                continue;
            }

            if (this.aimTouchId === null && x >= this.canvasRect.width * 0.5) {
                this.aimTouchId = touch.identifier;
                this.aimPosition = { x, y };
                this._updateAimVector();
            }
        }
    }

    _onTouchMove(event) {
        if (!this.showControls) return;
        event.preventDefault();
        if (!this.canvasRect) this._resize();

        for (const touch of Array.from(event.changedTouches)) {
            const coords = this._getTouchCoords(touch);
            this.lastInputTime = Date.now();

            if (touch.identifier === this.movementTouchId) {
                this.movePosition = coords;
                this._updateMoveVector();
            }

            if (touch.identifier === this.aimTouchId) {
                this.aimPosition = coords;
                this._updateAimVector();
            }
        }
    }

    _onTouchEnd(event) {
        if (!this.showControls) return;
        event.preventDefault();
        if (!this.canvasRect) this._resize();

        for (const touch of Array.from(event.changedTouches)) {
            if (touch.identifier === this.movementTouchId) {
                this.movementTouchId = null;
                this.moveVector = { x: 0, y: 0 };
                this.movePosition = { ...this.leftCenter };
            }
            if (touch.identifier === this.aimTouchId) {
                this.aimTouchId = null;
                this.aimVector = { ...this.lastAimVector };
                this.aimPosition = { ...this.rightCenter };
            }
            if (touch.identifier === this.pauseTouchId) {
                this.pauseTouchId = null;
            }
        }
    }

    _updateMoveVector() {
        const dx = this.movePosition.x - this.leftCenter.x;
        const dy = this.movePosition.y - this.leftCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.deadzone * this.controlRadius) {
            this.moveVector = { x: 0, y: 0 };
            return;
        }

        const normalizedX = dx / this.controlRadius;
        const normalizedY = dy / this.controlRadius;
        const magnitude = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
        if (magnitude > 1) {
            this.moveVector = { x: normalizedX / magnitude, y: normalizedY / magnitude };
        } else {
            this.moveVector = { x: normalizedX, y: normalizedY };
        }
    }

    _updateAimVector() {
        const dx = this.aimPosition.x - this.rightCenter.x;
        const dy = this.aimPosition.y - this.rightCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.deadzone * this.controlRadius) {
            this.aimVector = { ...this.lastAimVector };
            return;
        }

        const normalizedX = dx / distance;
        const normalizedY = dy / distance;
        this.aimVector = { x: normalizedX, y: normalizedY };
        this.lastAimVector = { x: normalizedX, y: normalizedY };
    }

    update(deltaTime) {
        if (!this.showControls) return;
        if (!this.canvasRect) this._resize();
    }

    draw(ctx) {
        if (!this.showControls) return;
        if (!this.game || this.game.gameState !== 'PLAYING') return;

        const { width, height } = this.canvasRect || this.canvas.getBoundingClientRect();
        this._resize();

        this._drawStick(ctx, this.leftCenter, this.movePosition, this.controlRadius, 'MOVE');
        this._drawStick(ctx, this.rightCenter, this.aimPosition, this.controlRadius, 'SHOOT');
        this._drawPauseButton(ctx);
    }

    _drawStick(ctx, center, position, radius, label) {
        const thumbRadius = Math.max(22, radius * 0.28);
        const isActive = position.x !== 0 || position.y !== 0;
        const pointer = isActive ? position : center;

        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillStyle = 'rgba(10, 10, 10, 0.35)';
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius * 0.38, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, thumbRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.85;
        ctx.fillText(label, center.x, center.y - radius - 16);
        ctx.restore();
    }

    _drawPauseButton(ctx) {
        const { x, y, w, h } = this.pauseButtonBounds;
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 10);
        ctx.lineTo(x + 12, y + h - 10);
        ctx.moveTo(x + w - 12, y + 10);
        ctx.lineTo(x + w - 12, y + h - 10);
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('II', x + w / 2, y + h / 2);
        ctx.restore();
    }
}
