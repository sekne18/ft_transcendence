import { GameInstance } from "./GameInstance";
import { GameRenderer } from "./GameRenderer";
import { PointerInputController } from "./PointerInputController";
/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
export function initGame() : void { 
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    document.body.classList.add('disable-scroll');
    const renderDetails = {
        arena_color: "black",
        ball_color: "white",
        paddle_color: "yellow",
    };
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
        arena_w: canvas.width,
        arena_h: canvas.height,
        deadzone: 5
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