// 2: move diagonal way :TODO:  ?? is this good idea?

// 4; bigger with boss slow movement
// 5: which boss fight i should do.



import * as THREE from 'three';

export class Obstacles {
private obstacles: {mesh: THREE.Mesh, hitCount: number, froze: boolean, base_froze: boolean}[] = [];
private spawnTimer: number = 0;

constructor(private scene: THREE.Scene) {}

spawnObstacle() {
	const obstacle = new THREE.Mesh(
		new THREE.BoxGeometry(Math.floor(Math.random()* 6) +1, 1, 1),
		new THREE.MeshStandardMaterial({ color: 0xff0000 })
	);

	obstacle.position.set(
		Math.random() * 8 - 4, // -4 ... 4 for now
		0,
		-30
	);
	this.obstacles.push({mesh: obstacle, hitCount: 0, froze: false, base_froze: false});
	this.scene.add(obstacle);
}

update(delta: number, projectiles: THREE.Mesh[]) {
	this.spawnTimer += delta;
	if (this.spawnTimer > 2) {
		this.spawnTimer = 0;
		this.spawnObstacle();
	}

const obstaclesToRemove: { index: number, mesh: THREE.Mesh }[] = [];

for (let i = this.obstacles.length - 1; i >= 0; i--) {
	const { mesh, hitCount = 0, froze = false ,base_froze = false} = this.obstacles[i];
	
	let velocity = 0.1;
	//move obstacles forward if not frozen
	if (!this.obstacles[i].froze && !this.obstacles[i].base_froze) {
		mesh.position.z += velocity + delta;
	}

	//check collisions with projectiles
	for (let j = projectiles.length - 1; j >= 0; j--) {
		const projectile = projectiles[j];
		if (this.isCollide(projectile, mesh)) {
			this.obstacles[i].hitCount++;
			this.scene.remove(projectile);
			projectiles.splice(j, 1);

			if (this.obstacles[i].hitCount >= 3) {
				this.scene.remove(mesh);
				obstaclesToRemove.push({ index: i, mesh });
				break;
			}
		}
	}

	//set base froze obstacles 
	if (mesh.position.z >= 14) {
		this.obstacles[i].froze = true;
		this.obstacles[i].base_froze = true;
	}

if (!this.obstacles[i].froze) {
		for (let k = 0; k < this.obstacles.length; k++) {
			if (i !== k) {
				const obstacleB = this.obstacles[k];
				if (obstacleB.froze && obstacleB.mesh.position.z > this.obstacles[i].mesh.position.z &&
					this.isCollideFrozeObstacle(this.obstacles[i].mesh, obstacleB.mesh)) {
					this.obstacles[i].froze = true;
				}
			}
		}
	}

	//check for unfroze
	if (this.obstacles[i].froze && !this.obstacles[i].base_froze) {
		let breakFree = true;
		for (let k = 0; k < this.obstacles.length; k++) {
			if (i !== k && this.obstacles[i].mesh.position.z < this.obstacles[k].mesh.position.z) {
				const obstacleB = this.obstacles[k];
				if (this.isCollideFrozeObstacle(this.obstacles[i].mesh, obstacleB.mesh) && obstacleB.froze)
					breakFree = false;
			}
		}
		if (breakFree)
			this.obstacles[i].froze = false;
		}
	}

	//remove obstacles clean way
	for (const { index, mesh } of obstaclesToRemove) {
		this.obstacles.splice(index, 1);
	}
}
private isCollideFrozeObstacle(obstacleA: THREE.Mesh, obstacleB: THREE.Mesh): boolean {
	const boxA = new THREE.Box3().setFromObject(obstacleA);
	const boxB = new THREE.Box3().setFromObject(obstacleB);

	return boxA.intersectsBox(boxB);
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