import Game from './Core.js';
import Player from './Player.js';
import InputHandler from './InputHandler.js';
import ProjectileManager from './ProjectileManager.js';
import EnemyManager from './EnemyManager.js';
import UIManager from './UIManager.js';
import ParticleManager from './ParticleManager.js';
import Background from './Background.js';
import SpawnDirector from './SpawnDirector.js';
import ExperienceManager from './ExperienceManager.js';
import UpgradeManager from './UpgradeManager.js';
import PowerUpManager from './PowerUpManager.js';

const game = new Game('gameCanvas');

game.addModule('background', new Background());
game.addModule('input', new InputHandler());
game.addModule('ui', new UIManager());
game.addModule('projectiles', new ProjectileManager());
game.addModule('experience', new ExperienceManager());
game.addModule('enemies', new EnemyManager());
game.addModule('particles', new ParticleManager());
game.addModule('upgrades', new UpgradeManager());
game.addModule('powerups', new PowerUpManager());
game.addModule('director', new SpawnDirector());


const player = new Player(window.innerWidth / 2, window.innerHeight / 2);
game.addModule('player', player);

game.start();