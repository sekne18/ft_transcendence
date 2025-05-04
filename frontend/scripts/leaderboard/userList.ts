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
    ? '🥇'
    : player.rank === 2
    ? '🥈'
    : player.rank === 3
    ? '🥉'
    : player.rank.toString();

  const progressBarColor = player.winRate >= 70
    ? 'bg-[#45D483]'
    : player.winRate >= 50
    ? 'bg-[#6366F1]'
    : 'bg-[#F4407F]';

  return `
    <tr class="${highlightClass}">
      <td class="text-center font-medium">${medal}</td>
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
          <div class="w-full max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full ${progressBarColor}" style="width: ${player.winRate}%"></div>
          </div>
          <span class="text-sm font-semibold">${player.winRate.toFixed(1)}%</span>
        </div>
      </td>
    </tr>
  `;
}

function renderLeaderboardRows(players: LeaderboardPlayer[]) {
  const leaderboardBody = document.getElementById('leaderboard-body') as HTMLElement;
  leaderboardBody.innerHTML = players.map(createLeaderboardRow).join('');
}

function setupTabSwitching() {
  const tabButtons = document.querySelectorAll('[data-tab]');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const activeTab = button.getAttribute('data-tab') || 'global';

      tabButtons.forEach(btn =>
        btn.classList.remove('border-blue-500', 'text-blue-500')
      );
      button.classList.add('border-blue-500', 'text-blue-500');

      // TODO: Use activeTab to switch datasets if needed
    });
  });
}

export function renderLeaderboard(players: LeaderboardPlayer[]) {
  renderLeaderboardRows(players);
  setupTabSwitching();
}