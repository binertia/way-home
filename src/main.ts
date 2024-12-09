import * as THREE from 'three';
import { Game } from './game';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

//game cycle
async function runGameLoop() {
	while (true) {
		const game = new Game(canvas);
		await game.start();
	}
}

runGameLoop().catch((error) => console.error("runGameLoop: error in game loop:", error));