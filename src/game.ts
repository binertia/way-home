// need lvl design also dynamic delta for up lvl game play
// phase should be up every 30 sec

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
private starField: THREE.Points;

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

	// ------------ copy from internet : star field bg -------------
	let stars = new Array(0);
	for (let i = 0; i < 10000; i++) {
		let x = Math.random() * 2000 - 1000;
		let y = Math.random() * 2000 - 1000;
		let z = Math.random() * 2000 - 1000;
		stars.push(x, y, z);
	}
	
	let starsGeometry = new THREE.BufferGeometry();
	starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(stars, 3));
	let starsMaterial = new THREE.PointsMaterial({ color: 0x888888 });
	this.starField = new THREE.Points(starsGeometry, starsMaterial);
	this.scene.add(this.starField);
	// -----------------------------------------------------------
}

start() {
	this.animate();
}

private animationId: number = 0;

private animate = () => {
	const delta = this.clock.getDelta() + 0.02;

	this.player.update(delta);
	this.obstacles.update(delta, this.player.getProjectiles());

	this.starField.rotation.x += -0.0002;
    this.starField.rotation.y += 0.0001;
    this.starField.rotation.z += 0.0001;

	// obstacle collide player
	if (this.player.checkCollision(this.obstacles.getObstacles())) {
		console.log("game over baby");
		cancelAnimationFrame(this.animationId);
		return;
	}

	this.renderer.render(this.scene, this.camera);
	requestAnimationFrame(this.animate);
}
}