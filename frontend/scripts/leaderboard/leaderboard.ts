import { LeaderboardPlayer, renderLeaderboard } from "./userList";
import { leaderboardEntry } from "./types";
import { languageService } from "../i18n";
import { protectedFetch } from "../utils";

/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
export function initLeaderboard(): void {
    getData();
}

function getData(offset = 0): void {
    protectedFetch(`/api/leaderboard?limit=10&offset=${offset}`, {
        method: 'GET',
        credentials: 'include',
    }).then((response) => {
        if (!response.ok) {
            console.error('Failed to fetch leaderboard data');
            return;
        }
        response.json().then((data: any) => {
            const leaderboard: leaderboardEntry[] = data.leaderboard;
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
            languageService.init();
        });
    }).catch((error) => {
        console.error('Error fetching leaderboard data:', error);
    });
}