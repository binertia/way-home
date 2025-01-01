import { Game } from './game';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const backgroundMusic = new Audio('/sound/bg_music.mp3');

backgroundMusic.loop = true;
backgroundMusic.volume = 0.2;
document.body.addEventListener('click', () => {
	backgroundMusic.play().catch(error => {
		console.warn("autoplay got blocked");
	});
});
//game cycle
async function runGameLoop() {
	while (true) {
		const game = new Game(canvas);
		await game.start();
	}
}

runGameLoop().catch((error) => console.error("runGameLoop: error in game loop:", error));
