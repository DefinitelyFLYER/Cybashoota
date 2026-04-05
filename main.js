import Game from './Core.js';
import Player from './Player.js';
import InputHandler from './InputHandler.js';
import ProjectileManager from './ProjectileManager.js';
import EnemyManager from './EnemyManager.js';
import UIManager from './UIManager.js'; // 1. Import

const game = new Game('gameCanvas');

game.addModule('input', new InputHandler());
game.addModule('ui', new UIManager()); // 2. Registrace UI (doporučuji před managery)
game.addModule('projectiles', new ProjectileManager());
game.addModule('enemies', new EnemyManager());

const player = new Player(window.innerWidth / 2, window.innerHeight / 2);
game.addModule('player', player);

game.start();