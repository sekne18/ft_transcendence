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

export async function initRouter() {
    let path = window.location.pathname;

    const protectedRoutes = ['/', '/game', '/leaderboard', '/chat', '/profile'];
    const isProtected = protectedRoutes.includes(path);

    if (isProtected) {
        const isAuthed = await checkAuth();
        if (!isAuthed) {
            path = '/auth';
            history.replaceState(null, '', path);
        }
    }

    loadContent(path);

    document.addEventListener('click', async (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('nav-link')) {
            e.preventDefault();
            const url = target.getAttribute('href');
            if (!url) return;

            const isProtected = protectedRoutes.includes(url);
            if (isProtected && !(await checkAuth())) {
                history.pushState(null, '', '/auth');
                loadContent('/auth');
                updateActiveLink('/auth');
                return;
            }

            history.pushState(null, '', url);
            loadContent(url);
            updateActiveLink(url);
        }
    });

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

async function checkAuth(): Promise<boolean> {
    try {
        const res = await fetch('/api/auth/status',
            {
                method: 'GET',
                credentials: 'include'
            }
        );
        if (!res.ok) throw new Error('Access token expired');
        const data = await res.json();
        return data.success;
    } catch (err) {
        const refreshRes = await fetch('/api/token/refresh', {
            method: 'POST',
            credentials: 'include'
        });

        if (!refreshRes.ok) {
            console.error('Failed to refresh token:', refreshRes.statusText);
            return false;
        }

        const res = await fetch('/api/auth/status', { credentials: 'include' });
        return res.ok;
    }
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

