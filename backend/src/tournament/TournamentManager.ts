import { GameStore } from "../game/GameStore.js";
import { Tournament } from "./Tournament.js";
import { TournamentConnection, TournamentEvent, TournamentMsgIn, TournamentMsgOut, TournamentParams, TournamentView } from "./Types.js";
import { createTournament, getLiveTournaments } from "../db/queries/tournament.js";
import fastifyWebsocket from "@fastify/websocket";

export class TournamentManager {
	private connectedPlayers: Map<number, TournamentConnection> = new Map();
	private tournaments: Map<number, Tournament> = new Map();
	private tournamentUnsubscribers: Map<number, () => void> = new Map();
	private gameStore: GameStore;

	constructor(gameStore: GameStore) {
		this.gameStore = gameStore;
	}

	public init() {
		const tournaments = getLiveTournaments() as { id: number, max_players: number, created_at: number }[];
		tournaments.forEach((tournament) => {
			const newTournament = new Tournament(tournament.id, tournament.max_players, tournament.created_at, this.gameStore, this.removeTournament.bind(this));
			this.tournaments.set(tournament.id, newTournament);
		});
	}

	public addTournament(tournament: TournamentParams): void {
		if (!isPowerOfTwo(tournament.maxPlayers))
			throw new Error("Max players must be a power of two");
		if (tournament.maxPlayers > 8)
			throw new Error("Max players must be less than or equal to 8");
		const date = Date.now();
		const id = createTournament(tournament.maxPlayers, date);
		const newTournament = new Tournament(id, tournament.maxPlayers, date, this.gameStore, this.removeTournament.bind(this));
		this.tournamentUnsubscribers.set(id, newTournament.subscribe((event: TournamentEvent) => {
			this.forwardTournamentEvent(id, event);
		}));
		this.tournaments.set(id, newTournament);
	}

	public getCurrentTournaments(): TournamentView[] {
		const tournaments = Array.from(this.tournaments.values());
		console.log("Current tournaments: ", tournaments);
		return tournaments.map((tournament) => {
			return {
				id: tournament.getId(),
				maxPlayers: tournament.getMaxPlayers(),
				createdAt: tournament.getCreatedAt(),
				status: tournament.getStatus(),
				players: tournament.getPlayerIds(),
				bracket: tournament.getBracket()
			};
		});
	}

	public removeTournament(tournamentId: number): void {
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}
		const unsubscribe = this.tournamentUnsubscribers.get(tournamentId);
		if (unsubscribe) {
			unsubscribe();
		}
		this.tournaments.delete(tournamentId);
	}

	public connectPlayer(player: { id: number, socket: fastifyWebsocket.WebSocket }): void {
		if (this.connectedPlayers.has(player.id)) {
			const playerConnection = this.connectedPlayers.get(player.id)!;
			if (playerConnection.socket) {
				playerConnection.socket.close();
			}
			playerConnection.socket = player.socket;
			return;
		}
		if (!player.socket) {
			throw new Error("Player socket not found");
		}
		const tournamentConnection = {
			id: player.id,
			enteredTournament: null,
			socket: player.socket,
		} as TournamentConnection;
		this.connectedPlayers.set(player.id, tournamentConnection);
		player.socket.on("close", () => {
			this.disconnectPlayer(player.id);
		});
		player.socket.on("error", () => {
			this.disconnectPlayer(player.id);
		});
		player.socket.on("message", (message) => {
			console.log(`Received message from player ${player.id}: ${message}`);
			const parsedMessage: TournamentMsgIn = JSON.parse(message.toString());
			this.handleMsg(player.id, parsedMessage);
		});
	}

	private handleMsg(playerId: number, message: TournamentMsgIn): void {
		const player = this.connectedPlayers.get(playerId);
		if (!player) {
			throw new Error("Player not found");
		}
		switch (message.type) {
			case "join":
				this.addPlayerToTournamentQueue(message.data.tournamentId, player);
				break;
			case "leave":
				this.removePlayerFromTournamentQueue(message.data.tournamentId, playerId);
				break;
			default:
				throw new Error("Unknown message type");
		}
	}

	private forwardTournamentEvent(tId: number, event: TournamentEvent): void {
		let message: TournamentMsgOut;
		switch (event.type) {
			case "setup_match":
				message = {
					type: "setup_match",
					tournamentId: tId,
					data: event.data,
				};
				break;
			case "joined":
				message = {
					type: "joined",
					tournamentId: tId,
					data: event.data,
				};
				break;
			case "left":
				message = {
					type: "left",
					tournamentId: tId,
					data: event.data,
				};
				break;
			case "bracket_update":
				message = {
					type: "bracket_update",
					tournamentId: tId,
					data: event.data,
				};
				break;
			default:
				throw new Error("Unknown event type");
		}
		if (this.tournaments.has(tId)) {
			this.broadcastMsg(message);
		}
	}

	public broadcastMsg(message: TournamentMsgOut): void {
		this.connectedPlayers.forEach((player) => {
			if (player.socket) {
				player.socket.send(JSON.stringify(message));
			}
		});
	}

	private disconnectPlayer(playerId: number): void {
		const player = this.connectedPlayers.get(playerId);
		if (!player) {
			throw new Error("Player not found");
		}
		this.connectedPlayers.delete(playerId);
		if (player.enteredTournament) {
			this.removePlayerFromTournamentQueue(player.enteredTournament, playerId);
			player.socket?.close();
			player.socket = null;
		}
	}

	private addPlayerToTournamentQueue(tournamentId: number, player: TournamentConnection): void {
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}
		if (tournament.getStatus() !== 'pending') {
			throw new Error("Tournament is not pending");
		}
		tournament.addPlayer(player);
	}

	public setPlayerReady(tournamentId: number, player: { id: number, socket: fastifyWebsocket.WebSocket }): void {
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}
		if (tournament.getStatus() !== 'pending') {
			throw new Error("Tournament is not pending");
		}
		tournament.setPlayerReady(player);
	}

	private removePlayerFromTournamentQueue(tournamentId: number, playerId: number): void {
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}
		if (tournament.getStatus() !== 'pending') return;
		tournament.removePlayer(playerId);
	}
}

function isPowerOfTwo(n: number): boolean {
	if (n <= 0) return false;
	return (n & (n - 1)) === 0;
}