//will contain classes for running the game
// and managing game state
import { GameParams, GameState, UserInput, vec2d } from './GameTypes.js';

const FPS = 60;
const FRAME_TIME = 1000 / FPS;


export class GameInstance {
	private params: GameParams;
	private state: GameState;
	private input: { left: UserInput, right: UserInput };

	constructor(params: GameParams, private onGoal: (paddle: 'left' | 'right') => void, private onGameOver: () => void) {
		this.input = { left: 0, right: 0 };
		this.params = params;
		this.state = {
			left: { x: this.params.paddle_offset, y: this.params.arena_h / 2 },
			right: { x: this.params.arena_w - this.params.paddle_offset, y: this.params.arena_h / 2 },
			ball: { x: this.params.arena_w / 2, y: this.params.arena_h / 2 },
			left_score: 0, right_score: 0,
			ball_v: { x: 0, y: 0 },
			ball_a: { x: 1, y: 1 },
			left_v: { x: 0, y: 0 },
			right_v: { x: 0, y: 0 },
			left_a: { x: 0, y: 0 },
			right_a: { x: 0, y: 0 },
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
	}

	// public stopGame(): void {
	// 	this.resetGame();
	// }

	private launchBall(): void {
		this.state.ball_v.x = Math.random() * 2 - 1;
		this.state.ball_v.y = (Math.random() * 2 - 1) * 0.1;
		let { x, y } = normalize(this.state.ball_v.x, this.state.ball_v.y);
		this.state.ball_v.x = x * this.params.ball_minv;
		this.state.ball_v.y = y * this.params.ball_minv;
		this.state.ball_a.x = 1;
		this.state.ball_a.y = 1;
	}

	private resetBall(): void {
		this.state.ball.x = this.params.arena_w / 2;
		this.state.ball.y = this.params.arena_h / 2;
		this.state.ball_v.x = 0;
		this.state.ball_v.y = 0;
		this.state.ball_a.x = 1;
		this.state.ball_a.y = 1;
	}

	// public resetScore(): void { //temporary while its on the frontend
	// 	this.state.left_score = 0;
	// 	this.state.right_score = 0;
	// }

	public resetGame(): void {
		if (this.state.left_score >= this.params.max_score || this.state.right_score >= this.params.max_score) {
			this.onGameOver();
			return;
		}
		this.state.left.x = this.params.paddle_offset;
		this.state.left.y = this.params.arena_h / 2;
		this.state.right.x = this.params.arena_w - this.params.paddle_offset;
		this.state.right.y = this.params.arena_h / 2;
		this.resetBall();
	}

	public receiveInput(paddle: 'left' | 'right', input: UserInput): void {
		if (paddle === 'left') {
			this.input.left = clamp(input, -1, 1);
		} else if (paddle === 'right') {
			this.input.right = clamp(input, -1, 1);
		}
	}

	public updateState(deltaTime: number): void {
		// Update paddle acceleration & velocity based on last input
		this.state.left_a.x = this.params.paddle_maxa * this.input.left;
		this.state.left_v.y = Math.min(this.params.paddle_maxv, Math.max(-this.params.paddle_maxv, this.state.left_v.y + this.state.left_a.x));
		this.state.right_a.x = this.params.paddle_maxa * this.input.right;
		this.state.right_v.y = Math.min(this.params.paddle_maxv, Math.max(-this.params.paddle_maxv, this.state.right_v.y + this.state.right_a.x));

		// Apply acceleration to ball
		//this.state.ball_v.x += this.state.ball_a.x * deltaTime;
		//this.state.ball_v.y += this.state.ball_a.y * deltaTime;

		// Update ball position
		this.state.ball.x += this.state.ball_v.x * deltaTime;
		this.state.ball.y += this.state.ball_v.y * deltaTime;

		// Update paddle positions
		this.state.left.y += this.state.left_v.y * deltaTime;
		this.state.right.y += this.state.right_v.y * deltaTime;

		if (this.state.left.y - this.params.paddle_h / 2 <= this.params.paddle_gap) {
			this.state.left.y = this.params.paddle_gap + this.params.paddle_h / 2;
			this.state.left_v.y = 0;
			this.state.left_a.y = 0;
		}

		if (this.state.left.y + this.params.paddle_h / 2 >= this.params.arena_h - this.params.paddle_gap) {
			this.state.left.y = this.params.arena_h - this.params.paddle_gap - this.params.paddle_h / 2;
			this.state.left_v.y = 0;
			this.state.left_a.y = 0;
		}

		if (this.state.right.y - this.params.paddle_h / 2 <= this.params.paddle_gap) {
			this.state.right.y = this.params.paddle_gap + this.params.paddle_h / 2;
			this.state.right_v.y = 0;
			this.state.right_a.y = 0;
		}

		if (this.state.right.y + this.params.paddle_h / 2 >= this.params.arena_h - this.params.paddle_gap) {
			this.state.right.y = this.params.arena_h - this.params.paddle_gap - this.params.paddle_h / 2;
			this.state.right_v.y = 0;
			this.state.right_a.y = 0;
		}

		this.state.left_v.y *= 0.5;
		this.state.right_v.y *= 0.5;

		this.checkCollisions();
	}

	private checkRectangleCircleCollision(
		rect: vec2d, rect_w: number, rect_h: number,
		circle: vec2d, circle_r: number
	): { x: number, y: number } | null {
		// Find the closest point on the rectangle to the circle's center
		let closestX = clamp(circle.x, rect.x - rect_w / 2, rect.x + rect_w / 2);
		let closestY = clamp(circle.y, rect.y - rect_h / 2, rect.y + rect_h / 2);

		// Calculate the distance between the circle's center and this point
		let dx = circle.x - closestX;
		let dy = circle.y - closestY;

		// If the distance is less than the radius, there is a collision
		if ((dx * dx + dy * dy) <= (circle_r * circle_r))
			return { x: closestX, y: closestY };
		else
			return null;
	}

	private ballPaddleCollision(hit: { x: number, y: number }, paddle: 'left' | 'right'): void {
		let nx = 0;
		let ny = 0;
		let dx = this.state.ball.x - hit.x;
		let dy = this.state.ball.y - hit.y;
		// if (Math.abs(dx) - Math.abs(dy) < 0.01) {
		// 	// Ball is colliding with a corner of the paddle
		// } else 
		if (Math.abs(dx) < Math.abs(dy)) {
			// Ball is colliding with the top or bottom of the paddle
			ny = (dy < 0) ? -1 : 1;
		}
		else {
			// Ball is colliding with the left or right side of the paddle
			nx = (dx < 0) ? -1 : 1;
		}
		let dot = this.state.ball_v.x * nx + this.state.ball_v.y * ny;
		this.state.ball_v.x = this.state.ball_v.x - 2 * dot * nx;
		this.state.ball_v.y = this.state.ball_v.y - 2 * dot * ny;

		let influence_factor = 1.0;
		if (paddle === 'left') {
			this.state.ball_v.x += this.state.left_v.x * influence_factor;
			this.state.ball_v.y += this.state.left_v.y * influence_factor;
		}
		else {
			this.state.ball_v.x += this.state.right_v.x * influence_factor;
			this.state.ball_v.y += this.state.right_v.y * influence_factor;
		}

		// Push ball out to prevent sticking
		const separation = this.params.ball_r + 0.05; // Small buffer to ensure no overlap
		this.state.ball.x = hit.x + nx * separation;
		this.state.ball.y = hit.y + ny * separation;


		// Clamp velocity
		let speed = Math.sqrt(this.state.ball_v.x ** 2 + this.state.ball_v.y ** 2);
		if (speed < this.params.ball_minv) {
			let scale = this.params.ball_minv / speed;
			this.state.ball_v.x *= scale;
			this.state.ball_v.y *= scale;
		} else if (speed > this.params.ball_maxv) {
			let scale = this.params.ball_maxv / speed;
			this.state.ball_v.x *= scale;
			this.state.ball_v.y *= scale;
		}
		// Optional: zero acceleration if you want instant response
		this.state.ball_a.x = 0
		this.state.ball_a.y = 0
	}

	private checkCollisions(): void {
		// Check for ball collision with left paddle
		const leftCollision = this.checkRectangleCircleCollision(
			this.state.left, this.params.paddle_w, this.params.paddle_h,
			this.state.ball, this.params.ball_r
		);

		if (leftCollision) {
			this.ballPaddleCollision(leftCollision, 'left');
		}

		// Check for ball collision with right paddle
		const rightCollision = this.checkRectangleCircleCollision(
			this.state.right, this.params.paddle_w, this.params.paddle_h,
			this.state.ball, this.params.ball_r
		);

		if (rightCollision) {
			this.ballPaddleCollision(rightCollision, 'right');
		}

		// Check for ball collision with top and bottom walls
		if (this.state.ball.y - this.params.ball_r < 0) {
			this.state.ball_v.y = Math.abs(this.state.ball_v.y);
			this.state.ball.y = this.params.ball_r;
		}
		else if (this.state.ball.y + this.params.ball_r > this.params.arena_h) {
			this.state.ball_v.y = -Math.abs(this.state.ball_v.y);
			this.state.ball.y = this.params.arena_h - this.params.ball_r;
		}

		//check for goal
		if (this.state.ball.x - this.params.ball_r < 0) {
			this.state.right_score += 1;
			this.onGoal('right');
			this.resetGame();
		}
		else if (this.state.ball.x + this.params.ball_r > this.params.arena_w) {
			this.state.left_score += 1;
			this.onGoal('left');
			this.resetGame();
		}
	}


}

function clamp(value: number, min: number, max: number): number {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

function normalize(x: number, y: number): { x: number, y: number } {
	const length = Math.sqrt(x * x + y * y);
	if (length === 0) return { x: 0, y: 0 };
	return { x: x / length, y: y / length };
}