import { PlayerConnection, QueuedPlayer } from "./GameTypes.js";
import { gameParams, matchmakerParams, aiParams } from "./GameParams.js";
import { AIPlayer } from "./AIPlayer.js";
import { GameStore } from "./GameStore.js";
import { updateUser } from "../db/queries/user.js";

export class MatchmakingManager {
	private lobbies: Map<number, QueuedPlayer[]> = new Map();
	private lobbyExpiries: Map<number, number> = new Map();
	private queue: QueuedPlayer[] = [];
	private updateInterval: NodeJS.Timeout | null = null;
	private gameStore: GameStore;

	constructor(gameStore: GameStore) {
		this.gameStore = gameStore;
	}

	public start(): void {
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
		}
		this.updateInterval = setInterval(() => {
			this.tryMatchPlayers();
		}, matchmakerParams.updateInterval * 1000);
	}

	public stop(): void {
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}
	}

	public createLobby(lobbyId: number, expires_at: number): void {
		if (this.lobbies.has(lobbyId)) {
			//throw new Error(`Lobby ${lobbyId} already exists`);
			console.warn(`Lobby ${lobbyId} already exists, returning`);
			return;
		}
		this.lobbies.set(lobbyId, []);
		this.lobbyExpiries.set(lobbyId, expires_at);
	}

	public removeLobby(lobbyId: number, close: boolean = true): void {
		if (!this.lobbies.has(lobbyId)) {
			throw new Error(`Lobby ${lobbyId} does not exist`);
		}
		if (close) {
			this.lobbies.get(lobbyId)?.forEach(player => {
				player.conn.socket.close(1000, "Lobby expired");
			});
		}
		this.lobbies.delete(lobbyId);
		this.lobbyExpiries.delete(lobbyId);
	}

	public enqueueLobby(lobbyId: number, conn: PlayerConnection): void {
		if (!this.lobbies.has(lobbyId)) {
			throw new Error(`Lobby ${lobbyId} does not exist`);
		}
		const lobby = this.lobbies.get(lobbyId)!;
		lobby.push({
			conn,
			joinedAt: Date.now(),
			rating: 0,
		});
		conn.socket.on("close", () => {
			this.dequeueLobby(lobbyId, conn);
		});
		if (lobby.length >= 2) {
			const p1 = lobby[0];
			const p2 = lobby[1];
			updateUser(p1.conn.id, { status: 'in-game' });
			updateUser(p2.conn.id, { status: 'in-game' });
			this.gameStore.addGame(p1.conn, p2.conn, { tournamentId: null, round: null });
			this.removeLobby(lobbyId, false);
		}
	}

	public dequeueLobby(lobbyId: number, conn: PlayerConnection): void {
		if (this.lobbies.has(lobbyId)) {
			const lobby = this.lobbies.get(lobbyId)!;
			this.lobbies.set(lobbyId, lobby.filter(p => p.conn.id !== conn.id));
		}
	}

	public enqueue(conn: PlayerConnection, rating: number): void {
		this.queue.push({
			conn,
			joinedAt: Date.now(),
			rating,
		});
		conn.socket.on("close", () => {
			this.dequeue(conn);
		});
	}

	public dequeue(conn: PlayerConnection): void {
		this.queue = this.queue.filter(p => p.conn.id !== conn.id);
	}

	private ratingWindow(player: QueuedPlayer, now: number): number {
		const timeInQueue = now - this.queue.find(p => p.conn.id === player.conn.id)?.joinedAt!;
		const growth = Math.min(matchmakerParams.WindowGrowthRate * timeInQueue, matchmakerParams.ratingWindowMax);
		return Math.max(matchmakerParams.ratingWindowMin, growth);
	}

	public tryMatchPlayers(): void {
		const now = Date.now();

		this.cleanupLobbies();

		// Try all pairs and find first compatible match
		for (let i = 0; i < this.queue.length; i++) {
			const p1 = this.queue[i];
			const range1 = this.ratingWindow(p1, now);

			for (let j = i + 1; j < this.queue.length; j++) {
				const p2 = this.queue[j];
				const range2 = this.ratingWindow(p2, now);

				const ratingDiff = Math.abs(p1.rating - p2.rating);
				const maxAllowedDiff = Math.min(range1, range2);

				if (ratingDiff <= maxAllowedDiff) {
					// Found match
					console.log(`Matched players ${p1.conn.id} and ${p2.conn.id} with rating difference ${ratingDiff}`);
					updateUser(p1.conn.id, { status: 'in-game' });
					this.gameStore.addGame(p1.conn, p2.conn, { tournamentId: null, round: null });
					this.queue.splice(j, 1);
					this.queue.splice(i, 1);
					return;
				}
			}
			if (Date.now() - p1.joinedAt > matchmakerParams.timeUntilAI * 1000) {
				// If player has been waiting too long, assign AI
				const aiPlayer = new AIPlayer(gameParams, aiParams);
				updateUser(p1.conn.id, { status: 'in-game' });
				this.gameStore.addGame(p1.conn, { id: 1, socket: aiPlayer }, { tournamentId: null, round: null });
				this.queue.splice(i, 1);
				return;
			}
		}
	}

	public cleanupLobbies(): void {
		const now = Date.now();
		this.lobbies.forEach((_, lobbyId) => {
			const expiryTime = this.lobbyExpiries.get(lobbyId);
			if (expiryTime && now > expiryTime) {
				this.removeLobby(lobbyId);
			}
		});
	}
};