import { initAuth } from "../auth/auth";
import { initFriends } from "../friends/friends";
import { initGame, exitGame } from "../game/game";
import { languageService } from "../i18n";
import { initLeaderboard } from "../leaderboard/leaderboard";
import { initProfile } from "../profile/profile";
import { initTournament } from "../tournament/tournament";

// router.ts
const routes: Record<string, { file: string; init?: () => void, exit?: () => void }> = {
    '/': { file: 'pages/game.html', init: initGame, exit: exitGame },
    '/game': { file: 'pages/game.html', init: initGame, exit: exitGame },
    '/leaderboard': { file: 'pages/leaderboard.html', init: initLeaderboard },
    '/tournament': { file: 'pages/tournament.html', init: initTournament },
    '/auth': { file: 'pages/auth.html', init: initAuth },
    '/friends': { file: 'pages/friends.html', init: initFriends },
    '/profile': { file: 'pages/profile.html', init: initProfile }
};

let currRoute = '/';

export async function initRouter() {
    let path = window.location.pathname;

    const protectedRoutes = ['/game', '/leaderboard', '/tournament', '/friends', '/profile'];
    const isProtected = protectedRoutes.some((route) => path.includes(route)) || path === '/';

    if (isProtected) {
        const isAuthed = await checkAuth();
        if (!isAuthed) {
            path = '/auth';
            history.replaceState(null, '', path);
        } else {
            document.dispatchEvent(new Event('auth-ready'));
        }
    }

    loadContent(path);

    console.log('Router initialized', window.location.pathname);

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
            document.dispatchEvent(new Event('auth-ready'));
            loadContent(url);
            updateActiveLink(url);
        }
    });

    window.addEventListener('popstate', () => {
        loadContent(window.location.pathname);
        updateActiveLink(window.location.pathname);
    });
}


export async function loadContent(url: string, ignoreScripts: boolean = false) {
    if (currRoute && routes[currRoute]?.exit) {
        routes[currRoute].exit();
    }
    const appElement = document.getElementById('app');
    if (appElement) {
        appElement.innerHTML = '<div class="loading">Loading...</div>';
    }

    if (url.startsWith('/uploads') || url.startsWith('/api')) {
        return;
    }

    const staticRoute = routes[url];
    if (staticRoute) {
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
                    if (!ignoreScripts)
                        routes[url].init?.();
                    languageService.init();
                }
            })
            .catch(err => {
                if (appElement) {
                    appElement.innerHTML = '<h2>Error Loading Page</h2><p><a href="/">Return to Home</a></p>';
                }
            });
    } else if (url.startsWith('/profile/')) {
        history.pushState(null, '', '/profile');
        fetch(routes['/profile'].file)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.text();
            })
            .then(html => {
                if (appElement) {
                    appElement.innerHTML = html;
                    const userId: number = Number(url.split('/')[2]);
                    (routes['/profile'].init as (userId?: number) => void)?.(userId);
                    languageService.init();
                }
            });
    } else {
        if (appElement) {
            appElement.innerHTML = '<h2>Page Not Found</h2><p><a href="/">Return to Home</a></p>';
        }
    }
}

export async function checkAuth(): Promise<boolean> {
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
    const mobileMenu = document.getElementById('mobile-menu') as HTMLDivElement;

    mobileMenu?.classList.toggle("hidden");
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        const isActive = href === url;

        link.classList.toggle('active-nav-link', isActive);
        link.classList.toggle('bg-blue-500', isActive);
        link.classList.toggle('hover:text-blue-500', !isActive);

        (link as HTMLElement).style.fontWeight = isActive ? 'bold' : 'normal';
    });
}