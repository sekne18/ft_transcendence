import { time } from "console";
import { GameInstance } from "./GameInstance.js";
import { GameParams, GameState, UserInput, wsMsg } from "./GameTypes.js";
import { PlayerConnection } from "./GameTypes.js";
import { createMatch, updateMatch } from "../db/queries/match.js";

export class GameSession {
	private game: GameInstance;
	private players: PlayerConnection[] = [];
	private intervalId: NodeJS.Timeout | null = null;
	private startTime: number | null = null;
	private params: GameParams;
	private matchId: number;

	constructor(Player1: PlayerConnection, Player2: PlayerConnection, params: GameParams, matchId: number) {
		this.params = params;
		this.game = new GameInstance(params, this.onGoal.bind(this), this.onGameOver.bind(this));
		this.players.push(Player1, Player2);
		if (matchId == -1)
			this.matchId = createMatch(this.players[0].id, this.players[1].id, 0, 0);
		else 
			this.matchId = matchId;
		this.players.forEach((player, i) => {
			player.socket.on("close", () => {
				this.stopGame();
				this.onDisconnect(player);
			});
			player.socket.on("error", (err) => {
				console.error("Socket error:", err);
				this.stopGame();
				this.onDisconnect(player);
			});
			player.socket.on("message", (msg: string) => {
				const parsedMsg = JSON.parse(msg);
				this.processMsg(parsedMsg);
			});
			player.socket.send(JSON.stringify({ type: "game_state", data: this.game.getState(), timestamp: Date.now() }));
			player.socket.send(JSON.stringify({
				type: "game_event", data: {
					event: "game_found",
					side: i === 0 ? 'left' : 'right',
					enemy_id: i === 0 ? this.players[1].id : this.players[0].id
				},
				timestamp: Date.now()
			}));
		});
	}

	public getPlayers(): PlayerConnection[] {
		return this.players;
	}

	public start(): void {
		if (this.players.length < 2) {
			throw new Error("Not enough players");
		}
		this.intervalId = setInterval(() => {
			this.game.updateState(1000 / this.params.FPS);
			this.players.forEach((player) => {
				//TODO: save state to db
				player.socket.send(JSON.stringify({ type: "game_state", data: this.game.getState(), timestamp: Date.now() }));
			});
		}
			, 1000 / this.params.FPS);
		this.players.forEach((player) => {
			player.socket.send(JSON.stringify({ type: "game_event", data: { event: "start_countdown", time: this.params.countdown }, timestamp: Date.now() }));
		});
		setTimeout(() => {
			this.startTime = Date.now();
			this.game.startGame();
		}, this.params.countdown * 1000);
	}

	public stopGame(): void {
		this.players.forEach((player) => {
			player.socket.close(1000, "Game Over");
		});
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	private onGoal(paddle: 'left' | 'right'): void {
		console.log("Goal scored by:", paddle);

		this.players.forEach((player) => {
			player.socket.send(JSON.stringify({ type: "game_state", data: this.game.getState(), timestamp: Date.now() }));
			player.socket.send(JSON.stringify({ type: "goal", data: paddle, timestamp: Date.now() }));
		});

		updateMatch(this.matchId, this.game.getState().left_score, this.game.getState().right_score);

		if (this.game.getState().left_score >= this.params.max_score || this.game.getState().right_score >= this.params.max_score) {
			return;
		}

		setTimeout(() => {
			this.players.forEach((player) => {
				player.socket.send(JSON.stringify({ type: "game_event", data: { event: "start_countdown", time: this.params.countdown }, timestamp: Date.now() }));
			});
			setTimeout(() => {
				this.game.startGame();
			}, this.params.countdown * 1000);
		}, 3000); //TODO: move hardcoded value
	};

	private onGameOver(): void {
		this.players.forEach((player) => {
			player.socket.send(JSON.stringify({ type: "game_event", data: { event: "game_over" }, timestamp: Date.now() }));
		});
		updateMatch(this.matchId, this.game.getState().left_score, this.game.getState().right_score, winner, 'completed');
		this.stopGame();
	};

	private onDisconnect(player: PlayerConnection): void {
		this.players = this.players.filter((p) => p.id !== player.id);
		this.players.forEach((p) => {
			p.socket.send(JSON.stringify({ type: "error", data: "disconnect", timestamp: Date.now() }));
			p.socket.send(JSON.stringify({ type: "game_event", data: { event: "game_over" }, timestamp: Date.now() }));
		}
		);
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