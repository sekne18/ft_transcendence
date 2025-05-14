export interface FriendListPlayer
{
    id: number;
    username: string;
    state: string;
    online: boolean;
    avatarUrl: string;
}

function createAllFriendsRow(friend: FriendListPlayer): string {
    const borderColor = friend.state == "In Game"
      ? 'border-[#6366F1]'
      : friend.online == true
        ? 'border-[#45D483]'
        : friend.online == false
          ? 'border-[#F4407F]'
          : 'border-gray-500';
    const status = friend.online == false
      ? 'Offline'
      : 'Online';
  
    return `
      <div class="flex items-center p-4 bg-[#1E1E2A] hover:bg-[#252532] transition-colors duration-200">
        <!-- Avatar -->
        <div class="relative mr-3">
          <img src="${friend.avatarUrl}" alt="${friend.username}" class="w-10 h-10 rounded-full ${borderColor} border-2">
        </div>
  
        <!-- Username and Status -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white truncate">${friend.username}</p>
          <p class="text-xs text-gray-400 truncate">${status}</p>
        </div>
  
        <!-- Action Buttons -->
        <div class="flex items-center gap-2 ml-auto">
          <!-- Profile Button -->
          <button class="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded" title="View Profile">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M5.121 17.804A6.001 6.001 0 0112 15a6.001 6.001 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
  
          <!-- Remove Friend Button -->
          <button class="p-2 text-white bg-yellow-600 hover:bg-yellow-700 rounded" title="Remove Friend">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M18 9a3 3 0 11-6 0 3 3 0 016 0zM13.5 16H6a4 4 0 00-4 4v1h11.5M23 16h-6" />
            </svg>
          </button>
  
          <!-- Block Button -->
          <button class="p-2 text-white bg-red-600 hover:bg-red-700 rounded" title="Block">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M18.364 5.636a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728zM6.343 17.657l11.314-11.314" />
            </svg>
          </button>
        </div>
      </div>
    `;
}

export function renderFriendslist(players: FriendListPlayer[], isFriends: boolean) {
  const leaderboardBody = document.getElementById('friendslist-body') as HTMLElement;
  if (isFriends)
    leaderboardBody.innerHTML = players.map(createAllFriendsRow).join(''); // display friends
  else
    leaderboardBody.innerHTML = players.map(createAllFriendsRow).join(''); // Display users, use different function
}