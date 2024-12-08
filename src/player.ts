// for improve : change setInterval to use delta-based timer
// 
// other :TODO: need max range of x player can travel

import * as THREE from 'three';

// for x y z
type Vector3D = { x: number; y: number; z: number };

export class Player {
private mesh: THREE.Mesh;
private speed: number = 1.1;
private keys: Record<string, boolean> = {
	KeyW: false,
	KeyA: false,
	KeyS: false,
	KeyD: false,
	Space: false // Track space key for shooting
};

private position: Vector3D;
private velocity: Vector3D;

private projectiles: THREE.Mesh[] = [];
private projectileSpeed: number = 4;
private isShooting: boolean = false;
private shootingInterval: number = 0;

constructor(
	private scene: THREE.Scene,
	initialPosition: Vector3D = { x: 0, y: 0, z: 9 },  // start pos.z of player is 9 :TODO: fix hard code part
	initialVelocity: Vector3D = { x: 0, y: 0, z: 0 }
) {
	this.position = { ...initialPosition };
	this.velocity = { ...initialVelocity };
	this.mesh = this.createPlayerMesh();
	this.scene.add(this.mesh);

	this.mesh.position.set(this.position.x, this.position.y, this.position.z);

	window.addEventListener('keydown', this.handleKeyDown);
	window.addEventListener('keyup', this.handleKeyUp);
}

//make mesh
private createPlayerMesh(): THREE.Mesh {
	return new THREE.Mesh(
	new THREE.BoxGeometry(1, 1, 1),
	new THREE.MeshStandardMaterial({ color: 0x00ff00 })
	);
}

// == handle keys input ====

private handleKeyDown = (event: KeyboardEvent): void => {
	if (event.code in this.keys) {
		this.keys[event.code] = true;
	}
};

private handleKeyUp = (event: KeyboardEvent): void => {
	if (event.code in this.keys) {
		this.keys[event.code] = false;
	}
};

// :TODO: wait for refactor keys.Space handler
private processInput(): void {
	this.velocity.x = 0;
	this.velocity.z = 0;

	if (this.keys['Space'] && !this.isShooting) { // :TODO: should refactor
		this.isShooting = true;
		this.shoot(); // first shot
		this.shootingInterval = setInterval( () => {
			if (this.keys['Space'])
				this.shoot();
			else
				this.stopShoot();
		}, 200
		)
	}
	// :FIX: player velocity value
	if (this.keys['KeyA'] && this.position.x > -4)
		this.velocity.x = -0.1;
	else if (this.keys['KeyD'] && this.position.x < 4)
		this.velocity.x = 0.1;
	if (this.keys['KeyW'] && this.position.z > -14)
		this.velocity.z = -0.1;
	else if (this.keys['KeyS'] && this.position.z < 14)
		this.velocity.z = 0.101; 
}

// === make player can shoot ====
private shoot(): void {
	const projectile = this.createProjectile();
	this.projectiles.push(projectile);
	this.scene.add(projectile);
}

// setup projectile shot
private createProjectile(): THREE.Mesh {
	const projectile = new THREE.Mesh(
		new THREE.SphereGeometry(0.3, 16, 16), // :TODO: make type createPlayerMesh more useful? should i extend?
		new THREE.MeshStandardMaterial({ color: 0xff })
		);
	projectile.position.set(
		this.mesh.position.x,
		this.mesh.position.y,
		this.mesh.position.z
	);
	return projectile;
}

// add projectile const speed & remove projectile when out of range
private updateProjectiles(delta: number): void {
	for (let i = this.projectiles.length - 1; i >= 0; i--) {
		const projectile = this.projectiles[i];
		projectile.position.z -= this.projectileSpeed * delta + 0.3;

		if (projectile.position.z < -28) {
			this.scene.remove(projectile);
			this.projectiles.splice(i, 1);
		}
	}
}

// break Interval :TODO: make delta-value version and test
private stopShoot(): void {
	this.isShooting = false;
	clearInterval(this.shootingInterval)
}

// ===== make player speed more dimension
private applyDefaultMovement(delta: number): void {
	this.mesh.position.z -= this.speed * delta;
}

private updatePosition(): void {
	this.position.x += this.velocity.x;
	this.position.z += this.velocity.z;
	this.mesh.position.set(this.position.x, this.position.y, this.position.z);
}

// ======== default public ========
// update for apply animate
public update(delta: number): void {
	this.applyDefaultMovement(delta);
	this.processInput();
	this.updatePosition();
	this.updateProjectiles(delta);
}

// obstacle and player check collide
public checkCollision(obstacles: {mesh:THREE.Mesh, hitCount: number}[]): boolean {
	const playerBox = new THREE.Box3().setFromObject(this.mesh);
	for (const obstacle of obstacles) {
		const obstacleBox = new THREE.Box3().setFromObject(obstacle.mesh);
		if (playerBox.intersectsBox(obstacleBox)) return true;
	}
	return false;
}

// for obstacle collide check 
getProjectiles(): THREE.Mesh[] {
	return this.projectiles;
}
// ================================

public dispose(): void {
	this.stopShoot(); // in case pause while holding space
	window.removeEventListener('keydown', this.handleKeyDown);
	window.removeEventListener('keyup', this.handleKeyUp);
}
}