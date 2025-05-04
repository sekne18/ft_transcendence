//will contain classes for running the game
// and managing game state
import { GameParams, GameState, UserInput } from './GameTypes';

function cleanUserInput(input: UserInput): UserInput {
	if (input < -1) return -1;
	if (input > 1) return 1;
	return input;
}

function clamp(value: number, min: number, max: number): number {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

const FPS = 60;
const FRAME_TIME = 1000 / FPS;


export class GameInstance {
	private params: GameParams;
	private state: GameState;
	private input: { left: UserInput, right: UserInput };
	private interval_id: number | null = null;

	constructor(params: GameParams) {
		this.input = { left: 0, right: 0 };
		this.params = params;
		this.state = {
			left_x: this.params.paddle_w , left_y: this.params.arena_h / 2 - this.params.paddle_h / 2,
			right_x: this.params.arena_w - this.params.paddle_w, right_y: this.params.arena_h / 2 - this.params.paddle_h / 2,
			ball_x: this.params.arena_w / 2, ball_y: this.params.arena_h / 2,
			left_score: 0, right_score: 0,
			ball_vx: 0, ball_vy: 0,
			ball_ax: 0, ball_ay: 0,
			left_vx: 0, left_vy: 0,
			right_vx: 0, right_vy: 0,
			left_ax: 0, left_ay: 0,
			right_ax: 0, right_ay: 0,
		};
	}

	public getState(): GameState {
		return this.state;
	}

	public getParams(): GameParams {
		return this.params;
	}

	public startGame(): void {
		this.resetGame();
		this.launchBall();
		this.interval_id = setInterval(() => {
			this.updateState(FRAME_TIME); // Assuming 60 FPS, deltaTime is ~0.016 seconds
		}, FRAME_TIME);
	}

	public stopGame(): void {
		if (this.interval_id) {
			clearInterval(this.interval_id);
			this.interval_id = null;
		}
	}

	public launchBall(): void {
		this.state.ball_vx = Math.random() * 2 - 1;
		this.state.ball_vy = Math.random() * 2 - 1;
		this.state.ball_ax = 0;
		this.state.ball_ay = 0;
	}

	public resetBall(): void {
		this.state.ball_x = this.params.arena_w / 2;
		this.state.ball_y = this.params.arena_h / 2;
		this.state.ball_vx = 0;
		this.state.ball_vy = 0;
		this.state.ball_ax = 0;
		this.state.ball_ay = 0;
	}

	public resetGame(): void {
		this.state.left_x = this.params.paddle_w;
		this.state.left_y = this.params.arena_h / 2 - this.params.paddle_h / 2;
		this.state.right_x = this.params.arena_w - this.params.paddle_w;
		this.state.right_y = this.params.arena_h / 2 - this.params.paddle_h / 2;
		this.state.left_score = 0;
		this.state.right_score = 0;
		this.resetBall();
	}

	public receiveInput(paddle: 'left' | 'right', input: UserInput): void {
		if (paddle === 'left') {
			this.input.left = cleanUserInput(input);
		} else if (paddle === 'right') {
			this.input.right = cleanUserInput(input);
		}
	}

	public updateState(deltaTime: number): void {
		// Update paddle acceleration & velocity based on last input
		this.state.left_ax = this.params.paddle_maxa * this.input.left;
		this.state.left_vx = Math.min(this.params.paddle_maxv, Math.max(-this.params.paddle_maxv, this.state.left_vx + this.state.left_ax));
		this.state.right_ax = this.params.paddle_maxa * this.input.right;
		this.state.right_vx = Math.min(this.params.paddle_maxv, Math.max(-this.params.paddle_maxv, this.state.right_vx + this.state.right_ax));

		// Apply acceleration to ball
		//this.state.ball_vx += this.state.ball_ax * deltaTime;
		//this.state.ball_vy += this.state.ball_ay * deltaTime;

		// Update ball position
		this.state.ball_x += this.state.ball_vx * deltaTime;
		this.state.ball_y += this.state.ball_vy * deltaTime;

		// Update paddle positions
		this.state.left_x += this.state.left_vx * deltaTime;
		this.state.left_y += this.state.left_vy * deltaTime;
		this.state.right_x += this.state.right_vx * deltaTime;
		this.state.right_y += this.state.right_vy * deltaTime;

		this.checkCollisions();
	}

	/*
	public checkFieldCircleCollision(
		axis: 'x' | 'y', axis_pos: number,
		circle_x: number, circle_y: number, circle_r: number
	): {x: number, y: number} | null {
		if (axis === 'x') {
			if (Math.abs(axis_pos - circle_x) < circle_r) {
				return { x: axis_pos, y: circle_y };
			}
		}
		else if (axis === 'y') {
			if (Math.abs(axis_pos - circle_y) < circle_r) {
				return { x: circle_x, y: axis_pos};
			}
		}

		return null;
	}
	*/

	public checkRectangleCircleCollision(
		rect_x: number, rect_y: number, rect_w: number, rect_h: number,
		circle_x: number, circle_y: number, circle_r: number
	): {x: number, y: number} | null {
		// Find the closest point on the rectangle to the circle's center
		let closestX = clamp(circle_x, rect_x, rect_x + rect_w);
		let closestY = clamp(circle_y, rect_y, rect_y + rect_h);

		// Calculate the distance between the circle's center and this point
		let dx = circle_x - closestX;
		let dy = circle_y - closestY;

		// If the distance is less than the radius, there is a collision
		if ((dx * dx + dy * dy) <= (circle_r * circle_r))
			return { x: closestX, y: closestY };
		else
			return null;
	}

	public checkCollisions(): void {
		// Check for ball collision with left paddle
		const leftCollision = this.checkRectangleCircleCollision(
			this.state.left_x, this.state.left_y, this.params.paddle_w, this.params.paddle_h,
			this.state.ball_x, this.state.ball_y, this.params.ball_r
		);

		if (leftCollision) {
			this.state.ball_vx = Math.abs(this.state.ball_vx);
			this.state.ball_ax = 0;
			this.state.ball_ay = 0;
			this.state.ball_vy += this.state.left_vy;
			this.state.ball_x = leftCollision.x + this.params.paddle_w + this.params.ball_r;
		}

		// Check for ball collision with right paddle
		const rightCollision = this.checkRectangleCircleCollision(
			this.state.right_x, this.state.right_y, this.params.paddle_w, this.params.paddle_h,
			this.state.ball_x, this.state.ball_y, this.params.ball_r
		);

		if (rightCollision) {
			this.state.ball_vx = -Math.abs(this.state.ball_vx);
			this.state.ball_ax = 0;
			this.state.ball_ay = 0;
			this.state.ball_vy += this.state.right_vy;
			this.state.ball_x = rightCollision.x - this.params.paddle_w - this.params.ball_r;
		}

		// Check for ball collision with top and bottom walls
		if (this.state.ball_y - this.params.ball_r < 0) {
			this.state.ball_vy = Math.abs(this.state.ball_vy);
			this.state.ball_y = this.params.ball_r;
		}
		else if (this.state.ball_y + this.params.ball_r > this.params.arena_h) {
			this.state.ball_vy = -Math.abs(this.state.ball_vy);
			this.state.ball_y = this.params.arena_h - this.params.ball_r;
		}

		//check for goal
		if (this.state.ball_x - this.params.ball_r < 0) {
			this.state.right_score++;
			this.resetBall();
		}
		else if (this.state.ball_x + this.params.ball_r > this.params.arena_w) {
			this.state.left_score++;
			this.resetBall();
		}
	}


}