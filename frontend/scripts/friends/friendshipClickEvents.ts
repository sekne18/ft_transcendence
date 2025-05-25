import { chatManager } from "../chat/chat";
import { languageService } from "../i18n";
import { loadContent } from "../router/router";
import { showToast, protectedFetch } from "../utils";

export function onProfileClick() {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.user-profile-btn');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.dataset.userId;
            if (userId) {
                loadContent(`/profile/${userId}`);
            }
        });
    });
}

export function onRemoveFriendClick() {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.remove-friend-btn');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.dataset.userId;
            if (userId) {
                protectedFetch(`/api/friends/decline-request`, { // API name might confuse you, but behaves the same as remove friend
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ otherId: userId }),
                }).then(res => {
                    if (res.status === 200) {
                        showToast(languageService.retrieveValue('toast_friend_removed'), '', 'success');
                        loadContent('/friends');
                    } else {
                        showToast(languageService.retrieveValue('toast_failed_friend_rm'), '', 'error');
                    }
                });
            }
        });
    });
}

export function onAddFriendClick() {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.add-friend-btn');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.dataset.userId;
            if (userId) {
                protectedFetch(`/api/friends/send-friend-request`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ otherId: userId }),
                }).then(res => {
                    if (res.status === 200) {
                        showToast(languageService.retrieveValue('toast_req_sent'), '', 'success');
                        loadContent('/friends');
                    } else {
                        showToast(languageService.retrieveValue('toast_req_failed_sent'), '', 'error');
                    }
                });
            }
        });
    });
}

export function onAcceptFriendRequestClick() {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.accept-friend-request-btn');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.dataset.userId;
            if (userId) {
                protectedFetch(`/api/friends/accept-request`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ otherId: userId }),
                }).then(res => {
                    if (res.status === 200) {
                        showToast(languageService.retrieveValue('toast_req_accepted'), '', 'success');
                        loadContent('/friends');
                    } else {
                        showToast(languageService.retrieveValue('toast_req_failed_accepted'), '', 'error');
                    }
                });
            }
        });
    });
}

export function onBlockFriendClick() {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.block-friend-btn');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.dataset.userId;
            if (userId) {
                protectedFetch(`/api/friends/block`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ otherId: userId }),
                }).then(res => {
                    chatManager?.handleChatToggle(false);
                    if (res.status === 200) {
                        showToast(languageService.retrieveValue('toast_block_user'), '', 'success');
                        loadContent('/friends');
                    } else {
                        showToast(languageService.retrieveValue('toast_failed_block_user'), '', 'error');
                    }
                });
            }
        });
    });
}

export function onUnblockFriendClick() {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.unblock-friend-btn');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.dataset.userId;
            if (userId) {
                protectedFetch(`/api/friends/unblock`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ otherId: userId }),
                }).then(res => {
                    chatManager?.handleChatToggle(false);
                    if (res.status === 200) {
                        showToast(languageService.retrieveValue('toast_unblock_user'), '', 'success');
                        loadContent('/friends');
                    } else {
                        showToast(languageService.retrieveValue('toast_failed_unblock_user'), '', 'error');
                    }
                });
            }
        });
    });
}