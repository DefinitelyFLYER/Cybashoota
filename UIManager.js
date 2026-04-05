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
        const player = this.game.getModule('player');
        
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
            for(let i=0; i < 3; i++) { // Pořád počítáme se 3 sloty pro budoucí vylepšení
                healthText += (i < player.hp) ? "▮" : "▯";
            }
            // Změna: Teď bude barva vždy neonově azurová, dokud je hráč naživu
            ctx.fillStyle = '#00ffcc'; 
            ctx.fillText(healthText, 20, 75);
        }

        // HIGH SCORE
        ctx.textAlign = 'right';
        ctx.font = '16px "Courier New", monospace';
        ctx.fillText(`HI-SCORE: ${this.highScore.toString().padStart(6, '0')}`, w - 20, 40);
        
        ctx.shadowBlur = 0;
    }
}