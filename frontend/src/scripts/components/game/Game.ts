
export function Game() {

    const container = document.createElement("canvas");
    container.id = "game-canvas";

    const ctx = container.getContext("2d");
    ctx.fillStyle = "green";
    ctx.fillRect(10, 10, 100, 100);

    return container.outerHTML;
}