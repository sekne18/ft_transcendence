import { MatchMakerParams, PlayerConnection, QueuedPlayer } from "./GameTypes.js";
import { GameSession } from "./GameSession.js";
import { gameParams } from "./GameParams.js";

export class MatchmakingManager {
	private queue: QueuedPlayer[] = [];
	private ratingWindowMin: number;
	private ratingWindowMax: number;
	private WindowGrowthRate: number;
	private interval: number;
	private updateInterval: NodeJS.Timeout | null = null;

	constructor(params: MatchMakerParams) {
		this.ratingWindowMin = params.ratingWindowMin;
		this.ratingWindowMax = params.ratingWindowMax;
		this.WindowGrowthRate = params.WindowGrowthRate;
		this.interval = params.updateInterval;
	}

	public start(): void {
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
		}
		this.updateInterval = setInterval(() => {
			this.tryMatchPlayers();
		}, this.interval);
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
		}
		);
	}

	public dequeue(conn: PlayerConnection): void {
		this.queue = this.queue.filter(p => p.conn.id !== conn.id);
	}

	private ratingWindow(player: QueuedPlayer, now: number): number {
		const timeInQueue = now - this.queue.find(p => p.conn.id === player.conn.id)?.joinedAt!;
		const growth = Math.min(this.WindowGrowthRate * timeInQueue, this.ratingWindowMax);
		return Math.max(this.ratingWindowMin, growth);
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
		}
	}
};