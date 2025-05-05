import { GameInstance } from './GameInstance';
import { GameParams, GameState, RenderDetails, GameStatus } from './GameTypes';
import { PointerInputController } from './PointerInputController';
import { GameRenderer } from './GameRenderer';
import { UIManager } from './UIManager';


export class GameEngine {
	private status: GameStatus;
	private game: GameInstance;
	private gameRenderer: GameRenderer;
	private inputController: PointerInputController;
	private UIManager: UIManager;

	constructor(canvas: HTMLCanvasElement, gameParams: GameParams, renderDetails: RenderDetails) {
		this.status = 'idle';
		this.game = new GameInstance(gameParams);
		this.gameRenderer = new GameRenderer(canvas, gameParams, renderDetails, this.game.getState.bind(this.game));
		this.inputController = new PointerInputController(canvas, gameParams, this.game.getState.bind(this.game), this.game.receiveInput.bind(this.game));
	}

	public matchmake(): void {
		this.changeState('matchmaking');
	}

	public onGoal(paddle: 'left' | 'right'): void {
	}

	public onGameOver(): void {}

	private changeState(newStatus: GameStatus): void {
		this.exitState(this.status);
		this.status = newStatus;
		this.enterState(newStatus);
	}

	private exitState(status: GameStatus): void {}

	private enterState(status: GameStatus): void {}

	private startGame(): void {
		this.game.startGame();
		this.inputController.start();
		const FPS = 120;
		const intervalId = setInterval(() => {
			this.game.updateState(1000 / FPS);
		}, 1000 / FPS); // 120 FPS
		const interval2Id = setInterval(() => {
			this.gameRenderer.render();
			this.inputController.update();
		}, 1000 / (FPS / 2)); // 60 FPS
	}

};