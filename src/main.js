// core
import Game from './core/Core.js';
import InputHandler from './core/InputHandler.js';
import GamepadHandler from './core/GamepadHandler.js';

// entities
import DroneManager from './entities/DroneManager.js';
import EnemyManager from './entities/EnemyManager.js';
import ParticleManager from './entities/ParticleManager.js';
import Player from './entities/Player.js';
import ProjectileManager from './entities/ProjectileManager.js';

// systems
import AudioManager from './systems/AudioManager.js';
import AugmentManager from './systems/AugmentManager.js';
import CodexManager from './systems/CodexManager.js';
import ExperienceManager from './systems/ExperienceManager.js';
import PowerUpManager from './systems/PowerUpManager.js';
import SpawnDirector from './systems/SpawnDirector.js';
import SynergyManager from './systems/SynergyManager.js';
import UpgradeManager from './systems/UpgradeManager.js';

// ui
import Background from './ui/Background.js';
import UIManager from './ui/UIManager.js';
import MenuManager from './ui/MenuManager.js';


const game = new Game('gameCanvas');

game.addModule('background', new Background());
game.addModule('drones', new DroneManager());
game.addModule('input', new InputHandler());
game.addModule('gamepad', new GamepadHandler());
game.addModule('ui', new UIManager());
game.addModule('menu', new MenuManager());
game.addModule('projectiles', new ProjectileManager());
game.addModule('experience', new ExperienceManager());
game.addModule('enemies', new EnemyManager());
game.addModule('particles', new ParticleManager());
game.addModule('upgrades', new UpgradeManager());
game.addModule('powerups', new PowerUpManager());
game.addModule('director', new SpawnDirector());


const player = new Player(window.innerWidth / 2, window.innerHeight / 2);
game.addModule('player', player);
game.addModule('augments', new AugmentManager());
game.addModule('synergies', new SynergyManager());
game.addModule('codex', new CodexManager());
game.addModule('audio', new AudioManager());

game.start();