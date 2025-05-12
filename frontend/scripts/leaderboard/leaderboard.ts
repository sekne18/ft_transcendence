import { LeaderboardPlayer, renderLeaderboard } from "./userList";
import { leaderboardEntry } from "./types";

/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
export function initLeaderboard(): void {
    console.log("Leaderboard initialized");
    getData();
}

function getData(offset = 0): void {
    fetch(`/api/leaderboard?limit=10&offset=${offset}`, {
        method: 'GET',
        credentials: 'include',
    }).then((response) => {
        if (!response.ok) {
            console.error('Failed to fetch leaderboard data');
            return;
        }
        response.json().then((data: any) => {
            const leaderboard: leaderboardEntry[] = data.leaderboard;
            console.log('Leaderboard data:', leaderboard);
            const leaderboardData: LeaderboardPlayer[] = leaderboard.map((entry, i) => ({
                id: entry.user_id.toString(),
                rank: i + 1 + offset,
                username: entry.display_name,
                avatarUrl: entry.avatar_url,
                wins: entry.wins,
                losses: entry.losses,
                winRate: entry.wins / (entry.wins + entry.losses) * 100,
                level: Math.floor(entry.games_played / 100) // Example calculation for level
            }));
            renderLeaderboard(leaderboardData);
        });
    }).catch((error) => {
        console.error('Error fetching leaderboard data:', error);
    });

    // Mock data
    /*
    const leaderboardData: LeaderboardPlayer[] = [
        {
            id: '1',
            rank: 1,
            username: 'Jan Sekne',
            avatarUrl: 'https://img.heroui.chat/image/avatar?w=200&h=200&u=10',
            wins: 248,
            losses: 52,
            winRate: 82.7,
            level: 42
        },
        {
            id: '2',
            rank: 2,
            username: 'Flynn Mol',
            avatarUrl: 'https://img.heroui.chat/image/avatar?w=200&h=200&u=11',
            wins: 201,
            losses: 49,
            winRate: 80.4,
            level: 38
        },
        {
            id: '3',
            rank: 3,
            username: 'Felix Daems',
            avatarUrl: 'https://img.heroui.chat/image/avatar?w=200&h=200&u=12',
            wins: 187,
            losses: 63,
            winRate: 74.8,
            level: 35
        },
        {
            id: '4',
            rank: 4,
            username: 'RallyChamp',
            avatarUrl: 'https://img.heroui.chat/image/avatar?w=200&h=200&u=13',
            wins: 156,
            losses: 72,
            winRate: 68.4,
            level: 31
        },
        {
            id: '5',
            rank: 5,
            username: 'BallBouncer',
            avatarUrl: 'https://img.heroui.chat/image/avatar?w=200&h=200&u=14',
            wins: 142,
            losses: 68,
            winRate: 67.6,
            level: 29
        }
    ];
    renderLeaderboard(leaderboardData);
    */
}