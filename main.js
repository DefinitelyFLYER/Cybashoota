import Game from './Core.js';
import Player from './Player.js';
import InputHandler from './InputHandler.js';

const game = new Game('gameCanvas');

// 1. Nejdřív přidáme InputHandler
game.addModule('input', new InputHandler());

// 2. Pak přidáme Hráče
const player = new Player(window.innerWidth / 2, window.innerHeight / 2);
game.addModule('player', player);

game.start();