import { Profile } from "../profile/Types";

export type TournamentView = {
	id: number,
	status: 'pending' | 'ongoing' | 'finished',
	maxPlayers: number,
	createdAt: number,
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
	type: 'join' | 'leave',
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
}