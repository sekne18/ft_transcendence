import { GameConnection } from './GameConnection';
import { GameParams, RenderDetails, GameStatus, WsParams, wsMsg } from './GameTypes';
import { PointerInputController } from './PointerInputController';
import { GameRenderer } from './GameRenderer';
import { UIManager } from './UIManager';
import { loadConfigFromFile } from 'vite';
import { loadContent } from '../router/router';


export class GameEngine {
	private status: GameStatus;
	private game: GameConnection;
	private gameRenderer: GameRenderer;
	private inputController: PointerInputController;
	private UIManager: UIManager;
	public player: 'left' | 'right' | null;
	private enemyDisconnected: boolean = false;
	private isTournament: boolean = false;
	private tournamentMatchId: number | null = null;
	// private isSpectator: boolean = false;

	constructor(canvas: HTMLCanvasElement, gameParams: GameParams, renderDetails: RenderDetails, wsParams: WsParams, existingSocket?: WebSocket) {
		this.status = 'idle';
		this.player = null;
		this.isTournament = wsParams.isTournament || false;
		this.tournamentMatchId = wsParams.matchId || null;
		// this.isSpectator = wsParams.isSpectator || false;

		// Pass wsParams which might include matchId if it's a tournament
		const gameConnectionWsParams: WsParams = {
			...wsParams,
			url: existingSocket ? '' : wsParams.url,
		};

		this.game = new GameConnection(
			gameParams,
			gameConnectionWsParams,
			this.onMatchFound.bind(this),
			this.onSetCountdown.bind(this),
			this.onGoal.bind(this),
			this.onGameOver.bind(this),
			this.onError.bind(this),
			existingSocket
		);

		this.gameRenderer = new GameRenderer(canvas, gameParams, renderDetails, this.game.getState.bind(this.game));
		this.inputController = new PointerInputController(canvas, gameParams, this.game.getState.bind(this.game), this.game.receiveInput.bind(this.game));
		this.UIManager = new UIManager(this.matchmake.bind(this));
		this.UIManager.updateScore(0, 0);

		this.changeState('idle');
	}

	public getGame(): GameConnection {
		return this.game;
	}

	public start(): void {
		this.changeState('idle');
	}

	public matchmake(): void {
		console.log('GameEngine: matchmake() called. Tournament is set to: ', this.isTournament);
		this.enemyDisconnected = false;
		if (this.isTournament) {
			return;
		}
		this.changeState('matchmaking');
	}

	// public handleGameMessage(message: wsMsg): void {
	// 	if (this.game) {
	// 		this.game.processMsg(message);
	// 	} else {
	// 		console.error("GameEngine: GameConnection not initialized to handle message:", message);
	// 	}
	// }

	public async onMatchFound(side: 'left' | 'right', enemy_id: number): Promise<void> {
		//TODO: setup enemy info on the left/right side
		this.UIManager.setMatchmakingOverlay('found');
		this.UIManager.updateScore(0, 0);
		this.player = side;
		this.inputController.setSide(side);
	}

	public onSetCountdown(time: number): void {
		this.changeState('countdown');
		let startTime = time;
		let interval = setInterval(() => {
			if (time / startTime > 0.65) {
				this.UIManager.setCountdownOverlay('Ready?');
			}
			else if (time / startTime > 0.32) {
				this.UIManager.setCountdownOverlay('Set...');
			}
			else {
				this.UIManager.setCountdownOverlay('Go!');
			}
			time -= 0.5;
			if (time <= 0.2) { // to protect against floating point errors
				clearInterval(interval);
				this.changeState('playing');
			}
		}, 500); //refresh rate of 2 FPS
	}

	public onError(error: Error): void {
		if (error.message === 'disconnect') {
			this.enemyDisconnected = true;
		}
		console.error('Game error:', error);
		this.changeState('idle');
	}

	private onGoal(paddle: 'left' | 'right'): void {
		console.log('Goal scored by:', paddle);
		const gameState = this.game.getState();
		this.UIManager.updateScore(gameState.left_score, gameState.right_score);
		this.UIManager.setGoalOverlay(paddle);
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
				if (!this.isTournament || !this.tournamentMatchId)
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
				if (this.isTournament)
					loadContent('/tournament', false);
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