import { AIPlayerParams, GameParams, MatchMakerParams } from "./GameTypes.js";

export const gameParams: GameParams = {
	paddle_offset: 15,
	paddle_gap: 2,
	paddle_w: 10,
	paddle_h: 50,
	paddle_maxa: 0.3,
	paddle_maxv: 1.0,
	ball_r: 5,
	ball_maxa: 1.0,
	ball_maxv: 1.5,
	ball_minv: 0.1,
	arena_w: 300,
	arena_h: 150,
	deadzone: 5,
	max_score: 5,
	FPS: 60,
	countdown: 3,
};

export const aiParams: AIPlayerParams = {
	skill_deviation: 0,
	checkUpdateSpeed: 1,
	moveUpdateSpeed: gameParams.FPS
};

export const matchmakerParams: MatchMakerParams = {
	ratingWindowMin: 0,
	ratingWindowMax: 10,
	WindowGrowthRate: 0.2,
	updateInterval: 2,
	timeUntilAI: 1,
}