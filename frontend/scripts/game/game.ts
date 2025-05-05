import { GameInstance } from "./GameInstance";
import { GameRenderer } from "./GameRenderer";
import { PointerInputController } from "./PointerInputController";
/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
export function initGame() : void { 
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const gameContainer = document.getElementById('page-game') as HTMLDivElement;
    document.body.classList.add('disable-scroll');

    //adjust pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const gameParams = {
        paddle_offset: 10,
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
        deadzone: 5
    };

    const renderDetails = {
        arena_color: "black",
        ball_color: "white",
        paddle_color: "yellow",
        size_ratio: canvas.width / gameParams.arena_w,
    };

    const game = new GameInstance(gameParams);
    const gameRenderer = new GameRenderer(canvas, gameParams, renderDetails, game.getState.bind(game));
    const inputController = new PointerInputController(canvas, gameParams, game.getState.bind(game), game.receiveInput.bind(game));
    inputController.start();
    game.startGame();
    const FPS = 60;
    const intervalId = setInterval(() => {
        game.updateState(1000 / FPS); // Assuming 60 FPS, deltaTime is ~0.016 seconds
        gameRenderer.render();
        inputController.update();
    }, 1000 / FPS); // 60 FPS

}