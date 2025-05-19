import { GameParams, GameState } from "../game/GameTypes";
import { Profile } from "../profile/Types";

export type TournamentView = {
	id: number,
	status: 'pending' | 'ongoing' | 'finished',
	maxPlayers: number,
	createdAt: number,
	endedAt: number | null,
	players: number[],
	bracket: Bracket | null,
}

export interface Tournament {
	id: number;
	status: 'pending' | 'ongoing' | 'finished';
	maxPlayers: number;
	createdAt: number;
	bracket: Bracket | null;
	players: Profile[];
}

export type RoundMatch = {
	matchId: number | null;
	winnerId: number | null;
	playerIds: { p1: number, p2: number };
};

export type Bracket = {
	rounds: RoundMatch[][];
};

export type TournamentMsgOut = {
	type: 'join' | 'leave' | 'spectate',
	data: {
		tournamentId: number
	}
};

export type TournamentMsgIn = {
	type: 'setup_match',
	data: {
		tournamentId: number,
		p1: number,
		p2: number,
	}
} | {
	type: 'joined',
	data: {
		tournamentId: number,
		playerId: number,
	}
} | {
	type: 'left',
	data: {
		tournamentId: number,
		playerId: number,
	}
} | {
	type: 'bracket_update',
	data: {
		tournamentId: number,
		bracket: Bracket,
	}
} | {
	type: 'game_state',
	matchId: number,
	data: GameState,
	timestamp: number,
} | {
	type: 'game_event',
	matchId: number,
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
	matchId: number,
	data: 'left' | 'right',
	timestamp: number,
};