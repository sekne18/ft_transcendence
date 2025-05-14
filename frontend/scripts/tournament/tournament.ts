import { GameEngine } from "../game/GameEngine";
import { GameParams, wsMsg, WsParams } from "../game/GameTypes";
import { Profile } from "../profile/Types";
import { loadContent } from "../router/router";
import { showToast } from "../utils";
import { TournamentManager } from "./TournamentManager";
import { Tournament, TournamentMatch } from "./types";


// Mock current user (consider fetching this dynamically)
let user: Profile;

// Initialize tournament state
let tournament: Tournament = {
    id: '1',
    status: 'queuing',
    players: [],
    matches: [],
    maxPlayers: 2
};

// --- Modal Logic ---
function openJoinModal(): void {
    const modal = document.getElementById('join-modal');
    const modalAvatar = document.getElementById('modal-avatar') as HTMLImageElement | null;
    const modalUsername = document.getElementById('modal-username');
    const modalLevel = document.getElementById('modal-level');
    const modalWins = document.getElementById('modal-wins');
    const modalLosses = document.getElementById('modal-losses');


    if (modal) {
        modal.classList.remove('hidden');
    }
    if (modalAvatar && user.avatar_url) {
        modalAvatar.src = user.avatar_url;
    }
    if (modalUsername) {
        modalUsername.textContent = user.username;
    }
    if (modalWins) {
        modalWins.textContent = user.wins?.toString() || '0';
    }
    if (modalLosses) {
        modalLosses.textContent = user.losses?.toString() || '0';
    }
}

function closeJoinModal(): void {
    const modal = document.getElementById('join-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// --- Tournament Logic ---
function joinTournament(): void {
    tournamentConnection.joinTournament(user);
    const modal = document.getElementById('join-modal');
    if (modal) modal.classList.add('hidden');
    renderTournament();
}

function leaveTournament(): void {
    tournamentConnection.sendMessage('leave_tournament', {});
    tournament.players = tournament.players.filter(p => p.id !== user.id);
    tournament.status = 'queuing';
    tournament.matches = [];
    renderTournament();
}

function ensureCanvasAndInitGameEngine(matchId: number, gameFoundData: any /* data from server's game_found event */): Promise<GameEngine | null> {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
            if (canvas) {
                clearInterval(interval);
                // Now call the function that creates the GameEngine
                createGameEngineForTournament(matchId, gameParamsFromServerOrLocal, canvas, gameFoundData)
                    .then(gameEngine => resolve(gameEngine));
            }
        }, 100);
    });
}

const handleServerUpdate = (data: any): void => {
    if (data.type === "game_data" && data.matchId && data.payload) {
        const matchIdNum = Number(data.matchId);
        let gameEngine = activeTournamentGameEngines.get(matchIdNum);

        const gamePayload = data.payload as wsMsg; // Cast to your shared wsMsg type

        if (!gameEngine) {
            // If GameEngine doesn't exist, and this is the 'game_found' event, we need to create it.
            if (gamePayload.type === "game_event" && gamePayload.data.event === "game_found") {
                const gameFoundData = gamePayload.data as {
                    event: "game_found";
                    side: "left" | "right";
                    enemy_id: number;
                };
                const opponentDetails = tournament.players.find(p => p.id === gameFoundData.enemy_id);
                showToast("Match Found!", `You are playing against ${opponentDetails?.username || 'Opponent'} for match ${matchIdNum}`, "success");

                // Navigate to the game page/view
                loadContent('/game', true);

                // Wait for canvas, then create GameEngine
                ensureCanvasAndInitGameEngine(matchIdNum, gameFoundData);
            } else if (gamePayload.type !== "game_event" || gamePayload.data.event !== "game_found") {
                console.warn(`[Frontend] Received game data for match ${matchIdNum}, but no GameEngine instance found and not a game_found event. Payload:`, gamePayload);
            }
        }
        return;
    }

    switch (data.type) {
        case "tournament_started":
            console.log("Tournament started:", data);
            tournament.status = "in_progress";
            tournament.matches = data.matches;
            renderTournament();
            break;
        case "queue_updated":
            tournament.players = data.players as Profile[];
            // const updatedQueuePlayers = data.players as Profile[];
            // if (data.players.length > 0) // is not null
            //     tournament.players = updatedQueuePlayers;
            renderTournament();
            break;
        case "match_updated":
            console.log("Match updated (tournament level):", data);
            const updatedMatchData = { ...data.match, id: Number(data.match.id) };
            const matchIndex = tournament.matches.findIndex(m => m.id === updatedMatchData.id);
            if (matchIndex > -1) {
                tournament.matches[matchIndex] = { ...tournament.matches[matchIndex], ...updatedMatchData };
            } else {
                tournament.matches.push(updatedMatchData);
            }
            renderTournament();
            break;
        case "round_updated":
            console.log("Round updated:", data);
            tournament.matches = data.matches;
            renderTournament();
            break;
        case "tournament_finished":
            console.log("Tournament finished:", data);
            tournament.status = "completed";
            if (data.winner) {
                showToast("Tournament Over", `Winner: ${data.winner.username}`, "success");
            } else {
                showToast("Tournament Over", "The tournament has concluded.", "info");
            }
            if (data.matches) tournament.matches = data.matches;
            renderTournament();
            activeTournamentGameEngines.clear();
            break;
        default:
            console.log("Unknown tournament-level event type:", data.type, data);
    }
};

async function createGameEngineForTournament(
    matchId: number,
    gameParams: GameParams, // These params should ideally come from server or be fixed client-side
    canvas: HTMLCanvasElement,
    gameFoundData: { side: 'left' | 'right', enemy_id: number, matchId: number }
): Promise<GameEngine | null> {
    if (!tournamentConnection || !tournamentConnection.getSocket()) {
        showToast("Error", "Tournament connection lost. Cannot start game.", "error");
        return null;
    }

    if (activeTournamentGameEngines.has(matchId)) {
        console.warn(`[Frontend] GameEngine for match ${matchId} already exists. Disposing old one.`);
        activeTournamentGameEngines.delete(matchId);
    }

    // These are parameters for the GameEngine constructor and GameConnection
    const wsParams: WsParams = {
        url: '', // URL not used by GameConnection when an existing socket is provided
        isTournament: true,
        matchId: matchId // Essential for GameConnection if it needs to tag outgoing messages
    };

    const renderDetails = {
        ball_color: "white",
        paddle_color: "yellow",
        arena_color: "black",
        max_canvas_width: 2000,
        canvas_margin: 32
    };

    const gameEngine = new GameEngine(
        canvas,
        gameParams,
        renderDetails,
        wsParams,
        tournamentConnection.getSocket()
    );
    activeTournamentGameEngines.set(matchId, gameEngine);
    gameEngine.getGame().connect();
    return gameEngine;

}

// --- Rendering Logic ---
function renderPlayerInfo(player: Profile | undefined): string {
    if (!player) {
        return `<div class="text-gray-500">TBD</div>`;
    }
    return `
        <div class="flex items-center gap-2">
            <img src="${player.avatar_url}" alt="${player.username}" class="w-6 h-6 rounded-full">
            <span class="text-sm font-semibold">${player.username}</span>
        </div>
    `;
}

function renderMatchCardTree(match: TournamentMatch): string {
    console.log('Rendering match card:', match);
    // const winnerClass = match.winner ? 'bg-green-900 border-green-500' : 'bg-[#272735] border-[#3A3A49]';
    return `
        <div class="rounded-md border bg-[#ffc038] border-[#d49204] p-2 w-52 text-white flex flex-col justify-between h-32">
            <div>
                <div class="flex justify-between items-center">
                    <span>${renderPlayerInfo(match.player1)} <span class="text-xs">${match.score?.split('-')[0] || ''}</span></span>
                </div>
                <div class="flex justify-between items-center">
                    <span>${renderPlayerInfo(match.player2)} <span class="text-xs">${match.score?.split('-')[1] || ''}</span></span>
                </div>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-right text-xs text-gray-400">${match.status.replace('_', ' ')}</span>
                ${match.status === 'pending' && match.player1 && match.player2 && !tournament.players.some(p => p.id === user.id) ?
            `<button class="text-indigo-500 hover:text-indigo-400 text-xs" onclick="requestSpectate('${match.id}')">Spectate</button>` : ''
        }
            </div>
        </div>
    `;
}

function renderRoundTree(matches: TournamentMatch[], roundNumber: number): string {
    const justifyContentClass = matches.length === 1 ? 'justify-center' : 'justify-around';
    return `
        <div class="flex flex-col items-center ${justifyContentClass} gap-y-4">
            <h4 class="text-lg font-semibold mb-2">Round ${roundNumber}</h4>
            <div class="flex ${justifyContentClass} gap-x-8">
                ${matches.map(match => renderMatchCardTree(match)).join('')}
            </div>
        </div>
    `;
}

function renderBracketTree(): HTMLDivElement {
    const bracketDiv = document.createElement('div');
    bracketDiv.className = 'flex flex-col items-center gap-y-12';
    const rounds = Array.from(new Set(tournament.matches.map(m => m.round))).sort((a, b) => a - b);

    rounds.forEach(roundNumber => {
        const matchesInRound = tournament.matches.filter(match => match.round === roundNumber);
        if (matchesInRound.length > 0) {
            bracketDiv.innerHTML += renderRoundTree(matchesInRound, roundNumber);
        }
    });

    return bracketDiv;
}

function renderQueueingState(): HTMLDivElement {
    const queueingDiv = document.createElement('div');
    queueingDiv.className = 'space-y-6';

    const progressDiv = document.createElement('div');
    const progressText = document.createElement('div');
    progressText.className = 'flex justify-between mb-2';
    progressText.innerHTML = `
        <span class="text-gray-500">Players Joined</span>
        <span class="font-semibold">${tournament.players.length}/${tournament.maxPlayers}</span>
    `;
    const progressBarBg = document.createElement('div');
    progressBarBg.className = 'relative h-2 bg-gray-200 rounded-full overflow-hidden';
    const progressBarFill = document.createElement('div');
    progressBarFill.className = 'absolute top-0 left-0 h-full bg-indigo-600';
    progressBarFill.style.width = `${(tournament.players.length / tournament.maxPlayers) * 100}%`;
    progressBarBg.appendChild(progressBarFill);
    progressDiv.appendChild(progressText);
    progressDiv.appendChild(progressBarBg);
    queueingDiv.appendChild(progressDiv);

    const playersListGrid = document.createElement('div');
    playersListGrid.id = 'players-list';
    playersListGrid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4';
    for (let i = 0; i < tournament.maxPlayers; i++) {
        const playerCard = document.createElement('div');
        playerCard.className = `bg-[#272735] rounded-xl p-4 ${i < tournament.players.length ? 'border border-indigo-500' : 'border border-dashed border-[#3A3A49]'}`;
        if (i < tournament.players.length) {
            const player = tournament.players[i];
            playerCard.innerHTML = `
                <div class="flex items-center gap-3">
                    <img src="${player.avatar_url}" alt="${player.username}" class="w-10 h-10 rounded-full">
                    <div>
                        <p class="font-semibold text-white">${player.username}</p>
                        <!-- <p class="text-gray-400 text-sm">Level ${player.wins}</p> -->
                    </div>
                </div>
            `;
        } else {
            playerCard.innerHTML = `
                <div class="flex items-center justify-center h-16 text-gray-500">
                    Waiting for player...
                </div>
            `;
        }
        playersListGrid.appendChild(playerCard);
    }
    queueingDiv.appendChild(playersListGrid);

    return queueingDiv;
}

function renderHeader(): HTMLDivElement {
    const headerEl = document.createElement('div');
    headerEl.id = 'tournament-header';
    const title = document.createElement('h1');
    title.className = 'text-2xl font-bold';
    title.textContent = 'Tournament';
    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-500';
    subtitle.textContent = 'Compete in 6-player tournaments';
    const headerInfo = document.createElement('div');
    headerInfo.appendChild(title);
    headerInfo.appendChild(subtitle);
    const headerActions = document.createElement('div');
    if (tournament.status === 'queuing' && !tournament.players.some((p: Profile) => p.id === user.id)) {
        const joinButton = document.createElement('button');
        joinButton.id = 'join-button';
        joinButton.className = 'bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mr-2';
        joinButton.innerHTML = `Join Tournament`;
        joinButton.addEventListener('click', openJoinModal);
        headerActions.appendChild(joinButton);
    } else if (tournament.status === 'queuing' && tournament.players.some((p: Profile) => p.id === user.id)) {
        const leaveButton = document.createElement('button');
        leaveButton.className = 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg mr-2';
        leaveButton.textContent = 'Leave Queue';
        leaveButton.addEventListener('click', leaveTournament);
        headerActions.appendChild(leaveButton);
    }
    headerEl.className = 'mb-8 flex justify-between items-center';
    headerEl.appendChild(headerInfo);
    headerEl.appendChild(headerActions);

    const statusBadgeContainer = document.getElementById('tournament-status-container');
    if (statusBadgeContainer) {
        statusBadgeContainer.innerHTML = '';

        const statusBadge = document.createElement('span');
        statusBadge.id = 'tournament-status';
        statusBadge.className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tournament.status === 'queuing' ? 'bg-yellow-100 text-yellow-800' :
            tournament.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
            }`;
        statusBadge.textContent =
            tournament.status === 'queuing' ? 'Queuing' :
                tournament.status === 'in_progress' ? 'In Progress' :
                    'Completed';
        statusBadgeContainer.appendChild(statusBadge);
    }
    return headerEl;
}

function renderTournament(): void {
    renderHeader();
    const contentEl = document.getElementById('tournament-content');
    if (!contentEl) return;
    contentEl.innerHTML = '';
    console.log('Rendering tournament state:', tournament);
    if (tournament.status === 'queuing') {
        contentEl.appendChild(renderQueueingState());
    } else {
        contentEl.appendChild(renderBracketTree());
    }
}

// --- Initialization ---
export function initTournament(): void {
    // Establish WebSocket connection


    fetch('/api/user').then(res => res.json()).then(data => {
        const tournamentConnection = new TournamentManager(data.user.id);
    }
    ).catch(err => {
        console.error('Error fetching user data:', err);
        showToast("Error", "Could not initialize tournament data.", "error");
    });

    // Add event listeners for modal
    document.getElementById('modal-close-btn')?.addEventListener('click', closeJoinModal);
    document.getElementById('join-tournament-btn')?.addEventListener('click', joinTournament);
    document.getElementById('modal-cancel-btn')?.addEventListener('click', closeJoinModal);
}

