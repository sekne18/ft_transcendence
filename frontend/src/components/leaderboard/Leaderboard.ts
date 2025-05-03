export function Leaderboard() {
    return `
         <div class="max-w-lg mx-auto mt-8">
      <h2 class="text-2xl font-bold mb-6 text-center" data-i18n="leaderboard_title">Leaderboard</h2>
      
      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gray-100 border-b">
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-i18n="leaderboard_rank">Rank</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-i18n="leaderboard_player">Player</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-i18n="leaderboard_score">Score</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">1</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Player1</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1500</td>
            </tr>
            <tr class="border-b bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">2</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Player2</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1350</td>
            </tr>
            <tr class="border-b">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">3</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Player3</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1200</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    `;
}