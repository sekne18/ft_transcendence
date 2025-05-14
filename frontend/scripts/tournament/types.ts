import { Profile } from "../profile/Types";

export type TournamentView = {
	id: number,
	status: 'pending' | 'ongoing' | 'finished',
	maxPlayers: number,
	createdAt: number,
	players: number[],
	bracket: Bracket | null,
}

export interface TournamentMatch {
	id: number;
	round: number;
	position: number;
	player1?: Profile;
	player2?: Profile;
	winner?: Profile;
	score?: string;
	status: 'pending' | 'in_progress' | 'completed';
}

export interface Tournament {
	id: number;
	status: 'pending' | 'ongoing' | 'finished';
	maxPlayers: number;
	createdAt: number;
	bracket: Bracket | null;
	players: Profile[];
	//matches: TournamentMatch[];
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
	tournamentId: number,
	data: {
		p1: number,
		p2: number,
	}
} | {
	type: 'joined',
	tournamentId: number,
	data: {
		playerId: number,
	}
} | {
	type: 'left',
	tournamentId: number,
	data: {
		playerId: number,
	}
} | {
	type: 'bracket_update',
	tournamentId: number,
	data: {
		bracket: Bracket,
	}
}