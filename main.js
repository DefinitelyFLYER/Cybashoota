import Game from './Core.js';
import Player from './Player.js';

const game = new Game('gameCanvas');

// Vytvoříme instanci hráče (např. doprostřed obrazovky)
const player = new Player(window.innerWidth / 2, window.innerHeight / 2);

// Zaregistrujeme ho do jádra
game.addModule('player', player);

game.start();