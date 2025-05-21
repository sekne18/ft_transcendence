import { bronzeMedalSvg, silverMedalSvg, trophySvg } from "../../images";

export interface LeaderboardPlayer {
  id: string;
  rank: number;
  username: string;
  avatarUrl: string;
  wins: number;
  losses: number;
  winRate: number;
  level: number;
}

function createLeaderboardRow(player: LeaderboardPlayer): string {
  const highlightClass = player.rank <= 3 ? 'bg-gray-800/50' : '';
  const medal = player.rank === 1
    ? trophySvg
    : player.rank === 2
      ? silverMedalSvg
      : player.rank === 3
        ? bronzeMedalSvg
        : player.rank.toString();
  const medalBgColor = player.rank === 1
    ? 'bg-[#44391F]'
    : player.rank === 2
      ? 'bg-[#3F4049]'
      : player.rank === 3
        ? 'bg-[#402D1E]'
        : player.rank.toString();

  const progressBarColor = player.winRate >= 70
    ? 'bg-[#45D483]'
    : player.winRate >= 50
      ? 'bg-[#6366F1]'
      : 'bg-[#F4407F]';

  const winRateHtml = Number.isNaN(player.winRate) ? `
          <span class="text-sm font-semibold" data-i18n="leaderboard_no_games_played"></span>
          ` : `
  <div class="w-full max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full ${progressBarColor}" style="width: ${player.winRate}%"></div>
          </div>
          <span class="text-sm font-semibold">${player.winRate.toFixed(1)}%</span>
          `;

  return `
    <tr class="${highlightClass}">
      <td class="text-center font-medium">
      <div class="w-10 h-10 justify-center justify-items-center justify-self-center content-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center ${medalBgColor}">
            ${medal}
          </div>
        </div>
      </td>
      <td>
        <div class="flex items-center gap-3">
          <img src="${player.avatarUrl}" alt="${player.username}" class="w-8 h-8 rounded-full" />
          <span class="font-semibold">${player.username}</span>
        </div>
      </td>
      <td class="text-center font-medium text-[#6366F1]">${player.level}</td>
      <td class="text-center text-[#45D483] font-semibold">${player.wins}</td>
      <td class="text-center text-[#F4407F] font-semibold">${player.losses}</td>
      <td>
        <div class="flex items-center gap-2">
          ${winRateHtml}
        </div>
      </td>
    </tr>
  `;
}

function renderLeaderboardRows(players: LeaderboardPlayer[]) {
  const leaderboardBody = document.getElementById('leaderboard-body') as HTMLElement;
  leaderboardBody.innerHTML = players.map(createLeaderboardRow).join('');
}

export function renderLeaderboard(players: LeaderboardPlayer[]) {
  renderLeaderboardRows(players);
}