// 2: move diagonal way :TODO:  ?? is this good idea?

// 4; bigger with boss slow movement
// 5: which boss fight i should do.



import * as THREE from 'three';

export class Obstacles {
private obstacles: {mesh: THREE.Mesh, hitCount: number, froze: boolean, base_froze: boolean}[] = [];
private spawnTimer: number = 0;
private obstacleRemoveCount: number = 0;
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

			if (this.obstacles[i].hitCount >= 2) {
				this.scene.remove(mesh);
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

}

export class UIUpdater {

private progressBar: SVGCircleElement;

constructor() {
	const progressCircle: SVGSVGElement = document.querySelector('.progress-circle') as SVGSVGElement;
	this.progressBar = progressCircle.querySelector('.progress-bar') as SVGCircleElement;
}

updateProgress(count: number, bombReady: boolean) {
	const progress = (count / 40) * 100;

	const offset = 440 - (440 * (count / 40));

if (bombReady) {
		this.progressBar?.classList.add('fire-effect');
		this.progressBar.style.strokeDashoffset = `${0}px`;
	} else {
		this.progressBar?.classList.remove('fire-effect');
		this.progressBar.style.strokeDashoffset = `${offset}px`;
	}
}
}