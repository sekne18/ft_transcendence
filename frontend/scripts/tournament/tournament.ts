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

