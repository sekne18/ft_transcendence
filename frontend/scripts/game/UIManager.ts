import { Profile } from "../profile/Types";
import { loadContent } from "../router/router";
import { getElement } from "../utils";

export class UIManager {
	private overlay: HTMLDivElement;
	private matchmakeButton: HTMLButtonElement;
	private reloadButton: HTMLButtonElement;
	private matchmakingIntervalId: number | null = null;
	private scoreLeft: HTMLDivElement;
	private scoreRight: HTMLDivElement;
	private userInfo: HTMLDivElement;
	private matchmakeTitle: HTMLDivElement;

	constructor(MatchmakeHandler: () => void) {
		this.overlay = document.getElementById('game-overlay') as HTMLDivElement;
		this.scoreLeft = document.getElementById('score-left') as HTMLDivElement;
		this.scoreRight = document.getElementById('score-right') as HTMLDivElement;
		this.userInfo = document.getElementById('game-user-info') as HTMLDivElement;
		this.matchmakeTitle = getElement('game-result-text') as HTMLDivElement;
		this.matchmakeButton = document.getElementById('game-matchmake-button') as HTMLButtonElement;
		this.reloadButton = document.getElementById('game-reload-button') as HTMLButtonElement;
		this.reloadButton.addEventListener('click', () => {
			console.log('Reloading game');
			this.toggleReloadButton('hidden');
			loadContent('/game');
		});
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
		this.matchmakeTitle.classList.remove('hidden');
		this.matchmakeButton.classList.add('hidden');
		this.reloadButton.classList.add('hidden');
	}

	public setGameOverOverlay(winner: true | false): void {
		this.matchmakeTitle.textContent = winner ? "You Win!" : "You Lose!";
		this.matchmakeTitle.classList.remove('hidden');
		this.matchmakeButton.classList.add('hidden');
		this.reloadButton.classList.add('hidden');
	}

	public setGoalOverlay(username: string): void {
		this.matchmakeTitle.textContent = `${username} Scored!`;
	}

	public toggleReloadButton(visibility: 'hidden' | 'visible'): void {
		this.matchmakeTitle.classList.add('hidden');
		if (visibility === 'hidden') {
			this.matchmakeButton.classList.remove('hidden');
			this.reloadButton.classList.add('hidden');
		}
		else {
			this.matchmakeButton.classList.add('hidden');
			this.reloadButton.classList.remove('hidden');
		}
	}


	// when called with 'loading' must call 'found' when opponent is found to clear interval
	public setMatchmakingOverlay(state: 'button' | 'loading' | 'found'): void {
		if (state === 'loading') {
			this.reloadButton.classList.add('hidden');
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
			this.matchmakeTitle.classList.add('hidden');
			this.matchmakeButton.classList.remove('hidden');
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

	private setLeftPlayerInfo(user: Profile) {
		const avatarEl = this.userInfo.querySelector('#game-left-avatar') as HTMLImageElement;
		console.log('el:', avatarEl);
		const usernameEl = this.userInfo.querySelector('#game-left-username') as HTMLSpanElement;
		const statsEl = this.userInfo.querySelector('#game-left-stats') as HTMLSpanElement;
		avatarEl.src = user.avatar_url;
		avatarEl.alt = user.username;
		usernameEl.innerText = user.username;
		statsEl.innerText = `Wins: ${user.wins} | Losses: ${user.losses}`;
	}

	private setRightPlayerInfo(user: Profile) {
		const avatarEl = this.userInfo.querySelector('#game-right-avatar') as HTMLImageElement;
		const usernameEl = this.userInfo.querySelector('#game-right-username') as HTMLSpanElement;
		const statsEl = this.userInfo.querySelector('#game-right-stats') as HTMLSpanElement;
		avatarEl.src = user.avatar_url;
		avatarEl.alt = user.username;
		usernameEl.innerText = user.username;
		statsEl.innerText = `Wins: ${user.wins} | Losses: ${user.losses}`;
	}

	public async setPlayerInfo(id: number | 'self', side: 'left' | 'right') {
		console.log('Fetching player info');
		let retries = 0;
		let uri = '/api/user/profile';
		if (id !== 'self') {
			uri = `/api/user/profile/${id}`;
		}
		while (retries < 3) {
			const res = await fetch(uri, {
				method: 'GET',
				credentials: 'include',
			});
			if (res.status === 200) {
				const data = await res.json();
				console.log('Player info:', data);
				if (!data.success) {
					retries++;
					continue;
				}
				if (side === 'left') {
					this.setLeftPlayerInfo(data.user);
				} else {
					this.setRightPlayerInfo(data.user);
				}
				return;
			} else {
				retries++;
			}
		}
	}
};