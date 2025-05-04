import { GameInstance } from "./GameInstance";
import { RenderDetails } from "./GameTypes";

class GameRenderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private game: GameInstance;
	private renderDetails: RenderDetails;

	constructor(canvas: HTMLCanvasElement, game: GameInstance, renderDetails: RenderDetails) {
		this.renderDetails = renderDetails;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d")!;
		this.game = game;
	}

	public render(): void {
		this.clearCanvas();
		this.drawGameObjects();
	}

	private clearCanvas(): void {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	private drawBall(ball_x: number, ball_y: number, ball_r: number): void {
		this.ctx.fillStyle = this.renderDetails.ball_color;
		this.ctx.beginPath();
		this.ctx.arc(ball_x, ball_y, ball_r, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.closePath();
	}

	private drawPaddle(x: number, y: number, w: number, h: number): void {
		this.ctx.fillStyle = this.renderDetails.paddle_color;
		this.ctx.fillRect(x, y, w, h);
	}

	private drawArena(w: number, h: number): void {
		this.ctx.fillStyle = this.renderDetails.arena_color;
		this.ctx.fillRect(0, 0, w, h);
	}

	private drawGameObjects(): void {
		const state = this.game.getState();
		const params = this.game.getParams();

		this.drawArena(this.canvas.width, this.canvas.height);
		this.drawBall(state.ball_x, state.ball_y, params.ball_r);
		this.drawPaddle(state.left_x, state.left_y, params.paddle_w, params.paddle_h);
		this.drawPaddle(state.right_x, state.right_y, params.paddle_w, params.paddle_h);
	}
}