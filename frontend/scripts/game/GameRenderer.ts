import { GameParams, RenderDetails, GameState } from "./GameTypes";

export class GameRenderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private GameParams: GameParams;
	private renderDetails: RenderDetails;


	constructor(canvas: HTMLCanvasElement, GameParams: GameParams, renderDetails: RenderDetails, private getGameState: () => GameState) {
		this.GameParams = GameParams;
		this.renderDetails = renderDetails;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d")!;
	}

	public render(): void {
		this.clearCanvas();
		this.drawGameObjects();
	}

	private clearCanvas(): void {
		this.ctx.fillStyle = this.renderDetails.arena_color;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
		const state = this.getGameState();

		this.drawArena(this.canvas.width, this.canvas.height);
		this.drawBall(state.ball_x, state.ball_y, this.GameParams.ball_r);
		this.drawPaddle(
			state.left_x - this.GameParams.paddle_w / 2, state.left_y - this.GameParams.paddle_h / 2,
			this.GameParams.paddle_w, this.GameParams.paddle_h
		);
		this.drawPaddle(
			state.right_x - this.GameParams.paddle_w / 2, state.right_y - this.GameParams.paddle_h / 2,
			this.GameParams.paddle_w, this.GameParams.paddle_h
		);
	}
}