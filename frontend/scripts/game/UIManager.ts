export class UIManager {
	private overlay: HTMLDivElement;
	private score: HTMLDivElement;
	private userInfo: HTMLDivElement;
	private enemyInfo: HTMLDivElement;

	constructor(){
		this.overlay = document.getElementById('game-overlay') as HTMLDivElement;
		this.score = document.getElementById('game-score') as HTMLDivElement;
		this.userInfo = document.getElementById('game-user-info') as HTMLDivElement;
		this.enemyInfo = document.getElementById('game-enemy-info') as HTMLDivElement;
		this.overlay.style.display = 'none';
	}

	public showGameOverOverlay(): void {
		this.overlay.style.display = 'block';
	}

	public showCountdownOverlay(): void {
		this.overlay.style.display = 'block';
		this.overlay.innerText = "3";
	}

	public hideOverlay(): void {
		this.overlay.style.display = 'none';
	}

	public updateScore(left: number, right: number): void {
		this.score.innerText = `${left} : ${right}`;
	}

	public updateEnemyInfo(): void {
		this.enemyInfo.innerText = "Enemy Info";
	}
};