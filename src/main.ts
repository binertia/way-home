import * as THREE from 'three';
import { Game } from './game';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

// setup game
const game = new Game(canvas);
game.start();