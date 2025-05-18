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
	type: 'start_spectate',
	data: {
		gameParams: GameParams,
		
	}
} | {
	type: 'game_state',
		data: GameState,
		timestamp: number,
};