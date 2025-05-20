import { GameConnection } from './GameConnection';
import { GameParams, RenderDetails, GameStatus, WsParams, TournamentParams, ExtraParams } from './GameTypes';
import { PointerInputController } from './PointerInputController';
import { GameRenderer } from './GameRenderer';
import { UIManager } from './UIManager';
import { loadContent } from '../router/router';
import { State } from '../state/State';


export class GameEngine {
	private status: GameStatus;
	private game: GameConnection;
	private gameRenderer: GameRenderer;
	private inputController: PointerInputController;
	private UIManager: UIManager;
	private player: 'left' | 'right' | null;
	private enemyDisconnected: boolean = false;
	//private tournamentParams: TournamentParams | null = null;
	private extraParams: ExtraParams;
	private isTournament: boolean;
	private isLobby: boolean;

	constructor(canvas: HTMLCanvasElement, gameParams: GameParams, renderDetails: RenderDetails, wsParams: WsParams, extraParams: ExtraParams) {
		this.isTournament = extraParams.type === 'tournament' ? true : false;
		this.isLobby = extraParams.type === 'lobby' ? true : false;
		this.extraParams = extraParams;
		this.status = this.isTournament ? 'idle-tournament' : (this.isLobby ? 'idle-lobby' : 'idle');
		this.player = null;
		this.game = new GameConnection(
			gameParams,
			wsParams,
			this.onMatchFound.bind(this),
			this.onSetCountdown.bind(this),
			this.onGoal.bind(this),
			this.onGameOver.bind(this),
			this.onError.bind(this),
			this.onClose.bind(this)
		);
		this.gameRenderer = new GameRenderer(canvas, gameParams, renderDetails, this.game.getState.bind(this.game));
		this.inputController = new PointerInputController(canvas, gameParams, this.game.getState.bind(this.game), this.game.receiveInput.bind(this.game));
		this.UIManager = new UIManager(this.matchmake.bind(this));
		this.UIManager.updateScore(0, 0);
	}

	public start(): void {
		this.changeState(this.isTournament ? 'idle-tournament' : (this.isLobby ? 'idle-lobby' : 'idle'));
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

	public onClose(): void {
		if (this.status === 'idle-lobby') {
			State.clearState('lobby');
			this.UIManager.setCountdownOverlay('game lobby expired');
			this.UIManager.toggleOverlayVisibility('visible');
			setTimeout(() => {
				this.UIManager.toggleReloadButton('visible');
			}, 2000);
		}
	}

	public onError(error: Error): void {
		if (this.isLobby) {
			State.clearState('lobby');
		}
		if (error.message === 'disconnect') {
			this.enemyDisconnected = true;
			return;
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
		if (this.extraParams.type === 'tournament' && this.extraParams.data.isPlaying) {
			this.changeState('gameover-tournament');
		} else if (this.extraParams.type === 'lobby') {
			this.changeState('gameover-lobby');
		} else {
			this.changeState('gameover');
		}
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
			case 'idle-tournament':
				this.UIManager.toggleOverlayVisibility('hidden');
				break;
			case 'gameover-tournament':
				this.UIManager.toggleOverlayVisibility('hidden');
				this.UIManager.updateScore(0, 0);
				break;
			case 'idle-lobby':
				this.UIManager.toggleOverlayVisibility('hidden');
				break;
			case 'gameover-lobby':
				this.UIManager.toggleOverlayVisibility('hidden');
				this.UIManager.updateScore(0, 0);
				break;
			case 'error':
				this.UIManager.toggleReloadButton('hidden');
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
				setTimeout(() => {
					this.changeState('idle');
				}, 2000);
				break;
			case 'countdown':
				this.UIManager.toggleOverlayVisibility('visible');
				break;
			case 'idle-tournament':
				this.UIManager.setCountdownOverlay('Waiting for your match to begin...');
				this.UIManager.toggleOverlayVisibility('visible');
				if (this.extraParams.type === 'tournament' && this.extraParams.data.isPlaying) {
					this.game.connect();
				}
				break;
			case 'gameover-tournament':
				loadContent('/tournament');
				break;
			case 'idle-lobby':
				this.UIManager.setCountdownOverlay('Waiting for your match to begin...');
				this.UIManager.toggleOverlayVisibility('visible');
				this.game.connect();
				break;
			case 'gameover-lobby':
				State.clearState('lobby');
				const gameState2 = this.game.getState();
				this.UIManager.setGameOverOverlay(
					this.enemyDisconnected ||
					(this.player === 'left' ?
						gameState2.left_score > gameState2.right_score :
						gameState2.right_score > gameState2.left_score
					));
				this.UIManager.toggleOverlayVisibility('visible');
				setTimeout(() => {
					this.UIManager.toggleReloadButton('visible');
					this.UIManager.toggleOverlayVisibility('visible');
				}, 2000);
				break;
			case 'error':
				this.UIManager.toggleReloadButton('visible');
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