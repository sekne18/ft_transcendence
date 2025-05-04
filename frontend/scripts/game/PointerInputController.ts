// will contain classes for processing input
// and converting it to game actions

import { GameParams, GameState, UserInput } from "./GameTypes";

function getCanvasRelativePosition (
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement
  ) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
}

export class PointerInputController {
	public latestCursorPos: { x: number; y: number } = { x: 0, y: 0 }; //change to starting paddle position
	private canvas: HTMLCanvasElement;
	private readonly onMove = this.handlePointerMove.bind(this);
	private readonly gameParams: GameParams;

	constructor(canvas: HTMLCanvasElement, gameParams: GameParams, private getGameState: () => GameState, private onInput: (paddle: 'left' | 'right', input: UserInput) => void){
		this.canvas = canvas;
		this.gameParams = gameParams;
		const gameState = this.getGameState();
		this.latestCursorPos = {
			x: gameState.left_x,
			y: gameState.left_y
		};
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
		this.latestCursorPos = getCanvasRelativePosition(e.clientX, e.clientY, this.canvas);
	}

	private calcUserInput(
		gameParams: GameParams,
		gameState: GameState,
		latestCursorPos: { x: number; y: number })
	: UserInput {
		const distance = latestCursorPos.y - gameState.left_y;
		if (Math.abs(distance) < gameParams.deadzone)
			return 0;
		const input = Math.max(-1, Math.min(1, distance * 2 / gameParams.paddle_h));
		return input;
	}
};