export interface TournamentPlayer {
  id: string;
  username: string;
  avatarUrl: string;
  level: number;
  wins: number;
  losses: number;
}

export interface TournamentMatch {
  id: string;
  round: number;
  position: number;
  player1?: TournamentPlayer;
  player2?: TournamentPlayer;
  winner?: TournamentPlayer;
  score?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Tournament {
  id: string;
  status: 'queuing' | 'in_progress' | 'completed';
  players: TournamentPlayer[];
  matches: TournamentMatch[];
  maxPlayers: number;
}