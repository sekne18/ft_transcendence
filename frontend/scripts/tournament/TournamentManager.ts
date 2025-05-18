import { GameRenderer } from "../game/GameRenderer";
import { GameState } from "../game/GameTypes";
import { Profile } from "../profile/Types";
import { loadContent } from "../router/router";
import { State } from "../state/State";
import { showToast } from "../utils";
import { wsConfig } from "../wsConfig";
import { Bracket, RoundMatch, Tournament, TournamentMsgIn, TournamentMsgOut, TournamentView } from "./types";

export class TournamentManager {
	private socket: WebSocket;
	private user: {
		id: number,
		username: string,
		display_name: string,
		email: string,
		avatar_url: string,
		wins: number,
		losses: number,
		games_played: number,
	};
	private tournaments: Map<number, Tournament> = new Map();
	private tournamentContainer: HTMLDivElement;
	private tournamentCanvas: HTMLCanvasElement;
	private lastTournamentTime: number | null = null;
	private gameRenderer: GameRenderer | null = null;
	private gameState: GameState | null = null;

	constructor(user: Profile) {
		this.tournamentCanvas = document.getElementById("tournament-canvas") as HTMLCanvasElement;
		this.tournamentCanvas.classList.add('hidden');
		const closeBtn = document.getElementById('tournament-canvas-close-btn');
		if (closeBtn) {
			closeBtn.addEventListener('click', () => {
				const tournamentId = State.getState("tournament")?.targetId;
				if (!tournamentId) {
					console.error('Tournament ID not found');
					return;
				}
				this.toggleSpectate(tournamentId);
			});
		}
		this.tournamentContainer = document.getElementById("tournament-container") as HTMLDivElement;
		this.tournamentContainer.innerHTML = "";
		// document.getElementById('modal-close-btn')?.addEventListener('click', this.closeJoinModal.bind(this));
		document.getElementById('join-tournament-btn')?.addEventListener('click', () => {
			this.joinTournament();
			this.closeJoinModal();
		});
		document.getElementById('modal-cancel-btn')?.addEventListener('click', this.closeJoinModal.bind(this));
		const state = State.getState("tournament");
		if (state && state.socket) {
			this.socket = state.socket;
		} else {
			this.socket = new WebSocket(`${wsConfig.scheme}://${wsConfig.host}/api/tournament/ws`);
			this.socket.addEventListener('open', () => {
				console.log('Connected to tournament server');
			}
			);
			this.socket.addEventListener('message', event => {
				const msg = JSON.parse(event.data);
				console.log('Received message:', msg);
				this.processMsg(msg);
			});
			this.socket.addEventListener('close', () => {
				console.log('Disconnected from tournament server');

			});
			this.socket.addEventListener('error', err => {
				console.error('WebSocket error:', err);
			});
		}
		State.setState("tournament", {
			isPlaying: false,
			targetId: null,
			id: null,
			socket: this.socket,
			watch: false
		});
		this.user = user; //TODO: if user is allowed to edit their profile during tournaments, this should be fetched every time
		this.fetchTournamentList();
	}

	private handleJoined(data: {tournamentId: number, playerId: number}): void {
		const tournament = this.tournaments.get(data.tournamentId);
		if (tournament) {
			fetch(`/api/user/profile/${data.playerId}`, {
				method: 'GET',
				credentials: 'include',
			})
				.then(response => {
					if (!response.ok) {
						throw new Error('Network response was not ok');
					}
					return response.json();
				}
				).then(data => {
					const player = data.user as Profile;
					tournament.players.push(player);
					this.renderTournaments();
				})
				.catch(error => {
					console.error('There was a problem with the fetch operation:', error);
					showToast('Error', 'Failed to fetch player data', 'error');
				});
		}
		else {
			console.error('Tournament not found:', data.tournamentId);
		}
	}

	private handleLeft(data: {tournamentId: number, playerId: number}): void {
		const tournament = this.tournaments.get(data.tournamentId);
		if (tournament) {
			tournament.players = tournament.players.filter((player: Profile) => player.id !== data.playerId);
			this.renderTournaments();
		}
		else {
			console.error('Tournament not found:', data.tournamentId);
		}
	}

	private handleBracketUpdate(data: {tournamentId: number, bracket: Bracket}): void {
		const tournament = this.tournaments.get(data.tournamentId);
		if (tournament) {
			tournament.bracket = data.bracket;
			console.log('Bracket updated:', tournament.bracket);
			this.renderTournaments();
		}
		else {
			console.error('Tournament not found:', data.tournamentId);
		}
	}

	private handleSetupMatch(data: {tournamentId: number, p1: number, p2: number}): void {
		const tournament = this.tournaments.get(data.tournamentId);
		if (tournament) {
			if (data.p1 === this.user.id || data.p2 === this.user.id) {
				const state = State.getState("tournament");
				if (!state) {
					console.error('Tournament state not found');
					showToast('Error', 'Tournament state not found', 'error');
					return;
				}
				state.isPlaying = true;
				state.targetId = state.targetId;
				state.id = tournament.id;
				State.setState("tournament", state);
				loadContent('/game');
			} else {
				tournament.status = 'ongoing';
				const player1 = tournament.players.find(p => p.id === data.p1);
				const player2 = tournament.players.find(p => p.id === data.p2);
				if (player1 && player2) {
					showToast('Match Setup', `Match setup between ${player1.username} and ${player2.username}`, 'info');
				}
				else {
					console.error('Player not found:', data.p1, data.p2);
				}
				this.renderTournaments();
			}
		}
			
	}

	private processMsg(msg: TournamentMsgIn): void {
		console.log('Processing message:', msg);
		switch (msg.type) {
			case 'joined':
				this.handleJoined(msg.data);
				break;
			case 'left':
				this.handleLeft(msg.data);
				break;
			case 'bracket_update':
				this.handleBracketUpdate(msg.data);
				break;
			case 'setup_match':
				this.handleSetupMatch(msg.data);
				break;
			// case 'start_spectate':
			// 	this.gameRenderer = new GameRenderer(this.tournamentCanvas, msg.data.matchId, this.socket);
			// 	this.tournamentCanvas.classList.remove('hidden');
			// 	break;
			// case 'game_state':
			// 	if (this.gameRenderer) {
			// 		this.gameState = msg.data;
			// 		this.gameRenderer.updateGameState(this.gameState);
			// 	}
			// 	break;
			default:
				//console.error('Unknown message type:', msg.type);
		}
	}

	private openJoinModal(): void {
		const modal = document.getElementById('join-modal');
		const modalAvatar = document.getElementById('modal-avatar') as HTMLImageElement | null;
		const modalUsername = document.getElementById('modal-username');
		//const modalLevel = document.getElementById('modal-level');
		const modalWins = document.getElementById('modal-wins');
		const modalLosses = document.getElementById('modal-losses');


		if (modal) {
			modal.classList.remove('hidden');
		}
		if (modalAvatar && this.user.avatar_url) {
			modalAvatar.src = this.user.avatar_url;
		}
		if (modalUsername) {
			modalUsername.textContent = this.user.username;
		}
		if (modalWins) {
			modalWins.textContent = this.user.wins?.toString() || '0';
		}
		if (modalLosses) {
			modalLosses.textContent = this.user.losses?.toString() || '0';
		}
	}

	private closeJoinModal(): void {
		const modal = document.getElementById('join-modal');
		if (modal) {
			modal.classList.add('hidden');
		}
	}

	private joinTournament(): void {
		const state = State.getState("tournament");
		if (!state) {
			console.error('Tournament state not found');
			showToast('Error', 'Tournament state not found', 'error');
			return;
		}
		else if (!state.targetId) {
			console.error('Target ID not found');
			showToast('Error', 'Target ID not found', 'error');
			return;
		}
		this.socket.send(JSON.stringify({
			type: 'join',
			data: {
				tournamentId: state.targetId
			}
		} as TournamentMsgOut));
	}

	private leaveTournament(tournament: Tournament): void {
		this.socket.send(JSON.stringify({
			type: 'leave',
			data: {
				tournamentId: tournament.id
			}
		} as TournamentMsgOut));
	}

	private createHeaderEl(tournament: Tournament): HTMLDivElement {
		const headerEl = document.createElement('div');
		headerEl.id = 'tournament-header';
		const title = document.createElement('h1');
		title.className = 'text-2xl font-bold';
		title.textContent = 'Tournament';
		const subtitle = document.createElement('p');
		subtitle.className = 'text-gray-500';
		subtitle.textContent = `Compete in ${tournament.maxPlayers}-player tournament`;
		const headerInfo = document.createElement('div');
		headerInfo.appendChild(title);
		headerInfo.appendChild(subtitle);
		const headerActions = document.createElement('div');
		if (tournament.status === 'pending' && !tournament.players.some((p: Profile) => p.id === this.user.id)) {
			const joinButton = document.createElement('button');
			joinButton.id = 'join-button';
			joinButton.className = 'bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mr-2';
			joinButton.innerHTML = `Join Tournament`;
			joinButton.addEventListener('click', () => {
				const state = State.getState("tournament");
				if (!state) {
					console.error('Tournament state not found');
					showToast('Error', 'Tournament state not found', 'error');
					return;
				}
				state.targetId = tournament.id;
				State.setState("tournament", state);
				this.openJoinModal();
			});
			headerActions.appendChild(joinButton);
		} else if (tournament.status === 'pending' && tournament.players.some((p: Profile) => p.id === this.user.id)) {
			const leaveButton = document.createElement('button');
			leaveButton.className = 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg mr-2';
			leaveButton.textContent = 'Leave Queue';
			leaveButton.addEventListener('click', () => {
				this.leaveTournament(tournament);
			});
			headerActions.appendChild(leaveButton);
		}
		headerEl.className = 'mb-8 flex justify-between items-center';
		headerEl.appendChild(headerInfo);
		headerEl.appendChild(headerActions);

		const statusBadgeContainer = document.getElementById('tournament-status-container');
		if (statusBadgeContainer) {
			statusBadgeContainer.innerHTML = '';

			const statusBadge = document.createElement('span');
			statusBadge.id = 'tournament-status';
			statusBadge.className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tournament.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
				tournament.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
					'bg-green-100 text-green-800'
				}`;
			statusBadge.textContent =
				tournament.status === 'pending' ? 'Queuing' :
					tournament.status === 'ongoing' ? 'In Progress' :
						'Completed';
			statusBadgeContainer.appendChild(statusBadge);
		}
		return headerEl;
	}

	private renderPlayerInfo(player: Profile | undefined): string {
		if (!player) {
			return `<div class="text-gray-500">TBD</div>`;
		}
		return `
			<div class="flex items-center gap-2">
				<img src="${player.avatar_url}" alt="${player.username}" class="w-6 h-6 rounded-full">
				<span class="text-sm font-semibold">${player.username}</span>
			</div>
		`;
	}

	private toggleSpectate(tournamentId: number): void {
		const state = State.getState("tournament");
		if (!state) {
			console.error('Tournament state not found');
			showToast('Error', 'Tournament state not found', 'error');
			return;
		}
		let watch = false;
		if (state.watch) {
			watch = false;
			this.gameRenderer = null;
		} else {
			watch = true;
		}
		state.watch = watch;
		state.targetId = tournamentId;
		State.setState("tournament", state);
		this.socket.send(JSON.stringify({
			type: 'spectate',
			data: {
				watch: watch,
				tournamentId: tournamentId
			}
		} as TournamentMsgOut));
		this.tournamentCanvas.classList.toggle('hidden');
	}

	private async renderMatchCardTree(tournament: Tournament, match: RoundMatch): Promise<string> {
		console.log('Rendering match card:', match);
		// const winnerClass = match.winner ? 'bg-green-900 border-green-500' : 'bg-[#272735] border-[#3A3A49]';
		const player1: Profile = tournament.players.find(p => p.id === match.playerIds.p1)!;
		const player2: Profile = tournament.players.find(p => p.id === match.playerIds.p2)!;
		let matchDetails = null; 
		if (match.matchId) {
			const player1: Profile = tournament.players.find(p => p.id === match.playerIds.p1)!;
			const player2: Profile = tournament.players.find(p => p.id === match.playerIds.p2)!;
			const res = await fetch(`/api/match/${match.matchId}`, {
				method: 'GET',
				credentials: 'include'
			
			});
			if (!res.ok) {
				console.error('Failed to fetch match details:', res.statusText);
				return `<div class="text-gray-500">Match details not available</div>`;
			}
			const data = await res.json();
			if (!data) {
				console.error('Match details not found');
				return `<div class="text-gray-500">Match details not found</div>`;
			}
			matchDetails = data.match;
		}
		console.log('Match details:', matchDetails);
		const containerDiv = document.createElement('div');
		containerDiv.className = 'rounded-md border bg-[#ffc038] border-[#d49204] p-2 w-52 text-white flex flex-col justify-between h-32';
		containerDiv.innerHTML = `
			<div>
				<div class="flex justify-between items-center">
					<span>${this.renderPlayerInfo(player1)} <span class="text-xs">${matchDetails ? matchDetails?.player1_score : '0'}</span></span>
				</div>
				<div class="flex justify-between items-center">
					<span>${this.renderPlayerInfo(player2)} <span class="text-xs">${matchDetails ? matchDetails?.player2_score : '0'}</span></span>
				</div>
			</div>
		`;
		const subContainerDiv = document.createElement('div');
		subContainerDiv.className = 'flex justify-between items-center';
		subContainerDiv.innerHTML = `
			<span class="text-right text-xs text-gray-400">${matchDetails ? matchDetails?.status : 'pending'}</span>
		`;
		if (matchDetails && matchDetails.status !== 'finished') {
			const spectateBtn = document.createElement('button');
			spectateBtn.className = 'text-indigo-500 hover:text-indigo-400 text-xs';
			spectateBtn.textContent = 'Spectate';
			spectateBtn.addEventListener('click', () => {
				this.toggleSpectate(tournament.id);
			});
			subContainerDiv.appendChild(spectateBtn);
		}
		containerDiv.appendChild(subContainerDiv);
		return containerDiv.outerHTML;
	}

	private async renderRoundTree(tournament: Tournament, matches: RoundMatch[], roundNumber: number): Promise<string> {
		console.log('Rendering round:', roundNumber, 'Matches:', matches);
		const justifyContentClass = matches.length === 1 ? 'justify-center' : 'justify-around';
		const containerDiv = document.createElement('div');
		containerDiv.className = `flex flex-col items-center ${justifyContentClass} gap-y-4`;
		const roundTitle = document.createElement('h4');
		roundTitle.className = 'text-lg font-semibold mb-2';
		roundTitle.textContent = `Round ${roundNumber}`;
		containerDiv.appendChild(roundTitle);
		const matchesDiv = document.createElement('div');
		matchesDiv.className = `flex ${justifyContentClass} gap-x-8`;
		for (const match of matches) {
			const matchCard = await this.renderMatchCardTree(tournament, match);
			matchesDiv.innerHTML += matchCard;
		}
		containerDiv.appendChild(matchesDiv);
		return containerDiv.outerHTML;
		// return `
		// 	<div class="flex flex-col items-center ${justifyContentClass} gap-y-4">
		// 		<h4 class="text-lg font-semibold mb-2">Round ${roundNumber}</h4>
		// 		<div class="flex ${justifyContentClass} gap-x-8">
		// 			${matches.map(async match => await this.renderMatchCardTree(tournament, match)).join('')}
		// 		</div>
		// 	</div>
		// `;
	}

	private renderBracketTree(tournament: Tournament): HTMLDivElement {
		const bracketDiv = document.createElement('div');
		bracketDiv.className = 'flex flex-col items-center gap-y-12';

		if (!tournament.bracket) {
			bracketDiv.innerHTML = '<p class="text-gray-500">No matches available</p>';
			return bracketDiv;
		}
		const rounds = tournament.bracket.rounds.map((_, index) => index + 1);
		rounds.forEach(roundNumber => {
			const matchesInRound = tournament.bracket?.rounds[roundNumber - 1] || [];
			if (matchesInRound.length > 0) {
				this.renderRoundTree(tournament, matchesInRound, roundNumber)
					.then(roundHtml => {
						bracketDiv.innerHTML += roundHtml;
					})
					.catch(error => {
						console.error('Error rendering round:', error);
					}
					);
			}
		});

		return bracketDiv;
	}

	private renderQueueingState(tournament: Tournament): HTMLDivElement {
		const queueingDiv = document.createElement('div');
		queueingDiv.className = 'space-y-6';

		const progressDiv = document.createElement('div');
		const progressText = document.createElement('div');
		progressText.className = 'flex justify-between mb-2';
		progressText.innerHTML = `
			<span class="text-gray-500">Players Joined</span>
			<span class="font-semibold">${tournament.players.length}/${tournament.maxPlayers}</span>
		`;
		const progressBarBg = document.createElement('div');
		progressBarBg.className = 'relative h-2 bg-gray-200 rounded-full overflow-hidden';
		const progressBarFill = document.createElement('div');
		progressBarFill.className = 'absolute top-0 left-0 h-full bg-indigo-600';
		progressBarFill.style.width = `${(tournament.players.length / tournament.maxPlayers) * 100}%`;
		progressBarBg.appendChild(progressBarFill);
		progressDiv.appendChild(progressText);
		progressDiv.appendChild(progressBarBg);
		queueingDiv.appendChild(progressDiv);

		const playersListGrid = document.createElement('div');
		playersListGrid.id = 'players-list';
		playersListGrid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4';
		for (let i = 0; i < tournament.maxPlayers; i++) {
			const playerCard = document.createElement('div');
			playerCard.className = `bg-[#272735] rounded-xl p-4 ${i < tournament.players.length ? 'border border-indigo-500' : 'border border-dashed border-[#3A3A49]'}`;
			if (i < tournament.players.length) {
				const player = tournament.players[i];
				playerCard.innerHTML = `
					<div class="flex items-center gap-3">
						<img src="${player.avatar_url}" alt="${player.username}" class="w-10 h-10 rounded-full">
						<div>
							<p class="font-semibold text-white">${player.username}</p>
							<!-- <p class="text-gray-400 text-sm">Level ${player.wins}</p> -->
						</div>
					</div>
				`;
			} else {
				playerCard.innerHTML = `
					<div class="flex items-center justify-center h-16 text-gray-500">
						Waiting for player...
					</div>
				`;
			}
			playersListGrid.appendChild(playerCard);
		}
		queueingDiv.appendChild(playersListGrid);

		return queueingDiv;
	}

	private createTournamentElement(tournament: Tournament): HTMLDivElement {
		const tournamentEl = document.createElement('div');
		tournamentEl.id = `tournament-${tournament.id}`;
		tournamentEl.className = 'bg-white shadow-md rounded-lg p-4 mb-4';
		const headerEl = this.createHeaderEl(tournament);
		tournamentEl.appendChild(headerEl);
		if (tournament.status === 'pending') {
			tournamentEl.appendChild(this.renderQueueingState(tournament));
		} else {
			tournamentEl.appendChild(this.renderBracketTree(tournament));
		}
		return tournamentEl;
	}

	private addFinishedTournaments(): void {
		const before = this.lastTournamentTime ? this.lastTournamentTime : Date.now();
		fetch(`/api/tournament/finished?limit=5&before=${before}`, {
			method: 'GET',
			credentials: 'include',
		})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(async data => {
				console.log('Finished tournaments data:', data);
				const finishedTournaments = data.tournaments as TournamentView[];
				console.log('Finished tournaments:', finishedTournaments);
				if (finishedTournaments.length === 0) {
					showToast('Info', 'No more tournaments available', 'info');
					return;
				}
				this.lastTournamentTime = finishedTournaments[finishedTournaments.length - 1].endedAt;
				for (const tournamentView of finishedTournaments) {
					const tournament: Tournament = {
						id: tournamentView.id,
						maxPlayers: tournamentView.maxPlayers,
						createdAt: tournamentView.createdAt,
						status: tournamentView.status,
						bracket: tournamentView.bracket,
						players: []
					};
					for (const playerId of tournamentView.players) {
							const res = await fetch(`/api/user/profile/${playerId}`, {
								method: 'GET',
								credentials: 'include',
							});
							if (!res.ok) {
								showToast('Error', 'Failed to fetch player data', 'error');
								throw new Error('Network response was not ok');
							}
							const data = await res.json();
							tournament.players.push(data.user as Profile);
						}
					this.tournaments.set(tournament.id, tournament);
				}
				this.renderTournaments();
			})
			.catch(error => {
				console.error('There was a problem with the fetch operation:', error);
				showToast('Error', 'Failed to fetch finished tournaments', 'error');
			}
			);
	}

	private createFetchFinishedElement(): HTMLDivElement {
		const fetchFinishedEl = document.createElement('div');
		fetchFinishedEl.className = 'text-gray-500 text-center mt-4';
		const fetchFinishedBtn = document.createElement('button');
		fetchFinishedBtn.className = 'bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg';
		fetchFinishedBtn.textContent = 'Fetch Finished Tournaments';
		fetchFinishedBtn.addEventListener('click', this.addFinishedTournaments.bind(this));
		fetchFinishedEl.appendChild(fetchFinishedBtn);
		return fetchFinishedEl;
	}

	private renderTournaments(): void {
		this.tournamentContainer.innerHTML = '';
		this.tournaments.forEach(tournament => {
			const tournamentEl = this.createTournamentElement(tournament);
			this.tournamentContainer.appendChild(tournamentEl);
		});
		this.tournamentContainer.appendChild(this.createFetchFinishedElement());
	}

	private fetchTournamentList(): void {
		fetch('/api/tournament', {
			method: 'GET',
			credentials: 'include',
		})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(async data => {
				this.tournaments = new Map(data.tournaments.map((t: TournamentView) => {
					const tournament: Tournament = {
						id: t.id,
						maxPlayers: t.maxPlayers,
						createdAt: t.createdAt,
						status: t.status,
						bracket: t.bracket,
						players: []
					};
					return [tournament.id, tournament];
				}));
				for (const tournamentView of data.tournaments) {
					const tournament = this.tournaments.get(tournamentView.id);
					if (tournament) {
						for (const playerId of tournamentView.players) {
							const res = await fetch(`/api/user/profile/${playerId}`, {
								method: 'GET',
								credentials: 'include',
							});
							if (!res.ok) {
								showToast('Error', 'Failed to fetch player data', 'error');
								throw new Error('Network response was not ok');
							}
							const data = await res.json();
							tournament.players.push(data.user as Profile);
						}
					}
				}
				this.renderTournaments();
			})
			.catch(error => {
				console.error('There was a problem with the fetch operation:', error);
				showToast('Error', 'Failed to fetch tournaments', 'error');
			});
	}
}