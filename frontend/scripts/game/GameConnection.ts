import { WsParams, wsMsg, GameParams, GameState } from "./GameTypes";

export class GameConnection {
	private currState: GameState;
	private socket: WebSocket | null = null;
	private wsParams: WsParams;
	private params: GameParams;
	private isUsingExternalSocket: boolean = false;

	constructor(
		params: GameParams,
		wsParams: WsParams,
		private onMatchFound: (sid: 'left' | 'right', enemy_id: number) => void,
		private onSetCountdown: (time: number) => void,
		private onGoal: (paddle: 'left' | 'right') => void,
		private onGameOver: () => void,
		private onError: (error: Error) => void,
		existingSocket?: WebSocket) {
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
		if (existingSocket) {
			this.socket = existingSocket;
			this.isUsingExternalSocket = true;
		}
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
		// If we already have socket that means we are in tournament mode
		if (!this.socket || !this.isUsingExternalSocket) {
			this.socket = new WebSocket(this.wsParams.url);
			this.isUsingExternalSocket = false;
		} 
		
		this.socket.addEventListener('open', () => {
			console.log('Connected to server');
		});

		this.socket.addEventListener('message', event => {
			const msg = JSON.parse(event.data) as wsMsg;
			this.processMsg(msg);
		});

		this.socket.addEventListener('close', event => {
			console.log('Disconnected from server');
			if (event.code !== 1000) {
				this.onError(new Error('server disconnected'));
			}
		});

		this.socket.addEventListener('error', err => {
			console.error('WebSocket error:', err);
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
			throw new Error('WebSocket not initialized');
		}

		const msgData: { paddle: 'left' | 'right'; input: number; matchId?: number } = { 
			paddle,
			input,
		};

		// If it's a tournament game, your backend might expect the matchId with the input
		if (this.isUsingExternalSocket && this.wsParams.isTournament && this.wsParams.matchId) {
			msgData.matchId = this.wsParams.matchId;
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

	public processMsg(msg: wsMsg): void {
		if ((msg as any).type === "game_data" && (msg as any).payload) {
			msg = (msg as any).payload;
		}
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
						console.log('Received message:', msg);
						this.onGameOver();
						break;
					case 'start_countdown':
						console.log(`Game starting in ${msg.data.time} seconds`);
						this.onSetCountdown(msg.data.time);
						break;
					default:
						console.log(`Game event: ${msg}`);
						console.error(`Unknown game event: ${msg.data}`);
						break;
				}
				break;
			case 'goal':
				console.log('Received message:', msg.data);
				this.onGoal(msg.data.side);
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