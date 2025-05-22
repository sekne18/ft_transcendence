
import { GameState, GameParams, UserInput, AIPlayerParams, vec2d, PlayerSocket } from "./GameTypes.js";

export class AIPlayer implements PlayerSocket {
	private callbacks: { [key: string]: (data: any) => void } = {};
	private newestState: GameState;
	private currState: GameState;
	private gameParams: GameParams;
	private aiParams: AIPlayerParams;
	private moveInterval: NodeJS.Timeout | null = null;
	private checkInterval: NodeJS.Timeout | null = null;
	private side: 'left' | 'right' = 'left';
	private smartAiCalcs: {
		hit_pos: number,
		hit_time: number,
		old_pos: number,
		curr_frame: number,
		stop_frame: number,
	};

	constructor(gameParams: GameParams, params: AIPlayerParams) {
		this.gameParams = gameParams;
		this.aiParams = params;
		this.aiParams.skill_deviation = Math.max(0, this.aiParams.skill_deviation);
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
		this.smartAiCalcs = {
			hit_pos: 0,
			hit_time: 0,
			old_pos: 0,
			curr_frame: 0,
			stop_frame: 0,
		};
	}

	private stop() {
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
					case "game_found":
						this.side = parsedMsg.data.side;
						break;
					case "goal":
						this.stop();
						break;
					case "start_countdown":
						this.onSetCountdown(parsedMsg.data.time);
						break;
					default:
						//console.error(`Unknown game event: ${parsedMsg.data}`);
						break;
				}
				break;
			case "error":
				this.onError(new Error(parsedMsg.data));
				break;
			default:
				//console.error(`Unknown message type: ${parsedMsg.type}`);
				break;
		}
	}

	public on(event: string, callback: (data: any) => void): void {
		if (event === "message") {
			this.callbacks[event] = callback;
		}
	}

	public close(): void {
		this.stop();
		this.callbacks = {};
	}

	private sendInput(input: { paddle: 'left' | 'right', input: UserInput }): void {
		if (this.callbacks["message"]) {
			this.callbacks["message"](JSON.stringify({ type: "user_input", data: input }));
		}
	}

	private start() {
		this.currState = this.newestState;
		this.updateCalculation();
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
			this.updateCalculation();
		}
			, 1000 / this.aiParams.checkUpdateSpeed);
	}

	private getMove(): { paddle: 'left' | 'right', input: UserInput } {
		let out: { paddle: 'left' | 'right', input: UserInput } = { paddle: this.side, input: 0 };

		const s = this.smartAiCalcs;

		if (s.curr_frame < s.hit_time) {
			const t = s.curr_frame / s.hit_time; // normalized time [0,1]
			const eased = easeInOut(t); // smooth transition

			// Movement delta per frame
			const delta = (s.hit_pos - s.old_pos) * eased;;
			const max_move = this.gameParams.paddle_maxv * (1000 / this.gameParams.FPS);
			out.input = clamp(delta / max_move, -1, 1);
		} else {
			out.input = 0; // Stop moving after hit_time is up
		}

		// if (this.smartAiCalcs.curr_frame < this.smartAiCalcs.stop_frame) {
		// 	const deltaTime = 1000 / this.gameParams.FPS;
		// 	const max_paddle_d = this.gameParams.paddle_maxv * (1000 / this.gameParams.FPS);
		// 	const d = Math.abs(this.smartAiCalcs.hit_pos - this.smartAiCalcs.old_pos);
		// 	const frames = Math.ceil(d / max_paddle_d);
		// 	out.input = clamp((this.smartAiCalcs.hit_pos - this.smartAiCalcs.old_pos) / (frames * max_paddle_d), -1, 1);
		// } else {
		// 	out.input = 0;
		// }
		s.curr_frame += 1000 / this.gameParams.FPS;
		return out;
	}

	private calcNrOfFrames(hit_pos: number, old_pos: number): number {
		const deltaTime = 1000 / this.gameParams.FPS;
		const max_paddle_d = this.gameParams.paddle_maxv * (deltaTime);
		const d = Math.abs(hit_pos - old_pos);
		const frames = Math.ceil(d / max_paddle_d);
		return frames;
	}

	private updateCalculation(): void {
		let toHit: number = this.side === 'left' ?
			this.gameParams.paddle_offset + this.gameParams.paddle_w :
			this.gameParams.arena_w - this.gameParams.paddle_offset - this.gameParams.paddle_w;
		let ball_v: vec2d = this.currState.ball_v;
		let ball_pos: vec2d = this.currState.ball;
		let t: number = 0;
		while (true) {
			// Check if ball is past paddle || If ball is going away from paddle or not moving vertically
			if ((this.side === 'left' && ball_pos.x < toHit + 0.01) ||
				(this.side === 'right' && ball_pos.x > toHit - 0.01) ||
				ball_v.y === 0 || (this.side === 'left' ? ball_v.x > 0 : ball_v.x < 0)) {
				this.smartAiCalcs = {
					hit_pos: this.gameParams.arena_h / 2, // or some default
					hit_time: 1,
					old_pos: this.side === 'left' ? this.currState.left.y : this.currState.right.y,
					curr_frame: 0,
					stop_frame: this.calcNrOfFrames(this.gameParams.arena_h / 2, this.side === 'left' ? this.currState.left.y : this.currState.right.y),
				};
				return;
			}

			let xBounce = intersectXLine(ball_pos, ball_v, toHit, this.gameParams.FPS);
			let yBounceTop = intersectYLine(ball_pos, ball_v, 0, this.gameParams.FPS);
			let yBounceBottom = intersectYLine(ball_pos, ball_v, this.gameParams.arena_h, this.gameParams.FPS);

			// Pick earliest bounce
			let bounces = [xBounce, yBounceTop, yBounceBottom].filter(b => b !== null) as { x: number, y: number, t: number }[];
			let next = bounces.reduce((min, b) => b.t < min.t ? b : min);
			next.t *= (3 + Math.random() * 2 * this.aiParams.skill_deviation - this.aiParams.skill_deviation);

			if (next === xBounce) {
				// Ball is reaching paddle
				this.smartAiCalcs = {
					hit_pos: next.y,
					hit_time: t + next.t, // t is in milliseconds
					old_pos: this.side === 'left' ? this.currState.left.y : this.currState.right.y,
					curr_frame: 0,
					stop_frame: this.calcNrOfFrames(next.y, this.side === 'left' ? this.currState.left.y : this.currState.right.y),
				};
				break;
			} else {
				// Reflect Y direction and keep going
				ball_pos = { x: next.x, y: next.y };
				if (ball_pos.y < 0.01) {
					ball_pos.y = 0.01;
				} else if (ball_pos.y > this.gameParams.arena_h - 0.01) {
					ball_pos.y = this.gameParams.arena_h - 0.01;
				}
				ball_v.y = -ball_v.y;
				t += next.t;
			}
		}
	}
};

function clamp(value: number, min: number, max: number): number {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

function intersectYLine(ball_pos: vec2d, ball_v: vec2d, wall_y: number, fps: number): { x: number, y: number, t: number } | null {
	if (ball_v.y === 0) {
		return null; // No intersection if the ball is not moving vertically
	}
	if ((ball_v.y > 0 && ball_pos.y > wall_y) || (ball_v.y < 0 && ball_pos.y < wall_y)) {
		return null; // No intersection if the ball is moving away from the wall
	}
	const t = (wall_y - ball_pos.y) / ball_v.y;
	return { x: ball_pos.x + ball_v.x * t, y: wall_y, t: t }; // t is in milliseconds
}

function intersectXLine(ball_pos: vec2d, ball_v: vec2d, wall_x: number, fps: number): { x: number, y: number, t: number } | null {
	if (ball_v.x === 0) {
		return null; // No intersection if the ball is not moving horizontally
	}
	if ((ball_v.x > 0 && ball_pos.x > wall_x) || (ball_v.x < 0 && ball_pos.x < wall_x)) {
		return null; // No intersection if the ball is moving away from the wall
	}
	const t = (wall_x - ball_pos.x) / ball_v.x;
	return { x: wall_x, y: ball_pos.y + ball_v.y * t, t: t };
}

function easeInOut(t: number): number { // t should be in [0, 1]
	return 0.5 * (1 - Math.cos(Math.PI * t));
}
