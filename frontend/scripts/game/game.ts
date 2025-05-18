import { State } from "../state/State";
import { wsConfig } from "../wsConfig";
import { GameEngine } from "./GameEngine";
import { GameParams } from "./GameTypes";
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

            console.log('Game parameters:', gameParams);

            const renderDetails = {
                arena_color: "black",
                ball_color: "white",
                paddle_color: "yellow",
                max_canvas_width: 2000,
                canvas_margin: 32
            };

            const tournament = State.getState("tournament");
            const isTournament = tournament ? true : false;

            const wsParams = {
                url: `${wsConfig.scheme}://${wsConfig.host}/api/${isTournament ? `tournament/${tournament.id}` : "game"}/ws`,
            };

            const gameEngine = new GameEngine(canvas, gameParams, renderDetails, wsParams, isTournament ? tournament : null);
            gameEngine.start();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            // Handle error (e.g., show an error message to the user)
        });
}

