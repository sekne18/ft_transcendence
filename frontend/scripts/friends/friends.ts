import { renderFriendslist } from "./friendsList";
import { protectedFetch } from '../utils';

export function initFriends() {
    getData('/api/friends/all');
    setupTabs();
}

function setupTabs(): void {
    const friendslist_nav_buttons = document.querySelectorAll<HTMLButtonElement>('#tabs button');
    const friendslist_search_bar = document.querySelector<HTMLInputElement>('#friends_search');

    let activeTab: string = 'all_friends';

    friendslist_search_bar?.addEventListener('input', () => {
        const searchVal = encodeURIComponent(friendslist_search_bar.value);

        if (activeTab === 'all_friends') {
            getData('/api/friends/all?name=' + searchVal);
        } else if (activeTab === 'online') {
            getData('/api/friends/online?name=' + searchVal);
        } else if (activeTab === 'pending') {
            getData('/api/friends/pending?name=' + searchVal);
        } else if (activeTab === 'blocked') {
            getData('/api/friends/blocked?name=' + searchVal);
        }
    })


    friendslist_nav_buttons.forEach((button) => {

        button.addEventListener('click', () => {
            friendslist_nav_buttons.forEach((btn) => {
                btn.classList.remove('bg-gray-600', 'bg-green-600', 'bg-yellow-600', 'bg-red-600', 'text-white');
                btn.classList.add('text-gray-500', 'dark:text-gray-300');
            });

            const tab = button.getAttribute('data-tab');
            if (!tab)
                return;
            activeTab = tab;

            if (tab === 'all_friends') {
                getData("/api/friends/all?name=");
                button.classList.add('bg-gray-600');
            } else if (tab === 'online') {
                getData('/api/friends/online?name=');
                button.classList.add('bg-green-600');
            } else if (tab === 'pending') {
                getData('/api/friends/pending?name=');
                button.classList.add('bg-yellow-600');
            } else if (tab === 'blocked') {
                getData('/api/friends/blocked?name=');
                button.classList.add('bg-red-600');
            }

            button.classList.remove('text-gray-500', 'dark:text-gray-300');
            button.classList.add('text-white');
        });
    });
    document.querySelector<HTMLButtonElement>('#tabs button[data-tab="all_friends"]')?.click();
}

async function getData(where: string): Promise<void> {
    protectedFetch(where, {
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
            //("response failed");
        }
        else {
            renderFriendslist(response.friendsList, response.isFriends, response.type);
        }
    });
}