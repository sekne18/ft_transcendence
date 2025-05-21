import { GameStore } from "../game/GameStore.js";
import { Tournament } from "./Tournament.js";
import { TournamentConnection, TournamentEvent, TournamentMsgIn, TournamentMsgOut, TournamentParams, TournamentView } from "./Types.js";
import { createTournament, getLiveTournaments } from "../db/queries/tournament.js";
import fastifyWebsocket from "@fastify/websocket";
import { ProxyPlayer } from "../game/ProxyPlayer.js";
import { updateUser } from "../db/queries/user.js";

export class TournamentManager {
	private connectedPlayers: Map<number, TournamentConnection> = new Map();
	private spectators: { id: number, socket: ProxyPlayer }[] = [];
	private tournaments: Map<number, Tournament> = new Map();
	private tournamentUnsubscribers: Map<number, () => void> = new Map();
	private activeMatches: number[] = [];
	private gameStore: GameStore;
	private readonly tournamentTabFilter: Map<string, boolean> = new Map([
		['game_state', true],
		['set_side', true],
		['goal', false],
		['error', false],
		['game_event', false]
	]);
	private readonly spectatorTabFilter: Map<string, boolean> = new Map([
		['game_state', false],
		['set_side', false],
		['goal', false],
		['error', false],
		['game_event', false]
	]);

	constructor(gameStore: GameStore) {
		this.gameStore = gameStore;
	}

	public init() {
		const tournaments = getLiveTournaments() as { id: number, max_players: number, created_at: number }[];
		tournaments.forEach((tournament) => {
			const newTournament = new Tournament(tournament.id, tournament.max_players, tournament.created_at, this.gameStore,
				this.onMatchEnd.bind(this), this.onMatchBegin.bind(this), this.removeTournament.bind(this));
			this.tournamentUnsubscribers.set(tournament.id, newTournament.subscribe((event: TournamentEvent) => {
				this.forwardTournamentEvent(tournament.id, event);
			}));
			this.tournaments.set(tournament.id, newTournament);
		});
	}

	public onMatchBegin(tournamentId: number, matchId: number): void {
		this.gameStore.spectateGame(matchId, this.spectators);
		this.activeMatches.push(matchId);
	}

	public onMatchEnd(tournamentId: number, matchId: number): void {
		this.activeMatches = this.activeMatches.filter((id) => id !== matchId);
	}

	public addTournament(tournament: TournamentParams): void {
		if (!isPowerOfTwo(tournament.maxPlayers))
			throw new Error("Max players must be a power of two");
		if (tournament.maxPlayers > 8)
			throw new Error("Max players must be less than or equal to 8");
		const date = Date.now();
		const id = createTournament(tournament.maxPlayers, date);
		const newTournament = new Tournament(id, tournament.maxPlayers, date, this.gameStore,
			this.onMatchEnd.bind(this), this.onMatchBegin.bind(this), this.removeTournament.bind(this));
		this.tournamentUnsubscribers.set(id, newTournament.subscribe((event: TournamentEvent) => {
			this.forwardTournamentEvent(id, event);
		}));
		this.tournaments.set(id, newTournament);
	}

	public getCurrentTournaments(): TournamentView[] {
		const tournaments = Array.from(this.tournaments.values());
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
		console.log("Removing tournament", tournamentId);
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}
		tournament.getPlayerIds().forEach((playerId) => {
			const player = this.connectedPlayers.get(playerId);
			if (player) {
				player.enteredTournament = null;
				updateUser(playerId, {
					status: 'online',
				});
			}
		});
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
		const spectator = { id: player.id, socket: new ProxyPlayer(this.tournamentTabFilter, tournamentConnection) };
		this.spectators.push(spectator);
		this.activeMatches.forEach((matchId) => {
			this.gameStore.spectateGame(matchId, spectator);
		});
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
				updateUser(playerId, {
					status: 'online',
				});
				break;
			default:
				throw new Error("Unknown message type");
		}
	}

	private forwardTournamentEvent(tId: number, event: TournamentEvent): void {
		console.log("Forwarding tournament event", event);
		let message: TournamentMsgOut;
		switch (event.type) {
			case "setup_match":
				message = {
					type: "setup_match",
					data: {
						tournamentId: tId,
						...event.data
					}
				};
				break;
			case "joined":
				message = {
					type: "joined",
					data: {
						tournamentId: tId,
						...event.data
					}
				};
				break;
			case "left":
				message = {
					type: "left",
					data: {
						tournamentId: tId,
						...event.data
					}
				};
				break;
			case "bracket_update":
				message = {
					type: "bracket_update",
					data: {
						tournamentId: tId,
						...event.data
					}
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
		this.spectators = this.spectators.filter((s) => s.id !== playerId);
		if (player.enteredTournament) {
			this.removePlayerFromTournamentQueue(player.enteredTournament, playerId);
			player.socket?.close();
			player.socket = null;
		}
		console.log("Player disconnected", playerId);
		console.log("Connected players", this.connectedPlayers);
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
		if (tournament.getStatus() !== 'ongoing') {
			throw new Error("Tournament is not ongoing");
		}
		tournament.setPlayerReady(player);
	}

	private removePlayerFromTournamentQueue(tournamentId: number, playerId: number): void {
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}
		if (tournament.getStatus() !== 'pending') return;
		if (!tournament.hasPlayer(playerId))
			throw new Error("Player not in tournament");
		tournament.removePlayer(playerId);
	}
}

function isPowerOfTwo(n: number): boolean {
	if (n <= 0) return false;
	return (n & (n - 1)) === 0;
}