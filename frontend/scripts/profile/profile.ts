import { hourGlassSvg, thumbsDownSvg, thumbsUpSvg } from "../../images";
import { Match, User } from "./Types";

/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
export function initProfile(): void {
  // Mock data 
  const user = {
    username: "Jan Sekne",
    email: "player@student.s19.be",
    avatarUrl: "https://i.pravatar.cc/300",
    rank: "Gold",
    stats: {
      gamesPlayed: 414,
      wins: 349,
      losses: 65
    }
  } as User;
  // Mock match history data
  const matchHistory = [
    { id: 1, opponent: "Felix Daems", result: "ongoing", score: "1-1", date: "2025-05-05" },
    { id: 2, opponent: "Flynn Mol", result: "win", score: "5-3", date: "2023-06-15" },
    { id: 3, opponent: "Felix Daems", result: "loss", score: "2-5", date: "2023-06-14" },
    { id: 4, opponent: "Yannick", result: "win", score: "5-1", date: "2023-06-12" },
    { id: 5, opponent: "Basil", result: "win", score: "5-4", date: "2023-06-10" },
    { id: 6, opponent: "Bastian", result: "win", score: "4-1", date: "2023-05-10" }
  ] as Match[];

  renderUserProfile(user);
  renderMatchHistory(matchHistory);
}

// DOM Elements
function getElement(id: string) {
  const element = document.getElementById(id);
  if (!element)
    throw new Error(`Element with id "${id}" not found`);
  return element;
}

// Render user profile
function renderUserProfile(user: User) {
  // Set user details
  (getElement('user-avatar') as HTMLImageElement).src = user.avatarUrl;
  getElement('username').textContent = user.username;
  getElement('user-email').textContent = user.email;
  getElement('rank').textContent = user.rank;
  // Set stats
  getElement('games-played').textContent = user.stats.gamesPlayed.toString();
  getElement('wins').textContent = user.stats.wins.toString();
  getElement('losses').textContent = user.stats.losses.toString();
  // Calculate win rate
  const winRate = user.stats.gamesPlayed > 0
    ? Math.round((user.stats.wins / user.stats.gamesPlayed) * 100)
    : 0;
  getElement('win-rate').textContent = `${winRate}%`;
  getElement('win-rate-bar').style.width = `${winRate}%`;
}
// Render match history
function renderMatchHistory(matches: Match[]) {
  const matchHistoryContainer = getElement('match-history');
  const recentActivityContainer = getElement('recent-activity');
  // Clear containers
  matchHistoryContainer.innerHTML = '';
  recentActivityContainer.innerHTML = '';
  // Create match history items
  matches.forEach(match => {
    const matchElement = createMatchElement(match);
    matchHistoryContainer.appendChild(matchElement);
    // Add only the first 3 matches to recent activity
    if (matches.indexOf(match) < 5) {
      const recentMatchElement = createMatchElement(match, false);
      recentActivityContainer.appendChild(recentMatchElement);
    }
  });
}
// Create match element
function createMatchElement(match: Match, showDetailsButton = false) {
  const matchElement = document.createElement('div');
  matchElement.className = 'rounded-lg p-2';
  const resultColor = match.result === 'win' ? 'text-[#41C47B]' : match.result === 'ongoing' ? 'text-[#FF9F1C]' : 'text-[#FB2C34]';
  const bgColor = match.result === 'win' ? 'bg-[#1C232A]' : match.result === 'ongoing' ? 'bg-[#432d11a3]' : 'bg-[#1C232A]';
  const icon = match.result === 'win' ? thumbsUpSvg : match.result === 'ongoing' ? hourGlassSvg : thumbsDownSvg;
  matchElement.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1">
        <div class="w-10 h-10 rounded-full flex items-center justify-center ${bgColor}">
          ${icon}
        </div>
        <div>
          <p class="font-semibold">Match vs ${match.opponent}</p>
          <p class="text-gray-400 text-sm">${match.date}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="font-semibold ${resultColor}">
          ${match.result === 'win' ? 'Victory' : match.result === 'ongoing' ? 'Ongoing' : 'Defeat'}
        </p>
        <p class="text-gray-500 text-sm">${match.score}</p>
      </div>
    </div>
    ${showDetailsButton ? `
      <button class="mt-4 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-1 px-3 rounded transition">
        View Details
      </button>
    ` : ''}
  `;
  return matchElement;
}