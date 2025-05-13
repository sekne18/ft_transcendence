import fastifyWebsocket from "@fastify/websocket";

export type Player = {
    id: number;
    socket: fastifyWebsocket.WebSocket;
    avatar_url?: string;
    username?: string;
    isEliminated: boolean;
};

export interface TournamentMatch {
    id: number;
    round: number;
    position: number;
    player1: Player;
    player2: Player;
    winner: Player;
    score: string;
    isFinished: boolean;
    status: 'pending' | 'in_progress' | 'completed';
  }


export type Tournament = {
    id: number;
    players: Player[];
    matches: TournamentMatch[];
    currentRound: TournamentMatch[][];
    isFinished: boolean;
};

