import { createMatch, updateMatch } from "../db/queries/match.js";
import { gameParams } from "../game/GameParams.js";
import { GameSession } from "../game/GameSession.js";
import { PlayerConnection } from "../game/GameTypes.js";
import { Player, TournamentMatch } from "./Types.js";

export class TournamentSession {
  players: Player[] = [];
  matches: TournamentMatch[] = [];
  currentRound: TournamentMatch[][] = [];
  isFinished: boolean = false;
  tournamentId: number;
  maxPlayers: number = 2; // Assuming a 2-player tournament
  private clients: Player[] = [];
  private activeGameSessions: Map<number, GameSession> = new Map();
  // private spectators: Map<number, Player[]> = new Map(); // Map of matchId to spectators

  constructor(tournamentId: number) {
    this.tournamentId = tournamentId;
  }

  public enqueue(player: Player) {
    this.players.push(player);
    if (this.players.length === this.maxPlayers) {
      console.log('Tournament is full, starting tournament...');
      this.startTournament();
    }
  }

  public getActiveGameSessions(): Map<number, GameSession> {
    return this.activeGameSessions;
  }

  public removePlayer(playerToRemove: Player) {
    this.players = this.players.filter(player => player.id !== playerToRemove.id);
  }

  public getMatchById(matchId: number): TournamentMatch | undefined {
    return this.matches.find(m => m.id === matchId);
  }

  // public addSpectator(matchId: number, spectator: Player) {
  //   if (!this.spectators.has(matchId)) {
  //     this.spectators.set(matchId, []);
  //   }
  //   this.spectators.get(matchId)?.push(spectator);
  // }

  public broadcast(data: any) {
    this.clients.forEach(player => {
      player.socket.send(JSON.stringify(data));
    });
    // this.spectators.forEach(spectators => {
    //   spectators.forEach(spectator => {
    //     spectator.socket.send(JSON.stringify(data));
    //   });
    // });
  }

  public sanitizeMatchData(matches: TournamentMatch[]): any[] {
    return matches.map((match: TournamentMatch) => ({
      id: match.id,
      player1: {
        id: match.player1.id,
        username: match.player1.username,
        avatar_url: match.player1.avatar_url,
        isEliminated: match.player1.isEliminated
      },
      player2: {
        id: match.player2.id,
        username: match.player2.username,
        avatar_url: match.player2.avatar_url,
        isEliminated: match.player2.isEliminated
      },
      winner: match.winner ? {
        id: match.winner.id,
        username: match.winner.username,
        avatar_url: match.winner.avatar_url,
        isEliminated: match.winner.isEliminated
      } : null,
      score: match.score,
      isFinished: match.isFinished,
      round: match.round,
      position: match.position,
      status: match.status
    }));
  }

  private startTournament() {
    this.createRoundMatches();
    console.log('Tournament started with matches:', this.matches);
    this.broadcast({ type: 'tournament_started', matches: this.sanitizeMatchData(this.matches) });
    this.createAndStartTournamentGames(); 
    // setTimeout(() => {
    //   this.notifyPlayers();
    // }, 4000);
  }

  private createAndStartTournamentGames() {
    this.matches.forEach((match: TournamentMatch) => {
      if (!match.player1 || !match.player2 || !match.player1.socket || !match.player2.socket) {
        console.error(`Match ${match.id} is missing player data or sockets. Cannot start game.`);
        return;
      }

      // Construct PlayerConnection objects using the players from the tournament match
      const player1Conn: PlayerConnection = { id: match.player1.id, socket: match.player1.socket };
      const player2Conn: PlayerConnection = { id: match.player2.id, socket: match.player2.socket };

      // Create a new GameSession for this tournament match
      const newGameSession = new GameSession(
        player1Conn,
        player2Conn,
        gameParams,
        match.id    
      );
      this.activeGameSessions.set(match.id, newGameSession);
      newGameSession.start(); 

      match.status = "in_progress"; 
    });
  }

  // Method to clean up a game session when it's over
  public clearActiveGameSession(matchId: number): void {
    const session = this.activeGameSessions.get(matchId);
    if (session) {
      this.activeGameSessions.delete(matchId);
      console.log(`[TournamentSession] Cleared active game session for matchId: ${matchId}`);
    }
  }

  public addClient(client: Player) {
    if (!this.clients.some(c => c.id === client.id)) {
      this.clients.push(client);
    }
  }

  public removeClient(clientToRemove: Player) {
    this.clients = this.clients.filter(client => client.id !== clientToRemove.id);
    this.players = this.players.filter(player => player.id !== clientToRemove.id);
  }

  private createRoundMatches() {
    const roundMatches: TournamentMatch[] = [];
    for (let i = 0; i < this.maxPlayers; i += 2) {
      const match: TournamentMatch = {
        id: createMatch(this.players[i].id, this.players[i + 1].id, 0, 0),
        player1: this.players[i],
        player2: this.players[i + 1],
        isFinished: false,
        round: 1,
        position: 0,
        status: "in_progress",
        winner: {
          id: -1,
          avatar_url: undefined,
          username: undefined,
          isEliminated: false,
          socket: null as any
        },
        score: "",
      };
      roundMatches.push(match);
    }

    this.matches = roundMatches;
    this.currentRound.push(roundMatches);
  }

  public updateMatchStatus(matchId: number, status: "in_progress" | "pending" | "completed", winnerId: number | null) {
    console.log(`Updating match status for matchId: ${matchId}, status: ${status}, winnerId: ${winnerId}`);
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return;

    match.status = status;
    if (winnerId !== null) {
      const winner = match.player1.id === winnerId ? match.player1 : match.player2;
      match.winner = winner;
    }
    this.broadcastMatchUpdate(match);
  }

  public handleMatchResult(matchId: number, winnerId: number) {
    console.log(`Handling match result for matchId: ${matchId}, winnerId: ${winnerId}`);
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return;

    const winner = match.player1.id === winnerId ? match.player1 : match.player2;
    match.winner = winner;

    const loser = winner === match.player1 ? match.player2 : match.player1;
    loser.isEliminated = true;
    match.isFinished = true;
    match.status = "completed";

    this.clearActiveGameSession(matchId);
    this.broadcastMatchUpdate(match);
    
    if (this.matches.every(m => m.isFinished)) {
      const winners = this.matches.map(m => m.winner).filter(w => w && w.id !== 0); // Ensure winner is valid
      if (winners.length === 1 && this.players.length > 1) { // Final winner
        this.isFinished = true;
        this.sendTournamentFinished();
      } else if (winners.length >= 2) { 
        this.moveToNextRound(winners as Player[]);
      } else if (winners.length === 0 && this.players.length > 0 && this.matches.length > 0) {
        console.warn("All matches finished but no clear path to next round or tournament end.");
        this.isFinished = true; 
        this.sendTournamentFinished();
      } else if (winners.length === 1 && this.players.length === 1) {
        this.isFinished = true;
        this.sendTournamentFinished();
      }
    }
  }

  private moveToNextRound(winners: Player[]) {
    const newRoundMatches: TournamentMatch[] = [];
    const currentRoundNumber = this.matches.length > 0 ? this.matches[0].round + 1 : 1;

    for (let i = 0; i < winners.length; i += 2) {
      if (winners[i + 1]) {
        const match: TournamentMatch = {
          id: createMatch(this.players[i].id, this.players[i + 1].id, 0, 0),
          player1: winners[i],
          player2: winners[i + 1],
          isFinished: false,
          round: currentRoundNumber,
          position: i / 2,
          winner: {
            id: 0,
            avatar_url: undefined,
            username: undefined,
            isEliminated: false,
            socket: null as any
          },
          score: "",
          status: "pending"
        };
        newRoundMatches.push(match);
      } else {
        // Handle odd number of winners (e.g., a player gets a bye)
        // You might want to automatically advance the odd player or handle as per tournament rules.
        console.log(`Player ${winners[i].username} gets a bye to the next round.`);
      }
    }

    if (newRoundMatches.length > 0) {
      this.currentRound.push(newRoundMatches); //
      this.matches = newRoundMatches; //
      this.broadcast({ type: 'round_updated', matches: this.sanitizeMatchData(this.matches), round: currentRoundNumber });
      // setTimeout(() => {
      //   this.notifyPlayers(); // Notify players for new matches
      // }, 1000); // Delay to allow UI to update
    } else if (winners.length === 1) {
      // If only one winner remains from the round, they are the tournament winner.
      this.isFinished = true;
      this.sendTournamentFinished(winners[0]);
    } else {
      console.log("No new matches to form, tournament might be concluding or stuck.");
      this.isFinished = true;
      this.sendTournamentFinished();
    }
  }

  private sendTournamentFinished(finalWinner?: Player) { //
    const message: any = { type: 'tournament_finished' };
    if (finalWinner) {
      message.winner = {
        id: finalWinner.id,
        username: finalWinner.username,
        avatar_url: finalWinner.avatar_url
      };
    } else if (this.matches.length > 0) {
      const lastMatchWithWinner = [...this.matches].reverse().find(m => m.isFinished && m.winner && m.winner.id !== 0);
      if (lastMatchWithWinner && lastMatchWithWinner.winner) {
        message.winner = {
          id: lastMatchWithWinner.winner.id,
          username: lastMatchWithWinner.winner.username,
          avatar_url: lastMatchWithWinner.winner.avatar_url
        };
      }
    }

    this.broadcast(message);
    this.isFinished = true;
  }

  private broadcastMatchUpdate(data: any) {
    this.clients.forEach(player => {
      if (player.socket && player.socket.readyState === player.socket.OPEN) {
        player.socket.send(JSON.stringify(data));
      }
    });
    // this.spectators.forEach(spectatorsList => { //
    //   spectatorsList.forEach(spectator => { //
    //     if(spectator.socket && spectator.socket.readyState === spectator.socket.OPEN) {
    //       spectator.socket.send(JSON.stringify(data));
    //     }
    //   });
    // });
  }
}
