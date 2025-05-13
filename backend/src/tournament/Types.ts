import fastifyWebsocket from "@fastify/websocket";

export type tournamentConnection = {
    id: number;
    socket: fastifyWebsocket.WebSocket | null;
}

export type TournamentParams = {
    maxPlayers: number;
    createdAt: number;
};