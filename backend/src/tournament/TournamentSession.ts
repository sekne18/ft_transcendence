import { Match, Player } from "./Types.js";

export class TournamentSession {
  players: Player[] = [];
  matches: Match[] = [];
  currentRound: Match[][] = [];
  isFinished: boolean = false;
  tournamentId: number;

  constructor(tournamentId: number) {
    this.tournamentId = tournamentId;
  }

  enqueue(player: Player) {
    this.players.push(player);
    if (this.players.length === 8) {
      this.startTournament();
    }
  }

  private startTournament() {
    this.createRoundMatches();
  }

  private createRoundMatches() {
    const roundMatches: Match[] = [];
    for (let i = 0; i < 8; i += 2) {
      const match: Match = {
        id: i / 2,
        player1: this.players[i],
        player2: this.players[i + 1],
      };
      roundMatches.push(match);
    }

    this.matches = roundMatches;
    this.currentRound.push(roundMatches);
    this.notifyPlayers();
  }

  private notifyPlayers() {
    this.matches.forEach((match) => {
      match.player1.socket.send(JSON.stringify({
        type: 'match_found',
        opponentId: match.player2.id,
        matchId: match.id
      }));
      match.player2.socket.send(JSON.stringify({
        type: 'match_found',
        opponentId: match.player1.id,
        matchId: match.id
      }));
    });
  }

  handleMatchResult(matchId: number, winnerId: number) {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return;

    const winner = match.player1.id === winnerId ? match.player1 : match.player2;
    match.winner = winner;

    const loser = winner === match.player1 ? match.player2 : match.player1;
    loser.isEliminated = true;

    if (this.matches.filter(m => m.winner).length === this.matches.length) {
      this.isFinished = true;
      this.sendTournamentFinished();
    } else {
      this.moveToNextRound();
    }
  }

  private moveToNextRound() {
    const winners = this.matches.map(m => m.winner).filter(w => w);
    const newRoundMatches: Match[] = [];

    for (let i = 0; i < winners.length; i += 2) {
      const match: Match = {
        id: i / 2,
        player1: winners[i] as Player,
        player2: winners[i + 1] as Player,
      };
      newRoundMatches.push(match);
    }

    this.currentRound.push(newRoundMatches);
    this.matches = newRoundMatches;
    this.notifyPlayers();
  }

  private sendTournamentFinished() {
    this.players.forEach(player => {
      player.socket.send(JSON.stringify({ type: 'tournament_finished' }));
    });
  }
}
