import fastifyWebsocket from "@fastify/websocket";
import { getUserById } from "../db/queries/user.js";
import { Match, Player } from "./Types.js";
import { TournamentSession } from "./TournamentSession.js";
import { PlayerQueue } from "./PlayerQueue.js";

export class TournamentManager {
    private tournamentState: TournamentSession;
    private playerQueue: PlayerQueue;
  
    constructor(tournamentState: TournamentSession, playerQueue: PlayerQueue) {
      this.tournamentState = tournamentState;
      this.playerQueue = playerQueue;
    }
  
    handleConnection(conn: fastifyWebsocket.WebSocket, req: any) {
      const user = getUserById(req.user.id) as { id: number };
  
      if (!user) {
        console.error('User not found');
        conn.close(1008, 'User not found');
        return;
      }
  
      const player: Player = {
        id: user.id,
        socket: conn,
        isEliminated: false,
      };
  
      this.playerQueue.enqueue(player);
  
      conn.on('message', (raw: any) => {
        const msg = JSON.parse(raw.toString());
  
        if (msg.type === 'match_result') {
          const { matchId, winnerId } = msg;
          this.tournamentState.handleMatchResult(matchId, winnerId);
        }
      });
    }
}