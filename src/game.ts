// need lvl design also dynamic delta for up lvl game play
// phase should be up every 30 sec

import * as THREE from 'three';
import { Player } from './player';
import { Obstacles } from './obstacles';
import { UIUpdater } from './obstacles';
export class Game {
private scene: THREE.Scene;
private camera: THREE.PerspectiveCamera;
private renderer: THREE.WebGLRenderer;
private player: Player;
private obstacles: Obstacles;
private clock: THREE.Clock;
private starField: THREE.Points;
private isStart: boolean = false;
private isStop: boolean = false; //async purpose
private animationId: number = 0;
private uiUpdate: any;
public listener: THREE.AudioListener = new THREE.AudioListener();

constructor(private canvas: HTMLCanvasElement) {
	//setup
	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera(105, window.innerWidth / window.innerHeight, 0.1, 1000);
	this.renderer = new THREE.WebGLRenderer({ canvas });
	this.renderer.setSize(window.innerWidth, window.innerHeight);

	this.clock = new THREE.Clock();

	//ui
	this.uiUpdate = new UIUpdater;

	//audio listener
	this.camera.add(this.listener);

	//add light
	const light = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
	this.scene.add(light);

	//setup player & obs
	this.player = new Player(this.scene, this.listener);
	this.obstacles = new Obstacles(this.scene, this.uiUpdate);

	this.camera.position.set(0, 15, 3);
	this.camera.lookAt(0, 0, 0);

	const progressContainer = document.getElementsByClassName("progress-container")[0] as HTMLElement
	if (progressContainer)
		progressContainer.style.visibility = "hidden"


	// ======== star field background =========
	const stars = [];
	for (let i = 0; i < 10000; i++) {
		const x = Math.random() * 2000 - 1000;
		const y = Math.random() * 2000 - 1000;
		const z = Math.random() * 2000 - 1000;
		stars.push(x, y, z);
	}

	const starsGeometry = new THREE.BufferGeometry();
	starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(stars, 3));
	const starsMaterial = new THREE.PointsMaterial({ color: 0x888888 });
	this.starField = new THREE.Points(starsGeometry, starsMaterial);
	this.scene.add(this.starField);
	// =========================================


	//handle start button
	const startButton = document.getElementById('startButton');
	if (startButton) {
		startButton.addEventListener('click', () => {
			const progressContainer = document.getElementsByClassName("progress-container")[0] as HTMLElement
			if (progressContainer)
				progressContainer.style.visibility = "visible"
			this.isStart = true;
			startButton.style.visibility = "hidden";
			console.log('game started');
		});
	} else {
		throw new Error("startButton error");
	}
}

public async start(): Promise<void> {
	let maxStart = 20;
	this.isStop = false;
	await new Promise<void>((resolve) => {
		const loop = async () => {
			if (this.isStop) {
				resolve();
				return;
			}
			const delta = (this.clock.getDelta() * 3) + 0.03;
			this.starField.rotation.x += -0.0002;
			this.starField.rotation.y += 0.0001;
			this.starField.rotation.z += 0.0001;

			if (this.isStart) {
				this.uiUpdate.updateProgress(this.obstacles.getObstacleRemoveCount(), this.player.getBombReady());
				this.player.update(delta);
				this.obstacles.update(delta, this.player.getProjectiles());
				if (this.obstacles.getObstacleRemoveCount() >= 40) {
					this.player.setBombReady(true);
				}
				if (this.player.getBombReady())
					this.obstacles.setObstacleRemoveCount(0);
				if (this.player.checkCollision(this.obstacles.getObstacles()) || this.obstacles.getGameOverStack()) {
					console.log("game over");

					await this.waitForRetry();

					this.stop();
					resolve();
					return;
				}
			}
			this.renderer.render(this.scene, this.camera);
			requestAnimationFrame(loop);
		};
		loop();
	});
}

private async waitForRetry(): Promise<void> {
	const retry = document.getElementById('retryContainer');
	if (!retry) return;

	retry.style.visibility = "visible";
	return new Promise<void>((resolveRetry) => {
		const onClick = () => {
			retry.style.visibility = "hidden";
			retry.removeEventListener('click', onClick);
			resolveRetry();
		};
		retry.addEventListener('click', onClick);
	});
}

public stop() {
	this.isStop = true;
	cancelAnimationFrame(this.animationId);
	console.log("game stop");
	document.getElementById('startButton')!.style.visibility = "visible"
}

public reset() {
	this.stop();
	this.renderer.dispose();
	this.scene.clear();
	this.canvas.width = 0;
	this.canvas.height = 0;
}
}