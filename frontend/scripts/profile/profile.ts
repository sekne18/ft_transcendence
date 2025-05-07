import { hourGlassSvg, thumbsDownSvg, thumbsUpSvg } from "../../images";
import { getDataFromForm, getElement } from "../utils";
import { ModalManager } from "./modal";
import { Match, Profile } from "./Types";

/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
export function initProfile(): void {
  renderUserProfile();
  renderMatchHistory()

  const modalManager = new ModalManager("edit-profile-modal");

  modalManager.init(
    onEditProfileSubmit,
    resetEditProfileForm,
    () => console.log("Change avatar clicked") // Optional: Replace with real logic
  );
}

// Render user profile
export function renderUserProfile() {
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
    (getElement('user-avatar') as HTMLImageElement).src = profile.avatar_url;
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
    (getElement('toggle-2fa') as HTMLInputElement).checked = profile.two_fa_enabled;
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


  const matchHistory = [
    { id: 1, opponent: "Felix Daems", result: "ongoing", score: "1-1", date: "2025-05-05" },
    { id: 2, opponent: "Flynn Mol", result: "win", score: "5-3", date: "2023-06-15" },
    { id: 3, opponent: "Felix Daems", result: "loss", score: "2-5", date: "2023-06-14" },
    { id: 4, opponent: "Yannick", result: "win", score: "5-1", date: "2023-06-12" },
    { id: 5, opponent: "Basil", result: "win", score: "5-4", date: "2023-06-10" },
    { id: 6, opponent: "Bastian", result: "win", score: "4-1", date: "2023-05-10" }
  ] as Match[];

  matchHistory.forEach(match => {
    const matchElement = createMatchElement(match);
    matchHistoryContainer.appendChild(matchElement);
    // Add only the first 3 matches to recent activity
    if (matchHistory.indexOf(match) < 5) {
      const recentMatchElement = createMatchElement(match, false);
      recentActivityContainer.appendChild(recentMatchElement);
    }
  });

  // fetch('/api/user/match-history', {
  //   method: 'GET',
  //   credentials: 'include',
  // }).then(res => {
  //   if (res.status === 401) {
  //     window.location.href = '/auth';
  //     return null;
  //   }
  //   return res.json();
  // }).then((res) => {
  //   const matchHistory = res.match_history as Match[];
  //   // console.log(matchHistory);
  //   // Create match history items
  //   matchHistory.forEach(match => {
  //     const matchElement = createMatchElement(match);
  //     matchHistoryContainer.appendChild(matchElement);
  //     // Add only the first 3 matches to recent activity
  //     if (matchHistory.indexOf(match) < 5) {
  //       const recentMatchElement = createMatchElement(match, false);
  //       recentActivityContainer.appendChild(recentMatchElement);
  //     }
  //   });
  // });

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

// Update the data
function onEditProfileSubmit(e: Event) {
  e.preventDefault();
  const form = getDataFromForm("edit-profile-form");
  const avatarUrl = (getElement('avatar-input') as HTMLImageElement).src;
  const twoFA = (getElement('toggle-2fa') as HTMLInputElement).checked;

  // Send update to backend
  fetch('/api/user/update', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ...form, twoFA, avatarUrl }),
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

function resetEditProfileForm() {
  (getElement('avatar-input') as HTMLImageElement).src = (getElement('user-avatar') as HTMLImageElement).src;
  (getElement('current-password-input') as HTMLInputElement).value = '';
  (getElement('new-password-input') as HTMLInputElement).value = '';
  (getElement('confirm-password-input') as HTMLInputElement).value = '';
  (getElement('display-name-input') as HTMLInputElement).value = getElement('display-name-input').textContent || '';
  const toggle2faText = getElement('toggle-2fa').textContent || 'false';
  (getElement('toggle-2fa') as HTMLInputElement).checked = Boolean(JSON.parse(toggle2faText));
}