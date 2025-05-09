import { GameSession } from "../game/GameSession.js";
import { GameParams, PlayerConnection } from "../game/GameTypes.js";

export class TournamentBracket {
	private round1Winners: PlayerConnection[] = [];
	private semifinalsWinners: PlayerConnection[] = [];

	constructor(
		private players: PlayerConnection[],
		private gameParams: GameParams
	) {}

	public start(): void {
		console.log("Tournament started with players:", this.players.map(p => p.id));
		this.startQuarterFinals();
	}

	private startQuarterFinals(): void {
		for (let i = 0; i < 4; i++) {
			const p1 = this.players[i * 2];
			const p2 = this.players[i * 2 + 1];

			const session = new GameSession(p1, p2, this.gameParams, (winner) => {
				console.log(`Quarterfinal winner: ${winner.id}`);
				this.round1Winners.push(winner);
				if (this.round1Winners.length === 4) {
					this.startSemiFinals();
				}
			});
			session.start();
		}
	}

	private startSemiFinals(): void {
		console.log("Starting semifinals");

		for (let i = 0; i < 2; i++) {
			const p1 = this.round1Winners[i * 2];
			const p2 = this.round1Winners[i * 2 + 1];

			const session = new GameSession(p1, p2, this.gameParams, (winner) => {
				console.log(`Semifinal winner: ${winner.id}`);
				this.semifinalsWinners.push(winner);
				if (this.semifinalsWinners.length === 2) {
					this.startFinal();
				}
			});
			session.start();
		}
	}

	private startFinal(): void {
		console.log("Starting final match!");

		const [p1, p2] = this.semifinalsWinners;
		const session = new GameSession(p1, p2, this.gameParams, (winner) => {
			console.log(`🏆 Tournament winner: ${winner.id}`);
			p1.socket.send(JSON.stringify({ type: "tournament-finished", won: winner.id === p1.id }));
			p2.socket.send(JSON.stringify({ type: "tournament-finished", won: winner.id === p2.id }));
		});
		session.start();
	}
}
