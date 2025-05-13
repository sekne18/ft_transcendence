import fastifyWebsocket from "@fastify/websocket";
import { getUserById } from "../db/queries/user.js";
import { Player } from "./Types.js";
import { TournamentSession } from "./TournamentSession.js";
import { PlayerQueue } from "./PlayerQueue.js";
import { GameSession } from "../game/GameSession.js";
import { PlayerConnection, wsMsg } from "../game/GameTypes.js";

export class TournamentManager {
  private tournamentSession: TournamentSession;
  private playerQueue: PlayerQueue;

  constructor(tournamentSession: TournamentSession, playerQueue: PlayerQueue) {
    this.tournamentSession = tournamentSession;
    this.playerQueue = playerQueue;
  }

  handleConnection(conn: fastifyWebsocket.WebSocket, req: any) {
    const user = getUserById(req.user.id) as { id: number; display_name: string; avatar_url: string; };

    if (!user) {
      console.error('User not found');
      conn.close(1008, 'User not found');
      return;
    }

    const player: Player = {
      id: user.id,
      socket: conn,
      username: user.display_name,
      avatar_url: user.avatar_url,
      isEliminated: false,
    };

    this.tournamentSession.addClient(player);

    // Send the initial queue state to the newly connected client
    const initialQueue = this.playerQueue.getPlayersInQueue().map(p => ({ id: p.id, username: p.username, avatar_url: p.avatar_url }));
    conn.send(JSON.stringify({ type: 'queue_updated', players: initialQueue }));

    conn.on('message', (raw: any) => {
      const msg = JSON.parse(raw.toString());
      
      let isGameMessage = false;
      if (msg.type === 'user_input') { 
        let targetSession: GameSession | undefined;
        let targetMatchId: number | undefined;

        for (const [matchId, session] of this.tournamentSession.getActiveGameSessions().entries()) {
         if (session.getPlayers().some(pConn => pConn.id === player.id)) {
            targetSession = session;
            targetMatchId = matchId;
            break;
          }
        }

        if (targetSession) {
          console.log(`[TournamentManager] Routing message from P:<span class="math-inline">\{player\.id\} to GameSession for matchId\:</span>{targetMatchId}, type: ${msg.type}`);
          const playerConnForGame: PlayerConnection = { id: player.id, socket: player.socket };
          targetSession.processMsg(msg as wsMsg, playerConnForGame);
          isGameMessage = true;
        }
      }
      if (isGameMessage) {
        return; 
      }

      switch (msg.type) {
        case 'join_tournament':
          console.log(`Received 'join_tournament' message from user: ${player.username}`);
          this.playerQueue.enqueue(player);
          break;
        case 'leave_tournament':
          console.log(`Received 'leave_tournament' message from user: ${player.id}`);
          this.playerQueue.remove(player);
          break;
        case 'match_result':
          const { resultMatchId, winnerId } = msg;
          this.tournamentSession.handleMatchResult(resultMatchId, winnerId);
          break;
        default:
          console.log('Received unknown message type:', msg.type);
      }

    });

    conn.on('close', () => {
      console.log(`WebSocket connection closed for user: ${player.id}`);
      this.playerQueue.remove(player);
      this.tournamentSession.removeClient(player);
    });
  }
}