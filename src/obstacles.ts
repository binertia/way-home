// :TODO: make lvl design
// 1: simple obstacles
// 2: move diagonal way
// 3: faster
// 4; bigger with boss slow movement

// other :TODO: need max range of x player can travel

import * as THREE from 'three';

export class Obstacles {
private obstacles: THREE.Mesh[] = [];
private spawnTimer: number = 0;

constructor(private scene: THREE.Scene) {}

spawnObstacle() {
	const obstacle = new THREE.Mesh(
		new THREE.BoxGeometry(3, 1, 1),
		new THREE.MeshStandardMaterial({ color: 0xff0000 })
	);

	obstacle.position.set(
		Math.random() * 4 - 2, // -2 ... 2 for now
		0,
		-20
	);
	this.obstacles.push(obstacle);
	this.scene.add(obstacle);
}

update(delta: number) {
	this.spawnTimer += delta;
	if (this.spawnTimer > 2) {
		this.spawnTimer = 0;
		this.spawnObstacle();
	}

	// obstacle movement
	this.obstacles.forEach(obstacle => {
	obstacle.position.z += 0.2;

	// remove obstacle
	if (obstacle.position.z > 10) { // out of range
		this.scene.remove(obstacle);
		this.obstacles.splice(this.obstacles.indexOf(obstacle), 1);
	}
	});
}

// getter
getObstacles(): THREE.Mesh[] {
	return this.obstacles;
}

}