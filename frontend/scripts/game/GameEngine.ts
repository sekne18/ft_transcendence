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
	private player: 'left' | 'right' | null;
	private renderLoopInterval: number | null = null;

	constructor(canvas: HTMLCanvasElement, gameParams: GameParams, renderDetails: RenderDetails) {
		this.status = 'idle';
		this.player = null;
		this.game = new GameInstance(gameParams, this.onGoal.bind(this), this.onGameOver.bind(this));
		this.gameRenderer = new GameRenderer(canvas, gameParams, renderDetails, this.game.getState.bind(this.game));
		this.inputController = new PointerInputController(canvas, gameParams, this.game.getState.bind(this.game), this.game.receiveInput.bind(this.game));
		this.UIManager = new UIManager(this.matchmake.bind(this));
	}

	public start(): void {
		this.changeState('idle');
	}

	public matchmake(): void {
		this.changeState('matchmaking');
	}

	public async onMatchFound(): Promise<void> {
		this.UIManager.setMatchmakingOverlay('found');
		await new Promise(r => setTimeout(r, 1000));
		this.changeState('countdown');
	}

	private onGoal(paddle: 'left' | 'right'): void {
		const gameState = this.game.getState();
		this.UIManager.updateScore(gameState.left_score, gameState.right_score);
		this.UIManager.setGoalOverlay(paddle);
		// potentially add some logic to add some winner or loser flourish
		this.changeState('goal');
	}

	private onGameOver(): void {
		this.changeState('gameover');
	}

	private changeState(newStatus: GameStatus): void {
		this.exitState(this.status);
		this.status = newStatus;
		console.log('Game status changed to:', this.status);
		this.enterState(newStatus);
	}

	private exitState(status: GameStatus): void {
		switch (status) {
			case 'idle':
				this.UIManager.toggleOverlayVisibility('hidden');
				break;
			case 'matchmaking':
				this.UIManager.toggleOverlayVisibility('hidden');
				break;
			case 'playing':
				this.inputController.stop();
				this.game.stopGame();
				break;
			case 'goal':
				this.UIManager.toggleOverlayVisibility('hidden');
				break;
			case 'gameover':
				this.UIManager.toggleOverlayVisibility('hidden');
				break;
			case 'countdown':
				this.UIManager.toggleOverlayVisibility('hidden');
				break;
			default:
				break;
		}
	}

	private async enterState(status: GameStatus): Promise<void> {
		switch (status) {
			case 'idle':
				this.UIManager.setMatchmakingOverlay('button');
				this.UIManager.updateScore(0, 0);
				this.UIManager.toggleOverlayVisibility('visible');
				break;
			case 'matchmaking':
				this.UIManager.toggleOverlayVisibility('visible');
				await new Promise(r => setTimeout(r, 3000));
				this.onMatchFound();
				break;
			case 'playing':
				this.inputController.start();
				this.startGame();
				this.gameLoop();
				break;
			case 'goal':
				this.resetGame();
				this.UIManager.toggleOverlayVisibility('visible');
				await new Promise(r => setTimeout(r, 1000));
				this.changeState('countdown');
				break;
			case 'gameover':
				const gameState = this.game.getState();
				this.UIManager.setGameOverOverlay(this.player === 'left' ? gameState.left_score > gameState.right_score : gameState.right_score > gameState.left_score);
				this.UIManager.toggleOverlayVisibility('visible');
				break;
			case 'countdown':
				this.UIManager.toggleOverlayVisibility('visible');
				this.UIManager.setCountdownOverlay('Ready?');
				await new Promise(r => setTimeout(r, 1000));
				this.UIManager.setCountdownOverlay('Set...');
				await new Promise(r => setTimeout(r, 1000));
				this.UIManager.setCountdownOverlay('Go!');
				await new Promise(r => setTimeout(r, 500));
				this.UIManager.toggleOverlayVisibility('hidden');
				this.changeState('playing');
				break;
			default:
				break;
		}
	}

	private gameLoop(): void {
		this.gameRenderer.render();
		this.inputController.update();
		if (this.status === 'playing') {
			requestAnimationFrame(this.gameLoop.bind(this));
		}
	}

	private resetGame(): void {
		this.game.stopGame();
	}

	private startGame(): void {
		this.player = 'left';
		this.game.startGame();
	}

};