
import { GameState, GameParams, UserInput, AIPlayerParams } from "./GameTypes.js";

export class AIPlayer {
	private callbacks: { [key: string]: (data: any) => void } = {};
	private newestState: GameState;
	private currState: GameState;
	private gameParams: GameParams;
	private aiParams: AIPlayerParams;
	private moveInterval: NodeJS.Timeout | null = null;
	private checkInterval: NodeJS.Timeout | null = null;
	private side: 'left' | 'right' = 'left';

	constructor(gameParams: GameParams, params: AIPlayerParams){
		this.gameParams = gameParams;
		this.aiParams = params;
		this.currState = {
			left: { x: gameParams.paddle_offset, y: gameParams.arena_h / 2 },
			right: { x: gameParams.arena_w - gameParams.paddle_offset, y: gameParams.arena_h / 2 },
			ball: { x: gameParams.arena_w / 2, y: gameParams.arena_h / 2 },
			left_score: 0, right_score: 0,
			ball_v: { x: 0, y: 0 },
			ball_a: { x: 0, y: 0 },
			left_v: { x: 0, y: 0 },
			right_v: { x: 0, y: 0 },
			left_a: { x: 0, y: 0 },
			right_a: { x: 0, y: 0 },
		};
		this.newestState = this.currState;
	}

	private sendInput(input: { paddle: 'left' | 'right', input: UserInput }): void {
		if (this.callbacks["message"]) {
			this.callbacks["message"](JSON.stringify({ type: "user_input", data: input }));
		}
	}

	private getMoveDumb(): { paddle: 'left' | 'right', input: UserInput } {
		if (!this.currState) {
			throw new Error("Game state not set");
		}
		const ball = this.currState.ball;
		const paddle = this.side === 'left' ? this.currState.left : this.currState.right;

		let input: UserInput = 0;

		if (ball.y < paddle.y) {
			input = -1; // Move up
		} else if (ball.y > paddle.y) {
			input = 1; // Move down
		}

		return { paddle: this.side, input };
	}

	private getMove(): { paddle: 'left' | 'right', input: UserInput } {
		switch (this.aiParams.smarts) {
			case 'dumb':
				return this.getMoveDumb();
			case 'smart':
				// Implement smart AI logic here
				return this.getMoveDumb(); // Placeholder
			case 'godlike':
				// Implement godlike AI logic here
				return this.getMoveDumb(); // Placeholder
			default:
				return this.getMoveDumb();
		}
	}

	private start(){
		this.currState = this.newestState;
		if (this.moveInterval) {
			clearInterval(this.moveInterval);
		}
		this.moveInterval = setInterval(() => {
			if (this.currState) {
				this.sendInput(this.getMove());
			}
		}, 1000 / this.aiParams.moveUpdateSpeed);
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
		}
		this.checkInterval = setInterval(() => {
			this.currState = this.newestState;
		}
		, 1000 / this.aiParams.checkUpdateSpeed);
	}

	private stop(){
		if (this.moveInterval) {
			clearInterval(this.moveInterval);
			this.moveInterval = null;
		}
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
		}
	}

	private onSetCountdown(time: number): void {
		this.stop();
		// idle for countdown time
		setTimeout(() => {
			this.start();
		}, time * 1000);
	}

	private onError(error: Error): void {
		if (error.message === "disconnect") {
			// Handle disconnect
		}
	}

	public send(msg: string): void {
		const parsedMsg = JSON.parse(msg);
		switch (parsedMsg.type) {
			case "game_state":
				this.newestState = parsedMsg.data;
				break;
			case "game_event":
				switch (parsedMsg.data.event) {
					case "game_over":
						break;
					case "goal":
						break;
					case "start_countdown":
						this.onSetCountdown(parsedMsg.data.time);
						break;
					default:
						console.error(`Unknown game event: ${parsedMsg.data}`);
						break;
				}
				break;
			case "error":
				this.onError(new Error(parsedMsg.data));
				break;
			default:
				console.error(`Unknown message type: ${parsedMsg.type}`);
				break;
		}
	}

	public on(event: string, callback: (data: any) => void): void {
		if (event === "message") {
			this.callbacks[event] = callback;
		}
	}

	close(): void {}

};