import { createTournament, getLiveTournaments } from "../db/queries/match.js";
import { GameStore } from "../game/GameStore.js";
import { Tournament } from "./Tournament.js";
import { tournamentConnection, TournamentParams } from "./Types.js";

export class TournamentManager {
	private tournaments: Map<number, Tournament> = new Map();
	private gameStore: GameStore;
	
	constructor(gameStore: GameStore) {
		this.gameStore = gameStore;
	}

	public init() {
		const tournaments = getLiveTournaments() as {id: number, max_players: number, created_at: number}[];
		tournaments.forEach((tournament) => {
			const newTournament = new Tournament(tournament.id, tournament.max_players, tournament.created_at, this.gameStore, this.removeTournament.bind(this));
			this.tournaments.set(tournament.id, newTournament);
		});
	}

	public addTournament(tournament: TournamentParams): void {
		const date = Date.now();
		const id = createTournament(tournament.maxPlayers, date);
		const newTournament = new Tournament(id, tournament.maxPlayers, date, this.gameStore, this.removeTournament.bind(this));
		this.tournaments.set(id, newTournament);
	}

	public removeTournament(tournamentId: number): void {
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}
		this.tournaments.delete(tournamentId);
	}

	public addPlayerToTournamentQueue(tournamentId: number, player: tournamentConnection): void {
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}
		tournament.addPlayer(player);
	}

	public removePlayerFromTournamentQueue(tournamentId: number, playerId: number): void {
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}
		tournament.removePlayer(playerId);
	}
}