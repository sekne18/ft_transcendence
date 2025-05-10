import { TournamentSession } from "./TournamentSession.js";
import { Player } from "./Types.js";


export class PlayerQueue {
  private queue: Player[] = [];
  private tournamentSession: TournamentSession;

  constructor(tournamentSession: TournamentSession) {
    this.tournamentSession = tournamentSession;
  }

  enqueue(player: Player) {
    this.queue.push(player);
    this.broadcastQueueUpdate();
    if (this.queue.length === 8) {
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

  private startTournament() {
    this.queue.forEach(player => this.tournamentSession.enqueue(player));
    this.queue = [];
    this.broadcastQueueUpdate();
  }
}
