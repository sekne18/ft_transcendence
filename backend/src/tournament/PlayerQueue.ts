import { TournamentSession } from "./TournamentSession.js";
import { Player } from "./Types.js";


export class PlayerQueue {
  private queue: Player[] = [];
  private tournamentSession: TournamentSession;
  private maxPlayers: number = 2;

  constructor(tournamentSession: TournamentSession) {
    this.tournamentSession = tournamentSession;
  }

  enqueue(player: Player) {
    this.queue.push(player);
    this.broadcastQueueUpdate();
    if (this.queue.length === this.maxPlayers) {
      this.startTournament();
    }
  }

  remove(playerToRemove: Player) {
    this.queue = this.queue.filter(player => player.id !== playerToRemove.id);
    this.broadcastQueueUpdate();
  }

  getPlayersInQueue(): Player[] {
    return [...this.queue];
  }

  private broadcastQueueUpdate() {
    const playersInQueue = this.queue.map(p => ({
      id: p.id,
      username: p.username,
      avatar_url: p.avatar_url,
    }));
    this.tournamentSession.broadcast({ type: 'queue_updated', players: playersInQueue });
  }

  // private broadcastTournamentStarted() {
  //   const playersInQueue = this.queue.map(p => ({
  //     id: p.id,
  //     username: p.username,
  //     avatar_url: p.avatar_url,
  //   }));
  //   this.tournamentSession.broadcast({ type: 'tournament_started', players: playersInQueue });
  // }

  private startTournament() {
    this.queue.forEach(player => this.tournamentSession.enqueue(player));
    this.queue = [];
    this.broadcastQueueUpdate();
  }
}
