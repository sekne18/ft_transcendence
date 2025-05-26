import { hourGlassSvg, thumbsDownSvg, thumbsUpSvg } from "../../images";
import { chatManager } from "../chat/chat";
import { languageService } from "../i18n";
import { getDataFromForm, getElement, showToast, protectedFetch } from "../utils";
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
	const chatBtn = getElement('chat-btn') as HTMLButtonElement;

	if (isOther) {
		// fetch friend status to determine which buttons to show
		editProfileBtn.classList.add('hidden');
		friendDiv.classList.remove('hidden');

		protectedFetch(`/api/friends/status/${otherId}`, {
			method: 'GET',
			credentials: 'include'
		}).then(res => {
			if (res.status === 401) {
				window.location.href = '/auth';
				return null;
			}
			return res.json();
		}).then((res) => {
			if (res.success) {
				const status = res.status;
				if (status === 'accepted') {
					addFriendBtn.classList.add('hidden');
					removeFriendBtn.classList.remove('hidden');
					blockBtn.classList.remove('hidden');
					unblockBtn.classList.add('hidden');
					pendingBtn.classList.add('hidden');
					chatBtn.classList.remove('pointer-events-none', 'opacity-50');
				} else if (status === 'pending') {
					pendingBtn.classList.remove('hidden');
					addFriendBtn.classList.add('hidden');
					removeFriendBtn.classList.add('hidden');
					blockBtn.classList.remove('hidden');
					unblockBtn.classList.add('hidden');
					chatBtn.classList.remove('pointer-events-none', 'opacity-50');
				} else if (status === 'blocked') {
					addFriendBtn.classList.add('hidden');
					removeFriendBtn.classList.add('hidden');
					blockBtn.classList.add('hidden');
					unblockBtn.classList.remove('hidden');
					pendingBtn.classList.add('hidden');
					chatBtn.classList.add('pointer-events-none', 'opacity-50');
				} else {
					addFriendBtn.classList.remove('hidden');
					removeFriendBtn.classList.add('hidden');
					blockBtn.classList.remove('hidden');
					unblockBtn.classList.add('hidden');
					pendingBtn.classList.add('hidden');
					chatBtn.classList.remove('pointer-events-none', 'opacity-50');
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
		protectedFetch('/api/friends/decline-friend-request', {
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
				showToast(languageService.retrieveValue('toast_friend_removed'), '', 'success');
				updateProfile();

			} else {
				showToast(languageService.retrieveValue('toast_failed_friend_rm'), '', 'error');
			}
		});
	});

	unblockBtn.addEventListener('click', () => {
		protectedFetch('/api/friends/unblock', {
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
			chatManager?.handleChatToggle(false);
			if (res.success) {
				showToast(languageService.retrieveValue('toast_unblock_user'), '', 'success');
				updateProfile();
			} else {
				showToast(languageService.retrieveValue('toast_failed_unblock_user'), '', 'error');
			}
		});
	});

	addFriendBtn.addEventListener('click', () => {
		protectedFetch('/api/friends/send-friend-request', {
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
				showToast(languageService.retrieveValue('toast_req_sent'), '', 'success');
				updateProfile();
			} else {
				showToast(languageService.retrieveValue('toast_req_failed_sent'), '', 'error');
			}
		});
	});

	blockBtn.addEventListener('click', () => {
		protectedFetch('/api/friends/block', {
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
			chatManager?.handleChatToggle(false);
			if (res.success) {
				showToast(languageService.retrieveValue('toast_block_user'), '', 'success');
				updateProfile();
			} else {
				showToast(languageService.retrieveValue('toast_failed_block_user'), '', 'error');
			}
		});
	});

	chatBtn.addEventListener('click', () => {
		startChat();
	});
}

function updateProfile() {
	fetchUserProfile(otherId).then((userProfile) => {
		renderUserProfile(userProfile);
		renderMatchHistory(otherId);
	});
	setProfileButtons(true);
}

function startChat() {
	if (!otherId) {
		//console.error('User ID is not defined.');
		return;
	}

	protectedFetch('/api/chat/register', {
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
			chatManager?.handleChatToggle(false);
			if (data.success) {
				showToast(languageService.retrieveValue('toast_chat_started'), '', 'success');
			} else {
				//console.error('Chat failed:', data.message);
			}
		})
		.catch(error => {
			//console.error('Error during login:', error);
		});
}

async function fetchUserProfile(userId: number): Promise<Profile | undefined> {
	try {
		const response = await protectedFetch(`/api/user/profile/${userId}`, {
			method: 'GET',
			credentials: 'include',
		});

		if (!response.ok) {
			const errorData = await response.json();
			//console.error('Error:', errorData.message || response.statusText);
			return undefined;
		}
		const data = await response.json();
		return data.user as Profile;
	} catch (error) {
		//console.error('Network error:', error);
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
		avatarImg.dataset.oldsrc = avatarImg.src; // Store old src in case of save failure
		avatarImg.src = URL.createObjectURL(file);
	}
}

// Render user profile
function renderUserProfile(profile: Profile | undefined = undefined) {
	if (profile)
		fillProfileData(profile);
	else {
		protectedFetch('/api/user/profile', {
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
	// set 2fa
	const twoFaContainer = getElement('two-fa-container') as HTMLDivElement;
	const passwordContainer = getElement('password-container') as HTMLDivElement;
	if (profile.role !== 'google-user') {
		twoFaContainer.classList.remove('opacity-50', 'pointer-events-none');
		passwordContainer.classList.remove('opacity-50', 'pointer-events-none');
	} else {
		twoFaContainer.classList.add('opacity-50', 'pointer-events-none');
		passwordContainer.classList.add('opacity-50', 'pointer-events-none');
	}

	// Set user details
	(getElement('user-profile-avatar') as HTMLImageElement).src = profile.avatar_url;
	getElement('display_name').textContent = profile.display_name;
	getElement('username').textContent = profile.username;
	const navAvatar = getElement('user-avatar') as HTMLImageElement;
	navAvatar.src = profile.avatar_url;
	navAvatar.alt = profile.display_name;
	getElement('level').textContent = Math.floor(profile.games_played / 100).toString();

	// Set user experience
	const experience = (profile.games_played / 100 - Math.floor(profile.games_played / 100)) * 500;
	getElement('experience').textContent = experience.toFixed(0).toString() + '/500 XP';
	getElement('experience-bar').style.width = `${Math.round(experience / 10)}%`;

	// Set user stats
	getElement('games-played').textContent = profile.games_played.toString();
	getElement('wins').textContent = profile.wins.toString();
	getElement('losses').textContent = profile.losses.toString();

	// Calculate avg score
	const avg_score = profile.avg_score > 5 ? 5 : profile.avg_score;
	getElement('avg-score').textContent = profile.avg_score.toFixed(1).toString();
	getElement('avg-score-bar').style.width = `${Math.round(avg_score * 20)}%`;

	// // Calculate Longest streak
	const streak = profile.longest_streak > 10 ? 10 : profile.longest_streak;
	getElement('longest-streak').textContent = profile.longest_streak.toString();
	getElement('longest-streak-bar').style.width = `${streak * 10}%`;

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

	protectedFetch(apiUrl, {
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
	const bgColor = match.result === 'win' ? 'bg-[#1C232A]' : match.result === 'ongoing' ? 'bg-[#432d1166]' : 'bg-[#77202030]';
	const icon = match.result === 'win' ? thumbsUpSvg : match.result === 'ongoing' ? hourGlassSvg : thumbsDownSvg;
	const date = new Date(match.date).getFullYear() + "-" + (new Date(match.date).getMonth() + 1) + "-" + new Date(match.date).getDate();

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
        <p class="font-semibold ${resultColor}" ${match.result === 'win' ? "data-i18n='match_victory'" : match.result === 'ongoing' ? "data-i18n='match_ongoing'" : "data-i18n='match_defeat'"}>
          
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
	const form = document.getElementById('edit-profile-form') as HTMLFormElement;
	//const form = getDataFromForm("edit-profile-form") ;
	const avatarInputBtn = document.getElementById('change-avatar-btn') as HTMLInputElement;
	//const avatarUrl = (getElement('avatar-input') as HTMLImageElement).src;
	const twoFA = (getElement('toggle-2fa') as HTMLInputElement).checked;

	const formData = new FormData(form);
	const newPassword = formData.get('newPassword') as string;
	if (newPassword && newPassword.length < 10) {
		showToast(languageService.retrieveValue('password_too_short'), '', 'error');
		return;
	}
	if (avatarInputBtn && avatarInputBtn.files?.length) {
		formData.set('avatar', avatarInputBtn.files[0]);
	} else {
		// If no new avatar is selected, we can remove the avatar field from the formData
		formData.delete('avatar');
	}

	formData.append('twoFA', twoFA.toString());
	protectedFetch('/api/user/update', {
		method: 'POST',
		credentials: 'include',
		body: formData,
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
				const avatarImg = getElement('avatar-input') as HTMLImageElement;
				if (avatarImg && avatarImg.dataset.oldsrc) {
					// Remove the old src attribute if it exists
					avatarImg.removeAttribute('data-oldsrc');
				}
			} else {
				showToast(languageService.retrieveValue('toast_profile_update_failed'), response.message, 'error');
				const avatarImg = getElement('avatar-input') as HTMLImageElement;
				if (avatarImg && avatarImg.dataset.oldsrc) {
					avatarImg.src = avatarImg.dataset.oldsrc;
					avatarImg.removeAttribute('data-oldsrc');
				}
			}
			document.getElementById("edit-profile-modal")?.classList.add('hidden');
			resetEditProfileForm();
		}).catch((error) => {
			//revert to old avatar if the update fails
			const avatarImg = getElement('avatar-input') as HTMLImageElement;
			if (avatarImg && avatarImg.dataset.oldsrc) {
				avatarImg.src = avatarImg.dataset.oldsrc;
				avatarImg.removeAttribute('data-oldsrc');
			}
			showToast(languageService.retrieveValue('toast_profile_update_failed'), '', 'error');
			document.getElementById("edit-profile-modal")?.classList.add('hidden');
			resetEditProfileForm();
		});

	// protectedFetch(avatarUrl)
	//   .then(res => res.blob())
	//   .then(blob => {
	//     const reader = new FileReader();
	//     reader.onloadend = () => {
	//       const base64data = reader.result as string;
	//       // Send update to backend
	//       protectedFetch('/api/user/update', {
	//         method: 'POST',
	//         credentials: 'include',
	//         headers: {
	//           'Content-Type': 'application/json'
	//         },
	//         body: JSON.stringify({ ...form, twoFA, avatarUrl: base64data }),
	//       })
	//         .then(res => {
	//           if (res.status === 401) {
	//             window.location.href = '/auth';
	//             return null;
	//           }
	//           return res.json();
	//         })
	//         .then((response) => {
	//           if (response.success) {
	//             renderUserProfile();
	//           }
	//           const modal = new ModalManager("edit-profile-modal");
	//           modal.hide();
	//         });
	//     }
	//     reader.readAsDataURL(blob);
	//   });

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