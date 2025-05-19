import { loadContent } from "../router/router";
import { showToast } from "../utils";

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
                fetch(`/api/friends/decline-request`, { // API name might confuse you, but behaves the same as remove friend
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ otherId: userId }),
                }).then(res => {
                    if (res.status === 200) {
                        showToast("Friend removed", '', 'success');
                        loadContent('/friends');
                    } else {
                        showToast("Failed to remove friend", '', 'error');
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
                fetch(`/api/friends/send-friend-request`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ otherId: userId }),
                }).then(res => {
                    if (res.status === 200) {
                        showToast("Friend request sent", '', 'success');
                        loadContent('/friends');
                    } else {
                        showToast("Failed to add friend", '', 'error');
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
                fetch(`/api/friends/accept-request`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ otherId: userId }),
                }).then(res => {
                    if (res.status === 200) {
                        showToast("Friend request accepted", '', 'success');
                        loadContent('/friends');
                    } else {
                        showToast("Failed to accept friend request", '', 'error');
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
                fetch(`/api/friends/block`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ otherId: userId }),
                }).then(res => {
                    if (res.status === 200) {
                        showToast("Friend blocked", '', 'success');
                        loadContent('/friends');
                    } else {
                        showToast("Failed to block friend", '', 'error');
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
                fetch(`/api/friends/unblock`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ otherId: userId }),
                }).then(res => {
                    if (res.status === 200) {
                        showToast("Friend unblocked", '', 'success');
                        loadContent('/friends');
                    } else {
                        showToast("Failed to block friend", '', 'error');
                    }
                });
            }
        });
    });
}