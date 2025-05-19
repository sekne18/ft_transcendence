import { getElement } from "../utils";

export class UIManager {
	private overlay: HTMLDivElement;
	private matchmakeButton: HTMLButtonElement;
	private matchmakingIntervalId: number | null = null;
	private scoreLeft: HTMLDivElement;
	private scoreRight: HTMLDivElement;
	private userInfo: HTMLDivElement;
	private enemyInfo: HTMLDivElement;
	private matchmakeTitle: HTMLDivElement;

	constructor(MatchmakeHandler: () => void) {
		this.overlay = document.getElementById('game-overlay') as HTMLDivElement;
		this.scoreLeft = document.getElementById('score-left') as HTMLDivElement;
		this.scoreRight = document.getElementById('score-right') as HTMLDivElement;
		this.userInfo = document.getElementById('game-user-info') as HTMLDivElement;
		this.enemyInfo = document.getElementById('game-enemy-info') as HTMLDivElement;
		this.matchmakeTitle = getElement('game-result-text') as HTMLDivElement;
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
		this.matchmakeTitle.textContent = str;
	}

	public setGameOverOverlay(winner: true | false): void {
		this.matchmakeTitle.textContent = winner ? "You Win!" : "You Lose!";
		setTimeout(() => {
			this.matchmakeTitle.classList.add('hidden');
			this.matchmakeButton.classList.remove('hidden');
		}, 2000);
	}

	public setGoalOverlay(username: string): void {
		this.matchmakeTitle.textContent = `${username} Scored!`;
	}

	// when called with 'loading' must call 'found' when opponent is found to clear interval
	public setMatchmakingOverlay(state: 'button' | 'loading' | 'found'): void {
		if (state === 'loading') {
			this.matchmakeButton.classList.add('hidden');
			this.matchmakeTitle.classList.remove('hidden');
			this.matchmakeTitle.textContent = "Searching for opponent";
			this.matchmakeButton.style.visibility = 'hidden';
			if (this.matchmakingIntervalId) {
				clearInterval(this.matchmakingIntervalId);
			}

			this.matchmakingIntervalId = setInterval(() => {
				this.matchmakeTitle.textContent += '.';
				if (this.matchmakeTitle?.textContent && this.matchmakeTitle.textContent.length > 25) {
					this.matchmakeTitle.textContent = "Searching for opponent";
				}
			}
			, 1000);
		}
		else if (state === 'found') {
			this.matchmakeTitle.textContent = "Opponent Found!";
			if (this.matchmakingIntervalId) {
				clearInterval(this.matchmakingIntervalId);
			}
		}
		else {
			this.matchmakeButton.style.visibility = 'visible';
		}
	}

	public getScore() {
		return {
			left_score: this.scoreLeft.innerHTML,
			right_score: this.scoreRight.innerHTML,
		};
	}

	public updateScore(left: number, right: number): void {
		this.scoreLeft.innerText = left.toString();
		this.scoreRight.innerText = right.toString();
	}

	public updateEnemyInfo(): void {
		this.enemyInfo.innerText = "Enemy Info";
	}
};