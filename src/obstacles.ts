// :TODO: make lvl design
// 1: simple obstacles
// 2: move diagonal way
// 3: faster
// 4; bigger with boss slow movement


// should i make projectile shoot randomly like gun spread shot? (4% .. -4%)


import * as THREE from 'three';

export class Obstacles {
private obstacles: {mesh: THREE.Mesh, hitCount: number}[] = [];
private spawnTimer: number = 0;

constructor(private scene: THREE.Scene) {}

spawnObstacle() {
	const obstacle = new THREE.Mesh(
		new THREE.BoxGeometry(1, 1, 1),
		new THREE.MeshStandardMaterial({ color: 0xff0000 })
	);

	obstacle.position.set(
		Math.random() * 8 - 4, // -4 ... 4 for now
		0,
		-30
	);
	this.obstacles.push({mesh: obstacle, hitCount: 0});
	this.scene.add(obstacle);
}

update(delta: number, projectiles: THREE.Mesh[]) {
	this.spawnTimer += delta;
	if (this.spawnTimer > 2) {
		this.spawnTimer = 0;
		this.spawnObstacle();
	}

	for (let i = this.obstacles.length - 1; i >= 0; i--) { // :TODO: need refactor this for loop asap
		const { mesh, hitCount } = this.obstacles[i];

		// move obs forward
		mesh.position.z += 0.1;

		// check collisions w/ projectile
		for (let j = projectiles.length - 1; j >= 0; j--) {
			const projectile = projectiles[j];
			if (this.isCollide(projectile, mesh)) {
				this.obstacles[i].hitCount++;

				// remove projectile
				this.scene.remove(projectile);
				projectiles.splice(j, 1);

				// break loop if obstacle destroyed
				if (this.obstacles[i].hitCount >= 3) { // obstacle destroy on got hit 3 times for now
					this.scene.remove(mesh);
					this.obstacles.splice(i, 1);
					break;
				}
			}
		}

		// remove obstacles out of range
		if (mesh.position.z > 18) {
			this.scene.remove(mesh);
			this.obstacles.splice(i, 1);
		}
	}
}

// check collide (for projectile shot)
private isCollide(sphere: THREE.Mesh, box: THREE.Mesh): boolean {
	const sphereBoundingSphere = new THREE.Sphere(
		sphere.position,
		(sphere.geometry.boundingSphere?.radius || 1) * sphere.scale.x
	);

	const boxBoundingBox = new THREE.Box3().setFromObject(box);

	return sphereBoundingSphere.intersectsBox(boxBoundingBox);
}

// getter
getObstacles(): { mesh: THREE.Mesh; hitCount: number }[] {
	return this.obstacles;
}
}