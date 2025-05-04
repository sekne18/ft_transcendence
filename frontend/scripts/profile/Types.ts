// Types definition
export interface User {
  username: string;
  email: string;
  avatarUrl: string;
  rank: string
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
  };
}

export interface Match {
  id: number;
  opponent: string;
  result: 'win' | 'loss';
  score: string;
  date: string;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  completed: boolean;
  progress?: number;
  total?: number;
  icon: string;
}