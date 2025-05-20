import { WsParams, wsMsg, GameParams, GameState } from "./GameTypes";

export class GameConnection {
	private currState: GameState;
	private socket: WebSocket | null = null;
	private wsParams: WsParams;
	private params: GameParams;

	constructor(
		params: GameParams,
		wsParams: WsParams,
		private onMatchFound: (sid: 'left' | 'right', enemy_id: number) => void,
		private onSetCountdown: (time: number) => void,
		private onGoal: (paddle: 'left' | 'right') => void,
		private onGameOver: () => void,
		private onError: (error: Error) => void,
		private onClose: () => void) {
		this.params = params;
		this.wsParams = wsParams;
		this.currState = {
			left: { x: this.params.paddle_offset, y: this.params.arena_h / 2 },
			right: { x: this.params.arena_w - this.params.paddle_offset, y: this.params.arena_h / 2 },
			ball: { x: this.params.arena_w / 2, y: this.params.arena_h / 2 },
			left_score: 0, right_score: 0,
			ball_v: { x: 0, y: 0 },
			ball_a: { x: 0, y: 0 },
			left_v: { x: 0, y: 0 },
			right_v: { x: 0, y: 0 },
			left_a: { x: 0, y: 0 },
			right_a: { x: 0, y: 0 },
		};
	}

	private initState(): void {
		this.currState = {
			left: { x: this.params.paddle_offset, y: this.params.arena_h / 2 },
			right: { x: this.params.arena_w - this.params.paddle_offset, y: this.params.arena_h / 2 },
			ball: { x: this.params.arena_w / 2, y: this.params.arena_h / 2 },
			left_score: 0, right_score: 0,
			ball_v: { x: 0, y: 0 },
			ball_a: { x: 0, y: 0 },
			left_v: { x: 0, y: 0 },
			right_v: { x: 0, y: 0 },
			left_a: { x: 0, y: 0 },
			right_a: { x: 0, y: 0 },
		};
	}

	public connect(): void {
		if (this.socket) {
			throw new Error('WebSocket already initialized');
		}
		this.socket = new WebSocket(this.wsParams.url);

		this.socket.addEventListener('open', () => {
			console.log('Connected to server');
		});

		this.socket.addEventListener('message', event => {
			const msg = JSON.parse(event.data) as wsMsg;
			this.processMsg(msg);
		});

		this.socket.addEventListener('close', event => {
			console.log('Disconnected from server');
			this.disconnect();
			if (event.code !== 1000) {
				this.onError(new Error(event.reason));
			}
			this.onClose();
		});

		this.socket.addEventListener('error', err => {
			console.error('WebSocket error:', err);
			this.disconnect();
			this.onError(new Error('WebSocket error'));

		});
	}

	public disconnect(): void {
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
		this.initState();
	}


	public getState(): GameState {
		return this.currState;
	}

	public receiveInput(paddle: 'left' | 'right', input: number): void {
		if (!this.socket) {
			//throw new Error('WebSocket not initialized');
			return;
		}
		const msg: wsMsg = {
			type: 'user_input',
			data: {
				paddle,
				input,
			},
			timestamp: Date.now(),
		};
		this.socket.send(JSON.stringify(msg));
	}

	private processMsg(msg: wsMsg): void {
		switch (msg.type) {
			case 'game_state':
				this.currState = msg.data;
				break;
			case 'game_event':
				switch (msg.data.event) {
					case 'game_found':
						this.onMatchFound(msg.data.side, msg.data.enemy_id);
						break;
					case 'game_over':
						this.onGameOver();
						break;
					case 'start_countdown':
						this.onSetCountdown(msg.data.time);
						break;
					default:
						console.error(`Unknown game event: ${msg.data}`);
						break;
				}
				break;
			case 'goal':
				this.onGoal(msg.data);
				break;
			case 'error':
				this.onError(new Error(msg.data));
				break;
			default:
				console.error(`Unknown message type: ${msg.type}`);
				break;
		}
	}
};