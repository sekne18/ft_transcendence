import { GameEngine } from "./GameEngine";
/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
export function initGame() : void { 
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    document.body.classList.add('disable-scroll');

    const gameParams = {
        paddle_offset: 15,
        paddle_gap: 2,
        paddle_w: 10,
        paddle_h: 50,
        paddle_maxa: 0.3,
        paddle_maxv: 1.0,
        ball_r: 5,
        ball_maxa: 1.0,
        ball_maxv: 0.5,
        ball_minv: 0.1,
        arena_w: 300,
        arena_h: 150,
        deadzone: 5,
        max_score: 5,
    };

    const renderDetails = {
        arena_color: "black",
        ball_color: "white",
        paddle_color: "yellow",
        max_canvas_width: 2500,
        canvas_margin: 32
    };
    const gameEngine = new GameEngine(canvas, gameParams, renderDetails);
    gameEngine.start();
}