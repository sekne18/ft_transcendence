import { showToast } from "../utils";
import { Tournament, TournamentMatch, TournamentPlayer } from "./types";

// Current user (mock)
const user = {
    id: 'current-user',
    username: 'CurrentPlayer',
    avatarUrl: 'https://img.heroui.chat/image/avatar?w=200&h=200&u=99',
    stats: {
        wins: 15,
        losses: 5
    }
};

// Initialize tournament state
let tournament: Tournament = {
    id: '1',
    status: 'queuing',
    players: [],
    matches: [],
    maxPlayers: 6
};

// Generate tournament bracket
function generateBracket(players: TournamentPlayer[]): TournamentMatch[] {
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const matches: TournamentMatch[] = [];

    // Determine the number of matches in the first round
    let numFirstRoundMatches = Math.floor(players.length / 2);
    const firstRoundPlayers = shuffledPlayers.slice(0, numFirstRoundMatches * 2);
    let matchCounter = 1;

    for (let i = 0; i < numFirstRoundMatches * 2; i += 2) {
        matches.push({
            id: String(matchCounter++),
            round: 1,
            position: Math.ceil((i + 1) / 2),
            player1: firstRoundPlayers[i],
            player2: firstRoundPlayers[i + 1],
            status: 'pending'
        });
    }

    // Calculate number of players advancing to the next round
    let nextRoundPlayersCount = Math.ceil(players.length / 2);
    let currentRound = 2;
    let positionCounter = 1;

    while (nextRoundPlayersCount > 1) {
        const numMatchesInRound = Math.floor(nextRoundPlayersCount / 2);
        for (let i = 0; i < numMatchesInRound; i++) {
            matches.push({
                id: String(matchCounter++),
                round: currentRound,
                position: positionCounter++,
                status: 'pending'
            });
        }
        nextRoundPlayersCount = Math.ceil(nextRoundPlayersCount / 2);
        currentRound++;
        positionCounter = 1;
    }

    return matches;
}

// Join tournament
function joinTournament(): void {
    const modal = document.getElementById('join-modal');
    if (modal) modal.classList.add('hidden');

    if (tournament.players.some((p: TournamentPlayer) => p.id === user.id)) return;

    const newPlayer: TournamentPlayer = {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl || '',
        level: Math.floor((user.stats.wins || 0) / 5) + 1,
        wins: user.stats.wins || 0,
        losses: user.stats.losses || 0
    };

    tournament.players.push(newPlayer);
    renderTournament();

    if (tournament.players.length === tournament.maxPlayers) {
        tournament.matches = generateBracket(tournament.players);
        tournament.status = 'in_progress';
        showToast("Tournament Starting", "All players have joined. The tournament is beginning!", "success");
        renderTournament(); // Re-render to show the bracket
    }
}

function findMatch(matchId: string): TournamentMatch | undefined {
    return tournament.matches.find(m => m.id === matchId);
}

function findNextMatchToUpdate(match: TournamentMatch): TournamentMatch | undefined {
    const nextRound = match.round + 1;
    const nextPosition = Math.ceil(match.position / 2);
    return tournament.matches.find(m => m.round === nextRound && m.position === nextPosition);
}

function updateNextMatchPlayer(nextMatch: TournamentMatch | undefined, winner: TournamentPlayer): void {
    if (!nextMatch) return;

    if (!nextMatch.player1) {
        nextMatch.player1 = winner;
    } else if (!nextMatch.player2) {
        nextMatch.player2 = winner;
    }
}

// Complete a match (randomly select winner)
function completeMatch(matchId: string): void {
    const match = findMatch(matchId);
    if (!match || match.status !== 'in_progress' || !match.player1 || !match.player2) return;

    const winner = Math.random() > 0.5 ? match.player1 : match.player2;
    const score = `<span class="math-inline">${Math.floor(Math.random() * 3) + 9}-</span>{Math.floor(Math.random() * 8)}`;

    match.winner = winner;
    match.score = score;
    match.status = 'completed';

    const nextMatch = findNextMatchToUpdate(match);
    updateNextMatchPlayer(nextMatch, winner);

    // Check if tournament is completed
    if (tournament.matches.filter(m => m.round === Math.max(...tournament.matches.map(m => m.round)) && m.winner).length === 1) {
        tournament.status = 'completed';
        showToast("Tournament Completed", `${tournament.matches.find(m => m.round === Math.max(...tournament.matches.map(m => m.round)))!.winner!.username} has won the tournament!`, "success");
    }

    renderTournament();
}

// Start a match
function startMatch(matchId: string): void {
    const match = findMatch(matchId);
    if (!match || match.status !== 'pending' || !match.player1 || !match.player2) return;

    match.status = 'in_progress';
    renderTournament();

    setTimeout(() => {
        completeMatch(matchId);
    }, 3000);
}

// Render the tournament UI
function renderTournament(): void {
    renderHeader();
    const contentEl = document.getElementById('tournament-content');
    if (!contentEl) return;
    contentEl.innerHTML = '';

    if (tournament.status === 'queuing') {
        contentEl.appendChild(renderQueueingState());
    } else {
        contentEl.appendChild(renderBracketTree());
    }
}

// Render tournament header
function renderHeader(): void {
    const headerEl = document.getElementById('tournament-header');
    if (!headerEl) return;
    headerEl.innerHTML = '';

    const title = document.createElement('h1');
    title.className = 'text-2xl font-bold';
    title.textContent = 'Tournament';

    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-500';
    subtitle.textContent = 'Compete in 6-player tournaments';

    const headerInfo = document.createElement('div');
    headerInfo.appendChild(title);
    headerInfo.appendChild(subtitle);

    const joinBtnContainer = document.createElement('div');
    if (tournament.status === 'queuing' && !tournament.players.some((p: TournamentPlayer) => p.id === user.id)) {
        const joinButton = document.createElement('button');
        joinButton.id = 'join-button';
        joinButton.className = 'bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2';
        joinButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
          Join Tournament
        `;
        joinButton.addEventListener('click', openJoinModal);
        joinBtnContainer.appendChild(joinButton);
    }

    headerEl.className = 'mb-8 flex justify-between items-center';
    headerEl.appendChild(headerInfo);
    headerEl.appendChild(joinBtnContainer);

    const statusBadgeContainer = document.getElementById('tournament-status-container');
    if (statusBadgeContainer) {
        statusBadgeContainer.innerHTML = '';

        const statusBadge = document.createElement('span');
        statusBadge.id = 'tournament-status';
        statusBadge.className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tournament.status === 'queuing' ? 'bg-yellow-100 text-yellow-800' :
            tournament.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
            }`;
        statusBadge.textContent = tournament.status === 'queuing' ? 'Queuing' :
            tournament.status === 'in_progress' ? 'In Progress' :
                'Completed';
        statusBadgeContainer.appendChild(statusBadge);
    }
}

function renderPlayerInfo(player: TournamentPlayer | undefined): string {
    if (!player) {
        return `<div class="text-gray-500">TBD</div>`;
    }
    return `
        <div class="flex items-center gap-2">
            <img src="${player.avatarUrl}" alt="${player.username}" class="w-6 h-6 rounded-full">
            <span class="text-sm font-semibold">${player.username}</span>
        </div>
    `;
}

function renderMatchCardTree(match: TournamentMatch): string {
    const winnerClass = match.winner ? 'bg-green-900 border-green-500' : 'bg-[#272735] border-[#3A3A49]';
    return `
        <div class="rounded-md border ${winnerClass} p-2 w-52 text-white flex flex-col justify-between h-32">
            <div>
                <div class="flex justify-between items-center">
                    <span class="math-inline">${renderPlayerInfo(match.player1)}
<span class="text-xs"></span>${match.score?.split('-')[0] || ''}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="math-inline">${renderPlayerInfo(match.player2)}
<span class="text-xs"></span>${match.score?.split('-')[1] || ''}</span>
                </div>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-right text-xs text-gray-400">${match.status.replace('_', ' ')}</span>
                ${match.status === 'pending' && match.player1 && match.player2 ? `
                    <button
                        class="start-match-btn bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1 justify-center"
                        data-match-id="${match.id}"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        Spectate
                    </button>
                ` : ''}
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
                ${matches.map(match => `
                    <div class="flex flex-col items-center gap-y-2">
                        ${renderMatchCardTree(match)}
                    </div>
                `).join('')}
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

    // Add event listeners for start match buttons
    setTimeout(() => { // Ensure buttons are rendered before attaching listeners
        document.querySelectorAll('.start-match-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const matchId = (e.currentTarget as HTMLElement).getAttribute('data-match-id');
                if (matchId) {
                    startMatch(matchId);
                }
            });
        });
    }, 100);

    return bracketDiv;
}

// Render queuing state
function renderQueueingState(): HTMLDivElement {
    const queueingDiv = document.createElement('div');
    queueingDiv.className = 'space-y-6';

    const progressDiv = document.createElement('div');
    const progressText = document.createElement('div');
    progressText.className = 'flex justify-between mb-2';
    progressText.innerHTML = `
      <span class="text-gray-500">Players Joined</span>
      <span class="font-semibold"><span class="math-inline">${tournament.players.length}/</span>${tournament.maxPlayers}</span>
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
                <img src="${player.avatarUrl}" alt="{player.username}" class="w-10 h-10 rounded-full">
                <div>
                  <p class="font-semibold text-white">${player.username}</p>
                  <p class="text-gray-400 text-sm">Level ${player.level}</p>
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

// Open join modal
function openJoinModal(): void {
    const modal = document.getElementById('join-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }

    const modalAvatar = document.getElementById('modal-avatar') as HTMLImageElement | null;
    const modalUsername = document.getElementById('modal-username');
    const modalLevel = document.getElementById('modal-level');
    const modalWins = document.getElementById('modal-wins');
    const modalLosses = document.getElementById('modal-losses');

    if (modalAvatar && user.avatarUrl) {
        modalAvatar.src = user.avatarUrl;
    }
    if (modalUsername) {
        modalUsername.textContent = user.username;
    }
    if (modalLevel) {
        modalLevel.textContent = `Level ${Math.floor((user.stats.wins || 0) / 5) + 1}`;
    }
    if (modalWins) {
        modalWins.textContent = user.stats.wins?.toString() || '0';
    }
    if (modalLosses) {
        modalLosses.textContent = user.stats.losses?.toString() || '0';
    }
}

// Close join modal
function closeJoinModal(): void {
    const modal = document.getElementById('join-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Initialize the tournament
export function initTournament(): void {
    renderTournament();
    document.getElementById('modal-close-btn')?.addEventListener('click', closeJoinModal);
    document.getElementById('join-tournament-btn')?.addEventListener('click', joinTournament);
    document.getElementById('modal-cancel-btn')?.addEventListener('click', closeJoinModal);
}