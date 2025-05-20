import { hourGlassSvg, thumbsDownSvg, thumbsUpSvg } from "../../images";
import { languageService } from "../i18n";
import { getDataFromForm, getElement, showToast } from "../utils";
import { ModalManager } from "./modal";
import { Match, Profile } from "./Types";

/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
let otherId: number;

export function initProfile(userId?: number): void {
  if (userId && userId > 0) {
    otherId = userId;
    fetchUserProfile(otherId).then((userProfile) => {
      renderUserProfile(userProfile);
      renderMatchHistory(otherId);
    });
    setClickEvents();
    setProfileButtons(true);
  } else {
    setProfileButtons(false);

    renderUserProfile();
    renderMatchHistory();
  }

  const modalManager = new ModalManager("edit-profile-modal");

  modalManager.init(
    onEditProfileSubmit,
    resetEditProfileForm,
    onAvatarChange
  );
}

function setProfileButtons(isOther: boolean) {
  const editProfileBtn = getElement('edit-profile-btn') as HTMLButtonElement;
  const friendDiv = getElement('friend-div') as HTMLDivElement;
  const addFriendBtn = getElement('profile-add-friend-btn') as HTMLButtonElement;
  const removeFriendBtn = getElement('profile-remove-friend-btn') as HTMLButtonElement;
  const blockBtn = getElement('profile-block-btn') as HTMLButtonElement;
  const unblockBtn = getElement('profile-unblock-btn') as HTMLButtonElement;
  const pendingBtn = getElement('profile-pending-btn') as HTMLButtonElement;

  if (isOther) {
    // fetch friend status to determine which buttons to show
    editProfileBtn.classList.add('hidden');
    friendDiv.classList.remove('hidden');

    fetch(`/api/friends/status/${otherId}`, {
      method: 'GET',
      credentials: 'include'
    }).then(res => {
      if (res.status === 401) {
        window.location.href = '/auth';
        return null;
      }
      return res.json();
    }).then((res) => {
      console.log(res);
      if (res.success) {
        const status = res.status;
        if (status === 'accepted') {
          addFriendBtn.classList.add('hidden');
          removeFriendBtn.classList.remove('hidden');
          blockBtn.classList.remove('hidden');
          unblockBtn.classList.add('hidden');
          pendingBtn.classList.add('hidden');
        } else if (status === 'pending') {
          pendingBtn.classList.remove('hidden');
          addFriendBtn.classList.add('hidden');
          removeFriendBtn.classList.add('hidden');
          blockBtn.classList.remove('hidden');
          unblockBtn.classList.add('hidden');
        } else if (status === 'blocked') {
          addFriendBtn.classList.add('hidden');
          removeFriendBtn.classList.add('hidden');
          blockBtn.classList.add('hidden');
          unblockBtn.classList.remove('hidden');
          pendingBtn.classList.add('hidden');
        } else {
          addFriendBtn.classList.remove('hidden');
          removeFriendBtn.classList.add('hidden');
          blockBtn.classList.remove('hidden');
          unblockBtn.classList.add('hidden');
          pendingBtn.classList.add('hidden');
        }
      }
    });

  } else {
    editProfileBtn.classList.remove('hidden');
    friendDiv.classList.add('hidden');
  }
}

function setClickEvents() {
  const addFriendBtn = getElement('profile-add-friend-btn') as HTMLButtonElement;
  const removeFriendBtn = getElement('profile-remove-friend-btn') as HTMLButtonElement;
  const blockBtn = getElement('profile-block-btn') as HTMLButtonElement;
  const unblockBtn = getElement('profile-unblock-btn') as HTMLButtonElement;
  const chatBtn = getElement('chat-btn') as HTMLButtonElement;

  removeFriendBtn.addEventListener('click', () => {
    fetch('/api/friends/decline-friend-request', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otherId: otherId,
      }),
    }).then(res => {
      if (res.status === 401) {
        window.location.href = '/auth';
        return null;
      }
      return res.json();
    }).then((res) => {
      if (res.success) {
        showToast('Friend removed successfully!', '', 'success');
        fetchUserProfile(otherId).then((userProfile) => {
          renderUserProfile(userProfile);
          renderMatchHistory(otherId);
        });
      } else {
        showToast('Failed to remove friend.', '', 'error');
      }
    });
  });

  unblockBtn.addEventListener('click', () => {
    fetch('/api/friends/unblock', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otherId: otherId,
      }),
    }).then(res => {
      if (res.status === 401) {
        window.location.href = '/auth';
        return null;
      }
      return res.json();
    }).then((res) => {
      if (res.success) {
        showToast('User unblocked successfully!', '', 'success');
        fetchUserProfile(otherId).then((userProfile) => {
          renderUserProfile(userProfile);
          renderMatchHistory(otherId);
        });
      } else {
        showToast('Failed to unblock user.', '', 'error');
      }
    });
  });

  addFriendBtn.addEventListener('click', () => {
    fetch('/api/friends/send-friend-request', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otherId: otherId,
      }),
    }).then(res => {
      if (res.status === 401) {
        window.location.href = '/auth';
        return null;
      }
      return res.json();
    }).then((res) => {
      if (res.success) {
        showToast('Friend request sent successfully!', '', 'success');
        fetchUserProfile(otherId).then((userProfile) => {
          renderUserProfile(userProfile);
          renderMatchHistory(otherId);
        });
      } else {
        showToast('Failed to send friend request.', '', 'error');
      }
    });
  });

  blockBtn.addEventListener('click', () => {
    fetch('/api/friends/block', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otherId: otherId,
      }),
    }).then(res => {
      if (res.status === 401) {
        window.location.href = '/auth';
        return null;
      }
      return res.json();
    }).then((res) => {
      if (res.success) {
        showToast('User blocked successfully!', '', 'success');
        fetchUserProfile(otherId).then((userProfile) => {
          renderUserProfile(userProfile);
          renderMatchHistory(otherId);
        });
      } else {
        showToast('Failed to block user.', '', 'error');
      }
    });
  });

  chatBtn.addEventListener('click', () => {
    startChat();
  });
}

function startChat() {
  if (!otherId) {
    console.error('User ID is not defined.');
    return;
  }

  fetch('/api/chat/register', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      otherId: otherId,
    }),
  })
    .then(res => {
      if (res.status === 401) {
        window.location.href = '/auth';
        return null;
      }
      return res.json();
    })
    .then(data => {
      if (data.success) {
        // const chatWindow = document.getElementById("chat-window") as HTMLDivElement;
        // chatWindow.classList.remove("w-[480px]", "h-[300px]", "animate-grow-bounce");
        // chatWindow.classList.add("w-0", "h-0", "scale-0");
        showToast('Chat started successfully!', '', 'success');
      } else {
        console.error('Chat failed:', data.message);
      }
    })
    .catch(error => {
      console.error('Error during login:', error);
    });
}

async function fetchUserProfile(userId: number): Promise<Profile | undefined> {
  try {
    const response = await fetch(`/api/user/profile/${userId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error:', errorData.message || response.statusText);
      return undefined;
    }
    const data = await response.json();
    return data.user as Profile;
  } catch (error) {
    console.error('Network error:', error);
    return undefined;
  }
}

function onAvatarChange() {
  const avatarInputBtn = document.getElementById('change-avatar-btn') as HTMLInputElement;
  const avatarImg = document.getElementById('avatar-input') as HTMLImageElement;

  const file = avatarInputBtn.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarInputBtn.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    avatarImg.src = URL.createObjectURL(file);
  }
}

// Render user profile
function renderUserProfile(profile: Profile | undefined = undefined) {

  if (profile)
    fillProfileData(profile);
  else {
    fetch('/api/user/profile', {
      method: 'GET',
      credentials: 'include',
    }).then(res => {
      if (res.status === 401) {
        window.location.href = '/auth';
        return null;
      }
      return res.json();
    }).then((response) => {
      if (!response || !response.success) {
        window.location.href = '/auth';
        return;
      }
      profile = response.user as Profile;
      fillProfileData(profile);
    })
      .catch(() => {
        window.location.href = '/auth';
      });
  }
}

function fillProfileData(profile: Profile) {
  // Set user details
  (getElement('user-profile-avatar') as HTMLImageElement).src = profile.avatar_url;
  getElement('display_name').textContent = profile.display_name;
  getElement('username').textContent = profile.username;
  getElement('rank').textContent = 'rookie'; // TODO: Add rank to user in database??
  const navAvatar = getElement('user-avatar') as HTMLImageElement;
  navAvatar.src = profile.avatar_url;
  navAvatar.alt = profile.display_name;

  // Set user stats
  getElement('games-played').textContent = profile.games_played.toString();
  getElement('wins').textContent = profile.wins.toString();
  getElement('losses').textContent = profile.losses.toString();
  // Calculate win rate
  const winRate = profile.games_played > 0
    ? Math.round((profile.wins / profile.games_played) * 100)
    : 0;
  getElement('win-rate').textContent = `${winRate}%`;
  getElement('win-rate-bar').style.width = `${winRate}%`;

  // Set modal details
  (getElement('avatar-input') as HTMLImageElement).src = profile.avatar_url;
  (getElement('username-input') as HTMLInputElement).value = profile.username;
  (getElement('email-input') as HTMLInputElement).value = profile.email;
  (getElement('display-name-input') as HTMLInputElement).value = profile.display_name;
  (getElement('toggle-2fa') as HTMLInputElement).checked = profile.has2fa;
}

// Render match history
function renderMatchHistory(userId?: number) {
  const recentActivityContainer = getElement('recent-activity');
  recentActivityContainer.innerHTML = '';

  const apiUrl = userId !== undefined ? `/api/user/recent-matches/${userId}` : '/api/user/recent-matches';

  fetch(apiUrl, {
    method: 'GET',
    credentials: 'include',
  }).then(res => {
    if (res.status === 401) {
      window.location.href = '/auth';
      return null;
    }
    return res.json();
  }).then((res) => {
    const matchHistory = res.matchHistory as Match[];
    if (!matchHistory) {
      return;
    }
    matchHistory.forEach(match => {
      if (matchHistory.indexOf(match) < 5) {
        const recentMatchElement = createMatchElement(match, false);
        recentActivityContainer.appendChild(recentMatchElement);
      }
    });
    languageService.init();
  });

}
// Create match element
function createMatchElement(match: Match, showDetailsButton = false) {
  const matchElement = document.createElement('div');
  matchElement.className = 'rounded-lg p-2';
  const resultColor = match.result === 'win' ? 'text-[#41C47B]' : match.result === 'ongoing' ? 'text-[#FF9F1C]' : 'text-[#FB2C34]';
  const bgColor = match.result === 'win' ? 'bg-[#1C232A]' : match.result === 'ongoing' ? 'bg-[#432d11a3]' : 'bg-[#1C232A]';
  const icon = match.result === 'win' ? thumbsUpSvg : match.result === 'ongoing' ? hourGlassSvg : thumbsDownSvg;
  const date = new Date(match.date).getFullYear() + "-" + (new Date(match.date).getMonth() + 1) + "-" + new Date(match.date).getDay();

  matchElement.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1">
        <div class="w-10 h-10 rounded-full flex items-center justify-center ${bgColor}">
          ${icon}
        </div>
        <div>
          <p class="font-semibold"><span data-i18n="profile_versus"></span> ${match.opponent}</p>
          <p class="text-gray-400 text-sm">${date}</p>
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

// Update the data
function onEditProfileSubmit(e: Event) {
  e.preventDefault();
  const form = getDataFromForm("edit-profile-form");
  const avatarUrl = (getElement('avatar-input') as HTMLImageElement).src;
  const twoFA = (getElement('toggle-2fa') as HTMLInputElement).checked;

  fetch(avatarUrl)
    .then(res => res.blob())
    .then(blob => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Send update to backend
        fetch('/api/user/update', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...form, twoFA, avatarUrl: base64data }),
        })
          .then(res => {
            if (res.status === 401) {
              window.location.href = '/auth';
              return null;
            }
            return res.json();
          })
          .then((response) => {
            if (response.success) {
              renderUserProfile();
            }
            const modal = new ModalManager("edit-profile-modal");
            modal.hide();
          });
      }
      reader.readAsDataURL(blob);
    });

}

function resetEditProfileForm() {
  renderUserProfile();
  (getElement('avatar-input') as HTMLImageElement).src = (getElement('user-avatar') as HTMLImageElement).src;
  (getElement('current-password-input') as HTMLInputElement).value = '';
  (getElement('new-password-input') as HTMLInputElement).value = '';
  (getElement('confirm-password-input') as HTMLInputElement).value = '';
  (getElement('display-name-input') as HTMLInputElement).value = getElement('display-name-input').textContent || '';
  const toggle2faText = getElement('toggle-2fa').textContent || 'false';
  (getElement('toggle-2fa') as HTMLInputElement).checked = Boolean(JSON.parse(toggle2faText));
}