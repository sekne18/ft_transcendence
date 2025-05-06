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

    resizeCanvas(canvas, gameParams);

    const renderDetails = {
        arena_color: "black",
        ball_color: "white",
        paddle_color: "yellow",
        size_ratio: canvas.width / gameParams.arena_w,
    };
    /*
    const game = new GameInstance(gameParams);
    const gameRenderer = new GameRenderer(canvas, gameParams, renderDetails, game.getState.bind(game));
    const inputController = new PointerInputController(canvas, gameParams, game.getState.bind(game), game.receiveInput.bind(game));
    inputController.start();
    game.startGame();
    const FPS = 120;
    const intervalId = setInterval(() => {
        game.updateState(1000 / FPS);
    }, 1000 / FPS); // 120 FPS
    const interval2Id = setInterval(() => {
        gameRenderer.render();
        inputController.update();
    }
    , 1000 / (FPS / 2)); // 60 FPS
    */
    const gameEngine = new GameEngine(canvas, gameParams, renderDetails);
    gameEngine.start();
}

function resizeCanvas(canvas: HTMLCanvasElement, gameParams: { arena_w: number; arena_h: number }, margin = 32): void {
    const gameContainer = document.getElementById('page-game') as HTMLDivElement;
    const dpr = window.devicePixelRatio || 1;

    // === Compute desired CSS size based on arena aspect ratio and screen ===
    const maxWidth = gameContainer.clientWidth - margin * 2;
    const maxHeight = gameContainer.clientHeight - margin * 2;
    const aspect = gameParams.arena_w / gameParams.arena_h;

    let cssWidth = maxWidth;
    let cssHeight = cssWidth / aspect;

    if (cssHeight > maxHeight) {
        cssHeight = maxHeight;
        cssWidth = cssHeight * aspect;
    }

    // === Set CSS size (display size in CSS pixels) ===
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    // === Set actual canvas size in physical pixels ===
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;

    canvas.style.margin = `${margin}px`;
}