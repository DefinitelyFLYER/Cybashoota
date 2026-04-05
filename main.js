import Game from './Core.js';
import Player from './Player.js';
import InputHandler from './InputHandler.js';
import ProjectileManager from './ProjectileManager.js';
import EnemyManager from './EnemyManager.js'; // Nový import

const game = new Game('gameCanvas');

game.addModule('input', new InputHandler());
game.addModule('projectiles', new ProjectileManager());
game.addModule('enemies', new EnemyManager()); // Registrace nepřátel

const player = new Player(window.innerWidth / 2, window.innerHeight / 2);
game.addModule('player', player);

game.start();