import { GameConnection } from './GameConnection';
import { GameParams, RenderDetails, GameStatus, WsParams } from './GameTypes';
import { PointerInputController } from './PointerInputController';
import { GameRenderer } from './GameRenderer';
import { UIManager } from './UIManager';
import { GameState } from './GameTypes';
import { translations } from '../i18n/translations';


export class GameEngine {
	private status: GameStatus;
	private game: GameConnection;
	private gameRenderer: GameRenderer;
	private inputController: PointerInputController;
	private UIManager: UIManager;
	private player: 'left' | 'right' | null;
	private enemyDisconnected: boolean = false;

	constructor(canvas: HTMLCanvasElement, gameParams: GameParams, renderDetails: RenderDetails, wsParams: WsParams) {
		this.status = 'idle';
		this.player = null;
		this.game = new GameConnection(
			gameParams,
			wsParams,
			this.onMatchFound.bind(this),
			this.onSetCountdown.bind(this),
			this.onGoal.bind(this),
			this.onGameOver.bind(this),
			this.onError.bind(this),
		);
		this.gameRenderer = new GameRenderer(canvas, gameParams, renderDetails, this.game.getState.bind(this.game));
		this.inputController = new PointerInputController(canvas, gameParams, this.game.getState.bind(this.game), this.game.receiveInput.bind(this.game));
		this.UIManager = new UIManager(this.matchmake.bind(this));
		this.UIManager.updateScore(0, 0);
	}

	public start(): void {
		this.changeState('idle');
	}

	public matchmake(): void {
		this.enemyDisconnected = false;
		this.changeState('matchmaking');
	}

	public async onMatchFound(side: 'left' | 'right', enemy_id: number): Promise<void> {
		//TODO: setup enemy info on the left/right side
		this.UIManager.setMatchmakingOverlay('found');
		this.UIManager.updateScore(0, 0);
		this.player = side;
		this.inputController.setSide(side);
	}
	public onSetCountdown(time: number): void {
		this.changeState('countdown');

		const lang = localStorage.getItem('lang') || 'en';

		const countdownMessages = {
			ready: translations[lang]['game_ready'],
			set: translations[lang]['game_set'],
			go: translations[lang]['game_go']
		};

		let startTime = time;
		let interval = setInterval(() => {
			let message: string;
			if (time / startTime > 0.65) {
				message = countdownMessages.ready;
			} else if (time / startTime > 0.32) {
				message = countdownMessages.set;
			} else {
				message = countdownMessages.go;
			}
			this.UIManager.setCountdownOverlay(message);
			time -= 0.5;
			if (time <= 0.2)
			{
				clearInterval(interval);
				this.changeState('playing');
			}
		}, 500);
	}


	public onError(error: Error): void {
		if (error.message === 'disconnect') {
			this.enemyDisconnected = true;
		}
		console.error('Game error:', error);
		this.changeState('idle');
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
		this.game.disconnect();
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
				break;
			case 'goal':
				this.UIManager.toggleOverlayVisibility('hidden');
				break;
			case 'gameover':
				this.UIManager.toggleOverlayVisibility('hidden');
				this.UIManager.updateScore(0, 0);
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
				this.UIManager.toggleOverlayVisibility('visible');
				break;
			case 'matchmaking':
				this.UIManager.toggleOverlayVisibility('visible');
				this.game.connect();
				break;
			case 'playing':
				this.inputController.start();
				this.gameLoop();
				break;
			case 'goal':
				this.UIManager.toggleOverlayVisibility('visible');
				break;
			case 'gameover':
				const gameState = this.game.getState();
				this.UIManager.setGameOverOverlay(
					this.enemyDisconnected ||
					(this.player === 'left' ?
						gameState.left_score > gameState.right_score :
						gameState.right_score > gameState.left_score
					));
				this.UIManager.setMatchmakingOverlay('button');
				this.UIManager.toggleOverlayVisibility('visible');
				break;
			case 'countdown':
				this.UIManager.toggleOverlayVisibility('visible');
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

};