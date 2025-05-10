import fastifyWebsocket from "@fastify/websocket";
import { getUserById } from "../db/queries/user.js";
import { Match, Player } from "./Types.js";
import { TournamentSession } from "./TournamentSession.js";
import { PlayerQueue } from "./PlayerQueue.js";

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

    this.playerQueue.enqueue(player);


    // Send the initial queue state to the newly connected client
    const initialQueue = this.playerQueue.getPlayersInQueue().map(p => ({ id: p.id }));
    conn.send(JSON.stringify({ type: 'queue_updated', players: initialQueue }));

    console.log(`WebSocket connection established for user: ${player.id}`);

    conn.on('message', (raw: any) => {
      const msg = JSON.parse(raw.toString());


      switch (msg.type) {
        case 'join_tournament':
          console.log(`Received 'join_tournament' message from user: ${player.id}`);
          this.playerQueue.enqueue(player);
          // You might send a confirmation back to the client if needed
          conn.send(JSON.stringify({ type: 'join_confirmation', playerId: player.id }));
          break;
        case 'leave_tournament':
          console.log(`Received 'leave_tournament' message from user: ${player.id}`);
          this.playerQueue.remove(player); // Implement this in PlayerQueue
          this.tournamentSession.removePlayer(player); // Implement this in TournamentSession
          conn.send(JSON.stringify({ type: 'leave_confirmation', playerId: player.id }));
          this.broadcastPlayerUpdate(); // Implement this to notify other clients
          break;
        case 'spectate_request':
          const { matchId } = msg;
          console.log(`Received 'spectate_request' for match ${matchId} from user: ${player.id}`);
          this.handleSpectateRequest(player, matchId); // Implement this
          break;
        case 'match_result':
          const { matchId: resultMatchId, winnerId } = msg;
          this.tournamentSession.handleMatchResult(matchId, winnerId);
          break;
        default:
          console.log('Received unknown message type:', msg.type);
      }

    });

    conn.on('close', () => {
      console.log(`WebSocket connection closed for user: ${player.id}`);
      this.playerQueue.remove(player);
      this.tournamentSession.removePlayer(player);
      this.broadcastPlayerUpdate(); // Notify others of the disconnection
      // Clean up any resources associated with the player
    });
  }

  private broadcastPlayerUpdate() {
    const playersInQueue = this.playerQueue.getPlayersInQueue().map(p => p.id);
    this.tournamentSession.broadcast({ type: 'player_list_updated', players: playersInQueue });
  }

  private handleSpectateRequest(spectator: Player, matchId: number) {
    const match = this.tournamentSession.getMatchById(matchId); // Implement this in TournamentSession
    if (match && !match.isFinished) {
      // Send initial match state to the spectator
      spectator.socket.send(JSON.stringify({ type: 'spectate_init', match }));
      // Store the spectator and the match they are watching (you might need a dedicated structure)
      this.tournamentSession.addSpectator(matchId, spectator); // Implement this
    } else {
      spectator.socket.send(JSON.stringify({ type: 'spectate_failed', message: 'Match not found or finished.' }));
    }
  }
}