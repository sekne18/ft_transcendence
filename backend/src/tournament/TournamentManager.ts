// // TournamentManager.ts
// import { PlayerConnection } from "./GameTypes.js";
// import { GameSession } from "./GameSession.js";
// import { gameParams } from "./GameParams.js";

// export class TournamentManager {
// 	private queue: PlayerConnection[] = [];

// 	constructor() {}

// 	public enqueue(conn: PlayerConnection): void {
// 		this.queue.push(conn);

// 		conn.socket.on("close", () => {
// 			this.dequeue(conn);
// 		});

// 		if (this.queue.length === 8) {
// 			this.startTournament();
// 		}
// 	}

// 	public dequeue(conn: PlayerConnection): void {
// 		this.queue = this.queue.filter(p => p.id !== conn.id);
// 	}

// 	private startTournament(): void {
// 		console.log("Starting tournament with 8 players...");

// 		// Shuffle players
// 		const shuffled = [...this.queue].sort(() => Math.random() - 0.5);

// 		// Clear queue
// 		this.queue = [];

// 		// Round 1 (4 matches)
// 		const round1 = [
// 			new GameSession(shuffled[0], shuffled[1], gameParams),
// 			new GameSession(shuffled[2], shuffled[3], gameParams),
// 			new GameSession(shuffled[4], shuffled[5], gameParams),
// 			new GameSession(shuffled[6], shuffled[7], gameParams),
// 		];

// 		// Start all first-round games
// 		round1.forEach(game => game.start());

// 		// Store game state and match winners to continue to semifinals/final
// 		// You’ll need to add logic to track winners, and when a game ends, advance the winner.
// 	}
// }
