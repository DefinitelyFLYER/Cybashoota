/**
 * UIManager.js - Správa herního rozhraní (HUD)
 */
export default class UIManager {
    constructor() {
        this.score = 0;
        this.highScore = localStorage.getItem('cyberpunk_highscore') || 0;
    }

    init(game) {
        this.game = game;
    }

    // Metoda pro přidání bodů
    addScore(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('cyberpunk_highscore', this.highScore);
        }
    }

    update(deltaTime) {
        // Zde můžeme řešit animace textu, pokud budeme chtít
    }

    draw(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;
        const player = this.game.getModule('player');
        const director = this.game.getModule('director');
        
        // SKÓRE (stávající)
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00ffcc';
        ctx.fillText(`SCORE: ${this.score.toString().padStart(6, '0')}`, 20, 40);
        
        // ŽIVOTY (Nové)
        if (player) {
            let healthText = "HP: ";
            // Cyklus běží jen tolikrát, kolik má hráč maximálně životů
            for(let i = 0; i < player.maxHp; i++) {
                healthText += (i < player.hp) ? "▮" : "▯";
            }
            
            ctx.fillStyle = '#00ffcc'; 
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00ffcc';
            ctx.fillText(healthText, 20, 75);
        }

        // HIGH SCORE
        ctx.textAlign = 'right';
        ctx.font = '16px "Courier New", monospace';
        ctx.fillText(`HI-SCORE: ${this.highScore.toString().padStart(6, '0')}`, w - 20, 40);
        
        ctx.shadowBlur = 0;

        if (director) {
                const totalSeconds = Math.floor(director.gameTime / 1000);
                const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
                const secs = (totalSeconds % 60).toString().padStart(2, '0');
                const timeStr = `${mins}:${secs}`;

                ctx.save();
                ctx.textAlign = 'center';
                
                // Logika pro efekt při změně fáze (trvá 3 sekundy)
                let scale = 1;
                let alpha = 1;

                if (director.phaseChanged) {
                    // Použijeme sinus pro pulzování
                    const elapsed = director.phaseTimer || 0;
                    const pulse = Math.sin(Date.now() / 200) * 0.05;
                    scale = 1.05 + pulse;
                    alpha = 0.7 + Math.abs(Math.sin(Date.now() / 400) * 0.3);

                    // Po 3 sekundách efekt vypneme
                    if (elapsed > 3000) {
                        director.phaseChanged = false;
                    }
                    director.phaseTimer = (director.phaseTimer || 0) + 16;
                }

                ctx.translate(w / 2, h - 40);
                ctx.scale(scale, scale);
                ctx.globalAlpha = alpha;

                ctx.fillStyle = '#00ffcc';
                ctx.shadowBlur = 15 * scale;
                ctx.shadowColor = '#00ffcc';
                ctx.font = 'bold 30px "Courier New", monospace';
                ctx.fillText(timeStr, 0, 0);

                // Volitelný název fáze pod časem
                ctx.font = '12px "Courier New", monospace';
                ctx.globalAlpha = alpha * 0.7;
                ctx.fillText(director.getPhaseName().toUpperCase(), 0, 20);

                ctx.restore();
        }
    }
}