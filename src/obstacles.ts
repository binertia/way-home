// 2: move diagonal way  ?? is this good idea?

// :TODO: make class boss extend obstacle

// :TODO: need refactor all this

// :TODO: make class for only audioListener make more clean

import * as THREE from 'three';

export class Obstacles {
private obstacles: {mesh: THREE.Mesh, hitCount: number, froze: boolean, base_froze: boolean, type: string}[] = [];
private spawnTimer: number = 0;

private obstacleRemoveCount: number = 0;
private obstacleTotalRemoveCount: number = 0;

private lvlOfGame: number = 0;
private stateBoss: boolean = false;
// private bossDefeated: boolean = false;  

private uiUpdater: any;
private gameOverStack: boolean = false;

private explosionSoundBuffer: AudioBuffer | null = null;
private audioPool: THREE.PositionalAudio[] = [];
private maxAudioInstances = 10;

constructor(private scene: THREE.Scene,uiUpdater: any, private listener: THREE.AudioListener) {
	this.uiUpdater = uiUpdater;

	const audioLoader = new THREE.AudioLoader();
	audioLoader.load('/sound/explosion.mp3', (buffer) => {
		this.explosionSoundBuffer = buffer;
	});
}
private createAudio(): THREE.PositionalAudio {
    if (this.audioPool.length > 0) {
        return this.audioPool.pop()!;
    }

    const positionalAudio = new THREE.PositionalAudio(this.listener);
    return positionalAudio;
}

private recycleAudio(audio: THREE.PositionalAudio): void {
    audio.stop();
    this.audioPool.push(audio);
    if (this.audioPool.length > this.maxAudioInstances) {
        this.audioPool.shift();
    }
}

private playExplosionSound(obstacle: THREE.Mesh): void {
    const positionalAudio = this.createAudio();
    obstacle.add(positionalAudio);

    if (this.explosionSoundBuffer) {
        positionalAudio.setBuffer(this.explosionSoundBuffer);
        positionalAudio.setRefDistance(10);
        positionalAudio.setVolume(0.4);
        positionalAudio.play();

        positionalAudio.onEnded = () => {
            obstacle.remove(positionalAudio);
            this.recycleAudio(positionalAudio);
        };
    }
}

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
	this.obstacles.push({mesh: obstacle, hitCount: 0, froze: false, base_froze: false, type: "keeKee"});
	this.scene.add(obstacle);
}

private spawnBoss() {
	const boss = new THREE.Mesh(
		new THREE.BoxGeometry(10, 1, 30),
		new THREE.MeshStandardMaterial({color: 0xA6AEBF})
	)
	boss.position.set(
		0,
		0,
		-55
	);
	this.obstacles.push({mesh: boss, hitCount: -80, froze: false, base_froze: false, type: "boss"})
	this.scene.add(boss);
}

update(delta: number, projectiles: THREE.Mesh[], listener: THREE.AudioListener) {

	if (this.obstacleTotalRemoveCount == 75) {
		this.lvlOfGame = 1;
		console.log("lvl 2")
	}
	if (this.obstacleTotalRemoveCount == 180) {
		this.lvlOfGame = 2;
		console.log("lvl boss")
	}

	this.spawnTimer += delta;
	switch (this.lvlOfGame) {
		case 0:
			if (this.spawnTimer > 2 ) {
				this.spawnTimer = 0;
				this.spawnObstacle();
			}
			break;
		case 1:
			if (this.spawnTimer > 1) {
				this.spawnTimer = 0;
				this.spawnObstacle();
			}
			break;
		case 2:
			if (!this.stateBoss) {
				
				this.stateBoss = true;
				setTimeout(() => {
					this.spawnBoss();
				}, 5000)
			}
	}

	const obstaclesToRemove: { index: number, mesh: THREE.Mesh }[] = [];

	for (let i = this.obstacles.length - 1; i >= 0; i--) {
		const { mesh, hitCount = 0, froze = false ,base_froze = false, type} = this.obstacles[i];
		
		let velocity = 0.1;
		//move obstacles forward if not frozen
		if (!this.obstacles[i].froze && !this.obstacles[i].base_froze && !this.stateBoss) {
			mesh.position.z += velocity + delta;
		}
		if (this.stateBoss) {
			mesh.position.z += 0.08
		}

		//check collisions with projectiles
		for (let j = projectiles.length - 1; j >= 0; j--) {
			const projectile = projectiles[j];
			if (this.isCollide(projectile, mesh)) {
				this.obstacles[i].hitCount++;
				this.scene.remove(projectile);
				projectiles.splice(j, 1);

				if (this.obstacles[i].hitCount >= 2) {
					if (type === 'boss') {
						// this.bossDefeated = true;
						console.log('boss defeated');

						const audioLoader = new THREE.AudioLoader();
						const bossDefeatSound = new THREE.PositionalAudio(listener);
						audioLoader.load('/sound/boss_bomb.mp3', (buffer) => {
							bossDefeatSound.setBuffer(buffer);
							bossDefeatSound.setRefDistance(10);
							bossDefeatSound.setVolume(0.9);
							bossDefeatSound.loop = false;
							mesh.add(bossDefeatSound);
							bossDefeatSound.play();
						});
						setTimeout(() => {
						document.getElementById('end-context')!.classList.add('start-animation');
						}, 5000)
					}
					this.scene.remove(mesh);
					this.obstacleTotalRemoveCount++;
					if (this.obstacleRemoveCount < 40)
						this.obstacleRemoveCount++;
					this.playExplosionSound(this.obstacles[i].mesh);
					console.log(this.obstacleRemoveCount);
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
		if (this.obstacles[i].mesh.position.z < -15)
			this.gameOverStack = true;
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

// getter setter ORC

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
public getObstacleRemoveCount() {
	return this.obstacleRemoveCount as number;
}
public setObstacleRemoveCount (count: number): void {
	this.obstacleRemoveCount = count;
}

public getObstacles(): { mesh: THREE.Mesh; hitCount: number }[] {
	return this.obstacles;
}

public getGameOverStack(): boolean {
	return this.gameOverStack;
}

public getLvlOfGame(): number {
	return this.lvlOfGame;
}

}