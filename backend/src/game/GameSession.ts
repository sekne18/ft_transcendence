import { GameInstance } from "./GameInstance.js";
import { GameParams, MatchParams, UserInput, wsMsg } from "./GameTypes.js";
import { PlayerConnection } from "./GameTypes.js";
import { createMatch, updateMatch } from "../db/queries/match.js";
import { updateUserStats } from "../db/queries/stats.js";
import { updateUser } from "../db/queries/user.js";

export class GameSession {
	private game: GameInstance;
	private players: PlayerConnection[] = [];
	private spectators: PlayerConnection[] = [];
	private intervalId: NodeJS.Timeout | null = null;
	private startTime: number | null = null;
	private params: GameParams;
	private matchId: number;
	private status: 'ongoing' | 'finished' | 'disconnected' = 'ongoing';
	private onEnd: ((id: number) => void) | null = null;

	constructor(Player1: PlayerConnection, Player2: PlayerConnection, gameParams: GameParams, matchParams: MatchParams, onEnd?: (id: number) => void) {
		this.onEnd = onEnd || null;
		this.params = gameParams;
		this.game = new GameInstance(gameParams, this.onGoal.bind(this), this.onGameOver.bind(this));
		this.players.push(Player1, Player2);
		this.matchId = createMatch(Player1.id, Player2.id, Date.now(), matchParams.tournamentId, matchParams.round);
		this.players.forEach((player, i) => {
			player.socket.on("close", () => {
				this.onDisconnect(player);
			});
			player.socket.on("error", (err) => {
				console.error("Socket error:", err);
				this.onDisconnect(player);
			});
			player.socket.on("message", (msg: string) => {
				const parsedMsg = JSON.parse(msg);
				this.processMsg(parsedMsg);
			});
			player.socket.send(JSON.stringify({
				type: "game_state",
				data: this.game.getState(),
				timestamp: Date.now()
			}));
			player.socket.send(JSON.stringify({
				type: "game_event",
				data: {
					event: "game_found",
					side: i === 0 ? 'left' : 'right',
					enemy_id: i === 0 ? this.players[1].id : this.players[0].id
				},
				timestamp: Date.now()
			}));
		});
		this.broadcastMsg({
			type: "game_state",
			data: this.game.getState(),
			timestamp: Date.now()
		});
	}

	private broadcastMsg(msg: wsMsg): void {
		this.players.forEach((player) => {
			player.socket.send(JSON.stringify(msg));
		});
		this.spectators.forEach((spectator) => {
			const specMsg: any = { ...msg };
			specMsg.matchId = this.matchId;
			spectator.socket.send(JSON.stringify(specMsg));
		});
	}

	public spectate(spectre: PlayerConnection): void {
		this.spectators.push(spectre);
		spectre.socket.on("close", () => {
			this.spectators = this.spectators.filter((s) => s.id !== spectre.id);
		});
		spectre.socket.on("error", (err) => {
			console.error("Socket error:", err);
			this.spectators = this.spectators.filter((s) => s.id !== spectre.id);
		});
		spectre.socket.send(JSON.stringify({ type: "game_state", data: this.game.getState(), timestamp: Date.now() }));
	}

	public getId(): number {
		return this.matchId;
	}

	public start(): void {
		if (this.players.length < 2) {
			throw new Error("Not enough players");
		}
		this.intervalId = setInterval(() => {
			this.game.updateState(1000 / this.params.FPS);
			this.broadcastMsg({
				type: "game_state",
				data: this.game.getState(),
				timestamp: Date.now()
			});
		}
			, 1000 / this.params.FPS);
		this.broadcastMsg({
			type: "game_event",
			data: { event: "start_countdown", time: this.params.countdown },
			timestamp: Date.now()
		});
		setTimeout(() => {
			this.startTime = Date.now();
			this.game.startGame();
		}, this.params.countdown * 1000);
	}

	public stopGame(): void {
		console.log("Stopping game");
		this.players.forEach((player) => {
			player.socket.close(1000, "Game Over");
		});
		// this.spectators.forEach((spectator) => {
		// 	spectator.socket.close(1000, "Game Over");
		// });
		this.players = [];
		this.spectators = [];
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		if (this.onEnd) {
			this.onEnd(this.matchId);
			this.onEnd = null;
		}
	}

	private onGoal(paddle: 'left' | 'right'): void {
		console.log("Goal scored by:", paddle);
		const gameState = this.game.getState();
		updateMatch(this.matchId, {
			score1: gameState.left_score,
			score2: gameState.right_score
		});
		this.broadcastMsg({
			type: "game_state",
			data: gameState,
			timestamp: Date.now()
		});
		this.broadcastMsg({
			type: "goal",
			data: paddle,
			timestamp: Date.now()
		});
		if (gameState.left_score >= this.params.max_score || gameState.right_score >= this.params.max_score) {
			return;
		}
		setTimeout(() => {
			this.broadcastMsg({
				type: "game_event",
				data: { event: "start_countdown", time: this.params.countdown },
				timestamp: Date.now()
			});
			setTimeout(() => {
				this.game.startGame();
			}, this.params.countdown * 1000);
		}, 3000); //TODO: move hardcoded value
	};

	private onGameOver(): void {
		this.status = 'finished';
		const gameState = this.game.getState();
		updateMatch(this.matchId, {
			winnerId: gameState.left_score > gameState.right_score ? this.players[0].id : this.players[1].id,
			endTime: Date.now(),
			score1: gameState.left_score,
			score2: gameState.right_score,
			status: 'finished'
		});
		this.broadcastMsg({
			type: "game_event",
			data: { event: "game_over" },
			timestamp: Date.now()
		});
		if (this.game.getState().left_score > this.game.getState().right_score) {
			updateUserStats(this.players[0].id, 1, 0, 1);
			updateUserStats(this.players[1].id, 0, 1, 1);
		} else {
			updateUserStats(this.players[0].id, 0, 1, 1);
			updateUserStats(this.players[1].id, 1, 0, 1);
		}
		this.players.forEach((player) => {
			updateUser(player.id, { status: 'online' });
		});
		this.stopGame();
	};

	private onDisconnect(player: PlayerConnection): void {
		if (this.status === 'disconnected' || this.status === 'finished') {
			return;
		}
		this.status = 'disconnected';
		updateUserStats(player.id, 0, 1, 1);
		updateUserStats(this.players[0].id === player.id ? this.players[1].id : this.players[0].id, 1, 0, 1);
		this.players = this.players.filter((p) => p.id !== player.id);
		const gameState = this.game.getState();
		updateMatch(this.matchId, {
			winnerId: this.players[0].id,
			endTime: Date.now(),
			score1: gameState.left_score,
			score2: gameState.right_score,
			status: 'disconnected'
		});
		updateUser(player.id, { status: 'online' });
		this.broadcastMsg({
			type: "error",
			data: "disconnect",
			timestamp: Date.now()
		});
		this.broadcastMsg({
			type: "game_event",
			data: { event: "game_over" },
			timestamp: Date.now()
		});
		this.stopGame();
	};

	private handleUserInput(input: { paddle: 'left' | 'right', input: UserInput }): void {
		this.game.receiveInput(input.paddle, input.input);
	}

	private processMsg(msg: wsMsg): void {
		switch (msg.type) {
			case "user_input":
				this.handleUserInput(msg.data);
				break;
			default:
				console.error("Unknown message type:", msg.type);
		}
	}
};