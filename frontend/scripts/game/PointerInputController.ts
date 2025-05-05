// will contain classes for processing input
// and converting it to game actions

import { GameParams, GameState, UserInput } from "./GameTypes";

export class PointerInputController {
	public latestCursorPos: { x: number; y: number } = { x: 0, y: 0 }; //change to starting paddle position
	private canvas: HTMLCanvasElement;
	private readonly onMove = this.handlePointerMove.bind(this);
	private readonly gameParams: GameParams;
	private readonly sizeRatio: number;

	constructor(canvas: HTMLCanvasElement, gameParams: GameParams, private getGameState: () => GameState, private onInput: (paddle: 'left' | 'right', input: UserInput) => void){
		this.canvas = canvas;
		this.gameParams = gameParams;
		const gameState = this.getGameState();
		this.latestCursorPos = {
			x: gameState.left.x,
			y: gameState.left.y
		};
		this.sizeRatio = canvas.width / gameParams.arena_w;
	}

	public start(): void {
		document.addEventListener('pointermove', this.onMove);
	};

	public stop(): void {
		document.removeEventListener('pointermove', this.onMove);
	}

	public update(): void {
		const gameState = this.getGameState();
		const input = this.calcUserInput(this.gameParams, gameState, this.latestCursorPos);
		this.onInput('left', input);
		this.onInput('right', input);
	}

	private handlePointerMove(e: PointerEvent): void {
		const rect = this.canvas.getBoundingClientRect();
		this.latestCursorPos = {
			x: ((e.clientX - rect.left) / rect.width) * this.canvas.width,
      		y: ((e.clientY - rect.top) / rect.height) * this.canvas.height
		};
	}

	private calcUserInput(
		gameParams: GameParams,
		gameState: GameState,
		latestCursorPos: { x: number; y: number })
	: UserInput {
		const distance = latestCursorPos.y / this.sizeRatio - gameState.left.y;
		if (Math.abs(distance) < gameParams.deadzone)
			return 0;
		const input = Math.max(-1, Math.min(1, distance * 2 / gameParams.paddle_h));
		return input;
	}
};