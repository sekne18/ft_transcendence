import { initAuth } from "../auth/auth";
import { initChat } from "../chat/chat";
import { initGame } from "../game/game";
import { languageService } from "../i18n";
import { initLeaderboard } from "../leaderboard/leaderboard";
import { initProfile } from "../profile/profile";

// router.ts
const routes: Record<string, { file: string; init?: () => void }> = {
    '/': { file: 'pages/game.html', init: initGame },
    '/game': { file: 'pages/game.html', init: initGame },
    '/leaderboard': { file: 'pages/leaderboard.html', init: initLeaderboard },
    '/chat': { file: 'pages/chat.html', init: initChat },
    '/auth': { file: 'pages/auth.html', init: initAuth },
    '/profile': { file: 'pages/profile.html', init: initProfile }
};

export function initRouter() {
    // Initial content load
    let path = window.location.pathname;
    const userIsAuthed = isAuthenticated();
    const isAuthPage = path === "/auth";

    if (!userIsAuthed && !isAuthPage) {
        path = "/auth";
        history.replaceState(null, '', path);
    } else if (userIsAuthed && isAuthPage) {
        path = "/";
        history.replaceState(null, '', path);
    } else if (!routes[path]) {
        path = '/';
        history.replaceState(null, '', path);
    }

    loadContent(path);

    // Navigation clicks
    document.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('nav-link')) {
            e.preventDefault();
            const url = target.getAttribute('href');
            if (!url) return;

            history.pushState(null, '', url);
            loadContent(url);
            updateActiveLink(url);
        }
    });

    // Back/forward buttons
    window.addEventListener('popstate', () => {
        loadContent(window.location.pathname);
        updateActiveLink(window.location.pathname);
    });
}

export function loadContent(url: string) {
    const appElement = document.getElementById('app');
    if (appElement) {
        appElement.innerHTML = '<div class="loading">Loading...</div>';
    }

    if (routes[url]) {
        fetch(routes[url].file)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.text();
            })
            .then(html => {
                if (appElement) {
                    appElement.innerHTML = html;
                    if (url === '/auth') {
                        appElement.classList.add("absolute", "top-0", "bg-[#0F0F13]", "w-full", "h-full");
                    } else {
                        appElement.classList.remove("absolute", "top-0", "bg-[#0F0F13]", "w-full");
                    }
                    routes[url].init?.();
                    languageService.init();
                }
            })
            .catch(err => {
                console.error('Error loading page:', err);
                if (appElement) {
                    appElement.innerHTML = '<h2>Error Loading Page</h2><p><a href="/">Return to Home</a></p>';
                }
            });
    } else {
        if (appElement) {
            appElement.innerHTML = '<h2>Page Not Found</h2><p><a href="/">Return to Home</a></p>';
        }
    }
}

export function isAuthenticated(): boolean {
    return !!localStorage.getItem("userId");
}

function updateActiveLink(url: string) {
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        const isActive = href === url;

        link.classList.toggle('active-nav-link', isActive);
        link.classList.toggle('bg-blue-500', isActive);
        link.classList.toggle('hover:text-blue-500', !isActive);

        (link as HTMLElement).style.fontWeight = isActive ? 'bold' : 'normal';
    });
}

