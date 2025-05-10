import { Match, Player } from "./Types.js";

export class TournamentSession {
  players: Player[] = [];
  matches: Match[] = [];
  currentRound: Match[][] = [];
  isFinished: boolean = false;
  tournamentId: number;
  private spectators: Map<number, Player[]> = new Map(); // Map of matchId to spectators

  constructor(tournamentId: number) {
    this.tournamentId = tournamentId;
  }

  public enqueue(player: Player) {
    this.players.push(player);
    // this.broadcastPlayerList();
    if (this.players.length === 8) {
      this.startTournament();
    }
  }

  public removePlayer(playerToRemove: Player) {
    this.players = this.players.filter(player => player.id !== playerToRemove.id);
    // this.broadcastPlayerList();
  }

  public getMatchById(matchId: number): Match | undefined {
    return this.matches.find(m => m.id === matchId);
  }

  public addSpectator(matchId: number, spectator: Player) {
    if (!this.spectators.has(matchId)) {
      this.spectators.set(matchId, []);
    }
    this.spectators.get(matchId)?.push(spectator);
  }

  public broadcast(data: any) {
    console.log('Broadcasting data:', data);
    console.log('Players:', this.players);
    this.players.forEach(player => {
      player.socket.send(JSON.stringify(data));
    });
    this.spectators.forEach(spectators => {
      spectators.forEach(spectator => {
        spectator.socket.send(JSON.stringify(data));
      });
    });
  }

  // private broadcastPlayerList() {
  //   const currentPlayers = this.players.map(p => ({ id: p.id }));
  //   this.broadcast({ type: 'tournament_players_updated', players: currentPlayers });
  // }

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
        isFinished: false,
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

  public handleMatchResult(matchId: number, winnerId: number) {
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
    this.broadcastMatchUpdate(match);
  }

  private moveToNextRound() {
    const winners = this.matches.map(m => m.winner).filter(w => w);
    const newRoundMatches: Match[] = [];

    for (let i = 0; i < winners.length; i += 2) {
      const match: Match = {
        id: i / 2,
        player1: winners[i] as Player,
        player2: winners[i + 1] as Player,
        isFinished: false,
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
    this.broadcast({ type: 'tournament_finished' });
  }

  private broadcastMatchUpdate(match: Match) {
    this.broadcast({ type: 'match_updated', match });
  }
}
