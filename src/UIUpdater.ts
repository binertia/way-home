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
