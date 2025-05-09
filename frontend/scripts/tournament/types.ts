// export interface TournamentPlayer {
//   id: string;
//   username: string;
//   avatarUrl: string;
//   level: number;
//   wins: number;
//   losses: number;
//   stats: {
//     wins: number;
//     losses: number;
//   }
// }

import { Profile } from "../profile/Types";

export interface TournamentMatch {
  id: string;
  round: number;
  position: number;
  player1?: Profile;
  player2?: Profile;
  winner?: Profile;
  score?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Tournament {
  id: string;
  status: 'queuing' | 'in_progress' | 'completed';
  players: Profile[];
  matches: TournamentMatch[];
  maxPlayers: number;
}