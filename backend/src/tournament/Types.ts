import fastifyWebsocket from "@fastify/websocket";

export type TournamentConnection = {
    id: number;
    enteredTournament: number | null;
    socket: fastifyWebsocket.WebSocket | null;
}

export type TournamentParams = {
    maxPlayers: number;
    createdAt: number;
};

export type RoundMatch = {
    matchId: number | null;
    winnerId: number | null;
    playerIds: { p1: number, p2: number };
};

export type Bracket = {
    rounds: RoundMatch[][];
};

export type TournamentMsgIn = {
    type: 'join' | 'leave',
    data: {
        tournamentId: number
    }
};

export type TournamentMsgOut = {
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
    type: 'ping'
}

export type TournamentEvent = {
    type: 'setup_match',
    data: {
        p1: number,
        p2: number,
    }
} | {
    type: 'joined',
    data: {
        playerId: number,
    }
} | {
    type: 'left',
    data: {
        playerId: number,
    }
} | {
    type: 'bracket_update',
    data: {
        bracket: Bracket,
    }
};

export type TournamentView = {
    id: number,
    maxPlayers: number,
    createdAt: number,
    players: number[],
    status: 'pending' | 'ongoing' | 'finished',
    bracket: Bracket | null
}