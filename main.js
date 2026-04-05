import Game from './Core.js';
import Player from './Player.js';
import InputHandler from './InputHandler.js';
import ProjectileManager from './ProjectileManager.js';
import EnemyManager from './EnemyManager.js';
import UIManager from './UIManager.js';
import ParticleManager from './ParticleManager.js';

const game = new Game('gameCanvas');

game.addModule('input', new InputHandler());
game.addModule('ui', new UIManager());
game.addModule('projectiles', new ProjectileManager());
game.addModule('enemies', new EnemyManager());
game.addModule('particles', new ParticleManager());

const player = new Player(window.innerWidth / 2, window.innerHeight / 2);
game.addModule('player', player);

game.start();