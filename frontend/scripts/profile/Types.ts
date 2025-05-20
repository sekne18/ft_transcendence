// Types definition
export interface User {
  username: string;
  email: string;
  avatarUrl: string;
}

export interface Match {
  id: number;
  opponent: string;
  result: 'win' | 'loss' | 'ongoing';
  score: string;
  date: string;
}

export interface Profile {
    id: number;
    username: string;
    display_name: string;
    email: string;
    avatar_url: string;
    games_played: number;
    wins: number;
    losses: number;
    has2fa: boolean;
    longest_streak: number;
    avg_score: number;
}

export interface EditForm {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}