import { gameParams } from "./GameParams.js";
import { GameSession } from "./GameSession.js";
import { MatchParams, PlayerConnection } from "./GameTypes.js";

export class GameStore {
	private gameSessions: Map<number, GameSession> = new Map();

	constructor() {
		// Initialize the game store
	}

	public addGame(p1: PlayerConnection, p2: PlayerConnection, matchParams: MatchParams, onEnd?: (id: number) => void): number {
		const session = new GameSession(p1, p2, gameParams, matchParams, (id: number) => {
			this.removeGame(id);
			if (onEnd)
				onEnd(id);
		});
		if (this.gameSessions.has(session.getId())) {
			throw new Error("Game session already exists");
		}
		this.gameSessions.set(session.getId(), session);
		session.start();
		return session.getId();
	}

	public spectateGame(sessionId: number, spectator: PlayerConnection): void {
		const session = this.gameSessions.get(sessionId);
		if (!session) {
			throw new Error("Game session not found");
		}
		session.spectate(spectator);
	}

	public removeGame(sessionId: number): void {
		this.gameSessions.delete(sessionId);
	}
}