export class UIManager {
	private overlay: HTMLDivElement;
	private matchmakeButton: HTMLButtonElement;
	private matchmakingIntervalId: number | null = null;
	private score: HTMLDivElement;
	private userInfo: HTMLDivElement;
	private enemyInfo: HTMLDivElement;

	constructor(MatchmakeHandler: () => void) {
		this.overlay = document.getElementById('game-overlay') as HTMLDivElement;
		this.score = document.getElementById('game-score') as HTMLDivElement;
		this.userInfo = document.getElementById('game-user-info') as HTMLDivElement;
		this.enemyInfo = document.getElementById('game-enemy-info') as HTMLDivElement;
		this.matchmakeButton = document.getElementById('game-matchmake-button') as HTMLButtonElement;
		this.matchmakeButton.addEventListener('click', () => {
			this.setMatchmakingOverlay('loading');
			MatchmakeHandler();
		});
		this.setMatchmakingOverlay('button');
		this.toggleOverlayVisibility('visible');
	}

	public toggleOverlayVisibility(visibility: 'hidden' | 'visible' | null = null): void {
		if (visibility) {
			this.overlay.style.visibility = visibility;
			return;
		}
		if (this.overlay.style.visibility === 'hidden') {
			this.overlay.style.visibility = 'visible';
		}
		else {
			this.overlay.style.visibility = 'hidden';
		}
	}

	public setCountdownOverlay(str: string): void {
		this.overlay.innerText = str;
	}

	public setGameOverOverlay(winner: true | false): void {
		this.overlay.innerText = winner ? "You Win!" : "You Lose!";
	}

	public setGoalOverlay(username: string): void {
		this.overlay.innerText = `${username} Scored!`;
	}

	// when called with 'loading' must call 'found' when opponent is found to clear interval
	public setMatchmakingOverlay(state: 'button' | 'loading' | 'found'): void {
		if (state === 'loading') {
			this.overlay.innerText = "Searching for opponent";
			this.matchmakeButton.style.visibility = 'hidden';
			if (this.matchmakingIntervalId) {
				clearInterval(this.matchmakingIntervalId);
			}
			this.matchmakingIntervalId = setInterval(() => {
				this.overlay.innerText += '.';
				if (this.overlay.innerText.length > 25) {
					this.overlay.innerText = "Searching for opponent";
				}
			}
			, 1000);
		}
		else if (state === 'found') {
			this.overlay.innerText = "Opponent Found!";
			if (this.matchmakingIntervalId) {
				clearInterval(this.matchmakingIntervalId);
			}
		}
		else {
			this.matchmakeButton.style.visibility = 'visible';
		}
	}

	public updateScore(left: number, right: number): void {
		this.score.innerText = `${left} : ${right}`;
	}

	public updateEnemyInfo(): void {
		this.enemyInfo.innerText = "Enemy Info";
	}
};