import { languageService } from "../i18n";
import { onAcceptFriendRequestClick, onAddFriendClick, onBlockFriendClick, onProfileClick, onRemoveFriendClick, onUnblockFriendClick } from "./friendshipClickEvents";

export interface FriendListPlayer {
  id: number;
  username: string;
  state: string;
  online: boolean;
  avatarUrl: string;
}

function noUserFound(isFriends: boolean): string {
  const msg = isFriends == true
    ? 'friendslist_no_friends'
    : 'friendslist_no_users'

  return `
      <div class="flex items-center justify-center p-8 bg-[#1E1E2A] text-white">
        <h1 class="text-2xl font-bold text-center" data-i18n="${msg}"></h1>
      </div>
    `;
}

function renderAllUsers(friend: FriendListPlayer): string {
  const borderColor = friend.online == true
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
        <button class="user-profile-btn p-2 text-white bg-blue-600 hover:bg-blue-700 rounded" data-user-id="${friend.id}" title="View Profile">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="w-4 h-4" stroke="currentColor">
            <g fill="#fff">
              <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"/><
            </g>
          </svg>
        </button>

          <!-- Add Friend Button -->
          <button class="add-friend-btn p-2 text-white bg-green-600 hover:bg-green-700 rounded" data-user-id="${friend.id}" title="Add friend">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor">
              <g fill="#fff">
                <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM504 312l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/>
              </g>
            </svg>
          </button>

          <!-- Block Button -->
          <button class="block-friend-btn p-2 text-white bg-red-600 hover:bg-red-700 rounded" data-user-id="${friend.id}" title="Block">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M18.364 5.636a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728zM6.343 17.657l11.314-11.314" />
            </svg>
          </button>

      </div>
    </div>
  `;
}

function renderAllFriends(friend: FriendListPlayer): string {
  const borderColor = friend.online == true
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
          <button id="see-profile" class="user-profile-btn p-2 text-white bg-blue-600 hover:bg-blue-700 rounded" data-user-id="${friend.id}" title="View Profile">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="w-4 h-4" stroke="currentColor">
              <g fill="#fff">
                <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"/><
              </g>
            </svg>
          </button>
  
          <!-- Remove Friend Button -->
          <button class="remove-friend-btn p-2 text-white bg-yellow-600 hover:bg-yellow-700 rounded" data-user-id="${friend.id}" title="Remove Friend">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor">
            <g fill="#fff">
              <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM472 200l144 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-144 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z"/>
            </g>
          </svg>
          </button>
    
          <!-- Block Button -->
          <button class="block-friend-btn p-2 text-white bg-red-600 hover:bg-red-700 rounded" data-user-id="${friend.id}" title="Block">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M18.364 5.636a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728zM6.343 17.657l11.314-11.314" />
            </svg>
          </button>
        </div>
      </div>
    `;
}

function renderPending(friend: FriendListPlayer): string {
  const borderColor = friend.online == true
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
          <button id="see-profile" class="user-profile-btn p-2 text-white bg-blue-600 hover:bg-blue-700 rounded" data-user-id="${friend.id}" title="View Profile">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="w-4 h-4" stroke="currentColor">
              <g fill="#fff">
                <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"/><
              </g>
            </svg>
          </button>
  
          <!-- Accept Friend Button -->
          <button class="accept-friend-request-btn p-2 text-white bg-green-600 hover:bg-green-700 rounded" data-user-id="${friend.id}" title="Accept Friend Request">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor">
              <g fill="#fff">
                <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM504 312l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/>
              </g>
            </svg>
          </button>

          <!-- Remove Friend Button -->
          <button class="remove-friend-btn p-2 text-white bg-yellow-600 hover:bg-yellow-700 rounded" data-user-id="${friend.id}" title="Remove Friend">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor">
              <g fill="#fff">
                <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM472 200l144 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-144 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z"/>
              </g>
            </svg>
          </button>
        </div>
      </div>
    `;
}

function renderBlocked(friend: FriendListPlayer): string {
  const borderColor = friend.online == true
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
          <button id="see-profile" class="user-profile-btn p-2 text-white bg-blue-600 hover:bg-blue-700 rounded" data-user-id="${friend.id}" title="View Profile">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="w-4 h-4" stroke="currentColor">
              <g fill="#fff">
                <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"/><
              </g>
            </svg>
          </button>

          <!-- Unblock Friend Button -->
          <button class="unblock-friend-btn p-2 text-white bg-green-600 hover:bg-green-700 rounded" data-user-id="${friend.id}" title="Unblock Friend">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 448 512" stroke="currentColor">
              <g fill="#fff">  
                <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
              </g>
            </svg>
          </button>
        </div>
      </div>
    `;
}

export function renderFriendslist(players: FriendListPlayer[], isFriends: boolean, type: string): void {
  const friendslistBody = document.getElementById('friendslist-body') as HTMLElement;

  if (players.length === 0)
    friendslistBody.innerHTML = noUserFound(isFriends);
  else if (isFriends) {
    switch (type) {
      case 'all':
        friendslistBody.innerHTML = players.map(renderAllFriends).join(''); // display friends
        break;
      case 'pending':
        friendslistBody.innerHTML = players.map(renderPending).join(''); // display pending friends
        break;
      case 'blocked':
        friendslistBody.innerHTML = players.map(renderBlocked).join(''); // display blocked friends
        break;
      case 'online':
        friendslistBody.innerHTML = players.map(renderAllFriends).join(''); // display online friends
        break;
    }
  }
  else
    friendslistBody.innerHTML = addTitleAndDescription() + players.map(renderAllUsers).join(''); // Display users
  languageService.init();
  setButtonHandlers();
}

function setButtonHandlers() {
  onProfileClick();
  onBlockFriendClick();
  onRemoveFriendClick();
  onAcceptFriendRequestClick();
  onAddFriendClick();
  onUnblockFriendClick();
}

function addTitleAndDescription() {
  return `
    <div class="flex items-center justify-center pt-8 bg-[#1E1E2A] text-white border-0">
        <h1 class="text-2xl font-bold text-center" data-i18n="friendslist_no_friends"></h1>
      </div>
      <div class="flex items-center justify-center pb-8 bg-[#1E1E2A] text-white">
        <p class="text-gray-500" text-center" data-i18n="friendslist_showing_users"></p>
      </div>
      `;
}