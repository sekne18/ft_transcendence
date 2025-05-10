import fastifyWebsocket from "@fastify/websocket";

export type Player = {
    id: number;
    socket: fastifyWebsocket.WebSocket;
    avatar_url?: string;
    username?: string;
    isEliminated: boolean;
};

export type Match = {
    id: number;
    player1: Player;
    player2: Player;
    winner?: Player;
    isFinished: boolean;
};

export type Tournament = {
    id: number;
    players: Player[];
    matches: Match[];
    currentRound: Match[][];
    isFinished: boolean;
};

