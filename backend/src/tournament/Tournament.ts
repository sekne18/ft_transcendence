import { updateTournament } from "../db/queries/tournament.js";
import { GameStore } from "../game/GameStore.js";
import { Bracket, RoundMatch, TournamentConnection, TournamentEvent } from "./Types.js";
import { getMatchById } from "../db/queries/match.js";
import { PlayerConnection } from "../game/GameTypes.js";


export class Tournament {
	private id: number;
	private maxPlayers: number;
	private createdAt: number;
	private players: TournamentConnection[];
	private nextPlayers: {
		p1: PlayerConnection | null;
		p2: PlayerConnection | null;
	};
	private winners: number[];
	private bracket: Bracket | null;
	private status: 'pending' | 'ongoing' | 'finished';
	private gameStore: GameStore;
	private callbacks: ((event: TournamentEvent) => void)[];

	constructor(id: number, maxPlayers: number, createdAt: number, gameStore: GameStore,
		private matchEndCallback: (tId: number, mId: number) => void,
		private matchBeginCallback: (tId: number, mId: number) => void,
		private onEnd?: (id: number) => void) {
		this.id = id;
		this.maxPlayers = maxPlayers;
		this.createdAt = createdAt;
		this.players = [];
		this.winners = [];
		this.callbacks = [];
		this.bracket = null;
		this.status = 'pending';
		this.gameStore = gameStore;
		this.nextPlayers = {
			p1: null,
			p2: null,
		};
	}

	public getId(): number {
		return this.id;
	}

	public getMaxPlayers(): number {
		return this.maxPlayers;
	}

	public getCreatedAt(): number {
		return this.createdAt;
	}

	public getPlayerIds(): number[] {
		return this.players.map((player) => player.id);
	}

	public getStatus(): 'pending' | 'ongoing' | 'finished' {
		return this.status;
	}

	public getBracket(): Bracket | null {
		return this.bracket;
	}

	public addPlayer(player: TournamentConnection): void {
		if (this.players.length >= this.maxPlayers || this.status !== 'pending') {
			throw new Error("Tournament is full");
		}
		if (this.players.find((p) => p.id === player.id)) {
			throw new Error("Player already in tournament");
		}
		this.players.push(player);
		player.enteredTournament = this.id;
		this.notify({
			type: 'joined',
			data: {
				playerId: player.id,
			}
		});
		if (this.players.length === this.maxPlayers) {
			this.setupNextMatch();
		}
	}

	public subscribe(callback: (event: TournamentEvent) => void): () => void {
		this.callbacks.push(callback);
		return () => {
			this.callbacks = this.callbacks.filter((cb) => cb !== callback);
		};
	}

	private notify(event: TournamentEvent): void {
		this.callbacks.forEach((callback) => callback(event));
	}

	// requires this.winners to be set
	private setupNextMatch(): void {
		//if no match played yet: generate first round
		if (this.bracket === null) {
			this.status = 'ongoing';
			this.bracket = { rounds: [] };
			this.bracket.rounds.push(this.generateBracketRound());
			updateTournament(this.id, {
				status: this.status,
				startTime: Date.now(),
				bracket: this.bracket,
			});
			this.notify({
				type: 'bracket_update',
				data: {
					bracket: this.bracket,
				}
			});
		}
		let currentRound = this.bracket.rounds[this.bracket.rounds.length - 1];
		let nextMatch = currentRound.find((match) => match.matchId === null);
		//check if there is still a match to play in this round
		if (!nextMatch) {
			//check if there are still rounds to play
			if (currentRound.length === 1) {
				this.status = 'finished';
				updateTournament(this.id, {
					status: this.status,
					endTime: Date.now(),
					bracket: this.bracket,
				});
				this.notify({
					type: 'bracket_update',
					data: {
						bracket: this.bracket,
					}
				});
				this.onEnd?.(this.id);
				return;
			}
			//if so, generate next round
			this.bracket.rounds.push(this.generateBracketRound());
			updateTournament(this.id, {
				status: this.status,
				bracket: this.bracket,
			});
			this.notify({
				type: 'bracket_update',
				data: {
					bracket: this.bracket,
				}
			});
			currentRound = this.bracket.rounds[this.bracket.rounds.length - 1];
			nextMatch = currentRound.find((match) => match.matchId === null);
			if (!nextMatch) {
				throw new Error("No match to start");
			}
		}
		this.notify({
			type: 'setup_match',
			data: {
				p1: nextMatch!.playerIds.p1,
				p2: nextMatch!.playerIds.p2,
			},
		});
	}

	private startMatch(p1: PlayerConnection, p2: PlayerConnection): void {
		setTimeout(() => {
			const currentRound = this.bracket!.rounds[this.bracket!.rounds.length - 1];
			const nextMatch = currentRound.find((match) => match.matchId === null);
			if (!nextMatch) {
				throw new Error("No match to start");
			}
			const matchId = this.gameStore.addGame(
				p1,
				p2,
				{
					tournamentId: this.id,
					round: this.bracket!.rounds.length - 1,
				},
				this.onMatchEnd.bind(this)
			);
			nextMatch.matchId = matchId;
			updateTournament(this.id, {
				bracket: this.bracket!,
			});
			this.notify({
				type: 'bracket_update',
				data: {
					bracket: this.bracket!,
				}
			});
			this.matchBeginCallback(this.id, matchId);
		}, 2000); //TODO: move hardcoded value
	}

	private onMatchEnd(matchId: number): void {
		const currentRound = this.bracket!.rounds[this.bracket!.rounds.length - 1];
		const match = currentRound.find((match) => match.matchId === matchId);
		if (!match) {
			throw new Error("Match not found");
		}
		const dbMatch = getMatchById(matchId) as { winner_id: number };
		if (!dbMatch) {
			throw new Error("Match not found in database");
		}
		const winnerId = dbMatch.winner_id;
		const playerIndex = this.players.findIndex((p) => p.id === winnerId);
		if (playerIndex === -1) {
			throw new Error("Winner not found in tournament");
		}
		this.winners.push(winnerId);
		match.winnerId = winnerId;
		this.matchEndCallback(this.id, matchId);
		setTimeout(() => {
			this.setupNextMatch();
		}, 3000); //TODO: move hardcoded value
	}

	public setPlayerReady(player: PlayerConnection): void {
		const nextMatch = this.bracket!.rounds[this.bracket!.rounds.length - 1].find((match) => match.matchId === null);
		if (!nextMatch) {
			throw new Error("No match to set ready");
		}
		if (nextMatch.playerIds.p1 === player.id) {
			this.nextPlayers.p1 = player;
		} else if (nextMatch.playerIds.p2 === player.id) {
			this.nextPlayers.p2 = player;
		}
		else {
			throw new Error("Player not in next match");
		}
		const p1 = this.players.find((p) => p.id === nextMatch.playerIds.p1);
		const p2 = this.players.find((p) => p.id === nextMatch.playerIds.p2);
		if (this.nextPlayers.p1 && this.nextPlayers.p2) {
			this.startMatch(this.nextPlayers.p1, this.nextPlayers.p2);
			this.nextPlayers.p1 = null;
			this.nextPlayers.p2 = null;
		}
	}

	public removePlayer(playerId: number): void {
		if (this.status !== 'pending') {
			throw new Error("Tournament is not pending");
		}
		const playerIndex = this.players.findIndex((p) => p.id === playerId);
		if (playerIndex === -1) {
			throw new Error("Player not found");
		}
		const player = this.players[playerIndex];
		player.enteredTournament = null;
		this.players.splice(playerIndex, 1);
		this.notify({
			type: 'left',
			data: {
				playerId,
			}
		});
	}

	public hasPlayer(playerId: number): boolean {
		return this.players.some((player) => player.id === playerId);
	}

	private generateBracketRound(): RoundMatch[] {
		const playerOrder: number[] = [];
		if (this.winners.length === 0) {
			this.winners = this.players.map((player) => player.id);
		}
		while (playerOrder.length < this.winners.length) {
			let randomIndex = Math.floor(Math.random() * this.winners.length);
			let playerId = this.winners[randomIndex];
			while (playerOrder.includes(playerId)) {
				randomIndex += 1;

				if (randomIndex >= this.winners.length) {
					randomIndex = 0;
				}
				playerId = this.winners[randomIndex];
			}
			playerOrder.push(playerId);
		}
		const round: RoundMatch[] = [];
		for (let i = 0; i < playerOrder.length - 1; i += 2) {
			round.push({
				matchId: null,
				winnerId: null,
				playerIds: { p1: playerOrder[i], p2: playerOrder[i + 1] },
			});
		}
		this.winners = [];
		return round;
	}
}