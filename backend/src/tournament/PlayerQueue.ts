import { TournamentSession } from "./TournamentSession.js";
import { Player } from "./Types.js";


export class PlayerQueue {
  private queue: Player[] = [];
  private tournamentState: TournamentSession;

  constructor(tournamentState: TournamentSession) {
    this.tournamentState = tournamentState;
  }

  enqueue(player: Player) {
    this.queue.push(player);

    if (this.queue.length === 8) {
      this.startTournament();
    }
  }

  private startTournament() {
    this.queue.forEach(player => this.tournamentState.enqueue(player));
    this.queue = [];
  }
}
