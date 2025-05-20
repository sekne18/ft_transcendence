export type vec2d = {
	x: number,
	y: number,
};

export type TournamentParams = {
	tournamentId: number,
	isPlaying: boolean,
}

export type LobbyParams = {
	id: number,
	expiresAt: number,
}

export type ExtraParams = {
	type: 'tournament',
	data: TournamentParams,
} | {
	type: 'lobby',
	data: LobbyParams,
} | {
	type: 'game',
	data: null,
};

export type WsParams = {
	url: string,
}

export type GameParams = {
	paddle_offset: number, //!! arena_w > (paddle_offset + paddle_w) * 2 + ball_r !!
	paddle_gap: number, //!! arena_h > paddle_gap * 2 + paddle_h !!
	paddle_w: number, paddle_h: number, paddle_maxa: number, paddle_maxv: number,
	ball_r: number, ball_maxa: number, ball_maxv: number, ball_minv: number,
	arena_w: number, arena_h: number,
	deadzone: number, max_score: number,
	FPS: number, countdown: number,
};

export type GameState = {
	left: vec2d, left_v: vec2d, left_a: vec2d,
	right: vec2d, right_v: vec2d, right_a: vec2d,
	ball: vec2d, ball_v: vec2d, ball_a: vec2d,
	left_score: number, right_score: number,
};

export type UserInput = number; // range: -1 to 1

export type RenderDetails = {
	ball_color: string,
	paddle_color: string,
	arena_color: string,
	max_canvas_width: number,
	canvas_margin: number,
};

export type GameStatus = 'idle' | 'idle-lobby' | 'idle-tournament' | 'matchmaking' | 'playing' | 'goal' | 'gameover' | 'gameover-lobby' | 'gameover-tournament' | 'countdown' | 'paused' | 'error'; //paused not implemented but for future use (controlled tournament)

export type wsMsg = {
	type: 'game_state',
	data: GameState,
	timestamp: number,
} | {
	type: 'set_side',
	data: 'left' | 'right',
	timestamp: number,
} | {
	type: 'user_input',
	data: {
		paddle: 'left' | 'right',
		input: UserInput,
	},
	timestamp: number,
} | {
	type: 'game_event',
	data: {
		event: 'game_over'
	} | {
		event: 'game_found',
		side: 'left' | 'right',
		enemy_id: number,
	} | {
		event: 'start_countdown',
		time: number,
	},
	timestamp: number,
} | {
	type: 'goal',
	data: 'left' | 'right',
	timestamp: number,
} | {
	type: 'error',
	data: string,
	timestamp: number,
};