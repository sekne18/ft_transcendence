export interface TournamentPlayer {
    id: string;
    username: string;
    avatarUrl: string;
    level: number;
    wins: number;
    losses: number;
}

export interface Tournament {
    id: string;
    status: 'queuing' | 'in_progress' | 'completed';
    players: TournamentPlayer[];
    maxPlayers: number;
}