import { GameStore } from "../game/GameStore.js";
import { tournamentConnection } from "./Types.js";


export class Tournament {
	private id: number;
	private maxPlayers: number;
	private createdAt: number;
	private players: tournamentConnection[];
	private winners: number[];
	private bracket: number[] | null;
	private status: 'pending' | 'ongoing' | 'finished';
	private gameStore: GameStore;
	
	constructor(id: number, maxPlayers: number, createdAt: number, gameStore: GameStore, private onEnd?: (id: number) => void) {
		this.id = id;
		this.maxPlayers = maxPlayers;
		this.createdAt = createdAt;
		this.players = [];
		this.winners = [];
		this.bracket = null;
		this.status = 'pending';
		this.gameStore = gameStore;
	}

	public addPlayer(player: tournamentConnection): void {
		if (this.players.length >= this.maxPlayers || this.status !== 'pending') {
			throw new Error("Tournament is full");
		}
		if (this.players.find((p) => p.id === player.id)) {
			throw new Error("Player already in tournament");
		}
		this.players.push(player);
		player.socket?.on("close", () => {
			this.removePlayer(player.id);
		});
		player.socket?.on("error", () => {
			this.removePlayer(player.id);
		});
		player.socket?.on("message", (message) => {
			// Handle incoming messages from the player
			console.log(`Received message from player ${player.id}: ${message}`);
		});
		if (this.players.length === this.maxPlayers) {
			this.status = 'ongoing';
			this.bracket = this.generateBracket();
		}
	}

	public removePlayer(playerId: number): void {
		const player = this.players.find((p) => p.id === playerId);
		if (!player) {
			throw new Error("Player not found");
		}
		if (player.socket)
			player.socket.close();
		this.players = this.players.filter((player) => player.id !== playerId);
	}

	private generateBracket(): number[] {
		const brackets: number[] = [];
		if (this.winners.length === 0) {
			this.winners = this.players.map((player) => player.id);
		}
		while (brackets.length < this.winners.length) {
			let randomIndex = Math.floor(Math.random() * this.maxPlayers);
			let playerId = this.winners[randomIndex];
			while (brackets.includes(playerId)) {
				randomIndex += 1;

				if (randomIndex >= this.maxPlayers) {
					randomIndex = 0;
				}
				playerId = this.winners[randomIndex];
			}
			brackets.push(playerId);
		}
		return brackets;
	}
}