export type GameParams = {
	paddle_w: number, paddle_h: number, paddle_maxa: number, paddle_maxv: number,
	ball_r: number, ball_maxa: number, ball_maxv: number, ball_minv: number,
	arena_w: number, arena_h: number,
};

export type GameState = {
	left_x: number, left_y: number, 
	right_x: number, right_y: number, 
	ball_x: number, ball_y: number,
	left_score: number, right_score: number,
	ball_vx: number, ball_vy: number,
	ball_ax: number, ball_ay: number,
	left_vx: number, left_vy: number,
	right_vx: number, right_vy: number,
	left_ax: number, left_ay: number,
	right_ax: number, right_ay: number,
};

export type UserInput = number; // range: -1 to 1

export type RenderDetails = {
	ball_color: string,
	paddle_color: string,
	arena_color: string,
};