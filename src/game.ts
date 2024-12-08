import * as THREE from 'three';
import { Player } from './player';
import { Obstacles } from './obstacles';

export class Game {
private scene: THREE.Scene;
private camera: THREE.PerspectiveCamera;
private renderer: THREE.WebGLRenderer;
private player: Player;
private obstacles: Obstacles;
private clock: THREE.Clock;

constructor(private canvas: HTMLCanvasElement) {
	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera(105, window.innerWidth / window.innerHeight, 0.1, 1000);
	this.renderer = new THREE.WebGLRenderer({ canvas });
	this.renderer.setSize(window.innerWidth, window.innerHeight);

	this.clock = new THREE.Clock();

	// add light
	const light = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
	this.scene.add(light);

	// set up player and obs
	this.player = new Player(this.scene);
	this.obstacles = new Obstacles(this.scene);

	this.camera.position.set(0, 15, 3);
	this.camera.lookAt(0, 0, 0);
}

start() {
	this.animate();
}

private animationId: number = 0;

private animate = () => {
	const delta = this.clock.getDelta() + 0.1;

	this.player.update(delta);
	this.obstacles.update(delta);

	// obstacle touch player
	if (this.player.checkCollision(this.obstacles.getObstacles())) {
		console.log("game over baby");
		cancelAnimationFrame(this.animationId);
		return;
	}

	this.renderer.render(this.scene, this.camera);
	requestAnimationFrame(this.animate);
}
}