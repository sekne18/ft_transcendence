import { State } from "../state/State";
import { networkConfig } from "../wsConfig";
import { GameEngine } from "./GameEngine";
import { ExtraParams, GameParams } from "./GameTypes";
/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
export function initGame(): void {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    document.body.classList.add('disable-scroll');

    fetch('/api/game/params', {
        method: 'GET',
        credentials: 'include',
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const gameParams = data.params as GameParams;

            const renderDetails = {
                arena_color: "black",
                ball_color: "white",
                paddle_color: "yellow",
                max_canvas_width: 2000,
                canvas_margin: 32
            };

            const tournament = State.getState("tournament");
            const isTournament = tournament ? true : false;
            const lobby = State.getState("lobby");
            const isLobby = lobby ? true : false;

            const wsParams = {
                url: `${networkConfig.wsScheme}://${networkConfig.host}/api/${isTournament ? 
                `tournament/${tournament.id}` : (isLobby ?
                    `lobby/${lobby.id}` : "game")}/ws`,
            };

            const extraParams: ExtraParams = {
                type: isTournament ? "tournament" : (isLobby ? "lobby" : "game"),
                data: isTournament ? tournament : (isLobby ? lobby : null),
            }

            const gameEngine = new GameEngine(canvas, gameParams, renderDetails, wsParams, extraParams);
            gameEngine.start();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            // Handle error (e.g., show an error message to the user)
        });
}

