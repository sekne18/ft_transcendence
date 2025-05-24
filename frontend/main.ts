import './styles.css'
import { initRouter } from './scripts/router/router';
import { setEventHandlers } from './scripts/navbar/navbar';
import { initChat } from './scripts/chat/chat';
import { protectedFetch } from './scripts/utils';

// Initial page load
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('auth-ready', async () => {
        // Set avatar
        protectedFetch("/api/user", {
            method: "GET",
            credentials: "include"
        }).then((response) => {
            if (response.ok) {
                response.json().then((data) => {
                    const avatar = document.getElementById("user-avatar") as HTMLImageElement;
                    const user = data.user;
                    avatar.src = user.avatar_url;
                    avatar.alt = user.display_name;
                });
            } else {
                console.error("Failed to fetch user data");
            }
        });
        initChat();
    });
    initRouter();
    setEventHandlers();
});