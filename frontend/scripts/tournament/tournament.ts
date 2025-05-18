import { showToast } from "../utils";
import { TournamentManager } from "./TournamentManager";

// --- Initialization ---
export function initTournament(): void {
    // Establish WebSocket connection
    document.body.classList.remove('disable-scroll');

    fetch('/api/user/profile').then(res => res.json()).then(data => {
        const tournamentConnection = new TournamentManager(data.user);
    }
    ).catch(err => {
        console.error('Error fetching user data:', err);
        showToast("Error", "Could not initialize tournament data.", "error");
    });
}

