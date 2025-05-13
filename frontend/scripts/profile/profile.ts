import { hourGlassSvg, thumbsDownSvg, thumbsUpSvg } from "../../images";
import { getDataFromForm, getElement } from "../utils";
import { ModalManager } from "./modal";
import { Match, Profile } from "./Types";

/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
let profile : Profile | null;

export function initProfile(userId?: number, existingProfile?: Profile): void {
  profile = existingProfile || null;
  renderUserProfile();
  renderMatchHistory()

  const modalManager = new ModalManager("edit-profile-modal");

  modalManager.init(
    onEditProfileSubmit,
    resetEditProfileForm,
    onAvatarChange
  );
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
export function renderUserProfile() {
  if (profile) {
    // Dont fetch but fill the data
  }
  // Fill user details
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

    const profile = response.user as Profile;

    // Set user details
    (getElement('user-profile-avatar') as HTMLImageElement).src = profile.avatar_url;
    getElement('display_name').textContent = profile.display_name;
    getElement('username').textContent = profile.username;
    getElement('rank').textContent = 'rookie'; // TODO: Add rank to user in database??

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
  })
    .catch(() => {
      window.location.href = '/auth';
    });
}

// Render match history
function renderMatchHistory() {
  const matchHistoryContainer = getElement('match-history');
  const recentActivityContainer = getElement('recent-activity');
  // Clear containers
  matchHistoryContainer.innerHTML = '';
  recentActivityContainer.innerHTML = '';

  fetch('/api/user/recent-matches', {
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
      const matchElement = createMatchElement(match);
      matchHistoryContainer.appendChild(matchElement);
      if (matchHistory.indexOf(match) < 5) {
        const recentMatchElement = createMatchElement(match, false);
        recentActivityContainer.appendChild(recentMatchElement);
      }
    });
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
          <p class="font-semibold">Match vs ${match.opponent}</p>
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

  fetch(avatarUrl) // fetch the blob from the blob URL
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