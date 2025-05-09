import { Tournament, TournamentPlayer } from "./types";


export function initTournament() {
    const joinButton = document.getElementById('join-button') as HTMLButtonElement;
    
    joinButton.addEventListener('click', joinTournament);
    renderPlayers();
}

let tournament: Tournament = {
    id: '1',
    status: 'queuing',
    players: [],
    maxPlayers: 6
};

function renderPlayers() {
    const playersList = document.getElementById('players-list') as HTMLElement;
    playersList.innerHTML = '';

    for (let i = 0; i < tournament.maxPlayers; i++) {
        const card = document.createElement('div');
        card.className = 'bg-[#1E1E2A] p-4 rounded-xl shadow';

        if (i < tournament.players.length) {
            const player = tournament.players[i];
            card.innerHTML = `
          <div class="flex items-center gap-3">
            <img src="${player.avatarUrl}" alt="${player.username}" class="w-12 h-12 rounded-full">
            <div>
              <p class="font-semibold">${player.username}</p>
              <p class="text-[#A1A1AA] text-sm">Level ${player.level}</p>
            </div>
          </div>
        `;
        } else {
            card.innerHTML = '<p class="text-[#A1A1AA] text-center">Waiting for player...</p>';
        }

        playersList.appendChild(card);
    }
}

function joinTournament() {
    const newPlayer: TournamentPlayer = {
        id: `player${tournament.players.length + 1}`,
        username: `Player${tournament.players.length + 1}`,
        avatarUrl: 'https://via.placeholder.com/150',
        level: 1,
        wins: 0,
        losses: 0
    };

    tournament.players.push(newPlayer);

    if (tournament.players.length === tournament.maxPlayers) {
        tournament.status = 'in_progress';
        // Start matches here later
    }

    renderPlayers();
}