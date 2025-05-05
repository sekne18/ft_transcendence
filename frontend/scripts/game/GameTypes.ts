export type vec2d = {
	x: number,
	y: number,
};

export type GameParams = {
	paddle_offset: number,
	paddle_w: number, paddle_h: number, paddle_maxa: number, paddle_maxv: number,
	ball_r: number, ball_maxa: number, ball_maxv: number, ball_minv: number,
	arena_w: number, arena_h: number,
	deadzone: number, max_score: number,
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
	size_ratio: number,
};

export type GameStatus = 'idle' | 'matchmaking' | 'playing' | 'gameover' | 'countdown' | 'paused'; //paused not implemented but for future use (controlled tournament)