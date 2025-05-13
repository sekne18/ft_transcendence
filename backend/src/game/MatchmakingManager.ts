import { MatchMakerParams, PlayerConnection, QueuedPlayer, GameParams, AIPlayerParams } from "./GameTypes.js";
import { GameSession } from "./GameSession.js";
import { gameParams, matchmakerParams, aiParams } from "./GameParams.js";
import { AIPlayer } from "./AIPlayer.js";

export class MatchmakingManager {
	private queue: QueuedPlayer[] = [];
	private tournamentQueues: Map<number, PlayerConnection[]> = new Map();
	private updateInterval: NodeJS.Timeout | null = null;

	constructor() {
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

	public enqueueTournament(conn: PlayerConnection, tournamentId: number): void {
		if (!this.tournamentQueues.has(tournamentId)) {
			this.tournamentQueues.set(tournamentId, []);
		}
		this.tournamentQueues.get(tournamentId)?.push(conn);
		conn.socket.on("close", () => {
			this.dequeueTournament(conn, tournamentId);
		});
		if (this.tournamentQueues.get(tournamentId)?.length === 2) {
			const players = this.tournamentQueues.get(tournamentId)!;
			const session = new GameSession(players[0], players[1], gameParams);
			this.tournamentQueues.delete(tournamentId);
			session.start();
		}
	}

	public dequeue(conn: PlayerConnection): void {
		this.queue = this.queue.filter(p => p.conn.id !== conn.id);
	}

	public dequeueTournament(conn: PlayerConnection, tournamentId: number): void {
		if (this.tournamentQueues.has(tournamentId)) {
			this.tournamentQueues.set(tournamentId, this.tournamentQueues.get(tournamentId)?.filter(p => p.id !== conn.id) || []);
		}
	}

	private ratingWindow(player: QueuedPlayer, now: number): number {
		const timeInQueue = now - this.queue.find(p => p.conn.id === player.conn.id)?.joinedAt!;
		const growth = Math.min(matchmakerParams.WindowGrowthRate * timeInQueue, matchmakerParams.ratingWindowMax);
		return Math.max(matchmakerParams.ratingWindowMin, growth);
	}

	public tryMatchPlayers(): void {
		const now = Date.now();

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
					const session = new GameSession(p1.conn, p2.conn, gameParams);

					this.queue.splice(j, 1);
					this.queue.splice(i, 1);

					session.start();
					return;
				}
			}
			if (Date.now() - p1.joinedAt > matchmakerParams.timeUntilAI * 1000) {
				// If player has been waiting too long, assign AI
				const aiPlayer = new AIPlayer(gameParams, aiParams);
				const session = new GameSession(p1.conn, { id: 1, socket: aiPlayer }, gameParams);
				this.queue.splice(i, 1);
				session.start();
				return;
			}
		}
	}

	public startSession(p1: PlayerConnection, p2: PlayerConnection): void {
		const session = new GameSession(p1, p2, gameParams);
		session.start();
	};
};